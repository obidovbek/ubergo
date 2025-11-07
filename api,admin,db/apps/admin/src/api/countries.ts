/**
 * Countries API
 * Admin endpoints for managing country metadata
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Mamlakatlarni yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as Country[];
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Mamlakatni yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as Country;
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Mamlakatni yaratishda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as Country;
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Mamlakatni yangilashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as Country;
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Mamlakatni o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};


