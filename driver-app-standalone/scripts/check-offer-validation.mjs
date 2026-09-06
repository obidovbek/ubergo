/**
 * Executes the offer wizard's validation rules and asserts on them.
 * T-101 step 16a (`docs/PLAN-T101-step16.md`).
 *
 * Run: `node scripts/check-offer-validation.mjs`   (esbuild is already a dependency)
 *
 * 🔴 WHY THIS EXISTS. Step 16d collapses the 4-step wizard into the artboard's single
 * scrolling form. Today `handleSave` is safe only by accident: it validated
 * `validateStep(currentStep)` — ONE step — and the pagination guaranteed the other three had
 * already run on the way to the submit button. Remove the pagination and that guarantee is
 * gone, and an offer with no destination or a zero price saves without erroring.
 *
 * So `validateAll` has to be right BEFORE the restructure, and "right" has to mean something
 * an unrelated change can break. Hence assertions that run.
 *
 * ⚠️ WHY A SCRIPT AND NOT A TEST FILE. Neither RN app has a test runner (CLAUDE.md: only the
 * API has `npm test`), and adding one is a new dependency — rule 4, owner's call. This is the
 * same pattern steps 14 and 15 used: bundle the pure module with esbuild, execute it, assert.
 * If a runner is ever approved for this app, these cases port to it as-is.
 *
 * ✅ PROVEN ABLE TO FAIL — see the note at the bottom.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const out = path.join(root, 'node_modules', '.cache', 'check-offer-validation.mjs');
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(
  `npx esbuild utils/offerWizardValidation.ts --bundle --format=esm --platform=neutral ` +
    `--outfile="${out}" --log-level=error`,
  { cwd: root, stdio: 'inherit' },
);
const V = await import(pathToFileURL(out).href);
fs.rmSync(out, { force: true });

let failed = 0;
const check = (name, cond) => {
  if (!cond) {
    console.log(`  ✗ ${name}`);
    failed++;
  }
};

// A fixed clock, so "30 minutes from now" is not a moving target.
const NOW = new Date('2026-09-05T12:00:00.000Z');
const at = (mins) => new Date(NOW.getTime() + mins * 60_000).toISOString();

const noGeo = { country: null, province: null, city: null, cities: [] };
const city = (name) => ({ country: null, province: null, city: { name }, cities: [] });

/** A form that passes every rule; each case below breaks exactly one thing. */
const valid = () => ({
  form: {
    from_text: '',
    to_text: '',
    start_at: at(60),
    vehicle_id: 'veh-1',
    seats_total: 4,
    price_per_seat: 50000,
  },
  from: city("Farg'ona"),
  to: city('Toshkent'),
  now: NOW,
});
const withForm = (patch) => {
  const v = valid();
  return { ...v, form: { ...v.form, ...patch } };
};

// ---------------------------------------------------------------- the baseline
check('a complete form is valid', V.isValid(V.validateAll(valid())));

// ---------------------------------------------------------------- route
check(
  'missing FROM is caught',
  V.validateAll({ ...valid(), from: noGeo }).from_text === V.ERROR_KEYS.missing,
);
check(
  'missing TO is caught',
  V.validateAll({ ...valid(), to: noGeo }).to_text === V.ERROR_KEYS.missing,
);
check(
  'typed text satisfies the route',
  V.isValid(
    V.validateAll({ ...withForm({ from_text: 'Andijon', to_text: 'Namangan' }), from: noGeo, to: noGeo }),
  ),
);
check(
  'whitespace-only text does NOT satisfy the route',
  V.validateAll({ ...withForm({ from_text: '   ' }), from: noGeo }).from_text ===
    V.ERROR_KEYS.missing,
);
check(
  'a multi-select satisfies the route',
  V.isValid(
    V.validateAll({
      ...valid(),
      from: { country: null, province: null, city: null, cities: [{ name: 'A' }, { name: 'B' }] },
    }),
  ),
);

// ---------------------------------------------------------------- schedule
check(
  'a missing departure is caught',
  V.validateAll(withForm({ start_at: '' })).start_at === V.ERROR_KEYS.missing,
);
check(
  'a departure in the past is caught',
  V.validateAll(withForm({ start_at: at(-10) })).start_at === V.ERROR_KEYS.minAdvance,
);
check(
  'a departure 29 minutes out is caught (the 30-minute rule)',
  V.validateAll(withForm({ start_at: at(29) })).start_at === V.ERROR_KEYS.minAdvance,
);
check(
  'a departure 31 minutes out is accepted',
  V.isValid(V.validateAll(withForm({ start_at: at(31) }))),
);
// 🔴 The original code compared `new Date(bad) < minDate`, and every comparison against an
// Invalid Date is FALSE — so a malformed string passed validation and reached the API.
check(
  'an unparseable date is caught (the hole in the original)',
  V.validateAll(withForm({ start_at: 'not-a-date' })).start_at === V.ERROR_KEYS.missing,
);

