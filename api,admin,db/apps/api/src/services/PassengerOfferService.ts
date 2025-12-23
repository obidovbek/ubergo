/**
 * Passenger Offer Service
 * Handles passenger offer logic (CRUD, status transitions, validations)
 */

import { Op } from 'sequelize';
import {
  PassengerOffer,
  User,
  OfferDriver,
  DriverVehicle,
  DriverProfile,
  VehicleType,
  VehicleMake,
  VehicleModel,
  VehicleColor,
  PushToken
} from '../database/models/index.js';
import type { PassengerOfferStatus } from '../database/models/PassengerOffer.js';
import { AppError } from '../errors/AppError.js';
import { logAudit } from '../utils/auditLogger.js';
import PushService from './PushService.js';
import type { Request } from 'express';

interface CreatePassengerOfferData {
  from_text: string;
  from_lat?: number;
  from_lng?: number;
  from_country_id?: number;
  from_province_id?: number;
  from_city_id?: number;
  to_text: string;
  to_lat?: number;
  to_lng?: number;
  to_country_id?: number;
  to_province_id?: number;
  to_city_id?: number;
  start_at: string | Date;
  seats_needed: number;
  max_price_per_seat: number;
  currency?: string;
  front_seat?: boolean;
  pets?: boolean;
  large_baggage?: boolean;
  note?: string;
}

interface UpdatePassengerOfferData extends Partial<CreatePassengerOfferData> {}

interface PassengerOfferFilters {
  status?: PassengerOfferStatus | PassengerOfferStatus[];
  from?: Date;
  to?: Date;
}

export class PassengerOfferService {
  // Minimum advance time for offers (30 minutes)
  private static MIN_ADVANCE_MINUTES = 30;
  
  // Minimum price per seat (in UZS)
  private static MIN_PRICE_UZS = 5000;

