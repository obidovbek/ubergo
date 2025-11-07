/**
 * API Routes Index
 */

import { Router } from 'express';
import authRoutesV2 from './auth.routes.v2.js';
import adminAuthRoutes from './admin-auth.routes.js';
import adminUserRoutes from './admin-user.routes.js';
import adminPassengerRoutes from './admin-passenger.routes.js';
import adminDriverRoutes from './admin-driver.routes.js';
import adminCountryRoutes from './admin-country.routes.js';
import userRoutes from './user.routes.js';
import deviceRoutes from './device.routes.js';
import driverRoutes from './driver.routes.js';
import uploadRoutes from './upload.routes.js';
import countryRoutes from './country.routes.js';

const router = Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'UberGo API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (OTP + SSO)
router.use('/auth', authRoutesV2);

// Admin auth routes
router.use('/admin/auth', adminAuthRoutes);

// Admin user routes
// router.use('/admin/users', adminUserRoutes);

// // Admin passenger routes (regular users)
// router.use('/admin/passengers', adminPassengerRoutes);

// // Admin driver routes
// router.use('/admin/drivers', adminDriverRoutes);

// // Admin country routes
// router.use('/admin/countries', adminCountryRoutes);

// User routes
router.use('/user', userRoutes);

// Public country routes
router.use('/countries', countryRoutes);

// Device routes (push tokens)
router.use('/devices', deviceRoutes);

// Driver routes
router.use('/driver', driverRoutes);

// Upload routes
router.use('/upload', uploadRoutes);

// TODO: Add more route modules
// import rideRoutes from './ride.routes';
// router.use('/rides', rideRoutes);

export default router;
