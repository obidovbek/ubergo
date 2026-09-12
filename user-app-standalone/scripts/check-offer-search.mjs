/**
 * Executes the offer-search rules (`utils/offerSearch.ts`) and asserts on them.
 * T-101 step 14b-1 (`docs/PLAN-T101-step14b.md`).
 *
 * Run: `node scripts/check-offer-search.mjs`  (plain node + esbuild, no new dependency)
 *
 * 🔴 WHY THIS EXISTS. Step 14b merges the offer search and the driver-bids list into one
 * screen with two modes, and rebuilds a 1 634-line file. Nothing in `tsc`, ESLint or the token
 * ratchet can see an offer priced from the wrong field, an unrated driver rendered as 0,0, or
 * a sort chip that silently reorders under a different rule. Only cases can.
 *
 * The rules most worth pinning are the ones that would re-introduce a defect this project has
 * already paid for:
 *
 *   • DECIMAL arrives from pg as a STRING (the 2026-08-02 root cause) — `money()` is the one
 *     coercion point, and an unusable price must be `null`, never `0`;
 *   • an unrated driver must NOT render as `0,0`, which reads as a terrible driver;
 *   • `match` and `seats` have no server twin, so `serverSortFor` must return `undefined`
 *     rather than quietly substituting `date_asc`.
 *
 * ⚠️ This IMPORTS the real module rather than re-implementing it — a checker holding its own
 * copy passes while the app is broken (the 2026-08-30 failure).
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

const out = path.join(root, 'node_modules', '.cache', `check-offer-search.${Date.now()}.mjs`);
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(
  `npx esbuild utils/offerSearch.ts --bundle --format=esm --platform=neutral ` +
    `--outfile="${out}" --log-level=error`,
  { cwd: root, stdio: 'inherit' },
);
const R = await import(pathToFileURL(out).href);
fs.rmSync(out, { force: true });

let failed = 0;
let total = 0;
const check = (name, cond) => {
  total++;
  if (!cond) {
    console.log(`  ✗ ${name}`);
    failed++;
  }
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ------------------------------------------------------------------ fixtures
const offer = (over = {}) => ({
  id: 1,
  start_at: '2026-09-20T09:30:00.000Z',
  seats_free: 3,
  back_seats_free: 2,
  front_offered: true,
  front_seat_available: true,
  price_per_seat: '120000.00',
  front_price_per_seat: '150000.00',
  price_back_salon: null,
  price_whole_salon: null,
  vehicle_class: 'standart',
  driver: { id: 9, name: 'A', rating: 4.3, rating_count: 12 },
  vehicle: { fuel_types: ['propan'] },
  ...over,
});
const sortState = (over = {}) => ({ key: 'match', priceDesc: false, seatsAsc: false, ...over });

// ------------------------------------------------------------------ money
check('money: number passes through', R.money(150000) === 150000);
check('money: DECIMAL string is coerced', R.money('150000.00') === 150000);
check('money: spaced string is coerced', R.money('150 000') === 150000);
check('money: null is null, NOT 0', R.money(null) === null);
check('money: garbage is null, NOT 0', R.money('abc') === null);
check('money: empty string is null', R.money('') === null);
check('money: a real zero survives as 0', R.money(0) === 0);
// 🔴 These two reach the FINAL return. Every other bad-input case above is caught by the
// early empty-string guard, so without them the mutation "return 0 instead of null" stayed
// GREEN — the null-not-zero rule was never actually pinned.
check('money: a malformed number reaches the last guard and is null', R.money('1.2.3') === null);
check('money: a double sign is null, not 0', R.money('--5') === null);

// ------------------------------------------------------------------ seats
check('needed: no saved order -> 1', R.neededSeats(null) === 1);
check('needed: whole salon -> 4', R.neededSeats({ seatPref: 'whole' }) === 4);
check('needed: back salon -> 3', R.neededSeats({ seatPref: 'backSalon' }) === 3);
check('needed: front + back', R.neededSeats({ seatPref: 'both', seats: { front: 1, back: 2 } }) === 3);
check('needed: never below 1', R.neededSeats({ seatPref: 'both', seats: { front: 0, back: 0 } }) === 1);
check('needed: junk seat counts still give 1', R.neededSeats({ seats: { front: null, back: undefined } }) === 1);
check('enough seats: 3 free covers 3', R.hasEnoughSeats(offer(), 3));
check('enough seats: 3 free does not cover 4', !R.hasEnoughSeats(offer(), 4));
check('availability: front free, 2 back free', same(R.seatAvailability(offer()), { front: 'free', backFree: 2 }));
check('availability: back full', same(R.seatAvailability(offer({ back_seats_free: 0 })), { front: 'free', backFree: 0 }));
check('availability: front TAKEN', same(R.seatAvailability(offer({ front_seat_available: false })), { front: 'taken', backFree: 2 }));
// 🔴 THE T-083 RULE, WHICH THIS MODULE FIRST GOT WRONG. "never offered" is NOT "taken";
// `api/offers.ts` says so in as many words. Collapsing them tells a passenger a seat is gone
// when it never existed — and the first version of `seatAvailability` did exactly that.
check('availability: front NOT OFFERED is its own state, not "taken"',
  same(R.seatAvailability(offer({ front_offered: false, front_seat_available: false })), { front: 'notOffered', backFree: 2 }));
check('availability: not offered wins even if "available" says true',
  R.seatAvailability(offer({ front_offered: false, front_seat_available: true })).front === 'notOffered');
check('availability: a pre-T-083 offer is UNKNOWN, never "taken"',
  same(R.seatAvailability(offer({ front_offered: null, front_seat_available: null, back_seats_free: null })), { front: 'unknown', backFree: 3 }));
check('availability: missing back split falls back to the pool, capped at 3',
  R.seatAvailability(offer({ seats_free: 9, back_seats_free: null })).backFree === 3);
check('availability: missing back split with an empty pool is 0',
  R.seatAvailability(offer({ seats_free: 0, back_seats_free: null })).backFree === 0);

// ------------------------------------------------------------------ price
check('lead price: the cheaper of front and back', R.leadPrice(offer()) === 120000);
check('lead price: front cheaper wins', R.leadPrice(offer({ front_price_per_seat: '90000' })) === 90000);
check('lead price: only one priced', R.leadPrice(offer({ front_price_per_seat: null })) === 120000);
check('lead price: nothing priced -> null, NOT 0',
  R.leadPrice(offer({ price_per_seat: null, front_price_per_seat: null })) === null);
check('lead price: a bid overrides the offer', R.leadPrice(offer(), { id: 'b', offered_price_per_seat: '99000' }) === 99000);
check('lead price: an unpriced bid falls back to the offer', R.leadPrice(offer(), { id: 'b', offered_price_per_seat: null }) === 120000);
check('price rows: only the priced ones appear, in artboard order',
  same(R.priceRows(offer({ price_whole_salon: '450000' })).map((r) => r.key),
    ['searchOffers.priceFront', 'searchOffers.priceBack', 'passengerOffers.priceWholeSalon']));
check('price rows: nothing priced -> empty',
  same(R.priceRows(offer({ price_per_seat: null, front_price_per_seat: null })), []));

// ------------------------------------------------------------------ rating
check('rating: a rated driver', same(R.ratingOf(offer()), { value: 4.3, count: 12 }));
check('rating: NO rating -> null (must not render 0,0)', R.ratingOf(offer({ driver: { name: 'A' } })) === null);
check('rating: zero rating -> null', R.ratingOf(offer({ driver: { rating: 0, rating_count: 0 } })) === null);
check('rating: rated but count 0 -> null', R.ratingOf(offer({ driver: { rating: 4.5, rating_count: 0 } })) === null);
check('rating: no driver at all -> null', R.ratingOf(offer({ driver: null })) === null);
// 🔴 A rating of 0 with NO count at all. The `rating_count` guard cannot see this one, so it
// pins the `raw <= 0` guard on its own — without it the mutation "drop the <= 0 check" stayed
// GREEN, i.e. every other zero-rating assertion was passing for the wrong reason.
check('rating: zero with no count -> null (pins the <= 0 guard alone)',
  R.ratingOf(offer({ driver: { name: 'A', rating: 0 } })) === null);
check('rating: negative rating -> null', R.ratingOf(offer({ driver: { name: 'A', rating: -2 } })) === null);
check('rating format: Uzbek comma, one decimal', R.formatRating(4.3) === '4,3');
check('rating format: a whole number still shows a decimal', R.formatRating(5) === '5,0');

// ------------------------------------------------------------------ fuel
check('fuel: a known type maps to its key',
  same(R.fuelChips(offer()), [{ key: 'searchOffers.fuelPropan', raw: 'propan' }]));
check('fuel: two fuels, both kept',
  R.fuelChips(offer({ vehicle: { fuel_types: ['benzine', 'propan'] } })).length === 2);
check('fuel: an UNKNOWN fuel survives with a null key, not dropped',
  same(R.fuelChips(offer({ vehicle: { fuel_types: ['hydrogen'] } })), [{ key: null, raw: 'hydrogen' }]));
check('fuel: absent -> empty, so the row is omitted', same(R.fuelChips(offer({ vehicle: {} })), []));
check('fuel: null vehicle -> empty', same(R.fuelChips(offer({ vehicle: null })), []));
check('fuel: every known key is a real label key',
  ['benzine', 'metan', 'propan', 'electric', 'diesel'].every((f) => typeof R.FUEL_LABEL_KEY[f] === 'string'));

// ------------------------------------------------------------------ class filter
const mixed = [offer({ id: 1 }), offer({ id: 2, vehicle_class: 'comfort' }), offer({ id: 3, vehicle_class: 'comfort' })];
check('class counts: all + per class',
  same(R.classCounts(mixed, ['standart', 'comfort', 'biznes']), { hammasi: 3, standart: 1, comfort: 2, biznes: 0 }));
check('class filter: all keeps everything', R.filterByClass(mixed, R.ALL_CLASSES).length === 3);
check('class filter: one class', R.filterByClass(mixed, 'comfort').map((o) => o.id).join() === '2,3');
check('class filter: does not mutate', (() => { const a = [...mixed]; R.filterByClass(a, 'comfort'); return a.length === 3; })());

// ------------------------------------------------------------------ sorting
const cheap = offer({ id: 'cheap', price_per_seat: '80000', front_price_per_seat: '95000' });
const dear = offer({ id: 'dear', price_per_seat: '200000', front_price_per_seat: '250000' });
const unpriced = offer({ id: 'none', price_per_seat: null, front_price_per_seat: null });
check('sort price asc: cheapest first, unpriced LAST',
  same(R.sortOffers([dear, unpriced, cheap], sortState({ key: 'price' })).map((o) => o.id), ['cheap', 'dear', 'none']));
check('sort price desc: dearest first, unpriced STILL last',
  same(R.sortOffers([cheap, unpriced, dear], sortState({ key: 'price', priceDesc: true })).map((o) => o.id), ['dear', 'cheap', 'none']));
const s1 = offer({ id: 's1', seats_free: 1 });
const s4 = offer({ id: 's4', seats_free: 4 });
check('sort seats: most free first by default',
  same(R.sortOffers([s1, s4], sortState({ key: 'seats' })).map((o) => o.id), ['s4', 's1']));
check('sort seats: ascending when toggled',
  same(R.sortOffers([s4, s1], sortState({ key: 'seats', seatsAsc: true })).map((o) => o.id), ['s1', 's4']));
const early = offer({ id: 'early', start_at: '2026-09-20T06:00:00.000Z' });
const late = offer({ id: 'late', start_at: '2026-09-20T22:00:00.000Z' });
const broken = offer({ id: 'broken', start_at: 'not-a-date' });
check('sort soon: earliest departure first, unparseable LAST',
  same(R.sortOffers([late, broken, early], sortState({ key: 'soon' })).map((o) => o.id), ['early', 'late', 'broken']));
// 🔴 THE ASSERTION THAT PAID FOR THIS FILE. The rule first sorted by TIME OF DAY (the
// artboard's own key, valid only because all its fixtures share one date). A 22:00Z departure
// became 00:00 local and sorted AHEAD of an 06:00Z one. Across midnight, "eng tez" meant its
// opposite. The two below pin the real requirement: a LATER DAY always sorts after.
const tonight = offer({ id: 'tonight', start_at: '2026-09-20T19:00:00.000Z' });
const tomorrowEarly = offer({ id: 'tomorrow', start_at: '2026-09-21T02:00:00.000Z' });
check('sort soon: tonight beats tomorrow morning (absolute time, not time-of-day)',
  same(R.sortOffers([tomorrowEarly, tonight], sortState({ key: 'soon' })).map((o) => o.id), ['tonight', 'tomorrow']));
check('sort soon: and it stays true when the list arrives the other way round',
  same(R.sortOffers([tonight, tomorrowEarly], sortState({ key: 'soon' })).map((o) => o.id), ['tonight', 'tomorrow']));
const rated = offer({ id: 'rated', driver: { rating: 4.9, rating_count: 30 } });
const unrated = offer({ id: 'unrated', driver: { name: 'B' } });
check('sort match: a rated driver outranks an unrated one',
  same(R.sortOffers([unrated, rated], sortState()).map((o) => o.id), ['rated', 'unrated']));
check('sort match: higher rating first',
  same(R.sortOffers([offer({ id: 'lo', driver: { rating: 4.1, rating_count: 5 } }), rated], sortState()).map((o) => o.id), ['rated', 'lo']));
// 🔴 Same rating, different free seats — the only case that pins the seat key in `match`.
// Without it, zeroing that key changed no order and the mutation stayed GREEN.
const tie1 = offer({ id: 'few', seats_free: 1, driver: { rating: 4.5, rating_count: 10 } });
const tie4 = offer({ id: 'many', seats_free: 4, driver: { rating: 4.5, rating_count: 10 } });
check('sort match: on equal ratings, more free seats wins',
  same(R.sortOffers([tie1, tie4], sortState()).map((o) => o.id), ['many', 'few']));
check('sort: never mutates the input', (() => { const a = [dear, cheap]; R.sortOffers(a, sortState({ key: 'price' })); return a[0].id === 'dear'; })());

// ------------------------------------------------------------------ sort state + server sort
check('tap a new chip: resets direction', same(R.nextSortState(sortState({ key: 'price', priceDesc: true }), 'seats'), { key: 'seats', priceDesc: false, seatsAsc: false }));
check('tap price again: flips direction', R.nextSortState(sortState({ key: 'price' }), 'price').priceDesc === true);
check('tap price twice: flips back', R.nextSortState(R.nextSortState(sortState({ key: 'price' }), 'price'), 'price').priceDesc === false);
check('tap seats again: flips direction', R.nextSortState(sortState({ key: 'seats' }), 'seats').seatsAsc === true);
check('tap match again: unchanged', same(R.nextSortState(sortState(), 'match'), sortState()));
check('server sort: price asc', R.serverSortFor(sortState({ key: 'price' })) === 'price_asc');
check('server sort: price desc', R.serverSortFor(sortState({ key: 'price', priceDesc: true })) === 'price_desc');
check('server sort: soon -> date_asc', R.serverSortFor(sortState({ key: 'soon' })) === 'date_asc');
check('server sort: match has NO server twin -> undefined', R.serverSortFor(sortState({ key: 'match' })) === undefined);
check('server sort: seats has NO server twin -> undefined', R.serverSortFor(sortState({ key: 'seats' })) === undefined);

// ------------------------------------------------------------------ modes + bids
check('modes: two, in artboard order', same(R.MODES, ['qidiruv', 'takliflar']));
check('modes: each has a label and a list title',
  R.MODES.every((m) => typeof R.MODE_LABEL_KEY[m] === 'string' && typeof R.LIST_TITLE_KEY[m] === 'string'));
check('bid live: pending and confirmed', R.isLiveBid({ id: 1, status: 'pending' }) && R.isLiveBid({ id: 2, status: 'confirmed' }));
check('bid live: rejected and cancelled are not', !R.isLiveBid({ id: 3, status: 'rejected' }) && !R.isLiveBid({ id: 4, status: 'cancelled' }));
check('bid tone: wait / ok / bad / neutral',
  R.bidTone('pending') === 'wait' && R.bidTone('confirmed') === 'ok' &&
  R.bidTone('rejected') === 'bad' && R.bidTone('cancelled') === 'neutral');
// 🔴 THIS APP'S namespace. `myJoinRequests.*` is the DRIVER app's and does not exist here —
// it would have rendered the raw key on every locale, which `tsc` cannot see.
// 🔴 A BID IS ITS OWN OBJECT, with a NESTED vehicle — not a decorated DriverOffer. The first
// version of this module modelled it as one. These pin the flattening.
const bid = (over = {}) => ({
  id: 'b1',
  offer_id: 7,
  status: 'pending',
  offered_price_per_seat: '130000.00',
  total_offered_price: '260000.00',
  seats_offered: 2,
  currency: 'UZS',
  driver: { display_name: 'Alisher A.', first_name: 'Alisher', last_name: 'Alisherov' },
  vehicle: { make: { name: 'Nexia' }, model: { name: '3' }, color: { name: 'Oq' }, license_plate: '40 A 123 AA' },
  ...over,
});
check('bid car: nested make + model are flattened', R.bidCarName(bid()) === 'Nexia 3');
check('bid car: only a make still renders', R.bidCarName(bid({ vehicle: { make: { name: 'Nexia' } } })) === 'Nexia');
check('bid car: no vehicle -> null, not an empty string', R.bidCarName(bid({ vehicle: null })) === null);
check('bid car: blank names -> null', R.bidCarName(bid({ vehicle: { make: { name: '  ' }, model: { name: '' } } })) === null);
check('bid colour: nested name', R.bidColorName(bid()) === 'Oq');
check('bid colour: absent -> null', R.bidColorName(bid({ vehicle: { make: { name: 'X' } } })) === null);
check('bid driver: display name wins', R.bidDriverName(bid()) === 'Alisher A.');
check('bid driver: falls back to first + last',
  R.bidDriverName(bid({ driver: { first_name: 'Bek', last_name: 'Xolmatov' } })) === 'Bek Xolmatov');
check('bid driver: nothing -> null', R.bidDriverName(bid({ driver: null })) === null);
check('bid prices: both coerced from DECIMAL strings',
  same(R.bidPrices(bid()), { perSeat: 130000, total: 260000 }));
check('bid prices: a missing total is null, NOT 0',
  same(R.bidPrices(bid({ total_offered_price: null })), { perSeat: 130000, total: null }));
check('bid label: uses THIS app offerDrivers keys', R.bidLabelKey('pending') === 'offerDrivers.status_pending');
check('bid label: a missing status does not produce "undefined"', R.bidLabelKey(null) === 'offerDrivers.status_cancelled');

// ------------------------------------------------------------------ verdict
if (failed) {
  console.log(`\n✗ offer search: ${failed} of ${total} assertions failed`);
  process.exit(1);
}
console.log(`✓ offer search: all ${total} assertions pass (money · seats · price · rating · fuel · class · sort · modes)`);

/**
 * ✅ PROVEN ABLE TO FAIL — T-101 step 14b-1, 2026-09-12. Each mutation applied to
 * `utils/offerSearch.ts` by a scratch runner, the checker run, then the file restored from a
 * pristine copy and byte-compared (a new file has no `git diff` to lean on). The list is
 * filled in by the session note in `docs/PLAN-T101-step14b.md` §7.
 */
