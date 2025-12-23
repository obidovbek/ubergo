/**
 * API Configuration
 * Centralized API endpoint configuration for the application
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, DEFAULT_LANGUAGE } from '../config/languages';

// Base API URL - Update this based on your environment 
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
  // ? Platform.OS === 'android' 
  //   ? 'https://test3.fstu.uz/api'  // Android emulator
  //   : 'https://test3.fstu.uz/api'  // iOS simulator/device
  // : 'https://test3.fstu.uz/api'; // Production
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
    list: '/driver',
    detail: (id: string) => `/driver/${id}`,
    rating: (id: string) => `/driver/${id}/rating`,
  },
  devices: {
    register: '/devices/register',
  },
  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    delete: (id: string) => `/notifications/${id}`,
  },
  driverOffers: {
    list: '/driver/offers',
    create: '/driver/offers',
    detail: (id: string) => `/driver/offers/${id}`,
    update: (id: string) => `/driver/offers/${id}`,
    cancel: (id: string) => `/driver/offers/${id}/cancel`,
    publish: (id: string) => `/driver/offers/${id}/publish`,
    archive: (id: string) => `/driver/offers/${id}/archive`,
    delete: (id: string) => `/driver/offers/${id}`,
  },
  vehicles: {
    list: '/driver/profile',
  },
};

// API Timeout
export const API_TIMEOUT = 30000; // 30 seconds

// Request Headers
export const getHeaders = async (token?: string): Promise<Record<string, string>> => {
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

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

