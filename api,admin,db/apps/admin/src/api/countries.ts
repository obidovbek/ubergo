/**
 * Countries API
 * Admin endpoints for managing country metadata
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT, handleApiResponse } from '../config/api';

export type CountryPattern = 'uz' | 'ru' | 'generic';

export interface Country {
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

export interface CountryPayload {
  name: string;
  code: string;
  flag?: string | null;
  local_length: number;
  pattern: CountryPattern;
  sort_order?: number;
  is_active?: boolean;
}

export const getCountries = async (token: string, includeInactive: boolean = true): Promise<Country[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.set('includeInactive', 'true');
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.countries.list}${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    return handleApiResponse<Country[]>(response, 'Mamlakatlarni yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const getCountryById = async (token: string, id: string): Promise<Country> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.countries.detail(id)}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    return handleApiResponse<Country>(response, 'Mamlakatni yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createCountry = async (token: string, payload: CountryPayload): Promise<Country> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.countries.create}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    return handleApiResponse<Country>(response, 'Mamlakatni yaratishda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateCountry = async (token: string, id: string, payload: Partial<CountryPayload>): Promise<Country> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.countries.update(id)}`,
      {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    return handleApiResponse<Country>(response, 'Mamlakatni yangilashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteCountry = async (token: string, id: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.countries.delete(id)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    await handleApiResponse<void>(response, 'Mamlakatni o\'chirishda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};


