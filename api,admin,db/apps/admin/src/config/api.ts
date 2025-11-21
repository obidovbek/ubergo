/**
 * API Configuration
 * Centralized API endpoint configuration
 */

// Base API URL - Update based on environment http://localhost:4001/api || https://test3.fstu.uz/api
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001/api';

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
  geo: {
    countries: {
      list: '/admin/geo/countries',
      detail: (id: number | string) => `/admin/geo/countries/${id}`,
      create: '/admin/geo/countries',
      update: (id: number | string) => `/admin/geo/countries/${id}`,
      delete: (id: number | string) => `/admin/geo/countries/${id}`,
    },
    provinces: {
      list: '/admin/geo/provinces',
      detail: (id: number | string) => `/admin/geo/provinces/${id}`,
      create: '/admin/geo/provinces',
      update: (id: number | string) => `/admin/geo/provinces/${id}`,
      delete: (id: number | string) => `/admin/geo/provinces/${id}`,
    },
    cityDistricts: {
      list: '/admin/geo/city-districts',
      create: '/admin/geo/city-districts',
      update: (id: number | string) => `/admin/geo/city-districts/${id}`,
      delete: (id: number | string) => `/admin/geo/city-districts/${id}`,
    },
    administrativeAreas: {
      list: '/admin/geo/administrative-areas',
      create: '/admin/geo/administrative-areas',
      update: (id: number | string) => `/admin/geo/administrative-areas/${id}`,
      delete: (id: number | string) => `/admin/geo/administrative-areas/${id}`,
    },
    settlements: {
      list: '/admin/geo/settlements',
      create: '/admin/geo/settlements',
      update: (id: number | string) => `/admin/geo/settlements/${id}`,
      delete: (id: number | string) => `/admin/geo/settlements/${id}`,
    },
    neighborhoods: {
      list: '/admin/geo/neighborhoods',
      create: '/admin/geo/neighborhoods',
      update: (id: number | string) => `/admin/geo/neighborhoods/${id}`,
      delete: (id: number | string) => `/admin/geo/neighborhoods/${id}`,
    },
  },
  vehicleMakes: {
    list: '/admin/vehicle-makes',
    detail: (id: string) => `/admin/vehicle-makes/${id}`,
    create: '/admin/vehicle-makes',
    update: (id: string) => `/admin/vehicle-makes/${id}`,
    delete: (id: string) => `/admin/vehicle-makes/${id}`,
  },
  vehicleModels: {
    list: '/admin/vehicle-models',
    detail: (id: string) => `/admin/vehicle-models/${id}`,
    create: '/admin/vehicle-models',
    update: (id: string) => `/admin/vehicle-models/${id}`,
    delete: (id: string) => `/admin/vehicle-models/${id}`,
  },
  vehicleBodyTypes: {
    list: '/admin/vehicle-body-types',
    detail: (id: string) => `/admin/vehicle-body-types/${id}`,
    create: '/admin/vehicle-body-types',
    update: (id: string) => `/admin/vehicle-body-types/${id}`,
    delete: (id: string) => `/admin/vehicle-body-types/${id}`,
  },
  vehicleColors: {
    list: '/admin/vehicle-colors',
    detail: (id: string) => `/admin/vehicle-colors/${id}`,
    create: '/admin/vehicle-colors',
    update: (id: string) => `/admin/vehicle-colors/${id}`,
    delete: (id: string) => `/admin/vehicle-colors/${id}`,
  },
  vehicleTypes: {
    list: '/admin/vehicle-types',
    detail: (id: string) => `/admin/vehicle-types/${id}`,
    create: '/admin/vehicle-types',
    update: (id: string) => `/admin/vehicle-types/${id}`,
    delete: (id: string) => `/admin/vehicle-types/${id}`,
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

