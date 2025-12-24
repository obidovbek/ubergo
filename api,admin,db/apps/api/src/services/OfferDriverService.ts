/**
 * Offer Driver Service
 * Handles driver joining/leaving passenger offers and passenger confirmations
 */

import { Op } from 'sequelize';
import {
  OfferDriver,
  PassengerOffer,
  User,
  PushToken,
  DriverProfile,
  DriverVehicle,
  VehicleType,
  VehicleMake,
  VehicleModel,
  VehicleColor,
} from '../database/models/index.js';
import type { OfferDriverStatus } from '../database/models/OfferDriver.js';
import { AppError } from '../errors/AppError.js';
import { logAudit } from '../utils/auditLogger.js';
import PushService from './PushService.js';
import type { Request } from 'express';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { t } from '../i18n/translator.js';
import type { Language } from '../i18n/types.js';

interface JoinPassengerOfferData {
  offer_id: number;
  vehicle_id: string;
  seats_offered?: number;
  offered_price_per_seat: number;
  message?: string;
}

export class OfferDriverService {
  /**
   * Check if vehicle belongs to driver
   */
  private static async checkVehicleOwnership(driverId: number, vehicleId: string) {
    const vehicle = await DriverVehicle.findOne({
      where: { id: vehicleId },
      include: [
        {
          model: DriverProfile,
          as: 'driverProfile',
          where: { user_id: driverId },
          required: true
        }
      ]
    });

    if (!vehicle) {
      const language = 'uz'; // Default for private method
      throw new AppError(t('offers.vehicleNotFound', language), 403);
    }

    return vehicle;
  }

