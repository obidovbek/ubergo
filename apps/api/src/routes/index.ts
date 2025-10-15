/**
 * API Routes Index
 */

import { Router } from 'express';

const router = Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'UberGo API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// TODO: Add route modules here
// import authRoutes from './auth.routes';
// import userRoutes from './user.routes';
// import rideRoutes from './ride.routes';
// import driverRoutes from './driver.routes';

// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/rides', rideRoutes);
// router.use('/drivers', driverRoutes);

export default router;
