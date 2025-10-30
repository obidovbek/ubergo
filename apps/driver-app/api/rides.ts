/**
 * Rides API - Driver App
 * Handles ride-related API requests for drivers
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export interface Ride {
  id: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  pickup_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dropoff_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  passenger: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  fare: {
    base_fare: number;
    distance_fare: number;
    time_fare: number;
    total: number;
    currency: string;
  };
  created_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * Get available rides for driver
 */
export const getAvailableRides = async (token: string): Promise<Ride[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.rides.available}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get available rides');
    }

    return data.data.rides || [];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Accept a ride
 */
export const acceptRide = async (token: string, rideId: string): Promise<Ride> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.rides.accept(rideId)}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to accept ride');
    }

    return data.data.ride;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Start a ride
 */
export const startRide = async (token: string, rideId: string): Promise<Ride> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.rides.start(rideId)}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to start ride');
    }

    return data.data.ride;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Complete a ride
 */
export const completeRide = async (token: string, rideId: string): Promise<Ride> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.rides.complete(rideId)}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to complete ride');
    }

    return data.data.ride;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get driver's ride history
 */
export const getRideHistory = async (token: string): Promise<Ride[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.rides.history}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get ride history');
    }

    return data.data.rides || [];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Cancel a ride
 */
export const cancelRide = async (token: string, rideId: string, reason: string): Promise<void> => {
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel ride');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
