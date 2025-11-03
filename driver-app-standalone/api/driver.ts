/**
 * Driver API
 * Handles driver profile and registration API requests
 */

import { API_BASE_URL, getHeaders, API_TIMEOUT } from '../config/api';

export interface DriverProfileStatus {
  hasProfile: boolean;
  registrationStep: 'personal' | 'passport' | 'license' | 'vehicle' | 'taxi_license' | 'complete';
  isComplete: boolean;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  father_name?: string;
  gender?: 'male' | 'female';
  birth_date?: string;
  email?: string;
  address_country?: string;
  address_region?: string;
  address_city?: string;
  address_settlement_type?: string;
  address_mahalla?: string;
  address_street?: string;
  photo_face_url?: string;
  photo_body_url?: string;
  vehicle_owner_type?: 'own' | 'other_person' | 'company';
  vehicle_usage_type?: 'rent' | 'free_use';
  registration_step: string;
  is_complete: boolean;
}

export interface DriverProfileResponse {
  profile: DriverProfile;
}

/**
 * Get driver profile status
 */
export const getDriverProfileStatus = async (token: string): Promise<DriverProfileStatus> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/driver/profile/status`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to get driver profile status');
    }

    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get full driver profile
 */
export const getDriverProfile = async (token: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/driver/profile`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to get driver profile');
    }

    return result.data as DriverProfileResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Upload image
 */
export const uploadImage = async (token: string, imageBase64: string, imageType: string = 'jpg'): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/upload/image`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          image: imageBase64,
          type: imageType,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload image');
    }

    // Return full URL
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${result.data.url}`;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update personal information (Step 1)
 */
export const updatePersonalInfo = async (token: string, data: Partial<DriverProfile>) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/driver/profile/personal`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update personal information');
    }

    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update passport information (Step 2)
 */
export const updatePassport = async (token: string, data: any) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/driver/profile/passport`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update passport');
    }

    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update license and emergency contacts (Step 3)
 */
export const updateLicense = async (token: string, data: any) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/driver/profile/license`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update license');
    }

    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update vehicle information (Step 4)
 */
export const updateVehicle = async (token: string, data: any) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/driver/profile/vehicle`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update vehicle');
    }

    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update taxi license (Step 5)
 */
export const updateTaxiLicense = async (token: string, data: any) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/driver/profile/taxi-license`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(data),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update taxi license');
    }

    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

