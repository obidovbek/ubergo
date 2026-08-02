/**
 * Geo API
 * API client for fetching geo hierarchy data (countries, provinces, cities)
 */

import { API_BASE_URL, API_TIMEOUT } from '../config/api';

export interface GeoOption {
  id: number;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  type?: string | null;
}

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

    // Never parse before checking the status: an ingress 502/504 or a rate
    // limiter answers with HTML/plain text, and `response.json()` would then
    // throw "JSON Parse error: Unexpected character: T" instead of the real
    // reason. Same trap that masked the T-017 loop.
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message || `Failed to load geo data (${response.status})`);
    }
    if (!result || !Array.isArray(result.data)) {
      throw new Error('Failed to load geo data');
    }

    return result.data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
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

/**
 * 4th level of the hierarchy (mavze / QFY / shaharcha). Optional everywhere:
 * many city-districts have no settlements at all, so an empty list is normal.
 */
export const fetchGeoSettlements = async (cityDistrictId: number): Promise<GeoOption[]> => {
  return fetchGeoList<GeoOption[]>(`/geo/city-districts/${cityDistrictId}/settlements`);
};

