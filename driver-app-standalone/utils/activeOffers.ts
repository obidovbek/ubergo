/**
 * How many live offers the driver is holding, for the `Faol e'lon: n / 2` chip. T-115.
 *
 * 🔴 THIS MIRRORS THE SERVER AND IS NOT THE AUTHORITY. The ceiling is enforced in
 * `api/src/utils/activeOffers.ts`, which refuses a third offer with a 409 whatever this file
 * says. What lives here is only the COUNT THE DRIVER IS SHOWN — and it exists because being
 * refused after filling in a whole form is a bad way to learn a rule. T-110 ⑥ put it the other
 * way round: *"a ceiling the server does not enforce is decoration that lies."* The inverse is
 * also true — a rule with no visible signal is an ambush.
 *
 * ⚠️ THE TWO DEFINITIONS MUST AGREE, AND THE RISK IS REAL: they are two files in two languages.
 * `scripts/check-active-offers.mjs` asserts this one against the statuses the API documents, so
 * a change on one side shows up as a red check rather than as a chip that quietly miscounts.
 *
 * "Active" is the server's two conditions, restated:
 *   ① a live status — for a DRIVER that is `published` alone
 *   ② a departure still ahead — the search hides `start_at < now`, so a departed offer is
 *      invisible to everyone and must not hold a slot
 */

/** ⚠️ Must equal `MAX_ACTIVE_OFFERS` in the API, and `MAX_ELON` in `DriverMyOrder.dc.html`. */
export const MAX_ACTIVE_OFFERS = 2;

/** ⚠️ Must equal `DRIVER_ACTIVE_STATUSES` in the API. A driver offer is live only when published. */
export const DRIVER_ACTIVE_STATUSES: readonly string[] = ['published'];

export interface ActiveOfferLike {
  status: string;
  start_at: string | Date | null | undefined;
}

export const isActiveOffer = (offer: ActiveOfferLike, now: Date): boolean => {
  if (!DRIVER_ACTIVE_STATUSES.includes(offer.status)) return false;
  const startAt = offer.start_at instanceof Date ? offer.start_at : new Date(offer.start_at as string);
  if (Number.isNaN(startAt.getTime())) return false;
  return startAt.getTime() >= now.getTime();
};

export const countActiveOffers = (
  offers: readonly ActiveOfferLike[],
  now: Date = new Date(),
): number => offers.filter((o) => isActiveOffer(o, now)).length;

export const isAtActiveLimit = (activeCount: number): boolean =>
  activeCount >= MAX_ACTIVE_OFFERS;
