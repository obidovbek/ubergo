/**
 * Executes the offer's departure-window and arrival rules. T-101 step 16c-2.
 *
 * Run: `node scripts/check-offer-schedule.mjs`   (esbuild is already a dependency)
 *
 * 🔴 WHY THIS EXISTS. Step 8f found FOUR defects in this exact model on the PASSENGER side,
 * and three were invisible while the rules lived inline among a form's state. The worst was
 * silent: "leave 08:00-11:00, arrive by 09:00" was ACCEPTED because arrival was compared
 * against the START of the window. Nothing in `tsc`, ESLint or the token ratchet can see a
 * wrong comparison — only cases can.
 *
 * The driver side is getting the same feature now, so it gets the cases FIRST, before the
 * drag gesture exists to hide them in.
 *
 * ⚠️ This IMPORTS the real `utils/offerSchedule.ts` rather than re-implementing it. A checker
 * holding its own copy of the logic passes while the app is broken.
 *
 * ⚠️ A script and not a `*.test.ts`: neither RN app has a test runner (CLAUDE.md — only the
 * API does) and adding one is a new dependency, rule 4. These cases port as-is if approved.
 *
 * ✅ PROVEN ABLE TO FAIL — see the note at the bottom.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const out = path.join(root, 'node_modules', '.cache', 'check-offer-schedule.mjs');
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(
  `npx esbuild utils/offerSchedule.ts --bundle --format=esm --platform=neutral ` +
    `--outfile="${out}" --log-level=error`,
  { cwd: root, stdio: 'inherit' },
);
const S = await import(pathToFileURL(out).href);
fs.rmSync(out, { force: true });

let failed = 0;
const check = (name, cond) => {
  if (!cond) {
    console.log(`  ✗ ${name}`);
    failed++;
  }
};

// A fixed clock. 2026-09-06 is a Sunday; 10:00 local.
const NOW = new Date(2026, 8, 6, 10, 0, 0, 0);
const DAY = new Date(2026, 8, 6);
const at = (h, m = 0) => new Date(2026, 8, 6, h, m, 0, 0);
const nextDay = (h, m = 0) => new Date(2026, 8, 7, h, m, 0, 0);

/** slot index for a clock time on day 0 */
const slot = (h, m = 0) => (h * 60 + m) / 15;

const input = (over = {}) => ({
  departDate: DAY,
  window: { start: slot(14), end: slot(17) },
  urgent: false,
  arriveAt: null,
  now: NOW,
  ...over,
});

// ---------------------------------------------------------------- slot arithmetic
check('slotToLabel reads midnight', S.slotToLabel(0) === '00:00');
check('slotToLabel reads a quarter past', S.slotToLabel(1) === '00:15');
check('slotToLabel reads 14:00', S.slotToLabel(slot(14)) === '14:00');
check('slotToLabel reads the last slot of a day', S.slotToLabel(95) === '23:45');
// 🔴 The span is TWO days, so a slot past 96 must wrap to ordinary clock time, not read
// as "24:15". A window running past midnight is an ordinary night departure.
check('slotToLabel wraps into the second day', S.slotToLabel(96) === '00:00');
check('slotToLabel wraps a late second-day slot', S.slotToLabel(96 + slot(2)) === '02:00');
check('slotDayOffset is 0 on the first day', S.slotDayOffset(95) === 0);
check('slotDayOffset is 1 on the second', S.slotDayOffset(96) === 1);

check('slotToDate places a time on the day', S.slotToDate(DAY, slot(14)).getTime() === at(14).getTime());
// The failure this guards: a second-day slot silently landing on the FIRST day, which
// would post an overnight departure ~24h early.
check('slotToDate rolls a second-day slot onto tomorrow',
  S.slotToDate(DAY, 96 + slot(2)).getTime() === nextDay(2).getTime());

// ---------------------------------------------------------------- the "past" floor
// ⚠️ Rounds UP: rounding down offers a block that has already begun.
check('firstSelectableSlotToday rounds up', S.firstSelectableSlotToday(at(10, 1)) === slot(10, 15));
check('firstSelectableSlotToday is exact on a boundary', S.firstSelectableSlotToday(at(10, 0)) === slot(10));

