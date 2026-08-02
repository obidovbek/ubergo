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
 * Every destination below is a param-less route that exists in MainNavigator, so
 * an unknown or malformed payload can only ever fall through to Notifications —
 * it can never navigate to a route that isn't there.
 */

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

interface NotificationTarget {
  screen: string;
}

let pendingTarget: NotificationTarget | null = null;

/**
 * Where a given push should land. Types come from the API's notify* calls:
 * see OfferPassengerService, DriverOfferService and OfferDriverService.
 */
const routeForNotification = (data: any): NotificationTarget => {
  switch (data?.type) {
    // Things that happened to a booking the passenger made on a driver's offer
    case 'join_confirmed':
    case 'join_rejected':
    case 'driver_arrived':
    case 'driver_10min_away':
    case 'offer_cancelled_by_driver':
      return { screen: 'MyBookings' };

    // Drivers responding to the passenger's own ride request
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
      navigationRef.navigate(target.screen as never);
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
    navigationRef.navigate(target.screen as never);
  } catch (error) {
    console.warn('Pending notification navigation failed, dropping it:', error);
  }
};

/** Test seam / logout cleanup: forget any parked tap. */
export const clearPendingNotification = () => {
  pendingTarget = null;
};
