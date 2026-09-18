/**
 * T-121 step 4 — `notificationRouting.ts`, the DRIVER app.
 *
 * 🔴 **The T-047 regression guard, driver side.** T-047 ("a tapped push on a KILLED app lands on
 * the main menu") is still PARKED on the board. The code carries a fix — a bounded RE-PARK
 * instead of a discard — and a long comment explaining the regression that made it necessary.
 * Nothing has ever verified it. These tests do, for this app.
 *
 * The bug, in one line: `flushPendingNotification` used to clear the parked target *and then*
 * navigate, so when `navigate` threw (because `NavigationContainer.onReady` fires for the SPLASH
 * stack, not `MainNavigator`) there was nothing left for the later retry to replay. The app
 * simply stayed put.
 *
 * ⚠️ **This is NOT a copy of the user app's test.** Measured before writing: the two modules'
 * park/flush halves differ only in comments, so that half is the same behaviour — but the ROUTING
 * TABLE shares not one push type with the user app's. The driver's types come from the API's
 * `notifyDriver` calls:
 *   • `passenger_join_request` / `passenger_cancelled` → `OfferPassengers`, the passenger list of
 *     the driver's OWN offer, id fallback `OffersList`;
 *   • the four outcomes of the driver's own bid → `MyJoinRequests`, with NO params;
 *   • `passenger_offer_updated` → `PassengerOfferDetails`, id fallback `MyJoinRequests`.
 *
 * The trap the source documents is the same one in mirror image: **`offer_id` does not name the
 * same entity in every payload.** In the join-request payloads it is the driver's own DriverOffer
 * (→ `OfferPassengers`); in `passenger_offer_updated` it is the PASSENGER's PassengerOffer
 * (→ `PassengerOfferDetails`). Same key, different table, different screen.
 *
 * `routeForNotification` is module-private on purpose, so everything here goes through the public
 * `handleNotificationTap` — which is the real behaviour anyway.
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
  it.each(['passenger_join_request', 'passenger_cancelled'])(
    '%s opens the passenger list of the driver’s own offer',
    (type) => {
      handleNotificationTap({ type, offer_id: '42' });

      expect(nav.navigate).toHaveBeenCalledWith('OfferPassengers', { offerId: 42 });
    }
  );

  it.each([
    'driver_request_confirmed',
    'driver_request_rejected',
    'driver_not_chosen',
    'offer_cancelled_by_passenger',
  ])('%s opens MyJoinRequests, with no params', (type) => {
    // All four are outcomes of the driver's OWN bid on a passenger's request, and the screen
    // lists exactly those bids with their status — so it needs no id. The source used to send
    // them to `Notifications` with a "no screen for these yet" comment; T-037 built the screen.
    handleNotificationTap({ type, offer_id: '42' });

    expect(nav.navigate).toHaveBeenCalledWith('MyJoinRequests', undefined);
  });

  it('passenger_offer_updated opens the PASSENGER offer, not the driver’s own', () => {
    // 🔴 The documented trap, mirror image of the user app's. Here `offer_id` is the passenger's
    // PassengerOffer — the terms they just edited. Routing it to `OfferPassengers` (which takes
    // the driver's own DriverOffer id) would load a wrong row, or someone else's passengers.
    handleNotificationTap({ type: 'passenger_offer_updated', offer_id: '42' });

    expect(nav.navigate).toHaveBeenCalledWith('PassengerOfferDetails', { offerId: 42 });
    expect(nav.navigate).not.toHaveBeenCalledWith('OfferPassengers', expect.anything());
  });

  it('sends anything it does not recognise to the message list', () => {
    handleNotificationTap({ type: 'a_type_this_build_has_never_heard_of' });
    handleNotificationTap({ type: undefined });
    handleNotificationTap({});
    handleNotificationTap(null);
    // A user-app type: the two tables share nothing, so this must NOT resolve here.
    handleNotificationTap({ type: 'join_confirmed', offer_id: '42' });

    expect(nav.navigate).toHaveBeenCalledTimes(5);
    nav.navigate.mock.calls.forEach((call) => expect(call[0]).toBe('Notifications'));
  });
});

describe('a malformed offer_id', () => {
  // Push `data` values arrive as STRINGS, so the id is parsed — and a bad parse must fall back
  // to a list rather than push NaN into a screen that reads `route.params.offerId`.
  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['not a number', 'abc'],
    ['zero', '0'],
    ['negative', '-3'],
    ['the literal NaN', 'NaN'],
  ])('%s falls back to the offers list instead of navigating with NaN', (_label, offerId) => {
    handleNotificationTap({ type: 'passenger_join_request', offer_id: offerId });

    expect(nav.navigate).toHaveBeenCalledWith('OffersList', undefined);
  });

  it('falls back to the bid list on the passenger-offer branch, not to the offers list', () => {
    // The two branches have DIFFERENT fallbacks, which is easy to collapse into one by accident.
    handleNotificationTap({ type: 'passenger_offer_updated', offer_id: 'nonsense' });

    expect(nav.navigate).toHaveBeenCalledWith('MyJoinRequests', undefined);
    expect(nav.navigate).not.toHaveBeenCalledWith('OffersList', expect.anything());
  });
});

describe('parking a tap the navigator cannot take yet', () => {
  it('parks instead of navigating when the navigator is not ready', () => {
    nav.isReady.mockReturnValue(false);

    handleNotificationTap({ type: 'passenger_join_request', offer_id: '42' });

    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('replays the parked tap once the navigator is ready, and only once', () => {
    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'passenger_join_request', offer_id: '42' });

    nav.isReady.mockReturnValue(true);
    flushPendingNotification();
    expect(nav.navigate).toHaveBeenCalledWith('OfferPassengers', { offerId: 42 });

    flushPendingNotification();
    expect(nav.navigate).toHaveBeenCalledTimes(1);
  });

  it('does nothing when nothing is parked, or when the navigator is still not ready', () => {
    flushPendingNotification();
    expect(nav.navigate).not.toHaveBeenCalled();

    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'passenger_join_request', offer_id: '42' });
    flushPendingNotification();
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('parks a tap whose navigate throws even though the navigator claims to be ready', () => {
    navigateThrows();

    handleNotificationTap({ type: 'passenger_join_request', offer_id: '42' });
    expect(nav.navigate).toHaveBeenCalledTimes(1);

    navigateSucceeds();
    flushPendingNotification();
    expect(nav.navigate).toHaveBeenLastCalledWith('OfferPassengers', { offerId: 42 });
  });
});

describe('T-047 — a flush that fails must RE-PARK, not discard', () => {
  it('keeps the target when navigate throws, and delivers it on the next flush', () => {
    // The cold-start sequence exactly: tap arrives before any navigator, gets parked;
    // onReady fires for the SPLASH stack so isReady() is true but the route is not in the tree;
    // the flush throws. The target must survive that. On this app the wait is longer still —
    // `MainNavigator` mounts only after authentication AND the driver's profile checks.
    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'passenger_join_request', offer_id: '7' });

    nav.isReady.mockReturnValue(true);
    navigateThrows();
    flushPendingNotification();
    expect(nav.navigate).toHaveBeenCalledTimes(1);

    // MainNavigator has now mounted.
    navigateSucceeds();
    flushPendingNotification();

    expect(nav.navigate).toHaveBeenCalledTimes(2);
    expect(nav.navigate).toHaveBeenLastCalledWith('OfferPassengers', { offerId: 7 });
  });

  it('survives several failed flushes before succeeding', () => {
    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'passenger_join_request', offer_id: '7' });
    nav.isReady.mockReturnValue(true);

    navigateThrows();
    for (let i = 0; i < 5; i += 1) flushPendingNotification();

    navigateSucceeds();
    flushPendingNotification();

    // ⚠️ The COUNT is the assertion, not just the arguments. A throwing `navigate` is still a
    // recorded call, so `toHaveBeenLastCalledWith` alone passes even when the target was
    // discarded on the first failure and the other five flushes did nothing — measured on the
    // user app's copy, where it fake-greened three tests.
    expect(nav.navigate).toHaveBeenCalledTimes(6);
    expect(nav.navigate).toHaveBeenLastCalledWith('OfferPassengers', { offerId: 7 });
  });

  it('gives up for good after 10 failed flushes, so a doomed target cannot loop forever', () => {
    // The bound is what makes re-parking safe: `flushPendingNotification` is called from an
    // effect that reruns on every auth/profile change, and a route deleted in a later build
    // would otherwise be retried forever.
    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'passenger_join_request', offer_id: '7' });
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
    handleNotificationTap({ type: 'passenger_join_request', offer_id: '7' });
    for (let i = 0; i < 9; i += 1) flushPendingNotification();
    clearPendingNotification();
    nav.navigate.mockClear();

    // A fresh notification must get the FULL budget back.
    handleNotificationTap({ type: 'passenger_offer_updated', offer_id: '99' }); // 1: parks
    flushPendingNotification(); //                                                2: fails, re-parks
    navigateSucceeds();
    flushPendingNotification(); //                                                3: delivers

    // 🔴 The COUNT is the discriminator, not the arguments. With a leaked counter the failed
    // flush would be attempt 10, the target would be dropped, the delivery would never run —
    // and `toHaveBeenLastCalledWith` would STILL pass, because a `navigate` that throws is a
    // recorded call with exactly these arguments.
    expect(nav.navigate).toHaveBeenCalledTimes(3);
    expect(nav.navigate).toHaveBeenLastCalledWith('PassengerOfferDetails', { offerId: 99 });
  });

  it('resets the budget after a successful delivery', () => {
    nav.isReady.mockReturnValue(true);

    navigateThrows();
    handleNotificationTap({ type: 'passenger_join_request', offer_id: '7' });
    for (let i = 0; i < 9; i += 1) flushPendingNotification();

    navigateSucceeds();
    flushPendingNotification();
    nav.navigate.mockClear();

    // Same discriminator, and the same count rule: one FAILED flush on the next target. If the
    // counter had survived the success it would now read 10 and this target would be dropped
    // instead of re-parked, leaving two attempts instead of three.
    navigateThrows();
    handleNotificationTap({ type: 'passenger_offer_updated', offer_id: '99' }); // 1: parks
    flushPendingNotification(); //                                                2: fails, re-parks
    navigateSucceeds();
    flushPendingNotification(); //                                                3: delivers

    expect(nav.navigate).toHaveBeenCalledTimes(3);
    expect(nav.navigate).toHaveBeenLastCalledWith('PassengerOfferDetails', { offerId: 99 });
  });
});

describe('clearPendingNotification', () => {
  it('forgets a parked tap, so a logout cannot deliver it later', () => {
    nav.isReady.mockReturnValue(false);
    handleNotificationTap({ type: 'passenger_join_request', offer_id: '42' });

    clearPendingNotification();

    nav.isReady.mockReturnValue(true);
    flushPendingNotification();

    expect(nav.navigate).not.toHaveBeenCalled();
  });
});
