/**
 * Checks that every i18n key the T-101 screens use resolves in all three locales.
 * Started at step 9 for `myOrders.*`; step 11 added the drawer and the notification
 * panel, so it now sweeps a LIST of (file, prefix) pairs.
 *
 * Run: `node scripts/check-i18n-myorders.mjs`  (plain node + esbuild, no new dependency)
 *
 * ⚠️ It EVALUATES the real `translations/index.ts` (bundled with esbuild) rather than
 * grepping it — the 2026-08-30 lesson: a checker holding its own copy of the data, or
 * merely pattern-matching the source, passes while the app is broken.
 *
 * 🔴 AND THE FIRST VERSION OF THIS FILE WAS EXACTLY THAT BUG. It extracted keys with a
 * pattern anchored on a literal `t('...')` call, so it silently skipped the three MODE
 * labels, which reach `t()` through a ternary. Breaking `modeAktiv` on purpose left it
 * GREEN — a checker that cannot go red proves nothing. It now matches every `myOrders.*`
 * string literal in the screen however it is passed, which is what made it fail properly.
 *
 * ⚠️ The bundle filename carries a timestamp. An earlier fixed name let a stale bundle
 * from a previous run be re-imported, which masks exactly the change you are testing.
 *
 * ✅ PROVEN ABLE TO FAIL: renaming `modeAktiv` in `uz.ts` -> `FAIL uz myOrders.modeAktiv`,
 * exit 1; restored -> 19 keys x 3 locales green.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const bundle = path.join(root, `.i18n-check.${Date.now()}.mjs`);

execFileSync(
  'npx',
  [
    'esbuild',
    path.join(root, 'translations', 'index.ts'),
    '--bundle',
    '--format=esm',
    `--outfile=${bundle}`,
  ],
  { stdio: 'pipe', shell: true },
);

const mod = await import(`file://${bundle}`);
fs.unlinkSync(bundle);
const tr = mod.translations ?? mod.default;

/*
 * Each entry: the source file, and the key prefix it owns. The pattern matches every
 * `prefix.*` string literal in the file, however it reaches `t()` — see the note above
 * about the mode labels that a `t('...')`-anchored pattern silently skipped.
 */
const TARGETS = [
  ['screens/MyOrdersScreen.tsx', 'myOrders'],
  ['components/chrome/NavDrawer.tsx', 'drawer'],
  ['screens/NotificationsScreen.tsx', 'notifications'],
  ['screens/ProfileScreen.tsx', 'profile'],
];

const keys = [];
for (const [file, prefix] of TARGETS) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  const re = new RegExp(`'(${prefix}\\.[a-zA-Z]+)'`, 'g');
  for (const m of src.matchAll(re)) if (!keys.includes(m[1])) keys.push(m[1]);
}

let bad = 0;
for (const lang of ['uz', 'ru', 'en']) {
  for (const k of keys) {
    const value = k.split('.').reduce((o, p) => o?.[p], tr[lang]);
    if (typeof value !== 'string' || value.length === 0) {
      bad++;
      console.log(`FAIL ${lang} ${k} -> ${JSON.stringify(value)}`);
    }
  }
}

console.log(
  bad === 0
    ? `✓ ${keys.length} keys x 3 locales resolve (${keys.length * 3} lookups)`
    : `✗ ${bad} unresolved`,
);
process.exit(bad ? 1 : 0);
