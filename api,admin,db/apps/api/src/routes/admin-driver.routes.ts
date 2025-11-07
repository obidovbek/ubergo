/**
 * Admin Driver Routes
 * Routes for managing drivers
 */

import { Router } from 'express';
import { AdminDriverController } from '../controllers/AdminDriverController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { validatePagination } from '../middleware/validator.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get all drivers (users with role='driver')
router.get('/', validatePagination, AdminDriverController.getAll);

// Get driver by ID with all related data
router.get('/:id', AdminDriverController.getById);

// Update driver
router.put('/:id', AdminDriverController.update);

// Delete driver
router.delete('/:id', AdminDriverController.delete);

export default router;

