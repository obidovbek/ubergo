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
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      // Call logout endpoint if token exists
      if (state.token) {
        await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.logout}`, {
          method: 'POST',
          headers: getHeaders(state.token),
        });
      }

      // Clear storage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const updateUser = (user: User) => {
    AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

