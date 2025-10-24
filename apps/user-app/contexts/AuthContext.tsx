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
  sendOtp: (phone: string, channel?: 'sms' | 'call') => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
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

  const initializeAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        dispatch({
          type: AUTH_ACTIONS.LOGIN,
          payload: { user, token },
        });
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

  const updateUser = (user: User) => {
    AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user });
  };

  const sendOtp = async (phone: string, channel: 'sms' | 'call' = 'sms') => {
    try {
      // Don't set global loading state for OTP sending
      // This prevents interference with navigation
      await AuthAPI.sendOtp(phone, channel);
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