// ---------------------------------------------------------------- vehicle, seats, price
check(
  'a missing vehicle is caught',
  V.validateAll(withForm({ vehicle_id: '' })).vehicle_id === V.ERROR_KEYS.missing,
);
check(
  '0 seats is caught',
  V.validateAll(withForm({ seats_total: 0 })).seats_total === V.ERROR_KEYS.invalidSeats,
);
check(
  '9 seats is caught (max 8)',
  V.validateAll(withForm({ seats_total: 9 })).seats_total === V.ERROR_KEYS.invalidSeats,
);
check('8 seats is accepted', V.isValid(V.validateAll(withForm({ seats_total: 8 }))));
check(
  'a price below 5 000 is caught',
  V.validateAll(withForm({ price_per_seat: 4999 })).price_per_seat === V.ERROR_KEYS.invalidPrice,
);
check('a price of exactly 5 000 is accepted', V.isValid(V.validateAll(withForm({ price_per_seat: 5000 }))));

// ---------------------------------------------------------------- 🛑 THE POINT OF THE CARD
// Each of these is a form that the OLD submit would have saved, because the driver was
// standing on a step whose own rules happened to pass.
check(
  'submit rejects a form whose ROUTE is empty (step 3 alone would pass)',
  !V.isValid(V.validateAll({ ...valid(), from: noGeo, to: noGeo })),
);
check(
  'submit rejects a form whose DEPARTURE is missing (step 3 alone would pass)',
  !V.isValid(V.validateAll(withForm({ start_at: '' }))),
);
check(
  'submit rejects a form whose PRICE is zero (step 1 alone would pass)',
  !V.isValid(V.validateAll(withForm({ price_per_seat: 0 }))),
);
check(
  'validateAll reports EVERY broken section at once, not just the first',
  Object.keys(
    V.validateAll({ ...withForm({ start_at: '', price_per_seat: 0 }), from: noGeo, to: noGeo }),
  ).length === 4,
);

// ---------------------------------------------------------------- validateAll ⊇ every step
// Structural, not by example: whatever any single step rejects, submit must also reject.
const CASES = [
  { ...valid(), from: noGeo },
  { ...valid(), to: noGeo },
  withForm({ start_at: '' }),
  withForm({ start_at: at(5) }),
  withForm({ vehicle_id: '' }),
  withForm({ seats_total: 0 }),
  withForm({ price_per_seat: 1 }),
];
for (const input of CASES) {
  for (let step = 1; step <= V.SECTION_VALIDATORS.length; step++) {
    const stepErrors = V.validateStepNumber(step, input);
    const allErrors = V.validateAll(input);
    for (const field of Object.keys(stepErrors)) {
      check(
        `validateAll is a superset of step ${step} (field ${field})`,
        allErrors[field] === stepErrors[field],
      );
    }
  }
}

// ---------------------------------------------------------------- buildLocationText
check(
  'buildLocationText orders city, province, country',
  V.buildLocationText({ name: 'UZ' }, { name: 'Prov' }, { name: 'City' }) === 'City, Prov, UZ',
);
check('buildLocationText on nothing is empty', V.buildLocationText(null, null, null) === '');

// ================================================================================
// T-101 step 16b — the field rules that moved out of the screen's JSX.
// ================================================================================

// ---------------------------------------------------------------- parseAmount
check('parseAmount reads a grouped number', V.parseAmount('120 000') === 120000);
check('parseAmount strips non-digits', V.parseAmount('12a3') === 123);
check('parseAmount on empty is undefined', V.parseAmount('') === undefined);
// 🔴 The whole point of `undefined` over `0`: they mean different things downstream.
check('parseAmount on punctuation only is undefined', V.parseAmount('---') === undefined);
check('parseAmount keeps a typed zero', V.parseAmount('0') === 0);

// ---------------------------------------------------------------- formatAmount
check('formatAmount groups thousands', V.formatAmount(120000) === '120 000');
check('formatAmount leaves small numbers alone', V.formatAmount(999) === '999');
check('formatAmount on undefined is empty', V.formatAmount(undefined) === '');
// 🔴 NOT '' — a field holding a real 0 must render it, or the driver sees a blank
// box where they typed "free" and types it again.
check('formatAmount renders a real zero', V.formatAmount(0) === '0');

// ---------------------------------------------------------------- normalizeAmount
// The rule T-078 paid for: `0` is an answer for some fields and a blank for others.
check('normalizeAmount keeps 0 when allowed', V.normalizeAmount(0, { allowZero: true }) === 0);
check('normalizeAmount drops 0 when not allowed', V.normalizeAmount(0) === undefined);
check('normalizeAmount keeps a real price', V.normalizeAmount(120000) === 120000);
check('normalizeAmount passes undefined through', V.normalizeAmount(undefined) === undefined);
check('normalizeAmount rejects NaN', V.normalizeAmount(NaN) === undefined);
// The deliberate departure documented on the function: a negative is corrupt data,
// and "not set" is the safe reading of it — never "free".
check('normalizeAmount refuses a negative price', V.normalizeAmount(-5) === undefined);
check(
  'normalizeAmount clamps a negative to 0 where 0 is an answer',
  V.normalizeAmount(-5, { allowZero: true }) === 0,
);

