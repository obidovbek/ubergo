/**
 * Driver Rating Controller
 * Handles passenger ratings for drivers
 */

import type { Request, Response } from 'express';
import { DriverRating, OfferPassenger, User, DriverOffer } from '../database/models/index.js';
import { Op } from 'sequelize';

export class DriverRatingController {
  /**
   * Create a rating for a completed ride
   * POST /api/ratings/bookings/:bookingId/rate
   */
  static async createRating(req: Request, res: Response) {
    try {
      const passengerId = req.user?.id;
      const { bookingId } = req.params;
      const { rating, comment } = req.body;

      if (!passengerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Find the booking
      const booking = await OfferPassenger.findOne({
        where: {
          id: bookingId,
          passenger_id: passengerId
        },
        include: [
          {
            model: DriverOffer,
            as: 'offer',
            attributes: ['user_id', 'start_at', 'status']
          }
        ]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Check if booking is confirmed
      if (booking.status !== 'confirmed') {
        return res.status(400).json({
          success: false,
          message: 'Can only rate confirmed bookings'
        });
      }

      // Check if ride has started (optional - you can adjust this logic)
      const offer = booking.offer as any;
      const rideStartTime = new Date(offer.start_at);
      const now = new Date();
      
      if (now < rideStartTime) {
        return res.status(400).json({
          success: false,
          message: 'Cannot rate before the ride starts'
        });
      }

      // Check if already rated
      const existingRating = await DriverRating.findOne({
        where: { offer_passenger_id: bookingId }
      });

      if (existingRating) {
        return res.status(400).json({
          success: false,
          message: 'You have already rated this ride'
        });
      }

      // Create rating
      const newRating = await DriverRating.create({
        driver_id: offer.user_id,
        passenger_id: passengerId,
        offer_passenger_id: bookingId,
        rating,
        comment: comment || null
      });

      return res.status(201).json({
        success: true,
        message: 'Rating submitted successfully',
        data: newRating
      });
    } catch (error: any) {
      console.error('Error creating rating:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create rating',
        error: error.message
      });
    }
  }

  /**
   * Get passenger's given ratings
   * GET /api/ratings/my-ratings
   */
  static async getMyRatings(req: Request, res: Response) {
    try {
      const passengerId = req.user?.id;

      if (!passengerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const ratings = await DriverRating.findAll({
        where: { passenger_id: passengerId },
        include: [
          {
            model: User,
            as: 'driver',
            attributes: ['id', 'name', 'phone_number']
          },
          {
            model: OfferPassenger,
            as: 'offerPassenger',
            include: [
              {
                model: DriverOffer,
                as: 'offer',
                attributes: ['from_text', 'to_text', 'start_at']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: ratings
      });
    } catch (error: any) {
      console.error('Error fetching ratings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch ratings',
        error: error.message
      });
    }
  }

  /**
   * Get driver's received ratings
   * GET /api/ratings/driver/ratings
   */
  static async getDriverRatings(req: Request, res: Response) {
    try {
      const driverId = req.user?.id;

      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const ratings = await DriverRating.findAll({
        where: { driver_id: driverId },
        include: [
          {
            model: User,
            as: 'passenger',
            attributes: ['id', 'name']
          },
          {
            model: OfferPassenger,
            as: 'offerPassenger',
            include: [
              {
                model: DriverOffer,
                as: 'offer',
                attributes: ['from_text', 'to_text', 'start_at']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: ratings
      });
    } catch (error: any) {
      console.error('Error fetching driver ratings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch ratings',
        error: error.message
      });
    }
  }

  /**
   * Get driver's rating summary
   * GET /api/ratings/driver/rating-summary
   */
  static async getDriverRatingSummary(req: Request, res: Response) {
    try {
      const driverId = req.user?.id;

      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      return DriverRatingController.calculateRatingSummary(driverId, res);
    } catch (error: any) {
      console.error('Error fetching rating summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch rating summary',
        error: error.message
      });
    }
  }

  /**
   * Get public driver rating summary
   * GET /api/ratings/drivers/:driverId/rating-summary
   */
  static async getPublicDriverRatingSummary(req: Request, res: Response) {
    try {
      const { driverId } = req.params;

      if (!driverId) {
        return res.status(400).json({
          success: false,
          message: 'Driver ID is required'
        });
      }

      return DriverRatingController.calculateRatingSummary(parseInt(driverId), res);
    } catch (error: any) {
      console.error('Error fetching public rating summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch rating summary',
        error: error.message
      });
    }
  }

  /**
   * Helper method to calculate rating summary
   */
  private static async calculateRatingSummary(driverId: number, res: Response) {
    const ratings = await DriverRating.findAll({
      where: { driver_id: driverId },
      attributes: ['rating']
    });

    if (ratings.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          average_rating: 0,
          total_ratings: 0,
          rating_distribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
          }
        }
      });
    }

    const totalRatings = ratings.length;
    const sumRatings = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = sumRatings / totalRatings;

    // Calculate rating distribution
    const distribution = {
      5: ratings.filter(r => r.rating === 5).length,
      4: ratings.filter(r => r.rating === 4).length,
      3: ratings.filter(r => r.rating === 3).length,
      2: ratings.filter(r => r.rating === 2).length,
      1: ratings.filter(r => r.rating === 1).length
    };

    return res.status(200).json({
      success: true,
      data: {
        average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        total_ratings: totalRatings,
        rating_distribution: distribution
      }
    });
  }
}