// ---------------------------------------------------------------- window normalisation
const w1 = S.normalizeWindow(slot(14), slot(17));
check('normalizeWindow keeps an ordinary drag', w1.start === slot(14) && w1.end === slot(17));
const w2 = S.normalizeWindow(slot(17), slot(14));
check('normalizeWindow accepts a backwards drag', w2.start === slot(14) && w2.end === slot(17));
// 🛑 The cap must move the END that was dragged, never the anchor.
const w3 = S.normalizeWindow(10, 190);
check('normalizeWindow caps a forward drag at the moving end',
  w3.start === 10 && w3.end === 10 + S.MAX_WINDOW_SLOTS);
const w4 = S.normalizeWindow(190, 2);
check('normalizeWindow caps a backward drag at the moving end',
  w4.end === 190 && w4.start === 190 - S.MAX_WINDOW_SLOTS);
check('normalizeWindow never leaves the span', S.normalizeWindow(-50, 900).start >= 0);
check('normalizeWindow never exceeds the span', S.normalizeWindow(-50, 900).end <= S.SPAN_SLOTS - 1);

// ---------------------------------------------------------------- grabbing an edge
const win = { start: 40, end: 60 };
check('a tap on the end edge anchors to the start', S.dragAnchorFor(60, win) === 40);
check('a tap near the end edge anchors to the start', S.dragAnchorFor(61, win) === 40);
check('a tap on the start edge anchors to the end', S.dragAnchorFor(40, win) === 60);
check('a tap in the middle starts a fresh window', S.dragAnchorFor(50, win) === 50);
// A window so small that a tap is near BOTH edges: guessing which edge was meant is worse
// than starting over, so the artboard starts over. Asserted so nobody "improves" it.
check('a tap near both edges of a tiny window starts fresh',
  S.dragAnchorFor(5, { start: 4, end: 6 }) === 5);

// ---------------------------------------------------------------- latest departure
// 🛑 THE DEFECT THIS MODULE EXISTS FOR (step 8f, defect ③).
check('latestDeparture is the END of the window',
  S.latestDeparture(input()).getTime() === at(17).getTime());
check('earliestDeparture is the START of the window',
  S.earliestDeparture(input()).getTime() === at(14).getTime());
check('latestDeparture of an urgent offer is now',
  Math.abs(S.latestDeparture(input({ urgent: true })).getTime() - NOW.getTime()) < 1000);

// ---------------------------------------------------------------- arrival reachability
check('no arrival deadline is always reachable', S.arrivalIsReachable(input()));
check('an arrival after the window end is reachable',
  S.arrivalIsReachable(input({ arriveAt: at(19) })));
check('an arrival exactly at the window end is reachable',
  S.arrivalIsReachable(input({ arriveAt: at(17) })));
// 🔴 "leave 14:00-17:00, arrive by 15:00" — accepted by the passenger app until step 8f.
check('an arrival INSIDE the departure window is refused',
  !S.arrivalIsReachable(input({ arriveAt: at(15) })));
check('an arrival before the whole window is refused',
  !S.arrivalIsReachable(input({ arriveAt: at(12) })));

// ---------------------------------------------------------------- validation
check('a legal schedule has no errors',
  Object.keys(S.validateScheduleWindow(input())).length === 0);
check('a departure inside the advance floor is refused',
  S.validateScheduleWindow(input({ window: { start: slot(10, 15), end: slot(11) } })).start_at ===
    S.SCHEDULE_ERROR_KEYS.minAdvance);
check('a departure just past the advance floor is accepted',
  !S.validateScheduleWindow(input({ window: { start: slot(10, 45), end: slot(11) } })).start_at);
// ⚠️ The exemption is the rule, not a loophole (defect ①).
check('an urgent departure is exempt from the advance floor',
  !S.validateScheduleWindow(input({ urgent: true, window: { start: 0, end: 1 } })).start_at);
check('an unreachable arrival is reported',
  S.validateScheduleWindow(input({ arriveAt: at(15) })).arrive_until ===
    S.SCHEDULE_ERROR_KEYS.arriveBeforeDeparture);
