/**
 * T-118 step 3 — the render harness (driver app).
 *
 * A deliberate copy of the user app's `test/render.tsx` (the two apps duplicate shared code
 * on purpose), with two differences the driver app forces:
 *   - **no `LanguageProvider`** — the driver's `useTranslation` keeps its language in local
 *     state, there is no context to provide;
 *   - **the auth value has no social sign-in methods** (T-076 removed them) and its
 *     `updateUser` returns a promise;
 *   - **there is no `User` type** — `contexts/AuthContext.tsx` imports one from `api/users`,
 *     which only exports `DriverProfile`. That unresolved import is one of the 28 baseline
 *     `tsc` errors, and `user` is effectively `any` there. The stub is typed as the profile
 *     the screens actually read.
 *
 * `renderScreen(ui)` mounts `ui` inside everything a real screen gets from `App.tsx`, so a
 * test can render a screen in one line and then behave like a user: find a control by its
 * accessible name, press it, read what changed, check what left for the API.
 *
 * What is REAL: `NavigationContainer` + a one-screen native stack (so `useNavigation()` and
 * `useRoute()` are the real hooks and `params` become `route.params`), `SafeAreaProvider`
 * with fixed metrics, `ConfirmDialogProvider`.
 *
 * What is STUBBED: `AuthContext` — the real `AuthProvider` reads AsyncStorage, validates the
 * token against the API and registers a push token on mount; none of that belongs in a
 * screen test. `buildAuth()` supplies a signed-in `TEST_DRIVER` and `jest.fn()` methods.
 * Pass `{ auth: { user: null, isAuthenticated: false } }` for the signed-out state.
 *
 * ⚠️ The API layer is NOT stubbed here. Each test file mocks the `api/*` module it needs at
 * the top (`jest.mock('../api/driverOffers')`) — `jest.mock` is hoisted per FILE, so a
 * helper cannot do it for you.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, render, type RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import type { DriverProfile } from '../api/users';
import { AuthContext } from '../contexts/AuthContext';
import { initialAuthState } from '../contexts/auth-reducer/auth.reducer';
import { ConfirmDialogProvider } from '../utils/confirmDialog';

export type AuthValue = NonNullable<React.ContextType<typeof AuthContext>>;

/** A signed-in, verified driver. Deliberately plain — tests that care about a field set it. */
export const TEST_DRIVER: DriverProfile = {
  id: 'driver-test-1',
  phone_e164: '+998901234567',
  first_name: 'Test',
  last_name: 'Haydovchi',
  display_name: 'Test Haydovchi',
  driver_type: 'driver',
  role: 'driver',
  status: 'active',
  is_verified: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
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
  user: TEST_DRIVER,
  token: 'test-access-token',
  logout: jest.fn<AuthValue['logout']>(),
  updateUser: jest.fn<AuthValue['updateUser']>(),
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
 * ASYNC ON PURPOSE (same as the user app): real screens fire their first API call on mount
 * and set state when it resolves — after a synchronous `render` returns, which React reports
 * as an update outside `act`. The harness lets one round of mount-time promises settle
 * before handing the tree back; a test that mocks a slower API still awaits `findBy…`.
 */
export async function renderScreen(
  ui: React.ReactElement,
  { auth, routeName = 'TestScreen', params, screens = {}, ...options }: RenderScreenOptions = {},
) {
  const authValue = buildAuth(auth);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaProvider initialMetrics={SAFE_AREA}>
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
    </SafeAreaProvider>
  );

  const result = render(ui, { wrapper: Wrapper, ...options });
  await act(async () => {
    await Promise.resolve();
  });
  return { ...result, auth: authValue };
}
