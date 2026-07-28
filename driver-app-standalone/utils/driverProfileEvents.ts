/**
 * Driver profile change events (T-017)
 *
 * `RootNavigator` picks between the registration stack and the main app by asking the
 * API whether the driver profile is complete. It re-runs that check when the auth
 * identity changes — but finishing a registration step is not an auth change, so the
 * screen has to say so out loud.
 *
 * Before T-017 the taxi-license screen poked `updateUser({ profile_complete: true })`
 * and relied on `RootNavigator` noticing the changed user object. That was the wrong
 * signal (`profile_complete` belongs to the *user* record — a driver can have it `true`
 * with an empty *driver* profile) and it fed an infinite re-check loop, because the
 * check itself writes the user object it was watching.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Announce that a registration step was saved and the profile may now be complete.
 * Call this after the API confirms the save, not before.
 */
export function notifyDriverProfileChanged(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn('driverProfileChanged listener failed:', error);
    }
  });
}

/** Subscribe to profile changes. Returns the unsubscribe function. */
export function subscribeDriverProfileChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
