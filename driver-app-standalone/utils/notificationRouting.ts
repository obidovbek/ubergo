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

    // Outcomes of the driver's own request on a passenger's ride offer. There is
    // no screen for these yet (T-023/T-024), so the message list is the honest
    // destination rather than a route that does not exist.
    case 'driver_request_confirmed':
    case 'driver_request_rejected':
    case 'driver_not_chosen':
    case 'offer_cancelled_by_passenger':
      return { screen: 'Notifications' };

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
 * is parked, and it clears the target before navigating so a failure cannot
 * leave the app retrying the same notification forever.
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
