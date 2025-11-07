/**
 * Admin Country Controller
 * Handles admin CRUD operations for countries
 */

import type { Request, Response, NextFunction } from 'express';
import { AdminCountryService } from '../services/AdminCountryService.js';
import { successResponse } from '../utils/response.js';
import { SuccessMessages, HttpStatus } from '../constants/index.js';

export class AdminCountryController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = (req.query.includeInactive as string) === 'true';
      const countries = await AdminCountryService.getAll(includeInactive);
      successResponse(res, countries);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const country = await AdminCountryService.getById(id);
      successResponse(res, country);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const country = await AdminCountryService.create(req.body);
      successResponse(res, country, SuccessMessages.COUNTRY_CREATED, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const country = await AdminCountryService.update(id, req.body);
      successResponse(res, country, SuccessMessages.COUNTRY_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminCountryService.delete(id);
      successResponse(res, null, SuccessMessages.COUNTRY_DELETED);
    } catch (error) {
      next(error);
    }
  }
}

export default AdminCountryController;


