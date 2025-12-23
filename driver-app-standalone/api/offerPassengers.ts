/**
 * Offer Passengers API
 * API client for managing passengers in driver offers
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

// Types
export interface OfferPassenger {
  id: string;
  offer_id: number;
  passenger_id: number;
  seats_requested: number;
  is_front_seat: boolean;
  agreed_price_per_seat: number; // Price agreed at time of booking
  total_agreed_price: number; // Total price for all seats
  currency: string; // Currency of the agreed price
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  message?: string;
  rejection_reason?: string;
  confirmed_at?: string;
  rejected_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  passenger?: {
    id: number;
    first_name: string;
    last_name: string;
    display_name: string;
    avatar_url?: string;
  };
}

/**
 * Get passengers for an offer
 */
export const getOfferPassengers = async (
  token: string,
  offerId: number
): Promise<OfferPassenger[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = `${API_BASE_URL}/driver/offers/${offerId}/passengers`;
    
    const headers = await getHeaders(token);
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to get passengers');
    }

    const payload = data.data || {};
    return (payload.passengers || []) as OfferPassenger[];
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Error getting offer passengers:', error);
    throw new Error(error.message || 'Failed to get passengers');
  }
};

/**
 * Confirm a passenger join request
 */
export const confirmPassenger = async (
  token: string,
  passengerJoinId: string
): Promise<OfferPassenger> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = `${API_BASE_URL}/driver/passengers/${passengerJoinId}/confirm`;
    
    const headers = await getHeaders(token);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to confirm passenger');
    }

    const payload = data.data || {};
    return payload.passenger_join as OfferPassenger;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Error confirming passenger:', error);
    throw new Error(error.message || 'Failed to confirm passenger');
  }
};

/**
 * Reject a passenger join request
 */
export const rejectPassenger = async (
  token: string,
  passengerJoinId: string,
  rejection_reason?: string
): Promise<OfferPassenger> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = `${API_BASE_URL}/driver/passengers/${passengerJoinId}/reject`;
    
    const headers = await getHeaders(token);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ rejection_reason }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to reject passenger');
    }

    const payload = data.data || {};
    return payload.passenger_join as OfferPassenger;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Error rejecting passenger:', error);
    throw new Error(error.message || 'Failed to reject passenger');
  }
};

