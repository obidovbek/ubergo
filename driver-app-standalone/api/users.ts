/**
 * Users API - Driver App
 * Handles driver profile-related API requests
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export interface DriverProfile {
  id: string;
  phone_e164: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  driver_type?: 'driver' | 'dispatcher' | 'special_transport' | 'logist';
  role: string;
  status: string;
  is_verified: boolean;
  rating?: number;
  total_rides?: number;
  vehicle_info?: {
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
  };
  documents?: {
    license_number?: string;
    license_expiry?: string;
    vehicle_registration?: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Get driver profile
 */
export const getDriverProfile = async (token: string): Promise<DriverProfile> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.user.profile}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get driver profile');
    }

    return data.data.user;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update driver profile
 */
export const updateDriverProfile = async (
  token: string,
  updates: Partial<DriverProfile>
): Promise<DriverProfile> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.user.updateProfile}`,
      {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(updates),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update driver profile');
    }

    return data.data.user;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update driver availability status
 */
export const updateDriverAvailability = async (
  token: string,
  isAvailable: boolean
): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.user.updateAvailability}`,
      {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify({ is_available: isAvailable }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to update availability');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get driver earnings
 */
export const getDriverEarnings = async (
  token: string,
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    let url = `${API_BASE_URL}${API_ENDPOINTS.user.earnings}`;
    
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get earnings');
    }

    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
