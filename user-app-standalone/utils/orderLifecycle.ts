/**
 * The order list's lifecycle rules, as pure functions. T-101 step 9.
 *
 * 🔴 THE ARTBOARD'S THREE MODES ARE NOT STATUS FILTERS. `UserMyOrder.dc.html` groups by
 * `(done || cancelled) ? "tarix" : step === 0 ? "jarayon" : "aktiv"` — a LIFECYCLE
 * STAGE, derived from where the order has got to, not from a status name. That is why
 * this merge was possible at all: the passenger's two lists (their own ride requests and
 * their bookings on drivers' offers) are two halves of one journey, and the artboard
 * groups them the way a passenger thinks about them:
 *
 *   jarayon  "I have asked. Nobody has agreed yet."
 *   aktiv    "It is agreed. The ride has not happened yet."
 *   tarix    "It is over — done, refused or cancelled."
 *
 * The two screens this replaced sliced the same journey by SOURCE (whose offer was it?),
 * which is an implementation detail the passenger has no reason to care about. Their
 * status tabs also disagreed with each other: `MyBookings` had all/pending/confirmed,
 * `MyPassengerOffers` had all/published/completed/cancelled.
 *
 * These are pure and dependency-free so the grouping can be reasoned about — and checked
 * — without a React tree. ⚠️ The user app has NO test runner (CLAUDE.md: only the API
 * does), so the cases live in `scripts/check-order-lifecycle.mjs`, which imports this
 * module rather than copying it.
 */

/** The artboard's three modes, in its own order. */
export type OrderMode = 'jarayon' | 'aktiv' | 'tarix';

export const ORDER_MODES: readonly OrderMode[] = ['jarayon', 'aktiv', 'tarix'] as const;

/**
 * How long a `published` ride request stays visible to drivers after its departure.
 *
 * ⚠️ Mirrors `PASSENGER_OFFER_BROWSE_GRACE_MS` in the API (`src/constants/index.ts`),
 * which is the source of truth. T-039 established both the value and this warning: if
 * the server's window changes, change it here in the SAME commit. Two numbers drifting
 * apart is the exact bug T-039 existed to fix.
 */
export const BROWSE_GRACE_MS = 3 * 60 * 60 * 1000;

/**
 * A ride request the passenger posted, seen only through the fields this rule needs.
 * Structural rather than importing `PassengerOffer`, so the rules stay free of the API
 * layer and the checker can build cases by hand.
 */
export interface OfferLike {
  status: string;
  /** ISO departure time. */
  start_at: string;
}

/** A booking the passenger made on a driver's offer. */
export interface BookingLike {
  status: string;
  /** The DRIVER's offer; absent on a malformed row. */
  offer?: { start_at: string } | null;
}

/**
 * T-039 — a `published` request drops out of the driver browse once it is more than
 * the grace period past its departure, but nothing writes an `expired` status: the row
 * really is still published and still cancellable. Only the LABEL is derived, and
 * giving it a stored state would need a migration plus something to write it.
 */
export const isExpiredOffer = (offer: OfferLike, now: number = Date.now()): boolean =>
  offer.status === 'published' &&
  new Date(offer.start_at).getTime() < now - BROWSE_GRACE_MS;

/** The status to DISPLAY for a ride request — the real one, unless it quietly expired. */
export const displayOfferStatus = (offer: OfferLike, now: number = Date.now()): string =>
  isExpiredOffer(offer, now) ? 'expired' : offer.status;

/**
 * Which mode a ride request belongs to.
 *
 * ⚠️ AN EXPIRED REQUEST IS HISTORY, NOT WAITING. It is still `published` and still
 * cancellable, but no driver can see it any more, so leaving it under "Jarayonda"
 * would repeat T-039's exact defect in a new place: telling the passenger something is
 * live when nobody can act on it.
 */
export const offerMode = (offer: OfferLike, now: number = Date.now()): OrderMode => {
  if (offer.status === 'driver_found') return 'aktiv';
  if (offer.status === 'published') return isExpiredOffer(offer, now) ? 'tarix' : 'jarayon';
  // completed, cancelled, archived, and anything the server adds later.
  return 'tarix';
};

/**
 * Which mode a booking belongs to.
 *
 * ⚠️ A CONFIRMED BOOKING BECOMES HISTORY ONCE THE RIDE HAS DEPARTED. Nothing marks a
 * ride "finished" — there is no such status on `OfferPassenger` — so a booking confirmed
 * for last Tuesday would otherwise sit under "Faol" forever. The departure time is the
 * only signal available, and it is the same one `canRateBooking` already trusted to
 * decide the ride had happened.
 *
 * ⚠️ A booking with no `offer` cannot be placed by time. It is treated as history rather
 * than active: claiming a ride is upcoming when we cannot see when it leaves is the
 * worse error.
 */
export const bookingMode = (booking: BookingLike, now: number = Date.now()): OrderMode => {
  if (booking.status === 'pending') return 'jarayon';
  if (booking.status === 'confirmed') {
    const startAt = booking.offer?.start_at;
    if (!startAt) return 'tarix';
    return new Date(startAt).getTime() > now ? 'aktiv' : 'tarix';
  }
  // rejected, cancelled.
  return 'tarix';
};

/**
 * T-051 — newest-created first.
 *
 * ⚠️ The server orders ride requests by `start_at DESC` (departure), which is NOT what
 * the passenger expects on their own list: an order created today for a trip next month
 * would sit above one created a minute ago for tomorrow. The owner asked for "last
 * created on top". Now that two sources share one list this matters more, not less —
 * it is the only key both record types have in common.
 */
export const byNewestCreated = <T extends { created_at?: string; id: string | number }>(
  a: T,
  b: T,
): number => {
  const at = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
  if (bt !== at) return bt - at;
  // `id` is the tie-breaker — monotonic, so two rows created in the same second still
  // order sensibly. Bookings carry a string id, requests a number; compare as strings
  // only when a numeric comparison is meaningless.
  const an = Number(a.id);
  const bn = Number(b.id);
  if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return bn - an;
  return String(b.id).localeCompare(String(a.id));
};
