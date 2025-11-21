/**
 * Admin Vehicle Type Routes
 * CRUD endpoints for managing vehicle types
 */

import { Router } from 'express';
import { AdminVehicleTypeController } from '../controllers/AdminVehicleTypeController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', AdminVehicleTypeController.getAll);
router.get('/:id', AdminVehicleTypeController.getById);
router.post('/', AdminVehicleTypeController.create);
router.put('/:id', AdminVehicleTypeController.update);
router.delete('/:id', AdminVehicleTypeController.delete);

export default router;

