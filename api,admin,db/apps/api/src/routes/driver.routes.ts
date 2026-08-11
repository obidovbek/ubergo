/**
 * Driver Routes
 * Routes for driver profile and registration
 */

import { Router } from 'express';
import { DriverController } from '../controllers/DriverController.js';
import { authenticate } from '../middleware/auth.js';
import { passportValidation } from '../middleware/validator.js';

const router = Router();

// All driver routes require authentication
router.use(authenticate);

// Get driver profile
router.get('/profile', DriverController.getProfile);

// Get driver profile status
router.get('/profile/status', DriverController.getProfileStatus);

// Registration steps
//
// T-061: only the passport step is validated here, and that is deliberate.
// `personalInfoValidation`, `licenseValidation`, `vehicleValidation` and
// `taxiLicenseValidation` exist in `middleware/validator.ts` and are mounted
// NOWHERE — switching them all on at once would start rejecting payloads the
// apps send happily today (`personalInfoValidation` demands `father_name`,
// which the app treats as optional). They are T-063: one at a time, each
// proved against its real payload first.
//
// `passportValidation` is the one the owner asked for: it enforces a PINFL of
// exactly 14 digits, which nothing else in the stack does — the column is TEXT
// and the app's own 14-digit check is erased before submit.
router.post('/profile/personal', DriverController.updatePersonalInfo);
router.post('/profile/passport', passportValidation, DriverController.updatePassport);
router.post('/profile/license', DriverController.updateLicense);
router.post('/profile/vehicle', DriverController.updateVehicle);
router.post('/profile/taxi-license', DriverController.updateTaxiLicense);

export default router;
