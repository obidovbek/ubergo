/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, {
  createContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authReducer, initialAuthState, AuthState } from './auth-reducer/auth.reducer';
import { AUTH_ACTIONS } from './auth-reducer/auth.actions';
import { API_BASE_URL, API_ENDPOINTS, getHeaders } from '../config/api';
import type { User } from '../api/users';
import * as AuthAPI from '../api/auth';
import type { OtpSendResponse } from '../api/auth';
import { registerPushTokenWithBackend, subscribeTokenRefresh } from '../services/PushService';
import { clearPendingOtp } from '../utils/pendingOtp';
import { TOKEN_KEYS, onAuthLost } from '../utils/tokenStore';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  // Social auth methods
  googleSignIn: (idToken: string) => Promise<void>;
  appleSignIn: (idToken: string) => Promise<void>;
  facebookSignIn: (accessToken: string) => Promise<void>;
  // OTP methods
  sendOtp: (
    phone?: string,
    channel?: 'sms' | 'call' | 'push',
    opts?: { userId?: string }
  ) => Promise<OtpSendResponse>;
  verifyOtp: (phone: string | undefined, code: string, opts?: { userId?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// T-038: the token keys come from `tokenStore` so the two cannot drift — it is
// the module that reads and rewrites them during a refresh.
const STORAGE_KEYS = {
  TOKEN: TOKEN_KEYS.ACCESS,
  REFRESH: TOKEN_KEYS.REFRESH,
  USER: '@auth_user',
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Latest state, readable from callbacks that must NOT be re-created when it changes.
  // Every method below is memoized with no state deps (see the note on `value`), so a
  // callback that needs the current token reads it through here instead of a closure.
  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * T-038: every sign-in path stores the SAME three things. Before this the
   * refresh token was destructured at four call sites and dropped at all four,
   * so centralising it is what stops that happening a fifth time.
   */
  const persistSession = useCallback(
    async (user: unknown, access: string, refresh?: string | null) => {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
        refresh
          ? AsyncStorage.setItem(STORAGE_KEYS.REFRESH, refresh)
          : AsyncStorage.removeItem(STORAGE_KEYS.REFRESH),
      ]);
    },
    []
  );

  /** Everything a signed-out user must not leave behind. */
  const clearSession = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH),
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
      clearPendingOtp(),
    ]);
  }, []);

  /**
   * T-038: a refresh the server REJECTED means the session is genuinely over —
   * that, and only that, logs the user out here. A network failure does not.
   *
   * ⚠️ Deliberately does NOT push the refreshed token back into state. Doing so
   * would change `state.token` every ~15 minutes and re-run everything keyed on
   * it — the exact churn behind T-017's infinite profile-check loop. The
   * in-memory token is only a "signed in" marker; `getHeaders` resolves the
   * current token from storage on every request.
   */
  useEffect(() => {
    return onAuthLost(() => {
      console.warn('AuthContext: Refresh token rejected — ending the session');
      clearSession()
        .catch((error) => console.error('AuthContext: Failed to clear session:', error))
        .finally(() => dispatch({ type: AUTH_ACTIONS.LOGOUT }));
    });
  }, [clearSession]);

  // Defined first because the AppState effect below depends on it.
  const logout = useCallback(async () => {
    try {
      console.log('AuthContext: Starting logout process...');

      // Call logout endpoint if token exists
      const token = stateRef.current.token;
      if (token) {
        console.log('AuthContext: Calling logout API endpoint...');
        try {
          // T-038: this used to be a hand-rolled fetch with `headers:
          // getHeaders(token)` — NOT awaited, so `headers` was a Promise and the
          // request went out with no Authorization at all. It also never sent the
          // refresh token, so the server could revoke nothing. Survivable while
          // the refresh token was thrown away; not now that it is stored and
          // lives 7 days. `AuthAPI.logout` already sends both, correctly.
          const storedRefresh = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH);
          await AuthAPI.logout(token, storedRefresh || '');
          console.log('AuthContext: Logout API call successful');
        } catch (apiError) {
          console.warn('AuthContext: Logout API call failed, but continuing with local logout:', apiError);
        }
      }

      console.log('AuthContext: Clearing local storage...');
      await clearSession();

      console.log('AuthContext: Dispatching logout action...');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      console.log('AuthContext: Logout completed successfully');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      // Still clear local state even if API call fails
      try {
        await clearSession();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        console.log('AuthContext: Local logout completed despite error');
      } catch (clearError) {
        console.error('AuthContext: Failed to clear storage:', clearError);
        // Force logout even if storage clear fails
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    }
  }, []);

  // Initialize auth state from storage on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Register push token when authenticated (DRIVER APP)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (state.token) {
      registerPushTokenWithBackend(state.token).catch((error) => {
        console.error('Failed to register push token:', error);
      });
      unsubscribe = subscribeTokenRefresh(state.token);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [state.token]);

  // Refresh user data when app comes to foreground
  useEffect(() => {
    let isMounted = true;
    
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isMounted) {
        // Read the live state, not a render-time closure. Listing `state` in the deps
        // instead (as this used to) re-registers the OS listener on every state change.
        const currentState = stateRef.current;
        if (currentState.isAuthenticated && currentState.token) {
          // App came to foreground, refresh user data to get latest status
          try {
            console.log('AuthContext: App came to foreground, refreshing user data...');
            const currentUserResponse = await AuthAPI.getCurrentUser(currentState.token);
            
            // Handle different response formats
            let serverUser = null;
            if (currentUserResponse.data) {
              serverUser = currentUserResponse.data;
            } else if (currentUserResponse.user) {
              serverUser = currentUserResponse.user;
            } else if (currentUserResponse.id) {
              // Response is the user object directly
              serverUser = currentUserResponse;
            }
            
            if (serverUser && isMounted) {
              console.log('AuthContext: Refreshed user data on foreground:', { 
                id: serverUser.id, 
                status: serverUser.status 
              });
              // Update user with latest status from server
              await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(serverUser));
              dispatch({
                type: AUTH_ACTIONS.UPDATE_USER,
                payload: serverUser,
              });
            }
          } catch (error: any) {
            const status = error?.response?.status ?? error?.status;
            if (status === 401 || status === 403 || status === 404) {
              // Account deleted while the app was open — log out to the login screen (OR-002).
              console.warn(`AuthContext: Account invalid on foreground (status ${status}), logging out`);
              await logout();
            } else {
              console.warn('AuthContext: Failed to refresh user data on foreground:', error);
              // Don't throw error, just log it - app can continue with existing user data
            }
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [logout]);

  const initializeAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        
        // Verify user status with server to get latest status
        try {
          const currentUserResponse = await AuthAPI.getCurrentUser(token);
          
          // Handle different response formats
          let serverUser = null;
          if (currentUserResponse.data) {
            serverUser = currentUserResponse.data;
          } else if (currentUserResponse.user) {
            serverUser = currentUserResponse.user;
          } else if (currentUserResponse.id) {
            // Response is the user object directly
            serverUser = currentUserResponse;
          }
          
          if (serverUser) {
            console.log('AuthContext: Fetched user from server on init:', { 
              id: serverUser.id, 
              status: serverUser.status 
            });
            // Update user with latest status from server
            // This ensures we get the updated status if admin changed the driver status
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(serverUser));
            dispatch({
              type: AUTH_ACTIONS.LOGIN,
              payload: { user: serverUser, token },
            });

            // Register push token with backend (DRIVER APP)
            registerPushTokenWithBackend(token).catch((error) => {
              console.error('Failed to register push token on init:', error);
            });
          } else {
            console.warn('AuthContext: Unexpected response format, using stored user');
            // Fallback to stored user if server response is unexpected
            dispatch({
              type: AUTH_ACTIONS.LOGIN,
              payload: { user, token },
            });

            // Register push token with backend (DRIVER APP)
            registerPushTokenWithBackend(token).catch((error) => {
              console.error('Failed to register push token on init:', error);
            });
          }
        } catch (apiError: any) {
          const status = apiError?.response?.status ?? apiError?.status;
          if (status === 401 || status === 403 || status === 404) {
            // Account was deleted / token rejected — clear the cache and drop to the
            // login screen instead of trusting the stored user (OR-002).
            console.warn(`AuthContext: Account invalid on init (status ${status}), logging out`);
            // T-038: by the time we get here `getHeaders` has already tried to
            // refresh and failed, so a 401 now really does mean the session is
            // over — it is no longer just "the access token aged out".
            await clearSession();
            return; // stay unauthenticated → AuthNavigator (login/OTP); `finally` clears loading
          }

          console.warn('AuthContext: Failed to fetch current user (network?), using stored user:', apiError);
          // Network/server error — keep the stored user so the app still works offline.
          dispatch({
            type: AUTH_ACTIONS.LOGIN,
            payload: { user, token },
          });

          // Register push token with backend (DRIVER APP)
          registerPushTokenWithBackend(token).catch((error) => {
            console.error('Failed to register push token on init:', error);
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const headers = await getHeaders();
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.auth.login}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(credentials),
        }
      );

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const { user, token } = data;

      // T-038: these legacy email/password paths get no refresh token from the
      // server, so the session still ends at the access token's expiry. They are
      // unused by the shipped app (OTP and social sign-in are the live paths).
      await persistSession(user, token);

      dispatch({
        type: AUTH_ACTIONS.LOGIN,
        payload: { user, token },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const headers = await getHeaders();
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.auth.register}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const responseData = await response.json();
      const { user, token } = responseData;

      // T-038: these legacy email/password paths get no refresh token from the
      // server, so the session still ends at the access token's expiry. They are
      // unused by the shipped app (OTP and social sign-in are the live paths).
      await persistSession(user, token);

      dispatch({
        type: AUTH_ACTIONS.REGISTER,
        payload: { user, token },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      throw error;
    }
  }, []);

  // `logout` is defined near the top of the component — the AppState effect needs it.

  const updateUser = useCallback(async (user: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user });
      console.log('AuthContext: User updated:', { id: user.id, status: (user as any)?.status });
    } catch (error) {
      console.error('AuthContext: Failed to update user in storage:', error);
      // Still dispatch the update even if storage fails
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user });
    }
  }, []);

  const sendOtp = useCallback(async (phone?: string, channel: 'sms' | 'call' | 'push' = 'sms', opts?: { userId?: string }) => {
    try {
      // Don't set global loading state for OTP sending
      // This prevents interference with navigation
      // Returned so the OTP screen can drive its resend countdown from the server's
      // own `cooldownSec` rather than hard-coding the interval (T-033).
      return await AuthAPI.sendOtp(phone, channel, opts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      throw error;
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string | undefined, code: string, opts?: { userId?: string }) => {
    try {
      // Don't set global loading state for OTP verification
      // This prevents interference with navigation and 3-attempt logic
      
      const response = await AuthAPI.verifyOtp(phone, code, opts);
      const { user, access, refresh } = response.data;

      // T-038: `refresh` used to be destructured here and dropped on the floor.
      await persistSession(user, access, refresh);

      dispatch({
        type: AUTH_ACTIONS.LOGIN,
        payload: { user: user as any, token: access },
      });

      // Register push token with backend after successful login (DRIVER APP)
      registerPushTokenWithBackend(access).catch((error) => {
        console.error('Failed to register push token after OTP verification:', error);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify OTP';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      throw error;
    }
  }, []);

  const googleSignIn = useCallback(async (idToken: string) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await AuthAPI.googleSignIn(idToken);
      const { user, access, refresh } = response.data;

      // T-038: `refresh` used to be destructured here and dropped on the floor.
      await persistSession(user, access, refresh);

      dispatch({
        type: AUTH_ACTIONS.LOGIN,
        payload: { user: user as any, token: access },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      throw error;
    }
  }, []);

  const appleSignIn = useCallback(async (idToken: string) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await AuthAPI.appleSignIn(idToken);
      const { user, access, refresh } = response.data;

      // T-038: `refresh` used to be destructured here and dropped on the floor.
      await persistSession(user, access, refresh);

      dispatch({
        type: AUTH_ACTIONS.LOGIN,
        payload: { user: user as any, token: access },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Apple sign-in failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      throw error;
    }
  }, []);

  const facebookSignIn = useCallback(async (accessToken: string) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await AuthAPI.facebookSignIn(accessToken);
      const { user, access, refresh } = response.data;

      // T-038: `refresh` used to be destructured here and dropped on the floor.
      await persistSession(user, access, refresh);

      dispatch({
        type: AUTH_ACTIONS.LOGIN,
        payload: { user: user as any, token: access },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Facebook sign-in failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      throw error;
    }
  }, []);

  // LOAD-BEARING (T-017), not cosmetic. Every method above is memoized with no state
  // deps so that `value` changes only when `state` does. Consumers memoize their own
  // callbacks on these functions — `RootNavigator.checkDriverProfile` depends on
  // `logout` and `updateUser` — and that callback is in an effect's dep array. Hand out
  // fresh function identities on every render and the effect re-fires, calls
  // `updateUser`, changes state, re-renders this provider… an infinite check loop.
  // If you add a method here, memoize it too and read live state via `stateRef`.
  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      register,
      logout,
      updateUser,
      googleSignIn,
      appleSignIn,
      facebookSignIn,
      sendOtp,
      verifyOtp,
    }),
    [
      state,
      login,
      register,
      logout,
      updateUser,
      googleSignIn,
      appleSignIn,
      facebookSignIn,
      sendOtp,
      verifyOtp,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

