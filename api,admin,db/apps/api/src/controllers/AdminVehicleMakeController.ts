/**
 * Admin Vehicle Make Controller
 * Handles admin CRUD operations for vehicle makes
 */

import type { Request, Response, NextFunction } from 'express';
import { AdminVehicleMakeService } from '../services/AdminVehicleMakeService.js';
import { successResponse } from '../utils/response.js';
import { SuccessMessages, HttpStatus } from '../constants/index.js';

export class AdminVehicleMakeController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = (req.query.includeInactive as string) === 'true';
      const makes = await AdminVehicleMakeService.getAll(includeInactive);
      successResponse(res, makes);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const make = await AdminVehicleMakeService.getById(id);
      successResponse(res, make);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const make = await AdminVehicleMakeService.create(req.body);
      successResponse(res, make, SuccessMessages.COUNTRY_CREATED.replace('Country', 'Vehicle Make'), HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const make = await AdminVehicleMakeService.update(id, req.body);
      successResponse(res, make, SuccessMessages.COUNTRY_UPDATED.replace('Country', 'Vehicle Make'));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminVehicleMakeService.delete(id);
      successResponse(res, null, SuccessMessages.COUNTRY_DELETED.replace('Country', 'Vehicle Make'));
    } catch (error) {
      next(error);
    }
  }
}

export default AdminVehicleMakeController;

