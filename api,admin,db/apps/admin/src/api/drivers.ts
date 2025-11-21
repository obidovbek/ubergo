/**
 * Drivers API
 * Handles all driver-related API requests
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT, handleAuthError, isAuthError } from '../config/api';

export interface GeoLocation {
  id: number;
  name: string;
}

export interface GeoSettlementLocation extends GeoLocation {
  type?: string | null;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  father_name?: string | null;
  gender?: 'male' | 'female' | null;
  birth_date?: string | null;
  email?: string | null;
  address_country_id?: number | null;
  address_province_id?: number | null;
  address_city_district_id?: number | null;
  address_administrative_area_id?: number | null;
  address_settlement_id?: number | null;
  address_neighborhood_id?: number | null;
  address_street?: string | null;
  photo_face_url?: string | null;
  photo_body_url?: string | null;
  vehicle_owner_type?: 'own' | 'other_person' | 'company' | null;
  vehicle_usage_type?: 'rent' | 'free_use' | null;
  registration_step: 'personal' | 'passport' | 'license' | 'vehicle' | 'taxi_license' | 'complete';
  is_complete: boolean;
  passport?: DriverPassport;
  license?: DriverLicense;
  emergencyContacts?: EmergencyContact[];
  vehicle?: DriverVehicle;
  taxiLicense?: DriverTaxiLicense;
  addressCountry?: GeoLocation | null;
  addressProvince?: GeoLocation | null;
  addressCityDistrict?: GeoLocation | null;
  addressAdministrativeArea?: GeoLocation | null;
  addressSettlement?: GeoSettlementLocation | null;
  addressNeighborhood?: GeoLocation | null;
}

export interface DriverPassport {
  id: string;
  driver_profile_id: string;
  first_name?: string | null;
  last_name?: string | null;
  father_name?: string | null;
  gender?: 'male' | 'female' | null;
  birth_date?: string | null;
  citizenship?: string | null;
  birth_place_country?: string | null;
  birth_place_region?: string | null;
  birth_place_city?: string | null;
  id_card_number?: string | null;
  pinfl?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  passport_front_url?: string | null;
  passport_back_url?: string | null;
}

export interface DriverLicense {
  id: string;
  driver_profile_id: string;
  first_name?: string | null;
  last_name?: string | null;
  father_name?: string | null;
  birth_date?: string | null;
  license_number?: string | null;
  issue_date?: string | null;
  category_a?: string | null;
  category_b?: string | null;
  category_c?: string | null;
  category_d?: string | null;
  category_be?: string | null;
  category_ce?: string | null;
  category_de?: string | null;
  license_front_url?: string | null;
  license_back_url?: string | null;
}

export interface EmergencyContact {
  id: string;
  driver_profile_id: string;
  phone_country_code?: string | null;
  phone_number?: string | null;
  relationship?: string | null;
}

export interface DriverVehicle {
  id: string;
  driver_profile_id: string;
  company_name?: string | null;
  company_tax_id?: string | null;
  owner_first_name?: string | null;
  owner_last_name?: string | null;
  owner_father_name?: string | null;
  owner_pinfl?: string | null;
  owner_address_country?: string | null;
  owner_address_region?: string | null;
  owner_address_city?: string | null;
  owner_address_mahalla?: string | null;
  owner_address_street?: string | null;
  vehicle_type?: 'light' | 'cargo' | null;
  body_type?: string | null;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  license_plate?: string | null;
  year?: number | null;
  gross_weight?: number | null;
  unladen_weight?: number | null;
  fuel_types?: string[] | null;
  seating_capacity?: number | null;
  tech_passport_series?: string | null;
  tech_passport_front_url?: string | null;
  tech_passport_back_url?: string | null;
  photo_front_url?: string | null;
  photo_back_url?: string | null;
  photo_right_url?: string | null;
  photo_left_url?: string | null;
  photo_angle_45_url?: string | null;
  photo_interior_url?: string | null;
}

export interface DriverTaxiLicense {
  id: string;
  driver_profile_id: string;
  license_number?: string | null;
  license_issue_date?: string | null;
  license_registry_number?: string | null;
  license_document_url?: string | null;
  license_sheet_number?: string | null;
  license_sheet_valid_from?: string | null;
  license_sheet_valid_until?: string | null;
  license_sheet_document_url?: string | null;
  self_employment_number?: string | null;
  self_employment_document_url?: string | null;
  power_of_attorney_document_url?: string | null;
  insurance_document_url?: string | null;
}

export interface Driver {
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
  role: 'driver';
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
  driverProfile?: DriverProfile;
  created_at: string;
  updated_at: string;
}

export interface DriverListResponse {
  data: Driver[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Fetch drivers list with pagination
 */
export const getDrivers = async (
  token: string,
  page: number = 1,
  pageSize: number = 25,
  filters?: { status?: string; search?: string; registrationStep?: string }
): Promise<DriverListResponse> => {
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
    if (filters?.registrationStep) {
      params.append('registrationStep', filters.registrationStep);
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.drivers.list}?${params.toString()}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`Failed to fetch drivers: ${response.statusText}`);
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
 * Get driver by ID
 */
export const getDriverById = async (token: string, id: string): Promise<Driver> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.drivers.detail(id)}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`Failed to fetch driver: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update driver
 */
export const updateDriver = async (
  token: string,
  id: string,
  driverData: Partial<Driver>
): Promise<Driver> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.drivers.update(id)}`,
      {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(driverData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`Failed to update driver: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Delete driver
 */
export const deleteDriver = async (token: string, id: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.drivers.delete(id)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`Failed to delete driver: ${response.statusText}`);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

