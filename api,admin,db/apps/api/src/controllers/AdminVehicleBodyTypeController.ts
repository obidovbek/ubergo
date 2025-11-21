/**
 * Admin Vehicle Body Type Controller
 * Handles admin CRUD operations for vehicle body types
 */

import type { Request, Response, NextFunction } from 'express';
import { AdminVehicleBodyTypeService } from '../services/AdminVehicleBodyTypeService.js';
import { successResponse } from '../utils/response.js';
import { SuccessMessages, HttpStatus } from '../constants/index.js';

export class AdminVehicleBodyTypeController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = (req.query.includeInactive as string) === 'true';
      const bodyTypes = await AdminVehicleBodyTypeService.getAll(includeInactive);
      successResponse(res, bodyTypes);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bodyType = await AdminVehicleBodyTypeService.getById(id);
      successResponse(res, bodyType);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bodyType = await AdminVehicleBodyTypeService.create(req.body);
      successResponse(res, bodyType, SuccessMessages.COUNTRY_CREATED.replace('Country', 'Vehicle Body Type'), HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bodyType = await AdminVehicleBodyTypeService.update(id, req.body);
      successResponse(res, bodyType, SuccessMessages.COUNTRY_UPDATED.replace('Country', 'Vehicle Body Type'));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminVehicleBodyTypeService.delete(id);
      successResponse(res, null, SuccessMessages.COUNTRY_DELETED.replace('Country', 'Vehicle Body Type'));
    } catch (error) {
      next(error);
    }
  }
}

export default AdminVehicleBodyTypeController;

