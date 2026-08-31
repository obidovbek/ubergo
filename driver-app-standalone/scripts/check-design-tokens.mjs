#!/usr/bin/env node
/**
 * check-design-tokens.mjs — T-101 step 1c.
 *
 * Counts raw colour literals in screens/ and components/ and FAILS if the total rises
 * above the recorded ceiling. The ceiling only ever moves DOWN: each converted screen
 * lowers it, so a later change cannot quietly re-introduce hardcoded colours.
 *
 * Why this exists: the apps' real design system was never `themes/` — it was 1652
 * hardcoded hex literals across both apps (154 distinct values, mostly raw Tailwind
 * defaults). Repainting screens without a ratchet just swaps old literals for new
 * ones. See docs/DESIGN-TOKENS.md.
 *
 *   node scripts/check-design-tokens.mjs            # check against the ceiling
 *   node scripts/check-design-tokens.mjs --report   # per-file breakdown, worst first
 *   node scripts/check-design-tokens.mjs --set      # rewrite the ceiling to today's count
 *
 * No dependencies — plain node, so it runs anywhere the app builds.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CEILING_FILE = join(ROOT, 'scripts', 'design-token-ceiling.json');

/** Directories whose files must eventually read every colour from `themes/`. */
const SCANNED = ['screens', 'components', 'sections', 'layout', 'navigation'];

/**
 * `themes/` is deliberately NOT scanned — it is where the literals are SUPPOSED to
 * live. Anything else listed here is a considered exemption, not an oversight.
 */
const EXEMPT = [
  /^themes[\\/]/,
  /node_modules/,
  /\.test\.tsx?$/,
];

/**
 * What counts as a raw colour literal:
 *   #RGB #RGBA #RRGGBB #RRGGBBAA   — hex in any form
 *   rgb(...) / rgba(...)           — functional notation
 *   hsl(...) / hsla(...)
 * Deliberately NOT counted: named CSS colours ('red', 'white'). They are rare here and
 * matching them produces false positives on ordinary words. Revisit if that changes.
 */
const COLOR = /#[0-9A-Fa-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/g;

const walk = (dir) => {
  let out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const full = join(dir, e);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) out = out.concat(walk(full));
    else if (/\.(tsx?|jsx?)$/.test(e)) out.push(full);
  }
  return out;
};

const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const files = SCANNED.flatMap((d) => walk(join(ROOT, d)))
  .map((f) => relative(ROOT, f))
  .filter((f) => !EXEMPT.some((re) => re.test(f)))
  .sort();

const counts = new Map();
let total = 0;
for (const f of files) {
  const src = stripComments(readFileSync(join(ROOT, f), 'utf8'));
  const n = (src.match(COLOR) || []).length;
  if (n > 0) counts.set(f, n);
  total += n;
}

const args = process.argv.slice(2);

if (args.includes('--report')) {
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`Raw colour literals by file (${rows.length} files, ${total} total)\n`);
  for (const [f, n] of rows) console.log(String(n).padStart(5), f);
  console.log(`\nTOTAL ${total}`);
  process.exit(0);
}

if (args.includes('--set')) {
  writeFileSync(
    CEILING_FILE,
    JSON.stringify({ ceiling: total, note: 'T-101: only ever lower this.' }, null, 2) + '\n',
  );
  console.log(`Ceiling set to ${total}.`);
  process.exit(0);
}

let ceiling;
try {
  ceiling = JSON.parse(readFileSync(CEILING_FILE, 'utf8')).ceiling;
} catch {
  console.error(`No ceiling recorded. Run:  node scripts/check-design-tokens.mjs --set`);
  process.exit(2);
}

if (total > ceiling) {
  console.error(
    `\n✗ Raw colour literals ROSE: ${total} (ceiling ${ceiling}, +${total - ceiling}).\n` +
    `  Colours belong in themes/. Run --report to see which files.\n`,
  );
  process.exit(1);
}

if (total < ceiling) {
  console.log(
    `\n✓ ${total} raw colour literals — DOWN ${ceiling - total} from the ceiling of ${ceiling}.\n` +
    `  Lower the ceiling to lock the progress in:  node scripts/check-design-tokens.mjs --set\n`,
  );
  process.exit(0);
}

console.log(`✓ ${total} raw colour literals, at the ceiling of ${ceiling}.`);
