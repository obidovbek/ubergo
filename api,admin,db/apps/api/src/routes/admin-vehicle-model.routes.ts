/**
 * Admin Vehicle Model Routes
 * CRUD endpoints for managing vehicle models
 */

import { Router } from 'express';
import { AdminVehicleModelController } from '../controllers/AdminVehicleModelController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', AdminVehicleModelController.getAll);
router.get('/:id', AdminVehicleModelController.getById);
router.post('/', AdminVehicleModelController.create);
router.put('/:id', AdminVehicleModelController.update);
router.delete('/:id', AdminVehicleModelController.delete);

export default router;

