/**
 * T-121 step 3 — `notificationRouting.ts`, the user app.
 *
 * 🔴 **This file exists mainly as the T-047 regression guard.** T-047 ("a tapped push on a KILLED
 * app lands on the main menu") is still PARKED on the board. The code already carries a fix — a
 * bounded RE-PARK instead of a discard — and a long comment explaining the regression that made
 * it necessary. Nothing has ever verified that fix. These tests do.
 *
 * The bug, in one line: `flushPendingNotification` used to clear the parked target *and then*
 * navigate, so when `navigate` threw (because `NavigationContainer.onReady` fires for the SPLASH
 * stack, not `MainNavigator`) there was nothing left for the later retry to replay. The app
 * simply stayed put — which the owner saw as "it opens the main menu".
 *
 * The other half of the file is the routing table, where the trap is documented in the source:
 * **`offer_id` does not mean the same entity in every payload.** For a booking the passenger
 * made it is a DriverOffer (→ `OfferDetails`); for drivers answering the passenger's own request
 * it is the passenger's own PassengerOffer (→ `OfferDrivers`, T-024). Sending the second to the
 * first would fetch a wrong row and show it to the user as their own trip.
 *
 * `routeForNotification` is module-private on purpose, so everything here goes through the public
 * `handleNotificationTap` — which is the real behaviour anyway.
 *
 * ⚠️ The driver app has its own copy of this module with a DIFFERENT routing table (its own push
 * types and screens). Its test is step 4 and is not a copy of this one.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  clearPendingNotification,
  flushPendingNotification,
  handleNotificationTap,
  navigationRef,
} from './notificationRouting';

/**
 * The module's only import is `createNavigationContainerRef`, so the mock is deliberately
 * minimal rather than a `requireActual` spread — nothing else in the library is reachable from
 * here, and not loading it keeps the test in the millisecond range.
 *
 * The ref is created inside the factory (a `const` in this file would be in its TDZ when the
 * factory runs) and reaches the tests through the module's own `navigationRef` export, which IS
 * this object.
 *
 * ⚠️ This sits BELOW the imports on purpose: `babel-plugin-jest-hoist` lifts `jest.mock` above
 * them at transform time, so the mock is still installed before the module loads — while writing
 * it above the imports leaves them "in the body of the module" and costs an `import/first` lint
 * warning, which this project treats as a defect in the test file rather than a new baseline.
 */
jest.mock('@react-navigation/native', () => {
  const ref = { isReady: jest.fn(), navigate: jest.fn() };
  return { createNavigationContainerRef: () => ref };
});

const nav = navigationRef as unknown as {
  isReady: jest.Mock<() => boolean>;
  navigate: jest.Mock<(screen: string, params?: unknown) => void>;
};

/** Makes the next `navigate` blow up the way a route outside the current tree does. */
const navigateThrows = () => {
  nav.navigate.mockImplementation(() => {
    throw new Error("The action 'NAVIGATE' was not handled by any navigator.");
  });
};
const navigateSucceeds = () => {
  nav.navigate.mockImplementation(() => undefined);
};

