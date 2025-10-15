/**
 * Rides API
 * Handles all ride-related API requests
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Ride {
  id: string;
  userId: string;
  driverId?: string;
  pickup: Location;
  destination: Location;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  fare: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRideData {
  pickup: Location;
  destination: Location;
  rideType: 'economy' | 'comfort' | 'premium';
}

/**
 * Fetch user's ride history
 */
export const getRideHistory = async (
  token: string,
  page: number = 1,
  limit: number = 20
): Promise<{ rides: Ride[]; total: number }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.rides.list}?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch ride history: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Create a new ride request
 */
export const createRide = async (
  token: string,
  rideData: CreateRideData
): Promise<Ride> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.rides.create}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(rideData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to create ride: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get ride details
 */
export const getRideDetail = async (
  token: string,
  rideId: string
): Promise<Ride> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.rides.detail(rideId)}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch ride details: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Cancel a ride
 */
export const cancelRide = async (
  token: string,
  rideId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.rides.cancel(rideId)}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ reason }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to cancel ride: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

