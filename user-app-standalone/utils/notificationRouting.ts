/**
 * Push notification tap routing (OR-010 item 5)
 *
 * Tapping a system notification used to do nothing but cold-open the app on its
 * default screen — there was no tap handler anywhere in the project. This module
 * turns a tapped notification into a destination, and holds it until there is
 * somewhere to send it.
 *
 * The waiting is the whole difficulty. A tap can arrive long before the app can
 * act on it:
 *   - on a COLD START `getInitialNotification()` resolves while the splash is
 *     still up and NavigationContainer has not mounted;
 *   - `MainNavigator` only mounts once the user is authenticated AND their
 *     profile is complete (see RootNavigator), which may be several seconds and
 *     an API round-trip later — or never, if they are logged out.
 * So a tap is parked in `pendingTarget` and replayed by `flushPendingNotification()`,
 * which the navigator calls once it is actually ready.
 *
 * Every destination below is a route that exists in MainNavigator, so an unknown
 * or malformed payload can only ever fall through to Notifications — it can never
 * navigate to a route that isn't there. Ids are validated before use (T-044), so
 * a bad `offer_id` degrades to the list rather than pushing NaN into a screen
 * that reads `route.params.offerId`.
 * (This said "param-less" until T-044 added `OfferDetails({ offerId })` — the
 *  comment is kept accurate deliberately: a stale one caused the T-042 crash.)
 */

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

interface NotificationTarget {
  screen: string;
  params?: Record<string, any>;
}

let pendingTarget: NotificationTarget | null = null;

/** Push `data` values are strings, so the id needs parsing AND checking. */
const parseOfferId = (value: any): number | null => {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

/**
 * Where a given push should land. Types come from the API's notify* calls:
 * see OfferPassengerService, DriverOfferService and OfferDriverService.
 *
 * 🔴 **`offer_id` does NOT mean the same thing in every payload**, and this is
 * the one thing to get right here. Two different entities share the field name:
 *
 *   - the notifications below about a booking the passenger MADE carry the id of
 *     a **DriverOffer** — which is what `OfferDetailsScreen` fetches
 *     (`OffersAPI.getOfferDetails` → `DriverOffer`). Safe to open.
 *   - `driver_join_request` / `driver_request_cancelled` carry the id of the
 *     passenger's **own PassengerOffer**. Passing that to `OfferDetails` would
 *     fetch a *driver* offer by a *passenger*-offer id — a wrong row or a 404,
 *     shown to the user as their own trip. They stay on the list. See below.
 */
const routeForNotification = (data: any): NotificationTarget => {
  switch (data?.type) {
    // Things that happened to a booking the passenger made on a driver's offer.
    // `offer_id` is that DRIVER offer, so open it directly instead of dropping
    // the passenger on a list to hunt for the trip they were just told about.
    // A missing or malformed id falls back to the list rather than pushing NaN
    // into a screen that reads `route.params.offerId`.
    case 'join_confirmed':
    case 'join_rejected':
    case 'driver_arrived':
    case 'driver_10min_away':
    case 'offer_cancelled_by_driver': {
      const offerId = parseOfferId(data?.offer_id);
      return offerId
        ? { screen: 'OfferDetails', params: { offerId } }
        : { screen: 'MyBookings' };
    }

    // Drivers responding to the passenger's own ride request.
    // ⚠️ Deliberately NOT routed to `OfferDetails` — see the entity note above.
    // The exact destination is the "drivers who offered" screen, which does not
    // exist yet (T-024). Until it does, the passenger's own request list is the
    // honest answer; T-024 is where this becomes exact.
    case 'driver_join_request':
    case 'driver_request_cancelled':
      return { screen: 'MyPassengerOffers' };

    // Anything else — including a type this build has never heard of — goes to
    // the message list, which is what "open the message" means at minimum.
    default:
      return { screen: 'Notifications' };
  }
};

/** Try to navigate now; park the target if the navigator cannot take it yet. */
const goOrPark = (target: NotificationTarget) => {
  if (navigationRef.isReady()) {
    try {
      // `as any` matches how the rest of this app navigates: the route types do
      // not enumerate these screens (T-028), and navigate()'s two-arg overload
      // rejects the usual `as never` cast.
      (navigationRef.navigate as any)(target.screen, target.params);
      return;
    } catch (error) {
      // The navigator is mounted but this route is not in the CURRENT tree —
      // e.g. the user is still on the auth stack. Park it and try again later.
      console.warn('Notification navigation failed, parking it:', error);
    }
  }
  pendingTarget = target;
};

/** Called with the `data` payload of a tapped notification. */
export const handleNotificationTap = (data: any) => {
  goOrPark(routeForNotification(data));
};

/**
 * Replay a parked tap. Safe to call as often as you like — it is a no-op when
 * nothing is parked, and it clears the target before navigating so a failure
 * cannot leave the app retrying the same notification forever.
 */
export const flushPendingNotification = () => {
  if (!pendingTarget || !navigationRef.isReady()) return;

  const target = pendingTarget;
  pendingTarget = null;

  try {
    (navigationRef.navigate as any)(target.screen, target.params);
  } catch (error) {
    console.warn('Pending notification navigation failed, dropping it:', error);
  }
};

/** Test seam / logout cleanup: forget any parked tap. */
export const clearPendingNotification = () => {
  pendingTarget = null;
};
