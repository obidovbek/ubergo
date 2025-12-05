/**
 * Admin Driver Offer Routes
 * Routes for admin moderation of driver offers
 */

import { Router } from 'express';
import { AdminDriverOfferController } from '../controllers/AdminDriverOfferController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = Router();

// All admin routes require admin authentication
router.use(authenticateAdmin);

// Get statistics
router.get('/statistics', AdminDriverOfferController.getStatistics);

// Get all offers with filters
router.get('/', AdminDriverOfferController.getOffers);

// Get offer by ID
router.get('/:id', AdminDriverOfferController.getOffer);

// Approve offer
router.patch('/:id/approve', AdminDriverOfferController.approveOffer);

// Reject offer
router.patch('/:id/reject', AdminDriverOfferController.rejectOffer);

export default router;

