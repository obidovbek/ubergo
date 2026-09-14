/**
 * How many live orders the passenger is holding, for the `Faol buyurtma: n / 2` chip. T-115.
 *
 * 🔴 THIS MIRRORS THE SERVER AND IS NOT THE AUTHORITY. The ceiling is enforced in
 * `api/src/utils/activeOffers.ts`, which refuses a third order with a 409 whatever this file
 * says. What lives here is only the COUNT THE PASSENGER IS SHOWN — being refused after filling
 * in a whole form is a bad way to learn a rule.
 *
 * ⚠️ THE TWO DEFINITIONS MUST AGREE. `scripts/check-active-offers.mjs` asserts this one against
 * the API's own source, so divergence shows up as a red check rather than a chip that lies.
 *
 * 🔴 THE PASSENGER'S STATUS LIST IS NOT THE DRIVER'S. `driver_found` counts here — a matched
 * order has not travelled yet, so the slot is genuinely occupied — and that status does not
 * exist on the driver side at all. The API keeps two lists for exactly this reason.
 *
 * ⚠️ NOT THE SAME QUESTION AS `useHomeOrders`'s `ACTIVE_STATUSES`. That one picks which order
 * the home banner shows and deliberately ignores departure time; this one answers "how many
 * slots are taken", which the server settles on status AND a departure still ahead. Two
 * similar-looking lists, two different jobs — merging them would break the banner.
 */

/** ⚠️ Must equal `MAX_ACTIVE_OFFERS` in the API. */
export const MAX_ACTIVE_OFFERS = 2;

/** ⚠️ Must equal `PASSENGER_ACTIVE_STATUSES` in the API. */
export const PASSENGER_ACTIVE_STATUSES: readonly string[] = ['published', 'driver_found'];

export interface ActiveOfferLike {
  status: string;
  start_at: string | Date | null | undefined;
}

export const isActiveOffer = (offer: ActiveOfferLike, now: Date): boolean => {
  if (!PASSENGER_ACTIVE_STATUSES.includes(offer.status)) return false;
  const startAt =
    offer.start_at instanceof Date ? offer.start_at : new Date(offer.start_at as string);
  if (Number.isNaN(startAt.getTime())) return false;
  return startAt.getTime() >= now.getTime();
};

export const countActiveOffers = (
  offers: readonly ActiveOfferLike[],
  now: Date = new Date(),
): number => offers.filter((o) => isActiveOffer(o, now)).length;

export const isAtActiveLimit = (activeCount: number): boolean =>
  activeCount >= MAX_ACTIVE_OFFERS;
