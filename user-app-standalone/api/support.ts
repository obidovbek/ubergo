/**
 * Support API
 * Handles support contact information requests
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export interface SupportContact {
  email: string | null;
  phone: string | null;
}

/**
 * Get support contact information
 */
export const getSupportContact = async (
  appName: string = 'user_app'
): Promise<SupportContact> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/support-contacts?appName=${appName}`,
      {
        method: 'GET',
        headers: getHeaders(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch support contact: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    // Return defaults on error
    return {
      email: 'support@ubexgo.uz',
      phone: '+998901234567',
    };
  }
};

