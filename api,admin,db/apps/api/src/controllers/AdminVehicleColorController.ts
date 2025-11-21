/**
 * Admin Vehicle Color Controller
 * Handles admin CRUD operations for vehicle colors
 */

import type { Request, Response, NextFunction } from 'express';
import { AdminVehicleColorService } from '../services/AdminVehicleColorService.js';
import { successResponse } from '../utils/response.js';
import { SuccessMessages, HttpStatus } from '../constants/index.js';

export class AdminVehicleColorController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = (req.query.includeInactive as string) === 'true';
      const colors = await AdminVehicleColorService.getAll(includeInactive);
      successResponse(res, colors);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const color = await AdminVehicleColorService.getById(id);
      successResponse(res, color);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const color = await AdminVehicleColorService.create(req.body);
      successResponse(res, color, SuccessMessages.COUNTRY_CREATED.replace('Country', 'Vehicle Color'), HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const color = await AdminVehicleColorService.update(id, req.body);
      successResponse(res, color, SuccessMessages.COUNTRY_UPDATED.replace('Country', 'Vehicle Color'));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminVehicleColorService.delete(id);
      successResponse(res, null, SuccessMessages.COUNTRY_DELETED.replace('Country', 'Vehicle Color'));
    } catch (error) {
      next(error);
    }
  }
}

export default AdminVehicleColorController;

