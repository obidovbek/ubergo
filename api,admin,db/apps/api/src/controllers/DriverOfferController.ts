/**
 * Driver Offer Controller
 * Handles HTTP requests for driver offers
 */

import type { Request, Response, NextFunction } from 'express';
import { DriverOfferService } from '../services/DriverOfferService.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../errors/AppError.js';

export class DriverOfferController {
  /**
   * GET /api/driver/offers
   * Get user's offers with optional filters
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

      const offers = await DriverOfferService.getUserOffers(userId, filters);

      return successResponse(res, { offers });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/driver/offers/:id
   * Get offer by ID
   */
  static async getOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const offer = await DriverOfferService.getOfferById(id, userId);

      return successResponse(res, { offer });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/offers
   * Create new offer
   */
  static async createOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const offer = await DriverOfferService.createOffer(userId, req.body, req);

      return successResponse(res, { offer, message: 'Offer created successfully' }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/driver/offers/:id
   * Update offer
   */
  static async updateOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const offer = await DriverOfferService.updateOffer(id, userId, req.body, req);

      return successResponse(res, { offer, message: 'Offer updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/offers/:id/cancel
   * Cancel offer (published → cancelled)
   */
  static async cancelOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const offer = await DriverOfferService.cancelOffer(id, userId, req);

      return successResponse(res, { offer, message: 'Offer cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/offers/:id/publish
   * Publish offer (archived/cancelled → published)
   */
  static async publishOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const offer = await DriverOfferService.publishOffer(id, userId, req);

      return successResponse(res, { offer, message: 'Offer published successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/driver/offers/:id/archive
   * Archive offer
   */
  static async archiveOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const offer = await DriverOfferService.archiveOffer(id, userId, req);

      return successResponse(res, { offer, message: 'Offer archived successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/driver/offers/:id
   * Delete offer (only archived or cancelled)
   */
  static async deleteOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      await DriverOfferService.deleteOffer(id, userId, req);

      return successResponse(res, { message: 'Offer deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

