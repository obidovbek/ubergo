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
  PushToken,
} from '../database/models/index.js';
import type {
  PassengerOfferAttributes,
  PassengerOfferCreationAttributes,
  PassengerOfferPaymentType,
  PassengerOfferSalonScope,
  PassengerOfferSeatCounts,
  PassengerOfferSpecialOrder,
  PassengerOfferStatus,
  PassengerOfferVehicleClass,
  PassengerOfferVehicleType,
} from '../database/models/PassengerOffer.js';
import { AppError } from '../errors/AppError.js';
import { logAudit } from '../utils/auditLogger.js';
import PushService from './PushService.js';
import type { Request } from 'express';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { t } from '../i18n/translator.js';
import type { Language } from '../i18n/types.js';
import { getUserLanguage } from '../utils/userLanguage.js';

interface CreatePassengerOfferData {
  from_text: string;
  from_lat?: number;
  from_lng?: number;
  from_country_id?: number;
  from_province_id?: number;
  from_city_id?: number;
  from_settlement_id?: number | null;
  from_landmark?: string | null;
  to_text: string;
  to_lat?: number;
  to_lng?: number;
  to_country_id?: number;
  to_province_id?: number;
  to_city_id?: number;
  to_settlement_id?: number | null;
  to_landmark?: string | null;
  start_at: string | Date;
  depart_until?: string | Date | null;
  arrive_from?: string | Date | null;
  arrive_until?: string | Date | null;
  is_urgent?: boolean;
  /** Optional since T-018 — derived from seat_counts / salon_scope when absent. */
  seats_needed?: number;
  /** Optional since T-018 — the new order form collects no price at all. */
  max_price_per_seat?: number | null;
  currency?: string;
  payment_type?: PassengerOfferPaymentType | null;
  payer_phone?: string | null;
  seat_counts?: PassengerOfferSeatCounts | null;
  seat_position_any?: boolean;
  salon_scope?: PassengerOfferSalonScope | null;
  vehicle_class?: PassengerOfferVehicleClass | null;
  vehicle_types?: PassengerOfferVehicleType[] | null;
  front_seat?: boolean;
  pets?: boolean;
  large_baggage?: boolean;
  woman_in_car?: boolean;
  roof_rack_needed?: boolean;
  trailer?: boolean;
  road_pickup?: boolean;
  road_pickup_note?: string | null;
  special_order?: PassengerOfferSpecialOrder | null;
  note?: string | null;
}

interface UpdatePassengerOfferData extends Partial<CreatePassengerOfferData> {}

/** The columns a client may write — never user_id, status or the timestamps. */
type PassengerOfferWritableFields = Partial<
  Omit<
    PassengerOfferAttributes,
    'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'
  >
>;

interface PassengerOfferFilters {
  status?: PassengerOfferStatus | PassengerOfferStatus[];
  from?: Date;
  to?: Date;
}

export class PassengerOfferService {
  // Minimum advance time for offers (30 minutes) — not applied to urgent offers
  private static MIN_ADVANCE_MINUTES = 30;

  // Minimum price per seat (in UZS)
  private static MIN_PRICE_UZS = 5000;

  private static MIN_SEATS = 1;
  private static MAX_SEATS = 8;
  private static MAX_FRONT_SEATS = 2;
  private static MAX_BACK_SEATS = 4;

  // Seats a salon booking takes (standard sedan) — seat_counts is null then
  private static SALON_SCOPE_SEATS: Record<PassengerOfferSalonScope, number> = {
    whole_salon: 4,
    back_salon_full: 3,
  };

  // Stored as VARCHAR/JSONB, so the allowed values live here, not in Postgres
  private static PAYMENT_TYPES: readonly PassengerOfferPaymentType[] = [
    'cash',
    'click_payme',
    'friend_pays',
  ];
  private static SALON_SCOPES: readonly PassengerOfferSalonScope[] = [
    'whole_salon',
    'back_salon_full',
  ];
  private static VEHICLE_CLASSES: readonly PassengerOfferVehicleClass[] = [
    'standard',
    'comfort',
    'business',
    'econom',
    'tourist',
  ];
  private static VEHICLE_TYPES: readonly PassengerOfferVehicleType[] = [
    'minivan',
    'damas',
    'microbus',
  ];

