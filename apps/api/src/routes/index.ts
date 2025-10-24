/**
 * API Routes Index
 */

import { Router } from 'express';
import authRoutesV2 from './auth.routes.v2.js';
import userRoutes from './user.routes.js';

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

// User routes
router.use('/user', userRoutes);

// TODO: Add more route modules
// import rideRoutes from './ride.routes';
// import driverRoutes from './driver.routes';

// router.use('/rides', rideRoutes);
// router.use('/drivers', driverRoutes);

export default router;