beforeEach(() => {
  // `pendingTarget` and `flushAttempts` are module-level state. This is the author's own seam
  // (its doc comment says "Test seam / logout cleanup") and it resets both.
  clearPendingNotification();
  // `clearMocks` wipes call history but NOT implementations, so both are set explicitly.
  nav.isReady.mockReturnValue(true);
  navigateSucceeds();
  // The module warns on every park and re-park; that is expected, not a failure.
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('routing table', () => {
  it.each([
    'join_confirmed',
    'join_rejected',
    'driver_arrived',
    'driver_10min_away',
    'offer_cancelled_by_driver',
  ])('%s opens the DRIVER offer it names', (type) => {
    handleNotificationTap({ type, offer_id: '42' });

    expect(nav.navigate).toHaveBeenCalledWith('OfferDetails', { offerId: 42 });
  });

  it.each(['driver_join_request', 'driver_request_cancelled'])(
    '%s opens OfferDrivers — the screen that takes a PASSENGER offer id',
    (type) => {
      // 🔴 The documented trap: this payload's `offer_id` is the passenger's OWN PassengerOffer.
      // Routing it to `OfferDetails` (which fetches a DriverOffer) would load a wrong row or 404
      // and present it as the user's own trip. Same id, different entity, different screen.
      handleNotificationTap({ type, offer_id: '42' });

      expect(nav.navigate).toHaveBeenCalledWith('OfferDrivers', { offerId: 42 });
      expect(nav.navigate).not.toHaveBeenCalledWith('OfferDetails', expect.anything());
    }
  );

  it('sends anything it does not recognise to the message list', () => {
    handleNotificationTap({ type: 'a_type_this_build_has_never_heard_of' });
    handleNotificationTap({ type: undefined });
    handleNotificationTap({});
    handleNotificationTap(null);

    expect(nav.navigate).toHaveBeenCalledTimes(4);
    nav.navigate.mock.calls.forEach((call) => expect(call[0]).toBe('Notifications'));
  });
});

describe('a malformed offer_id', () => {
  // Push `data` values arrive as STRINGS, so the id is parsed — and a bad parse must fall back
  // to the list rather than push NaN into a screen that reads `route.params.offerId`.
  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['not a number', 'abc'],
    ['zero', '0'],
    ['negative', '-3'],
    ['the literal NaN', 'NaN'],
  ])('%s falls back to the list instead of navigating with NaN', (_label, offerId) => {
    handleNotificationTap({ type: 'join_confirmed', offer_id: offerId });

    expect(nav.navigate).toHaveBeenCalledWith('MyBookings', undefined);
  });

  it('falls back to the passenger-offer list on the other branch too', () => {
    handleNotificationTap({ type: 'driver_join_request', offer_id: 'nonsense' });

    expect(nav.navigate).toHaveBeenCalledWith('MyPassengerOffers', undefined);
  });
});

describe('parking a tap the navigator cannot take yet', () => {
  it('parks instead of navigating when the navigator is not ready', () => {
    nav.isReady.mockReturnValue(false);

    handleNotificationTap({ type: 'join_confirmed', offer_id: '42' });

    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('replays the parked tap once the navigator is ready, and only once', () => {
    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'join_confirmed', offer_id: '42' });

    nav.isReady.mockReturnValue(true);
    flushPendingNotification();
    expect(nav.navigate).toHaveBeenCalledWith('OfferDetails', { offerId: 42 });

    flushPendingNotification();
    expect(nav.navigate).toHaveBeenCalledTimes(1);
  });

  it('does nothing when nothing is parked, or when the navigator is still not ready', () => {
    flushPendingNotification();
    expect(nav.navigate).not.toHaveBeenCalled();

    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'join_confirmed', offer_id: '42' });
    flushPendingNotification();
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('parks a tap whose navigate throws even though the navigator claims to be ready', () => {
    navigateThrows();

    handleNotificationTap({ type: 'join_confirmed', offer_id: '42' });
    expect(nav.navigate).toHaveBeenCalledTimes(1);

    navigateSucceeds();
    flushPendingNotification();
    expect(nav.navigate).toHaveBeenLastCalledWith('OfferDetails', { offerId: 42 });
  });
});

