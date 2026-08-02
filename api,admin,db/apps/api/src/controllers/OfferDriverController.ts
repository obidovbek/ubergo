/**
 * Offer Driver Controller
 * Handles HTTP requests for driver joins and passenger confirmations
 */

import type { Request, Response, NextFunction } from 'express';
import { OfferDriverService } from '../services/OfferDriverService.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../errors/AppError.js';

export class OfferDriverController {
  /**
   * POST /api/driver/passenger-offers/:offerId/join
   * Driver joins a passenger offer
   */
  static async joinOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { offerId } = req.params;
      const { vehicle_id, seats_offered, offered_price_per_seat, message } = req.body;

      // parseInt('abc') is NaN, which reached Postgres as an integer and came
      // back as a 500 instead of a 400.
      const parsedOfferId = Number(offerId);
      if (!Number.isInteger(parsedOfferId) || parsedOfferId <= 0) {
        throw new AppError('Invalid offer id', 400);
      }

      const driverJoin = await OfferDriverService.joinOffer(
        userId,
        {
          offer_id: parsedOfferId,
          vehicle_id,
          seats_offered,
          offered_price_per_seat,
          message
        },
        req
      );

      return successResponse(
        res,
        { driver_join: driverJoin },
        'Join request sent successfully. Waiting for passenger confirmation.',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/join-requests/:id/cancel
   * Driver cancels their join request
   */
  static async cancelJoin(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const driverJoin = await OfferDriverService.cancelJoin(userId, id, req);

      return successResponse(res, { 
        driver_join: driverJoin,
        message: 'Join request cancelled successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/driver/join-requests
   * Get driver's join requests
   */
  static async getJoinRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { status } = req.query;
      const joinRequests = await OfferDriverService.getDriverJoinRequests(
        userId,
        status as any
      );

      return successResponse(res, { join_requests: joinRequests });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/passenger/offers/:offerId/drivers
   * Get drivers for a passenger offer (passenger view)
   */
  static async getOfferDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { offerId } = req.params;
      const parsedOfferId = Number(offerId);
      if (!Number.isInteger(parsedOfferId) || parsedOfferId <= 0) {
        throw new AppError('Invalid offer id', 400);
      }

      const drivers = await OfferDriverService.getOfferDrivers(userId, parsedOfferId, req);

      return successResponse(res, { drivers });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/passenger/drivers/:id/confirm
   * Passenger confirms driver join
   */
  static async confirmDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const driverJoin = await OfferDriverService.confirmDriver(userId, id, req);

      return successResponse(res, { 
        driver_join: driverJoin,
        message: 'Driver confirmed successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/passenger/drivers/:id/reject
   * Passenger rejects driver join
   */
  static async rejectDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const { rejection_reason } = req.body;
      const driverJoin = await OfferDriverService.rejectDriver(
        userId,
        id,
        rejection_reason,
        req
      );

      return successResponse(res, { 
        driver_join: driverJoin,
        message: 'Driver rejected successfully' 
      });
    } catch (error) {
      next(error);
    }
  }
}



