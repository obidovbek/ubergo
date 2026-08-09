/**
 * API Configuration
 * Centralized API endpoint configuration for the application
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, DEFAULT_LANGUAGE } from '../config/languages';
// Storage + JWT decoding only, no network — so importing it here cannot create a
// cycle with `api/auth.ts`, which imports this file (T-038).
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpiringSoon,
  notifyAuthLost,
  setTokens,
} from '../utils/tokenStore';

// Base API URL - Update this based on your environment 
// Production: https://test3.fstu.uz/api 
// Development: http://10.0.2.2:4001/api
// ? Platform.OS === 'android' 
// ? 'http://10.0.2.2:4001/api'  // Android emulator
// : 'http://localhost:4001/api'  // iOS simulator/device
// : 'https://test3.fstu.uz/api'; // Production
// export const API_BASE_URL = __DEV__
//   ? Platform.OS === 'android'
//     ? 'http://10.0.2.2:4001/api'  // Android emulator
//     : 'http://10.0.2.2:4001/api'  // iOS simulator/device
//   : 'http://10.0.2.2:4001/api'; // Production

// export const API_BASE_URL = __DEV__
//   ? Platform.OS === 'android'
//     ? 'http://10.93.67.8:4001/api'  // Android emulator
//     : 'http://10.93.67.8:4001/api'  // iOS simulator/device
//   : 'http://10.93.67.8:4001/api'; // Production

export const API_BASE_URL = __DEV__
  ? Platform.OS === 'android' 
    ? 'https://test3.fstu.uz/api'  // Android emulator
    : 'https://test3.fstu.uz/api'  // iOS simulator/device
  : 'https://test3.fstu.uz/api'; // Production

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    verifyToken: '/auth/verify',
    // OTP endpoints
    sendOtp: '/auth/otp/send',
    verifyOtp: '/auth/otp/verify',
    // Social auth endpoints
    googleAuth: '/auth/social/google',
    appleAuth: '/auth/social/apple',
    facebookAuth: '/auth/social/facebook',
    // User info
    me: '/auth/me',
  },
  user: {
    profile: '/user/profile',
    update: '/user/update',
    updateProfile: '/user/profile',
    avatar: '/user/avatar',
  },
  rides: {
    list: '/rides',
    create: '/rides/create',
    detail: (id: string) => `/rides/${id}`,
    cancel: (id: string) => `/rides/${id}/cancel`,
  },
  drivers: {
    list: '/drivers',
    detail: (id: string) => `/drivers/${id}`,
    rating: (id: string) => `/drivers/${id}/rating`,
  },
  devices: {
    register: '/devices/register',
  },
  metadata: {
    countries: '/countries',
  },
  support: {
    contact: '/support-contacts',
  },
  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    delete: (id: string) => `/notifications/${id}`,
  },
  offers: {
    search: '/public/driver-offers',
    detail: (id: number) => `/public/driver-offers/${id}`,
    join: (id: number) => `/passenger/offers/${id}/join`,
  },
  passenger: {
    bookings: '/passenger/bookings',
    cancelBooking: (id: string) => `/passenger/bookings/${id}/cancel`,
  },
  PASSENGER_OFFERS: '/passenger/offers',
};

// API Timeout
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * The one in-flight refresh (T-038).
 *
 * ⚠️ This is NOT an optimisation. `rotateTokens` on the server revokes the old
 * refresh token the instant it is used, so two concurrent refreshes would burn
 * the token and the second would fail — logging the user out for no reason.
 * Every caller must wait on the same promise.
 */
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Swaps the stored refresh token for a fresh pair. Returns the new access
 * token, or `null` if we could not get one.
 *
 * ⚠️ T-041: "could not get one" is NOT the same as "the session is over", and
 * conflating the two is what kept logging users out after T-038 shipped. Only a
 * refresh the server actively REJECTED — 401 or 403 — ends the session. Every
 * other outcome (429, 5xx, a timeout, a body we cannot read) leaves both tokens
 * on disk and says nothing, exactly like the offline path.
 *
 * The 429 is not hypothetical. `/auth/refresh` shares a 20-request/15-minute
 * per-IP budget with `/auth/logout` and `GET /auth/me` — and `/auth/me` fires on
 * every app launch, with both apps on one phone counting against the same IP.
 * Proven against the live API 2026-08-09: the 21st call returns 429. Treating
 * that as fatal threw away a perfectly good refresh token and forced a
 * re-login, which cost more auth requests, which made the next 429 likelier.
 */
