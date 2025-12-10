/**
 * Offer Passenger Routes
 * Routes for passenger joins and driver confirmations
 */

import { Router } from 'express';
import { OfferPassengerController } from '../controllers/OfferPassengerController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Passenger routes (requires authentication)
router.post(
  '/passenger/offers/:offerId/join',
  authenticate,
  OfferPassengerController.joinOffer
);

router.post(
  '/passenger/bookings/:id/cancel',
  authenticate,
  OfferPassengerController.cancelJoin
);

router.get(
  '/passenger/bookings',
  authenticate,
  OfferPassengerController.getBookings
);

// Driver routes (requires authentication)
router.get(
  '/driver/offers/:offerId/passengers',
  authenticate,
  OfferPassengerController.getOfferPassengers
);

router.post(
  '/driver/passengers/:id/confirm',
  authenticate,
  OfferPassengerController.confirmPassenger
);

router.post(
  '/driver/passengers/:id/reject',
  authenticate,
  OfferPassengerController.rejectPassenger
);

export default router;

