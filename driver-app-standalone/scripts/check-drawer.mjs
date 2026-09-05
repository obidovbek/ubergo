/**
 * Fails when the NavDrawer points at a route that cannot be navigated to, or shows a label
 * that has no translation. T-101 step 15 (driver app).
 *
 * Run: `node scripts/check-drawer.mjs`   (needs esbuild, already a dependency — no new dep)
 *
 * 🔴 WHY THIS EXISTS. The drawer is a table of 21 labels and 10 routes, and BOTH halves fail
 * silently:
 *   • A wrong route name is not a type error at the call site — `navigate()` is typed, but
 *     the NAV table is data, so a typo or a renamed screen surfaces only as a dead tap.
 *   • A missing translation key renders THE KEY ITSELF (`drawer.docsLicense`) — visible, but
 *     only on the locale nobody is testing in.
 *
 * 🔴 AND IT CHECKS THE ROUTE'S SHAPE, NOT JUST ITS NAME. An entry pointing at a screen that
 * needs params (`OfferPassengers`, `PassengerOfferDetails`) would compile if the table were
 * loosely typed and then crash on tap. `ParamlessRoute` already prevents this in TypeScript;
 * this re-checks it against the param list so the guarantee survives a refactor of the type.
 *
 * 🔴 IT EVALUATES THE TRANSLATIONS, IT DOES NOT GREP THEM. The first version of this check
 * matched a `drawer: { … }` block with a regex and reported ALL 21 keys missing in all three
 * locales — the block regex stopped at the first nested `},`. A grep cannot see nesting.
 * So the real modules are bundled with esbuild and the keys are looked up as values.
 * *This is the same trap step 14's i18n checker hit, in a new disguise.*
 *
 * ✅ PROVEN ABLE TO FAIL — see the note at the bottom.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const nav = read('components/chrome/NavDrawer.tsx');
const types = read('navigation/types.ts');

let bad = 0;

// ---------------------------------------------------------------- routes
const routes = [...nav.matchAll(/route:\s*'([A-Za-z]+)'/g)].map((m) => m[1]);
const block = types.match(/MainStackParamList = \{([\s\S]*?)\n\};/)[1];
const entries = [...block.matchAll(/^\s*([A-Za-z]+)\s*:\s*([^;]+);/gm)];
const declared = entries.map((m) => m[1]);
// A route is navigable with no params when `undefined` is part of its param type.
const paramless = new Set(entries.filter((m) => /undefined/.test(m[2])).map((m) => m[1]));

for (const r of routes) {
  if (!declared.includes(r)) {
    console.log(`  MISSING ROUTE   ${r} — not in MainStackParamList`);
    bad++;
  } else if (!paramless.has(r)) {
    console.log(`  NEEDS PARAMS    ${r} — cannot be opened from a menu entry`);
    bad++;
  }
}

// ---------------------------------------------------------------- i18n
const out = path.join(root, 'node_modules', '.cache', 'check-drawer.translations.mjs');
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(
  `npx esbuild translations/index.ts --bundle --format=esm --platform=neutral ` +
    `--outfile="${out}" --log-level=error`,
  { cwd: root, stdio: 'inherit' },
);
const translations = (await import(pathToFileURL(out).href)).default;
fs.rmSync(out, { force: true });

const keys = [
  ...new Set([
    ...[...nav.matchAll(/t\('(drawer\.[A-Za-z]+)'\)/g)].map((m) => m[1]),
    ...[...nav.matchAll(/labelKey:\s*'(drawer\.[A-Za-z]+)'/g)].map((m) => m[1]),
  ]),
];
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

for (const loc of ['uz', 'en', 'ru']) {
  for (const k of keys) {
    const v = get(translations[loc], k);
    if (typeof v !== 'string' || !v.trim()) {
      console.log(`  MISSING KEY     ${loc}  ${k}  -> ${JSON.stringify(v)}`);
      bad++;
    }
  }
}

if (bad) {
  console.log(`\n✗ ${bad} problem(s) in the drawer.`);
  process.exit(1);
}
console.log(
  `✓ drawer: ${routes.length} routes valid and paramless; ` +
    `${keys.length} keys resolve to strings in uz/en/ru`,
);

/**
 * ✅ PROVEN ABLE TO FAIL — T-101 step 15, three probes, each reverted after:
 *
 *   route: 'Profile'      -> 'OfferPassengers'   ->  NEEDS PARAMS, exit 1
 *   route: 'OffersList'   -> 'NoSuchScreen'      ->  MISSING ROUTE, exit 1
 *   deleted `docsLicense` from translations/uz.ts ->  MISSING KEY uz, exit 1
 *
 * The third is the one that matters: it is a NESTED key, and the grep-based first draft of
 * this script passed it while reporting 63 phantom failures elsewhere.
 */