// Both rules are independent and must both fire.
const both = S.validateScheduleWindow(
  input({ window: { start: slot(10, 15), end: slot(11) }, arriveAt: at(10, 30) }),
);
check('both rules report together', !!both.start_at && !!both.arrive_until);

// ---------------------------------------------------------------- the payload
const p1 = S.toSchedulePayload(input());
check('payload start_at is the window start', p1.start_at === at(14).toISOString());
check('payload depart_until is the window end', p1.depart_until === at(17).toISOString());
check('payload omits arrive_until when unset', p1.arrive_until === undefined);
// 🔴 A single-slot window is not a window: "08:00-08:00" is what the passenger would see.
const p2 = S.toSchedulePayload(input({ window: { start: slot(14), end: slot(14) } }));
check('payload omits depart_until for a single-slot window', p2.depart_until === undefined);
check('payload still sends start_at for a single-slot window', p2.start_at === at(14).toISOString());
const p3 = S.toSchedulePayload(input({ arriveAt: at(19) }));
check('payload sends arrive_until when given', p3.arrive_until === at(19).toISOString());
// An overnight window must reach the NEXT day, not fold back onto this one.
const p4 = S.toSchedulePayload(input({ window: { start: slot(22), end: 96 + slot(2) } }));
check('payload carries an overnight window into the next day',
  p4.depart_until === nextDay(2).toISOString());

// ---------------------------------------------------------------- the EDIT path
// 🛑 The half that line 296 of the screen warns about: a field that saves but never
// loads back means the NEXT save silently blanks it.
const DAYS = [0, 1, 2, 3].map((i) => new Date(2026, 8, 6 + i));

const r1 = S.restoreSchedule(DAYS, at(14).toISOString(), at(17).toISOString(), null);
check('restore puts the window back', r1.window.start === slot(14) && r1.window.end === slot(17));
check('restore picks the right day', r1.dayIndex === 0);
check('restore leaves arrival unset when there was none', r1.arriveSlot === null);

const r2 = S.restoreSchedule(DAYS, nextDay(9).toISOString(), null, null);
check('restore finds a later day', r2.dayIndex === 1);
check('restore with no depart_until is a single-slot window',
  r2.window.start === slot(9) && r2.window.end === slot(9));

// 🔴 An overnight window must come back as a SECOND-DAY slot. Dropping the day offset
// redraws 22:00-02:00 as a window running backwards.
const r3 = S.restoreSchedule(DAYS, at(22).toISOString(), nextDay(2).toISOString(), null);
check('restore carries an overnight window past midnight',
  r3.window.start === slot(22) && r3.window.end === 96 + slot(2));

const r4 = S.restoreSchedule(DAYS, at(14).toISOString(), at(17).toISOString(), nextDay(9).toISOString());
check('restore reads the arrival slot', r4.arriveSlot === slot(9));
check('restore reads the arrival day', r4.arriveDayIndex === 1);

check('restore refuses a missing start', S.restoreSchedule(DAYS, null, null, null) === null);
check('restore refuses an unparseable start',
  S.restoreSchedule(DAYS, 'not-a-date', null, null) === null);

/*
 * ⚠️ THAT LAST ASSERTION PASSES FOR TWO REASONS, AND ONLY ONE OF THEM IS THE GUARD.
 * Deleting `restoreSchedule`'s `Number.isNaN(start.getTime())` check leaves it GREEN,
 * because an Invalid Date also fails every `dayIndexOf` comparison and returns -1.
 * (Found by mutation, not by reading — the same Invalid-Date blindness step 16a hit,
 * where every comparison against NaN is false.)
 *
 * So the shadowing behaviour is pinned HERE instead. If `dayIndexOf` is ever loosened
 * to a range test, this goes red and the NaN guard stops being redundant.
 */
check('dayIndexOf rejects an Invalid Date', S.dayIndexOf(DAYS, new Date('nope')) === -1);
check('dayIndexOf finds an exact day', S.dayIndexOf(DAYS, new Date(2026, 8, 7, 23, 59)) === 1);
check('dayIndexOf rejects a day outside the range',
  S.dayIndexOf(DAYS, new Date(2026, 8, 20)) === -1);
