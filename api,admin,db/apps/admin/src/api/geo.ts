/**
 * Geo Hierarchy API
 * Admin endpoints for managing geo locations
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export interface GeoCountry {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface GeoProvince {
  id: number;
  name: string;
  country_id: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface GeoCityDistrict {
  id: number;
  name: string;
  province_id: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface GeoAdministrativeArea {
  id: number;
  name: string;
  city_district_id: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface GeoSettlement {
  id: number;
  name: string;
  city_district_id: number;
  type?: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface GeoNeighborhood {
  id: number;
  name: string;
  city_district_id: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface CoordinatePayload {
  latitude?: number | null;
  longitude?: number | null;
}

export type GeoCountryPayload = {
  name: string;
} & CoordinatePayload;

export type GeoProvincePayload = {
  name: string;
  country_id: number;
} & CoordinatePayload;

export type GeoCityDistrictPayload = {
  name: string;
  province_id: number;
} & CoordinatePayload;

export type GeoAdministrativeAreaPayload = {
  name: string;
  city_district_id: number;
} & CoordinatePayload;

export type GeoSettlementPayload = {
  name: string;
  city_district_id: number;
  type?: string | null;
} & CoordinatePayload;

export type GeoNeighborhoodPayload = {
  name: string;
  city_district_id: number;
} & CoordinatePayload;

const handleResponse = async <T>(response: Response, defaultError: string): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || errorData.error || defaultError;
    throw new Error(errorMessage);
  }
  const data = await response.json();
  return data.data as T;
};

const createController = () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  return { controller, timeoutId };
};

/* Countries */
export const getGeoCountries = async (token: string): Promise<GeoCountry[]> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.countries.list}`, {
      method: 'GET',
      headers: getHeaders(token),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoCountry[]>(response, 'Mamlakatlarni yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createGeoCountry = async (
  token: string,
  payload: GeoCountryPayload
): Promise<GeoCountry> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.countries.create}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoCountry>(response, 'Mamlakatni yaratishda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateGeoCountry = async (
  token: string,
  id: number,
  payload: Partial<GeoCountryPayload>
): Promise<GeoCountry> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.countries.update(id)}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoCountry>(response, 'Mamlakatni yangilashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const getGeoCountryById = async (token: string, id: number): Promise<GeoCountry> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.countries.detail(id)}`, {
      method: 'GET',
      headers: getHeaders(token),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoCountry>(response, 'Mamlakatni yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteGeoCountry = async (token: string, id: number): Promise<void> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.countries.delete(id)}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || 'Mamlakatni o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/* Provinces */
export const getGeoProvinces = async (
  token: string,
  countryId?: number | null
): Promise<GeoProvince[]> => {
  const { controller, timeoutId } = createController();
  try {
    const params = new URLSearchParams();
    if (countryId) {
      params.set('countryId', String(countryId));
    }
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.geo.provinces.list}${
        params.toString() ? `?${params.toString()}` : ''
      }`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    return handleResponse<GeoProvince[]>(response, 'Viloyatlarni yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createGeoProvince = async (
  token: string,
  payload: GeoProvincePayload
): Promise<GeoProvince> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.provinces.create}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoProvince>(response, 'Viloyatni yaratishda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateGeoProvince = async (
  token: string,
  id: number,
  payload: Partial<GeoProvincePayload>
): Promise<GeoProvince> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.provinces.update(id)}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoProvince>(response, 'Viloyatni yangilashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const getGeoProvinceById = async (token: string, id: number): Promise<GeoProvince> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.provinces.detail(id)}`, {
      method: 'GET',
      headers: getHeaders(token),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoProvince>(response, 'Viloyatni yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteGeoProvince = async (token: string, id: number): Promise<void> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.provinces.delete(id)}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || 'Viloyatni o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/* City Districts */
export const getGeoCityDistricts = async (
  token: string,
  provinceId?: number | null
): Promise<GeoCityDistrict[]> => {
  const { controller, timeoutId } = createController();
  try {
    const params = new URLSearchParams();
    if (provinceId) {
      params.set('provinceId', String(provinceId));
    }
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.geo.cityDistricts.list}${
        params.toString() ? `?${params.toString()}` : ''
      }`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    return handleResponse<GeoCityDistrict[]>(response, 'Tumanlarni yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createGeoCityDistrict = async (
  token: string,
  payload: GeoCityDistrictPayload
): Promise<GeoCityDistrict> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.cityDistricts.create}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoCityDistrict>(response, 'Tuman yaratishda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateGeoCityDistrict = async (
  token: string,
  id: number,
  payload: Partial<GeoCityDistrictPayload>
): Promise<GeoCityDistrict> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.cityDistricts.update(id)}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoCityDistrict>(response, 'Tumanni yangilashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteGeoCityDistrict = async (token: string, id: number): Promise<void> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.cityDistricts.delete(id)}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || 'Tumanni o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/* Administrative Areas */
export const getGeoAdministrativeAreas = async (
  token: string,
  cityDistrictId?: number | null
): Promise<GeoAdministrativeArea[]> => {
  const { controller, timeoutId } = createController();
  try {
    const params = new URLSearchParams();
    if (cityDistrictId) {
      params.set('cityDistrictId', String(cityDistrictId));
    }
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.geo.administrativeAreas.list}${
        params.toString() ? `?${params.toString()}` : ''
      }`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    return handleResponse<GeoAdministrativeArea[]>(
      response,
      'Ma\'muriy hududlarni yuklashda xatolik'
    );
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createGeoAdministrativeArea = async (
  token: string,
  payload: GeoAdministrativeAreaPayload
): Promise<GeoAdministrativeArea> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.geo.administrativeAreas.create}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    return handleResponse<GeoAdministrativeArea>(
      response,
      'Ma\'muriy hudud yaratishda xatolik'
    );
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateGeoAdministrativeArea = async (
  token: string,
  id: number,
  payload: Partial<GeoAdministrativeAreaPayload>
): Promise<GeoAdministrativeArea> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.geo.administrativeAreas.update(id)}`,
      {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    return handleResponse<GeoAdministrativeArea>(
      response,
      'Ma\'muriy hududni yangilashda xatolik'
    );
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteGeoAdministrativeArea = async (
  token: string,
  id: number
): Promise<void> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.geo.administrativeAreas.delete(id)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || 'Ma\'muriy hududni o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/* Settlements */
export const getGeoSettlements = async (
  token: string,
  cityDistrictId?: number | null
): Promise<GeoSettlement[]> => {
  const { controller, timeoutId } = createController();
  try {
    const params = new URLSearchParams();
    if (cityDistrictId) {
      params.set('cityDistrictId', String(cityDistrictId));
    }
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.geo.settlements.list}${
        params.toString() ? `?${params.toString()}` : ''
      }`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    return handleResponse<GeoSettlement[]>(response, 'Aholi punktlarini yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createGeoSettlement = async (
  token: string,
  payload: GeoSettlementPayload
): Promise<GeoSettlement> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.settlements.create}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoSettlement>(response, 'Aholi punktini yaratishda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateGeoSettlement = async (
  token: string,
  id: number,
  payload: Partial<GeoSettlementPayload>
): Promise<GeoSettlement> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.settlements.update(id)}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoSettlement>(response, 'Aholi punktini yangilashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteGeoSettlement = async (token: string, id: number): Promise<void> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.settlements.delete(id)}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || 'Aholi punktini o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/* Neighborhoods */
export const getGeoNeighborhoods = async (
  token: string,
  cityDistrictId?: number | null
): Promise<GeoNeighborhood[]> => {
  const { controller, timeoutId } = createController();
  try {
    const params = new URLSearchParams();
    if (cityDistrictId) {
      params.set('cityDistrictId', String(cityDistrictId));
    }
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.geo.neighborhoods.list}${
        params.toString() ? `?${params.toString()}` : ''
      }`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    return handleResponse<GeoNeighborhood[]>(response, 'Mahallalarni yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createGeoNeighborhood = async (
  token: string,
  payload: GeoNeighborhoodPayload
): Promise<GeoNeighborhood> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.neighborhoods.create}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoNeighborhood>(response, 'Mahalla yaratishda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateGeoNeighborhood = async (
  token: string,
  id: number,
  payload: Partial<GeoNeighborhoodPayload>
): Promise<GeoNeighborhood> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.neighborhoods.update(id)}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return handleResponse<GeoNeighborhood>(response, 'Mahallani yangilashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteGeoNeighborhood = async (token: string, id: number): Promise<void> => {
  const { controller, timeoutId } = createController();
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.geo.neighborhoods.delete(id)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || 'Mahallani o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/* Bulk Upload Functions */
export const bulkUploadGeoCountries = async (
  token: string,
  data: any[]
): Promise<{ created: number; updated: number; errors: string[] }> => {
  const timeoutId = setTimeout(() => {
    throw new Error('Request timeout');
  }, API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.countries.create}/bulk-upload`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ data }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Bulk upload failed';
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const bulkUploadGeoProvinces = async (
  token: string,
  data: any[]
): Promise<{ created: number; updated: number; errors: string[] }> => {
  const timeoutId = setTimeout(() => {
    throw new Error('Request timeout');
  }, API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.provinces.create}/bulk-upload`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ data }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Bulk upload failed';
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const bulkUploadGeoCityDistricts = async (
  token: string,
  data: any[]
): Promise<{ created: number; updated: number; errors: string[] }> => {
  const timeoutId = setTimeout(() => {
    throw new Error('Request timeout');
  }, API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.cityDistricts.create}/bulk-upload`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ data }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Bulk upload failed';
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const bulkUploadGeoAdministrativeAreas = async (
  token: string,
  data: any[]
): Promise<{ created: number; updated: number; errors: string[] }> => {
  const timeoutId = setTimeout(() => {
    throw new Error('Request timeout');
  }, API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.administrativeAreas.create}/bulk-upload`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ data }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Bulk upload failed';
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const bulkUploadGeoSettlements = async (
  token: string,
  data: any[]
): Promise<{ created: number; updated: number; errors: string[] }> => {
  const timeoutId = setTimeout(() => {
    throw new Error('Request timeout');
  }, API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.settlements.create}/bulk-upload`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ data }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Bulk upload failed';
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const bulkUploadGeoNeighborhoods = async (
  token: string,
  data: any[]
): Promise<{ created: number; updated: number; errors: string[] }> => {
  const timeoutId = setTimeout(() => {
    throw new Error('Request timeout');
  }, API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.geo.neighborhoods.create}/bulk-upload`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ data }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Bulk upload failed';
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