  /**
   * Validate offer data
   */
  private static validateOfferData(data: CreatePassengerOfferData | UpdatePassengerOfferData, isUpdate = false) {
    // Validate seats_needed
    if (data.seats_needed !== undefined) {
      if (data.seats_needed < 1 || data.seats_needed > 8) {
        throw new AppError('seats_needed must be between 1 and 8', 400);
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

    // Validate max_price_per_seat
    if (data.max_price_per_seat !== undefined) {
      const currency = data.currency || 'UZS';
      if (currency === 'UZS' && data.max_price_per_seat < this.MIN_PRICE_UZS) {
        throw new AppError(`max_price_per_seat must be at least ${this.MIN_PRICE_UZS} UZS`, 400);
      }
      if (data.max_price_per_seat <= 0) {
        throw new AppError('max_price_per_seat must be greater than 0', 400);
      }
    }
  }

  /**
   * Get user's passenger offers with filters
   */
  static async getUserOffers(userId: number, filters: PassengerOfferFilters = {}) {
    const where: any = { user_id: userId };

    // Filter by status
    if (filters.status) {
      const validStatuses: PassengerOfferStatus[] = ['published', 'archived', 'cancelled', 'completed'];
      
      if (Array.isArray(filters.status)) {
        const filteredStatuses = filters.status.filter((s): s is PassengerOfferStatus => 
          validStatuses.includes(s as PassengerOfferStatus)
        );
        const uniqueStatuses = [...new Set(filteredStatuses)];
        
        if (uniqueStatuses.length > 0) {
          where.status = { [Op.in]: uniqueStatuses };
        }
      } else if (validStatuses.includes(filters.status as PassengerOfferStatus)) {
        where.status = filters.status;
      }
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

    const offers = await PassengerOffer.findAll({
      where,
      include: [
        {
          model: OfferDriver,
          as: 'drivers',
          required: false,
          include: [
            {
              model: User,
              as: 'driver',
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
                  model: VehicleColor,
                  as: 'color',
                  attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
                }
              ]
            }
          ]
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
    const offer = await PassengerOffer.findByPk(offerId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
        },
        {
          model: OfferDriver,
          as: 'drivers',
          required: false,
          include: [
            {
              model: User,
              as: 'driver',
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
                  model: VehicleColor,
                  as: 'color',
                  attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en']
                }
              ]
            }
          ]
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
   * Create new passenger offer
   */
  static async createOffer(userId: number, data: CreatePassengerOfferData, req?: Request) {
    // Validate data
    this.validateOfferData(data);

    // Create offer
    const offer = await PassengerOffer.create({
      user_id: userId,
      from_text: data.from_text,
      from_lat: data.from_lat ?? null,
      from_lng: data.from_lng ?? null,
      from_country_id: data.from_country_id ?? null,
      from_province_id: data.from_province_id ?? null,
      from_city_id: data.from_city_id ?? null,
      to_text: data.to_text,
      to_lat: data.to_lat ?? null,
      to_lng: data.to_lng ?? null,
      to_country_id: data.to_country_id ?? null,
      to_province_id: data.to_province_id ?? null,
      to_city_id: data.to_city_id ?? null,
      start_at: new Date(data.start_at),
      seats_needed: data.seats_needed,
      max_price_per_seat: data.max_price_per_seat,
      currency: data.currency || 'UZS',
      front_seat: data.front_seat ?? false,
      pets: data.pets ?? false,
      large_baggage: data.large_baggage ?? false,
      note: data.note,
      status: 'published'
    });

    // Reload offer
    const offerWithDetails = await this.getOfferById(String(offer.id), userId);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'passenger.offer.create',
        payload: { offer_id: offer.id, from: data.from_text, to: data.to_text },
        req
      });
    }

    return offerWithDetails;
  }

  /**
   * Update passenger offer
   */
  static async updateOffer(
    offerId: string,
    userId: number,
    data: UpdatePassengerOfferData,
    req?: Request
  ) {
    const offer = await this.getOfferById(offerId, userId);

    // Validate data
    this.validateOfferData(data, true);

    // Update offer
    await offer.update({
      ...data,
      start_at: data.start_at ? new Date(data.start_at) : offer.start_at
    });

    // Reload offer
    const offerWithDetails = await this.getOfferById(offerId, userId);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'passenger.offer.update',
        payload: { offer_id: offer.id, changes: Object.keys(data) },
        req
      });
    }

