/**
 * Executes the my-rides rules (`utils/myRides.ts`) and asserts on them.
 * T-101 step 18a (`docs/PLAN-T101-step18.md`).
 *
 * Run: `node scripts/check-my-rides.mjs`   (esbuild is already a dependency)
 *
 * 🔴 WHY THIS EXISTS. Step 18 merges the offers list and the passengers screen into one
 * list in three DERIVED phases. A phase computed one way on the card and another way in
 * the mode counts is the defect no baseline sees, so the rules run here, on fixtures, first.
 *
 * ⚠️ WHY A SCRIPT AND NOT A TEST FILE. Neither RN app has a test runner and adding one is a
 * new dependency (rule 4). Same pattern as steps 14-17.
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

const out = path.join(root, 'node_modules', '.cache', `check-my-rides.${Date.now()}.mjs`);
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(
  `npx esbuild utils/myRides.ts --bundle --format=esm --platform=neutral ` +
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
const ride = (over = {}) => ({
  id: '7',
  status: 'published',
  start_at: '2026-09-20T09:00:00.000Z',
  seats_total: 4,
  seats_free: 2,
  price_per_seat: '150000.00',
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-02T00:00:00.000Z',
  ...over,
});
const booking = (over = {}) => ({
  id: 'b1',
  status: 'pending',
  seats_requested: 2,
  is_front_seat: false,
  agreed_price_per_seat: '130000.00',
  total_agreed_price: '260000.00',
  passenger: null,
  ...over,
});
const NOW = new Date('2026-09-12T12:00:00.000Z').getTime();

// ------------------------------------------------------------------ money
check('money: number passes through', R.money(150000) === 150000);
check('money: DECIMAL string is coerced', R.money('150000.00') === 150000);
check('money: string with spaces is coerced', R.money('150 000') === 150000);
check('money: null is 0', R.money(null) === 0);
check('money: garbage is 0', R.money('abc') === 0);

// ------------------------------------------------------------------ seats + phase
check('seats: taken = total - free', R.seatsTaken(ride()) === 2);
check('seats: free above total clamps to 0 taken', R.seatsTaken(ride({ seats_free: 9 })) === 0);
check('seats: negative free clamps to total', R.seatsTaken(ride({ seats_free: -1 })) === 4);
check('full: 0 free is full', R.isFull(ride({ seats_free: 0 })));
check('full: 1 free is not', !R.isFull(ride({ seats_free: 1 })));
check('full: a 0-seat ride is never full', !R.isFull(ride({ seats_total: 0, seats_free: 0 })));
check('phase: published with free seats -> jarayon', R.ridePhase(ride()) === 'jarayon');
check('phase: published with 0 free -> faol', R.ridePhase(ride({ seats_free: 0 })) === 'faol');
check('phase: archived -> tarix even with free seats', R.ridePhase(ride({ status: 'archived' })) === 'tarix');
check('phase: cancelled -> tarix even when full', R.ridePhase(ride({ status: 'cancelled', seats_free: 0 })) === 'tarix');
check('phase: a past date does NOT move a published ride to tarix (decision ③)',
  R.ridePhase(ride({ start_at: '2020-01-01T00:00:00.000Z' })) === 'jarayon');
check('phases: three, in the artboard order', same(R.PHASES, ['jarayon', 'faol', 'tarix']));
check('phases: every phase has a label key and an empty key',
  R.PHASES.every((p) => typeof R.PHASE_LABEL_KEY[p] === 'string' && typeof R.EMPTY_KEY[p] === 'string'));

// ------------------------------------------------------------------ pills + readouts
check('pill: collecting', R.ridePillKey(ride()) === 'myRides.stateCollecting');
check('pill: confirmed when full', R.ridePillKey(ride({ seats_free: 0 })) === 'myRides.stateConfirmed');
check('pill: archived = done', R.ridePillKey(ride({ status: 'archived' })) === 'myRides.stateDone');
check('pill: cancelled reuses the existing status key',
  R.ridePillKey(ride({ status: 'cancelled' })) === 'driverOffers.status.cancelled');
check('pill tone: wait / ok / neutral / bad',
  R.ridePillTone(ride()) === 'wait' && R.ridePillTone(ride({ seats_free: 0 })) === 'ok' &&
  R.ridePillTone(ride({ status: 'archived' })) === 'neutral' && R.ridePillTone(ride({ status: 'cancelled' })) === 'bad');
check('fill readout: open vs full', R.fillKey(ride()) === 'myRides.fillOpen' && R.fillKey(ride({ seats_free: 0 })) === 'myRides.fillFull');
check('past: earlier start is past', R.isPast(ride({ start_at: '2026-09-12T11:59:00.000Z' }), NOW));
check('past: later start is not', !R.isPast(ride(), NOW));
check('past: unparseable date is not past', !R.isPast(ride({ start_at: 'nope' }), NOW));

// ------------------------------------------------------------------ actions
const pub = ride();
const arc = ride({ status: 'archived' });
const can = ride({ status: 'cancelled' });
check('actions: published -> edit, cancel, archive; not publish, not delete',
  R.canEdit(pub) && R.canCancel(pub) && R.canArchive(pub) && !R.canPublish(pub) && !R.canDelete(pub));
check('actions: archived -> publish, delete only',
  !R.canEdit(arc) && !R.canCancel(arc) && !R.canArchive(arc) && R.canPublish(arc) && R.canDelete(arc));
check('actions: cancelled -> publish, delete only',
  !R.canEdit(can) && !R.canCancel(can) && !R.canArchive(can) && R.canPublish(can) && R.canDelete(can));

// ------------------------------------------------------------------ stats + money
check('stats: passengers not loaded -> orders and money are null, seats still counted',
  same(R.rideStats(ride(), null), { taken: 2, total: 4, orders: null, money: null }));
const bs = [
  booking({ status: 'confirmed', total_agreed_price: '260000.00' }),
  booking({ id: 'b2', status: 'pending', total_agreed_price: '999999' }),
  booking({ id: 'b3', status: 'rejected', total_agreed_price: '500000' }),
  booking({ id: 'b4', status: 'confirmed', seats_requested: 1, agreed_price_per_seat: '170000', total_agreed_price: null }),
];
const st = R.rideStats(ride(), bs);
check('stats: orders = pending + confirmed', st.orders === 3);
check('stats: money = confirmed totals only, missing total falls back to per-seat × seats',
  st.money === 260000 + 170000);
check('formula: per-seat × seats = total', same(R.priceFormula(booking()), { perSeat: 130000, seats: 2, total: 260000 }));
check('formula: missing per-seat is derived from the total with ceil (does not divide evenly)',
  same(R.priceFormula(booking({ agreed_price_per_seat: null, seats_requested: 3, total_agreed_price: '100000' })),
    { perSeat: 33334, seats: 3, total: 100000 }));
check('formula: 0 seats is treated as 1', R.priceFormula(booking({ seats_requested: 0 })).seats === 1);
check('money label: expected while live, earned in history',
  R.moneyLabelKey('jarayon') === 'myRides.incomeExpected' && R.moneyLabelKey('faol') === 'myRides.incomeExpected' &&
  R.moneyLabelKey('tarix') === 'myRides.incomeEarned');

// ------------------------------------------------------------------ bookings
check('booking label: reuses offerPassengers.<status>', R.bookingLabelKey('pending') === 'offerPassengers.pending');
check('booking tone: wait / ok / bad / neutral',
  R.bookingTone('pending') === 'wait' && R.bookingTone('confirmed') === 'ok' &&
  R.bookingTone('rejected') === 'bad' && R.bookingTone('cancelled') === 'neutral');
check('confirm/reject: pending only',
  R.canConfirm(booking()) && R.canReject(booking()) &&
  !R.canConfirm(booking({ status: 'confirmed' })) && !R.canReject(booking({ status: 'rejected' })));
check('phone: confirmed with a number', R.phoneUnlocked(booking({ status: 'confirmed', passenger: { phone_e164: '+998901234567' } })));
check('phone: confirmed without a number is locked', !R.phoneUnlocked(booking({ status: 'confirmed', passenger: { phone_e164: null } })));
check('phone: pending with a number is STILL locked (T-055)', !R.phoneUnlocked(booking({ passenger: { phone_e164: '+998901234567' } })));
check('seat label: front & 1', same(R.seatLabel(booking({ is_front_seat: true, seats_requested: 1 })), { key: 'offerPassengers.frontSeatRequested', count: 1 }));
check('seat label: one back seat', same(R.seatLabel(booking({ seats_requested: 1 })), { key: 'offerPassengers.seatsRequestedOne', count: 1 }));
check('seat label: many, even with a front seat', same(R.seatLabel(booking({ is_front_seat: true, seats_requested: 3 })), { key: 'offerPassengers.seatsRequested', count: 3 }));

// ------------------------------------------------------------------ reject sheet
check('reject: nine reasons, other last', R.REJECT_REASON_KEYS.length === 9 && R.REJECT_REASON_KEYS[8] === R.REJECT_REASON_OTHER);
check('reject: no reason is invalid', !R.isRejectValid(null, ''));
check('reject: unknown key is invalid', !R.isRejectValid('myRides.reasonMadeUp', ''));
check('reject: a listed reason is valid with no text', R.isRejectValid(R.REJECT_REASON_KEYS[0], ''));
check('reject: other needs text', !R.isRejectValid(R.REJECT_REASON_OTHER, '   '));
check('reject: other with text is valid', R.isRejectValid(R.REJECT_REASON_OTHER, ' late '));
const tr = (k) => `T(${k})`;
check('reject text: listed reason is translated', R.rejectReasonText(R.REJECT_REASON_KEYS[2], 'x', tr) === 'T(myRides.reasonNoFuel)');
check('reject text: other sends the trimmed text', R.rejectReasonText(R.REJECT_REASON_OTHER, '  late  ', tr) === 'late');

// ------------------------------------------------------------------ list
const a = ride({ id: 'a', start_at: '2026-09-22T09:00:00.000Z' });
const b = ride({ id: 'b', start_at: '2026-09-21T09:00:00.000Z' });
const c = ride({ id: 'c', start_at: 'nope' });
check('sort live: soonest first, unparseable last', same(R.sortRides([c, a, b], 'jarayon').map((r) => r.id), ['b', 'a', 'c']));
check('sort live: does not mutate the input', (() => { const arr = [a, b]; R.sortRides(arr, 'faol'); return arr[0].id === 'a'; })());
const h1 = ride({ id: 'h1', status: 'archived', updated_at: '2026-09-05T00:00:00.000Z' });
const h2 = ride({ id: 'h2', status: 'cancelled', updated_at: '2026-09-09T00:00:00.000Z' });
const h3 = ride({ id: 'h3', status: 'archived', updated_at: undefined, created_at: '2026-09-07T00:00:00.000Z' });
check('sort history: newest change first, created_at when updated_at is missing',
  same(R.sortRides([h1, h3, h2], 'tarix').map((r) => r.id), ['h2', 'h3', 'h1']));
const g = R.groupByPhase([h1, a, ride({ id: 'f', seats_free: 0 }), b, h2]);
check('group: each ride lands in exactly one phase, sorted',
  same(g.jarayon.map((r) => r.id), ['b', 'a']) && same(g.faol.map((r) => r.id), ['f']) && same(g.tarix.map((r) => r.id), ['h2', 'h1']));
check('same id: string vs number', R.sameOfferId('7', 7) && R.sameOfferId(7, '7') && !R.sameOfferId('7', 8));
check('same id: null never matches', !R.sameOfferId(null, null) && !R.sameOfferId('7', undefined));
check('expanded: the requested ride when present', R.defaultExpandedId([a, b], 'b') === 'b');
check('expanded: requested as a number still matches', R.defaultExpandedId([ride({ id: '12' })], 12) === '12');
check('expanded: falls back to the first', R.defaultExpandedId([a, b], 'zzz') === 'a');
check('expanded: empty list -> null', R.defaultExpandedId([], 'a') === null);

// ------------------------------------------------------------------ verdict
if (failed) {
  console.log(`\n✗ my rides: ${failed} of ${total} assertions failed`);
  process.exit(1);
}
console.log(`✓ my rides: all ${total} assertions pass (money · seats · phase · pills · actions · stats · bookings · reject · list)`);

/**
 * ✅ PROVEN ABLE TO FAIL — T-101 step 18a, 2026-09-12. Each mutation applied to
 * `utils/myRides.ts` by a scratch runner, the checker run, then the file restored from a
 * pristine copy and byte-compared (a new file has no `git diff` to lean on):
 *
 *   ridePhase faol/jarayon swapped                        -> 4 red
 *   cancelled no longer counts as history                 -> 2 red
 *   seatsTaken clamp removed                              -> 1 red
 *   rideStats money counts pending bookings               -> 1 red
 *   priceFormula Math.ceil -> Math.floor                  -> 1 red (fixture 100 000 / 3)
 *   isRejectValid: "other" needs no text                  -> 1 red
 *   sortRides: unparseable dates FIRST (both branches)    -> 1 red  ⚠️ flipping only ONE
 *                                                            branch stayed GREEN — the
 *                                                            comparator became inconsistent
 *                                                            and the engine's sort happened
 *                                                            to land right; not a rule the
 *                                                            checker can pin, so the real
 *                                                            mutation flips both
 *   phoneUnlocked without the status check (T-055)        -> 1 red
 *   canPublish on a published offer                       -> 3 red
 *   defaultExpandedId ignores the requested id            -> 1 red
 *   sameOfferId without String()                          -> 1 red
 *
 * A checker that cannot go red proves nothing.
 */
