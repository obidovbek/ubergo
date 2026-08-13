/**
 * Driver Offer Service
 * Handles driver offer logic (CRUD, status transitions, validations)
 */

import { Op, Sequelize, fn, col } from 'sequelize';
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
  AdminUser,
  GeoProvince,
  GeoCityDistrict,
  DriverRating,
  OfferPassenger,
  PushToken
} from '../database/models/index.js';
import type {
  DriverOfferStatus,
  DriverOfferVehicleClass
} from '../database/models/DriverOffer.js';
import { AppError } from '../errors/AppError.js';
import { logAudit } from '../utils/auditLogger.js';
import PushService from './PushService.js';
import { NotificationService } from './NotificationService.js';
import type { Request } from 'express';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { getUserLanguage } from '../utils/userLanguage.js';
import { t } from '../i18n/translator.js';
import type { Language } from '../i18n/types.js';

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
  // T-078 — the rest of the mockup's `Narxlar` list, plus payment and class.
  price_back_salon?: number;
  price_whole_salon?: number;
  /** A rate to DISPLAY. Nothing charges it — see the model. */
  waiting_fee_per_min?: number;
  free_waiting_min?: number;
  pickup_fee?: number;
  payment_cash?: boolean;
  payment_card?: boolean;
  vehicle_class?: DriverOfferVehicleClass;
  // T-079 — what the car offers, and what it will carry.
  air_conditioner?: boolean;
  wifi?: boolean;
  roof_rack_needed?: boolean;
  trailer?: boolean;
  parcel_accepted?: boolean;
  parcel_price?: number;
  parcel_max_kg?: number;
  road_pickup?: boolean;
  road_pickup_note?: string;
  // T-080 — `start_at` is the window's start; these are the rest.
  depart_until?: string | Date;
  arrive_from?: string | Date;
  arrive_until?: string | Date;
  /** 🔴 "leave when full" — NOT the passenger's `is_urgent` ("leave now"). */
  departs_when_full?: boolean;
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

    // Prices arrive as EITHER numbers or strings. price_per_seat and
    // front_price_per_seat are DECIMAL(10,2), and pg returns numeric as a string
    // (there is no setTypeParser override in this project), so an offer loaded
    // for edit round-trips "5000.00" straight back to us. Coerce before every
    // comparison: `<` between two strings is lexicographic, which made
    // "12000.00" < "5000.00" evaluate to TRUE and rejected every valid edit of an
    // offer whose front price had more digits than the base price.
    const price = this.parsePrice(data.price_per_seat, 'price_per_seat');
    const frontPrice = this.parsePrice(data.front_price_per_seat, 'front_price_per_seat');

    // Validate price_per_seat
    if (price !== undefined) {
      const currency = data.currency || 'UZS';
      if (currency === 'UZS' && price < this.MIN_PRICE_UZS) {
        throw new AppError(`price_per_seat must be at least ${this.MIN_PRICE_UZS} UZS`, 400);
      }
      if (price <= 0) {
        throw new AppError('price_per_seat must be greater than 0', 400);
      }
    }

    // Validate front_price_per_seat (if provided)
    if (frontPrice !== undefined) {
      if (frontPrice <= 0) {
        throw new AppError('front_price_per_seat must be greater than 0', 400);
      }
      if (price !== undefined && frontPrice < price) {
        throw new AppError('front_price_per_seat must be greater than or equal to price_per_seat', 400);
      }
    }

    /*
     * ── T-078: salon prices, waiting and pickup ────────────────────────────
     *
     * ⚠️ Every one goes through `parsePrice` for the same reason the two above
     * do: pg returns DECIMAL as a STRING, so an offer loaded for edit sends
     * "320000.00" straight back, and `<` between two strings is lexicographic.
     */
    const backSalon = this.parsePrice(data.price_back_salon, 'price_back_salon');
    const wholeSalon = this.parsePrice(data.price_whole_salon, 'price_whole_salon');

    for (const [value, field] of [
      [backSalon, 'price_back_salon'],
      [wholeSalon, 'price_whole_salon']
    ] as const) {
      if (value !== undefined && value <= 0) {
        throw new AppError(`${field} must be greater than 0`, 400);
      }
    }

    /*
     * The only ordering rule worth enforcing: the WHOLE car contains the back
     * of it, so it cannot cost less.
     *
     * 🔴 Deliberately NOT enforced: that a salon must be cheaper than buying its
     * seats one by one. It usually is (the mockup's 320 000 beats 3 × 120 000),
     * but a driver may legitimately charge a premium for exclusivity, and
     * refusing that would be this service inventing a pricing policy.
     */
    if (backSalon !== undefined && wholeSalon !== undefined && wholeSalon < backSalon) {
      throw new AppError(
        'price_whole_salon must be greater than or equal to price_back_salon',
        400
      );
    }

    /*
     * ⚠️ Waiting and pickup allow **0**, unlike a seat price.
     * "Joyidan olish + 0 so'm" is exactly what the mockup draws — free door
     * pickup — and 0 free waiting minutes is a real answer too. Only a NEGATIVE
     * value is nonsense here.
     */
    const waitingFee = this.parsePrice(data.waiting_fee_per_min, 'waiting_fee_per_min');
    const pickupFee = this.parsePrice(data.pickup_fee, 'pickup_fee');

    for (const [value, field] of [
      [waitingFee, 'waiting_fee_per_min'],
      [pickupFee, 'pickup_fee']
    ] as const) {
      if (value !== undefined && value < 0) {
        throw new AppError(`${field} cannot be negative`, 400);
      }
    }

    if (data.free_waiting_min !== undefined && data.free_waiting_min !== null) {
      const freeMin = Number(data.free_waiting_min);
      if (!Number.isFinite(freeMin) || freeMin < 0 || !Number.isInteger(freeMin)) {
        throw new AppError('free_waiting_min must be a whole number of minutes', 400);
      }
    }

    if (data.vehicle_class !== undefined && data.vehicle_class !== null) {
      const classes: DriverOfferVehicleClass[] = [
        'standard',
        'comfort',
        'business',
        'econom',
        'tourist'
      ];
      if (!classes.includes(data.vehicle_class)) {
        throw new AppError('vehicle_class is not a valid class', 400);
      }
    }
  }

  /**
   * Coerce a price field to a number for comparison.
   * Returns undefined only when the field was not sent at all (partial update).
   * Non-numeric input is a 400 here instead of an integer-syntax 500 from Postgres.
   */
  private static parsePrice(value: unknown, field: string): number | undefined {
    if (value === undefined) {
      return undefined;
    }
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) {
      throw new AppError(`${field} must be a number`, 400);
    }
    return num;
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
      // Valid statuses for driver offers
      const validStatuses: DriverOfferStatus[] = ['published', 'archived', 'cancelled'];
      
      // Normalize status filter - map old statuses to new ones
      const normalizeStatus = (status: string): DriverOfferStatus | null => {
        // Map old statuses to current ones
        if (status === 'approved' || status === 'draft' || status === 'pending_review') {
          return 'published';
        }
        // Return valid status or null
        return validStatuses.includes(status as DriverOfferStatus) ? (status as DriverOfferStatus) : null;
      };

      if (Array.isArray(filters.status)) {
        // Filter and normalize array of statuses
        const normalizedStatuses = filters.status
          .map(normalizeStatus)
          .filter((s): s is DriverOfferStatus => s !== null);
        
        // Remove duplicates
        const uniqueStatuses = [...new Set(normalizedStatuses)];
        
        if (uniqueStatuses.length > 0) {
          where.status = { [Op.in]: uniqueStatuses };
        }
      } else {
        // Normalize single status
        const normalizedStatus = normalizeStatus(filters.status as string);
        if (normalizedStatus) {
          where.status = normalizedStatus;
        }
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
      // T-078. `?? null` throughout: an omitted field means "not stated", which
      // for the payment flags is a THIRD state, distinct from `false`.
      price_back_salon: data.price_back_salon ?? null,
      price_whole_salon: data.price_whole_salon ?? null,
      waiting_fee_per_min: data.waiting_fee_per_min ?? null,
      free_waiting_min: data.free_waiting_min ?? null,
      pickup_fee: data.pickup_fee ?? null,
      payment_cash: data.payment_cash ?? null,
      payment_card: data.payment_card ?? null,
      vehicle_class: data.vehicle_class ?? null,
      // T-079 — booleans default to false, so `?? false` rather than `?? null`.
      air_conditioner: data.air_conditioner ?? false,
      wifi: data.wifi ?? false,
      roof_rack_needed: data.roof_rack_needed ?? false,
      trailer: data.trailer ?? false,
      parcel_accepted: data.parcel_accepted ?? false,
      parcel_price: data.parcel_price ?? null,
      parcel_max_kg: data.parcel_max_kg ?? null,
      road_pickup: data.road_pickup ?? false,
      road_pickup_note: data.road_pickup_note ?? null,
      // T-080. ⚠️ Dates arrive as ISO strings; `new Date(undefined)` is Invalid
      // Date, which Sequelize would happily try to store — hence the guard.
      depart_until: data.depart_until ? new Date(data.depart_until) : null,
      arrive_from: data.arrive_from ? new Date(data.arrive_from) : null,
      arrive_until: data.arrive_until ? new Date(data.arrive_until) : null,
      departs_when_full: data.departs_when_full ?? false,
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

    // All fields can be edited for all offer statuses
    // Validate data
    this.validateOfferData(data, true);

    // Check vehicle ownership if changing vehicle
    if (data.vehicle_id && data.vehicle_id !== offer.vehicle_id) {
      await this.checkVehicleOwnership(userId, data.vehicle_id);
    }

    // Keep the seats that are already sold. This used to reset seats_free to the
    // new seats_total, which handed every confirmed booking back to the pool — and
    // the offer wizard always sends seats_total, so it fired on EVERY edit and let
    // the same seat be sold twice. OfferPassengerService decrements seats_free when
    // a passenger is confirmed and restores it on cancel, so the booked count is
    // the difference between the two columns.
    let seatsFree = offer.seats_free;
    if (data.seats_total !== undefined) {
      const bookedSeats = offer.seats_total - offer.seats_free;
      const newSeatsTotal = Number(data.seats_total);
      if (newSeatsTotal < bookedSeats) {
        throw new AppError(
          `Cannot reduce seats_total to ${newSeatsTotal}: ${bookedSeats} seat(s) are already booked`,
          400
        );
      }
      seatsFree = newSeatsTotal - bookedSeats;
    }

    // Update offer
    // ⚠️ This still spreads `data` (= req.body) into the model, so user_id, status,
    // currency, rejection_reason, reviewed_by and reviewed_at remain client-writable.
    // (seats_free and start_at are safe — the explicit keys below the spread win.)
    // Whitelisting is T-026 — the same mass-assignment fix already applied to
    // PassengerOfferService.
    /*
     * T-080 — the three window dates are pulled OUT of the spread.
     *
     * They arrive as ISO strings but the columns are DATE, and `...data` would
     * carry the raw strings straight into `update()` — which is exactly what
     * `start_at` is converted separately to avoid. Taking them out here means
     * the only path into those columns is the conversion below.
     */
    const {
      depart_until: departUntilRaw,
      arrive_from: arriveFromRaw,
      arrive_until: arriveUntilRaw,
      ...restOfData
    } = data;

    await offer.update({
      ...restOfData,
      start_at: data.start_at ? new Date(data.start_at) : offer.start_at,
      /*
       * T-080 — the spread above would put the raw ISO STRINGS into three DATE
       * columns. `start_at` is converted for exactly this reason; the new
       * windows need the same treatment.
       * ⚠️ `undefined` (field not sent) must leave the stored value alone,
       * which is why this is a spread of conditionals rather than three
       * `?? offer.x` fallbacks — the latter would rewrite them on every save.
       */
      ...(departUntilRaw !== undefined
        ? { depart_until: departUntilRaw ? new Date(departUntilRaw) : null }
        : {}),
      ...(arriveFromRaw !== undefined
        ? { arrive_from: arriveFromRaw ? new Date(arriveFromRaw) : null }
        : {}),
      ...(arriveUntilRaw !== undefined
        ? { arrive_until: arriveUntilRaw ? new Date(arriveUntilRaw) : null }
        : {}),
      seats_free: seatsFree
    });

    // Update stops if provided (allows editing stops for all offer statuses)
    if (data.stops !== undefined) {
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

    // Get all confirmed passengers before cancelling
    const confirmedPassengers = await OfferPassenger.findAll({
      where: {
        offer_id: offerId,
        status: 'confirmed'
      },
      include: [
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
        }
      ]
    });

    await offer.update({ status: 'cancelled' });

    // Send push notifications to all confirmed passengers. Resolved per
    // passenger — this is a list of different people, and it used to be written
    // in the cancelling driver's language for all of them.
    if (confirmedPassengers.length > 0) {
      await Promise.all(
        confirmedPassengers.map(async (passengerJoin) => {
          const passengerLanguage = await getUserLanguage(passengerJoin.passenger_id);
          await this.notifyPassenger(passengerJoin.passenger_id, {
            type: 'offer_cancelled_by_driver',
            title: t('push.offerCancelledByDriverTitle', passengerLanguage),
            body: t('push.offerCancelledByDriverBody', passengerLanguage, {
              from: offer.from_text,
              to: offer.to_text
            }),
            data: {
              type: 'offer_cancelled_by_driver',
              offer_id: String(offer.id),
              passenger_join_id: passengerJoin.id
            }
          }, passengerLanguage);
        })
      );
    }

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'driver.offer.cancel',
        payload: { offer_id: offer.id, notified_passengers: confirmedPassengers.length },
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
    from_province_id?: number;
    from_city_id?: number;
    to_province_id?: number;
    to_city_id?: number;
    min_rating?: number;
    max_price?: number;
    min_price?: number;
    vehicle_type?: string;
    vehicle_make?: string;
    vehicle_color?: string;
    sort_by?: string;
    limit?: number;
    offset?: number;
  }) {
    const whereConditions: any[] = [
      { status: 'published' },
      { start_at: { [Op.gte]: new Date() } } // Only future offers
    ];

    // Filter by "From" location geo
    if (filters.from_city_id) {
      const city = await GeoCityDistrict.findByPk(filters.from_city_id);
      if (city) {
        whereConditions.push({ from_text: { [Op.iLike]: `%${city.name}%` } });
      }
    } else if (filters.from_province_id) {
      const province = await GeoProvince.findByPk(filters.from_province_id);
      if (province) {
        whereConditions.push({ from_text: { [Op.iLike]: `%${province.name}%` } });
      }
    }

    // Filter by "To" location geo
    if (filters.to_city_id) {
      const city = await GeoCityDistrict.findByPk(filters.to_city_id);
      if (city) {
        whereConditions.push({ to_text: { [Op.iLike]: `%${city.name}%` } });
      }
    } else if (filters.to_province_id) {
      const province = await GeoProvince.findByPk(filters.to_province_id);
      if (province) {
        whereConditions.push({ to_text: { [Op.iLike]: `%${province.name}%` } });
      }
    }

    // Filter by from/to text (simple text search for MVP)
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

    // Filter by price range
    if (filters.min_price) {
      whereConditions.push({ price_per_seat: { [Op.gte]: filters.min_price } });
    }
    if (filters.max_price) {
      whereConditions.push({ price_per_seat: { [Op.lte]: filters.max_price } });
    }

    const where = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

    // Build vehicle include with filters
    const vehicleInclude: any = {
      model: DriverVehicle,
      as: 'vehicle',
      // T-077: `fuel_types` feeds the "Propan" / "Benzin" line on the passenger's
      // offer card. Without it here the column is simply absent from the row.
      attributes: ['id', 'license_plate', 'year', 'fuel_types'],
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
    };

    // Add vehicle filters
    const vehicleWhere: any = {};
    if (filters.vehicle_type) {
      vehicleInclude.include[0].where = { name: { [Op.iLike]: `%${filters.vehicle_type}%` } };
      vehicleInclude.include[0].required = true;
    }
    if (filters.vehicle_make) {
      vehicleInclude.include[1].where = { name: { [Op.iLike]: `%${filters.vehicle_make}%` } };
      vehicleInclude.include[1].required = true;
    }
    if (filters.vehicle_color) {
      vehicleInclude.include[3].where = { name: { [Op.iLike]: `%${filters.vehicle_color}%` } };
      vehicleInclude.include[3].required = true;
    }

    // Determine sort order
    let order: any[] = [['start_at', 'ASC']]; // Default sort
    if (filters.sort_by) {
      switch (filters.sort_by) {
        case 'price_asc':
          order = [['price_per_seat', 'ASC']];
          break;
        case 'price_desc':
          order = [['price_per_seat', 'DESC']];
          break;
        case 'date_asc':
          order = [['start_at', 'ASC']];
          break;
        case 'rating_desc':
          // Rating sort will be handled after fetching
          order = [['start_at', 'ASC']];
          break;
      }
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
        vehicleInclude
      ],
      limit: filters.limit || 20,
      offset: filters.offset || 0,
      order
    });

    // Get driver IDs to fetch ratings
    const driverIds = offers.map((offer: any) => offer.user_id);
    
    // Fetch ratings for all drivers
    const ratingsMap = new Map<number, { average: number; count: number }>();
    if (driverIds.length > 0) {
      const ratings = await DriverRating.findAll({
        where: { driver_id: { [Op.in]: driverIds } },
        attributes: [
          'driver_id',
          [fn('AVG', col('rating')), 'avg_rating'],
          [fn('COUNT', col('id')), 'rating_count']
        ],
        group: ['driver_id'],
        raw: true
      });

      ratings.forEach((r: any) => {
        ratingsMap.set(r.driver_id, {
          average: parseFloat(r.avg_rating) || 0,
          count: parseInt(r.rating_count) || 0
        });
      });
    }

    /*
     * T-083 — which seats are actually free, front vs back.
     *
     * 🔴 `seats_free` is ONE pool number, so the app could not tell a free front
     * seat from a free back one and T-077's card greyed a price for the wrong
     * reason ("no price set" instead of "taken").
     *
     * ⚠️ **`confirmed` only.** `OfferPassengerService` says so explicitly —
     * *"pending requests do not reserve it; whoever the driver confirms first
     * gets it"*. Counting pending rows here would hide a seat that is still
     * winnable and lose the driver a booking.
     *
     * ⚠️ One grouped query, not one per offer — the same shape as `ratingsMap`
     * above, because this runs on every search.
     */
    const seatsTakenMap = new Map<number, { frontTaken: boolean; backTaken: number }>();
    const offerIds = offers.map((offer: any) => offer.id);
    if (offerIds.length > 0) {
      const takenRows = await OfferPassenger.findAll({
        where: { offer_id: { [Op.in]: offerIds }, status: 'confirmed' },
        attributes: [
          'offer_id',
          'is_front_seat',
          [fn('SUM', col('seats_requested')), 'seats']
        ],
        group: ['offer_id', 'is_front_seat'],
        raw: true
      });

      takenRows.forEach((row: any) => {
        const current = seatsTakenMap.get(row.offer_id) ?? {
          frontTaken: false,
          backTaken: 0
        };
        if (row.is_front_seat) {
          current.frontTaken = true;
        } else {
          // pg returns SUM() as a string.
          current.backTaken += parseInt(row.seats, 10) || 0;
        }
        seatsTakenMap.set(row.offer_id, current);
      });
    }

    // Map offers with ratings
    let mappedOffers = offers.map((offer) => {
      const offerWithIncludes = offer as any;
      const driverRating = ratingsMap.get(offer.user_id) || { average: 0, count: 0 };

      /*
       * T-083 — front/back availability.
       *
       * ⚠️ "There is only one front seat in the car" is the system's existing
       * rule (`OfferPassengerService:315`), so the front is 1 seat and the rest
       * are back seats.
       * ⚠️ A driver who set NO `front_price_per_seat` is not selling the front
       * seat at all — then every seat is a back seat, and `front_seat_available`
       * is false for a different reason than "taken". The app keeps the two
       * apart; see `frontOffered`.
       */
      const taken = seatsTakenMap.get(offer.id) ?? { frontTaken: false, backTaken: 0 };
      const frontOffered =
        offer.front_price_per_seat !== null && offer.front_price_per_seat !== undefined;
      const backTotal = frontOffered
        ? Math.max(0, offer.seats_total - 1)
        : offer.seats_total;

      return {
        id: offer.id,
        from_text: offer.from_text,
        to_text: offer.to_text,
        start_at: offer.start_at,
        price_per_seat: offer.price_per_seat,
        front_price_per_seat: offer.front_price_per_seat,
        // T-078 — the rest of the Narxlar list, plus payment and class. The
        // passenger's selection window (T-081) is built out of these.
        price_back_salon: offer.price_back_salon,
        price_whole_salon: offer.price_whole_salon,
        waiting_fee_per_min: offer.waiting_fee_per_min,
        free_waiting_min: offer.free_waiting_min,
        pickup_fee: offer.pickup_fee,
        payment_cash: offer.payment_cash,
        payment_card: offer.payment_card,
        vehicle_class: offer.vehicle_class,
        // T-079 / T-080 — the passenger's card and detail screen read these.
        air_conditioner: offer.air_conditioner,
        wifi: offer.wifi,
        roof_rack_needed: offer.roof_rack_needed,
        trailer: offer.trailer,
        parcel_accepted: offer.parcel_accepted,
        parcel_price: offer.parcel_price,
        parcel_max_kg: offer.parcel_max_kg,
        road_pickup: offer.road_pickup,
        road_pickup_note: offer.road_pickup_note,
        depart_until: offer.depart_until,
        arrive_from: offer.arrive_from,
        arrive_until: offer.arrive_until,
        departs_when_full: offer.departs_when_full,
        currency: offer.currency,
        seats_free: offer.seats_free,
        seats_total: offer.seats_total,
        // T-083 — so the card can grey a price that is TAKEN, not merely unset.
        front_offered: frontOffered,
        front_seat_available: frontOffered && !taken.frontTaken,
        back_seats_free: Math.max(0, backTotal - taken.backTaken),
        note: offer.note,
        driver: {
          id: offerWithIncludes.user?.id,
          name: offerWithIncludes.user?.display_name || 
                `${offerWithIncludes.user?.first_name || ''} ${offerWithIncludes.user?.last_name || ''}`.trim(),
          rating: Math.round(driverRating.average * 10) / 10,
          rating_count: driverRating.count
        },
        vehicle: {
          make: offerWithIncludes.vehicle?.make?.name,
          model: offerWithIncludes.vehicle?.model?.name,
          color: offerWithIncludes.vehicle?.color?.name,
          type: offerWithIncludes.vehicle?.type?.name,
          license_plate: offerWithIncludes.vehicle?.license_plate,
          year: offerWithIncludes.vehicle?.year,
          /*
           * T-077 — the whole ARRAY, not a chosen one.
           *
           * ⚠️ A car here commonly runs on two fuels (benzine + propan is the
           * normal Uzbek conversion). Picking `[0]` server-side would quietly
           * assert something the driver never said; the app decides how to fit
           * them in the card.
           */
          fuel_types: offerWithIncludes.vehicle?.fuel_types ?? []
        }
      };
    });

    // Filter by minimum rating if specified
    if (filters.min_rating) {
      mappedOffers = mappedOffers.filter(offer => offer.driver.rating >= filters.min_rating!);
    }

    // Sort by rating if requested
    if (filters.sort_by === 'rating_desc') {
      mappedOffers.sort((a, b) => b.driver.rating - a.driver.rating);
    }

    return {
      items: mappedOffers,
      total: mappedOffers.length // Adjusted total after rating filter
    };
  }

  /**
   * Send push notification to passenger
   */
  private static async notifyPassenger(
    passengerId: number,
    notification: {
      type: string;
      title: string;
      body: string;
      data: Record<string, string>;
    },
    language: Language = 'uz'
  ) {
    // T-045: record it BEFORE sending, and OUTSIDE the try below, so a push
    // that fails (stale token, FCM down) still leaves the user a record. The
    // helper never throws — a notification must not fail a ride.
    await NotificationService.recordPush(passengerId, notification);

    try {
      // Get passenger's push tokens (only user app tokens)
      const tokens = await PushToken.findAll({
        where: { 
          user_id: passengerId, 
          app: 'user',
          is_active: true 
        }
      });

      if (tokens.length === 0) {
        console.log(`No active push tokens found for passenger ${passengerId} (user app)`);
        return;
      }

      console.log(`Sending push notification to passenger ${passengerId} (${tokens.length} tokens)`);

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
            console.log(`✅ Push sent to passenger ${passengerId} token: ${token.token.substring(0, 20)}...`);
          } catch (error) {
            console.error(`Failed to send push to passenger ${passengerId}:`, error);
            // Deactivate invalid tokens
            if (error instanceof Error && (error.message.includes('invalid') || error.message.includes('not-registered'))) {
              await token.update({ is_active: false });
              console.log(`Deactivated invalid token for passenger ${passengerId}`);
            }
          }
        })
      );
    } catch (error) {
      console.error('Error sending push notification to passenger:', error);
    }
  }
}

