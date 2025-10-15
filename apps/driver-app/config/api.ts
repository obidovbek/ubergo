/**
 * API Configuration
 * Centralized API endpoint configuration for the application
 */

// Base API URL - Update this based on your environment
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api' // Development
  : 'https://api.production.com'; // Production

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    verifyToken: '/auth/verify',
  },
  user: {
    profile: '/user/profile',
    update: '/user/update',
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

