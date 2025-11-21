/**
 * Vehicle Types API
 * Admin endpoints for managing vehicle types
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT, handleApiResponse } from '../config/api';

export interface VehicleType {
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

export interface VehicleTypePayload {
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export const getVehicleTypes = async (token: string, includeInactive: boolean = true): Promise<VehicleType[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.set('includeInactive', 'true');
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleTypes.list}${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle types yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleType[];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const getVehicleTypeById = async (token: string, id: string): Promise<VehicleType> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleTypes.detail(id)}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle type yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleType;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createVehicleType = async (token: string, payload: VehicleTypePayload): Promise<VehicleType> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleTypes.create}`,
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
      const errorMessage = errorData.message || errorData.error || 'Vehicle type yaratishda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleType;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateVehicleType = async (token: string, id: string, payload: Partial<VehicleTypePayload>): Promise<VehicleType> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleTypes.update(id)}`,
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
      const errorMessage = errorData.message || errorData.error || 'Vehicle type yangilashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleType;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteVehicleType = async (token: string, id: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleTypes.delete(id)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle type o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

