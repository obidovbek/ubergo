/**
 * Admin Vehicle Make Routes
 * CRUD endpoints for managing vehicle makes
 */

import { Router } from 'express';
import { AdminVehicleMakeController } from '../controllers/AdminVehicleMakeController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', AdminVehicleMakeController.getAll);
router.get('/:id', AdminVehicleMakeController.getById);
router.post('/', AdminVehicleMakeController.create);
router.put('/:id', AdminVehicleMakeController.update);
router.delete('/:id', AdminVehicleMakeController.delete);

export default router;

