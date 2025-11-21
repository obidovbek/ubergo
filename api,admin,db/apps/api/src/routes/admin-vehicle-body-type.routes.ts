/**
 * Admin Vehicle Body Type Routes
 * CRUD endpoints for managing vehicle body types
 */

import { Router } from 'express';
import { AdminVehicleBodyTypeController } from '../controllers/AdminVehicleBodyTypeController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', AdminVehicleBodyTypeController.getAll);
router.get('/:id', AdminVehicleBodyTypeController.getById);
router.post('/', AdminVehicleBodyTypeController.create);
router.put('/:id', AdminVehicleBodyTypeController.update);
router.delete('/:id', AdminVehicleBodyTypeController.delete);

export default router;

