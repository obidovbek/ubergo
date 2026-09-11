/**
 * Executes the passenger-orders rules (`utils/passengerOrders.ts`) and asserts on them.
 * T-101 step 17a (`docs/PLAN-T101-step17.md`).
 *
 * Run: `node scripts/check-passenger-orders.mjs`   (esbuild is already a dependency)
 *
 * 🔴 WHY THIS EXISTS. Step 17 merges three screens into one, and the rules those screens
 * carried inline — which price is "the" price of a special order, how many seat cells a row
 * draws, when the passenger's phone may be shown, which order wins a sort — would be
 * rewritten three times in the merge. A rule that disagrees with itself across two modes
 * is exactly the defect no baseline sees. So the rules run here, on fixtures, first.
 *
 * ⚠️ WHY A SCRIPT AND NOT A TEST FILE. Neither RN app has a test runner and adding one is a
 * new dependency (rule 4). Same pattern as steps 14-16: bundle the pure module with
 * esbuild, execute it, assert.
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

const out = path.join(root, 'node_modules', '.cache', `check-passenger-orders.${Date.now()}.mjs`);
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(
  `npx esbuild utils/passengerOrders.ts --bundle --format=esm --platform=neutral ` +
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
const base = (over = {}) => ({
  id: 1,
  start_at: '2026-09-12T09:00:00.000Z',
  is_urgent: false,
  max_price_per_seat: 100000,
  seats_needed: 2,
  seat_counts: null,
  salon_scope: null,
  front_seat: false,
  special_order: null,
  ...over,
});
const counts = (fm, ff, bm, bf) => ({ front_male: fm, front_female: ff, back_male: bm, back_female: bf });

// ------------------------------------------------------------------ money + kind
check('money: number passes through', R.money(150000) === 150000);
check('money: DECIMAL string is coerced', R.money('150000.00') === 150000);
check('money: string with spaces is coerced', R.money('150 000') === 150000);
check('money: null / empty / zero / negative / garbage are "no price"',
  [null, undefined, '', 0, -5, 'abc'].every((v) => R.money(v) === null));

check('kind: no special block -> oddiy', R.orderKind(base()) === 'oddiy');
check('kind: special block with only flags is NOT maxsus',
  R.orderKind(base({ special_order: { fixed_price: true, review_driver_offers: false } })) === 'oddiy');
check('kind: special block with a price -> maxsus',
  R.orderKind(base({ special_order: { price_back: '130000' } })) === 'maxsus');

// ------------------------------------------------------------------ seat cells
{
  const c = R.seatCells(base({ seat_counts: counts(0, 0, 1, 2) }));
  check('cells: 2 women + 1 man in the back, women first', same(c.back, ['f', 'f', 'm']) && same(c.front, [null]));
  check('cells: occupied counts the drawn cells', c.occupied === 3);
}
{
  const c = R.seatCells(base({ seat_counts: counts(1, 0, 0, 0) }));
  check('cells: a man in front', same(c.front, ['m']) && c.occupied === 1);
}
{
  const c = R.seatCells(base({ seat_counts: counts(2, 0, 0, 0) }));
  check('cells: two "front" men -> one spills to the back', same(c.front, ['m']) && c.back.filter((x) => x === 'm').length === 1);
}
{
  const c = R.seatCells(base({ seat_counts: counts(0, 0, 3, 3), seats_needed: 6 }));
  check('cells: SIX in the back never draws a fifth cell', c.front.length === 1 && c.back.length === 3 && c.occupied === 4);
}
{
  const c = R.seatCells(base({ seat_counts: null, salon_scope: 'whole_salon', seats_needed: 4 }));
  check('cells: whole salon without counts = all four, gender unknown', c.occupied === 4 && c.front[0] === 'any');
}
{
  const c = R.seatCells(base({ seat_counts: null, salon_scope: 'back_salon_full', seats_needed: 3 }));
  check('cells: back salon without counts = three back, front empty', same(c.front, [null]) && same(c.back, ['any', 'any', 'any']));
}
{
  const c = R.seatCells(base({ seat_counts: null, seats_needed: 2, front_seat: true }));
  check('cells: 2 people, front asked -> front + one back', c.front[0] === 'any' && c.back.filter((x) => x).length === 1);
}
{
  const c = R.seatCells(base({ seat_counts: null, seats_needed: 2, front_seat: false }));
  check('cells: 2 people, no front asked -> both in the back', c.front[0] === null && c.back.filter((x) => x).length === 2);
}
{
  const c = R.seatCells(base({ seat_counts: null, seats_needed: 9 }));
  check('cells: 9 people without counts still caps at four', c.occupied === 4);
}
{
  const c = R.seatCells(base({ seat_counts: counts(0, 0, 0, 0), seats_needed: 1 }));
  check('cells: all-zero counts fall back to seats_needed', c.occupied === 1);
}

// ------------------------------------------------------------------ listed price
{
  const p = R.listedPrice(base({ max_price_per_seat: '120000', seats_needed: 2 }));
  check('price: oddiy = per-seat ask × seats needed', p.kind === 'oddiy' && p.perSeat === 120000 && p.total === 240000 && p.lines.length === 0);
}
{
  const p = R.listedPrice(base({ max_price_per_seat: null }));
  check('price: oddiy with no ask is negotiable (null, not 0)', p.perSeat === null && p.total === null);
}
{
  const o = base({ seats_needed: 2, seat_counts: counts(0, 0, 0, 2), special_order: { price_front: 170000, price_back: 130000 } });
  const p = R.listedPrice(o);
  check('price: maxsus back seats = 2 × back price', p.kind === 'maxsus' && p.total === 260000 && p.perSeat === 130000);
  check('price: maxsus lists the breakdown line', p.lines.length === 1 && p.lines[0].labelKey === 'passengerOfferExtras.seatsBack' && p.lines[0].qty === 2);
}
{
  const o = base({ seats_needed: 2, seat_counts: counts(1, 0, 1, 0), special_order: { price_front: 170000, price_back: 130000 } });
  const p = R.listedPrice(o);
  check('price: maxsus front + back = both lines summed', p.total === 300000 && p.lines.length === 2);
}
{
  const o = base({ seats_needed: 4, salon_scope: 'whole_salon', special_order: { price_whole_salon: 520000, price_back: 1 } });
  const p = R.listedPrice(o);
  check('price: whole salon wins over per-seat lines', p.total === 520000 && p.lines.length === 1 && p.lines[0].labelKey === 'passengerOfferExtras.wholeSalon');
  check('price: whole salon per-seat is derived from the total', p.perSeat === 130000);
}
{
  const o = base({ seats_needed: 3, salon_scope: 'back_salon_full', special_order: { price_back_salon: '360000' } });
  const p = R.listedPrice(o);
  check('price: back salon = its own line', p.total === 360000 && p.lines[0].labelKey === 'passengerOfferExtras.backSalonFull');
}
{
  const o = base({ seats_needed: 3, max_price_per_seat: 100000, seat_counts: counts(0, 0, 0, 3), special_order: { price_whole_salon: 500000 } });
  const p = R.listedPrice(o);
  check('price: special prices that do not cover the ask fall back to the plain ask', p.kind === 'maxsus' && p.total === 300000 && p.lines.length === 0);
}
{
  // 100 000 for the whole salon, 3 people: 33 333.33 per seat. Rounding DOWN would make the
  // server's total (per seat × 3) 99 999 — one so'm under what the passenger asked. The first
  // version of this case used a total that divided evenly, and the floor mutation stayed GREEN.
  const o = base({ seats_needed: 3, salon_scope: 'whole_salon', special_order: { price_whole_salon: 100000 } });
  const p = R.listedPrice(o);
  check('price: maxsus per-seat rounds UP, never under the ask', p.total === 100000 && p.perSeat === 33334);
  const a = R.acceptPayload(o);
  check('accept: per-seat × seats never lands under the passenger total', a.offered_price_per_seat * a.seats_offered >= p.total);
}

// ------------------------------------------------------------------ accept payload
{
  const a = R.acceptPayload(base({ max_price_per_seat: 100000, seats_needed: 2 }));
  check('accept: oddiy = ask per seat × seats needed', same(a, { seats_offered: 2, offered_price_per_seat: 100000 }));
}
{
  const o = base({ seats_needed: 4, salon_scope: 'whole_salon', special_order: { price_whole_salon: 520000 } });
  const a = R.acceptPayload(o);
  check('accept: maxsus per-seat × seats reproduces the passenger total', a.offered_price_per_seat * a.seats_offered === 520000);
}
check('accept: no price -> nothing to accept (counter-offer only)', R.acceptPayload(base({ max_price_per_seat: null })) === null);

// ------------------------------------------------------------------ counter-offer
check('offer: thousands field parses digits only', R.parseThousands('1 5o0') === 150 && R.parseThousands('') === 0);
check('offer: total = thousands × 1000 × seats', R.offerTotal(150, 2) === 300000);
check('offer: seed is the listed per-seat price in thousands', R.seedOfferThousands(base({ max_price_per_seat: 149600 })) === 150);
check('offer: no listed price seeds empty', R.seedOfferThousands(base({ max_price_per_seat: null })) === null);
check('offer: no vehicle is refused first', R.validateOffer({ perSeat: 0, seats: 0, seatsNeeded: 2, hasVehicle: false }) === 'passengerOfferDetails.noVehicle');
check('offer: zero price refused', R.validateOffer({ perSeat: 0, seats: 2, seatsNeeded: 2, hasVehicle: true }) === 'passengerOfferDetails.errorPrice');
check('offer: fewer seats than needed refused (the T-018 salon case)', R.validateOffer({ perSeat: 100000, seats: 1, seatsNeeded: 3, hasVehicle: true }) === 'passengerOfferDetails.errorSeats');
check('offer: a valid form passes', R.validateOffer({ perSeat: 100000, seats: 3, seatsNeeded: 3, hasVehicle: true }) === null);

// ------------------------------------------------------------------ tags
check('tags: none by default', R.orderTags(base()).length === 0);
check('tags: woman-only first, then baggage', same(
  R.orderTags(base({ large_baggage: true, woman_in_car: true, pets: true })),
  ['passengerOfferExtras.womanInCar', 'passengerOfferExtras.baggage', 'passengerOfferExtras.pets'],
));

// ------------------------------------------------------------------ sorting
const T = (h) => `2026-09-12T${String(h).padStart(2, '0')}:00:00.000Z`;
const orders = [
  base({ id: 1, start_at: T(12), max_price_per_seat: 300000, seats_needed: 1 }),
  base({ id: 2, start_at: T(8), max_price_per_seat: null, seats_needed: 3 }),
  base({ id: 3, start_at: T(20), is_urgent: true, max_price_per_seat: 100000, seats_needed: 2 }),
  base({ id: 4, start_at: 'garbage', max_price_per_seat: 200000, seats_needed: 2 }),
  base({ id: 5, start_at: T(8), max_price_per_seat: 50000, seats_needed: 4 }),
];
const ids = (list) => list.map((o) => o.id);
const S = (key, over = {}) => ({ key, priceDesc: false, seatsAsc: false, ...over });

check('sort: match = urgent first, then soonest, then newest id; garbage date last',
  same(ids(R.sortOrders(orders, S('match'))), [3, 5, 2, 1, 4]));
check('sort: soon coincides with match (no presence backend)',
  same(ids(R.sortOrders(orders, S('soon'))), ids(R.sortOrders(orders, S('match')))));
check('sort: price ascending, unpriced LAST',
  same(ids(R.sortOrders(orders, S('price'))), [3, 5, 1, 4, 2]));
// 3 and 5 tie on total (200 000); the urgent one wins the tie, in both directions.
check('sort: price descending, unpriced STILL last',
  same(ids(R.sortOrders(orders, S('price', { priceDesc: true }))), [4, 1, 3, 5, 2]));
check('sort: seats = most passengers first',
  same(ids(R.sortOrders(orders, S('seats'))), [5, 2, 3, 4, 1]));
// 3 and 4 tie on seats (2); urgent 3 first. 2 needs 3 seats, 5 needs 4.
check('sort: seats ascending when toggled',
  same(ids(R.sortOrders(orders, S('seats', { seatsAsc: true }))), [1, 3, 4, 2, 5]));
check('sort: does not mutate its input', ids(orders)[0] === 1 && ids(orders)[4] === 5);
check('sort: a second tap on price flips direction',
  R.nextSortState(S('price'), 'price').priceDesc === true && R.nextSortState(S('match'), 'price').priceDesc === false);
check('sort: a second tap on seats flips direction; another key resets nothing',
  R.nextSortState(S('seats'), 'seats').seatsAsc === true && R.nextSortState(S('seats'), 'match').key === 'match');
check('sort: server hint follows the chip', R.serverSortFor(S('price', { priceDesc: true })) === 'price_desc'
  && R.serverSortFor(S('seats')) === 'seats_desc' && R.serverSortFor(S('match')) === 'date_asc');

// ------------------------------------------------------------------ class filter
{
  const list = [base({ id: 1 }), base({ id: 2, special_order: { price_back: 1000 } }), base({ id: 3 })];
  check('class: counts', same(R.classCounts(list), { hammasi: 3, oddiy: 2, maxsus: 1 }));
  check('class: filter', same(ids(R.filterByKind(list, 'maxsus')), [2]) && R.filterByKind(list, 'hammasi').length === 3);
}

// ------------------------------------------------------------------ modes
{
  const list = [base({ id: 1 }), base({ id: 2 }), base({ id: 3 }), base({ id: 4 })];
  const mine = [
    { offer_id: 2, status: 'pending' },
    { offer_id: 3, status: 'cancelled' },
    { offer_id: 4, status: 'rejected' },
  ];
  check('incoming: excludes orders I have ANY request on, incl. cancelled and rejected',
    same(ids(R.excludeMine(list, mine)), [1]));
}

// ------------------------------------------------------------------ requests
check('request: label keys reuse myJoinRequests.status_*', R.requestLabelKey('confirmed') === 'myJoinRequests.status_confirmed');
check('request: tones', R.requestTone('pending') === 'wait' && R.requestTone('confirmed') === 'ok'
  && R.requestTone('rejected') === 'bad' && R.requestTone('cancelled') === 'neutral');
check('request: only pending can be cancelled', R.canCancelRequest({ status: 'pending' }) && !R.canCancelRequest({ status: 'confirmed' }));
check('request: phone unlocks only on confirmed (T-054)', R.phoneUnlocked({ status: 'confirmed' })
  && ['pending', 'rejected', 'cancelled'].every((status) => !R.phoneUnlocked({ status })));

// ------------------------------------------------------------------ detail rows (17e)
check('payment: the three T-031 flags become a list, in order',
  same(R.paymentKeys(base({ payment_cash: true, payment_card: true, paid_by_friend: true })), ['cash', 'click_payme', 'friend_pays']));
check('payment: flags present but all false -> nothing (NOT the legacy value)',
  same(R.paymentKeys(base({ payment_cash: false, payment_card: false, paid_by_friend: false, payment_type: 'cash' })), []));
check('payment: flags absent -> the deprecated single value',
  same(R.paymentKeys(base({ payment_type: 'click_payme' })), ['click_payme']));
check('payment: flags absent and no legacy value -> nothing', same(R.paymentKeys(base()), []));
check('payment: every key maps to an existing label key',
  ['cash', 'click_payme', 'friend_pays'].every((k) => typeof R.PAYMENT_LABEL_KEY[k] === 'string'));
check('seat kind: whole salon wins', R.seatKindKey(base({ salon_scope: 'whole_salon', front_seat: true })) === 'passengerOfferExtras.wholeSalon');
check('seat kind: back salon', R.seatKindKey(base({ salon_scope: 'back_salon_full' })) === 'passengerOfferExtras.backSalonFull');
check('seat kind: front seat asked', R.seatKindKey(base({ front_seat: true })) === 'passengerOfferExtras.seatsFront');
check('seat kind: any position', R.seatKindKey(base({ seat_position_any: true })) === 'passengerOfferExtras.positionAny');
check('seat kind: default is the back seat', R.seatKindKey(base()) === 'passengerOfferExtras.seatsBack');

// ------------------------------------------------------------------ verdict
if (failed) {
  console.log(`\n✗ passenger orders: ${failed} of ${total} assertions failed`);
  process.exit(1);
}
console.log(`✓ passenger orders: all ${total} assertions pass (money · kind · cells · price · accept · offer · tags · sort · class · modes · requests)`);

/**
 * ✅ PROVEN ABLE TO FAIL — T-101 step 17a, 2026-09-11. Each mutation applied to
 * `utils/passengerOrders.ts` by a scratch runner, the checker run, then the file restored
 * from a pristine copy and byte-compared (a new file has no `git diff` to lean on):
 *
 *   CAR.back 3 -> 9 (a fifth cell can be drawn)          -> 5 red
 *   compareMatch ignores is_urgent                        -> 1 red
 *   unpriced orders sort FIRST                            -> 2 red (both directions)
 *   excludeMine keeps rejected/cancelled                  -> 1 red
 *   maxsus per-seat Math.ceil -> Math.floor               -> 2 red  ⚠️ was GREEN until the
 *                                                            fixture used a total that does
 *                                                            not divide by the seat count
 *   a flags-only special block counts as maxsus           -> 1 red
 *   startMs NaN guard removed                             -> 1 red
 *   phoneUnlocked on anything but rejected                -> 1 red
 *   the seats < seatsNeeded rule deleted                  -> 1 red
 *   (17e) paymentKeys drops the deprecated fallback       -> 1 red
 *   (17e) seatKindKey no longer prefers whole salon       -> 1 red
 *
 * A checker that cannot go red proves nothing — and a mutation that stays green is the
 * most valuable line in this list: it shows an assertion passing for the wrong reason.
 */
