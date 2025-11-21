/**
 * Authentication API
 * Handles authentication-related API requests
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT, handleApiResponse } from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    full_name: string;
    email: string;
    roles: Array<{
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      permissions?: string[] | null;
      is_active: boolean;
    }>;
    status: 'active' | 'inactive' | 'suspended';
  };
  token: string;
  refreshToken: string;
}

/**
 * Login user
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.login}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(credentials),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Kirishda xatolik yuz berdi';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Handle API response format (successResponse wrapper)
    if (data.success !== undefined && data.data) {
      return data.data;
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      // Network errors
      if (error.name === 'AbortError' || error.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to server. Please check if the API is running.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred during login');
  }
};

/**
 * Logout user
 */
export const logout = async (token: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.logout}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    // Don't throw on logout errors
    console.error('Logout error:', error);
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (token: string): Promise<AuthResponse['user']> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.me}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    return handleApiResponse<AuthResponse['user']>(response, 'Foydalanuvchi ma\'lumotlarini yuklashda xatolik');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

