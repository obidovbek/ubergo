/**
 * Notification Controller
 * Handles HTTP requests for notification operations
 */

import type { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/NotificationService.js';
import { successResponse } from '../utils/response.js';
import { HttpStatus } from '../constants/index.js';

export class NotificationController {
  /**
   * Get all notifications for the current user
   * GET /api/notifications
   */
  static async getNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return next(new Error('User ID not found'));
      }

      const read = req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { notifications, total, unread } = await NotificationService.getNotifications(
        userId,
        { read, limit, offset }
      );

      successResponse(
        res,
        {
          data: notifications.map(n => ({
            id: n.id.toString(),
            title: n.title,
            message: n.message,
            type: n.type,
            read: n.read,
            created_at: n.created_at.toISOString(),
            updated_at: n.updated_at.toISOString(),
            data: n.data
          })),
          total,
          unread
        },
        undefined,
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a notification as read
   * PATCH /api/notifications/:id/read
   */
  static async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return next(new Error('User ID not found'));
      }

      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return next(new Error('Invalid notification ID'));
      }

      await NotificationService.markAsRead(notificationId, userId);

      successResponse(
        res,
        { success: true },
        'Notification marked as read',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/read-all
   */
  static async markAllAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return next(new Error('User ID not found'));
      }

      const affectedRows = await NotificationService.markAllAsRead(userId);

      successResponse(
        res,
        { success: true, affected: affectedRows },
        'All notifications marked as read',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  static async deleteNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return next(new Error('User ID not found'));
      }

      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return next(new Error('Invalid notification ID'));
      }

      await NotificationService.deleteNotification(notificationId, userId);

      successResponse(
        res,
        { success: true },
        'Notification deleted',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }
}

