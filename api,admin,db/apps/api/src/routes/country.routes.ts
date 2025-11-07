/**
 * Country Routes
 * Public endpoints for fetching country metadata
 */

import { Router } from 'express';
import { CountryController } from '../controllers/CountryController.js';

const router = Router();

router.get('/', CountryController.list);

export default router;


