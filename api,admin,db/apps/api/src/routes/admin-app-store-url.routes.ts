/**
 * Admin App Store URL Routes
 * Endpoints for managing app store URLs
 */

import { Router } from 'express';
import { AdminAppStoreUrlController } from '../controllers/AdminAppStoreUrlController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', AdminAppStoreUrlController.get);
router.put('/', AdminAppStoreUrlController.update);

export default router;

