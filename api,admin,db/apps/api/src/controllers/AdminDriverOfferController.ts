/**
 * Admin Driver Offer Controller
 * Handles HTTP requests for admin moderation of driver offers
 */

import type { Request, Response, NextFunction } from 'express';
import { AdminDriverOfferService } from '../services/AdminDriverOfferService.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../errors/AppError.js';

export class AdminDriverOfferController {
  /**
   * GET /api/admin/driver-offers
   * Get all offers with filters
   */
  static async getOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, from, to, search, limit, offset } = req.query;

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
      if (search) {
        filters.search = search as string;
      }

      const pagination = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const { offers, total } = await AdminDriverOfferService.getOffers(filters, pagination);

      return successResponse(res, { offers, total });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/driver-offers/statistics
   * Get moderation statistics
   */
  static async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const statistics = await AdminDriverOfferService.getStatistics();
      return successResponse(res, { statistics });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/driver-offers/:id
   * Get offer by ID with full details
   */
  static async getOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const offer = await AdminDriverOfferService.getOfferById(id);

      return successResponse(res, { offer });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/driver-offers/:id/approve
   * Approve offer (pending_review → approved or published)
   */
  static async approveOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).user?.userId;
      
      if (!adminUserId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const { auto_publish } = req.body;

      const offer = await AdminDriverOfferService.approveOffer(
        id,
        adminUserId,
        { auto_publish },
        req
      );

      return successResponse(res, {
        offer,
        message: auto_publish ? 'Offer approved and published' : 'Offer approved'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/driver-offers/:id/reject
   * Reject offer (pending_review → rejected)
   */
  static async rejectOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).user?.userId;
      
      if (!adminUserId) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        throw new AppError('Rejection reason is required', 400);
      }

      const offer = await AdminDriverOfferService.rejectOffer(id, adminUserId, reason, req);

      return successResponse(res, { offer, message: 'Offer rejected' });
    } catch (error) {
      next(error);
    }
  }
}

