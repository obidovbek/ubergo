/**
 * Notification Service
 * Business logic for notification operations
 */

import { Notification } from '../database/models/index.js';
import { AppError } from '../errors/AppError.js';
import { ErrorMessages } from '../constants/index.js';
import { Op } from 'sequelize';

/**
 * Event names that must NEVER be written to the durable notifications list.
 *
 * 🔒 `otp` carries a login code in its `data`. A code sitting in a list the user
 * (or anyone who reaches their session) can re-read defeats the point of it
 * being single-use and short-lived — the same reasoning that took codes out of
 * the server logs in T-034 and out of the foreground toast in T-046.
 */
const NEVER_PERSIST = new Set(['otp']);

export class NotificationService {
  /**
   * Record a push in the durable notifications list — T-045.
   *
   * 🔴 Before this, `createNotification` had exactly ONE caller in the whole API
   * (the signup welcome message). Every ride event — a driver offering, a
   * passenger cancelling, a booking confirmed — was fire-and-forget FCM, so a
   * missed push left **no trace anywhere** and the user was simply never told.
   *
   * ⚠️ THE `type` TRAP. Two different things share that key:
   *   - the push's `type` is an EVENT NAME (`driver_join_request`) and is what
   *     `routeForNotification` reads to decide where a tap goes — so it belongs
   *     inside `data`;
   *   - a row's `type` is a SEVERITY (`info|success|warning|error`) and only
   *     drives the icon.
   * Passing one as the other breaks the icon *and* the tap routing.
   *
   * ⚠️ NEVER THROWS. A notification is not worth failing a confirmed booking
   * over, and this runs inside ride-critical paths. Failures are logged and
   * swallowed, matching how `rejectRemainingDrivers` already treats its pushes.
   *
   * @returns true if a row was written.
   */
  static async recordPush(
    userId: number,
    notification: {
      type: string;
      title: string;
      body: string;
      data?: Record<string, any>;
    }
  ): Promise<boolean> {
    if (NEVER_PERSIST.has(notification.type)) return false;

    try {
      await this.createNotification(userId, {
        title: notification.title,
        // The list column is `message`; the push field is `body`.
        message: notification.body,
        // Severity, NOT the event name — see the trap above.
        type: 'info',
        // The event name goes here, where the apps' routing mapper reads it.
        // Spread first so an explicit `type` in the payload cannot overwrite it.
        data: { ...(notification.data || {}), type: notification.type },
      });
      return true;
    } catch (error) {
      console.error(
        `Failed to record notification for user ${userId} (${notification.type}):`,
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }

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

