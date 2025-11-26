/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authReducer, initialAuthState, AuthState } from './auth-reducer/auth.reducer';
import { AUTH_ACTIONS } from './auth-reducer/auth.actions';
import { API_BASE_URL, API_ENDPOINTS, getHeaders } from '../config/api';
import type { User } from '../api/users';
import * as AuthAPI from '../api/auth';

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
  sendOtp: (phone?: string, channel?: 'sms' | 'call' | 'push', opts?: { userId?: string }) => Promise<void>;
  verifyOtp: (phone: string | undefined, code: string, opts?: { userId?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
  TOKEN: '@auth_token',
  USER: '@auth_user',
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Initialize auth state from storage on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Refresh user data when app comes to foreground
  useEffect(() => {
    let isMounted = true;
    
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isMounted) {
        // Get current state from reducer (not from closure)
        const currentState = state;
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
          } catch (error) {
            console.warn('AuthContext: Failed to refresh user data on foreground:', error);
            // Don't throw error, just log it - app can continue with existing user data
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [state.isAuthenticated, state.token, state]);

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
          } else {
            console.warn('AuthContext: Unexpected response format, using stored user');
            // Fallback to stored user if server response is unexpected
            dispatch({
              type: AUTH_ACTIONS.LOGIN,
              payload: { user, token },
            });
          }
        } catch (apiError) {
          console.warn('AuthContext: Failed to fetch current user from server, using stored user:', apiError);
          // If API call fails, use stored user (might be offline)
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

      // Store credentials
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ]);

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

      // Store credentials
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ]);

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
          await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.logout}`, {
            method: 'POST',
            headers: getHeaders(state.token),
          });
          console.log('AuthContext: Logout API call successful');
        } catch (apiError) {
          console.warn('AuthContext: Logout API call failed, but continuing with local logout:', apiError);
        }
      }

      console.log('AuthContext: Clearing local storage...');
      // Clear storage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);

      console.log('AuthContext: Dispatching logout action...');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      console.log('AuthContext: Logout completed successfully');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      // Still clear local state even if API call fails
      try {
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.USER),
        ]);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        console.log('AuthContext: Local logout completed despite error');
      } catch (clearError) {
        console.error('AuthContext: Failed to clear storage:', clearError);
        // Force logout even if storage clear fails
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    }
  };

  const updateUser = async (user: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user });
      console.log('AuthContext: User updated:', { id: user.id, status: (user as any)?.status });
    } catch (error) {
      console.error('AuthContext: Failed to update user in storage:', error);
      // Still dispatch the update even if storage fails
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user });
    }
  };

  const sendOtp = async (phone?: string, channel: 'sms' | 'call' | 'push' = 'sms', opts?: { userId?: string }) => {
    try {
      // Don't set global loading state for OTP sending
      // This prevents interference with navigation
      await AuthAPI.sendOtp(phone, channel, opts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      throw error;
    }
  };

  const verifyOtp = async (phone: string | undefined, code: string, opts?: { userId?: string }) => {
    try {
      // Don't set global loading state for OTP verification
      // This prevents interference with navigation and 3-attempt logic
      
      const response = await AuthAPI.verifyOtp(phone, code, opts);
      const { user, access, refresh } = response.data;

      // Store credentials
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ]);

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

      // Store credentials
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ]);

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

      // Store credentials
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ]);

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

      // Store credentials
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ]);

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

