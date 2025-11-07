/**
 * Admin Country Routes
 * CRUD endpoints for managing countries
 */

import { Router } from 'express';
import { AdminCountryController } from '../controllers/AdminCountryController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { validateCountryCreate, validateCountryUpdate } from '../middleware/validator.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/', AdminCountryController.getAll);
router.get('/:id', AdminCountryController.getById);
router.post('/', validateCountryCreate, AdminCountryController.create);
router.put('/:id', validateCountryUpdate, AdminCountryController.update);
router.delete('/:id', AdminCountryController.delete);

export default router;


