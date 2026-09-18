/**
 * T-121 step 8 — `pushEvents.ts`. **The ninth file: the card left this one undecided and asked
 * step 8 to settle it. Decision: yes, it earns a test**, on three grounds — it is live (7
 * importers in the user app, 6 in the driver), it is the bus every screen's silent refresh hangs
 * off, and it encodes two rules whose comments name the bugs that produced them.
 *
 * **Functionally byte-identical in both apps.** The measured "3 lines of drift" is *only* a
 * comment in the driver's copy saying it is deliberately identical and to change both or neither
 * — so this file is written once and copied, and re-proved red in the second app.
 *
 * **What it is for (T-068):** a push arriving while the app is OPEN never reaches the OS tray, so
 * it lands in `onMessage` and nowhere else. T-046 made it visible as a toast, but nothing told the
 * screen underneath that its data was now stale — the owner watched a list keep showing pre-push
 * data while the toast announced the change.
 *
 * **The two rules worth guarding, both with a bug behind them:**
 *   1. 🔴 **`otp` must never wake a listener.** Reloading a list underneath someone typing a code
 *      is pure noise, and the filter lives HERE rather than in each screen precisely so a new
 *      `otp`-like type cannot accidentally start reloading everything.
 *   2. 🔴 **One bad listener must not take the others down.** Modelled on `driverProfileEvents`
 *      (T-017). If one screen's refresh throws, every other screen must still refresh.
 *
 * ⚠️ **`listeners` is a module-level `Set` with no reset export**, so subscriptions leak between
 * tests. Every test here unsubscribes what it subscribed, via the `track` helper below — the same
 * class of trap as `notificationRouting`'s parked target in step 3, but without an author-provided
 * seam to lean on.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  RIDE_DATA_PUSH_TYPES,
  isRideDataPush,
  notifyPushReceived,
  subscribePushReceived,
} from './pushEvents';

/** Every unsubscribe handed out during a test, so `afterEach` can guarantee a clean Set. */
let unsubscribes: (() => void)[] = [];

const track = (unsubscribe: () => void) => {
  unsubscribes.push(unsubscribe);
  return unsubscribe;
};

beforeEach(() => {
  unsubscribes = [];
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  unsubscribes.forEach((unsubscribe) => unsubscribe());
  unsubscribes = [];
});

/** The shape `PushService` hands to `notifyPushReceived`. */
const push = (type: string, data: Record<string, unknown> = {}) => ({ data: { type, ...data } });

describe('RIDE_DATA_PUSH_TYPES', () => {
  it('🔴 does NOT contain otp', () => {
    // Rule 1, asserted as directly as it can be. A future hand adding `otp` to the list — or
    // pasting in "all the push types" — reloads every list underneath someone typing their code.
    expect(RIDE_DATA_PUSH_TYPES).not.toContain('otp');
    expect(isRideDataPush('otp')).toBe(false);
  });

  it('carries the fourteen types the API actually sends', () => {
    // Pinned as a set so a removal is caught, not just an addition. These come from the API's
    // `notify*` calls; a type dropped here stops every screen refreshing for that event.
    expect([...RIDE_DATA_PUSH_TYPES]).toStrictEqual([
      'join_confirmed',
      'join_rejected',
      'driver_arrived',
      'driver_10min_away',
      'offer_cancelled_by_driver',
      'driver_join_request',
      'driver_request_cancelled',
      'passenger_join_request',
      'passenger_cancelled',
      'driver_request_confirmed',
      'driver_request_rejected',
      'driver_not_chosen',
      'offer_cancelled_by_passenger',
      'passenger_offer_updated',
    ]);
  });
});

describe('isRideDataPush', () => {
  it('accepts every listed type', () => {
    RIDE_DATA_PUSH_TYPES.forEach((type) => expect(isRideDataPush(type)).toBe(true));
  });

  it.each([
    ['an unknown type', 'a_type_this_build_has_never_heard_of'],
    ['otp', 'otp'],
    ['the empty string', ''],
    ['undefined', undefined],
    ['null', null],
    ['a number', 42],
    ['an object', { type: 'join_confirmed' }],
  ])('rejects %s', (_label, value) => {
    // The `typeof type === 'string'` guard matters: push payloads are untrusted input, and
    // `includes` alone would be happy to be handed anything.
    expect(isRideDataPush(value)).toBe(false);
  });
});

