/**
 * Admin Vehicle Color Routes
 * CRUD endpoints for managing vehicle colors
 */

import { Router } from 'express';
import { AdminVehicleColorController } from '../controllers/AdminVehicleColorController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', AdminVehicleColorController.getAll);
router.get('/:id', AdminVehicleColorController.getById);
router.post('/', AdminVehicleColorController.create);
router.put('/:id', AdminVehicleColorController.update);
router.delete('/:id', AdminVehicleColorController.delete);

export default router;

