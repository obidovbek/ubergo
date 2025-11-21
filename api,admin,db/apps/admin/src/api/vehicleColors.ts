/**
 * Vehicle Colors API
 * Admin endpoints for managing vehicle colors
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT, handleApiResponse } from '../config/api';

export interface VehicleColor {
  id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  hex_code?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VehicleColorPayload {
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  hex_code?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export const getVehicleColors = async (token: string, includeInactive: boolean = true): Promise<VehicleColor[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.set('includeInactive', 'true');
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleColors.list}${params.toString() ? `?${params.toString()}` : ''}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle colors yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleColor[];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const getVehicleColorById = async (token: string, id: string): Promise<VehicleColor> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleColors.detail(id)}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle color yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleColor;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const createVehicleColor = async (token: string, payload: VehicleColorPayload): Promise<VehicleColor> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleColors.create}`,
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
      const errorMessage = errorData.message || errorData.error || 'Vehicle color yaratishda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleColor;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateVehicleColor = async (token: string, id: string, payload: Partial<VehicleColorPayload>): Promise<VehicleColor> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleColors.update(id)}`,
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
      const errorMessage = errorData.message || errorData.error || 'Vehicle color yangilashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data as VehicleColor;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const deleteVehicleColor = async (token: string, id: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.vehicleColors.delete(id)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Vehicle color o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

