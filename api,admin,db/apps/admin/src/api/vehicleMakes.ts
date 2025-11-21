/**
 * Vehicle Makes API
 * Admin endpoints for managing vehicle makes
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT, handleApiResponse } from '../config/api';

export interface VehicleMake {
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

export interface VehicleMakePayload {
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export const getVehicleMakes = async (token: string, includeInactive: boolean = true): Promise<VehicleMake[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.set('includeInactive', 'true');
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleMakes.list}${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    return handleApiResponse<VehicleMake[]>(response, 'Vehicle makes yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const getVehicleMakeById = async (token: string, id: string): Promise<VehicleMake> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleMakes.detail(id)}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    return handleApiResponse<VehicleMake>(response, 'Vehicle make yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createVehicleMake = async (token: string, payload: VehicleMakePayload): Promise<VehicleMake> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleMakes.create}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    return handleApiResponse<VehicleMake>(response, 'Vehicle make yaratishda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateVehicleMake = async (token: string, id: string, payload: Partial<VehicleMakePayload>): Promise<VehicleMake> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleMakes.update(id)}`,
      {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    return handleApiResponse<VehicleMake>(response, 'Vehicle make yangilashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteVehicleMake = async (token: string, id: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleMakes.delete(id)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    await handleApiResponse<void>(response, 'Vehicle make o\'chirishda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

