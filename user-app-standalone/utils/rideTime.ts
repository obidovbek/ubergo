/**
 * The order form's time rules, as pure functions. T-101 step 8f.
 *
 * 🔴 EXTRACTED BECAUSE THE OWNER ASKED WHETHER THE DESIGN'S TIME MODEL WAS LOGICAL
 * (2026-09-01). It was not, in four ways — and three of them were invisible while the
 * rules lived inline among the form's state:
 *
 *   ① **"Hoziroq" both was and was not allowed.** `MIN_ADVANCE_MS` refused any
 *      departure sooner than 31 minutes, while an urgent order set `start_at = now` and
 *      skipped the check. Two contradictory rules, with a toggle picking the winner.
 *      → Resolved, not patched: the minimum is a rule about SCHEDULED orders (it stops
 *      one being posted too late for a driver to plan around). An on-demand hail is a
 *      different thing and is legitimately exempt. Owner confirmed.
 *
 *   ② **"Arrival time" was really "arrive by".** The API has `arrive_from` AND
 *      `arrive_until`; the form only ever sent `arrive_until`, and the sheet only offers
 *      one time. The label promised a window the app never had. → Label corrected.
 *
 *   ③ **Arrival was compared against the START of the departure window.** So
 *      "leave 08:00–11:00, arrive by 09:00" was accepted — an order already impossible
 *      the moment the driver uses the window the passenger granted them.
 *      → Now compared against `latestDeparture`.
 *
 *   ④ **Departure and arrival had independent dates.** "Leave 5 Sept, arrive 3 Sept"
 *      was expressible; only ③'s broken check stood in the way. → The arrival day now
 *      defaults to the departure day; an overnight trip is set explicitly.
 *
 * These are pure and dependency-free so the rules can be reasoned about — and tested —
 * without a React tree. ⚠️ The user app has NO test runner (CLAUDE.md: only the API
 * does), so adding one needs the owner's approval. Until then the cases live in
 * `scripts/check-ride-time.mjs`, which mirrors these functions and was proven to go red
 * against the old rule.
 */

/**
 * How far ahead a SCHEDULED order must be posted.
 *
 * ⚠️ Does not apply to urgent ("Hoziroq") orders — see ① above. That exemption is the
 * rule, not a loophole.
 */
export const MIN_ADVANCE_MS = 31 * 60 * 1000;

/** Puts a clock time onto a given day. */
export const combineDateTime = (day: Date, time: Date): Date => {
  const out = new Date(day);
  out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return out;
};

interface DepartureInput {
  isUrgent: boolean;
  departDate: Date;
  /** Start of the departure window. */
  departFrom: Date | null;
  /** End of the window, when the passenger gave one. */
  departUntil: Date | null;
  /** Fallback when no time is chosen yet — normally `now + MIN_ADVANCE_MS`. */
  floor: Date;
}

/**
 * The LATEST moment the driver may set off — the only departure the passenger has
 * committed to being no later than, and therefore the only honest basis for "I must be
 * there by X".
 *
 * ⚠️ NOT the earliest. Using the window's start is defect ③ above.
 */
export const latestDeparture = ({
  isUrgent,
  departDate,
  departFrom,
  departUntil,
  floor,
}: DepartureInput): Date => {
  if (isUrgent) return new Date();
  if (departUntil) return combineDateTime(departDate, departUntil);
  if (departFrom) return combineDateTime(departDate, departFrom);
  return floor;
};

/**
 * Is the arrival deadline keepable?
 *
 * `null` arrival is always fine — the field is optional, and most passengers on a shared
 * ride do not control when they get there.
 */
export const arrivalIsReachable = (
  arriveUntil: Date | null,
  latest: Date,
): boolean => !arriveUntil || arriveUntil.getTime() >= latest.getTime();
