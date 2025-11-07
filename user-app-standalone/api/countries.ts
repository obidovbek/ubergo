/**
 * Countries API
 * Fetch country metadata for registration flows
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export type CountryPattern = 'uz' | 'ru' | 'generic';

export interface CountryResponse {
  id: string;
  name: string;
  code: string;
  flag?: string | null;
  local_length: number;
  pattern: CountryPattern;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CountryListResponse {
  success: boolean;
  data?: CountryResponse[];
  message?: string;
}

export const getCountries = async (): Promise<CountryResponse[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.metadata.countries}`,
      {
        method: 'GET',
        headers: getHeaders(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.statusText}`);
    }

    const payload = (await response.json()) as CountryListResponse;

    if (!payload.success) {
      throw new Error(payload.message || 'Failed to load countries');
    }

    return payload.data || [];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};


