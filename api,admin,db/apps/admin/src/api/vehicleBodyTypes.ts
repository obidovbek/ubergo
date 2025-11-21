/**
 * Vehicle Body Types API
 * Admin endpoints for managing vehicle body types
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export interface VehicleBodyType {
  id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VehicleBodyTypePayload {
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export const getVehicleBodyTypes = async (token: string, includeInactive: boolean = true): Promise<VehicleBodyType[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.set('includeInactive', 'true');
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleBodyTypes.list}${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle body types yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleBodyType[];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const getVehicleBodyTypeById = async (token: string, id: string): Promise<VehicleBodyType> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleBodyTypes.detail(id)}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle body type yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleBodyType;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createVehicleBodyType = async (token: string, payload: VehicleBodyTypePayload): Promise<VehicleBodyType> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleBodyTypes.create}`,
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
      const errorMessage = errorData.message || errorData.error || 'Vehicle body type yaratishda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleBodyType;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateVehicleBodyType = async (token: string, id: string, payload: Partial<VehicleBodyTypePayload>): Promise<VehicleBodyType> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleBodyTypes.update(id)}`,
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
      const errorMessage = errorData.message || errorData.error || 'Vehicle body type yangilashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleBodyType;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteVehicleBodyType = async (token: string, id: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleBodyTypes.delete(id)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle body type o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

