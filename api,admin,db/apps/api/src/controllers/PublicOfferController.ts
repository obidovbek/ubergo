/**
 * Public Offer Controller
 * Handles HTTP requests for public driver offers (passenger view)
 */

import type { Request, Response, NextFunction } from 'express';
import { DriverOfferService } from '../services/DriverOfferService.js';
import { successResponse } from '../utils/response.js';

export class PublicOfferController {
  /**
   * GET /api/public/driver-offers
   * Get published offers for passengers
   */
  static async getOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const { from_text, to_text, date, limit, offset } = req.query;

      const filters: any = {};
      if (from_text) {
        filters.from_text = from_text as string;
      }
      if (to_text) {
        filters.to_text = to_text as string;
      }
      if (date) {
        filters.date = date as string;
      }
      if (limit) {
        filters.limit = parseInt(limit as string);
      }
      if (offset) {
        filters.offset = parseInt(offset as string);
      }

      const result = await DriverOfferService.getPublicOffers(filters);

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/public/driver-offers/:id
   * Get offer details
   */
  static async getOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const offer = await DriverOfferService.getOfferById(id);

      // Only return published offers
      if (offer.status !== 'published') {
        return successResponse(res, { offer: null, message: 'Offer not available' }, 404);
      }

      return successResponse(res, { offer });
    } catch (error) {
      next(error);
    }
  }
}

