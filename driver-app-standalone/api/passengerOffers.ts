/**
 * Passenger Offers API (Driver Side)
 * API client for drivers to browse and join passenger offers
 */

import { API_BASE_URL, getHeaders, API_TIMEOUT } from '../config/api';

// T-018 — the passenger side of the new Figma order screen. Everything here is
// read-only for the driver; payer_phone is deliberately never sent by the API.
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

// Types
export interface PassengerOffer {
  id: number;
  from_text: string;
  from_landmark?: string | null;
  to_text: string;
  to_landmark?: string | null;
  start_at: string;
  /** End of the departure window, when the passenger gave one. */
  depart_until?: string | null;
  arrive_from?: string | null;
  arrive_until?: string | null;
  is_urgent?: boolean;
  /** Null on offers created by the new form — it collects no price at all. */
  max_price_per_seat: number | null;
  currency: string;
  /** @deprecated T-031 — use the three flags below; kept for one release. */
  payment_type?: PassengerOfferPaymentType | null;
  /**
   * T-031 — cash and card are independent (both may be true); "Do'stimga" is
   * its own point, not a payment method.
   * ⚠️ Optional: offers created before the split carry only `payment_type`,
   * so read them through a fallback rather than assuming they are present.
   */
  payment_cash?: boolean;
  payment_card?: boolean;
  paid_by_friend?: boolean;
  seats_needed: number;
  seat_counts?: PassengerOfferSeatCounts | null;
  seat_position_any?: boolean;
  salon_scope?: PassengerOfferSalonScope | null;
  vehicle_class?: PassengerOfferVehicleClass | null;
  front_seat?: boolean;
  pets?: boolean;
  large_baggage?: boolean;
  woman_in_car?: boolean;
  roof_rack_needed?: boolean;
  trailer?: boolean;
  road_pickup?: boolean;
  road_pickup_note?: string | null;
  special_order?: PassengerOfferSpecialOrder | null;
  note?: string;
  /**
   * ⚠️ OPTIONAL, and that is not defensive padding — it is the truth.
   * Only the hand-mapped BROWSE list (`getPublicOffers`) builds this shape.
   * `GET /public/passenger-offers/:id` returns the raw Sequelize model, which
   * carries `user` instead. Marking it required is what let
   * `offer.passenger.name` compile on the detail screen and crash the app.
   * Read it through `passengerNameOf()`, never directly.
   */
  passenger?: {
    id: number;
    name: string;
  };
  /** The raw-model shape, from the detail endpoint and join requests. */
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    /**
     * T-054 — present **only when this driver's own request is `confirmed`**.
     * The server strips it from every other status
     * (`OfferDriverService.gatePhones`), and it is absent entirely from the
     * public browse/detail endpoints. It can also be `null` for a passenger who
     * signed up via Google SSO. Read it through `passengerPhoneOf()`.
     */
    phone_e164?: string | null;
  };
}

/**
 * The offer as it arrives on a join request.
 *
 * ⚠️ Two response shapes exist for the same logical object, and the earlier
 * version of this comment got the boundary WRONG — it said the `public/*`
 * browse **and detail** endpoints both build the mapped `passenger` shape.
 * Only the **browse list** does. The detail endpoint
 * (`GET /public/passenger-offers/:id`) and `GET /driver/join-requests` both
 * return the **raw Sequelize model**, whose include is aliased `as: 'user'`.
 * That wrong comment is why the detail screen was written with a bare
 * `offer.passenger.name` — which crashed the app to the launcher.
 *
 * `PassengerOffer` now models both shapes, so this is a plain alias kept for
 * the existing call sites' readability.
 */
export type JoinRequestOffer = PassengerOffer;

/** Best available name for the passenger, whichever shape the offer came in. */
export const passengerNameOf = (offer?: JoinRequestOffer): string => {
  if (!offer) return '';
  if (offer.passenger?.name) return offer.passenger.name;
  const user = offer.user;
  if (!user) return '';
  return (
    user.display_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim()
  );
};

/**
 * The passenger's phone, or `''` when there is none to show — T-054.
 *
 * 🔴 A bare `offer.user.phone_e164` is the exact expression class that crashed
 * this app to the launcher in T-042: `offer` and `user` are both optional and
 * the mapped `passenger` shape has no phone field at all. The helper exists to
 * make that mistake impossible, exactly like `passengerNameOf` above.
 *
 * ⚠️ An empty string here means "nothing to show" — it does NOT distinguish
 * "not confirmed yet" from "passenger has no number on file". The caller knows
 * the status; this only knows the payload.
 */
export const passengerPhoneOf = (offer?: JoinRequestOffer): string => {
  return offer?.user?.phone_e164 || '';
};

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
  offer?: JoinRequestOffer;
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
      const errorData = await response.json().catch(() => ({} as any));
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
      const errorData = await response.json().catch(() => ({} as any));
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
 *
 * ⚠️ T-037: this took no `token` and called `getHeaders()` bare, which sends NO
 * Authorization header — the route is `authenticate`d, so every call would have
 * been a 401. It had zero call sites, so nothing ever caught it. Same for
 * `getMyJoinRequests` and `cancelJoinRequest` below. The two `public/*` calls
 * above are genuinely unauthenticated and stay as they are.
 */
export const joinPassengerOffer = async (
  token: string,
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
        headers: await getHeaders(token),
        body: JSON.stringify(joinData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
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
  token: string,
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
      headers: await getHeaders(token),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
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
  token: string,
  joinRequestId: string
): Promise<OfferDriver> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/driver/join-requests/${joinRequestId}/cancel`,
      {
        method: 'POST',
        headers: await getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
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



