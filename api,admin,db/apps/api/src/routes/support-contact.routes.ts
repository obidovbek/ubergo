/**
 * Support Contact Routes (Public)
 * Public endpoints for getting support contact information
 */

import { Router } from 'express';
import { SupportContactController } from '../controllers/SupportContactController.js';

const router = Router();

router.get('/', SupportContactController.get);

export default router;

