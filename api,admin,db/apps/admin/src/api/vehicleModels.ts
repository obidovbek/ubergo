/**
 * Vehicle Models API
 * Admin endpoints for managing vehicle models
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export interface VehicleModel {
  id: string;
  vehicle_make_id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  make?: {
    id: string;
    name: string;
  };
}

export interface VehicleModelPayload {
  vehicle_make_id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export const getVehicleModels = async (token: string, includeInactive: boolean = true, makeId?: string): Promise<VehicleModel[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.set('includeInactive', 'true');
    }
    if (makeId) {
      params.set('makeId', makeId);
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleModels.list}${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle models yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleModel[];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const getVehicleModelById = async (token: string, id: string): Promise<VehicleModel> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleModels.detail(id)}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle model yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleModel;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createVehicleModel = async (token: string, payload: VehicleModelPayload): Promise<VehicleModel> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleModels.create}`,
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
      const errorMessage = errorData.message || errorData.error || 'Vehicle model yaratishda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleModel;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateVehicleModel = async (token: string, id: string, payload: Partial<VehicleModelPayload>): Promise<VehicleModel> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleModels.update(id)}`,
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
      const errorMessage = errorData.message || errorData.error || 'Vehicle model yangilashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleModel;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteVehicleModel = async (token: string, id: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleModels.delete(id)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle model o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

