/**
 * Offer Passenger Service
 * Handles passenger joining/leaving driver offers and driver confirmations
 */

import { Op } from 'sequelize';
import {
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
import type { Request } from 'express';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { t } from '../i18n/translator.js';

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

    // Check if passenger already joined
    const existingJoin = await OfferPassenger.findOne({
      where: {
        offer_id,
        passenger_id: passengerId,
        status: { [Op.in]: ['pending', 'confirmed'] }
      }
    });

    if (existingJoin) {
      throw new AppError(t('offers.alreadyJoined', language), 400);
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

    // Send push notification to driver
    await this.notifyDriver(offer.user_id, {
      type: 'passenger_join_request',
      title: 'New Passenger Request',
      body: `${passenger?.display_name || 'A passenger'} wants to join your ride from ${offer.from_text} to ${offer.to_text}`,
      data: {
        type: 'passenger_join_request',
        offer_id: String(offer_id),
        passenger_id: String(passengerId),
        passenger_join_id: passengerJoin.id,
        seats_requested: String(seats_requested)
      }
    });

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

    // Check if enough seats available
    if (passengerJoin.seats_requested > offer.seats_free) {
      throw new AppError(t('offers.onlySeatsAvailable', language, { count: offer.seats_free }), 400);
    }

    // Update passenger join status
    await passengerJoin.update({
      status: 'confirmed',
      confirmed_at: new Date()
    });

    // Update offer seats_free
    await offer.update({
      seats_free: offer.seats_free - passengerJoin.seats_requested
    });

    // Send push notification to passenger
    await this.notifyPassenger(passengerJoin.passenger_id, {
      type: 'join_confirmed',
      title: 'Ride Confirmed!',
      body: `Your request to join the ride from ${offer.from_text} to ${offer.to_text} has been confirmed`,
      data: {
        type: 'join_confirmed',
        offer_id: String(offer.id),
        passenger_join_id: passengerJoin.id
      }
    });

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

    // Send push notification to passenger
    await this.notifyPassenger(passengerJoin.passenger_id, {
      type: 'join_rejected',
      title: 'Request Declined',
      body: `Your request to join the ride from ${offer.from_text} to ${offer.to_text} was declined`,
      data: {
        type: 'join_rejected',
        offer_id: String(offer.id),
        passenger_join_id: passengerJoin.id,
        rejection_reason: rejection_reason || ''
      }
    });

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
    const wasConfirmed = passengerJoin.status === 'confirmed';

    // Update passenger join status
    await passengerJoin.update({
      status: 'cancelled',
      cancelled_at: new Date()
    });

    // If was confirmed, restore seats
    if (wasConfirmed) {
      await offer.update({
        seats_free: offer.seats_free + passengerJoin.seats_requested
      });
    }

    // Send push notification to driver
    await this.notifyDriver(offer.user_id, {
      type: 'passenger_cancelled',
      title: 'Passenger Cancelled',
      body: `A passenger cancelled their ${wasConfirmed ? 'confirmed' : 'pending'} request for your ride from ${offer.from_text} to ${offer.to_text}`,
      data: {
        type: 'passenger_cancelled',
        offer_id: String(offer.id),
        passenger_join_id: passengerJoin.id,
        was_confirmed: String(wasConfirmed)
      }
    });

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
    }
  ) {
    try {
      // Get passenger's push tokens
      const tokens = await PushToken.findAll({
        where: { user_id: passengerId, is_active: true }
      });

      if (tokens.length === 0) {
        console.log(`No active push tokens found for passenger ${passengerId}`);
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
            console.error(`Failed to send push to passenger ${passengerId}:`, error);
            // Deactivate invalid tokens
            if (error instanceof Error && error.message.includes('invalid')) {
              await token.update({ is_active: false });
            }
          }
        })
      );
    } catch (error) {
      console.error('Error sending push notification to passenger:', error);
    }
  }
}

