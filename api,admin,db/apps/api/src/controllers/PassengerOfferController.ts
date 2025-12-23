/**
 * Passenger Offer Controller
 * Handles HTTP requests for passenger offers
 */

import type { Request, Response, NextFunction } from 'express';
import { PassengerOfferService } from '../services/PassengerOfferService.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../errors/AppError.js';

export class PassengerOfferController {
  /**
   * GET /api/passenger/offers
   * Get user's passenger offers with optional filters
   */
  static async getOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { status, from, to } = req.query;

      const filters: any = {};
      if (status) {
        filters.status = typeof status === 'string' ? status.split(',') : status;
      }
      if (from) {
        filters.from = new Date(from as string);
      }
      if (to) {
        filters.to = new Date(to as string);
      }

      const offers = await PassengerOfferService.getUserOffers(userId, filters);

      return successResponse(res, { offers });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/passenger/offers/:id
   * Get offer by ID
   */
  static async getOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const offer = await PassengerOfferService.getOfferById(id, userId);

      return successResponse(res, { offer });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/passenger/offers
   * Create new passenger offer
   */
  static async createOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const offer = await PassengerOfferService.createOffer(userId, req.body, req);

      return successResponse(res, { offer, message: 'Offer created successfully' }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/passenger/offers/:id
   * Update passenger offer
   */
  static async updateOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const offer = await PassengerOfferService.updateOffer(id, userId, req.body, req);

      return successResponse(res, { offer, message: 'Offer updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/passenger/offers/:id/cancel
   * Cancel offer (published → cancelled)
   */
  static async cancelOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const offer = await PassengerOfferService.cancelOffer(id, userId, req);

      return successResponse(res, { offer, message: 'Offer cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/passenger/offers/:id/publish
   * Publish offer (archived/cancelled → published)
   */
  static async publishOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const offer = await PassengerOfferService.publishOffer(id, userId, req);

      return successResponse(res, { offer, message: 'Offer published successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/passenger/offers/:id/archive
   * Archive offer
   */
  static async archiveOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const offer = await PassengerOfferService.archiveOffer(id, userId, req);

      return successResponse(res, { offer, message: 'Offer archived successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/passenger/offers/:id/complete
   * Complete offer
   */
  static async completeOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const offer = await PassengerOfferService.completeOffer(id, userId, req);

      return successResponse(res, { offer, message: 'Offer completed successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/passenger/offers/:id
   * Delete offer (only archived or cancelled)
   */
  static async deleteOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      await PassengerOfferService.deleteOffer(id, userId, req);

      return successResponse(res, { message: 'Offer deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}



