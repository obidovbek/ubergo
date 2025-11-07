/**
 * Admin Users API
 * Handles all admin user-related API requests
 */

import { API_BASE_URL, getHeaders, API_TIMEOUT } from '../config/api';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  name: string;
  roles: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    permissions?: string[] | null;
    is_active: boolean;
  }>;
  status: 'active' | 'inactive' | 'suspended';
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserListResponse {
  adminUsers: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateAdminUserData {
  email: string;
  password: string;
  full_name: string;
  role_slugs?: string[];
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UpdateAdminUserData {
  email?: string;
  password?: string;
  full_name?: string;
  role_slugs?: string[];
  status?: 'active' | 'inactive' | 'suspended';
}

/**
 * Fetch admin users list with pagination
 */
export const getAdminUsers = async (
  token: string,
  page: number = 1,
  pageSize: number = 25,
  filters?: { role?: string; status?: string }
): Promise<AdminUserListResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (filters?.role) {
      params.append('role', filters.role);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }

    const response = await fetch(
      `${API_BASE_URL}/admin/users?${params.toString()}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Admin foydalanuvchilarni yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get admin user by ID
 */
export const getAdminUserById = async (token: string, id: string): Promise<AdminUser> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${id}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Admin foydalanuvchini yuklashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Create new admin user
 */
export const createAdminUser = async (
  token: string,
  userData: CreateAdminUserData
): Promise<AdminUser> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/users`,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(userData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Admin foydalanuvchi yaratishda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Update admin user
 */
export const updateAdminUser = async (
  token: string,
  id: string,
  userData: UpdateAdminUserData
): Promise<AdminUser> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${id}`,
      {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(userData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Admin foydalanuvchini yangilashda xatolik';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Delete admin user
 */
export const deleteAdminUser = async (token: string, id: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${id}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Admin foydalanuvchini o\'chirishda xatolik';
      throw new Error(errorMessage);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

