/**
 * Driver Routes
 * Routes for driver profile and registration
 */

import { Router } from 'express';
import { DriverController } from '../controllers/DriverController.js';
import { authenticate } from '../middleware/auth.js';
import {
  personalInfoValidation,
  passportValidation,
  licenseValidation,
  vehicleValidation,
  taxiLicenseValidation
} from '../middleware/validator.js';

const router = Router();

// All driver routes require authentication
router.use(authenticate);

// Get driver profile
router.get('/profile', DriverController.getProfile);

// Get driver profile status
router.get('/profile/status', DriverController.getProfileStatus);

// Registration steps
//
// T-063 (2026-08-13): all five are validated now. T-061 mounted only the
// passport step and left the other four off on purpose, because switching them
// on as written would have started rejecting payloads the shipped app sends
// happily — `personalInfoValidation` demanded `father_name` and `birth_date`,
// for which `DriverPersonalInfoScreen` has no rule at all, and the licence and
// plate minimums were stricter here than in the app.
//
// 🔴 Each was reconciled against its real screen BEFORE being mounted, on one
// rule: **the server must never refuse what the app accepted.** At this layer
// it is a backstop against a direct API call, not a second, stricter UX. The
// mismatches were relaxed in `middleware/validator.ts`, where each is
// commented with the screen it was checked against.
//
// `passportValidation` is unchanged: PINFL of exactly 14 digits, which nothing
// else in the stack enforces — the column is TEXT and the app's own check is
// erased before submit.
router.post('/profile/personal', personalInfoValidation, DriverController.updatePersonalInfo);
router.post('/profile/passport', passportValidation, DriverController.updatePassport);
router.post('/profile/license', licenseValidation, DriverController.updateLicense);
router.post('/profile/vehicle', vehicleValidation, DriverController.updateVehicle);
router.post('/profile/taxi-license', taxiLicenseValidation, DriverController.updateTaxiLicense);

export default router;
