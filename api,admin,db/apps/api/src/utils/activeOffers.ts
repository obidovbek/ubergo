/**
 * How many live offers one person may hold at once. T-115.
 *
 * Owner, 2026-09-13: *"user or driver have possibility max two active offers"* — and the
 * driver artboard had already drawn it: `DriverMyOrder.dc.html` carries `MAX_ELON = 2`, a
 * `Faol e'lon: n / 2` counter, and the note *"Limit to'ldi — yangi e'lon berish uchun reysni
 * yakunlang yoki bekor qiling."* T-110 ⑥ recorded that none of it was enforced anywhere and
 * said why that matters: **a ceiling the server does not enforce is decoration that lies.**
 *
 * 🔴 "ACTIVE" IS TWO CONDITIONS, NOT ONE, AND THE SECOND IS THE ONE THAT IS EASY TO MISS.
 *
 * ① A LIVE STATUS. The two sides do not share a status list: a driver offer is live only when
 *    `published`, while a passenger's order is still live once a driver has been found
 *    (`driver_found`) — the ride has not happened yet, so the slot is genuinely occupied.
 *    `archived`, `cancelled` and `completed` are history on both sides.
 *
 * ② A DEPARTURE STILL AHEAD. A `published` offer whose `start_at` has passed is already
 *    invisible to everyone: the search filters `start_at >= now`
 *    (`DriverOfferService.searchOffers`). Counting it would lock a driver out of the
 *    marketplace over rows nobody can see and they never cancelled, and the lock-out would
 *    last for ever because nothing ages a row out of `published`. So yesterday's offer frees
 *    its slot at departure, which is the same moment the rest of the system stops showing it.
 *
 * ⚠️ THE LIMIT IS ON CREATING, NOT ON HOLDING. Editing a live offer must never be refused —
 * it creates nothing. Re-publishing an archived or cancelled one MUST be checked, though: it
 * is a new live offer by any other name, and without that check the ceiling is trivially
 * bypassed (fill up, archive one, create, re-publish the archived one → three).
 *
 * ⚠️ PURE. No Sequelize, no request. The services build their queries from the constants
 * exported here, so the rule and the `WHERE` cannot drift apart.
 */

/** Owner's number, and the artboard's `MAX_ELON`. */
export const MAX_ACTIVE_OFFERS = 2;

/**
 * The statuses that occupy a slot, per side.
 *
 * ⚠️ Two separate lists ON PURPOSE. They are not the same set and sharing one would quietly
 * make `driver_found` count on a side that has no such status.
 */
export const DRIVER_ACTIVE_STATUSES = ['published'] as const;
export const PASSENGER_ACTIVE_STATUSES = ['published', 'driver_found'] as const;

export interface OfferLike {
  status: string;
  start_at: Date | string | null | undefined;
}

/** Is this one offer occupying a slot right now? */
export const isActiveOffer = (
  offer: OfferLike,
  activeStatuses: readonly string[],
  now: Date,
): boolean => {
  if (!activeStatuses.includes(offer.status)) return false;

  /*
   * ⚠️ No explicit null check, and that is deliberate rather than an oversight: a mutation
   * run proved one could not change any answer. `new Date(null)` is the epoch — in the past,
   * so already excluded — and `new Date(undefined)` is an Invalid Date, caught on the next
   * line. A branch that cannot alter the result is a branch no test can defend.
   */
  const startAt =
    offer.start_at instanceof Date ? offer.start_at : new Date(offer.start_at as string);
  if (Number.isNaN(startAt.getTime())) return false;
  return startAt.getTime() >= now.getTime();
};

export const countActiveOffers = (
  offers: readonly OfferLike[],
  activeStatuses: readonly string[],
  now: Date,
): number => offers.filter((o) => isActiveOffer(o, activeStatuses, now)).length;

/**
 * May one more be opened?
 *
 * 🔴 `>=`, not `>`. With the ceiling at 2, a person already holding 2 must be refused the
 * third — `activeCount > MAX` would let them reach 3 before complaining.
 */
export const isAtActiveLimit = (activeCount: number): boolean =>
  activeCount >= MAX_ACTIVE_OFFERS;

/** What is left. Never negative, even if existing data is already over the ceiling. */
export const remainingActiveSlots = (activeCount: number): number =>
  Math.max(0, MAX_ACTIVE_OFFERS - activeCount);
