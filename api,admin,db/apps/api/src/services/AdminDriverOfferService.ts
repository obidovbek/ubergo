/**
 * Admin Driver Offer Service
 * Handles admin moderation of driver offers
 */

import { Op } from 'sequelize';
import {
  DriverOffer,
  DriverOfferStop,
  User,
  DriverVehicle,
  DriverProfile,
  VehicleType,
  VehicleMake,
  VehicleModel,
  VehicleBodyType,
  VehicleColor,
  AdminUser
} from '../database/models/index.js';
import type { DriverOfferStatus } from '../database/models/DriverOffer.js';
import { AppError } from '../errors/AppError.js';
import { logAudit } from '../utils/auditLogger.js';
import type { Request } from 'express';

interface OfferFilters {
  status?: DriverOfferStatus | DriverOfferStatus[];
  from?: Date;
  to?: Date;
  search?: string;
}

export class AdminDriverOfferService {
  /**
   * Get all offers with filters (admin view)
   */
  static async getOffers(filters: OfferFilters = {}, pagination: { limit?: number; offset?: number } = {}) {
    const where: any = {};

    // Filter by status
    if (filters.status) {
      where.status = Array.isArray(filters.status) ? { [Op.in]: filters.status } : filters.status;
    }

    // Filter by date range
    if (filters.from || filters.to) {
      where.start_at = {};
      if (filters.from) {
        where.start_at[Op.gte] = filters.from;
      }
      if (filters.to) {
        where.start_at[Op.lte] = filters.to;
      }
    }

    // Search in from_text or to_text
    if (filters.search) {
      where[Op.or] = [
        { from_text: { [Op.iLike]: `%${filters.search}%` } },
        { to_text: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const { rows: offers, count: total } = await DriverOffer.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'display_name', 'phone_e164', 'email'],
          include: [
            {
              model: DriverProfile,
              as: 'driverProfile',
              attributes: ['id', 'first_name', 'last_name']
            }
          ]
        },
        {
          model: DriverVehicle,
          as: 'vehicle',
          include: [
            {
              model: VehicleType,
              as: 'type',
              attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
            },
            {
              model: VehicleMake,
              as: 'make',
              attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
            },
            {
              model: VehicleModel,
              as: 'model',
              attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
            },
            {
              model: VehicleBodyType,
              as: 'bodyType',
              attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
            },
            {
              model: VehicleColor,
              as: 'color',
              attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
            }
          ]
        },
        {
          model: DriverOfferStop,
          as: 'stops',
          required: false,
          separate: true,
          order: [['order_no', 'ASC']]
        },
        {
          model: AdminUser,
          as: 'reviewer',
          attributes: ['id', 'full_name', 'email'],
          required: false
        }
      ],
      limit: pagination.limit || 50,
      offset: pagination.offset || 0,
      order: [['created_at', 'DESC']]
    });

    return { offers, total };
  }

  /**
   * Get offer by ID (admin view with full details)
   */
  static async getOfferById(offerId: string) {
    const offer = await DriverOffer.findByPk(offerId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'display_name', 'phone_e164', 'email'],
          include: [
            {
              model: DriverProfile,
              as: 'driverProfile'
            }
          ]
        },
        {
          model: DriverVehicle,
          as: 'vehicle',
          include: [
            {
              model: VehicleType,
              as: 'type',
              attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
            },
            {
              model: VehicleMake,
              as: 'make',
              attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
            },
            {
              model: VehicleModel,
              as: 'model',
              attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
            },
            {
              model: VehicleBodyType,
              as: 'bodyType',
              attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
            },
            {
              model: VehicleColor,
              as: 'color',
              attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
            }
          ]
        },
        {
          model: DriverOfferStop,
          as: 'stops',
          required: false,
          separate: true,
          order: [['order_no', 'ASC']]
        },
        {
          model: AdminUser,
          as: 'reviewer',
          attributes: ['id', 'full_name', 'email'],
          required: false
        }
      ]
    });

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    return offer;
  }

  /**
   * Approve offer (pending_review → approved)
   */
  static async approveOffer(
    offerId: string,
    adminUserId: string,
    options: { auto_publish?: boolean } = {},
    req?: Request
  ) {
    const offer = await this.getOfferById(offerId);

    if (offer.status !== 'pending_review') {
      throw new AppError('Only pending_review offers can be approved', 400);
    }

    const newStatus = options.auto_publish ? 'published' : 'approved';

    await offer.update({
      status: newStatus,
      reviewed_by: adminUserId,
      reviewed_at: new Date(),
      rejection_reason: null
    });

    // Audit log
    await logAudit({
      userId: adminUserId,
      action: 'admin.offer.approve',
      payload: {
        offer_id: offer.id,
        user_id: offer.user_id,
        auto_publish: options.auto_publish
      },
      req
    });

    // TODO: Send push notification to driver
    // await PushService.sendToUser(offer.user_id, {
    //   title: 'Offer Approved',
    //   body: 'Your ride offer has been approved!'
    // });

    return offer;
  }

  /**
   * Reject offer (pending_review → rejected)
   */
  static async rejectOffer(
    offerId: string,
    adminUserId: string,
    reason: string,
    req?: Request
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new AppError('Rejection reason is required', 400);
    }

    const offer = await this.getOfferById(offerId);

    if (offer.status !== 'pending_review') {
      throw new AppError('Only pending_review offers can be rejected', 400);
    }

    await offer.update({
      status: 'rejected',
      reviewed_by: adminUserId,
      reviewed_at: new Date(),
      rejection_reason: reason
    });

    // Audit log
    await logAudit({
      userId: adminUserId,
      action: 'admin.offer.reject',
      payload: {
        offer_id: offer.id,
        user_id: offer.user_id,
        reason
      },
      req
    });

    // TODO: Send push notification to driver
    // await PushService.sendToUser(offer.user_id, {
    //   title: 'Offer Rejected',
    //   body: `Your ride offer was rejected: ${reason}`
    // });

    return offer;
  }

  /**
   * Get moderation statistics
   */
  static async getStatistics() {
    const [
      totalOffers,
      pendingCount,
      approvedCount,
      publishedCount,
      rejectedCount,
      archivedCount
    ] = await Promise.all([
      DriverOffer.count(),
      DriverOffer.count({ where: { status: 'pending_review' } }),
      DriverOffer.count({ where: { status: 'approved' } }),
      DriverOffer.count({ where: { status: 'published' } }),
      DriverOffer.count({ where: { status: 'rejected' } }),
      DriverOffer.count({ where: { status: 'archived' } })
    ]);

    return {
      total: totalOffers,
      pending_review: pendingCount,
      approved: approvedCount,
      published: publishedCount,
      rejected: rejectedCount,
      archived: archivedCount
    };
  }
}

