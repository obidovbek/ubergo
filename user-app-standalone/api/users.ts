/**
 * User API
 * Handles all user-related API requests
 */

import {
  API_BASE_URL,
  API_ENDPOINTS,
  getHeaders,
  API_TIMEOUT,
  ensureFreshAccessToken,
} from '../config/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * Fetch user profile
 */
export const getUserProfile = async (token: string): Promise<User> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.user.profile}`,
      {
        method: 'GET',
        headers: await getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  token: string,
  userData: UpdateUserData
): Promise<User> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.user.update}`,
      {
        method: 'PUT',
        headers: await getHeaders(token),
        body: JSON.stringify(userData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to update user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Upload user avatar
 */
export const uploadUserAvatar = async (
  token: string,
  imageUri: string
): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  
  // Extract filename from URI
  const filename = imageUri.split('/').pop() || 'avatar.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  // @ts-ignore - FormData typing issues with React Native
  formData.append('avatar', {
    uri: imageUri,
    name: filename,
    type,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    // T-038: the ONE call in the app that built its own Authorization header
    // instead of using `getHeaders`, so it was the one call the token refresh
    // would have missed. `Content-Type` still has to be set by hand here —
    // multipart, not JSON.
    const freshToken = await ensureFreshAccessToken(token);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.user.avatar}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freshToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to upload avatar: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

