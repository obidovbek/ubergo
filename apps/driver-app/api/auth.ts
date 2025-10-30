/**
 * Auth API - Driver App
 * Handles driver authentication-related API requests
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export interface AuthResponse {
  success: boolean;
  data: {
    access: string;
    refresh: string;
    user: {
      id: string;
      phone_e164?: string;
      email?: string;
      display_name?: string;
      is_verified: boolean;
      role: string;
      status: string;
      driver_type?: 'driver' | 'dispatcher' | 'special_transport' | 'logist';
    };
  };
  message: string;
}

export interface OtpSendResponse {
  success: boolean;
  data: {
    sent: boolean;
    channel: string;
    expiresInSec: number;
  };
  message: string;
}

/**
 * Send OTP to driver phone number
 */
export const sendOtp = async (
  phone?: string,
  channel: 'sms' | 'call' | 'push' = 'sms',
  opts?: { userId?: string }
): Promise<OtpSendResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.auth.sendOtp}`;
    const requestBody: any = { channel };
    if (phone) requestBody.phone = phone;
    if (opts?.userId) requestBody.userId = opts.userId;
    
    console.log('=== Driver API Request ===');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Headers:', JSON.stringify(getHeaders(), null, 2));
    console.log('Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('=== API Response ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('API Error:', data);
      throw new Error(data.message || `Failed to send OTP (${response.status})`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out after', API_TIMEOUT, 'ms');
        throw new Error('Request timed out. Please check your internet connection.');
      }
      console.error('Send OTP error:', error.message);
    }
    
    throw error;
  }
};

/**
 * Verify OTP code for driver
 */
export const verifyOtp = async (phone: string | undefined, code: string, opts?: { userId?: string }): Promise<AuthResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.verifyOtp}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ phone, code, userId: opts?.userId }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify OTP');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get current driver info
 */
export const getCurrentUser = async (token: string) => {
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user info');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<{ access: string; refresh: string }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ refresh: refreshToken }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to refresh token');
    }

    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Logout driver
 */
export const logout = async (token: string, refreshToken: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.logout}`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ refresh: refreshToken }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Logout failed');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
