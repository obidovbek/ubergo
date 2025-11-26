/**
 * App Store URLs API
 * Handles all app store URL-related API requests
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT, handleAuthError, isAuthError } from '../config/api';

export interface AppStoreUrl {
  id?: string;
  app_name: string;
  android_url: string | null;
  ios_url: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get app store URLs
 */
export const getAppStoreUrls = async (
  token: string,
  appName: string = 'user_app'
): Promise<AppStoreUrl> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.appStoreUrls.get(appName)}`,
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
      throw new Error(`Failed to fetch app store URLs: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update app store URLs
 */
export const updateAppStoreUrls = async (
  token: string,
  appName: string,
  data: { android_url?: string | null; ios_url?: string | null }
): Promise<AppStoreUrl> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.appStoreUrls.update(appName)}`,
      {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(data),
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
      throw new Error(errorData.message || `Failed to update app store URLs: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

