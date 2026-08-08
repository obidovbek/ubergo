/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authReducer, initialAuthState, AuthState } from './auth-reducer/auth.reducer';
import { AUTH_ACTIONS } from './auth-reducer/auth.actions';
import { API_BASE_URL, API_ENDPOINTS, getHeaders } from '../config/api';
import type { User } from '../api/users';
import * as AuthAPI from '../api/auth';
import type { OtpSendResponse } from '../api/auth';
import { registerPushTokenWithBackend, subscribeTokenRefresh } from '../services/PushService';
import { clearPendingOtp } from '../utils/pendingOtp';
import { clearRegistrationDraft } from '../utils/registrationDraft';
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
  updateUser: (user: User) => void;
  // Social auth methods
  googleSignIn: (idToken: string) => Promise<void>;
  appleSignIn: (idToken: string) => Promise<void>;
  facebookSignIn: (accessToken: string) => Promise<void>;
  // OTP methods
  sendOtp: (
    phone: string,
    channel?: 'sms' | 'call' | 'push'
  ) => Promise<OtpSendResponse>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
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

  /**
   * T-038: every sign-in path stores the SAME three things. Before this the
   * refresh token was destructured at four call sites and dropped at all four,
   * so centralising it is what stops that happening a fifth time.
   */
  const persistSession = async (user: unknown, access: string, refresh?: string | null) => {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      refresh
        ? AsyncStorage.setItem(STORAGE_KEYS.REFRESH, refresh)
        : AsyncStorage.removeItem(STORAGE_KEYS.REFRESH),
    ]);
  };

  /** Everything a signed-out user must not leave behind. */
  const clearSession = async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH),
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
      clearPendingOtp(),
      clearRegistrationDraft(),
    ]);
  };

  // Initialize auth state from storage on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * T-038: a refresh the server REJECTED means the session is genuinely over —
   * that, and only that, logs the user out here. A network failure does not.
   *
   * ⚠️ Deliberately does NOT push the refreshed token back into state. Doing so
   * would change `state.token` every ~15 minutes, re-running the push-token
   * effect below on a new identity each time — the exact churn that produced
   * T-017's infinite loop. The in-memory token is only a "signed in" marker;
   * `getHeaders` resolves the current token from storage on every request.
   */
  useEffect(() => {
    return onAuthLost(() => {
      console.warn('Refresh token rejected — ending the session');
      clearSession()
        .catch((error) => console.error('Failed to clear session:', error))
        .finally(() => dispatch({ type: AUTH_ACTIONS.LOGOUT }));
    });
  }, []);

  // Register push token when authenticated
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (state.token) {
      registerPushTokenWithBackend(state.token).catch(() => {});
      unsubscribe = subscribeTokenRefresh(state.token);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [state.token]);

  const initializeAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        
        // Verify user status with server
        try {
          const currentUser = await AuthAPI.getCurrentUser(token);
          if (currentUser.data) {
            // MERGE, don't replace: a field the endpoint doesn't send must keep its cached
            // value instead of becoming `undefined`. `/auth/me` used to omit `profile_complete`,
            // which silently turned a half-registered user into a "complete" one and sent them
            // to the main menu instead of back to the sign-up form (OR-006).
            const serverUser = { ...user, ...currentUser.data };
            // A blocked / pending_delete user is still stored and dispatched — RootNavigator
            // shows the blocked screen from `status`.
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(serverUser));
            dispatch({
              type: AUTH_ACTIONS.LOGIN,
              payload: { user: serverUser, token },
            });
          } else {
            // Fallback to stored user if server check fails
            dispatch({
              type: AUTH_ACTIONS.LOGIN,
              payload: { user, token },
            });
          }
        } catch (error: any) {
          const status = error?.response?.status ?? error?.status;
          if (status === 401 || status === 403 || status === 404) {
            // Account was deleted / token rejected — clear the cache and drop to the
            // login screen instead of trusting the stored user (OR-002).
            // T-038: by the time we get here `getHeaders` has already tried to
            // refresh and failed, so a 401 now really does mean the session is
            // over — it is no longer just "the access token aged out".
            console.warn(`Account invalid on init (status ${status}), logging out`);
            await clearSession();
            return; // stay unauthenticated → AuthNavigator (login/OTP); `finally` clears loading
          }
          // Network/server error — keep the stored user so the app still works offline.
          console.warn('Failed to verify user status, using stored user:', error);
          dispatch({
            type: AUTH_ACTIONS.LOGIN,
            payload: { user, token },
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.auth.login}`,
        {
          method: 'POST',
          headers: getHeaders(),
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
  };

  const register = async (data: RegisterData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.auth.register}`,
        {
          method: 'POST',
          headers: getHeaders(),
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
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Starting logout process...');
      
      // Call logout endpoint if token exists
      if (state.token) {
        console.log('AuthContext: Calling logout API endpoint...');
        try {
          // T-038: this used to be a hand-rolled fetch with `headers:
          // getHeaders(state.token)` — NOT awaited, so `headers` was a Promise
          // and the request went out with no Authorization at all. It also never
          // sent the refresh token, so the server could revoke nothing. That was
          // survivable while the refresh token was thrown away; now that it is
          // stored and lives 7 days, a logged-out device must not keep a usable
          // one. `AuthAPI.logout` already sends both, correctly.
          const storedRefresh = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH);
          await AuthAPI.logout(state.token, storedRefresh || '');
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
  };

  const updateUser = (user: User) => {
    AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user });
  };

  const sendOtp = async (phone: string, channel: 'sms' | 'call' | 'push' = 'sms') => {
    try {
      // Don't set global loading state for OTP sending
      // This prevents interference with navigation
      // Returned so the OTP screen can drive its resend countdown from the server's
      // own `cooldownSec` rather than hard-coding the interval (T-033).
      return await AuthAPI.sendOtp(phone, channel);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      throw error;
    }
  };

  const verifyOtp = async (phone: string, code: string) => {
    try {
      // Don't set global loading state for OTP verification
      // This prevents interference with navigation and 3-attempt logic
      
      const response = await AuthAPI.verifyOtp(phone, code);
      const { user, access, refresh } = response.data;

      // Check user status
      if (user.status === 'blocked' || user.status === 'pending_delete') {
        // User is blocked, but still allow login so they can see blocked screen
        // RootNavigator will handle showing the blocked screen
      }

      // T-038: `refresh` used to be destructured here and dropped on the floor.
      await persistSession(user, access, refresh);

      dispatch({
        type: AUTH_ACTIONS.LOGIN,
        payload: { user: user as any, token: access },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify OTP';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      throw error;
    }
  };

  const googleSignIn = async (idToken: string) => {
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
  };

  const appleSignIn = async (idToken: string) => {
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
  };

  const facebookSignIn = async (accessToken: string) => {
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
  };

  const value: AuthContextType = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

