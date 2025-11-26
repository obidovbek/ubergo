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

export interface GeoOption {
  id: number;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  type?: string | null;
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
  // Legacy string fields (may be undefined when using new geo hierarchy)
  address_country?: string;
  address_region?: string;
  address_city?: string;
  address_settlement_type?: string;
  address_mahalla?: string;
  address_street?: string | null;
  // New geo hierarchy references
  address_country_id?: number | null;
  address_province_id?: number | null;
  address_city_district_id?: number | null;
  address_administrative_area_id?: number | null;
  address_settlement_id?: number | null;
  address_neighborhood_id?: number | null;
  addressCountry?: GeoOption | null;
  addressProvince?: GeoOption | null;
  addressCityDistrict?: GeoOption | null;
  addressAdministrativeArea?: GeoOption | null;
  addressSettlement?: GeoOption | null;
  addressNeighborhood?: GeoOption | null;
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
      const error: any = new Error(result.message || 'Failed to get driver profile status');
      error.status = response.status;
      error.response = { status: response.status, data: result };
      throw error;
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
    // Validate base64 string
    if (!imageBase64 || imageBase64.trim().length === 0) {
      throw new Error('Image data is empty');
    }

    // Extract base64 data (remove data URL prefix if present)
    let base64Data = imageBase64;
    if (base64Data.includes(',')) {
      // Keep the full data URL format as the API expects it
      base64Data = imageBase64;
    }

    // Estimate image size from base64 string (base64 is ~33% larger than binary)
    // This is a rough estimate to catch obviously too large images before upload
    const estimatedSize = (base64Data.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    
    if (estimatedSize > maxSize) {
      throw new Error(`Rasm hajmi juda katta. Maksimal hajm: 5MB`);
    }

    const response = await fetch(
      `${API_BASE_URL}/upload/image`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          image: base64Data,
          type: imageType,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorText = '';
      let errorMessage = 'Rasmni yuklashda xatolik';
      
      try {
        errorText = await response.text();
        if (errorText) {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        }
      } catch (parseError) {
        // If parsing fails, use the raw text or status
        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
      }
      
      // Provide more specific error messages based on status code
      if (response.status === 400) {
        errorMessage = errorMessage || 'Rasm formati noto\'g\'ri yoki hajmi juda katta';
      } else if (response.status === 401) {
        errorMessage = 'Autentifikatsiya xatosi. Iltimos, qayta kirish';
      } else if (response.status === 413) {
        errorMessage = 'Rasm hajmi juda katta. Maksimal hajm: 5MB';
      } else if (response.status >= 500) {
        errorMessage = 'Server xatosi. Iltimos, keyinroq qayta urinib ko\'ring';
      }
      
      console.error('Image upload error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        errorText: errorText.substring(0, 200), // Log first 200 chars
      });
      
      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (!result.data || !result.data.url) {
      throw new Error('Server javobi noto\'g\'ri: rasm URL topilmadi');
    }

    // Return full URL
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${result.data.url}`;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      // If it's already a user-friendly error, throw it as is
      if (error.message.includes('Rasm') || error.message.includes('hajmi') || error.message.includes('xatolik')) {
        throw error;
      }
      // Otherwise, wrap it in a user-friendly message
      throw new Error(`Rasmni yuklashda xatolik: ${error.message}`);
    }
    throw new Error('Rasmni yuklashda noma\'lum xatolik');
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

const fetchGeoList = async <T extends GeoOption[]>(
  path: string
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to load geo data');
    }

    return result.data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const fetchGeoCountries = async (): Promise<GeoOption[]> => {
  return fetchGeoList<GeoOption[]>('/geo/countries');
};

export const fetchGeoProvinces = async (countryId: number): Promise<GeoOption[]> => {
  return fetchGeoList<GeoOption[]>(`/geo/countries/${countryId}/provinces`);
};

export const fetchGeoCityDistricts = async (provinceId: number): Promise<GeoOption[]> => {
  return fetchGeoList<GeoOption[]>(`/geo/provinces/${provinceId}/city-districts`);
};

export const fetchGeoAdministrativeAreas = async (
  cityDistrictId: number
): Promise<GeoOption[]> => {
  return fetchGeoList<GeoOption[]>(
    `/geo/city-districts/${cityDistrictId}/administrative-areas`
  );
};

export const fetchGeoSettlements = async (cityDistrictId: number): Promise<GeoOption[]> => {
  return fetchGeoList<GeoOption[]>(`/geo/city-districts/${cityDistrictId}/settlements`);
};

export const fetchGeoNeighborhoods = async (
  cityDistrictId: number
): Promise<GeoOption[]> => {
  return fetchGeoList<GeoOption[]>(`/geo/city-districts/${cityDistrictId}/neighborhoods`);
};

export interface CountryOption {
  id: string;
  name: string;
  code: string;
  flag?: string | null;
  local_length: number;
  pattern: 'uz' | 'ru' | 'generic';
  sort_order: number;
  is_active: boolean;
}

/**
 * Fetch countries for phone country codes
 */
export const fetchCountries = async (): Promise<CountryOption[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/countries`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to load countries');
    }

    return result.data as CountryOption[];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Vehicle data interfaces
export interface VehicleMakeOption {
  id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface VehicleModelOption {
  id: string;
  vehicle_make_id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface VehicleBodyTypeOption {
  id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface VehicleColorOption {
  id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  hex_code?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface VehicleTypeOption {
  id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  is_active: boolean;
  sort_order: number;
}

/**
 * Fetch vehicle makes
 */
export const fetchVehicleMakes = async (token: string): Promise<VehicleMakeOption[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/makes`, {
      method: 'GET',
      signal: controller.signal,
      headers: getHeaders(token),
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to load vehicle makes');
    }

    return result.data as VehicleMakeOption[];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Fetch vehicle models by make
 */
export const fetchVehicleModels = async (token: string, makeId?: string): Promise<VehicleModelOption[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = makeId 
      ? `${API_BASE_URL}/vehicles/models?make_id=${makeId}`
      : `${API_BASE_URL}/vehicles/models`;
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: getHeaders(token),
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to load vehicle models');
    }

    return result.data as VehicleModelOption[];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Fetch vehicle body types
 */
export const fetchVehicleBodyTypes = async (token: string): Promise<VehicleBodyTypeOption[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/body-types`, {
      method: 'GET',
      signal: controller.signal,
      headers: getHeaders(token),
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to load vehicle body types');
    }

    return result.data as VehicleBodyTypeOption[];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Fetch vehicle colors
 */
export const fetchVehicleColors = async (token: string): Promise<VehicleColorOption[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/colors`, {
      method: 'GET',
      signal: controller.signal,
      headers: getHeaders(token),
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to load vehicle colors');
    }

    return result.data as VehicleColorOption[];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Fetch vehicle types
 */
export const fetchVehicleTypes = async (token: string): Promise<VehicleTypeOption[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/types`, {
      method: 'GET',
      signal: controller.signal,
      headers: getHeaders(token),
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to load vehicle types');
    }

    return result.data as VehicleTypeOption[];
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

