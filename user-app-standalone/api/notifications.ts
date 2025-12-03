/**
 * Notifications API
 * API functions for managing notifications
 */

import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  updated_at: string;
  data?: any;
}

export interface NotificationsResponse {
  success: boolean;
  message?: string;
  data: {
    data: Notification[];
    total?: number;
    unread?: number;
  };
}

/**
 * Get all notifications for the current user
 */
export const getNotifications = async (token: string): Promise<NotificationsResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.notifications.list}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch notifications');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  token: string,
  notificationId: string
): Promise<{ success: boolean }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.notifications.markRead(notificationId)}`,
      {
        method: 'PATCH',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to mark notification as read');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (
  token: string
): Promise<{ success: boolean }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.notifications.markAllRead}`,
      {
        method: 'PATCH',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to mark all notifications as read');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  token: string,
  notificationId: string
): Promise<{ success: boolean }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.notifications.delete(notificationId)}`,
      {
        method: 'DELETE',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete notification');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

