/**
 * Offer Driver Routes
 * Routes for driver joins and passenger confirmations
 */

import { Router } from 'express';
import { OfferDriverController } from '../controllers/OfferDriverController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Driver routes (requires authentication)
router.post(
  '/driver/passenger-offers/:offerId/join',
  authenticate,
  OfferDriverController.joinOffer
);

router.post(
  '/driver/join-requests/:id/cancel',
  authenticate,
  OfferDriverController.cancelJoin
);

router.get(
  '/driver/join-requests',
  authenticate,
  OfferDriverController.getJoinRequests
);

// Passenger routes (requires authentication)
router.get(
  '/passenger/offers/:offerId/drivers',
  authenticate,
  OfferDriverController.getOfferDrivers
);

router.post(
  '/passenger/drivers/:id/confirm',
  authenticate,
  OfferDriverController.confirmDriver
);

router.post(
  '/passenger/drivers/:id/reject',
  authenticate,
  OfferDriverController.rejectDriver
);

export default router;



