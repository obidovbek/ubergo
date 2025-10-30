import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { registerDevice } from '../controllers/DeviceController.js';

const router = Router();

router.post('/register', authenticate, registerDevice);

export default router;


