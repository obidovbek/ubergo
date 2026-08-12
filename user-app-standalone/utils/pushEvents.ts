/**
 * Foreground push events (T-068)
 *
 * A push that arrives while the app is OPEN never reaches the OS tray — Android
 * posts no system notification in that case — so it lands in `onMessage` and
 * nowhere else. T-046 made it *visible* (a tappable toast) but nothing told the
 * screen underneath that its data had just gone stale: the owner watched a list
 * keep showing pre-push data while the toast announced the change
 * (2026-08-12, item ⑨).
 *
 * 🔴 **The observer slot for exactly this already existed and was passed
 * `undefined`** at both call sites (`App.tsx`). The gap was never the plumbing.
 *
 * ⚠️ **Refresh in place; never navigate.** `PushService`'s own comment states the
 * rule and it holds here: a push must not yank someone off the screen they are
 * using. Screens re-fetch silently; only a TAP moves anyone.
 *
 * ⚠️ **Not every push means "your list changed".** `otp` in particular must never
 * trigger a re-fetch, so subscribers declare which types they care about rather
 * than waking on all of them.
 *
 * Modelled on `driverProfileEvents.ts` (T-017), including its rule that one bad
 * listener must not take the others down with it.
 */

/**
 * Push types that mean some ride data the user can see has changed.
 *
 * Taken from the API's `notify*` calls — see `OfferDriverService`,
 * `OfferPassengerService`, `DriverOfferService` and `PassengerOfferService`.
 * ⚠️ `otp` is deliberately absent: it changes nothing on screen, and reloading a
 * list underneath someone typing a code would be pure noise.
 */
export const RIDE_DATA_PUSH_TYPES = [
  // Passenger-side: things that happened to a booking they made
  'join_confirmed',
  'join_rejected',
  'driver_arrived',
  'driver_10min_away',
  'offer_cancelled_by_driver',
  // Passenger-side: drivers responding to their own ride request
  'driver_join_request',
  'driver_request_cancelled',
  // Driver-side: passengers acting on the driver's offers
  'passenger_join_request',
  'passenger_cancelled',
  // Driver-side: outcomes of the driver's own bid
  'driver_request_confirmed',
  'driver_request_rejected',
  'driver_not_chosen',
  'offer_cancelled_by_passenger',
  // Driver-side: the passenger edited a request the driver is on (T-065)
  'passenger_offer_updated',
] as const;

export type RideDataPushType = (typeof RIDE_DATA_PUSH_TYPES)[number];

/** Is this a push that should make visible ride data re-fetch? */
export const isRideDataPush = (type: unknown): type is RideDataPushType =>
  typeof type === 'string' &&
  (RIDE_DATA_PUSH_TYPES as readonly string[]).includes(type);

type Listener = (type: string, data: Record<string, any>) => void;

const listeners = new Set<Listener>();

/**
 * Announce that a push arrived while the app was open.
 *
 * Called from the `onNotificationReceived` observer in `App.tsx`. Non-ride pushes
 * are filtered here rather than in each screen, so a new `otp`-like type cannot
 * accidentally start reloading every list.
 */
export function notifyPushReceived(message: any): void {
  const data = message?.data ?? {};
  const type = data?.type;
  if (!isRideDataPush(type)) return;

  listeners.forEach((listener) => {
    try {
      listener(type, data);
    } catch (error) {
      // One screen's refresh failing must not stop the others from refreshing.
      console.warn('pushReceived listener failed:', error);
    }
  });
}

/**
 * Subscribe to foreground ride-data pushes. Returns the unsubscribe function.
 *
 * @param listener called with the push type and its data payload.
 * @param types optional filter — when given, only these types wake this listener.
 *              A screen showing bookings has no reason to re-fetch because a
 *              *driver-side* push arrived.
 */
export function subscribePushReceived(
  listener: Listener,
  types?: readonly string[]
): () => void {
  const wrapped: Listener = types
    ? (type, data) => {
        if (types.includes(type)) listener(type, data);
      }
    : listener;

  listeners.add(wrapped);
  return () => {
    listeners.delete(wrapped);
  };
}
