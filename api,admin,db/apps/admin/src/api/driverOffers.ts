/**
 * Driver Offers API Client
 * Handles API calls for driver offers moderation
 */

import { API_BASE_URL, getHeaders, API_TIMEOUT, isAuthError, handleAuthError } from '../config/api';

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
  currency: string;
  note?: string;
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'archived';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    phone_e164?: string;
    email?: string;
  };
  vehicle?: {
    id: string;
    license_plate?: string;
    year?: number;
    make?: { name: string };
    model?: { name: string };
    color?: { name: string };
  };
  reviewer?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface DriverOfferStatistics {
  total: number;
  pending_review: number;
  approved: number;
  published: number;
  rejected: number;
  archived: number;
}

export interface GetOffersParams {
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all driver offers with filters
 */
export const getOffers = async (
  token: string,
  params?: GetOffersParams
): Promise<{ offers: DriverOffer[]; total: number }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${API_BASE_URL}/admin/driver-offers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`Failed to fetch offers: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return {
        offers: result.data.offers || result.data.data || [],
        total: result.data.total || result.data.pagination?.total || 0,
      };
    }
    return {
      offers: result.offers || result.data || [],
      total: result.total || 0,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get offer statistics
 */
export const getStatistics = async (token: string): Promise<DriverOfferStatistics> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/admin/driver-offers/statistics`, {
      method: 'GET',
      headers: getHeaders(token),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data.statistics || result.data;
    }
    return result.statistics || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get offer by ID
 */
export const getOfferById = async (token: string, id: string): Promise<{ offer: DriverOffer }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/admin/driver-offers/${id}`, {
      method: 'GET',
      headers: getHeaders(token),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`Failed to fetch offer: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return {
        offer: result.data.offer || result.data,
      };
    }
    return {
      offer: result.offer || result,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Approve offer
 */
export const approveOffer = async (
  token: string,
  id: string,
  autoPublish: boolean = false
): Promise<DriverOffer> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/admin/driver-offers/${id}/approve`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ auto_publish: autoPublish }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`Failed to approve offer: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Reject offer
 */
export const rejectOffer = async (
  token: string,
  id: string,
  reason: string
): Promise<DriverOffer> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/admin/driver-offers/${id}/reject`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ reason }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`Failed to reject offer: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

