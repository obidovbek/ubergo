/**
 * Geo Controller
 * Provides public read-only access to geo hierarchy data.
 */

import type { Request, Response, NextFunction } from 'express';
import {
  GeoCountry,
  GeoProvince,
  GeoCityDistrict,
  GeoAdministrativeArea,
  GeoSettlement,
  GeoNeighborhood
} from '../database/models/index.js';
import { successResponse } from '../utils/response.js';

const toPlain = <T extends { toJSON(): object }>(records: T[]) =>
  records.map((record) => record.toJSON());

export class GeoController {
  static async getCountries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const countries = await GeoCountry.findAll({
        order: [['name', 'ASC']]
      });
      successResponse(res, toPlain(countries));
    } catch (error) {
      next(error);
    }
  }

  static async getProvinces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const countryId = Number(req.params.countryId);
      if (Number.isNaN(countryId)) {
        successResponse(res, []);
        return;
      }

      const provinces = await GeoProvince.findAll({
        where: { country_id: countryId },
        order: [['name', 'ASC']]
      });
      successResponse(res, toPlain(provinces));
    } catch (error) {
      next(error);
    }
  }

  static async getCityDistricts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provinceId = Number(req.params.provinceId);
      if (Number.isNaN(provinceId)) {
        successResponse(res, []);
        return;
      }

      const cityDistricts = await GeoCityDistrict.findAll({
        where: { province_id: provinceId },
        order: [['name', 'ASC']]
      });
      successResponse(res, toPlain(cityDistricts));
    } catch (error) {
      next(error);
    }
  }

  static async getAdministrativeAreas(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const cityDistrictId = Number(req.params.cityDistrictId);
      if (Number.isNaN(cityDistrictId)) {
        successResponse(res, []);
        return;
      }

      const administrativeAreas = await GeoAdministrativeArea.findAll({
        where: { city_district_id: cityDistrictId },
        order: [['name', 'ASC']]
      });
      successResponse(res, toPlain(administrativeAreas));
    } catch (error) {
      next(error);
    }
  }

  static async getSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cityDistrictId = Number(req.params.cityDistrictId);
      if (Number.isNaN(cityDistrictId)) {
        successResponse(res, []);
        return;
      }

      const settlements = await GeoSettlement.findAll({
        where: { city_district_id: cityDistrictId },
        order: [['name', 'ASC']]
      });
      successResponse(res, toPlain(settlements));
    } catch (error) {
      next(error);
    }
  }

  static async getNeighborhoods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cityDistrictId = Number(req.params.cityDistrictId);
      if (Number.isNaN(cityDistrictId)) {
        successResponse(res, []);
        return;
      }

      const neighborhoods = await GeoNeighborhood.findAll({
        where: { city_district_id: cityDistrictId },
        order: [['name', 'ASC']]
      });
      successResponse(res, toPlain(neighborhoods));
    } catch (error) {
      next(error);
    }
  }
}

export default GeoController;