describe('T-047 — a flush that fails must RE-PARK, not discard', () => {
  it('keeps the target when navigate throws, and delivers it on the next flush', () => {
    // The cold-start sequence exactly: tap arrives before any navigator, gets parked;
    // onReady fires for the SPLASH stack so isReady() is true but the route is not in the tree;
    // the flush throws. The target must survive that.
    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'driver_arrived', offer_id: '7' });

    nav.isReady.mockReturnValue(true);
    navigateThrows();
    flushPendingNotification();
    expect(nav.navigate).toHaveBeenCalledTimes(1);

    // MainNavigator has now mounted.
    navigateSucceeds();
    flushPendingNotification();

    expect(nav.navigate).toHaveBeenCalledTimes(2);
    expect(nav.navigate).toHaveBeenLastCalledWith('OfferDetails', { offerId: 7 });
  });

  it('survives several failed flushes before succeeding', () => {
    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'driver_arrived', offer_id: '7' });
    nav.isReady.mockReturnValue(true);

    navigateThrows();
    for (let i = 0; i < 5; i += 1) flushPendingNotification();

    navigateSucceeds();
    flushPendingNotification();

    // ⚠️ The COUNT is the assertion, not just the arguments. A throwing `navigate` is still a
    // recorded call, so `toHaveBeenLastCalledWith` alone passes even when the target was
    // discarded on the first failure and the other five flushes did nothing — measured, and it
    // is why this test was rewritten.
    expect(nav.navigate).toHaveBeenCalledTimes(6);
    expect(nav.navigate).toHaveBeenLastCalledWith('OfferDetails', { offerId: 7 });
  });

  it('gives up for good after 10 failed flushes, so a doomed target cannot loop forever', () => {
    // The bound is what makes re-parking safe: `flushPendingNotification` is called from an
    // effect that reruns on every auth change, and a route deleted in a later build would
    // otherwise be retried forever.
    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'driver_arrived', offer_id: '7' });
    nav.isReady.mockReturnValue(true);

    navigateThrows();
    for (let i = 0; i < 10; i += 1) flushPendingNotification();
    expect(nav.navigate).toHaveBeenCalledTimes(10);

    navigateSucceeds();
    flushPendingNotification();

    expect(nav.navigate).toHaveBeenCalledTimes(10);
  });

  it('does not charge one target’s failures against the next notification', () => {
    nav.isReady.mockReturnValue(true);
    navigateThrows();

    // Burn 9 of the 10 attempts on a target that is then abandoned.
    handleNotificationTap({ type: 'driver_arrived', offer_id: '7' });
    for (let i = 0; i < 9; i += 1) flushPendingNotification();
    clearPendingNotification();
    nav.navigate.mockClear();

    // A fresh notification must get the FULL budget back.
    handleNotificationTap({ type: 'join_confirmed', offer_id: '99' }); // attempt 1: parks
    flushPendingNotification(); //                                       attempt 2: fails, re-parks
    navigateSucceeds();
    flushPendingNotification(); //                                       attempt 3: delivers

    // 🔴 The COUNT is the discriminator, not the arguments. With a leaked counter the failed
    // flush would be attempt 10, the target would be dropped, the delivery would never run —
    // and `toHaveBeenLastCalledWith` would STILL pass, because a `navigate` that throws is a
    // recorded call with exactly these arguments. Measured: this test passed under that bug
    // until the count was added.
    expect(nav.navigate).toHaveBeenCalledTimes(3);
    expect(nav.navigate).toHaveBeenLastCalledWith('OfferDetails', { offerId: 99 });
  });

  it('resets the budget after a successful delivery', () => {
    nav.isReady.mockReturnValue(true);

    navigateThrows();
    handleNotificationTap({ type: 'driver_arrived', offer_id: '7' });
    for (let i = 0; i < 9; i += 1) flushPendingNotification();

    navigateSucceeds();
    flushPendingNotification();
    nav.navigate.mockClear();

    // Same discriminator, and the same count rule: one FAILED flush on the next target. If the
    // counter had survived the success it would now read 10 and this target would be dropped
    // instead of re-parked, leaving two attempts instead of three.
    navigateThrows();
    handleNotificationTap({ type: 'join_confirmed', offer_id: '99' }); // attempt 1: parks
    flushPendingNotification(); //                                       attempt 2: fails, re-parks
    navigateSucceeds();
    flushPendingNotification(); //                                       attempt 3: delivers

    expect(nav.navigate).toHaveBeenCalledTimes(3);
    expect(nav.navigate).toHaveBeenLastCalledWith('OfferDetails', { offerId: 99 });
  });
});

describe('clearPendingNotification', () => {
  it('forgets a parked tap, so a logout cannot deliver it later', () => {
    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'join_confirmed', offer_id: '42' });

    clearPendingNotification();

    nav.isReady.mockReturnValue(true);
    flushPendingNotification();

    expect(nav.navigate).not.toHaveBeenCalled();
  });
});
