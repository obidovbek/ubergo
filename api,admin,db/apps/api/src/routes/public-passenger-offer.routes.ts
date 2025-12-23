/**
 * Public Passenger Offer Routes
 * Public routes for browsing passenger offers (for drivers)
 */

import { Router } from 'express';
import { PublicPassengerOfferController } from '../controllers/PublicPassengerOfferController.js';

const router = Router();

// Get all public passenger offers with filters
router.get('/', PublicPassengerOfferController.getPublicOffers);

// Get single passenger offer by ID
router.get('/:id', PublicPassengerOfferController.getPublicOffer);

export default router;



