/**
 * Driver Rating Routes
 * Routes for passenger ratings of drivers
 */

import { Router } from 'express';
import { DriverRatingController } from '../controllers/DriverRatingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Passenger routes (requires authentication)

// Create a rating for a completed ride
router.post(
  '/bookings/:bookingId/rate',
  authenticate,
  DriverRatingController.createRating
);

// Get passenger's given ratings
router.get(
  '/my-ratings',
  authenticate,
  DriverRatingController.getMyRatings
);

// Driver routes (requires authentication)

// Get driver's received ratings
router.get(
  '/driver/ratings',
  authenticate,
  DriverRatingController.getDriverRatings
);

// Get driver's average rating
router.get(
  '/driver/rating-summary',
  authenticate,
  DriverRatingController.getDriverRatingSummary
);

// Public routes

// Get public driver rating summary (by driver ID)
router.get(
  '/drivers/:driverId/rating-summary',
  DriverRatingController.getPublicDriverRatingSummary
);

export default router;

