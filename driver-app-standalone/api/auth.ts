/**
 * Auth API - Driver App
 * Handles driver authentication-related API requests
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
    /** Seconds before a resend is allowed. Optional — older API builds omit it. */
    cooldownSec?: number;
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
    const requestBody: any = { channel, app: 'driver' };
    
    // Add phone to request body if provided
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      requestBody.phone = phone.trim();
    }
    // Only include userId if it's a valid non-empty string
    if (opts?.userId && typeof opts.userId === 'string' && opts.userId.trim().length > 0) {
      requestBody.userId = opts.userId.trim();
    }
    
    // Get headers (await the async function)
    const headers = await getHeaders();
    
    console.log('=== Driver API Request ===');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Phone parameter:', phone);
    console.log('Phone type:', typeof phone);
    console.log('Phone length:', phone?.length);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
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
    console.log('Content-Type:', response.headers.get('content-type'));

    const data = await parseResponseBody(response);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('API Error:', data);
      // `ApiError` carries `response.data`, which is where `PhoneRegistrationScreen`
      // reads the USER_NOT_REGISTERED payload from — and where the 60s cooldown puts
      // its `retryAfterSec`. The old non-JSON branch threw both of those away.
      throw new ApiError(response.status, data, `Failed to send OTP (${response.status})`);
    }

    return data;
  } catch (error: any) {
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
    const headers = await getHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.verifyOtp}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone, code, userId: opts?.userId, app: 'driver' }),
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
 * Get current driver info
 */
export const getCurrentUser = async (token: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const headers = await getHeaders(token);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.me}`,
      {
        method: 'GET',
        headers,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await parseResponseBody(response);

    if (!response.ok) {
      // Surface the HTTP status so callers can tell "account deleted / token
      // rejected" (401/403/404) apart from a network failure (OR-002).
      throw new ApiError(response.status, data, 'Failed to get user info');
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
    const headers = await getHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`,
      {
        method: 'POST',
        headers,
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
 * Logout driver
 */
export const logout = async (token: string, refreshToken: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const headers = await getHeaders(token);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.logout}`,
      {
        method: 'POST',
        headers,
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