  /**
   * Driver joins a passenger offer (creates pending request)
   */
  static async joinOffer(driverId: number, data: JoinPassengerOfferData, req?: Request) {
    const { offer_id, vehicle_id, seats_offered = 1, offered_price_per_seat, message } = data;
    const language = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';

    // Check vehicle ownership
    await this.checkVehicleOwnership(driverId, vehicle_id);

    // Get offer with passenger info
    const offer = await PassengerOffer.findByPk(offer_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
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

    // Check if driver is the passenger
    if (offer.user_id === driverId) {
      throw new AppError(t('offers.cannotJoinOwn', language), 400);
    }

    // Check if driver already has any join request (regardless of status)
    const existingJoin = await OfferDriver.findOne({
      where: {
        offer_id,
        driver_id: driverId
      }
    });

    if (existingJoin) {
      // Handle different statuses with appropriate error messages
      if (existingJoin.status === 'pending' || existingJoin.status === 'confirmed') {
        throw new AppError(t('offers.alreadySentRequest', language), 400);
      } else if (existingJoin.status === 'rejected') {
        throw new AppError(t('offers.cannotJoinAfterRejected', language), 400);
      } else if (existingJoin.status === 'cancelled') {
        throw new AppError(t('offers.cannotJoinAfterCancelled', language), 400);
      } else {
        // For any other status, use generic message
        throw new AppError(t('offers.alreadySentRequest', language), 400);
      }
    }

    // Check if offered seats meet the requirement
    if (seats_offered < offer.seats_needed) {
      throw new AppError(t('offers.needsAtLeastSeats', language, { count: offer.seats_needed }), 400);
    }

    // Validate seats_offered
    if (seats_offered < 1 || seats_offered > 8) {
      throw new AppError(t('offers.seatsOutOfRangeDriver', language), 400);
    }

    // Validate offered price
    if (offered_price_per_seat <= 0) {
      throw new AppError(t('offers.priceMustBePositive', language), 400);
    }

    // Calculate total offered price
    const totalOfferedPrice = offered_price_per_seat * offer.seats_needed;

    // Create driver join request
    const driverJoin = await OfferDriver.create({
      offer_id,
      driver_id: driverId,
      vehicle_id,
      seats_offered,
      offered_price_per_seat,
      total_offered_price: totalOfferedPrice,
      currency: offer.currency,
      message,
      status: 'pending'
    });

    // Get driver info for notification
    const driver = await User.findByPk(driverId, {
      attributes: ['id', 'first_name', 'last_name', 'display_name']
    });

    // Get passenger language preference (default to uz)
    const passengerLanguage = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    
    // Send push notification to passenger
    await this.notifyPassenger(offer.user_id, {
      type: 'driver_join_request',
      title: t('push.driverJoinRequestTitle', passengerLanguage),
      body: t('push.driverJoinRequestBody', passengerLanguage, {
        name: driver?.display_name || driver?.first_name || (passengerLanguage === 'uz' ? 'Haydovchi' : passengerLanguage === 'ru' ? 'Водитель' : 'Driver'),
        from: offer.from_text,
        to: offer.to_text,
        price: String(offered_price_per_seat),
        currency: offer.currency || 'UZS'
      }),
      data: {
        type: 'driver_join_request',
        offer_id: String(offer_id),
        driver_id: String(driverId),
        driver_join_id: driverJoin.id,
        offered_price: String(offered_price_per_seat)
      }
    }, passengerLanguage);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(driverId),
        action: 'driver.join_passenger_offer',
        payload: { offer_id, vehicle_id, seats_offered, offered_price_per_seat },
        req
      });
    }

    // Reload with associations
    return await OfferDriver.findByPk(driverJoin.id, {
      include: [
        {
          model: PassengerOffer,
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
    });
  }

  /**
   * Passenger confirms driver join
   */
  static async confirmDriver(
    passengerId: number,
    driverJoinId: string,
    req?: Request
  ) {
    const language = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    const driverJoin = await OfferDriver.findByPk(driverJoinId, {
      include: [
        {
          model: PassengerOffer,
          as: 'offer',
          required: true
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
        }
      ]
    });

    if (!driverJoin) {
      throw new AppError(t('offers.driverJoinRequestNotFound', language), 404);
    }

    const offer = driverJoin.offer as any;

    // Check if user is the passenger
    if (offer.user_id !== passengerId) {
      throw new AppError(t('offers.noPermissionConfirm', language), 403);
    }

    // Check if already confirmed or rejected
    if (driverJoin.status !== 'pending') {
      throw new AppError(t('offers.alreadyProcessed', language), 400);
    }

    // Confirm the driver
    await driverJoin.update({
      status: 'confirmed',
      confirmed_at: new Date()
    });

    // Update offer status to completed
    await offer.update({ status: 'completed' });

    // Get driver language preference (default to uz)
    const driverLanguage = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    
    // Send push notification to driver
    await this.notifyDriver(driverJoin.driver_id, {
      type: 'driver_request_confirmed',
      title: t('push.driverRequestConfirmedTitle', driverLanguage),
      body: t('push.driverRequestConfirmedBody', driverLanguage, {
        from: offer.from_text,
        to: offer.to_text
      }),
      data: {
        type: 'driver_request_confirmed',
        offer_id: String(offer.id),
        driver_join_id: driverJoin.id
      }
    }, driverLanguage);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(passengerId),
        action: 'passenger.confirm_driver',
        payload: { driver_join_id: driverJoin.id, offer_id: offer.id },
        req
      });
    }

    return driverJoin;
  }

  /**
   * Passenger rejects driver join
   */
  static async rejectDriver(
    passengerId: number,
    driverJoinId: string,
    rejectionReason?: string,
    req?: Request
  ) {
    const language = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    const driverJoin = await OfferDriver.findByPk(driverJoinId, {
      include: [
        {
          model: PassengerOffer,
          as: 'offer',
          required: true
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'first_name', 'last_name', 'display_name']
        }
      ]
    });

    if (!driverJoin) {
      throw new AppError(t('offers.driverJoinRequestNotFound', language), 404);
    }

    const offer = driverJoin.offer as any;

    // Check if user is the passenger
    if (offer.user_id !== passengerId) {
      throw new AppError(t('offers.noPermissionReject', language), 403);
    }

    // Check if already confirmed or rejected
    if (driverJoin.status !== 'pending') {
      throw new AppError(t('offers.alreadyProcessed', language), 400);
    }

    // Reject the driver
    await driverJoin.update({
      status: 'rejected',
      rejection_reason: rejectionReason,
      rejected_at: new Date()
    });

    // Get driver language preference (default to uz)
    const driverLanguage = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    
    // Send push notification to driver
    await this.notifyDriver(driverJoin.driver_id, {
      type: 'driver_request_rejected',
      title: t('push.driverRequestRejectedTitle', driverLanguage),
      body: t('push.driverRequestRejectedBody', driverLanguage, {
        from: offer.from_text,
        to: offer.to_text
      }),
      data: {
        type: 'driver_request_rejected',
        offer_id: String(offer.id),
        driver_join_id: driverJoin.id
      }
    }, driverLanguage);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(passengerId),
        action: 'passenger.reject_driver',
        payload: { driver_join_id: driverJoin.id, offer_id: offer.id, reason: rejectionReason },
        req
      });
    }

    return driverJoin;
  }

  /**
   * Driver cancels their join request
   */
  static async cancelJoin(driverId: number, driverJoinId: string, req?: Request) {
    const language = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    const driverJoin = await OfferDriver.findByPk(driverJoinId, {
      include: [
        {
          model: PassengerOffer,
          as: 'offer',
          required: true
        }
      ]
    });

    if (!driverJoin) {
      throw new AppError(t('offers.driverJoinRequestNotFound', language), 404);
    }

    // Check if user is the driver
    if (driverJoin.driver_id !== driverId) {
      throw new AppError(t('offers.noPermissionCancel', language), 403);
    }

    // Check if already confirmed
    if (driverJoin.status === 'confirmed') {
      throw new AppError(t('offers.cannotCancelConfirmed', language), 400);
    }

    // Cancel the join
    await driverJoin.update({
      status: 'cancelled',
      cancelled_at: new Date()
    });

    const offer = driverJoin.offer as any;

    // Get passenger language preference (default to uz)
    const passengerLanguage = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    
    // Send push notification to passenger
    await this.notifyPassenger(offer.user_id, {
      type: 'driver_request_cancelled',
      title: t('push.driverRequestCancelledTitle', passengerLanguage),
      body: t('push.driverRequestCancelledBody', passengerLanguage, {
        from: offer.from_text,
        to: offer.to_text
      }),
      data: {
        type: 'driver_request_cancelled',
        offer_id: String(offer.id),
        driver_join_id: driverJoin.id
      }
    }, passengerLanguage);

    // Audit log
    if (req) {
      await logAudit({
        userId: String(driverId),
        action: 'driver.cancel_join',
        payload: { driver_join_id: driverJoin.id, offer_id: offer.id },
        req
      });
    }

    return driverJoin;
  }

  /**
   * Get driver's join requests
   */
  static async getDriverJoinRequests(driverId: number, status?: OfferDriverStatus) {
    const where: any = { driver_id: driverId };
    
    if (status) {
      where.status = status;
    }

    const joinRequests = await OfferDriver.findAll({
      where,
      include: [
        {
          model: PassengerOffer,
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
      ],
      order: [['created_at', 'DESC']]
    });

    return joinRequests;
  }

  /**
   * Get drivers for a passenger offer (passenger view)
   */
  static async getOfferDrivers(passengerId: number, offerId: number, req?: Request) {
    const language = req ? getLanguageFromHeaders(req.headers['accept-language']) : 'uz';
    // First check if the offer belongs to the passenger
    const offer = await PassengerOffer.findByPk(offerId);
    
    if (!offer) {
      throw new AppError(t('offers.notFound', language), 404);
    }

    if (offer.user_id !== passengerId) {
      throw new AppError(t('offers.noPermissionViewDrivers', language), 403);
    }

    const drivers = await OfferDriver.findAll({
      where: { offer_id: offerId },
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
      ],
      order: [['created_at', 'DESC']]
    });

    return drivers;
  }

  /**
   * Send push notification to passenger
   */
  private static async notifyPassenger(passengerId: number, notification: {
    type: string;
    title: string;
    body: string;
    data: Record<string, string>;
  }, language: Language = 'uz') {
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

  /**
   * Send push notification to driver
   */
  private static async notifyDriver(driverId: number, notification: {
    type: string;
    title: string;
    body: string;
    data: Record<string, string>;
  }, language: Language = 'uz') {
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
}



