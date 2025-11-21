/**
 * Public Geo Routes
 * Read-only access to geo hierarchy data
 */

import { Router } from 'express';
import { GeoController } from '../controllers/GeoController.js';

const router = Router();

router.get('/countries', GeoController.getCountries);
router.get('/countries/:countryId/provinces', GeoController.getProvinces);
router.get('/provinces/:provinceId/city-districts', GeoController.getCityDistricts);
router.get(
  '/city-districts/:cityDistrictId/administrative-areas',
  GeoController.getAdministrativeAreas
);
router.get('/city-districts/:cityDistrictId/settlements', GeoController.getSettlements);
router.get('/city-districts/:cityDistrictId/neighborhoods', GeoController.getNeighborhoods);

export default router;


