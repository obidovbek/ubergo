/**
 * Passengers API
 * Handles all passenger-related API requests
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export interface Passenger {
  id: string;
  phone_e164?: string | null;
  email?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  father_name?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  birth_date?: string | null;
  status: 'active' | 'blocked' | 'pending_delete';
  is_verified: boolean;
  profile_complete: boolean;
  role: 'user';
  phones?: Array<{
    id: string;
    label: 'primary' | 'trusted' | 'extra';
    e164: string;
    is_verified: boolean;
  }>;
  identities?: Array<{
    id: string;
    provider: 'google' | 'apple' | 'facebook' | 'microsoft' | 'telegram' | 'oneid';
    provider_uid: string;
  }>;
  pushTokens?: Array<{
    id: string;
    token: string;
    platform: 'android' | 'ios';
    app: 'user' | 'driver';
  }>;
  created_at: string;
  updated_at: string;
}

export interface PassengerListResponse {
  data: Passenger[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Fetch passengers list with pagination
 */
export const getPassengers = async (
  token: string,
  page: number = 1,
  pageSize: number = 25,
  filters?: { status?: string; search?: string }
): Promise<PassengerListResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.passengers.list}?${params.toString()}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch passengers: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return {
        data: result.data.data || [],
        total: result.data.pagination?.total || 0,
        page: result.data.pagination?.page || page,
        pageSize: result.data.pagination?.limit || pageSize,
      };
    }
    return {
      data: [],
      total: 0,
      page,
      pageSize,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get passenger by ID
 */
export const getPassengerById = async (token: string, id: string): Promise<Passenger> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.passengers.detail(id)}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch passenger: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update passenger
 */
export const updatePassenger = async (
  token: string,
  id: string,
  passengerData: Partial<Passenger>
): Promise<Passenger> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.passengers.update(id)}`,
      {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(passengerData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to update passenger: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Delete passenger
 */
export const deletePassenger = async (token: string, id: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.passengers.delete(id)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to delete passenger: ${response.statusText}`);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

