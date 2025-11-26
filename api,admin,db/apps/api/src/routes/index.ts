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
import geoRoutes from './geo.routes.js';
import adminGeoRoutes from './admin-geo.routes.js';
import adminVehicleMakeRoutes from './admin-vehicle-make.routes.js';
import adminVehicleModelRoutes from './admin-vehicle-model.routes.js';
import adminVehicleBodyTypeRoutes from './admin-vehicle-body-type.routes.js';
import adminVehicleColorRoutes from './admin-vehicle-color.routes.js';
import adminVehicleTypeRoutes from './admin-vehicle-type.routes.js';
import adminAppStoreUrlRoutes from './admin-app-store-url.routes.js';
import adminSupportContactRoutes from './admin-support-contact.routes.js';
import supportContactRoutes from './support-contact.routes.js';
import vehicleRoutes from './vehicle.routes.js';

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
router.use('/admin/users', adminUserRoutes);

// Admin passenger routes (regular users)
router.use('/admin/passengers', adminPassengerRoutes);

// Admin driver routes
router.use('/admin/drivers', adminDriverRoutes);

// Admin country routes
router.use('/admin/countries', adminCountryRoutes);

// Admin geo routes
router.use('/admin/geo', adminGeoRoutes);

// Admin vehicle routes
router.use('/admin/vehicle-types', adminVehicleTypeRoutes);
router.use('/admin/vehicle-makes', adminVehicleMakeRoutes);
router.use('/admin/vehicle-models', adminVehicleModelRoutes);
router.use('/admin/vehicle-body-types', adminVehicleBodyTypeRoutes);
router.use('/admin/vehicle-colors', adminVehicleColorRoutes);

// Admin app store URL routes
router.use('/admin/app-store-urls', adminAppStoreUrlRoutes);

// Admin support contact routes
router.use('/admin/support-contacts', adminSupportContactRoutes);

// User routes
router.use('/user', userRoutes);

// Public country routes
router.use('/countries', countryRoutes);

// Public geo routes
router.use('/geo', geoRoutes);

// Public vehicle routes
router.use('/vehicles', vehicleRoutes);

// Public support contact routes
router.use('/support-contacts', supportContactRoutes);

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
