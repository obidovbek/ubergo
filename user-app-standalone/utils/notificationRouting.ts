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
 *     shown to the user as their own trip. They go to `OfferDrivers` (T-024),
 *     which is the screen that actually takes a PassengerOffer id.
 *
 * ⚠️ So the rule is not "never pass offer_id" — it is that the id and the screen
 * must agree about which entity they mean.
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
    //
    // ✅ T-024 built `OfferDrivers`, so these are now exact. It is worth being
    // explicit about why this is SAFE when routing them to `OfferDetails` never
    // was: their `offer_id` is the passenger's **own PassengerOffer**, and
    // `OfferDrivers` takes exactly that — a PassengerOffer id — whereas
    // `OfferDetails` fetches a *DriverOffer* and would have loaded a wrong row.
    // The id is the same; the screen that can accept it is what changed.
    case 'driver_join_request':
    case 'driver_request_cancelled': {
      const offerId = parseOfferId(data?.offer_id);
      return offerId
        ? { screen: 'OfferDrivers', params: { offerId } }
        : { screen: 'MyPassengerOffers' };
    }

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
 * Replay a parked tap. Safe to call as often as you like — a no-op when nothing
 * is parked.
 *
 * 🔴 T-047: this used to DISCARD the target the moment a navigate failed, which
 * broke every cold-start tap. `NavigationContainer.onReady` fires when ANY
 * navigator mounts, and on a cold start that is the splash/auth stack — not
 * `MainNavigator`. So the sequence was: isReady() true → clear the target →
 * navigate throws (the route is not in the current tree) → "dropping it", with
 * nothing left for the later retry to replay. The app just stayed where it was,
 * which the owner saw as "it opens the main menu".
 *
 * `goOrPark` had it right all along — it catches and RE-PARKS. The two halves of
 * one mechanism disagreed for as long as both existed.
 *
 * The original clear-first was guarding something real, though: this is called
 * from an effect that reruns on every auth state change, so a target that can
 * NEVER succeed (a route removed in a later build, say) would be retried
 * forever. Hence a bounded retry rather than unconditional re-parking — it
 * survives the several seconds MainNavigator needs, then gives up for good.
 */
const MAX_FLUSH_ATTEMPTS = 10;
let flushAttempts = 0;

export const flushPendingNotification = () => {
  if (!pendingTarget || !navigationRef.isReady()) return;

  const target = pendingTarget;
  // Clear first either way: re-parked below only if the failure looks transient,
  // so a doomed target can never loop.
  pendingTarget = null;

  try {
    (navigationRef.navigate as any)(target.screen, target.params);
    flushAttempts = 0;
  } catch (error) {
    flushAttempts += 1;

    if (flushAttempts >= MAX_FLUSH_ATTEMPTS) {
      console.warn(
        `Pending notification navigation failed ${flushAttempts}x, giving up:`,
        error
      );
      flushAttempts = 0;
      return;
    }

    // Probably just too early — the destination lives in MainNavigator, which
    // mounts only after authentication. Put it back so the next flush (auth
    // state change, or navigator ready) can try again.
    console.warn('Pending notification navigation failed, re-parking it:', error);
    pendingTarget = target;
  }
};

/** Test seam / logout cleanup: forget any parked tap. */
export const clearPendingNotification = () => {
  pendingTarget = null;
  // Reset the retry budget too — otherwise a previous target's failures would
  // be charged against the next notification.
  flushAttempts = 0;
};
