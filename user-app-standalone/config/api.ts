/**
 * API Configuration
 * Centralized API endpoint configuration for the application
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, DEFAULT_LANGUAGE } from '../config/languages';

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

export const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://192.168.254.102:4001/api'  // Android emulator
    : 'http://192.168.254.102:4001/api'  // iOS simulator/device
  : 'http://192.168.254.102:4001/api'; // Production

// export const API_BASE_URL = __DEV__
//   ? Platform.OS === 'android' 
//     ? 'https://test3.fstu.uz/api'  // Android emulator
//     : 'https://test3.fstu.uz/api'  // iOS simulator/device
//   : 'https://test3.fstu.uz/api'; // Production

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
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};

