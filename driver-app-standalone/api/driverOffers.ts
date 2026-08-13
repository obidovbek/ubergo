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
  /**
   * T-078 — read back when the wizard opens an offer for EDIT.
   *
   * 🔴 Every one of these must load into the form. A field that saves but never
   * loads back means the next edit silently blanks it — the way this card is
   * most likely to fail without anything erroring.
   * ⚠️ DECIMAL arrives from pg as a **string** (`'320000.00'`), so parse before
   * comparing or displaying.
   */
  price_back_salon?: number | string | null;
  price_whole_salon?: number | string | null;
  waiting_fee_per_min?: number | string | null;
  free_waiting_min?: number | null;
  pickup_fee?: number | string | null;
  /** `null`/absent = never stated; `false` = the driver refuses it. */
  payment_cash?: boolean | null;
  payment_card?: boolean | null;
  vehicle_class?: DriverOfferVehicleClass | null;
  /** T-079/T-080 — must load back into the wizard on EDIT, like everything else. */
  air_conditioner?: boolean | null;
  wifi?: boolean | null;
  roof_rack_needed?: boolean | null;
  trailer?: boolean | null;
  parcel_accepted?: boolean | null;
  parcel_price?: number | string | null;
  parcel_max_kg?: number | null;
  road_pickup?: boolean | null;
  road_pickup_note?: string | null;
  depart_until?: string | null;
  arrive_from?: string | null;
  arrive_until?: string | null;
  departs_when_full?: boolean | null;
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
  /**
   * T-078 — the rest of the mockup's `Narxlar` list.
   *
   * ⚠️ `price_per_seat` is *Orqa o'rindiq* and `front_price_per_seat` is *Old
   * o'rindiq*. They are NOT renamed to match the mockup's wording: both are
   * live and already read by the passenger app.
   */
  price_back_salon?: number;
  price_whole_salon?: number;
  /**
   * 🔴 A rate the passenger is SHOWN, not money anything charges (owner,
   * 2026-08-13). Nothing meters a real wait, so this must never reach a total.
   */
  waiting_fee_per_min?: number;
  /** Whole minutes. `0` is a real answer, not "unset". */
  free_waiting_min?: number;
  /** "Joyidan olish". `0` means free door pickup, exactly as the mockup draws. */
  pickup_fee?: number;
  /**
   * ⚠️ `undefined` means "not stated" and is NOT the same as `false`. Old
   * offers carry neither flag; sending `false` would claim the driver refuses
   * a payment method they were never asked about.
   */
  payment_cash?: boolean;
  payment_card?: boolean;
  vehicle_class?: DriverOfferVehicleClass;
  // T-079 — what the car offers, and what it will carry.
  air_conditioner?: boolean;
  wifi?: boolean;
  roof_rack_needed?: boolean;
  trailer?: boolean;
  parcel_accepted?: boolean;
  parcel_price?: number;
  /** The mockup's "(20kgacha)" — the driver's own limit, not a constant. */
  parcel_max_kg?: number;
  road_pickup?: boolean;
  road_pickup_note?: string;
  // T-080 — `start_at` is the window's start; these are the rest.
  depart_until?: string;
  arrive_from?: string;
  arrive_until?: string;
  /**
   * 🔴 "to'lishi bilan yuraman" — the driver leaves when the car FILLS.
   * NOT the passenger's `is_urgent`, which means "leave now".
   */
  departs_when_full?: boolean;
  currency?: string;
  note?: string;
  stops?: CreateOfferStopData[];
}

/** T-078 — the mockup's five radios. */
export type DriverOfferVehicleClass =
  | 'standard'
  | 'comfort'
  | 'business'
  | 'econom'
  | 'tourist';

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

    const headers = await getHeaders(token);
    const response = await fetch(
      url,
      {
        method: 'GET',
        headers,
        signal: controller.signal,
      }
    );

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
    const headers = await getHeaders(token);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.detail(offerId)}`,
      {
        method: 'GET',
        headers,
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
    const headers = await getHeaders(token);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.create}`,
      {
        method: 'POST',
        headers,
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
    const headers = await getHeaders(token);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.update(offerId)}`,
      {
        method: 'PATCH',
        headers,
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
    const headers = await getHeaders(token);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.cancel(offerId)}`,
      {
        method: 'POST',
        headers,
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
    const headers = await getHeaders(token);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.publish(offerId)}`,
      {
        method: 'POST',
        headers,
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
    const headers = await getHeaders(token);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.archive(offerId)}`,
      {
        method: 'POST',
        headers,
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
    const headers = await getHeaders(token);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.driverOffers.delete(offerId)}`,
      {
        method: 'DELETE',
        headers,
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

