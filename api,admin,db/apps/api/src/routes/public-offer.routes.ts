/**
 * Public Offer Routes
 * Routes for public driver offers (passenger view)
 */

import { Router } from 'express';
import { PublicOfferController } from '../controllers/PublicOfferController.js';

const router = Router();

// Public routes (no authentication required)

// Get published offers
router.get('/', PublicOfferController.getOffers);

// Get offer details
router.get('/:id', PublicOfferController.getOffer);

export default router;