    return offerWithDetails;
  }

  /**
   * Cancel offer (published → cancelled)
   */
  static async cancelOffer(offerId: string, userId: number, req?: Request) {
    const offer = await this.getOfferById(offerId, userId);

    if (offer.status !== 'published') {
      throw new AppError('Only published offers can be cancelled', 400);
    }

    // Get all pending and confirmed drivers before cancelling
    const interestedDrivers = await OfferDriver.findAll({
      where: {
        offer_id: offerId,
        status: { [Op.in]: ['pending', 'confirmed'] }
      },
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
        }
      ]
    });

    await offer.update({ status: 'cancelled' });

    // Send push notifications to all interested drivers
    if (interestedDrivers.length > 0) {
      await Promise.all(
        interestedDrivers.map(async (driverJoin) => {
          await this.notifyDriver(driverJoin.driver_id, {
            type: 'offer_cancelled_by_passenger',
            title: 'Ride Request Cancelled',
            body: `The ride request from ${offer.from_text} to ${offer.to_text} has been cancelled`,
            data: {
              type: 'offer_cancelled_by_passenger',
              offer_id: String(offer.id),
              driver_join_id: driverJoin.id
            }
          });
        })
      );
    }

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'passenger.offer.cancel',
        payload: { offer_id: offer.id, notified_drivers: interestedDrivers.length },
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
        action: 'passenger.offer.publish',
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
        action: 'passenger.offer.archive',
        payload: { offer_id: offer.id },
        req
      });
    }

    return offer;
  }

  /**
   * Complete offer
   */
  static async completeOffer(offerId: string, userId: number, req?: Request) {
    const offer = await this.getOfferById(offerId, userId);

    if (offer.status !== 'published') {
      throw new AppError('Only published offers can be completed', 400);
    }

    await offer.update({ status: 'completed' });

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'passenger.offer.complete',
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
        action: 'passenger.offer.delete',
        payload: { offer_id: offer.id },
        req
      });
    }

    return { success: true };
  }

  /**
   * Get public passenger offers (for drivers to browse)
   */
  static async getPublicOffers(filters: {
    from_text?: string;
    to_text?: string;
    date?: string;
    min_seats?: number;
    max_price?: number;
    sort_by?: string;
    limit?: number;
    offset?: number;
  }) {
    const whereConditions: any[] = [
      { status: 'published' },
      { start_at: { [Op.gte]: new Date() } } // Only future offers
    ];

    // Filter by from/to text
    if (filters.from_text) {
      whereConditions.push({ from_text: { [Op.iLike]: `%${filters.from_text}%` } });
    }
    if (filters.to_text) {
      whereConditions.push({ to_text: { [Op.iLike]: `%${filters.to_text}%` } });
    }

    // Filter by date
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereConditions.push({
        start_at: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      });
    }

    // Filter by minimum seats
    if (filters.min_seats) {
      whereConditions.push({ seats_needed: { [Op.gte]: filters.min_seats } });
    }

    // Filter by max price
    if (filters.max_price) {
      whereConditions.push({ max_price_per_seat: { [Op.lte]: filters.max_price } });
    }

    const where = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

    // Determine sort order
    let order: any[] = [['start_at', 'ASC']]; // Default sort
    if (filters.sort_by) {
      switch (filters.sort_by) {
        case 'price_desc':
          order = [['max_price_per_seat', 'DESC']];
          break;
        case 'price_asc':
          order = [['max_price_per_seat', 'ASC']];
          break;
        case 'date_asc':
          order = [['start_at', 'ASC']];
          break;
        case 'seats_desc':
          order = [['seats_needed', 'DESC']];
          break;
      }
    }

    const { rows: offers, count: total } = await PassengerOffer.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
        }
      ],
      limit: filters.limit || 20,
      offset: filters.offset || 0,
      order
    });

    const mappedOffers = offers.map((offer) => {
      const offerWithIncludes = offer as any;
      
      return {
        id: offer.id,
        from_text: offer.from_text,
        to_text: offer.to_text,
        start_at: offer.start_at,
        max_price_per_seat: offer.max_price_per_seat,
        currency: offer.currency,
        seats_needed: offer.seats_needed,
        note: offer.note,
        passenger: {
          id: offerWithIncludes.user?.id,
          name: offerWithIncludes.user?.display_name || 
                `${offerWithIncludes.user?.first_name || ''} ${offerWithIncludes.user?.last_name || ''}`.trim()
        }
      };
    });

    return {
      items: mappedOffers,
      total
    };
  }

  /**
   * Send push notification to driver
   */
  private static async notifyDriver(
    driverId: number,
    notification: {
      type: string;
      title: string;
      body: string;
      data: Record<string, string>;
    }
  ) {
    try {
      // Get driver's push tokens
      const tokens = await PushToken.findAll({
        where: { user_id: driverId, is_active: true }
      });

      if (tokens.length === 0) {
        console.log(`No active push tokens found for driver ${driverId}`);
        return;
      }

      // Send to all tokens
      await Promise.all(
        tokens.map(async (token) => {
          try {
            await PushService.send({
              token: token.token,
              title: notification.title,
              body: notification.body,
              data: notification.data
            });
          } catch (error) {
            console.error(`Failed to send push to driver ${driverId}:`, error);
            // Deactivate invalid tokens
            if (error instanceof Error && error.message.includes('invalid')) {
              await token.update({ is_active: false });
            }
          }
        })
      );
    } catch (error) {
      console.error('Error sending push notification to driver:', error);
    }
  }
}