  private static SEAT_COUNT_KEYS = [
    'front_male',
    'front_female',
    'back_male',
    'back_female',
  ] as const;

  private static SPECIAL_ORDER_PRICE_KEYS = [
    'price_front',
    'price_back',
    'price_back_salon',
    'price_whole_salon',
  ] as const;

  // Loose on purpose: the payer may be a foreign number (the Figma shows +33)
  private static PAYER_PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;

  /**
   * Parse a date coming from JSON. '' / null / undefined mean "no value".
   */
  private static parseDate(value: unknown, field: string): Date | null {
    if (value === null || value === undefined || value === '') return null;

    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      throw new AppError(`${field} is not a valid date`, 400);
    }
    return date;
  }

  /**
   * Trim a text field to null; reject anything longer than its column.
   */
  private static parseText(
    value: unknown,
    field: string,
    maxLength?: number
  ): string | null {
    if (value === null || value === undefined) return null;

    const text = String(value).trim();
    if (text === '') return null;
    if (maxLength !== undefined && text.length > maxLength) {
      throw new AppError(
        `${field} must be at most ${maxLength} characters`,
        400
      );
    }
    return text;
  }

  private static parseNumber(value: unknown, field: string): number | null {
    if (value === null || value === undefined || value === '') return null;

    const num = Number(value);
    if (!Number.isFinite(num)) {
      throw new AppError(`${field} must be a number`, 400);
    }
    return num;
  }

  private static parseId(value: unknown, field: string): number | null {
    if (value === null || value === undefined || value === '') return null;

    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(`${field} must be a positive integer`, 400);
    }
    return id;
  }

  private static parseEnum<T extends string>(
    value: unknown,
    allowed: readonly T[],
    field: string
  ): T | null {
    if (value === null || value === undefined || value === '') return null;

    const candidate = String(value) as T;
    if (!allowed.includes(candidate)) {
      throw new AppError(`${field} must be one of: ${allowed.join(', ')}`, 400);
    }
    return candidate;
  }

  /**
   * { front_male, front_female, back_male, back_female } — an all-zero
   * breakdown means "not set" so the caller can fall back to seats_needed.
   */
  private static parseSeatCounts(
    value: unknown
  ): PassengerOfferSeatCounts | null {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new AppError('seat_counts must be an object', 400);
    }

    const source = value as Record<string, unknown>;
    const counts: PassengerOfferSeatCounts = {
      front_male: 0,
      front_female: 0,
      back_male: 0,
      back_female: 0,
    };

    for (const key of this.SEAT_COUNT_KEYS) {
      const raw = source[key];
      if (raw === undefined || raw === null || raw === '') continue;

      const count = Number(raw);
      if (!Number.isInteger(count) || count < 0) {
        throw new AppError(
          `seat_counts.${key} must be a non-negative integer`,
          400
        );
      }
      counts[key] = count;
    }

    if (counts.front_male + counts.front_female > this.MAX_FRONT_SEATS) {
      throw new AppError(
        `seat_counts front seats must not exceed ${this.MAX_FRONT_SEATS}`,
        400
      );
    }
    if (counts.back_male + counts.back_female > this.MAX_BACK_SEATS) {
      throw new AppError(
        `seat_counts back seats must not exceed ${this.MAX_BACK_SEATS}`,
        400
      );
    }

    return this.sumSeatCounts(counts) > 0 ? counts : null;
  }

  private static sumSeatCounts(counts: PassengerOfferSeatCounts): number {
    return (
      counts.front_male +
      counts.front_female +
      counts.back_male +
      counts.back_female
    );
  }

  private static parseVehicleTypes(
    value: unknown
  ): PassengerOfferVehicleType[] | null {
    if (value === null || value === undefined) return null;
    if (!Array.isArray(value)) {
      throw new AppError('vehicle_types must be an array', 400);
    }

    const types = value
      .map((item) => this.parseEnum(item, this.VEHICLE_TYPES, 'vehicle_types'))
      .filter((item): item is PassengerOfferVehicleType => item !== null);

    return types.length > 0 ? [...new Set(types)] : null;
  }

  /**
   * Special order — data only. Nothing is charged here; real payments are T-006.
   */
  private static parseSpecialOrder(
    value: unknown
  ): PassengerOfferSpecialOrder | null {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new AppError('special_order must be an object', 400);
    }

    const source = value as Record<string, unknown>;
    const money = (key: string): number | null => {
      const amount = this.parseNumber(source[key], `special_order.${key}`);
      if (amount !== null && amount < 0) {
        throw new AppError(`special_order.${key} must not be negative`, 400);
      }
      return amount;
    };

    const special: PassengerOfferSpecialOrder = {
      price_front: money('price_front'),
      price_back: money('price_back'),
      price_back_salon: money('price_back_salon'),
      price_whole_salon: money('price_whole_salon'),
      review_driver_offers: source.review_driver_offers === true,
      fixed_price: source.fixed_price === true,
      waiting_fee_per_min: money('waiting_fee_per_min'),
      free_waiting_min: money('free_waiting_min'),
    };

    const hasPrice = this.SPECIAL_ORDER_PRICE_KEYS.some(
      (key) => special[key] != null
    );
    if (!hasPrice) {
      throw new AppError('special_order requires at least one seat price', 400);
    }

    return special;
  }

  /**
   * Turn a request body into the exact set of columns to write.
   *
   * Only whitelisted keys survive — the body must never be spread into the
   * model, that would let a client set user_id or status. Keys the client did
   * not send are left out entirely, so a PATCH stays partial.
   *
   * @param current the stored offer on update; omitted on create
   */
  private static buildOfferFields(
    data: CreatePassengerOfferData | UpdatePassengerOfferData,
    current?: PassengerOffer
  ): PassengerOfferWritableFields {
    const isUpdate = current !== undefined;
    const body = data as Record<string, unknown>;
    const sent = (key: string) => body[key] !== undefined;
    const fields: PassengerOfferWritableFields = {};

    // ── Route ───────────────────────────────────────────────────────────────
    for (const key of ['from_text', 'to_text'] as const) {
      if (sent(key)) {
        const text = this.parseText(body[key], key);
        if (!text) throw new AppError(`${key} is required`, 400);
        fields[key] = text;
      } else if (!isUpdate) {
        throw new AppError(`${key} is required`, 400);
      }
    }

    for (const key of ['from_lat', 'from_lng', 'to_lat', 'to_lng'] as const) {
      if (sent(key)) fields[key] = this.parseNumber(body[key], key);
    }

    for (const key of [
      'from_country_id',
      'from_province_id',
      'from_city_id',
      'from_settlement_id',
      'to_country_id',
      'to_province_id',
      'to_city_id',
      'to_settlement_id',
    ] as const) {
      if (sent(key)) fields[key] = this.parseId(body[key], key);
    }

    // mo'ljal — VARCHAR(255)
    for (const key of ['from_landmark', 'to_landmark'] as const) {
      if (sent(key)) fields[key] = this.parseText(body[key], key, 255);
    }

    // ── Departure / arrival windows ─────────────────────────────────────────
    if (sent('start_at')) {
      const startAt = this.parseDate(body.start_at, 'start_at');
      if (!startAt) throw new AppError('start_at is required', 400);
      fields.start_at = startAt;
    } else if (!isUpdate) {
      throw new AppError('start_at is required', 400);
    }

    for (const key of [
      'depart_until',
      'arrive_from',
      'arrive_until',
    ] as const) {
      if (sent(key)) fields[key] = this.parseDate(body[key], key);
    }

    if (sent('is_urgent')) fields.is_urgent = Boolean(body.is_urgent);
    const isUrgent =
      (sent('is_urgent') ? fields.is_urgent : current?.is_urgent) ?? false;
    // ⚡ "hoziroq" — leaving right now, so there is no departure window
    if (isUrgent) fields.depart_until = null;

    // ── Payment ─────────────────────────────────────────────────────────────
    if (sent('max_price_per_seat')) {
      fields.max_price_per_seat = this.parseNumber(
        body.max_price_per_seat,
        'max_price_per_seat'
      );
    }
    if (sent('currency')) {
      const currency = this.parseText(body.currency, 'currency', 3);
      if (currency) fields.currency = currency.toUpperCase();
    }
    if (sent('payment_type')) {
      fields.payment_type = this.parseEnum(
        body.payment_type,
        this.PAYMENT_TYPES,
        'payment_type'
      );
    }
    if (sent('payer_phone')) {
      const phone = this.parseText(body.payer_phone, 'payer_phone', 20);
      if (phone && !this.PAYER_PHONE_REGEX.test(phone)) {
        throw new AppError('payer_phone is not a valid phone number', 400);
      }
      fields.payer_phone = phone;
    }

    // ── Seats ───────────────────────────────────────────────────────────────
    if (sent('seat_position_any'))
      fields.seat_position_any = Boolean(body.seat_position_any);
    if (sent('salon_scope')) {
      fields.salon_scope = this.parseEnum(
        body.salon_scope,
        this.SALON_SCOPES,
        'salon_scope'
      );
    }
    if (sent('seat_counts'))
      fields.seat_counts = this.parseSeatCounts(body.seat_counts);

    const salonScope =
      (sent('salon_scope') ? fields.salon_scope : current?.salon_scope) ?? null;
    let seatCounts =
      (sent('seat_counts') ? fields.seat_counts : current?.seat_counts) ?? null;

    // A salon booking takes the whole (back) salon — a per-gender breakdown
    // would contradict it.
    if (salonScope && seatCounts) {
      seatCounts = null;
      fields.seat_counts = null;
    }

    // seats_needed is derived, not trusted: the old list screens and the admin
    // panel read it, so it must always equal what was actually requested.
    if (
      !isUpdate ||
      sent('seats_needed') ||
      sent('seat_counts') ||
      sent('salon_scope')
    ) {
      const requested = sent('seats_needed') ? Number(body.seats_needed) : null;
      const fallback = requested ?? current?.seats_needed ?? null;
      const seatsNeeded = salonScope
        ? this.SALON_SCOPE_SEATS[salonScope]
        : seatCounts
          ? this.sumSeatCounts(seatCounts)
          : fallback;

      if (seatsNeeded === null) {
        throw new AppError(
          'seats_needed, seat_counts or salon_scope is required',
          400
        );
      }
      if (
        !Number.isInteger(seatsNeeded) ||
        seatsNeeded < this.MIN_SEATS ||
        seatsNeeded > this.MAX_SEATS
      ) {
        throw new AppError(
          `seats_needed must be between ${this.MIN_SEATS} and ${this.MAX_SEATS}`,
          400
        );
      }
      fields.seats_needed = seatsNeeded;
    }

    // ── Vehicle wishes ──────────────────────────────────────────────────────
    if (sent('vehicle_class')) {
      fields.vehicle_class = this.parseEnum(
        body.vehicle_class,
        this.VEHICLE_CLASSES,
        'vehicle_class'
      );
    }
    if (sent('vehicle_types'))
      fields.vehicle_types = this.parseVehicleTypes(body.vehicle_types);

    // ── Flags & free text ───────────────────────────────────────────────────
    for (const key of [
      'front_seat',
      'pets',
      'large_baggage',
      'woman_in_car',
      'roof_rack_needed',
      'trailer',
      'road_pickup',
    ] as const) {
      if (sent(key)) fields[key] = Boolean(body[key]);
    }

    if (sent('road_pickup_note')) {
      fields.road_pickup_note = this.parseText(
        body.road_pickup_note,
        'road_pickup_note'
      );
    }
    if (sent('note')) fields.note = this.parseText(body.note, 'note');
    if (sent('special_order'))
      fields.special_order = this.parseSpecialOrder(body.special_order);

    this.validateOfferData(fields, current);

    return fields;
  }

  /**
   * Cross-field rules, checked on the merged (patch + stored) offer so that a
   * PATCH cannot leave the row inconsistent.
   */
  private static validateOfferData(
    fields: PassengerOfferWritableFields,
    current?: PassengerOffer
  ) {
    const has = (key: keyof PassengerOfferWritableFields) => key in fields;
    const merged = {
      start_at: (has('start_at') ? fields.start_at : current?.start_at) ?? null,
      is_urgent:
        (has('is_urgent') ? fields.is_urgent : current?.is_urgent) ?? false,
      depart_until:
        (has('depart_until') ? fields.depart_until : current?.depart_until) ??
        null,
      arrive_from:
        (has('arrive_from') ? fields.arrive_from : current?.arrive_from) ??
        null,
      arrive_until:
        (has('arrive_until') ? fields.arrive_until : current?.arrive_until) ??
        null,
      currency:
        (has('currency') ? fields.currency : current?.currency) ?? 'UZS',
      payment_type:
        (has('payment_type') ? fields.payment_type : current?.payment_type) ??
        null,
      payer_phone:
        (has('payer_phone') ? fields.payer_phone : current?.payer_phone) ??
        null,
    };

    // Urgent offers leave now, so the 30-minute rule only guards planned ones.
    if (fields.start_at && !merged.is_urgent) {
      const minStartAt = new Date(
        Date.now() + this.MIN_ADVANCE_MINUTES * 60 * 1000
      );

      if (fields.start_at < minStartAt) {
        throw new AppError(
          `start_at must be at least ${this.MIN_ADVANCE_MINUTES} minutes in the future`,
          400
        );
      }
    }

    if (
      merged.start_at &&
      merged.depart_until &&
      merged.depart_until < merged.start_at
    ) {
      throw new AppError('depart_until must not be before start_at', 400);
    }
    if (
      merged.start_at &&
      merged.arrive_from &&
      merged.arrive_from < merged.start_at
    ) {
      throw new AppError('arrive_from must not be before start_at', 400);
    }
    if (
      merged.arrive_from &&
      merged.arrive_until &&
      merged.arrive_until < merged.arrive_from
    ) {
      throw new AppError('arrive_until must not be before arrive_from', 400);
    }

    // Price is optional since T-018 (the new form has no price field) — it is
    // validated only when the client actually sends one.
    const price = has('max_price_per_seat') ? fields.max_price_per_seat : null;
    if (price !== null && price !== undefined) {
      if (price <= 0) {
        throw new AppError('max_price_per_seat must be greater than 0', 400);
      }
      if (merged.currency === 'UZS' && price < this.MIN_PRICE_UZS) {
        throw new AppError(
          `max_price_per_seat must be at least ${this.MIN_PRICE_UZS} UZS`,
          400
        );
      }
    }

    if (merged.payment_type === 'friend_pays' && !merged.payer_phone) {
      throw new AppError(
        'payer_phone is required when payment_type is friend_pays',
        400
      );
    }
  }

  /**
   * Get user's passenger offers with filters
   */
  static async getUserOffers(
    userId: number,
    filters: PassengerOfferFilters = {}
  ) {
    const where: any = { user_id: userId };

    // Filter by status
    if (filters.status) {
      const validStatuses: PassengerOfferStatus[] = [
        'published',
        'driver_found',
        'archived',
        'cancelled',
        'completed',
      ];

      if (Array.isArray(filters.status)) {
        const filteredStatuses = filters.status.filter(
          (s): s is PassengerOfferStatus =>
            validStatuses.includes(s as PassengerOfferStatus)
        );
        const uniqueStatuses = [...new Set(filteredStatuses)];

        if (uniqueStatuses.length > 0) {
          where.status = { [Op.in]: uniqueStatuses };
        }
      } else if (
        validStatuses.includes(filters.status as PassengerOfferStatus)
      ) {
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
              attributes: ['id', 'first_name', 'last_name', 'display_name'],
            },
            {
              model: DriverVehicle,
              as: 'vehicle',
              include: [
                {
                  model: VehicleType,
                  as: 'type',
                  attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en'],
                },
                {
                  model: VehicleMake,
                  as: 'make',
                  attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en'],
                },
                {
                  model: VehicleModel,
                  as: 'model',
                  attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en'],
                },
                {
                  model: VehicleColor,
                  as: 'color',
                  attributes: ['id', 'name', 'name_uz', 'name_ru', 'name_en'],
                },
              ],
            },
          ],
        },
      ],
      order: [['start_at', 'DESC']],
    });

    return offers;
  }

  /**
   * Get offer by ID
   *
   * Without a userId this is the public (driver-facing) view, which must not
   * expose the payer's phone number — a third party who never used the app.
   */
  static async getOfferById(offerId: string, userId?: number) {
    const isOwnerView = userId !== undefined;

    // The id reaches this from a public URL segment. Handing Postgres 'abc' for
    // an integer column raises a database error the handler turns into a 500,
    // so a bad id has to become a plain 404 here.
    if (!/^\d+$/.test(String(offerId))) {
      throw new AppError('Offer not found', 404);
    }

    const offer = await PassengerOffer.findByPk(offerId, {
      attributes: { exclude: isOwnerView ? [] : ['payer_phone'] },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'display_name'],
        },
        // Only the passenger who owns the offer sees who bid on it. This route
        // is also served unauthenticated to drivers, and the rival bids (name,
        // plate, price) are none of their business.
        ...(isOwnerView
          ? [
              {
                model: OfferDriver,
                as: 'drivers',
                required: false,
                include: [
                  {
                    model: User,
                    as: 'driver',
                    attributes: [
                      'id',
                      'first_name',
                      'last_name',
                      'display_name',
                    ],
                  },
                  {
                    model: DriverVehicle,
                    as: 'vehicle',
                    include: [
                      {
                        model: VehicleType,
                        as: 'type',
                        attributes: [
                          'id',
                          'name',
                          'name_uz',
                          'name_ru',
                          'name_en',
                        ],
                      },
                      {
                        model: VehicleMake,
                        as: 'make',
                        attributes: [
                          'id',
                          'name',
                          'name_uz',
                          'name_ru',
                          'name_en',
                        ],
                      },
                      {
                        model: VehicleModel,
                        as: 'model',
                        attributes: [
                          'id',
                          'name',
                          'name_uz',
                          'name_ru',
                          'name_en',
                        ],
                      },
                      {
                        model: VehicleColor,
                        as: 'color',
                        attributes: [
                          'id',
                          'name',
                          'name_uz',
                          'name_ru',
                          'name_en',
                        ],
                      },
                    ],
                  },
                ],
              },
            ]
          : []),
      ],
    });

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    // Check ownership if userId provided
    if (userId !== undefined && offer.user_id !== userId) {
      throw new AppError(
        'You do not have permission to access this offer',
        403
      );
    }

    return offer;
  }

  /**
   * Create new passenger offer
   */
  static async createOffer(
    userId: number,
    data: CreatePassengerOfferData,
    req?: Request
  ) {
    // Whitelist + validate (throws AppError(400) on anything malformed)
    const fields = this.buildOfferFields(data);

    // Create offer
    const offer = await PassengerOffer.create({
      ...fields,
      user_id: userId,
      status: 'published',
    } as PassengerOfferCreationAttributes);

    // Reload offer
    const offerWithDetails = await this.getOfferById(String(offer.id), userId);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'passenger.offer.create',
        payload: { offer_id: offer.id, from: data.from_text, to: data.to_text },
        req,
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

    // Whitelist + validate against the stored row (partial patch)
    const fields = this.buildOfferFields(data, offer);

    // Update offer
    await offer.update(fields);

    // Reload offer
    const offerWithDetails = await this.getOfferById(offerId, userId);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'passenger.offer.update',
        payload: { offer_id: offer.id, changes: Object.keys(fields) },
        req,
      });
    }

    return offerWithDetails;
  }

  /**
   * Cancel offer (published | driver_found → cancelled)
   *
   * A passenger who already picked a driver must still be able to call it off —
   * the confirmed driver is notified below along with everyone still waiting.
   */
  static async cancelOffer(offerId: string, userId: number, req?: Request) {
    const offer = await this.getOfferById(offerId, userId);

    if (!['published', 'driver_found'].includes(offer.status)) {
      throw new AppError(
        'Only published or matched offers can be cancelled',
        400
      );
    }

    // Get all pending and confirmed drivers before cancelling
    const interestedDrivers = await OfferDriver.findAll({
      where: {
        offer_id: offerId,
        status: { [Op.in]: ['pending', 'confirmed'] },
      },
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'first_name', 'last_name', 'display_name'],
        },
      ],
    });

    await offer.update({ status: 'cancelled' });

    // Send push notifications to all interested drivers. The language is
    // resolved per driver — this is a list of different people, and it used to
    // be written in the cancelling passenger's language for all of them.
    if (interestedDrivers.length > 0) {
      await Promise.all(
        interestedDrivers.map(async (driverJoin) => {
          const driverLanguage = await getUserLanguage(driverJoin.driver_id);
          await this.notifyDriver(
            driverJoin.driver_id,
            {
              type: 'offer_cancelled_by_passenger',
              title: t('push.offerCancelledByPassengerTitle', driverLanguage),
              body: t('push.offerCancelledByPassengerBody', driverLanguage, {
                from: offer.from_text,
                to: offer.to_text,
              }),
              data: {
                type: 'offer_cancelled_by_passenger',
                offer_id: String(offer.id),
                driver_join_id: driverJoin.id,
              },
            },
            driverLanguage
          );
        })
      );
    }

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'passenger.offer.cancel',
        payload: {
          offer_id: offer.id,
          notified_drivers: interestedDrivers.length,
        },
        req,
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
      throw new AppError(
        'Only archived or cancelled offers can be published',
        400
      );
    }

    await offer.update({ status: 'published' });

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'passenger.offer.publish',
        payload: { offer_id: offer.id },
        req,
      });
    }

    return offer;
  }

  /**
   * Archive offer
   */
  static async archiveOffer(offerId: string, userId: number, req?: Request) {
    const offer = await this.getOfferById(offerId, userId);

    // Archiving an offer that already has a confirmed driver would strand him
    // with no notification. Cancel it instead — that path tells him.
    if (offer.status === 'driver_found') {
      throw new AppError(
        'Cancel the offer instead — a driver is already confirmed',
        400
      );
    }

    await offer.update({ status: 'archived' });

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'passenger.offer.archive',
        payload: { offer_id: offer.id },
        req,
      });
    }

    return offer;
  }

  /**
   * Complete offer
   */
  static async completeOffer(offerId: string, userId: number, req?: Request) {
    const offer = await this.getOfferById(offerId, userId);

    // 'completed' now means the ride actually happened, which requires a driver.
    // It used to be reachable straight from 'published' — an offer nobody ever
    // answered could be marked as a finished trip.
    if (offer.status !== 'driver_found') {
      throw new AppError(
        'Only offers with a confirmed driver can be completed',
        400
      );
    }

    await offer.update({ status: 'completed' });

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'passenger.offer.complete',
        payload: { offer_id: offer.id },
        req,
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
      throw new AppError(
        'Only archived or cancelled offers can be deleted',
        400
      );
    }

    await offer.destroy();

    // Audit log
    if (req) {
      await logAudit({
        userId: String(userId),
        action: 'passenger.offer.delete',
        payload: { offer_id: offer.id },
        req,
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
      { start_at: { [Op.gte]: new Date() } }, // Only future offers
    ];

    // Filter by from/to text
    if (filters.from_text) {
      whereConditions.push({
        from_text: { [Op.iLike]: `%${filters.from_text}%` },
      });
    }
    if (filters.to_text) {
      whereConditions.push({ to_text: { [Op.iLike]: `%${filters.to_text}%` } });
    }

    // Filter by date. An unparseable string yields an Invalid Date, which
    // Sequelize cannot serialise (RangeError → 500), so it is dropped instead.
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      if (Number.isNaN(startOfDay.getTime())) {
        throw new AppError('date is not a valid date', 400);
      }
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.push({
        start_at: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      });
    }

    // Filter by minimum seats
    if (filters.min_seats) {
      whereConditions.push({ seats_needed: { [Op.gte]: filters.min_seats } });
    }

    // Filter by max price.
    //
    // Offers from the new form carry no price at all (T-018) — the passenger
    // never states a budget, the driver names his own. A plain `<=` drops NULL,
    // so a driver who typed any budget used to get an empty list even though
    // most offers were relevant. Owner decision 2026-08-02: keep them in.
    if (filters.max_price) {
      whereConditions.push({
        [Op.or]: [
          { max_price_per_seat: { [Op.lte]: filters.max_price } },
          { max_price_per_seat: null },
        ],
      });
    }

    const where =
      whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

    // Determine sort order
    let order: any[] = [['start_at', 'ASC']]; // Default sort
    if (filters.sort_by) {
      switch (filters.sort_by) {
        // NULLS LAST: offers from the new form carry no price (T-018), they
        // must not crowd out the priced ones at the top of the list.
        case 'price_desc':
          order = [['max_price_per_seat', 'DESC NULLS LAST']];
          break;
        case 'price_asc':
          order = [['max_price_per_seat', 'ASC NULLS LAST']];
          break;
        case 'date_asc':
          order = [['start_at', 'ASC']];
          break;
        case 'seats_desc':
          order = [['seats_needed', 'DESC']];
          break;
      }
    }

    const { rows: offers, count: total } = await PassengerOffer.findAndCountAll(
      {
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'display_name'],
          },
        ],
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        order,
      }
    );

    const mappedOffers = offers.map((offer) => {
      const offerWithIncludes = offer as any;

      // payer_phone is deliberately absent — see getOfferById()
      return {
        id: offer.id,
        from_text: offer.from_text,
        from_landmark: offer.from_landmark,
        to_text: offer.to_text,
        to_landmark: offer.to_landmark,
        start_at: offer.start_at,
        depart_until: offer.depart_until,
        arrive_from: offer.arrive_from,
        arrive_until: offer.arrive_until,
        is_urgent: offer.is_urgent,
        max_price_per_seat: offer.max_price_per_seat,
        currency: offer.currency,
        payment_type: offer.payment_type,
        seats_needed: offer.seats_needed,
        seat_counts: offer.seat_counts,
        seat_position_any: offer.seat_position_any,
        salon_scope: offer.salon_scope,
        vehicle_class: offer.vehicle_class,
        vehicle_types: offer.vehicle_types,
        front_seat: offer.front_seat,
        pets: offer.pets,
        large_baggage: offer.large_baggage,
        woman_in_car: offer.woman_in_car,
        roof_rack_needed: offer.roof_rack_needed,
        trailer: offer.trailer,
        road_pickup: offer.road_pickup,
        road_pickup_note: offer.road_pickup_note,
        special_order: offer.special_order,
        note: offer.note,
        passenger: {
          id: offerWithIncludes.user?.id,
          name:
            offerWithIncludes.user?.display_name ||
            `${offerWithIncludes.user?.first_name || ''} ${offerWithIncludes.user?.last_name || ''}`.trim(),
        },
      };
    });

    return {
      items: mappedOffers,
      total,
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
    },
    language: Language = 'uz'
  ) {
    try {
      // Get driver's push tokens (only driver app tokens)
      const tokens = await PushToken.findAll({
        where: {
          user_id: driverId,
          app: 'driver',
          is_active: true,
        },
      });

      if (tokens.length === 0) {
        console.log(
          `No active push tokens found for driver ${driverId} (driver app)`
        );
        return;
      }

      console.log(
        `Sending push notification to driver ${driverId} (${tokens.length} tokens)`
      );

      // Send to all tokens
      await Promise.all(
        tokens.map(async (token) => {
          try {
            await PushService.send({
              token: token.token,
              title: notification.title,
              body: notification.body,
              data: notification.data,
            });
            console.log(
              `✅ Push sent to driver ${driverId} token: ${token.token.substring(0, 20)}...`
            );
          } catch (error) {
            console.error(`Failed to send push to driver ${driverId}:`, error);
            // Deactivate invalid tokens
            if (
              error instanceof Error &&
              (error.message.includes('invalid') ||
                error.message.includes('not-registered'))
            ) {
              await token.update({ is_active: false });
              console.log(`Deactivated invalid token for driver ${driverId}`);
            }
          }
        })
      );
    } catch (error) {
      console.error('Error sending push notification to driver:', error);
    }
  }
}
