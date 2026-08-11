/**
 * Push notification tap routing (OR-010 item 5)
 *
 * Mirrors `user-app-standalone/utils/notificationRouting.ts`. Tapping a system
 * notification used to do nothing but cold-open the app on its default screen —
 * there was no tap handler in either app.
 *
 * The waiting is the whole difficulty. A tap can arrive long before the app can
 * act on it:
 *   - on a COLD START `getInitialNotification()` resolves while the splash is
 *     still up and NavigationContainer has not mounted;
 *   - `MainNavigator` only mounts once the driver is authenticated and past the
 *     profile checks, which may be several seconds and an API round-trip later.
 * So a tap is parked in `pendingTarget` and replayed by `flushPendingNotification()`.
 *
 * Unlike the user app this one carries params, because the driver's most common
 * notification (a passenger asking to join) has an exact destination. The offer
 * id is validated before use — a malformed payload falls back to the offers list
 * rather than pushing NaN into a screen that reads `route.params.offerId`.
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
 * Where a given push should land. Types come from the API's notifyDriver calls:
 * see OfferPassengerService, OfferDriverService and PassengerOfferService.
 */
const routeForNotification = (data: any): NotificationTarget => {
  switch (data?.type) {
    // A passenger wants to join, or backed out of, one of the driver's offers.
    // Both have an offer_id, so go straight to that offer's passenger list.
    case 'passenger_join_request':
    case 'passenger_cancelled': {
      const offerId = parseOfferId(data?.offer_id);
      return offerId
        ? { screen: 'OfferPassengers', params: { offerId } }
        : { screen: 'OffersList' };
    }

    // Outcomes of the driver's OWN bid on a passenger's ride request.
    //
    // ⚠️ These used to fall through to `Notifications` with a comment saying
    // "there is no screen for these yet (T-023/T-024)". That went stale: T-037
    // built `MyJoinRequestsScreen` and registered it, and it lists exactly these
    // bids with their status — so it is the right destination for all four.
    // It takes no params (no `useRoute`), so none are passed.
    case 'driver_request_confirmed':
    case 'driver_request_rejected':
    case 'driver_not_chosen':
    case 'offer_cancelled_by_passenger':
      return { screen: 'MyJoinRequests' };

    default:
      return { screen: 'Notifications' };
  }
};

/** Try to navigate now; park the target if the navigator cannot take it yet. */
const goOrPark = (target: NotificationTarget) => {
  if (navigationRef.isReady()) {
    try {
      // `as any` matches how the rest of this app navigates: the route types do
      // not enumerate these screens, and navigate()'s two-arg overload rejects
      // the usual `as never` cast.
      (navigationRef.navigate as any)(target.screen, target.params);
      return;
    } catch (error) {
      // Mounted, but this route is not in the CURRENT tree — e.g. the driver is
      // still on the auth stack. Park it and try again later.
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
 * from an effect that reruns on every auth/profile state change, so a target
 * that can NEVER succeed (a route removed in a later build, say) would be
 * retried forever. Hence a bounded retry rather than unconditional re-parking —
 * it survives the several seconds MainNavigator needs, then gives up for good.
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
    // mounts only after authentication and the profile check. Put it back so
    // the next flush (auth state change, or navigator ready) can try again.
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
