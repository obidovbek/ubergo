/**
 * Admin Vehicle Model Controller
 * Handles admin CRUD operations for vehicle models
 */

import type { Request, Response, NextFunction } from 'express';
import { AdminVehicleModelService } from '../services/AdminVehicleModelService.js';
import { successResponse } from '../utils/response.js';
import { SuccessMessages, HttpStatus } from '../constants/index.js';

export class AdminVehicleModelController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = (req.query.includeInactive as string) === 'true';
      const makeId = req.query.makeId as string | undefined;
      const models = await AdminVehicleModelService.getAll(includeInactive, makeId);
      successResponse(res, models);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const model = await AdminVehicleModelService.getById(id);
      successResponse(res, model);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const model = await AdminVehicleModelService.create(req.body);
      successResponse(res, model, SuccessMessages.COUNTRY_CREATED.replace('Country', 'Vehicle Model'), HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const model = await AdminVehicleModelService.update(id, req.body);
      successResponse(res, model, SuccessMessages.COUNTRY_UPDATED.replace('Country', 'Vehicle Model'));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminVehicleModelService.delete(id);
      successResponse(res, null, SuccessMessages.COUNTRY_DELETED.replace('Country', 'Vehicle Model'));
    } catch (error) {
      next(error);
    }
  }
}

export default AdminVehicleModelController;

