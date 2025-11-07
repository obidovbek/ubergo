/**
 * Admin Authentication Routes
 */

import { Router } from 'express';
import { AdminAuthController } from '../controllers/AdminAuthController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { validateAdminLogin, validateAdminRegister } from '../middleware/validator.js';

const router = Router();

// Public routes
router.post('/login', validateAdminLogin, AdminAuthController.login);

// Protected routes
router.post('/register', authenticateAdmin, validateAdminRegister, AdminAuthController.register);
router.get('/me', authenticateAdmin, AdminAuthController.getCurrentAdmin);
router.post('/logout', authenticateAdmin, AdminAuthController.logout);

export default router;

