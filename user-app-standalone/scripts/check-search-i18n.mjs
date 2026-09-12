/**
 * Checks that every i18n key the search screen and its parts use resolves in all three locales.
 * T-101 step 14b-6.
 *
 * Run: `node scripts/check-search-i18n.mjs`   (needs esbuild, already a dependency)
 *
 * 🔴 WHY THIS EXISTS, AND IT IS NOT HYPOTHETICAL. Step 14b shipped TWO namespace mistakes that
 * nothing else could see:
 *   • `bidLabelKey` returned `myJoinRequests.status_*` — the DRIVER app's namespace, absent
 *     here entirely, so every bid pill would have rendered its own key as text;
 *   • `common.all`, `searchOffers.fromLabel` and `searchOffers.toLabel` existed only in the
 *     driver app and were used here from the first draft.
 * A missing key renders THE KEY ITSELF, in every locale at once, and **`tsc` cannot see a
 * translation key**. Only evaluating them can.
 *
 * 🔴 IT EVALUATES THE TRANSLATIONS, IT DOES NOT GREP THEM — the real `translations/index.ts`
 * is bundled with esbuild and each key is looked up as a value. A block regex cannot see
 * nesting (the 2026-08-30 failure).
 *
 * 🔴 AND IT MATCHES EVERY `prefix.*` STRING LITERAL, NOT ONLY `t('…')` CALLS. The rules module
 * never calls `t()` at all — it RETURNS keys — so a `t('`-anchored pattern would miss them.
 *
 * ⚠️ No backslash appears in this file on purpose — the shell this session writes through
 * halves them (the 16f lesson). Regexes use character classes instead.
 *
 * ✅ PROVEN ABLE TO FAIL — see the note at the bottom.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

/** Each entry: a source file and the key prefixes it may legitimately use. */
const TARGETS = [
  ['utils/offerSearch.ts', ['searchOffers', 'passengerOffers', 'offerDrivers']],
  ['components/search/OfferResultCard.tsx', ['searchOffers', 'offerDrivers', 'offerDetails']],
  ['components/search/DriverBlock.tsx', ['searchOffers', 'offerDrivers', 'common']],
  [
    'screens/SearchOffersScreen.tsx',
    ['searchOffers', 'offerDrivers', 'offerDetails', 'common', 'errors', 'drawer'],
  ],
];

const out = path.join(root, 'node_modules', '.cache', `check-search-i18n.${Date.now()}.mjs`);
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(
  `npx esbuild translations/index.ts --bundle --format=esm --platform=neutral ` +
    `--outfile="${out}" --log-level=error`,
  { cwd: root, stdio: 'inherit' },
);
const mod = await import(pathToFileURL(out).href);
fs.rmSync(out, { force: true });
const all = mod.translations || mod.default;
const locales = Object.keys(all);

/*
 * A key is `prefix.someName`, optionally nested one level deeper. Built without backslashes:
 * character classes only. Template literals (`offerDrivers.status_${x}`) cannot be resolved
 * statically, so a prefix used ONLY that way is covered by the rules module's own checker.
 */
const keyPattern = (prefix) => new RegExp(`${prefix}[.][A-Za-z0-9_.]+`, 'g');

/*
 * Keys built by a template (`offerDrivers.status_${x}`) cannot be resolved statically: the
 * scan sees the stub `offerDrivers.status_`. Dropping the stub alone would lose the coverage,
 * so every value the template can produce is listed here and checked explicitly. The list is
 * the `OfferDriver.status` union in `api/passengerOffers.ts`.
 */
const TEMPLATE_KEYS = [
  'offerDrivers.status_pending',
  'offerDrivers.status_confirmed',
  'offerDrivers.status_rejected',
  'offerDrivers.status_cancelled',
];

const found = new Map(); // key -> the file that used it
for (const key of TEMPLATE_KEYS) found.set(key, 'utils/offerSearch.ts (template)');
for (const [file, prefixes] of TARGETS) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  for (const prefix of prefixes) {
    const matches = src.match(keyPattern(prefix)) || [];
    for (const raw of matches) {
      // Trim a trailing dot picked up from prose, and skip bare prefixes.
      const key = raw.replace(/[.]+$/, '');
      if (key.split('.').length < 2) continue;
      // A template stub, e.g. `offerDrivers.status_` — its real values are in TEMPLATE_KEYS.
      if (key.endsWith('_')) continue;
      if (!found.has(key)) found.set(key, file);
    }
  }
}

let missing = 0;
let checked = 0;
for (const [key, file] of found) {
  for (const loc of locales) {
    checked++;
    const val = key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), all[loc]);
    if (typeof val !== 'string' || val.length === 0) {
      console.log(`  MISSING KEY   ${loc}  ${key}  (used in ${file})`);
      missing++;
    }
  }
}

if (missing) {
  console.log(`\n✗ search i18n: ${missing} of ${checked} lookups failed`);
  process.exit(1);
}
console.log(
  `✓ search i18n: ${found.size} keys x ${locales.length} locales resolve (${checked} lookups) across ${TARGETS.length} files`,
);

/**
 * ✅ PROVEN ABLE TO FAIL — T-101 step 14b-6, 2026-09-12. One key removed per locale, the
 * checker run, the file restored from a pristine copy and byte-compared. The list is in
 * `docs/PLAN-T101-step14b.md` §7.
 *
 * ⚠️ These locale files are CRLF. A prover whose anchors end in a bare newline matches NOTHING
 * and reads as a pass — it happened twice this session before the anchors were normalised.
 */
