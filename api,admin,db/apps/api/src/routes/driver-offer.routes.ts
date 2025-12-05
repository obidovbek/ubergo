/**
 * Driver Offer Routes
 * Routes for driver offer management
 */

import { Router } from 'express';
import { DriverOfferController } from '../controllers/DriverOfferController.js';
import { authenticate } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for offer creation and status changes
const offerActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each user to 20 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// All driver offer routes require authentication
router.use(authenticate);

// Get user's offers
router.get('/', DriverOfferController.getOffers);

// Get offer by ID
router.get('/:id', DriverOfferController.getOffer);

// Create new offer
router.post('/', offerActionLimiter, DriverOfferController.createOffer);

// Update offer
router.patch('/:id', DriverOfferController.updateOffer);

// Status transitions
router.post('/:id/cancel', offerActionLimiter, DriverOfferController.cancelOffer);
router.post('/:id/publish', offerActionLimiter, DriverOfferController.publishOffer);
router.post('/:id/archive', DriverOfferController.archiveOffer);

// Delete offer
router.delete('/:id', DriverOfferController.deleteOffer);

export default router;

