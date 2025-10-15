/**
 * User Routes
 */

import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate, authorize } from '../middleware/auth';
import { validatePagination } from '../middleware/validator';
import { UserRole } from '../constants';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get(
  '/',
  authorize(UserRole.ADMIN),
  validatePagination,
  UserController.getUsers
);

// Get user by ID
router.get('/:id', UserController.getUserById);

// Update user (admin only)
router.put('/:id', authorize(UserRole.ADMIN), UserController.updateUser);

// Delete user (admin only)
router.delete('/:id', authorize(UserRole.ADMIN), UserController.deleteUser);

export default router;

