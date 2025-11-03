import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export const registerDevice = async (
  token: string,
  body: { token: string; platform: 'android' | 'ios'; app?: 'user' | 'driver' }
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.devices.register}` ,{
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to register device');
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
};


