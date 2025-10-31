/**
 * Upload Routes
 * Routes for file/image uploads
 */

import { Router } from 'express';
import { UploadController } from '../controllers/UploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// Upload image
router.post('/image', UploadController.uploadImage);

export default router;