const performTokenRefresh = async (): Promise<string | null> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    // Nothing to refresh with — an install that logged in before T-038 shipped.
    // T-041: deliberately NOT a session end. Rebuilding the app does not clear
    // AsyncStorage, so these installs simply have to sign in once; wiping
    // storage from here would just be the same over-reaction in another place.
    console.warn(
      'Token refresh skipped: no refresh token on disk (pre-T-038 session — sign out and in once)'
    );
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    // Built by hand rather than via `getHeaders` — that is the function calling
    // us, and reusing it here would recurse.
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // T-041: the ONLY two fatal statuses. 401 — the refresh token is expired,
      // revoked or forged; 403 — the server refuses it outright. Either way the
      // session is genuinely finished and there is nothing to preserve.
      if (response.status === 401 || response.status === 403) {
        console.warn(
          `Session ended: /auth/refresh rejected the refresh token (HTTP ${response.status})`
        );
        await clearTokens();
        notifyAuthLost();
        return null;
      }

      // Anything else is the server having a bad moment, not a verdict on this
      // session — 429 from the shared auth limiter, a 5xx, a gateway error.
      // Keep both tokens: the caller falls back to the stale access token, so
      // this one request 401s and the next attempt can still succeed.
      console.warn(`Token refresh failed (HTTP ${response.status}); keeping the session`);
      return null;
    }

    const body = await response.json().catch(() => null);
    const access: string | undefined = body?.data?.access;
    const refresh: string | undefined = body?.data?.refresh;

    if (!access) {
      // T-041: a 200 we cannot read is a defect on the server, not a rejection
      // of this session — it used to log the user out. If the server really did
      // rotate and we lost the new pair, the stored refresh token is now
      // revoked and the NEXT attempt gets a 401, which ends the session through
      // the branch above. That is the right way to reach that conclusion.
      console.warn('Token refresh returned 200 with no access token; keeping the session');
      return null;
    }

    // The endpoint ROTATES: it returns a new refresh token too, and the one we
    // just sent is already revoked. Persisting both is not optional.
    await setTokens(access, refresh);
    return access;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Token refresh failed (network); keeping the session:', error);
    return null;
  }
};

/**
 * Returns a usable access token, refreshing first if the current one is spent.
 * Falls back to the token it was given, so a failed refresh degrades to the old
 * behaviour (a 401) rather than to a request with no credentials at all.
 */
export const ensureFreshAccessToken = async (token: string): Promise<string> => {
  if (!isTokenExpiringSoon(token)) return token;

  // ⚠️ Screens hold the token they were given at sign-in, so after a refresh the
  // caller's copy is stale for the rest of the session. Without this re-read,
  // every subsequent request would see an "expired" token and rotate again —
  // burning a refresh token per request. Check what is actually on disk first.
  const stored = await getAccessToken();
  if (stored && !isTokenExpiringSoon(stored)) return stored;

  if (!refreshInFlight) {
    refreshInFlight = performTokenRefresh().finally(() => {
      refreshInFlight = null;
    });
  }

  const refreshed = await refreshInFlight;
  return refreshed || stored || token;
};

// Request Headers
export const getHeaders = async (token?: string | null): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add Accept-Language header based on current language (default: uz)
  try {
    const storedLanguage = await AsyncStorage.getItem('@app_language');
    const language: Language = (storedLanguage as Language) || DEFAULT_LANGUAGE;
    const localeMap: Record<Language, string> = {
      uz: 'uz-UZ',
      en: 'en-US',
      ru: 'ru-RU',
    };
    headers['Accept-Language'] = localeMap[language] || 'uz-UZ';
  } catch (error) {
    // Default to Uzbek if language retrieval fails
    headers['Accept-Language'] = 'uz-UZ';
  }

  // If token is provided and valid, use it; otherwise try to get from storage
  let authToken: string | null = null;
  
  // Check if provided token is valid (not null, undefined, or empty string)
  if (token && typeof token === 'string' && token.trim().length > 0) {
    authToken = token;
  } else {
    // Try to get from storage
    try {
      const storedToken = await AsyncStorage.getItem('@auth_token');
      if (storedToken && storedToken.trim().length > 0) {
        authToken = storedToken;
      }
    } catch (error) {
      console.warn('Failed to get token from storage:', error);
    }
  }

  if (authToken) {
    // T-038: the choke point. Every authenticated call in the app already
    // awaits this function, so refreshing here covers all of them at once —
    // no per-call-site retry wrapper needed.
    authToken = await ensureFreshAccessToken(authToken);
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};

