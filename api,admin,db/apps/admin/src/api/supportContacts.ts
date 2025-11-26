/**
 * Support Contacts API
 * Handles all support contact-related API requests
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT, handleAuthError, isAuthError } from '../config/api';

export interface SupportContact {
  id?: string;
  app_name: string;
  email: string | null;
  phone: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get support contact
 */
export const getSupportContact = async (
  token: string,
  appName: string = 'user_app'
): Promise<SupportContact> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.supportContacts.get}?appName=${appName}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`Failed to fetch support contact: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get all support contacts
 */
export const getAllSupportContacts = async (token: string): Promise<SupportContact[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.supportContacts.getAll}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`Failed to fetch support contacts: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update support contact
 */
export const updateSupportContact = async (
  token: string,
  appName: string,
  data: { email?: string | null; phone?: string | null }
): Promise<SupportContact> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.supportContacts.update}`,
      {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify({ appName, ...data }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (isAuthError(response)) {
        handleAuthError();
        throw new Error('Your session has expired. Please log in again.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update support contact: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

