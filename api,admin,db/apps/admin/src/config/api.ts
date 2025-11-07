/**
 * API Configuration
 * Centralized API endpoint configuration
 */

// Base API URL - Update based on environment http://localhost:4001/api
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://test3.fstu.uz/api';

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/admin/auth/login',
    logout: '/admin/auth/logout',
    refresh: '/admin/auth/refresh',
    me: '/admin/auth/me',
  },
  adminUsers: {
    list: '/admin/users',
    detail: (id: string) => `/admin/users/${id}`,
    create: '/admin/users',
    update: (id: string) => `/admin/users/${id}`,
    delete: (id: string) => `/admin/users/${id}`,
  },
  users: {
    list: '/users',
    detail: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
  passengers: {
    list: '/admin/passengers',
    detail: (id: string) => `/admin/passengers/${id}`,
    update: (id: string) => `/admin/passengers/${id}`,
    delete: (id: string) => `/admin/passengers/${id}`,
  },
  drivers: {
    list: '/admin/drivers',
    detail: (id: string) => `/admin/drivers/${id}`,
    update: (id: string) => `/admin/drivers/${id}`,
    delete: (id: string) => `/admin/drivers/${id}`,
    approve: (id: string) => `/drivers/${id}/approve`,
    reject: (id: string) => `/drivers/${id}/reject`,
  },
  countries: {
    list: '/admin/countries',
    detail: (id: string) => `/admin/countries/${id}`,
    create: '/admin/countries',
    update: (id: string) => `/admin/countries/${id}`,
    delete: (id: string) => `/admin/countries/${id}`,
  },
  rides: {
    list: '/rides',
    detail: (id: string) => `/rides/${id}`,
    stats: '/rides/stats',
  },
};

// API Timeout
export const API_TIMEOUT = 30000; // 30 seconds

// Request Headers
export const getHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

