/**
 * Passenger Offers API (Driver Side)
 * API client for drivers to browse and join passenger offers
 */

import { API_BASE_URL, getHeaders, API_TIMEOUT } from '../config/api';

// Types
export interface PassengerOffer {
  id: number;
  from_text: string;
  to_text: string;
  start_at: string;
  max_price_per_seat: number;
  currency: string;
  seats_needed: number;
  note?: string;
  passenger: {
    id: number;
    name: string;
  };
}

export interface OfferDriver {
  id: string;
  offer_id: number;
  driver_id: number;
  vehicle_id: string;
  seats_offered: number;
  offered_price_per_seat: number;
  total_offered_price: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  message?: string;
  rejection_reason?: string;
  confirmed_at?: string;
  rejected_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  offer?: PassengerOffer;
}

export interface SearchPassengerOffersParams {
  from_text?: string;
  to_text?: string;
  date?: string;
  min_seats?: number;
  max_price?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'date_asc' | 'seats_desc';
  limit?: number;
  offset?: number;
}

export interface JoinPassengerOfferData {
  vehicle_id: string;
  seats_offered?: number;
  offered_price_per_seat: number;
  message?: string;
}

/**
 * Search for passenger offers
 */
export const searchPassengerOffers = async (
  params: SearchPassengerOffersParams
): Promise<{ items: PassengerOffer[]; total: number }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const queryParams = new URLSearchParams();
    if (params.from_text) queryParams.append('from_text', params.from_text);
    if (params.to_text) queryParams.append('to_text', params.to_text);
    if (params.date) queryParams.append('date', params.date);
    if (params.min_seats) queryParams.append('min_seats', params.min_seats.toString());
    if (params.max_price) queryParams.append('max_price', params.max_price.toString());
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const url = `${API_BASE_URL}/public/passenger-offers?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to search passenger offers');
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    throw error;
  }
};

/**
 * Get passenger offer details by ID
 */
export const getPassengerOfferById = async (
  offerId: number
): Promise<PassengerOffer> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/public/passenger-offers/${offerId}`,
      {
        method: 'GET',
        headers: await getHeaders(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch passenger offer');
    }

    const data = await response.json();
    return data.data.offer;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    throw error;
  }
};

/**
 * Driver joins a passenger offer
 */
export const joinPassengerOffer = async (
  offerId: number,
  joinData: JoinPassengerOfferData
): Promise<OfferDriver> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/driver/passenger-offers/${offerId}/join`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(joinData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to join passenger offer');
    }

    const data = await response.json();
    return data.data.driver_join;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    throw error;
  }
};

/**
 * Get driver's join requests
 */
export const getMyJoinRequests = async (
  status?: string
): Promise<OfferDriver[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = new URL(`${API_BASE_URL}/driver/join-requests`);
    if (status) {
      url.searchParams.append('status', status);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: await getHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch join requests');
    }

    const data = await response.json();
    return data.data.join_requests;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    throw error;
  }
};

/**
 * Cancel driver's join request
 */
export const cancelJoinRequest = async (
  joinRequestId: string
): Promise<OfferDriver> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/driver/join-requests/${joinRequestId}/cancel`,
      {
        method: 'POST',
        headers: await getHeaders(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to cancel join request');
    }

    const data = await response.json();
    return data.data.driver_join;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    throw error;
  }
};



