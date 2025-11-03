/**
 * API Configuration
 * Centralized API endpoint configuration for the application
 */

import { Platform } from 'react-native';

// Base API URL - Update this based on your environment 
// Production: https://test3.fstu.uz/api 
// Development: http://10.0.2.2:4001/api
//http://10.0.2.2:4001/api
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
    list: '/driver',
    detail: (id: string) => `/driver/${id}`,
    rating: (id: string) => `/driver/${id}/rating`,
  },
  devices: {
    register: '/devices/register',
  },
};

// API Timeout
export const API_TIMEOUT = 30000; // 30 seconds

// Request Headers
export const getHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

