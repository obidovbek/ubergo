/**
 * Driver Routes
 * Routes for driver profile and registration
 */

import { Router } from 'express';
import { DriverController } from '../controllers/DriverController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All driver routes require authentication
router.use(authenticate);

// Get driver profile
router.get('/profile', DriverController.getProfile);

// Get driver profile status
router.get('/profile/status', DriverController.getProfileStatus);

// Registration steps
router.post('/profile/personal', DriverController.updatePersonalInfo);
router.post('/profile/passport', DriverController.updatePassport);
router.post('/profile/license', DriverController.updateLicense);
router.post('/profile/vehicle', DriverController.updateVehicle);
router.post('/profile/taxi-license', DriverController.updateTaxiLicense);

export default router;
