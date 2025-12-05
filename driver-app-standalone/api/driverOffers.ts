/**
 * Driver Offers API
 * API functions for managing driver offers
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export type OfferStatus = 'published' | 'archived' | 'cancelled';

export interface DriverOfferStop {
  id: string;
  offer_id: string;
  order_no: number;
  label_text: string;
  lat?: number;
  lng?: number;
}

export interface DriverOffer {
  id: string;
  user_id: number;
  vehicle_id: string;
  from_text: string;
  from_lat?: number;
  from_lng?: number;
  to_text: string;
  to_lat?: number;
  to_lng?: number;
  start_at: string;
  seats_total: number;
  seats_free: number;
  price_per_seat: number;
  front_price_per_seat?: number;
  currency: string;
  note?: string;
  status: OfferStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  vehicle?: {
    id: string;
    license_plate?: string;
    year?: number;
    make?: { name: string };
    model?: { name: string };
    color?: { name: string };
  };
  stops?: DriverOfferStop[];
}

export interface CreateOfferStopData {
  label_text: string;
  lat?: number;
  lng?: number;
  order_no?: number;
}

export interface CreateOfferData {
  vehicle_id: string;
  from_text: string;
  from_lat?: number;
  from_lng?: number;
  to_text: string;
  to_lat?: number;
  to_lng?: number;
  start_at: string;
  seats_total: number;
  price_per_seat: number;
  front_price_per_seat?: number;
  currency?: string;
  note?: string;
  stops?: CreateOfferStopData[];
}

export interface UpdateOfferData extends Partial<CreateOfferData> {}

export interface OffersResponse {
  success: boolean;
  offers: DriverOffer[];
}

export interface OfferResponse {
  success: boolean;
  offer: DriverOffer;
}

/**
 * Get all driver offers with optional filters
 */
export const getDriverOffers = async (
  token: string,
  filters?: { status?: string; from?: string; to?: string }
): Promise<OffersResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.from) queryParams.append('from', filters.from);
    if (filters?.to) queryParams.append('to', filters.to);

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}${API_ENDPOINTS.driverOffers.list}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to fetch offers');
    }

    const payload = data.data || {};

    return {
      success: true,
      offers: (payload.offers || []) as DriverOffer[],
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get offer by ID
 */
export const getDriverOfferById = async (
  token: string,
  offerId: string
): Promise<OfferResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.detail(offerId)}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to fetch offer');
    }

    const payload = data.data || {};

    return {
      success: true,
      offer: payload.offer as DriverOffer,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Create new offer
 */
export const createDriverOffer = async (
  token: string,
  offerData: CreateOfferData
): Promise<OfferResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.create}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(offerData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to create offer');
    }

    const payload = data.data || {};

    return {
      success: true,
      offer: payload.offer as DriverOffer,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update offer
 */
export const updateDriverOffer = async (
  token: string,
  offerId: string,
  offerData: UpdateOfferData
): Promise<OfferResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.update(offerId)}`,
      {
        method: 'PATCH',
        headers: getHeaders(token),
        body: JSON.stringify(offerData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to update offer');
    }

    const payload = data.data || {};

    return {
      success: true,
      offer: payload.offer as DriverOffer,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Cancel offer
 */
export const cancelDriverOffer = async (
  token: string,
  offerId: string
): Promise<OfferResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.cancel(offerId)}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to cancel offer');
    }

    const payload = data.data || {};

    return {
      success: true,
      offer: payload.offer as DriverOffer,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Publish offer
 */
export const publishDriverOffer = async (
  token: string,
  offerId: string
): Promise<OfferResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.publish(offerId)}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to publish offer');
    }

    const payload = data.data || {};

    return {
      success: true,
      offer: payload.offer as DriverOffer,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Archive offer
 */
export const archiveDriverOffer = async (
  token: string,
  offerId: string
): Promise<OfferResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.archive(offerId)}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to archive offer');
    }

    const payload = data.data || {};

    return {
      success: true,
      offer: payload.offer as DriverOffer,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Delete offer
 */
export const deleteDriverOffer = async (
  token: string,
  offerId: string
): Promise<{ success: boolean }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.delete(offerId)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to delete offer');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

