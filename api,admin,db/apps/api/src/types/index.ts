/**
 * TypeScript Type Definitions
 */

import type { Request } from 'express';
import { UserRole, UserStatus, RideStatus, RideType, PaymentStatus, PaymentMethod } from '../constants';

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Auth Types
export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: UserDTO;
  token: string;
  refreshToken: string;
}

// Request with User
export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

// Ride Types
export interface Ride {
  id: string;
  userId: string;
  driverId?: string;
  pickup: Location;
  destination: Location;
  rideType: RideType;
  status: RideStatus;
  fare: number;
  distance: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

// Driver Types
export interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleModel: string;
  vehiclePlate: string;
  rating: number;
  totalRides: number;
  isAvailable: boolean;
  currentLocation?: Location;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Types
export interface Payment {
  id: string;
  rideId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Query Filter Types
export interface QueryFilters {
  [key: string]: any;
}

