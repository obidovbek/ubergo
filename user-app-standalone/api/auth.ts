/**
 * Auth API
 * Handles authentication-related API requests
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';
import { ApiError } from '../utils/errorHandler';

/**
 * Read a response body without assuming it is JSON.
 *
 * Rate limiters, proxies and error pages can answer with text or HTML. Calling
 * `response.json()` blindly turned those into `JSON Parse error`, which hid the real
 * status and message from the user entirely — a limited request looked like a crash.
 */
const parseResponseBody = async (response: Response): Promise<any> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    // Not JSON — keep the text as the message so the caller can still show something.
    return { message: text.trim().substring(0, 200) };
  }
};

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
    /** Seconds before a resend is allowed. Optional — older API builds omit it. */
    cooldownSec?: number;
  };
  message: string;
}

/**
 * Send OTP to phone number
 */
export const sendOtp = async (phone: string, channel: 'sms' | 'call' | 'push' = 'sms'): Promise<OtpSendResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.auth.sendOtp}`;
    const requestBody = { phone, channel };
    
    const headers = await getHeaders();

    console.log('=== API Request ===');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('=== API Response ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    const data = await parseResponseBody(response);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('API Error:', data);
      // Carries the status and body, so the screen can show the server's reason
      // (e.g. the 60s cooldown with its remaining seconds) instead of a generic toast.
      throw new ApiError(response.status, data, `Failed to send OTP (${response.status})`);
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
 * Verify OTP code
 */
export const verifyOtp = async (phone: string, code: string): Promise<AuthResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.verifyOtp}`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ phone, code }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw new ApiError(response.status, data, 'Failed to verify OTP');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Google Sign-In
 */
export const googleSignIn = async (idToken: string): Promise<AuthResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.googleAuth}`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ id_token: idToken }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw new ApiError(response.status, data, 'Google authentication failed');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Apple Sign-In
 */
export const appleSignIn = async (idToken: string): Promise<AuthResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.appleAuth}`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ id_token: idToken }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw new ApiError(response.status, data, 'Apple authentication failed');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Facebook Sign-In
 */
export const facebookSignIn = async (accessToken: string): Promise<AuthResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.facebookAuth}`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ access_token: accessToken }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw new ApiError(response.status, data, 'Facebook authentication failed');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = async (token: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.me}`,
      {
        method: 'GET',
        headers: await getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await parseResponseBody(response);

    if (!response.ok) {
      // Surface the HTTP status so callers can tell "account deleted / token
      // rejected" (401/403/404) apart from a network failure (OR-002).
      throw new ApiError(
        response.status,
        data,
        `Failed to get user info: ${response.status} ${response.statusText}`
      );
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
        headers: await getHeaders(),
        body: JSON.stringify({ refresh: refreshToken }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw new ApiError(response.status, data, 'Failed to refresh token');
    }

    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Logout
 */
export const logout = async (token: string, refreshToken: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.logout}`,
      {
        method: 'POST',
        headers: await getHeaders(token),
        body: JSON.stringify({ refresh: refreshToken }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const data = await parseResponseBody(response);
      throw new ApiError(response.status, data, 'Logout failed');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

