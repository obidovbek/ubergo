/**
 * Admin User Routes
 */

import { Router } from 'express';
import { AdminUserController } from '../controllers/AdminUserController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get all admin users
router.get('/', AdminUserController.getAll);

// Get admin user by ID
router.get('/:id', AdminUserController.getById);

// Create admin user
router.post('/', AdminUserController.create);

// Update admin user
router.put('/:id', AdminUserController.update);

// Delete admin user
router.delete('/:id', AdminUserController.delete);

export default router;

