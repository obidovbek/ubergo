/**
 * Passenger Offer Routes
 * Routes for passenger offer management
 */

import { Router } from 'express';
import { PassengerOfferController } from '../controllers/PassengerOfferController.js';
import { authenticate } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for offer creation and status changes
const offerActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each user to 20 requests per windowMs
  // An object, not a string: a string is sent as text/html and the apps parse
  // every error body as JSON, so they would lose the reason.
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Key on the user, not the IP. Uzbek mobile carriers put many subscribers
  // behind one NAT address, so an IP bucket would let one busy passenger lock
  // everyone on that carrier out of creating offers. `authenticate` runs first
  // (router.use above), so the user id is always there.
  keyGenerator: (req) => {
    const userId = (req as any).user?.userId;
    return userId !== undefined ? `user:${userId}` : `ip:${req.ip}`;
  },
});

// All passenger offer routes require authentication
router.use(authenticate);

// Get user's passenger offers
router.get('/', PassengerOfferController.getOffers);

// Get offer by ID
router.get('/:id', PassengerOfferController.getOffer);

// Create new passenger offer
router.post('/', offerActionLimiter, PassengerOfferController.createOffer);

// Update passenger offer
router.patch('/:id', PassengerOfferController.updateOffer);

// Status transitions
router.post('/:id/cancel', offerActionLimiter, PassengerOfferController.cancelOffer);
router.post('/:id/publish', offerActionLimiter, PassengerOfferController.publishOffer);
router.post('/:id/archive', PassengerOfferController.archiveOffer);
router.post('/:id/complete', PassengerOfferController.completeOffer);

// Delete offer
router.delete('/:id', PassengerOfferController.deleteOffer);

export default router;



