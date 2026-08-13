/**
 * Driver Offers API
 * API client for searching and joining driver offers
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

// Types
export interface DriverOffer {
  id: number;
  from_text: string;
  to_text: string;
  start_at: string;
  price_per_seat: number;
  front_price_per_seat?: number;
  currency: string;
  seats_free: number;
  seats_total: number;
  note?: string;
  /**
   * The hand-mapped shape, built by the browse and detail endpoints.
   *
   * ⚠️ **It is NOT present on `GET /passenger/bookings`**, which returns the raw
   * Sequelize model — there the driver arrives as `user` (below). Two response
   * shapes for the same logical object is the exact trap that crashed the driver
   * app to the launcher in T-042, so read the driver through a helper, never a
   * bare `offer.driver.name`.
   */
  driver: {
    id?: number;
    name: string;
    rating: number;
    rating_count?: number;
  };
  /** The raw-model shape, from `GET /passenger/bookings`. */
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    /**
     * T-055 — present **only when this passenger's own booking is `confirmed`**.
     * The server strips it from every other status
     * (`OfferPassengerService.gatePhones`) and it is absent entirely from the
     * public browse/detail endpoints. Can be `null` for a Google SSO driver.
     * Read it through `driverPhoneOf()`.
     */
    phone_e164?: string | null;
  };
  vehicle: {
    make: string;
    model: string;
    color: string;
    type?: string;
    license_plate: string;
    year: number;
    /**
     * T-077 — `['benzine' | 'metan' | 'propan' | 'electric' | 'diesel']`.
     *
     * ⚠️ Optional and possibly empty: a driver need not have recorded it, and
     * offers fetched before this shipped carry no such key. Render it through
     * `fuelLabel()`, which returns `null` rather than an empty line.
     * ⚠️ A car often has TWO (benzine + propan is the normal conversion here).
     */
    fuel_types?: string[] | null;
  };
}

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
  offer?: DriverOffer;
  passenger?: {
    id: number;
    first_name: string;
    last_name: string;
    display_name: string;
    avatar_url?: string;
  };
}

/**
 * The driver's phone, or `''` when there is none to show — T-055.
 *
 * 🔴 A bare `offer.user.phone_e164` is the expression class that crashed the
 * driver app to the launcher in T-042: `offer` and `user` are both optional and
 * the mapped `driver` shape has no phone field at all.
 *
 * ⚠️ An empty string means "nothing to show" — it does NOT distinguish "not
 * confirmed yet" from "the driver has no number on file". The caller knows the
 * status; this only knows the payload.
 */
export const driverPhoneOf = (offer?: DriverOffer): string => {
  return offer?.user?.phone_e164 || '';
};

export interface SearchOffersParams {
  from_text?: string;
  to_text?: string;
  date?: string;
  from_province_id?: number;
  from_city_id?: number;
  to_province_id?: number;
  to_city_id?: number;
  // New filter parameters
  min_rating?: number;
  max_price?: number;
  min_price?: number;
  vehicle_type?: string;
  vehicle_make?: string;
  vehicle_color?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'rating_desc' | 'date_asc';
  limit?: number;
  offset?: number;
}

export interface JoinOfferData {
  seats_requested?: number;
  is_front_seat?: boolean;
  message?: string;
}

/**
 * Search for driver offers
 */
export const searchOffers = async (
  params: SearchOffersParams
): Promise<{ items: DriverOffer[]; total: number }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const queryParams = new URLSearchParams();
    if (params.from_text) queryParams.append('from_text', params.from_text);
    if (params.to_text) queryParams.append('to_text', params.to_text);
    if (params.date) queryParams.append('date', params.date);
    if (params.from_province_id) queryParams.append('from_province_id', String(params.from_province_id));
    if (params.from_city_id) queryParams.append('from_city_id', String(params.from_city_id));
    if (params.to_province_id) queryParams.append('to_province_id', String(params.to_province_id));
    if (params.to_city_id) queryParams.append('to_city_id', String(params.to_city_id));
    // New filters
    if (params.min_rating) queryParams.append('min_rating', String(params.min_rating));
    if (params.max_price) queryParams.append('max_price', String(params.max_price));
    if (params.min_price) queryParams.append('min_price', String(params.min_price));
    if (params.vehicle_type) queryParams.append('vehicle_type', params.vehicle_type);
    if (params.vehicle_make) queryParams.append('vehicle_make', params.vehicle_make);
    if (params.vehicle_color) queryParams.append('vehicle_color', params.vehicle_color);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.offset) queryParams.append('offset', String(params.offset));

    const url = `${API_BASE_URL}/public/driver-offers?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to search offers (${response.status})`);
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    console.error('Error searching offers:', error.message);
    throw error;
  }
};

/**
 * Get offer details
 */
export const getOfferDetails = async (offerId: number): Promise<DriverOffer> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = `${API_BASE_URL}/public/driver-offers/${offerId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get offer details (${response.status})`);
    }

    const data = await response.json();
    return data.data.offer;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    console.error('Error getting offer details:', error.message);
    throw error;
  }
};

/**
 * Join an offer
 */
export const joinOffer = async (
  token: string,
  offerId: number,
  data: JoinOfferData
): Promise<OfferPassenger> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = `${API_BASE_URL}/passenger/offers/${offerId}/join`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: await getHeaders(token),
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to join offer (${response.status})`);
    }

    const responseData = await response.json();
    return responseData.data.passenger_join;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    console.error('Error joining offer:', error.message);
    throw error;
  }
};

/**
 * Cancel join request
 */
export const cancelJoin = async (
  token: string,
  passengerJoinId: string
): Promise<OfferPassenger> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = `${API_BASE_URL}/passenger/bookings/${passengerJoinId}/cancel`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: await getHeaders(token),
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to cancel join (${response.status})`);
    }

    const responseData = await response.json();
    return responseData.data.passenger_join;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    console.error('Error cancelling join:', error.message);
    throw error;
  }
};

/**
 * Get passenger's bookings
 */
export const getMyBookings = async (
  token: string,
  status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled'
): Promise<OfferPassenger[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const queryParams = status ? `?status=${status}` : '';
    const url = `${API_BASE_URL}/passenger/bookings${queryParams}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(token),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get bookings (${response.status})`);
    }

    const data = await response.json();
    return data.data.bookings;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    console.error('Error getting bookings:', error.message);
    throw error;
  }
};

/**
 * Rate a driver after ride completion
 */
export const rateDriver = async (
  token: string,
  bookingId: string,
  rating: number,
  comment?: string
): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = `${API_BASE_URL}/ratings/bookings/${bookingId}/rate`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: await getHeaders(token),
      body: JSON.stringify({ rating, comment }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to rate driver (${response.status})`);
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    console.error('Error rating driver:', error.message);
    throw error;
  }
};

/**
 * Get passenger's given ratings
 */
export const getMyRatings = async (token: string): Promise<any[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = `${API_BASE_URL}/ratings/my-ratings`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(token),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get ratings (${response.status})`);
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    console.error('Error getting ratings:', error.message);
    throw error;
  }
};

