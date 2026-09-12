/**
 * Checks that every i18n key the offer wizard uses resolves in all three locales.
 * T-101 step 16f (driver app). The wizard is the app's largest screen and its keys reach
 * `t()` three ways — inline in the screen, through a ternary, and as KEYS RETURNED BY THE
 * PURE RULE MODULES (`utils/offerWizardValidation.ts`, `utils/offerSchedule.ts`), so the
 * sweep is a list of (file, prefix) pairs, not one file.
 *
 * Run: `node scripts/check-offer-i18n.mjs`   (needs esbuild, already a dependency)
 *
 * 🔴 WHY THIS EXISTS. A missing key renders THE KEY ITSELF (`offerWizard.errorMinAdvance`)
 * and only on the locale nobody is testing in. Steps 16b-16d each ran a throwaway probe for
 * this; the plan said to make it a real checker rather than re-type it a fourth time.
 *
 * 🔴 IT EVALUATES THE TRANSLATIONS, IT DOES NOT GREP THEM — the real `translations/index.ts`
 * is bundled with esbuild and the keys are looked up as values. A block regex cannot see
 * nesting (`check-drawer.mjs`'s first draft reported all 21 keys missing for that reason).
 *
 * 🔴 AND IT MATCHES EVERY `prefix.*` STRING LITERAL, NOT ONLY `t('…')` CALLS. The user app's
 * step-9 checker anchored on `t('` and silently skipped labels that reach `t()` through a
 * ternary; breaking one left it green. Here the rule modules never call `t()` at all — they
 * return the key — so a `t('`-anchored pattern would miss the six error keys entirely.
 *
 * ✅ PROVEN ABLE TO FAIL — see the note at the bottom.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

/*
 * Each entry: a source file and the key prefixes it may use. The wizard's section
 * components (`components/offerWizard/*`) take their labels as props from the screen and
 * call no `t()` themselves (grep-verified 2026-09-11), so the screen covers them.
 */
const TARGETS = [
  ['screens/OfferWizardScreen.tsx', ['offerWizard', 'common', 'errors']],
  ['utils/offerWizardValidation.ts', ['offerWizard']],
  ['utils/offerSchedule.ts', ['offerWizard']],
  // T-101 step 17: the passenger-orders screen. The rules module returns keys under the
  // existing prefixes; the card adds `passengerOrders.*`.
  ['utils/passengerOrders.ts', ['passengerOfferExtras', 'passengerOfferDetails', 'myJoinRequests']],
  // T-101 step 18: the rides screen. The rules module returns `myRides.*` and reuses
  // `offerPassengers.*` / `driverOffers.*`; 18c-18d add the components and the screen here.
  ['utils/myRides.ts', ['myRides', 'offerPassengers', 'driverOffers']],
  ['components/rides/MyRideCard.tsx', ['myRides', 'driverOffers']],
  ['components/rides/BookingRow.tsx', ['myRides', 'offerPassengers']],
  ['components/rides/BookingSheet.tsx', ['myRides', 'offerPassengers', 'driverOffers', 'common']],
  ['components/rides/RejectReasonSheet.tsx', ['myRides', 'offerPassengers', 'common']],
  ['screens/MyRidesScreen.tsx', ['myRides', 'offerPassengers', 'driverOffers', 'common', 'errors']],
  ['components/offers/PassengerOrderCard.tsx', ['passengerOrders', 'passengerOfferExtras', 'myJoinRequests']],
  [
    'screens/PassengerOrdersScreen.tsx',
    ['passengerOrders', 'searchPassengerOffers', 'myJoinRequests', 'errors', 'common', 'drawer'],
  ],
  [
    'components/offers/PassengerOrderSheet.tsx',
    ['passengerOrders', 'passengerOfferExtras', 'passengerOfferDetails', 'myJoinRequests', 'common'],
  ],
  ['components/offers/OrderResultSheet.tsx', ['passengerOrders', 'passengerOfferDetails']],
  // 17h: the own-offers list — its status-tab labels are literal keys now, so they are swept.
  ['screens/OffersListScreen.tsx', ['driverOffers', 'common']],
];

// Bundle and evaluate the real translations. The filename carries a timestamp so a stale
// bundle from an earlier run can never be re-imported and mask the change under test.
const out = path.join(root, 'node_modules', '.cache', `check-offer-i18n.${Date.now()}.mjs`);
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(
  `npx esbuild translations/index.ts --bundle --format=esm --platform=neutral ` +
    `--outfile="${out}" --log-level=error`,
  { cwd: root, stdio: 'inherit' },
);
const translations = (await import(pathToFileURL(out).href)).default;
fs.rmSync(out, { force: true });

const keys = [];
for (const [file, prefixes] of TARGETS) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  for (const prefix of prefixes) {
    // `[.]` not a backslash-dot: the shell that writes these files halves backslashes, and an
    // unescaped dot would match `offerWizardXfoo` as a phantom key (the step-11 trap).
    const re = new RegExp(`'(${prefix}[.][A-Za-z0-9_]+)'`, 'g');
    for (const m of src.matchAll(re)) if (!keys.includes(m[1])) keys.push(m[1]);
  }
}

const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
let bad = 0;
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
  console.log(`\n✗ ${bad} unresolved offer-wizard key(s).`);
  process.exit(1);
}
console.log(
  `✓ offer i18n: ${keys.length} keys x 3 locales resolve (${keys.length * 3} lookups) ` +
    `across ${TARGETS.length} files`,
);

/**
 * ✅ PROVEN ABLE TO FAIL — T-101 step 16f, 2026-09-11. `errorMinAdvance` renamed in
 * `translations/uz.ts` (a key that reaches the screen ONLY as a value returned from
 * `utils/offerSchedule.ts` — the case a `t('`-anchored pattern misses) ->
 * `MISSING KEY uz offerWizard.errorMinAdvance`, exit 1; restored, `git diff` clean -> green.
 */
