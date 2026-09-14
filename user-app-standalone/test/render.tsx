/**
 * T-118 step 3 — the render harness.
 *
 * `renderScreen(ui)` mounts `ui` inside everything a real screen gets from `App.tsx`, so a
 * test can render a screen in one line and then behave like a user: find a control by its
 * accessible name, press it, read what changed, check what left for the API.
 *
 * What is REAL here, and why:
 *   - `LanguageProvider` — real, so `useTranslation` resolves the real `uz` strings (the
 *     AsyncStorage mock answers `null`, which is the default language). A test that wants
 *     `ru` or `en` seeds the mock before rendering.
 *   - `NavigationContainer` + a one-screen native stack — real, so `useNavigation()` and
 *     `useRoute()` inside the screen are the real hooks. `params` become `route.params`.
 *   - `SafeAreaProvider` with fixed metrics — real, so `useSafeAreaInsets()` returns numbers
 *     instead of throwing outside a provider.
 *   - `ConfirmDialogProvider` — real, so `showConfirmDialog` renders the real dialog and a
 *     test can press its buttons.
 *
 * What is STUBBED, and why:
 *   - `AuthContext` — the real `AuthProvider` reads AsyncStorage, validates the token against
 *     the API and registers a push token on mount; none of that belongs in a screen test.
 *     `buildAuth()` supplies a signed-in `TEST_USER` and `jest.fn()` methods. Pass
 *     `{ auth: { user: null, isAuthenticated: false } }` for the signed-out state.
 *
 * ⚠️ NOT included: `NotificationProvider` (polls the API on mount; only `MenuScreen` and
 * `NotificationsScreen` read it — add an option when one of those gets a test).
 *
 * ⚠️ The API layer is NOT stubbed here. Each test file mocks the `api/*` module it needs at
 * the top (`jest.mock('../api/passengerOffers')`) — `jest.mock` is hoisted per FILE, so a
 * helper cannot do it for you. See `CreatePassengerOfferScreen.test.tsx` for the pattern.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, render, type RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import type { User } from '../api/users';
import { AuthContext } from '../contexts/AuthContext';
import { initialAuthState } from '../contexts/auth-reducer/auth.reducer';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ConfirmDialogProvider } from '../utils/confirmDialog';

export type AuthValue = NonNullable<React.ContextType<typeof AuthContext>>;

/** A signed-in passenger. Deliberately plain — tests that care about a field set it. */
export const TEST_USER: User = {
  id: 'user-test-1',
  name: 'Test Yolovchi',
  email: 'test@example.com',
  phone: '+998901234567',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/** A 390×844 phone with a notch and a home indicator — the artboards' frame. */
const SAFE_AREA: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** The auth context a signed-in screen sees. Every method is a fresh `jest.fn()`. */
export const buildAuth = (overrides: Partial<AuthValue> = {}): AuthValue => ({
  ...initialAuthState,
  isAuthenticated: true,
  user: TEST_USER,
  token: 'test-access-token',
  logout: jest.fn<AuthValue['logout']>(),
  updateUser: jest.fn<AuthValue['updateUser']>(),
  googleSignIn: jest.fn<AuthValue['googleSignIn']>(),
  appleSignIn: jest.fn<AuthValue['appleSignIn']>(),
  facebookSignIn: jest.fn<AuthValue['facebookSignIn']>(),
  sendOtp: jest.fn<AuthValue['sendOtp']>(),
  verifyOtp: jest.fn<AuthValue['verifyOtp']>(),
  ...overrides,
});

export interface RenderScreenOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Overrides on the signed-in default; `{ user: null, isAuthenticated: false }` = signed out. */
  auth?: Partial<AuthValue>;
  /** The route name the screen sees in `useRoute().name`. */
  routeName?: string;
  /** Becomes `useRoute().params`. */
  params?: Record<string, unknown>;
  /**
   * Extra routes the screen under test may `navigate()` to, by name. Registering one turns a
   * navigation into a REAL screen change the test can then keep working on (phone → OTP).
   * Unregistered names are swallowed silently — see `onUnhandledAction` below.
   */
  screens?: Record<string, React.ComponentType>;
}

const Stack = createNativeStackNavigator();

/**
 * Render `ui` as the only screen of a real navigator, under the real providers.
 * Returns everything RNTL's `render` returns, plus the auth value that was injected so a
 * test can assert on `auth.logout` etc.
 *
 * ASYNC ON PURPOSE. `LanguageProvider` reads AsyncStorage on mount and sets state when the
 * read resolves — after a synchronous `render` returns, which React reports as an update
 * outside `act`. Real screens do the same with their first API call. So the harness lets one
 * round of mount-time promises settle before handing the tree back; a test that mocks a
 * slower API still awaits `findBy…` for that.
 */
export async function renderScreen(
  ui: React.ReactElement,
  { auth, routeName = 'TestScreen', params, screens = {}, ...options }: RenderScreenOptions = {},
) {
  const authValue = buildAuth(auth);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaProvider initialMetrics={SAFE_AREA}>
      <LanguageProvider>
        <AuthContext.Provider value={authValue}>
          <ConfirmDialogProvider>
            {/* One screen means "go back" has nowhere to go; that is expected, not a warning. */}
            <NavigationContainer onUnhandledAction={() => undefined}>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name={routeName} initialParams={params}>
                  {() => <>{children}</>}
                </Stack.Screen>
                {Object.entries(screens).map(([name, component]) => (
                  <Stack.Screen key={name} name={name} component={component} />
                ))}
              </Stack.Navigator>
            </NavigationContainer>
          </ConfirmDialogProvider>
        </AuthContext.Provider>
      </LanguageProvider>
    </SafeAreaProvider>
  );

  const result = render(ui, { wrapper: Wrapper, ...options });
  await act(async () => {
    await Promise.resolve();
  });
  return { ...result, auth: authValue };
}