// Outside the four offered days: keep the stored value, do NOT snap the driver to today.
check('restore refuses a start outside the offered days',
  S.restoreSchedule(DAYS, new Date(2027, 0, 1, 9).toISOString(), null, null) === null);
// A corrupt end before its own start is not a window.
check('restore refuses to build a backwards window',
  S.restoreSchedule(DAYS, at(17).toISOString(), at(14).toISOString(), null).window.end === slot(17));

// 🛑 ROUND TRIP: save then load must give back what was chosen. This is the assertion
// that would have caught every historical "saves but never loads" defect on this screen.
for (const w of [
  { start: slot(14), end: slot(17) },
  { start: slot(0), end: slot(0, 15) },
  { start: slot(22), end: 96 + slot(2) },
  { start: slot(9), end: slot(9) },
]) {
  const payload = S.toSchedulePayload(input({ window: w }));
  const back = S.restoreSchedule(DAYS, payload.start_at, payload.depart_until, null);
  check(
    `round trip keeps ${S.slotToLabel(w.start)}-${S.slotToLabel(w.end)}`,
    back.window.start === w.start && back.window.end === w.end,
  );
}

// ---------------------------------------------------------------- agreement with the user app
// ⚠️ The two apps are separate by design, so this asserts the SHAPE of the agreement, not
// shared code: both sides must judge arrival against the LATEST departure. The 30/31-minute
// difference in the advance floor is deliberate and is NOT asserted equal — see the module.
check('the advance floor is the driver value, not the passenger one',
  S.MIN_ADVANCE_MS === 30 * 60 * 1000);

if (failed) {
  console.log(`\n✗ ${failed} offer-schedule assertion(s) failed.`);
  process.exit(1);
}
console.log(
  '✓ offer schedule: all assertions pass ' +
    '(slots · window · drag · latest-departure · arrival · payload)',
);

/**
 * ✅ PROVEN ABLE TO FAIL — T-101 step 16c-2. Ten mutations, each applied to
 * `utils/offerSchedule.ts` in turn and then reverted:
 *
 *   latestDeparture uses the window START (defect ③)   -> 6 red  <- THE ONE THAT SHIPPED
 *                                                                  BROKEN ON THE PASSENGER
 *                                                                  SIDE UNTIL STEP 8f
 *   the advance floor stops exempting urgent (defect ①) -> 1 red
 *   normalizeWindow caps the ANCHOR, not the moving end -> 1 red
 *   dragAnchorFor stops grabbing edges                  -> 3 red
 *   slotToLabel stops wrapping past midnight            -> 2 red
 *   slotToDate ignores the day offset                   -> 2 red
 *   firstSelectableSlotToday rounds DOWN                -> 1 red
 *   payload emits depart_until for a single-slot window -> 1 red
 *   arrivalIsReachable flips its comparison             -> 5 red
 *   MIN_ADVANCE_MS quietly becomes the user app's 31    -> 1 red
 *
 * ✅ AND FIVE MORE FOR THE EDIT PATH:
 *
 *   restoreSchedule drops the overnight day offset      -> 2 red
 *   dateToSlot rounds UP instead of down                -> 9 red
 *   restoreSchedule ignores arrive_until                -> 1 red
 *   restoreSchedule accepts a backwards window          -> 1 red
 *   dayIndexOf stops rejecting an Invalid Date          -> 1 red
 *
 * 🔴 ONE MUTATION CAME BACK **GREEN** AND CHANGED THIS FILE: deleting
 * `restoreSchedule`'s `Number.isNaN` guard broke nothing, because an Invalid Date also
 * fails `dayIndexOf` and returns -1. The "restore refuses an unparseable start"
 * assertion had been passing for the wrong reason. The shadowing is now pinned by the
 * `dayIndexOf` cases above instead of being assumed away.
 *
 * ⚠️ It passed on the FIRST run, before any mutation. That is not evidence — a checker
 * that has never been red has proven nothing about itself.
 */
