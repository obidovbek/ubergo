/**
 * T-118 step 1 — the first Jest test in the user app.
 *
 * Pins the order form's time rules (`rideTime.ts`, T-101 step 8f). The same rules are
 * pinned by `scripts/check-ride-time.mjs`; that checker MIRRORS the functions, this test
 * imports the real module — so the two runners are shown to agree on the same rules, and
 * a drift between the copy and the code would surface here first.
 *
 * Every date is built in LOCAL time on purpose: the rules combine a day with a clock time
 * through `setHours`, which is local, and a UTC fixture would pass or fail by timezone.
 */
import { describe, expect, it } from '@jest/globals';

import { MIN_ADVANCE_MS, arrivalIsReachable, combineDateTime, latestDeparture } from './rideTime';

/** 20 September 2026, midnight local. */
const day = new Date(2026, 8, 20, 0, 0, 0, 0);
/** A clock time on some unrelated day — only hours and minutes matter. */
const at = (hours: number, minutes = 0) => new Date(2000, 0, 1, hours, minutes, 0, 0);
/** "Now + 31 min" as the form would compute it, on the same day. */
const floor = new Date(2026, 8, 20, 12, 31, 0, 0);

const scheduled = (departFrom: Date | null, departUntil: Date | null) =>
  latestDeparture({ isUrgent: false, departDate: day, departFrom, departUntil, floor });

describe('MIN_ADVANCE_MS', () => {
  it('is 31 minutes, and applies to SCHEDULED orders only', () => {
    expect(MIN_ADVANCE_MS).toBe(31 * 60 * 1000);
  });
});

describe('combineDateTime', () => {
  it('puts the clock time onto the day and zeroes the seconds', () => {
    const out = combineDateTime(day, at(8, 30));
    expect([out.getFullYear(), out.getMonth(), out.getDate()]).toEqual([2026, 8, 20]);
    expect([out.getHours(), out.getMinutes(), out.getSeconds(), out.getMilliseconds()]).toEqual([
      8, 30, 0, 0,
    ]);
  });

  it('does not mutate the day it was given', () => {
    const copy = new Date(day);
    combineDateTime(day, at(23, 59));
    expect(day.getTime()).toBe(copy.getTime());
  });
});

describe('latestDeparture', () => {
  it('is the END of the window when the passenger gave one — defect ③', () => {
    // "leave 08:00–11:00, arrive by 09:00" must be refused; only the END makes that visible.
    expect(scheduled(at(8), at(11)).getHours()).toBe(11);
  });

  it('is the start when there is no end', () => {
    expect(scheduled(at(8), null).getHours()).toBe(8);
  });

  it('is the floor when no time was chosen at all', () => {
    expect(scheduled(null, null).getTime()).toBe(floor.getTime());
  });

  it('lands on the departure DAY, not on the clock time’s own day — defect ④', () => {
    const out = scheduled(at(8), at(11));
    expect([out.getFullYear(), out.getMonth(), out.getDate()]).toEqual([2026, 8, 20]);
  });

  it('is "now" for an urgent order — the exemption is the rule, not a loophole (①)', () => {
    const before = Date.now();
    const out = latestDeparture({
      isUrgent: true,
      departDate: day,
      departFrom: at(8),
      departUntil: at(11),
      floor,
    });
    expect(out.getTime()).toBeGreaterThanOrEqual(before);
    expect(out.getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe('arrivalIsReachable', () => {
  const latest = combineDateTime(day, at(11));

  it('a missing arrival is always fine — the field is optional', () => {
    expect(arrivalIsReachable(null, latest)).toBe(true);
  });

  it('refuses an arrival BEFORE the latest departure', () => {
    expect(arrivalIsReachable(combineDateTime(day, at(9)), latest)).toBe(false);
  });

  it('accepts an arrival at the latest departure exactly', () => {
    expect(arrivalIsReachable(combineDateTime(day, at(11)), latest)).toBe(true);
  });

  it('accepts an arrival after it', () => {
    expect(arrivalIsReachable(combineDateTime(day, at(12)), latest)).toBe(true);
  });
});
