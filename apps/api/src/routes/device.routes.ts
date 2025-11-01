import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { registerDevice } from '../controllers/DeviceController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.post('/register', authenticate, asyncHandler(registerDevice));

export default router;


