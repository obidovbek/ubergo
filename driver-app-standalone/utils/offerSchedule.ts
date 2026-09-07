/**
 * The offer's DEPARTURE WINDOW and ARRIVAL DEADLINE, as pure functions.
 * T-101 step 16c-2 (`docs/PLAN-T101-step16.md`).
 *
 * 🔴 WHAT THIS STEP ACTUALLY UNLOCKS. `driver_offers` has carried `depart_until`,
 * `arrive_from` and `arrive_until` since T-080. `loadExistingOffer` reads all three and
 * `handleSave` spreads them straight back out — so they round-trip on edit. **But the
 * wizard has never had a control that SETS any of them.** The driver could only ever say
 * "I leave at 08:00", never "I leave between 08:00 and 11:00" — which is what the artboard
 * draws and what the passenger side already reads. *Verified against `handleSave`, not
 * assumed: nothing here is fixing a data-loss bug, it is filling a hole in the form.*
 *
 * 🔴 WHY THE RULES COME BEFORE THE RULER. Step 8f found FOUR defects in exactly this model
 * on the passenger side, and three of them were invisible while the rules lived inline
 * among a form's state. The worst was silent: *"leave 08:00–11:00, arrive by 09:00"* was
 * ACCEPTED, because arrival was compared against the START of the window. That is a promise
 * the offer cannot keep the moment the driver uses the window they were granted.
 *
 * So the driver side gets the rules FIRST, pure and executed
 * (`scripts/check-offer-schedule.mjs`), before any drag gesture exists to hide them in.
 *
 * ⚠️ THE USER APP ALREADY SOLVED THIS — see `user-app-standalone/utils/rideTime.ts`. These
 * functions deliberately agree with it (`latestDeparture` / `arrivalIsReachable` have the
 * same meaning here), because a passenger's order and a driver's offer are matched against
 * each other. **They are NOT shared code**: the two apps are separate by design (see
 * CLAUDE.md), so the agreement is asserted in the checker rather than assumed.
 *
 * ⚠️ PURE — no React, no react-native, no `t()`. That is what lets the checker execute it.
 */

/** The artboard's ruler is 15-minute blocks; `TIME_SLOTS` there is 96 of them per day. */
export const SLOT_MINUTES = 15;

/** Slots in one day: 24 × 60 / 15. */
export const SLOTS_PER_DAY = 96;

/**
 * The ruler spans TWO days (the artboard's `SPAN_LEN`), so a window may run past midnight
 * — "22:00–02:00" is an ordinary night departure, not an error.
 */
export const SPAN_SLOTS = 192;

/**
 * The widest window the driver may give, in slots (the artboard's `MAX_RANGE`).
 *
 * ⚠️ 95 slots is just under 24 hours. It is a cap on VAGUENESS, not on the trip: an offer
 * that says "some time in the next two days" tells a passenger nothing they can plan
 * around, and the passenger app renders the window as a promise.
 */
export const MAX_WINDOW_SLOTS = 95;

/**
 * How far ahead a scheduled offer must depart.
 *
 * 🔴 THIS WAS HARDCODED AS `30 * 60 * 1000` IN FOUR PLACES in `OfferWizardScreen`, beside a
 * fifth copy in `offerWizardValidation.ts`'s `RULES.minAdvanceMs`. Five copies of one number
 * is how the two halves of a rule drift apart — the exact shape of defect ① on the
 * passenger side, where a 31-minute floor and an urgent flag disagreed about the same thing.
 *
 * ⚠️ IT IS 30 HERE AND **31** IN THE USER APP (`rideTime.MIN_ADVANCE_MS`). That difference
 * is real and is NOT reconciled here: a passenger's *order* and a driver's *offer* are
 * different objects with different deadlines, and changing either without the owner is a
 * behaviour change dressed up as a cleanup. The checker asserts the driver's value only,
 * and this note exists so the next person does not "tidy" one into the other.
 */
export const MIN_ADVANCE_MS = 30 * 60 * 1000;

