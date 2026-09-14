/**
 * T-118 — Jest setup, loaded once per test file (`setupFilesAfterEnv`).
 *
 * Two jobs, and nothing else lives here:
 *
 *   1. Mock the native modules `jest-expo` does not know — ONCE, so no test file has to.
 *      Firebase, Google sign-in and the SMS retriever have no JS fallback; importing them
 *      under Node throws before any test runs.
 *
 *   2. Turn the translation hook's `console.warn` into a FAILURE. `useTranslation` returns
 *      the key itself when a key is missing and only *warns* — on a phone that is a raw
 *      `some.key` on screen, and the i18n checkers can only grep for it. Under test a
 *      rendered screen that warns is a red test. The trap is per test, so the failure names
 *      the test that rendered the key.
 *
 * ⚠️ Rule 6: boring. Every mock returns the quietest plausible value (permission granted,
 * a fixed token, listeners that unsubscribe). A test that needs a specific answer overrides
 * the mock locally with `jest.mocked(...)`.
 */
import { afterEach, beforeEach, jest } from '@jest/globals';

// ── native modules ─────────────────────────────────────────────────────────

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-firebase/messaging', () => {
  const unsubscribe = () => undefined;
  const instance = {
    requestPermission: async () => 1,
    hasPermission: async () => 1,
    getToken: async () => 'test-fcm-token',
    deleteToken: async () => undefined,
    onTokenRefresh: () => unsubscribe,
    onMessage: () => unsubscribe,
    onNotificationOpenedApp: () => unsubscribe,
    getInitialNotification: async () => null,
    setBackgroundMessageHandler: () => undefined,
    registerDeviceForRemoteMessages: async () => undefined,
  };
  const messaging = Object.assign(() => instance, {
    AuthorizationStatus: { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
  });
  return { __esModule: true, default: messaging };
});

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: { apps: [], app: () => ({ name: '[DEFAULT]' }) },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: () => undefined,
    hasPlayServices: async () => true,
    signIn: async () => ({ type: 'cancelled', data: null }),
    signOut: async () => undefined,
    revokeAccess: async () => undefined,
    getTokens: async () => ({ idToken: 'test-id-token', accessToken: 'test-access-token' }),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

// `utils/smsRetriever.ts` reads the functions straight off the `require`d module, so they
// sit at the top level as well as under `default`.
jest.mock('react-native-otp-verify', () => {
  const api = {
    getHash: async () => ['asNtyBnPVzB'],
    getOtp: async () => true,
    addListener: () => ({ remove: () => undefined }),
    removeListener: () => undefined,
  };
  return { __esModule: true, default: api, ...api };
});

// Fonts are a device concern (T-101 goal 2). Under test every face is "loaded".
jest.mock('expo-font', () => ({
  ...(jest.requireActual('expo-font') as object),
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: async () => undefined,
}));

// ── the translation trap ───────────────────────────────────────────────────

const TRANSLATION_WARNING_PREFIX = 'Translation key';
const realWarn = console.warn;
let translationWarnings: string[] = [];

beforeEach(() => {
  translationWarnings = [];
  console.warn = (...args: unknown[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (first.startsWith(TRANSLATION_WARNING_PREFIX)) {
      translationWarnings.push(first);
      return;
    }
    realWarn(...args);
  };
});

afterEach(() => {
  console.warn = realWarn;
  if (translationWarnings.length === 0) return;
  const list = translationWarnings.join('\n  ');
  translationWarnings = [];
  throw new Error(`A rendered screen used a missing translation key:\n  ${list}`);
});
