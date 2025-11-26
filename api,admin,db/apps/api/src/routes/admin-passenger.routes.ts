/**
 * Admin Passenger Routes
 * Routes for managing regular users (passengers)
 */

import { Router } from 'express';
import { AdminPassengerController } from '../controllers/AdminPassengerController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { validatePagination } from '../middleware/validator.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get all passengers (users with role='user')
router.get('/', validatePagination, AdminPassengerController.getAll);

// Get passenger by ID with all related data
router.get('/:id', AdminPassengerController.getById);

// Update passenger
router.put('/:id', AdminPassengerController.update);

// Update passenger status
router.patch('/:id/status', AdminPassengerController.updateStatus);

// Delete passenger
router.delete('/:id', AdminPassengerController.delete);

export default router;

