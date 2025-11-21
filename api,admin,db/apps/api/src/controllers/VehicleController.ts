/**
 * Vehicle Controller
 * Public endpoints for vehicle data (makes, models, body types, colors)
 */

import type { Request, Response, NextFunction } from 'express';
import { AdminVehicleMakeService } from '../services/AdminVehicleMakeService.js';
import { AdminVehicleModelService } from '../services/AdminVehicleModelService.js';
import { AdminVehicleBodyTypeService } from '../services/AdminVehicleBodyTypeService.js';
import { AdminVehicleColorService } from '../services/AdminVehicleColorService.js';
import { AdminVehicleTypeService } from '../services/AdminVehicleTypeService.js';
import { successResponse } from '../utils/response.js';

export class VehicleController {
  /**
   * Get all active vehicle makes
   */
  static async getMakes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const makes = await AdminVehicleMakeService.getAll(false); // Only active
      successResponse(res, makes);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all active vehicle models (optionally filtered by make)
   */
  static async getModels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Support both make_id and makeId for compatibility
      const makeId = (req.query.make_id || req.query.makeId) as string | undefined;
      const models = await AdminVehicleModelService.getAll(false, makeId); // Only active
      successResponse(res, models);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all active vehicle body types
   */
  static async getBodyTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bodyTypes = await AdminVehicleBodyTypeService.getAll(false); // Only active
      successResponse(res, bodyTypes);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all active vehicle colors
   */
  static async getColors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const colors = await AdminVehicleColorService.getAll(false); // Only active
      successResponse(res, colors);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all active vehicle types
   */
  static async getTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await AdminVehicleTypeService.getAll(false); // Only active
      successResponse(res, types);
    } catch (error) {
      next(error);
    }
  }
}

export default VehicleController;

