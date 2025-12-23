/**
 * Public Passenger Offer Controller
 * Handles public browsing of passenger offers (for drivers)
 */

import type { Request, Response, NextFunction } from 'express';
import { PassengerOfferService } from '../services/PassengerOfferService.js';
import { successResponse } from '../utils/response.js';

export class PublicPassengerOfferController {
  /**
   * GET /api/public/passenger-offers
   * Get public passenger offers with filters (for drivers to browse)
   */
  static async getPublicOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        from_text,
        to_text,
        date,
        min_seats,
        max_price,
        sort_by,
        limit,
        offset
      } = req.query;

      const filters: any = {};
      
      if (from_text) filters.from_text = from_text as string;
      if (to_text) filters.to_text = to_text as string;
      if (date) filters.date = date as string;
      if (min_seats) filters.min_seats = parseInt(min_seats as string);
      if (max_price) filters.max_price = parseFloat(max_price as string);
      if (sort_by) filters.sort_by = sort_by as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const result = await PassengerOfferService.getPublicOffers(filters);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/public/passenger-offers/:id
   * Get single passenger offer by ID (public view)
   */
  static async getPublicOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const offer = await PassengerOfferService.getOfferById(id);

      return successResponse(res, { offer });
    } catch (error) {
      next(error);
    }
  }
}



