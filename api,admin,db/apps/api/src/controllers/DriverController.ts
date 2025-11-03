/**
 * Driver Controller
 * Handles HTTP requests for driver registration and profile
 */

import type { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/DriverService.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../errors/AppError.js';

export class DriverController {
  /**
   * GET /api/driver/profile
   * Get driver profile with all related data
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const profile = await DriverService.getDriverProfile(userId);

      return successResponse(res, {
        profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/driver/profile/status
   * Get driver profile registration status
   */
  static async getProfileStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const status = await DriverService.getDriverProfileStatus(userId);

      return successResponse(res, status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/profile/personal
   * Create or update personal information (Step 1)
   */
  static async updatePersonalInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const profile = await DriverService.upsertDriverProfile(userId, req.body);

      return successResponse(res, {
        profile,
        message: 'Personal information saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/profile/passport
   * Create or update passport information (Step 2)
   */
  static async updatePassport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const passport = await DriverService.upsertDriverPassport(userId, req.body);

      return successResponse(res, {
        passport,
        message: 'Passport information saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/profile/license
   * Create or update license and emergency contacts (Step 3)
   */
  static async updateLicense(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const result = await DriverService.upsertDriverLicense(userId, req.body);

      return successResponse(res, {
        ...result,
        message: 'License information saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/profile/vehicle
   * Create or update vehicle information (Step 4)
   */
  static async updateVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const vehicle = await DriverService.upsertDriverVehicle(userId, req.body);

      return successResponse(res, {
        vehicle,
        message: 'Vehicle information saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/profile/taxi-license
   * Create or update taxi license (Step 5)
   */
  static async updateTaxiLicense(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const taxiLicense = await DriverService.upsertDriverTaxiLicense(userId, req.body);

      return successResponse(res, {
        taxiLicense,
        message: 'Taxi license information saved successfully. Registration complete!'
      });
    } catch (error) {
      next(error);
    }
  }
}