// ---------------------------------------------------------------- clampSeats
check('clampSeats floors an empty field at 1', V.clampSeats(undefined) === V.RULES.minSeats);
check('clampSeats floors 0 at 1', V.clampSeats(0) === V.RULES.minSeats);
check('clampSeats floors NaN at 1', V.clampSeats(NaN) === V.RULES.minSeats);
check('clampSeats caps at maxSeats', V.clampSeats(99) === V.RULES.maxSeats);
check('clampSeats leaves a legal count alone', V.clampSeats(4) === 4);
// 🛑 The control must not be able to leave a value its own validator would refuse.
for (const typed of [undefined, 0, -3, 1, 4, 8, 9, 99, NaN]) {
  const seats = V.clampSeats(typed);
  const errors = V.validateVehicleAndPrice(
    withForm({ seats_total: seats, vehicle_id: 'v1', price_per_seat: 50000 }),
  );
  check(`clampSeats(${String(typed)}) survives validateVehicleAndPrice`, !errors.seats_total);
}

// ---------------------------------------------------------------- resolveEndpointSelection
const CITY_A = { id: 1, name: 'Fargʻona t.', latitude: 40.38, longitude: 71.78 };
const CITY_B = { id: 2, name: 'Margʻilon sh.', latitude: 40.47, longitude: 71.72 };
const COUNTRY = { name: 'Oʻzbekiston' };
const PROVINCE = { name: 'Fargʻona viloyati' };

const none = V.resolveEndpointSelection([], COUNTRY, PROVINCE);
check('endpoint with no cities clears the text', none.text === '');
check('endpoint with no cities clears the city', none.city === null);
// 🔴 The failure this guards: coordinates left behind by a removed city, still sent
// to the API and pointing the passenger at a city no longer in the offer.
check('endpoint with no cities clears lat', none.lat === undefined);
check('endpoint with no cities clears lng', none.lng === undefined);

const one = V.resolveEndpointSelection([CITY_A], COUNTRY, PROVINCE);
check('endpoint with one city collapses to the single form', one.city === CITY_A);
check(
  'endpoint with one city writes the full location text',
  one.text === 'Fargʻona t., Fargʻona viloyati, Oʻzbekiston',
);
check('endpoint with one city carries its coordinates', one.lat === CITY_A.latitude && one.lng === CITY_A.longitude);

const many = V.resolveEndpointSelection([CITY_A, CITY_B], COUNTRY, PROVINCE);
check('endpoint with several cities has no single city', many.city === null);
check('endpoint with several cities lists their names', many.text === 'Fargʻona t., Margʻilon sh.');
// The app's own convention, taken from `confirmMultipleFromCities` — the FIRST city is
// the primary point. Asserted here so the remove path can never disagree with it again.
check('endpoint with several cities uses the first coordinates', many.lat === CITY_A.latitude);
check('endpoint with several cities uses the first longitude', many.lng === CITY_A.longitude);

// A city with no coordinates must yield `undefined`, never `null` — the API client
// omits undefined and would send an explicit null.
const noCoords = V.resolveEndpointSelection([{ id: 3, name: 'X' }], null, null);
check('endpoint without coordinates yields undefined lat', noCoords.lat === undefined);
check('endpoint without coordinates yields undefined lng', noCoords.lng === undefined);

if (failed) {
  console.log(`\n✗ ${failed} offer-validation assertion(s) failed.`);
  process.exit(1);
}
console.log(
  '✓ offer validation: all assertions pass ' +
    '(route · schedule · vehicle · submit · amounts · seats · endpoints)',
);

/**
 * ✅ PROVEN ABLE TO FAIL — T-101 step 16a. Each mutation applied to
 * `utils/offerWizardValidation.ts` in turn, then reverted:
 *
 *   validateAll returns only validateRoute(input)   -> red (submit-superset cases)
 *   RULES.minAdvanceMs  30 min -> 0                 -> red (the 29-minute case)
 *   RULES.maxSeats      8 -> 99                     -> red (the 9-seat case)
 *   RULES.minPricePerSeat 5000 -> 0                 -> red (the 4 999 case)
 *   the Number.isNaN guard deleted                  -> red (the unparseable-date case)
 *
 * ✅ AND AGAIN FOR STEP 16b's rules, same method, each reverted:
 *
 *   normalizeAmount ignores `allowZero`             -> 1 red  (a free pickup lost)
 *   normalizeAmount returns a negative unchanged    -> 2 red
 *   clampSeats stops capping at maxSeats            -> 3 red  (incl. the cross-check
 *                                                     that its output must pass
 *                                                     validateVehicleAndPrice)
 *   resolveEndpointSelection drops multi-city coords-> 2 red  (the remove path
 *                                                     disagreeing with confirm)
 *   formatAmount blanks a real 0                    -> 1 red
 *   parseAmount turns an empty field into 0         -> 2 red
 *
 * A checker that cannot go red proves nothing.
 */
