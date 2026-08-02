/**
 * Public Offer Controller
 * Handles HTTP requests for public driver offers (passenger view)
 */

import type { Request, Response, NextFunction } from 'express';
import { DriverOfferService } from '../services/DriverOfferService.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../errors/AppError.js';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { t } from '../i18n/translator.js';

export class PublicOfferController {
  /**
   * GET /api/public/driver-offers
   * Get published offers for passengers
   */
  static async getOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        from_text, 
        to_text, 
        date, 
        from_province_id, 
        from_city_id, 
        to_province_id, 
        to_city_id,
        // New filter parameters
        min_rating,
        max_price,
        min_price,
        vehicle_type,
        vehicle_make,
        vehicle_color,
        sort_by, // price_asc, price_desc, rating_desc, date_asc
        limit, 
        offset 
      } = req.query;

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
      if (from_province_id) {
        filters.from_province_id = parseInt(from_province_id as string);
      }
      if (from_city_id) {
        filters.from_city_id = parseInt(from_city_id as string);
      }
      if (to_province_id) {
        filters.to_province_id = parseInt(to_province_id as string);
      }
      if (to_city_id) {
        filters.to_city_id = parseInt(to_city_id as string);
      }
      
      // New filters
      if (min_rating) {
        filters.min_rating = parseFloat(min_rating as string);
      }
      if (max_price) {
        filters.max_price = parseFloat(max_price as string);
      }
      if (min_price) {
        filters.min_price = parseFloat(min_price as string);
      }
      if (vehicle_type) {
        filters.vehicle_type = vehicle_type as string;
      }
      if (vehicle_make) {
        filters.vehicle_make = vehicle_make as string;
      }
      if (vehicle_color) {
        filters.vehicle_color = vehicle_color as string;
      }
      if (sort_by) {
        filters.sort_by = sort_by as string;
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

      // Only return published offers.
      // This used to be `successResponse(res, {offer: null, ...}, 404)` — but the
      // signature is (res, data, message?, statusCode?), so the 404 landed in the
      // MESSAGE slot and the reply went out as HTTP 200 / success:true / offer:null.
      // The user app checks `!response.ok`, so it sailed past the error path and drew
      // a blank screen. A real AppError gives the 404 the app was always waiting for.
      if (offer.status !== 'published') {
        throw new AppError(t('offers.notAvailable', getLanguageFromHeaders(req.headers['accept-language'])), 404);
      }

      // Transform offer to match frontend expectations (same structure as getPublicOffers)
      const offerWithIncludes = offer as any;
      const transformedOffer = {
        id: offer.id,
        from_text: offer.from_text,
        to_text: offer.to_text,
        start_at: offer.start_at,
        price_per_seat: offer.price_per_seat,
        front_price_per_seat: offer.front_price_per_seat,
        currency: offer.currency,
        seats_free: offer.seats_free,
        seats_total: offer.seats_total,
        note: offer.note,
        driver: {
          name: offerWithIncludes.user?.display_name || 
                `${offerWithIncludes.user?.first_name || ''} ${offerWithIncludes.user?.last_name || ''}`.trim() ||
                'Unknown Driver',
          rating: 0 // TODO: Implement rating system
        },
        vehicle: {
          make: offerWithIncludes.vehicle?.make?.name || offerWithIncludes.vehicle?.make || '',
          model: offerWithIncludes.vehicle?.model?.name || offerWithIncludes.vehicle?.model || '',
          color: offerWithIncludes.vehicle?.color?.name || offerWithIncludes.vehicle?.color || '',
          license_plate: offerWithIncludes.vehicle?.license_plate || '',
          year: offerWithIncludes.vehicle?.year || null
        }
      };

      return successResponse(res, { offer: transformedOffer });
    } catch (error) {
      next(error);
    }
  }
}

