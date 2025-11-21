/**
 * Admin Vehicle Type Controller
 * Handles admin CRUD operations for vehicle types
 */

import type { Request, Response, NextFunction } from 'express';
import { AdminVehicleTypeService } from '../services/AdminVehicleTypeService.js';
import { successResponse } from '../utils/response.js';
import { SuccessMessages, HttpStatus } from '../constants/index.js';

export class AdminVehicleTypeController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = (req.query.includeInactive as string) === 'true';
      const types = await AdminVehicleTypeService.getAll(includeInactive);
      successResponse(res, types);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const type = await AdminVehicleTypeService.getById(id);
      successResponse(res, type);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = await AdminVehicleTypeService.create(req.body);
      successResponse(res, type, SuccessMessages.COUNTRY_CREATED.replace('Country', 'Vehicle Type'), HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const type = await AdminVehicleTypeService.update(id, req.body);
      successResponse(res, type, SuccessMessages.COUNTRY_UPDATED.replace('Country', 'Vehicle Type'));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminVehicleTypeService.delete(id);
      successResponse(res, null, SuccessMessages.COUNTRY_DELETED.replace('Country', 'Vehicle Type'));
    } catch (error) {
      next(error);
    }
  }
}

export default AdminVehicleTypeController;

