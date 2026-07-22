/**
 * SMS Retriever (Android) — zero-tap OTP autofill (OR-003).
 *
 * Thin wrapper around `react-native-otp-verify`. Everything here is Android-only
 * and deliberately defensive, because that library:
 *   - builds a `NativeEventEmitter` at *module import* time from a Proxy that
 *     THROWS when the native module isn't linked (e.g. iOS, or Expo Go). A plain
 *     top-level `import` can therefore crash the screen — so we `require()` it
 *     lazily, inside a try/catch, only on Android.
 *   - exposes `removeListener()` as `removeAllListeners()` (global, not per-sub).
 *
 * The listener receives the FULL SMS BODY, not a bare code, plus the literal
 * string 'Timeout Error.' when the ~5 min SMS Retriever window expires.
 */
import { Platform } from 'react-native';

/** Sentinel the native module emits when the retriever window expires. */
const TIMEOUT_MESSAGE = 'Timeout Error.';

type OtpVerifyModule = {
  getOtp: () => Promise<boolean>;
  getHash: () => Promise<string[]>;
  addListener: (handler: (value: string) => void) => { remove: () => void };
  removeListener: () => void;
};

function loadModule(): OtpVerifyModule | null {
  if (Platform.OS !== 'android') return null;
  try {
    // Lazy require: importing this at module scope can throw when unlinked.
    return require('react-native-otp-verify') as OtpVerifyModule;
  } catch (error) {
    console.warn('[smsRetriever] native module unavailable:', error);
    return null;
  }
}

/**
 * Pull the verification code out of an SMS body.
 * Anchored on a digit-group of exactly `length` so the 11-char app hash (which
 * can contain digits) and the "UbexGo" brand can't be mistaken for the code.
 */
export function extractOtp(message: string, length = 4): string | null {
  if (!message) return null;
  const match = new RegExp(`(?<!\\d)(\\d{${length}})(?!\\d)`).exec(message);
  return match ? match[1] : null;
}

/**
 * Start listening for the OTP SMS.
 *
 * @returns a cleanup function — always safe to call, even if start failed.
 */
export function startOtpListener(
  onCode: (code: string) => void,
  options: { length?: number; onTimeout?: () => void } = {}
): () => void {
  const { length = 4, onTimeout } = options;
  const mod = loadModule();
  if (!mod) return () => {};

  let subscription: { remove: () => void } | null = null;
  let cancelled = false;

  const handleMessage = (message: string) => {
    if (message === TIMEOUT_MESSAGE) {
      onTimeout?.();
      return;
    }
    const code = extractOtp(message, length);
    if (code) onCode(code);
  };

  // getOtp() registers the SMS Retriever client; only then does the broadcast fire.
  mod
    .getOtp()
    .then(() => {
      if (cancelled) return;
      subscription = mod.addListener(handleMessage);
    })
    .catch((error) => {
      console.warn('[smsRetriever] failed to start:', error);
    });

  return () => {
    cancelled = true;
    try {
      // Prefer the per-subscription remove; fall back to the module's global one.
      if (subscription) subscription.remove();
      else mod.removeListener();
    } catch (error) {
      console.warn('[smsRetriever] cleanup failed:', error);
    }
  };
}

/**
 * App signature hashes for the SMS Retriever (Step 3).
 * The hash is signing-key specific: a debug build yields the debug hash, a
 * release build the release hash. Production SMS must carry the RELEASE hash.
 */
export async function getAppHashes(): Promise<string[]> {
  const mod = loadModule();
  if (!mod) return [];
  try {
    return await mod.getHash();
  } catch (error) {
    console.warn('[smsRetriever] getHash failed:', error);
    return [];
  }
}
