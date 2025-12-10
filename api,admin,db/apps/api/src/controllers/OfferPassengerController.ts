/**
 * Offer Passenger Controller
 * Handles HTTP requests for passenger joins and driver confirmations
 */

import type { Request, Response, NextFunction } from 'express';
import { OfferPassengerService } from '../services/OfferPassengerService.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../errors/AppError.js';

export class OfferPassengerController {
  /**
   * POST /api/passenger/offers/:offerId/join
   * Passenger joins an offer
   */
  static async joinOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { offerId } = req.params;
      const { seats_requested, is_front_seat, message } = req.body;

      const passengerJoin = await OfferPassengerService.joinOffer(
        userId,
        {
          offer_id: parseInt(offerId),
          seats_requested,
          is_front_seat,
          message
        },
        req
      );

      return successResponse(res, { 
        passenger_join: passengerJoin,
        message: 'Join request sent successfully. Waiting for driver confirmation.' 
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/passenger/bookings/:id/cancel
   * Passenger cancels their join request
   */
  static async cancelJoin(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const passengerJoin = await OfferPassengerService.cancelJoin(userId, id, req);

      return successResponse(res, { 
        passenger_join: passengerJoin,
        message: 'Join request cancelled successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/passenger/bookings
   * Get passenger's bookings
   */
  static async getBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { status } = req.query;
      const bookings = await OfferPassengerService.getPassengerBookings(
        userId,
        status as any
      );

      return successResponse(res, { bookings });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/driver/offers/:offerId/passengers
   * Get passengers for an offer (driver view)
   */
  static async getOfferPassengers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { offerId } = req.params;
      const passengers = await OfferPassengerService.getOfferPassengers(
        userId,
        parseInt(offerId)
      );

      return successResponse(res, { passengers });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/passengers/:id/confirm
   * Driver confirms passenger join
   */
  static async confirmPassenger(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const passengerJoin = await OfferPassengerService.confirmPassenger(userId, id, req);

      return successResponse(res, { 
        passenger_join: passengerJoin,
        message: 'Passenger confirmed successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/passengers/:id/reject
   * Driver rejects passenger join
   */
  static async rejectPassenger(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const { rejection_reason } = req.body;
      const passengerJoin = await OfferPassengerService.rejectPassenger(
        userId,
        id,
        rejection_reason,
        req
      );

      return successResponse(res, { 
        passenger_join: passengerJoin,
        message: 'Passenger rejected successfully' 
      });
    } catch (error) {
      next(error);
    }
  }
}