describe('notifyPushReceived', () => {
  it('wakes a subscriber with the type and the whole data payload', () => {
    const listener = jest.fn();
    track(subscribePushReceived(listener));

    notifyPushReceived(push('join_confirmed', { offer_id: '42' }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('join_confirmed', {
      type: 'join_confirmed',
      offer_id: '42',
    });
  });

  it('🔴 stays silent for otp, and for anything not on the list', () => {
    const listener = jest.fn();
    track(subscribePushReceived(listener));

    notifyPushReceived(push('otp', { code: '1234' }));
    notifyPushReceived(push('something_new'));

    expect(listener).not.toHaveBeenCalled();
  });

  it('wakes every subscriber, in the order they subscribed', () => {
    const calls: string[] = [];
    track(subscribePushReceived(() => calls.push('first')));
    track(subscribePushReceived(() => calls.push('second')));

    notifyPushReceived(push('join_confirmed'));

    expect(calls).toStrictEqual(['first', 'second']);
  });

  it('🔴 one listener throwing must not stop the others refreshing', () => {
    // Rule 2. Without the try/catch inside the forEach, the first throw ends the loop and every
    // screen after it keeps showing stale data — the exact symptom T-068 was raised for.
    const after = jest.fn();
    track(
      subscribePushReceived(() => {
        throw new Error('this screen blew up while refreshing');
      })
    );
    track(subscribePushReceived(after));

    expect(() => notifyPushReceived(push('join_confirmed'))).not.toThrow();
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('survives a message that is not shaped like a push at all', () => {
    const listener = jest.fn();
    track(subscribePushReceived(listener));

    expect(() => {
      notifyPushReceived(undefined);
      notifyPushReceived(null);
      notifyPushReceived({});
      notifyPushReceived({ data: null });
      notifyPushReceived({ data: {} });
    }).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it('does nothing when nobody is listening', () => {
    expect(() => notifyPushReceived(push('join_confirmed'))).not.toThrow();
  });
});

describe('subscribePushReceived', () => {
  it('returns an unsubscribe that really stops the listener', () => {
    const listener = jest.fn();
    const unsubscribe = subscribePushReceived(listener);

    notifyPushReceived(push('join_confirmed'));
    unsubscribe();
    notifyPushReceived(push('join_confirmed'));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('is safe to unsubscribe twice — screens unmount in odd orders', () => {
    const unsubscribe = subscribePushReceived(jest.fn());

    expect(() => {
      unsubscribe();
      unsubscribe();
    }).not.toThrow();
  });

  describe('the optional type filter', () => {
    it('wakes the listener only for the types it asked for', () => {
      // "A screen showing bookings has no reason to re-fetch because a driver-side push
      // arrived" — the source's own words, and the reason the filter exists.
      const listener = jest.fn();
      track(subscribePushReceived(listener, ['join_confirmed', 'driver_arrived']));

      notifyPushReceived(push('join_confirmed'));
      notifyPushReceived(push('passenger_join_request')); // a ride push, but not one it wants
      notifyPushReceived(push('driver_arrived'));

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith('driver_arrived', { type: 'driver_arrived' });
    });

    it('still cannot be woken by a type the module filters out globally', () => {
      // Belt and braces: even a listener that explicitly asks for `otp` never gets it, because
      // `notifyPushReceived` drops it before the per-listener filter is consulted.
      const listener = jest.fn();
      track(subscribePushReceived(listener, ['otp']));

      notifyPushReceived(push('otp'));

      expect(listener).not.toHaveBeenCalled();
    });

    it('an empty filter list means nothing wakes it', () => {
      const listener = jest.fn();
      track(subscribePushReceived(listener, []));

      notifyPushReceived(push('join_confirmed'));

      expect(listener).not.toHaveBeenCalled();
    });

    it('unsubscribes correctly even though the filter wraps the listener', () => {
      // 🔴 The trap this guards: the Set holds the WRAPPER, not the listener passed in, so an
      // unsubscribe that deleted the original would silently leave the wrapper subscribed for
      // the life of the app.
      const listener = jest.fn();
      const unsubscribe = subscribePushReceived(listener, ['join_confirmed']);

      unsubscribe();
      notifyPushReceived(push('join_confirmed'));

      expect(listener).not.toHaveBeenCalled();
    });

    it('📌 the same function subscribed twice UNFILTERED registers once, filtered twice', () => {
      // Recorded because it is surprising rather than wrong: `listeners` is a `Set`, so an
      // unfiltered re-subscribe of the identical function is a no-op, while a filtered one wraps
      // it afresh and therefore counts twice. A screen that subscribes in two effects would fire
      // once or twice depending on whether it passed a filter.
      const listener = jest.fn();
      track(subscribePushReceived(listener));
      track(subscribePushReceived(listener));

      notifyPushReceived(push('join_confirmed'));
      expect(listener).toHaveBeenCalledTimes(1);

      listener.mockClear();
      track(subscribePushReceived(listener, ['join_confirmed']));
      track(subscribePushReceived(listener, ['join_confirmed']));

      notifyPushReceived(push('join_confirmed'));
      expect(listener).toHaveBeenCalledTimes(3); // the unfiltered one, plus the two wrappers
    });
  });
});
