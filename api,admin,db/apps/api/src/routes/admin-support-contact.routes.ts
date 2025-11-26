/**
 * Admin Support Contact Routes
 * Endpoints for managing support contact information
 */

import { Router } from 'express';
import { AdminSupportContactController } from '../controllers/AdminSupportContactController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', AdminSupportContactController.get);
router.get('/all', AdminSupportContactController.getAll);
router.put('/', AdminSupportContactController.update);

export default router;

