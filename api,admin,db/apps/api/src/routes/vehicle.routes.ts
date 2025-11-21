/**
 * Vehicle Routes
 * Public endpoints for fetching vehicle data (makes, models, body types, colors)
 */

import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController.js';

const router = Router();

// Get all active vehicle makes
router.get('/makes', VehicleController.getMakes);

// Get all active vehicle models (optionally filtered by make_id query param)
router.get('/models', VehicleController.getModels);

// Get all active vehicle body types
router.get('/body-types', VehicleController.getBodyTypes);

// Get all active vehicle colors
router.get('/colors', VehicleController.getColors);

// Get all active vehicle types
router.get('/types', VehicleController.getTypes);

export default router;

