/**
 * Admin Geo Routes
 * CRUD endpoints for geo hierarchy management
 */

import { Router } from 'express';
import { AdminGeoController } from '../controllers/AdminGeoController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import {
  validateGeoCountryCreate,
  validateGeoCountryUpdate,
  validateGeoProvinceCreate,
  validateGeoProvinceUpdate,
  validateGeoCityDistrictCreate,
  validateGeoCityDistrictUpdate,
  validateGeoAdministrativeAreaCreate,
  validateGeoAdministrativeAreaUpdate,
  validateGeoSettlementCreate,
  validateGeoSettlementUpdate,
  validateGeoNeighborhoodCreate,
  validateGeoNeighborhoodUpdate,
} from '../middleware/validator.js';

const router = Router();

router.use(authenticateAdmin);

// Countries
router.get('/countries', AdminGeoController.listCountries);
router.get('/countries/:id', AdminGeoController.getCountry);
router.post('/countries', validateGeoCountryCreate, AdminGeoController.createCountry);
router.post('/countries/bulk-upload', AdminGeoController.bulkUploadCountries);
router.put('/countries/:id', validateGeoCountryUpdate, AdminGeoController.updateCountry);
router.delete('/countries/:id', AdminGeoController.deleteCountry);

// Provinces
router.get('/provinces', AdminGeoController.listProvinces);
router.get('/provinces/:id', AdminGeoController.getProvince);
router.post('/provinces', validateGeoProvinceCreate, AdminGeoController.createProvince);
router.post('/provinces/bulk-upload', AdminGeoController.bulkUploadProvinces);
router.put('/provinces/:id', validateGeoProvinceUpdate, AdminGeoController.updateProvince);
router.delete('/provinces/:id', AdminGeoController.deleteProvince);

// City Districts
router.get('/city-districts', AdminGeoController.listCityDistricts);
router.post('/city-districts', validateGeoCityDistrictCreate, AdminGeoController.createCityDistrict);
router.post('/city-districts/bulk-upload', AdminGeoController.bulkUploadCityDistricts);
router.put(
  '/city-districts/:id',
  validateGeoCityDistrictUpdate,
  AdminGeoController.updateCityDistrict
);
router.delete('/city-districts/:id', AdminGeoController.deleteCityDistrict);

// Administrative Areas
router.get('/administrative-areas', AdminGeoController.listAdministrativeAreas);
router.post(
  '/administrative-areas',
  validateGeoAdministrativeAreaCreate,
  AdminGeoController.createAdministrativeArea
);
router.post('/administrative-areas/bulk-upload', AdminGeoController.bulkUploadAdministrativeAreas);
router.put(
  '/administrative-areas/:id',
  validateGeoAdministrativeAreaUpdate,
  AdminGeoController.updateAdministrativeArea
);
router.delete('/administrative-areas/:id', AdminGeoController.deleteAdministrativeArea);

// Settlements
router.get('/settlements', AdminGeoController.listSettlements);
router.post('/settlements', validateGeoSettlementCreate, AdminGeoController.createSettlement);
router.post('/settlements/bulk-upload', AdminGeoController.bulkUploadSettlements);
router.put(
  '/settlements/:id',
  validateGeoSettlementUpdate,
  AdminGeoController.updateSettlement
);
router.delete('/settlements/:id', AdminGeoController.deleteSettlement);

// Neighborhoods
router.get('/neighborhoods', AdminGeoController.listNeighborhoods);
router.post(
  '/neighborhoods',
  validateGeoNeighborhoodCreate,
  AdminGeoController.createNeighborhood
);
router.post('/neighborhoods/bulk-upload', AdminGeoController.bulkUploadNeighborhoods);
router.put(
  '/neighborhoods/:id',
  validateGeoNeighborhoodUpdate,
  AdminGeoController.updateNeighborhood
);
router.delete('/neighborhoods/:id', AdminGeoController.deleteNeighborhood);

export default router;

