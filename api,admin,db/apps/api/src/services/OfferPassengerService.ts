/**
 * Offer Passenger Service
 * Handles passenger joining/leaving driver offers and driver confirmations
 */

import { Op } from 'sequelize';
import {
  sequelize,
  OfferPassenger,
  DriverOffer,
  User,
  PushToken,
  DriverProfile,
  DriverVehicle,
  VehicleType,
  VehicleMake,
  VehicleModel,
  VehicleColor,
} from '../database/models/index.js';
import type { OfferPassengerStatus } from '../database/models/OfferPassenger.js';
import { AppError } from '../errors/AppError.js';
import { logAudit } from '../utils/auditLogger.js';
import PushService from './PushService.js';
import { NotificationService } from './NotificationService.js';
import type { Request } from 'express';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { getUserLanguage } from '../utils/userLanguage.js';
import { t } from '../i18n/translator.js';
import type { Language } from '../i18n/types.js';
import { isWithinMinutes, hasArrived } from '../utils/geo.js';

interface JoinOfferData {
  offer_id: number;
  seats_requested?: number;
  is_front_seat?: boolean;
  message?: string;
}

export class OfferPassengerService {
  /**
   * Passenger joins an offer (creates pending request)
   */
  static async joinOffer(passengerId: number, data: JoinOfferData, req?: Request) {
    const { offer_id, seats_requested = 1, is_front_seat = false, message } = data;
    const language = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';

    // Get offer with driver info
    const offer = await DriverOffer.findByPk(offer_id, {
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
          attributes: ['id', 'license_plate'],
          include: [
            {
              model: VehicleMake,
              as: 'make',
              attributes: ['name', 'name_uz', 'name_ru', 'name_en']
            },
            {
              model: VehicleModel,
              as: 'model',
              attributes: ['name', 'name_uz', 'name_ru', 'name_en']
            }
          ]
        }
      ]
    });

    if (!offer) {
      throw new AppError(t('offers.notFound', language), 404);
    }

    // Check if offer is published and in the future
    if (offer.status !== 'published') {
      throw new AppError(t('offers.notAvailable', language), 400);
    }

    if (new Date(offer.start_at) < new Date()) {
      throw new AppError(t('offers.alreadyStarted', language), 400);
    }

    // Check if passenger is the driver
    if (offer.user_id === passengerId) {
      throw new AppError(t('offers.cannotJoinOwn', language), 400);
    }

    // Check if passenger already has any join request (regardless of status)
    const existingJoin = await OfferPassenger.findOne({
      where: {
        offer_id,
        passenger_id: passengerId
      }
    });

    if (existingJoin) {
      // Handle different statuses with appropriate error messages
      if (existingJoin.status === 'pending' || existingJoin.status === 'confirmed') {
        throw new AppError(t('offers.alreadyJoined', language), 400);
      } else if (existingJoin.status === 'rejected') {
        throw new AppError(t('offers.cannotJoinAfterRejected', language), 400);
      } else if (existingJoin.status === 'cancelled') {
        throw new AppError(t('offers.cannotJoinAfterCancelled', language), 400);
      } else {
        // For any other status, use generic message
        throw new AppError(t('offers.alreadyJoined', language), 400);
      }
    }

    // Check if enough seats available
    if (seats_requested > offer.seats_free) {
      throw new AppError(t('offers.onlySeatsAvailable', language, { count: offer.seats_free }), 400);
    }

    // Validate seats_requested
    if (seats_requested < 1 || seats_requested > 8) {
      throw new AppError(t('offers.seatsOutOfRange', language), 400);
    }

    // Calculate agreed prices at time of booking
    // Front seat premium only applies to 1 seat (there's only one front seat)
    // If multiple seats with front seat: (regular_price × seats) + (front_seat_premium × 1)
    let agreedPricePerSeat: number;
    let totalAgreedPrice: number;
    
    if (is_front_seat && offer.front_price_per_seat) {
      // Front seat selected: calculate as (regular_price × seats) + (front_seat_premium × 1)
      const frontSeatPremium = offer.front_price_per_seat - offer.price_per_seat;
      totalAgreedPrice = (offer.price_per_seat * seats_requested) + frontSeatPremium;
      // Average price per seat for display purposes
      agreedPricePerSeat = totalAgreedPrice / seats_requested;
    } else {
      // No front seat: regular price
      agreedPricePerSeat = offer.price_per_seat;
      totalAgreedPrice = offer.price_per_seat * seats_requested;
    }

    // Create passenger join request with agreed prices
    const passengerJoin = await OfferPassenger.create({
      offer_id,
      passenger_id: passengerId,
      seats_requested,
      is_front_seat,
      agreed_price_per_seat: agreedPricePerSeat,
      total_agreed_price: totalAgreedPrice,
      currency: offer.currency,
      message,
      status: 'pending'
    });

    // Get passenger info for notification
    const passenger = await User.findByPk(passengerId, {
      attributes: ['id', 'first_name', 'last_name', 'display_name']
    });

    // The driver reads this, so it is written in *his* language — not in the
    // language of the passenger whose request triggered it.
    const driverLanguage = await getUserLanguage(offer.user_id);

    // Send push notification to driver
    await this.notifyDriver(offer.user_id, {
      type: 'passenger_join_request',
      title: t('push.passengerJoinRequestTitle', driverLanguage),
      body: t('push.passengerJoinRequestBody', driverLanguage, {
        name: passenger?.display_name || passenger?.first_name || (driverLanguage === 'uz' ? 'Yo\'lovchi' : driverLanguage === 'ru' ? 'Пассажир' : 'Passenger'),
        from: offer.from_text,
        to: offer.to_text,
        seats: String(seats_requested)
      }),
      data: {
        type: 'passenger_join_request',
        offer_id: String(offer_id),
        passenger_id: String(passengerId),
        passenger_join_id: passengerJoin.id,
        seats_requested: String(seats_requested)
      }
    }, driverLanguage);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(passengerId),
        action: 'passenger.join_offer',
        payload: { offer_id, seats_requested, is_front_seat },
        req
      });
    }

    // Reload with associations
    return await OfferPassenger.findByPk(passengerJoin.id, {
      include: [
        {
          model: DriverOffer,
          as: 'offer',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'display_name']
            }
          ]
        },
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
        }
      ]
    });
  }

  /**
   * Driver confirms passenger join
   */
  static async confirmPassenger(
    driverId: number,
    passengerJoinId: string,
    req?: Request
  ) {
    const language = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    const passengerJoin = await OfferPassenger.findByPk(passengerJoinId, {
      include: [
        {
          model: DriverOffer,
          as: 'offer',
          required: true
        },
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
        }
      ]
    });

    if (!passengerJoin) {
      throw new AppError(t('offers.joinRequestNotFound', language), 404);
    }

    const offer = (passengerJoin as any).offer as DriverOffer;

    // Check if driver owns the offer
    if (offer.user_id !== driverId) {
      throw new AppError(t('offers.noPermissionConfirm', language), 403);
    }

    // Check if request is pending
    if (passengerJoin.status !== 'pending') {
      throw new AppError(t('offers.alreadyProcessed', language), 400);
    }

    // Every decision about whether this seat can be sold is re-made inside a
    // transaction that holds a row lock on the offer, so two confirms racing on
    // the same offer serialise instead of both reading the same seats_free and
    // both decrementing it. The checks above still run first: they are the cheap
    // path and give the same errors without touching a lock.
    //
    // The lock is taken on the offer row ALONE — Postgres refuses FOR UPDATE on
    // the nullable side of an outer join, which is what Sequelize generates if
    // `lock` is combined with `include`.
    await sequelize.transaction(async (tx) => {
      const lockedOffer = await DriverOffer.findByPk(offer.id, {
        transaction: tx,
        lock: tx.LOCK.UPDATE
      });

      if (!lockedOffer) {
        throw new AppError(t('offers.notFound', language), 404);
      }

      // Re-read the join under the lock too: the pending check is a
      // read-modify-write as well, and two confirms of the SAME request would
      // otherwise both pass it and decrement the offer twice.
      const lockedJoin = await OfferPassenger.findByPk(passengerJoinId, {
        transaction: tx
      });

      if (!lockedJoin) {
        throw new AppError(t('offers.joinRequestNotFound', language), 404);
      }

      if (lockedJoin.status !== 'pending') {
        throw new AppError(t('offers.alreadyProcessed', language), 400);
      }

      // The offer must still be sellable. Without this a driver can confirm
      // passengers onto an offer he already cancelled, and decrement its seats.
      if (lockedOffer.status !== 'published') {
        throw new AppError(t('offers.notAvailable', language), 400);
      }

      if (new Date(lockedOffer.start_at) < new Date()) {
        throw new AppError(t('offers.alreadyStarted', language), 400);
      }

      // Check if enough seats available
      if (lockedJoin.seats_requested > lockedOffer.seats_free) {
        throw new AppError(
          t('offers.onlySeatsAvailable', language, { count: lockedOffer.seats_free }),
          400
        );
      }

      // There is only one front seat in the car, so at most one confirmed
      // booking may hold it. Pending requests do not reserve it — whoever the
      // driver confirms first gets it.
      if (lockedJoin.is_front_seat) {
        const frontSeatTaken = await OfferPassenger.count({
          where: {
            offer_id: lockedOffer.id,
            is_front_seat: true,
            status: 'confirmed'
          },
          transaction: tx
        });

        if (frontSeatTaken > 0) {
          throw new AppError(t('offers.frontSeatTaken', language), 400);
        }
      }

      // Update passenger join status
      await lockedJoin.update(
        {
          status: 'confirmed',
          confirmed_at: new Date()
        },
        { transaction: tx }
      );

      // Update offer seats_free
      await lockedOffer.update(
        { seats_free: lockedOffer.seats_free - lockedJoin.seats_requested },
        { transaction: tx }
      );
    });

    // The controller serialises this instance (with its eager-loaded offer), so
    // bring it back in step with what was just committed.
    await passengerJoin.reload();

    // The passenger reads this, so it is written in *her* language.
    const passengerLanguage = await getUserLanguage(passengerJoin.passenger_id);
    
    // Send push notification to passenger
    await this.notifyPassenger(passengerJoin.passenger_id, {
      type: 'join_confirmed',
      title: t('push.joinConfirmedTitle', passengerLanguage),
      body: t('push.joinConfirmedBody', passengerLanguage, {
        from: offer.from_text,
        to: offer.to_text
      }),
      data: {
        type: 'join_confirmed',
        offer_id: String(offer.id),
        passenger_join_id: passengerJoin.id
      }
    }, passengerLanguage);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(driverId),
        action: 'driver.confirm_passenger',
        payload: { passenger_join_id: passengerJoin.id, offer_id: offer.id },
        req
      });
    }

    return passengerJoin;
  }

  /**
   * Driver rejects passenger join
   */
  static async rejectPassenger(
    driverId: number,
    passengerJoinId: string,
    rejection_reason?: string,
    req?: Request
  ) {
    const language = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    const passengerJoin = await OfferPassenger.findByPk(passengerJoinId, {
      include: [
        {
          model: DriverOffer,
          as: 'offer',
          required: true
        },
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
        }
      ]
    });

    if (!passengerJoin) {
      throw new AppError(t('offers.joinRequestNotFound', language), 404);
    }

    const offer = (passengerJoin as any).offer as DriverOffer;

    // Check if driver owns the offer
    if (offer.user_id !== driverId) {
      throw new AppError(t('offers.noPermissionReject', language), 403);
    }

    // Check if request is pending
    if (passengerJoin.status !== 'pending') {
      throw new AppError(t('offers.alreadyProcessed', language), 400);
    }

    // Update passenger join status
    await passengerJoin.update({
      status: 'rejected',
      rejection_reason,
      rejected_at: new Date()
    });

    // The passenger reads this, so it is written in *her* language.
    const passengerLanguage = await getUserLanguage(passengerJoin.passenger_id);
    
    // Send push notification to passenger
    await this.notifyPassenger(passengerJoin.passenger_id, {
      type: 'join_rejected',
      title: t('push.joinRejectedTitle', passengerLanguage),
      body: t('push.joinRejectedBody', passengerLanguage, {
        from: offer.from_text,
        to: offer.to_text
      }),
      data: {
        type: 'join_rejected',
        offer_id: String(offer.id),
        passenger_join_id: passengerJoin.id,
        rejection_reason: rejection_reason || ''
      }
    }, passengerLanguage);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(driverId),
        action: 'driver.reject_passenger',
        payload: { passenger_join_id: passengerJoin.id, offer_id: offer.id, rejection_reason },
        req
      });
    }

    return passengerJoin;
  }

  /**
   * Passenger cancels their join request
   */
  static async cancelJoin(passengerId: number, passengerJoinId: string, req?: Request) {
    const language = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    const passengerJoin = await OfferPassenger.findByPk(passengerJoinId, {
      include: [
        {
          model: DriverOffer,
          as: 'offer',
          required: true
        }
      ]
    });

    if (!passengerJoin) {
      throw new AppError(t('offers.joinRequestNotFound', language), 404);
    }

    // Check if passenger owns the join
    if (passengerJoin.passenger_id !== passengerId) {
      throw new AppError(t('offers.noPermissionCancel', language), 403);
    }

    // Check if request is pending or confirmed
    if (!['pending', 'confirmed'].includes(passengerJoin.status)) {
      throw new AppError(t('offers.cannotCancel', language), 400);
    }

    const offer = (passengerJoin as any).offer as DriverOffer;

    // Whether the seats actually come back is decided under the lock, not by the
    // unlocked read above — a driver confirm may land in between. The push below
    // reports this value, so it has to be the committed truth.
    let wasConfirmed = false;

    // Restoring seats is a read-modify-write like confirmPassenger's, so it
    // takes the same lock on the same row. Without this a cancel racing a
    // confirm loses one of the two updates and leaves seats_free wrong.
    await sequelize.transaction(async (tx) => {
      const lockedOffer = await DriverOffer.findByPk(offer.id, {
        transaction: tx,
        lock: tx.LOCK.UPDATE
      });

      if (!lockedOffer) {
        throw new AppError(t('offers.notFound', language), 404);
      }

      const lockedJoin = await OfferPassenger.findByPk(passengerJoinId, {
        transaction: tx
      });

      if (!lockedJoin) {
        throw new AppError(t('offers.joinRequestNotFound', language), 404);
      }

      // Re-assert under the lock: the driver may have confirmed or rejected
      // this request between the read above and this transaction.
      if (!['pending', 'confirmed'].includes(lockedJoin.status)) {
        throw new AppError(t('offers.cannotCancel', language), 400);
      }

      wasConfirmed = lockedJoin.status === 'confirmed';

      // Update passenger join status
      await lockedJoin.update(
        {
          status: 'cancelled',
          cancelled_at: new Date()
        },
        { transaction: tx }
      );

      // If was confirmed, restore seats
      if (wasConfirmed) {
        await lockedOffer.update(
          { seats_free: lockedOffer.seats_free + lockedJoin.seats_requested },
          { transaction: tx }
        );
      }
    });

    // Keep the instance the controller serialises in step with the commit.
    await passengerJoin.reload();

    // The driver reads this, so it is written in *his* language.
    const driverLanguage = await getUserLanguage(offer.user_id);
    
    // Send push notification to driver
    await this.notifyDriver(offer.user_id, {
      type: 'passenger_cancelled',
      title: t('push.passengerCancelledTitle', driverLanguage),
      body: t('push.passengerCancelledBody', driverLanguage, {
        from: offer.from_text,
        to: offer.to_text,
        status: wasConfirmed 
          ? (driverLanguage === 'uz' ? 'Tasdiqlangan' : driverLanguage === 'ru' ? 'Подтвержденный' : 'Confirmed')
          : (driverLanguage === 'uz' ? 'Kutilayotgan' : driverLanguage === 'ru' ? 'Ожидающий' : 'Pending')
      }),
      data: {
        type: 'passenger_cancelled',
        offer_id: String(offer.id),
        passenger_join_id: passengerJoin.id,
        was_confirmed: String(wasConfirmed)
      }
    }, driverLanguage);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(passengerId),
        action: 'passenger.cancel_join',
        payload: { passenger_join_id: passengerJoin.id, offer_id: offer.id },
        req
      });
    }

    return passengerJoin;
  }

  /**
   * Get passengers for an offer (driver view)
   */
  static async getOfferPassengers(driverId: number, offerId: number, req?: Request) {
    const language = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    // Verify driver owns the offer
    const offer = await DriverOffer.findOne({
      where: { id: offerId, user_id: driverId }
    });

    if (!offer) {
      throw new AppError(t('offers.offerNotFoundOrNoPermission', language), 403);
    }

    const passengers = await OfferPassenger.findAll({
      where: { offer_id: offerId },
      include: [
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return passengers;
  }

  /**
   * Get passenger's bookings
   */
  static async getPassengerBookings(passengerId: number, status?: OfferPassengerStatus) {
    const where: any = { passenger_id: passengerId };
    
    if (status) {
      where.status = status;
    }

    const bookings = await OfferPassenger.findAll({
      where,
      include: [
        {
          model: DriverOffer,
          as: 'offer',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'display_name']
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
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return bookings;
  }

  /**
   * Update driver location and check proximity to send arrival notifications
   */
  static async updateDriverLocation(
    driverId: number,
    passengerJoinId: string,
    driverLat: number,
    driverLon: number,
    req?: Request
  ) {
    const language = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';

    // Get passenger join with offer details
    const passengerJoin = await OfferPassenger.findByPk(passengerJoinId, {
      include: [
        {
          model: DriverOffer,
          as: 'offer',
          required: true,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'display_name']
            }
          ]
        },
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
        }
      ]
    });

    if (!passengerJoin) {
      throw new AppError(t('offers.joinRequestNotFound', language), 404);
    }

    const offer = (passengerJoin as any).offer as DriverOffer;

    // Verify driver owns the offer
    if (offer.user_id !== driverId) {
      throw new AppError(t('offers.noPermissionConfirm', language), 403);
    }

    // Only check for confirmed bookings
    if (passengerJoin.status !== 'confirmed') {
      throw new AppError('Can only update location for confirmed bookings', 400);
    }

    // Check if offer has pickup coordinates
    if (!offer.from_lat || !offer.from_lng) {
      throw new AppError('Pickup location coordinates not available', 400);
    }

    // The passenger reads this, so it is written in *her* language.
    const passengerLanguage = await getUserLanguage(passengerJoin.passenger_id);

    // Check if driver has arrived (within 200 meters)
    if (hasArrived(driverLat, driverLon, offer.from_lat, offer.from_lng)) {
      // Only send arrival notification if not already sent
      if (!passengerJoin.driver_arrived_at) {
        await passengerJoin.update({
          driver_arrived_at: new Date()
        });

        // Send arrival notification to passenger
        await this.notifyPassenger(passengerJoin.passenger_id, {
          type: 'driver_arrived',
          title: t('push.driverArrivedTitle', passengerLanguage),
          body: t('push.driverArrivedBody', passengerLanguage, {
            driverName: (offer as any).user?.display_name || (offer as any).user?.first_name || (passengerLanguage === 'uz' ? 'Haydovchi' : passengerLanguage === 'ru' ? 'Водитель' : 'Driver'),
            location: offer.from_text
          }),
          data: {
            type: 'driver_arrived',
            offer_id: String(offer.id),
            passenger_join_id: passengerJoin.id
          }
        }, passengerLanguage);
      }
    } else {
      // Check if driver is within 10 minutes
      const proximityCheck = isWithinMinutes(
        driverLat,
        driverLon,
        offer.from_lat,
        offer.from_lng,
        10
      );

      if (proximityCheck.within && !passengerJoin.driver_10min_notified_at) {
        // Send 10-minute notification
        await passengerJoin.update({
          driver_10min_notified_at: new Date()
        });

        // Send 10-minute notification to passenger
        await this.notifyPassenger(passengerJoin.passenger_id, {
          type: 'driver_10min_away',
          title: t('push.driver10MinAwayTitle', passengerLanguage),
          body: t('push.driver10MinAwayBody', passengerLanguage, {
            driverName: (offer as any).user?.display_name || (offer as any).user?.first_name || (passengerLanguage === 'uz' ? 'Haydovchi' : passengerLanguage === 'ru' ? 'Водитель' : 'Driver'),
            minutes: String(proximityCheck.estimatedMinutes)
          }),
          data: {
            type: 'driver_10min_away',
            offer_id: String(offer.id),
            passenger_join_id: passengerJoin.id,
            estimated_minutes: String(proximityCheck.estimatedMinutes)
          }
        }, passengerLanguage);
      }
    }

    // Reload to get updated values
    await passengerJoin.reload();

    return {
      arrived: !!passengerJoin.driver_arrived_at,
      within_10min: !!passengerJoin.driver_10min_notified_at,
      estimated_minutes: isWithinMinutes(
        driverLat,
        driverLon,
        offer.from_lat,
        offer.from_lng,
        10
      ).estimatedMinutes
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
    // T-045: record it BEFORE sending, and OUTSIDE the try below, so a push
    // that fails (stale token, FCM down) still leaves the user a record. The
    // helper never throws — a notification must not fail a ride.
    await NotificationService.recordPush(driverId, notification);

    try {
      // Get driver's push tokens (only driver app tokens)
      const tokens = await PushToken.findAll({
        where: { 
          user_id: driverId, 
          app: 'driver',
          is_active: true 
        }
      });

      if (tokens.length === 0) {
        console.log(`No active push tokens found for driver ${driverId} (driver app)`);
        return;
      }

      console.log(`Sending push notification to driver ${driverId} (${tokens.length} tokens)`);

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
            console.log(`✅ Push sent to driver ${driverId} token: ${token.token.substring(0, 20)}...`);
          } catch (error) {
            console.error(`Failed to send push to driver ${driverId}:`, error);
            // Deactivate invalid tokens
            if (error instanceof Error && (error.message.includes('invalid') || error.message.includes('not-registered'))) {
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

