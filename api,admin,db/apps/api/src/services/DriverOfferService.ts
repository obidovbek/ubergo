/**
 * Driver Offer Service
 * Handles driver offer logic (CRUD, status transitions, validations)
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

interface OfferStopData {
  label_text: string;
  lat?: number;
  lng?: number;
  order_no?: number;
}

interface CreateOfferData {
  vehicle_id: string;
  from_text: string;
  from_lat?: number;
  from_lng?: number;
  to_text: string;
  to_lat?: number;
  to_lng?: number;
  start_at: string | Date;
  seats_total: number;
  price_per_seat: number;
  front_price_per_seat?: number;
  currency?: string;
  note?: string;
  stops?: OfferStopData[];
}

interface UpdateOfferData extends Partial<CreateOfferData> {}

interface OfferFilters {
  status?: DriverOfferStatus | DriverOfferStatus[];
  from?: Date;
  to?: Date;
}

export class DriverOfferService {
  // Minimum advance time for offers (30 minutes)
  private static MIN_ADVANCE_MINUTES = 30;
  
  // Minimum price per seat (in UZS)
  private static MIN_PRICE_UZS = 5000;

  /**
   * Validate offer data
   */
  private static validateOfferData(data: CreateOfferData | UpdateOfferData, isUpdate = false) {
    // Validate seats_total
    if (data.seats_total !== undefined) {
      if (data.seats_total < 1 || data.seats_total > 8) {
        throw new AppError('seats_total must be between 1 and 8', 400);
      }
    }

    // Validate start_at
    if (data.start_at) {
      const startAt = new Date(data.start_at);
      const minStartAt = new Date(Date.now() + this.MIN_ADVANCE_MINUTES * 60 * 1000);
      
      if (startAt < minStartAt) {
        throw new AppError(
          `start_at must be at least ${this.MIN_ADVANCE_MINUTES} minutes in the future`,
          400
        );
      }
    }

    // Validate price_per_seat
    if (data.price_per_seat !== undefined) {
      const currency = data.currency || 'UZS';
      if (currency === 'UZS' && data.price_per_seat < this.MIN_PRICE_UZS) {
        throw new AppError(`price_per_seat must be at least ${this.MIN_PRICE_UZS} UZS`, 400);
      }
      if (data.price_per_seat <= 0) {
        throw new AppError('price_per_seat must be greater than 0', 400);
      }
    }

    // Validate front_price_per_seat (if provided)
    if (data.front_price_per_seat !== undefined) {
      if (data.front_price_per_seat <= 0) {
        throw new AppError('front_price_per_seat must be greater than 0', 400);
      }
      if (
        data.price_per_seat !== undefined &&
        data.front_price_per_seat < data.price_per_seat
      ) {
        throw new AppError('front_price_per_seat must be greater than or equal to price_per_seat', 400);
      }
    }
  }

  /**
   * Check if vehicle belongs to user
   */
  private static async checkVehicleOwnership(userId: number, vehicleId: string) {
    const vehicle = await DriverVehicle.findOne({
      where: { id: vehicleId },
      include: [
        {
          model: DriverProfile,
          as: 'driverProfile',
          where: { user_id: userId },
          required: true
        }
      ]
    });

    if (!vehicle) {
      throw new AppError('Vehicle not found or does not belong to you', 403);
    }

    return vehicle;
  }

  /**
   * Get user's offers with filters
   */
  static async getUserOffers(userId: number, filters: OfferFilters = {}) {
    const where: any = { user_id: userId };

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

    const offers = await DriverOffer.findAll({
      where,
      include: [
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
        }
      ],
      order: [['start_at', 'DESC']]
    });

    return offers;
  }

  /**
   * Get offer by ID
   */
  static async getOfferById(offerId: string, userId?: number) {
    const offer = await DriverOffer.findByPk(offerId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
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

    // Check ownership if userId provided
    if (userId !== undefined && offer.user_id !== userId) {
      throw new AppError('You do not have permission to access this offer', 403);
    }

    return offer;
  }

  /**
   * Create new offer
   */
  static async createOffer(userId: number, data: CreateOfferData, req?: Request) {
    // Validate data
    this.validateOfferData(data);

    // Check vehicle ownership
    await this.checkVehicleOwnership(userId, data.vehicle_id);

    // Create offer
    const offer = await DriverOffer.create({
      user_id: userId,
      vehicle_id: data.vehicle_id,
      from_text: data.from_text,
      from_lat: data.from_lat ?? null,
      from_lng: data.from_lng ?? null,
      to_text: data.to_text,
      to_lat: data.to_lat ?? null,
      to_lng: data.to_lng ?? null,
      start_at: new Date(data.start_at),
      seats_total: data.seats_total,
      seats_free: data.seats_total, // MVP: seats_free = seats_total
      price_per_seat: data.price_per_seat,
      front_price_per_seat: data.front_price_per_seat ?? null,
      currency: data.currency || 'UZS',
      note: data.note,
      status: 'published'
    });

    // Create stops if provided
    if (data.stops && Array.isArray(data.stops) && data.stops.length > 0) {
      await Promise.all(
        data.stops.map((stop, index) =>
          DriverOfferStop.create({
            offer_id: offer.id,
            order_no: stop.order_no || index + 1,
            label_text: stop.label_text,
            lat: stop.lat ?? null,
            lng: stop.lng ?? null
          })
        )
      );
    }

    // Reload offer with stops
    const offerWithStops = await this.getOfferById(offer.id, userId);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'driver.offer.create',
        payload: { offer_id: offer.id, from: data.from_text, to: data.to_text, stops_count: data.stops?.length || 0 },
        req
      });
    }

    return offerWithStops;
  }

  /**
   * Update offer
   */
  static async updateOffer(
    offerId: string,
    userId: number,
    data: UpdateOfferData,
    req?: Request
  ) {
    const offer = await this.getOfferById(offerId, userId);

    // Check if offer can be edited
    if (offer.status === 'published') {
      // For published offers, only allow limited edits
      const allowedFields = ['price_per_seat', 'front_price_per_seat', 'note', 'seats_total'];
      const hasDisallowedFields = Object.keys(data).some(
        (key) => !allowedFields.includes(key) && key !== 'stops'
      );

      if (hasDisallowedFields) {
        throw new AppError(
          'Only price_per_seat, note, and seats_total can be edited for published offers',
          400
        );
      }

      // Price can only be decreased
      if (data.price_per_seat !== undefined && data.price_per_seat > offer.price_per_seat) {
        throw new AppError('Price can only be decreased for published offers', 400);
      }
      if (
        data.front_price_per_seat !== undefined &&
        offer.front_price_per_seat !== null &&
        offer.front_price_per_seat !== undefined &&
        data.front_price_per_seat > offer.front_price_per_seat
      ) {
        throw new AppError('front_price_per_seat can only be decreased for published offers', 400);
      }
    }

    // Validate data
    this.validateOfferData(data, true);

    // Check vehicle ownership if changing vehicle
    if (data.vehicle_id && data.vehicle_id !== offer.vehicle_id) {
      await this.checkVehicleOwnership(userId, data.vehicle_id);
    }

    // Update offer
    await offer.update({
      ...data,
      start_at: data.start_at ? new Date(data.start_at) : offer.start_at,
      seats_free: data.seats_total !== undefined ? data.seats_total : offer.seats_free
    });

    // Update stops if provided (only for archived/cancelled offers)
    if (data.stops !== undefined && ['archived', 'cancelled'].includes(offer.status)) {
      // Delete existing stops
      await DriverOfferStop.destroy({
        where: { offer_id: offerId }
      });

      // Create new stops
      if (Array.isArray(data.stops) && data.stops.length > 0) {
        await Promise.all(
          data.stops.map((stop, index) =>
            DriverOfferStop.create({
              offer_id: offerId,
              order_no: stop.order_no || index + 1,
              label_text: stop.label_text,
              lat: stop.lat ?? null,
              lng: stop.lng ?? null
            })
          )
        );
      }
    }

    // Reload offer with stops
    const offerWithStops = await this.getOfferById(offerId, userId);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'driver.offer.update',
        payload: { offer_id: offer.id, changes: Object.keys(data) },
        req
      });
    }

    return offerWithStops;
  }

  /**
   * Cancel offer (published → cancelled)
   */
  static async cancelOffer(offerId: string, userId: number, req?: Request) {
    const offer = await this.getOfferById(offerId, userId);

    if (offer.status !== 'published') {
      throw new AppError('Only published offers can be cancelled', 400);
    }

    await offer.update({ status: 'cancelled' });

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'driver.offer.cancel',
        payload: { offer_id: offer.id },
        req
      });
    }

    return offer;
  }

  /**
   * Publish offer (archived/cancelled → published)
   */
  static async publishOffer(offerId: string, userId: number, req?: Request) {
    const offer = await this.getOfferById(offerId, userId);

    if (!['archived', 'cancelled'].includes(offer.status)) {
      throw new AppError('Only archived or cancelled offers can be published', 400);
    }

    await offer.update({ status: 'published' });

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'driver.offer.publish',
        payload: { offer_id: offer.id },
        req
      });
    }

    return offer;
  }

  /**
   * Archive offer
   */
  static async archiveOffer(offerId: string, userId: number, req?: Request) {
    const offer = await this.getOfferById(offerId, userId);

    await offer.update({ status: 'archived' });

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'driver.offer.archive',
        payload: { offer_id: offer.id },
        req
      });
    }

    return offer;
  }

  /**
   * Delete offer (only archived or cancelled)
   */
  static async deleteOffer(offerId: string, userId: number, req?: Request) {
    const offer = await this.getOfferById(offerId, userId);

    if (!['archived', 'cancelled'].includes(offer.status)) {
      throw new AppError('Only archived or cancelled offers can be deleted', 400);
    }

    await offer.destroy();

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'driver.offer.delete',
        payload: { offer_id: offer.id },
        req
      });
    }

    return { success: true };
  }

  /**
   * Get public offers (for passengers)
   */
  static async getPublicOffers(filters: {
    from_text?: string;
    to_text?: string;
    date?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      status: 'published',
      start_at: { [Op.gte]: new Date() } // Only future offers
    };

    // Filter by from/to text (simple text search for MVP)
    if (filters.from_text) {
      where.from_text = { [Op.iLike]: `%${filters.from_text}%` };
    }
    if (filters.to_text) {
      where.to_text = { [Op.iLike]: `%${filters.to_text}%` };
    }

    // Filter by date
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.start_at = {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      };
    }

    const { rows: offers, count: total } = await DriverOffer.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'display_name'],
          include: [
            {
              model: DriverProfile,
              as: 'driverProfile',
              attributes: ['id']
            }
          ]
        },
        {
          model: DriverVehicle,
          as: 'vehicle',
          attributes: ['id', 'license_plate', 'year'],
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
              model: VehicleColor,
              as: 'color',
              attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
            }
          ]
        }
      ],
      limit: filters.limit || 20,
      offset: filters.offset || 0,
      order: [['start_at', 'ASC']]
    });

    return {
      items: offers.map((offer) => {
        const offerWithIncludes = offer as any;
        return {
          id: offer.id,
          from_text: offer.from_text,
          to_text: offer.to_text,
          start_at: offer.start_at,
          price_per_seat: offer.price_per_seat,
          currency: offer.currency,
          seats_free: offer.seats_free,
          note: offer.note,
          driver: {
            name: offerWithIncludes.user?.display_name || 
                  `${offerWithIncludes.user?.first_name || ''} ${offerWithIncludes.user?.last_name || ''}`.trim(),
            rating: 0 // TODO: Implement rating system
          },
          vehicle: {
            make: offerWithIncludes.vehicle?.make?.name,
            model: offerWithIncludes.vehicle?.model?.name,
            color: offerWithIncludes.vehicle?.color?.name,
            license_plate: offerWithIncludes.vehicle?.license_plate,
            year: offerWithIncludes.vehicle?.year
          }
        };
      }),
      total
    };
  }
}