/** `slotIndex` -> "HH:MM", wrapping at midnight so day 2 reads as ordinary clock time. */
export const slotToLabel = (slot: number): string => {
  const minutes = ((slot % SLOTS_PER_DAY) + SLOTS_PER_DAY) % SLOTS_PER_DAY * SLOT_MINUTES;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Which day of the span a slot falls on: 0 = the chosen date, 1 = the next. */
export const slotDayOffset = (slot: number): number => Math.floor(slot / SLOTS_PER_DAY);

/**
 * The first slot the driver may still pick TODAY — everything before it is in the past.
 *
 * ⚠️ Rounds UP (`ceil`), never down. Rounding down would offer a block that has already
 * started, and the offer would be posted for a departure in the past.
 */
export const firstSelectableSlotToday = (now: Date): number =>
  Math.ceil((now.getHours() * 60 + now.getMinutes()) / SLOT_MINUTES);

/** Put a slot onto a date, giving a real instant. */
export const slotToDate = (day: Date, slot: number): Date => {
  const out = new Date(day);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() + slotDayOffset(slot));
  const minutes = (slot % SLOTS_PER_DAY) * SLOT_MINUTES;
  out.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return out;
};

export interface WindowSelection {
  start: number;
  end: number;
}

/**
 * Turn a raw drag into a legal window.
 *
 * The artboard's `trackUp`: a drag has an anchor and a moving end, either order, and the
 * cap is applied to whichever end MOVED — dragging left past the cap must not silently
 * drag the anchor along with it.
 */
export const normalizeWindow = (anchor: number, moving: number): WindowSelection => {
  let lo = Math.min(anchor, moving);
  let hi = Math.max(anchor, moving);
  if (hi - lo > MAX_WINDOW_SLOTS) {
    if (moving >= anchor) hi = lo + MAX_WINDOW_SLOTS;
    else lo = hi - MAX_WINDOW_SLOTS;
  }
  return { start: clampSlot(lo), end: clampSlot(hi) };
};

export const clampSlot = (slot: number): number =>
  Math.max(0, Math.min(SPAN_SLOTS - 1, Math.round(slot)));

/**
 * Grabbing near an existing edge should MOVE that edge, not start a new window — the
 * artboard's `nearStart`/`nearEnd` test. Returns the slot to anchor against.
 *
 * ⚠️ When a tap is near BOTH edges the window is tiny, and the artboard deliberately
 * starts a fresh selection rather than guessing which edge was meant.
 */
export const dragAnchorFor = (
  tapped: number,
  window: WindowSelection,
  tolerance = 2,
): number => {
  const nearStart = Math.abs(tapped - window.start) <= tolerance;
  const nearEnd = Math.abs(tapped - window.end) <= tolerance;
  if (nearEnd && !nearStart) return window.start;
  if (nearStart && !nearEnd) return window.end;
  return tapped;
};

export interface ScheduleInput {
  /** The day the window starts on. */
  departDate: Date;
  window: WindowSelection;
  /** "Hoziroq" — an on-demand departure, exempt from the advance floor. */
  urgent: boolean;
  /** The arrival deadline, or null when the driver did not give one. */
  arriveAt: Date | null;
  now: Date;
}

export interface ScheduleErrors {
  start_at?: string;
  arrive_until?: string;
}

export const SCHEDULE_ERROR_KEYS = {
  minAdvance: 'offerWizard.errorMinAdvance',
  arriveBeforeDeparture: 'offerWizard.errorArriveBeforeDeparture',
} as const;

/**
 * 🛑 THE LATEST moment the driver may set off.
 *
 * This is the whole point of the module. An offer that says "08:00–11:00" has promised the
 * passenger nothing earlier than 11:00, so **11:00 is the only honest basis** for judging
 * "I will be there by X". Comparing against 08:00 — defect ③ on the passenger side —
 * accepts an arrival that is already impossible.
 */
export const latestDeparture = (input: ScheduleInput): Date =>
  input.urgent ? new Date(input.now) : slotToDate(input.departDate, input.window.end);

/** The instant the window opens — what goes to the API as `start_at`. */
export const earliestDeparture = (input: ScheduleInput): Date =>
  input.urgent ? new Date(input.now) : slotToDate(input.departDate, input.window.start);

/** Is the arrival deadline keepable? A missing deadline always is — the field is optional. */
export const arrivalIsReachable = (input: ScheduleInput): boolean =>
  !input.arriveAt || input.arriveAt.getTime() >= latestDeparture(input).getTime();

/**
 * Every schedule rule, as translation KEYS. Mirrors `offerWizardValidation`'s shape so the
 * screen translates both the same way.
 */
export const validateScheduleWindow = (input: ScheduleInput): ScheduleErrors => {
  const errors: ScheduleErrors = {};

  // ⚠️ The advance floor is a rule about SCHEDULED offers. An urgent departure is a
  // different promise and is legitimately exempt — the passenger side settled this
  // (defect ①), where a floor and an urgent flag contradicted each other silently.
  if (!input.urgent) {
    const start = earliestDeparture(input);
    if (start.getTime() < input.now.getTime() + MIN_ADVANCE_MS) {
      errors.start_at = SCHEDULE_ERROR_KEYS.minAdvance;
    }
  }

  if (!arrivalIsReachable(input)) {
    errors.arrive_until = SCHEDULE_ERROR_KEYS.arriveBeforeDeparture;
  }

  return errors;
};

