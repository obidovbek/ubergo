/**
 * Notification Routes
 */

import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get all notifications for the current user
router.get('/', asyncHandler(NotificationController.getNotifications));

// Mark all notifications as read
router.patch('/read-all', asyncHandler(NotificationController.markAllAsRead));

// Mark a notification as read
router.patch('/:id/read', asyncHandler(NotificationController.markAsRead));

// Delete a notification
router.delete('/:id', asyncHandler(NotificationController.deleteNotification));

export default router;

