/**
 * Admin Geo Controller
 * Handles admin CRUD operations for geo hierarchy
 */

import type { Request, Response, NextFunction } from 'express';
import { AdminGeoService } from '../services/AdminGeoService.js';
import { successResponse } from '../utils/response.js';
import { SuccessMessages } from '../constants/index.js';

const parseId = (value: string): number => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error('Invalid identifier');
  }
  return parsed;
};

export class AdminGeoController {
  /* Countries */
  static async listCountries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 25;
      const result = await AdminGeoService.listCountries(page, pageSize);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getCountry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      const country = await AdminGeoService.getCountry(id);
      successResponse(res, country);
    } catch (error) {
      next(error);
    }
  }

  static async createCountry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const country = await AdminGeoService.createCountry(req.body);
      successResponse(res, country, SuccessMessages.GEO_COUNTRY_CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async updateCountry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      const country = await AdminGeoService.updateCountry(id, req.body);
      successResponse(res, country, SuccessMessages.GEO_COUNTRY_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCountry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      await AdminGeoService.deleteCountry(id);
      successResponse(res, null, SuccessMessages.GEO_COUNTRY_DELETED);
    } catch (error) {
      next(error);
    }
  }

  /* Provinces */
  static async listProvinces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const countryId = req.query.countryId ? Number(req.query.countryId) : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 25;
      const result = await AdminGeoService.listProvinces(
        countryId !== undefined && !Number.isNaN(countryId) ? countryId : undefined,
        page,
        pageSize
      );
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getProvince(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      const province = await AdminGeoService.getProvince(id);
      successResponse(res, province);
    } catch (error) {
      next(error);
    }
  }

  static async createProvince(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const province = await AdminGeoService.createProvince({
        ...req.body,
        country_id: Number(req.body.country_id),
      });
      successResponse(res, province, SuccessMessages.GEO_PROVINCE_CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async updateProvince(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      const province = await AdminGeoService.updateProvince(id, {
        ...req.body,
        country_id:
          req.body.country_id !== undefined ? Number(req.body.country_id) : undefined,
      });
      successResponse(res, province, SuccessMessages.GEO_PROVINCE_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProvince(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      await AdminGeoService.deleteProvince(id);
      successResponse(res, null, SuccessMessages.GEO_PROVINCE_DELETED);
    } catch (error) {
      next(error);
    }
  }

  /* City Districts */
  static async listCityDistricts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provinceId = req.query.provinceId ? Number(req.query.provinceId) : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 25;
      const result = await AdminGeoService.listCityDistricts(
        provinceId !== undefined && !Number.isNaN(provinceId) ? provinceId : undefined,
        page,
        pageSize
      );
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createCityDistrict(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const district = await AdminGeoService.createCityDistrict({
        ...req.body,
        province_id: Number(req.body.province_id),
      });
      successResponse(res, district, SuccessMessages.GEO_CITY_DISTRICT_CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async updateCityDistrict(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      const district = await AdminGeoService.updateCityDistrict(id, {
        ...req.body,
        province_id:
          req.body.province_id !== undefined ? Number(req.body.province_id) : undefined,
      });
      successResponse(res, district, SuccessMessages.GEO_CITY_DISTRICT_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCityDistrict(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      await AdminGeoService.deleteCityDistrict(id);
      successResponse(res, null, SuccessMessages.GEO_CITY_DISTRICT_DELETED);
    } catch (error) {
      next(error);
    }
  }

  /* Administrative Areas */
  static async listAdministrativeAreas(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const cityDistrictId = req.query.cityDistrictId
        ? Number(req.query.cityDistrictId)
        : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 25;
      const result = await AdminGeoService.listAdministrativeAreas(
        cityDistrictId !== undefined && !Number.isNaN(cityDistrictId)
          ? cityDistrictId
          : undefined,
        page,
        pageSize
      );
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createAdministrativeArea(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const area = await AdminGeoService.createAdministrativeArea({
        ...req.body,
        city_district_id: Number(req.body.city_district_id),
      });
      successResponse(res, area, SuccessMessages.GEO_ADMIN_AREA_CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async updateAdministrativeArea(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseId(req.params.id);
      const area = await AdminGeoService.updateAdministrativeArea(id, {
        ...req.body,
        city_district_id:
          req.body.city_district_id !== undefined
            ? Number(req.body.city_district_id)
            : undefined,
      });
      successResponse(res, area, SuccessMessages.GEO_ADMIN_AREA_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAdministrativeArea(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseId(req.params.id);
      await AdminGeoService.deleteAdministrativeArea(id);
      successResponse(res, null, SuccessMessages.GEO_ADMIN_AREA_DELETED);
    } catch (error) {
      next(error);
    }
  }

  /* Settlements */
  static async listSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cityDistrictId = req.query.cityDistrictId
        ? Number(req.query.cityDistrictId)
        : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 25;
      const result = await AdminGeoService.listSettlements(
        cityDistrictId !== undefined && !Number.isNaN(cityDistrictId)
          ? cityDistrictId
          : undefined,
        page,
        pageSize
      );
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settlement = await AdminGeoService.createSettlement({
        ...req.body,
        city_district_id: Number(req.body.city_district_id),
      });
      successResponse(res, settlement, SuccessMessages.GEO_SETTLEMENT_CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async updateSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      const settlement = await AdminGeoService.updateSettlement(id, {
        ...req.body,
        city_district_id:
          req.body.city_district_id !== undefined
            ? Number(req.body.city_district_id)
            : undefined,
      });
      successResponse(res, settlement, SuccessMessages.GEO_SETTLEMENT_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  static async deleteSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      await AdminGeoService.deleteSettlement(id);
      successResponse(res, null, SuccessMessages.GEO_SETTLEMENT_DELETED);
    } catch (error) {
      next(error);
    }
  }

  /* Neighborhoods */
  static async listNeighborhoods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cityDistrictId = req.query.cityDistrictId
        ? Number(req.query.cityDistrictId)
        : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 25;
      const result = await AdminGeoService.listNeighborhoods(
        cityDistrictId !== undefined && !Number.isNaN(cityDistrictId)
          ? cityDistrictId
          : undefined,
        page,
        pageSize
      );
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createNeighborhood(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const neighborhood = await AdminGeoService.createNeighborhood({
        ...req.body,
        city_district_id: Number(req.body.city_district_id),
      });
      successResponse(res, neighborhood, SuccessMessages.GEO_NEIGHBORHOOD_CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async updateNeighborhood(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      const neighborhood = await AdminGeoService.updateNeighborhood(id, {
        ...req.body,
        city_district_id:
          req.body.city_district_id !== undefined
            ? Number(req.body.city_district_id)
            : undefined,
      });
      successResponse(res, neighborhood, SuccessMessages.GEO_NEIGHBORHOOD_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  static async deleteNeighborhood(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseId(req.params.id);
      await AdminGeoService.deleteNeighborhood(id);
      successResponse(res, null, SuccessMessages.GEO_NEIGHBORHOOD_DELETED);
    } catch (error) {
      next(error);
    }
  }

  /* Bulk Upload Methods */
  static async bulkUploadCountries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminGeoService.bulkUploadCountries(req.body.data);
      successResponse(res, result, 'Countries uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async bulkUploadProvinces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminGeoService.bulkUploadProvinces(req.body.data);
      successResponse(res, result, 'Provinces uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async bulkUploadCityDistricts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminGeoService.bulkUploadCityDistricts(req.body.data);
      successResponse(res, result, 'City districts uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async bulkUploadAdministrativeAreas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminGeoService.bulkUploadAdministrativeAreas(req.body.data);
      successResponse(res, result, 'Administrative areas uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async bulkUploadSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminGeoService.bulkUploadSettlements(req.body.data);
      successResponse(res, result, 'Settlements uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async bulkUploadNeighborhoods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminGeoService.bulkUploadNeighborhoods(req.body.data);
      successResponse(res, result, 'Neighborhoods uploaded successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default AdminGeoController;

