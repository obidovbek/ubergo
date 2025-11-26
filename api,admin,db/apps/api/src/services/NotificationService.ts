/**
 * Notification Service
 * Business logic for notification operations
 */

import { Notification } from '../database/models/index.js';
import { AppError } from '../errors/AppError.js';
import { ErrorMessages } from '../constants/index.js';
import { Op } from 'sequelize';

export class NotificationService {
  /**
   * Get all notifications for a user
   */
  static async getNotifications(
    userId: number,
    options?: { read?: boolean; limit?: number; offset?: number }
  ): Promise<{ notifications: Notification[]; total: number; unread: number }> {
    const where: any = { user_id: userId };

    if (options?.read !== undefined) {
      where.read = options.read;
    }

    const { count: total, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: options?.limit || 50,
      offset: options?.offset || 0
    });

    // Get unread count
    const unreadCount = await Notification.count({
      where: {
        user_id: userId,
        read: false
      }
    });

    return {
      notifications,
      total,
      unread: unreadCount
    };
  }

  /**
   * Get a notification by ID
   */
  static async getNotificationById(notificationId: number, userId: number): Promise<Notification> {
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        user_id: userId
      }
    });

    if (!notification) {
      throw new AppError(ErrorMessages.NOT_FOUND, 404);
    }

    return notification;
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: number, userId: number): Promise<Notification> {
    const notification = await this.getNotificationById(notificationId, userId);

    notification.read = true;
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: number): Promise<number> {
    const [affectedRows] = await Notification.update(
      { read: true },
      {
        where: {
          user_id: userId,
          read: false
        }
      }
    );

    return affectedRows;
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: number, userId: number): Promise<void> {
    const notification = await this.getNotificationById(notificationId, userId);
    await notification.destroy();
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(userId: number): Promise<number> {
    const deletedCount = await Notification.destroy({
      where: {
        user_id: userId
      }
    });

    return deletedCount;
  }

  /**
   * Create a notification
   */
  static async createNotification(
    userId: number,
    data: {
      title: string;
      message: string;
      type?: 'info' | 'success' | 'warning' | 'error';
      data?: Record<string, any>;
    }
  ): Promise<Notification> {
    const notification = await Notification.create({
      user_id: userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      read: false,
      data: data.data || null
    });

    return notification;
  }
}

