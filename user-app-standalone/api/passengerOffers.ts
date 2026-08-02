/**
 * Passenger Offers API
 * API client for creating and managing passenger offers
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

// Types
export interface PassengerOffer {
  id: number;
  user_id: number;
  from_text: string;
  from_lat?: number;
  from_lng?: number;
  to_text: string;
  to_lat?: number;
  to_lng?: number;
  start_at: string;
  seats_needed: number;
  // Nullable since T-018 — the new order form collects no price at all.
  max_price_per_seat: number | null;
  currency: string;
  front_seat: boolean;
  pets: boolean;
  large_baggage: boolean;
  note?: string;
  /** 'driver_found' = a driver was confirmed; the ride has not happened yet. */
  status: 'published' | 'driver_found' | 'archived' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    display_name: string;
  };
  drivers?: OfferDriver[];
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
  driver?: {
    id: number;
    first_name: string;
    last_name: string;
    display_name: string;
  };
  vehicle?: {
    make: { name: string };
    model: { name: string };
    color: { name: string };
    type: { name: string };
    license_plate: string;
    year: number;
  };
}

// T-018 — the fields of the Figma order screen. All optional and additive, so
// the old screens that still post the short payload keep working.
export type PassengerOfferPaymentType = 'cash' | 'click_payme' | 'friend_pays';
export type PassengerOfferSalonScope = 'whole_salon' | 'back_salon_full';
export type PassengerOfferVehicleClass =
  | 'standard'
  | 'comfort'
  | 'business'
  | 'econom'
  | 'tourist';

export interface PassengerOfferSeatCounts {
  front_male: number;
  front_female: number;
  back_male: number;
  back_female: number;
}

export interface PassengerOfferSpecialOrder {
  price_front?: number | null;
  price_back?: number | null;
  price_back_salon?: number | null;
  price_whole_salon?: number | null;
  review_driver_offers?: boolean;
  fixed_price?: boolean;
  waiting_fee_per_min?: number | null;
  free_waiting_min?: number | null;
}

export interface CreatePassengerOfferData {
  from_text: string;
  from_lat?: number;
  from_lng?: number;
  from_country_id?: number;
  from_province_id?: number;
  from_city_id?: number;
  from_settlement_id?: number;
  from_landmark?: string;
  to_text: string;
  to_lat?: number;
  to_lng?: number;
  to_country_id?: number;
  to_province_id?: number;
  to_city_id?: number;
  to_settlement_id?: number;
  to_landmark?: string;
  start_at: string;
  depart_until?: string;
  arrive_from?: string;
  arrive_until?: string;
  is_urgent?: boolean;
  /** Omit it and the API derives it from seat_counts / salon_scope. */
  seats_needed?: number;
  /** The new form collects no price — only the special order has prices. */
  max_price_per_seat?: number;
  currency?: string;
  payment_type?: PassengerOfferPaymentType;
  payer_phone?: string;
  seat_counts?: PassengerOfferSeatCounts;
  seat_position_any?: boolean;
  salon_scope?: PassengerOfferSalonScope;
  vehicle_class?: PassengerOfferVehicleClass;
  front_seat?: boolean;
  pets?: boolean;
  large_baggage?: boolean;
  woman_in_car?: boolean;
  roof_rack_needed?: boolean;
  trailer?: boolean;
  road_pickup?: boolean;
  road_pickup_note?: string;
  special_order?: PassengerOfferSpecialOrder;
  note?: string;
}

export interface UpdatePassengerOfferData extends Partial<CreatePassengerOfferData> {}

/**
 * Get user's passenger offers
 */
export const getMyPassengerOffers = async (
  status?: string
): Promise<PassengerOffer[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.PASSENGER_OFFERS}`);
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
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error(errorData.message || 'Failed to fetch passenger offers');
      error.response = {
        status: response.status,
        data: errorData,
      };
      throw error;
    }

    const data = await response.json();
    return data.data.offers;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    throw error;
  }
};

/**
 * Get passenger offer by ID
 */
export const getPassengerOfferById = async (
  offerId: number
): Promise<PassengerOffer> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.PASSENGER_OFFERS}/${offerId}`,
      {
        method: 'GET',
        headers: await getHeaders(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error(errorData.message || 'Failed to fetch passenger offer');
      error.response = {
        status: response.status,
        data: errorData,
      };
      throw error;
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
 * Create a new passenger offer
 */
export const createPassengerOffer = async (
  offerData: CreatePassengerOfferData
): Promise<PassengerOffer> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.PASSENGER_OFFERS}`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(offerData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error(errorData.message || 'Failed to create passenger offer');
      error.response = {
        status: response.status,
        data: errorData,
      };
      throw error;
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
 * Update a passenger offer
 */
export const updatePassengerOffer = async (
  offerId: number,
  offerData: UpdatePassengerOfferData
): Promise<PassengerOffer> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.PASSENGER_OFFERS}/${offerId}`,
      {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify(offerData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error(errorData.message || 'Failed to update passenger offer');
      error.response = {
        status: response.status,
        data: errorData,
      };
      throw error;
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
 * Cancel a passenger offer
 */
export const cancelPassengerOffer = async (
  offerId: number
): Promise<PassengerOffer> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.PASSENGER_OFFERS}/${offerId}/cancel`,
      {
        method: 'POST',
        headers: await getHeaders(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error(errorData.message || 'Failed to cancel passenger offer');
      error.response = {
        status: response.status,
        data: errorData,
      };
      throw error;
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
 * Delete a passenger offer
 */
export const deletePassengerOffer = async (offerId: number): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.PASSENGER_OFFERS}/${offerId}`,
      {
        method: 'DELETE',
        headers: await getHeaders(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
      throw new Error(errorData.message || 'Failed to delete passenger offer');
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    throw error;
  }
};

/**
 * Get drivers for a passenger offer
 */
export const getOfferDrivers = async (
  offerId: number
): Promise<OfferDriver[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/passenger/offers/${offerId}/drivers`,
      {
        method: 'GET',
        headers: await getHeaders(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
      throw new Error(errorData.message || 'Failed to fetch drivers');
    }

    const data = await response.json();
    return data.data.drivers;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    throw error;
  }
};

/**
 * Confirm a driver for a passenger offer
 */
export const confirmDriver = async (driverJoinId: string): Promise<OfferDriver> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/passenger/drivers/${driverJoinId}/confirm`,
      {
        method: 'POST',
        headers: await getHeaders(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
      throw new Error(errorData.message || 'Failed to confirm driver');
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
 * Reject a driver for a passenger offer
 */
export const rejectDriver = async (
  driverJoinId: string,
  rejectionReason?: string
): Promise<OfferDriver> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/passenger/drivers/${driverJoinId}/reject`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ rejection_reason: rejectionReason }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
      throw new Error(errorData.message || 'Failed to reject driver');
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