/** What the form sends. `depart_until` is omitted when the window is a single slot. */
export interface SchedulePayload {
  start_at: string;
  depart_until?: string;
  arrive_until?: string;
}

export const toSchedulePayload = (input: ScheduleInput): SchedulePayload => {
  const start = earliestDeparture(input);
  const end = latestDeparture(input);
  return {
    start_at: start.toISOString(),
    // A window of one slot is not a window; sending `depart_until === start_at` would
    // render as "08:00-08:00" on the passenger side.
    depart_until:
      end.getTime() > start.getTime() ? end.toISOString() : undefined,
    arrive_until: input.arriveAt ? input.arriveAt.toISOString() : undefined,
  };
};

/**
 * A clock time -> its slot on the ruler's FIRST day (0..95).
 *
 * ⚠️ Rounds DOWN here, unlike `firstSelectableSlotToday`. This reads a value that was
 * already saved, so it must land on the block the driver actually chose; rounding up
 * would nudge a stored 08:00 to 08:15 every time the offer was reopened.
 */
export const dateToSlot = (date: Date): number =>
  Math.floor((date.getHours() * 60 + date.getMinutes()) / SLOT_MINUTES);

/** Which of `days` a date falls on, or -1 when it is outside the offered range. */
export const dayIndexOf = (days: Date[], date: Date): number =>
  days.findIndex(
    (d) =>
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate(),
  );

export interface RestoredSchedule {
  dayIndex: number;
  window: WindowSelection;
  arriveDayIndex: number;
  arriveSlot: number | null;
}

/**
 * 🛑 THE EDIT PATH. Turn a saved offer's instants back into ruler positions.
 *
 * This is the half that `OfferWizardScreen` has always got wrong somewhere — line 296's
 * warning that a field which saves but never loads back means *"the next save silently
 * blanks them"*. The departure window is the newest place that could happen, so the
 * conversion is pure and asserted rather than written inline in `loadExistingOffer`.
 *
 * ⚠️ A `departUntil` on the day AFTER the start becomes a second-day slot (>= 96), which
 * is how the ruler represents an overnight window. Dropping that offset would redraw a
 * 22:00–02:00 window as 22:00–02:00 on the SAME day: a window running backwards.
 */
export const restoreSchedule = (
  days: Date[],
  startAt: string | null | undefined,
  departUntil: string | null | undefined,
  arriveUntil: string | null | undefined,
): RestoredSchedule | null => {
  if (!startAt) return null;
  const start = new Date(startAt);
  /*
   * ⚠️ REDUNDANT TODAY, AND KEPT DELIBERATELY. An Invalid Date also fails every
   * `dayIndexOf` comparison below and returns -1, so removing this line leaves the
   * checker green — proven by mutation, not assumed. It stays because the day lookup
   * is what happens to shadow it, and a later change there (a range test instead of an
   * exact match) would let a NaN through silently. `check-offer-schedule.mjs` pins the
   * shadowing behaviour so that change goes red.
   */
  if (Number.isNaN(start.getTime())) return null;

  const dayIndex = dayIndexOf(days, start);
  if (dayIndex < 0) return null;

  const startSlot = dateToSlot(start);
  let endSlot = startSlot;

  if (departUntil) {
    const end = new Date(departUntil);
    if (!Number.isNaN(end.getTime())) {
      const dayGap = Math.round(
        (new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() -
          new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) /
          86400000,
      );
      endSlot = clampSlot(dateToSlot(end) + dayGap * SLOTS_PER_DAY);
      // A stored end at or before the start is not a window; fall back to the start.
      if (endSlot < startSlot) endSlot = startSlot;
    }
  }

  let arriveSlot: number | null = null;
  let arriveDayIndex = dayIndex;
  if (arriveUntil) {
    const arrive = new Date(arriveUntil);
    if (!Number.isNaN(arrive.getTime())) {
      arriveSlot = dateToSlot(arrive);
      const found = dayIndexOf(days, arrive);
      arriveDayIndex = found >= 0 ? found : dayIndex;
    }
  }

  return {
    dayIndex,
    window: { start: startSlot, end: endSlot },
    arriveDayIndex,
    arriveSlot,
  };
};
