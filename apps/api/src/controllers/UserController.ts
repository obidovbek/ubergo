/**
 * User Controller
 * Handles HTTP requests for user operations
 */

import type { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import { HttpStatus, SuccessMessages } from '../constants/index.js';
import { UserRole, UserStatus } from '../constants/index.js';
import { AppError } from '../errors/AppError.js';
import { User } from '../database/models/index.js';

export class UserController {
  static async getUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const offset = (page - 1) * limit;

      const role = req.query.role as UserRole | undefined;
      const status = req.query.status as UserStatus | undefined;

      const { users, total } = await UserService.getUsers(
        { page, limit, offset },
        { role, status }
      );

      paginatedResponse(res, users, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const user = await UserService.getUserById(id);

      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await UserService.updateUser(id, updateData);

      successResponse(res, user, SuccessMessages.USER_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      await UserService.deleteUser(id);

      successResponse(res, null, SuccessMessages.USER_DELETED, HttpStatus.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   * PUT /api/user/profile
   */
  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Get user ID from request (set by auth middleware)
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const {
        first_name,
        last_name,
        father_name,
        gender,
        birth_date,
        email,
        additional_phones,
        promo_code,
        referral_id,
      } = req.body;

      console.log('=== Update Profile Debug ===');
      console.log('User ID:', userId);
      console.log('Profile data:', { first_name, last_name, father_name, gender, birth_date, email, additional_phones });

      // Find user
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Build display name
      const displayName = [first_name, father_name, last_name].filter(Boolean).join(' ');

      // Update user profile with all fields
      const updateData: any = {};
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (father_name !== undefined) updateData.father_name = father_name;
      if (gender !== undefined) updateData.gender = gender;
      if (birth_date !== undefined) updateData.birth_date = birth_date;
      if (email !== undefined) updateData.email = email;
      if (displayName) updateData.display_name = displayName;
      if (additional_phones !== undefined) updateData.additional_phones = additional_phones;
      if (promo_code !== undefined) updateData.promo_code = promo_code;
      if (referral_id !== undefined) updateData.referral_id = referral_id;
      
      // Set profile_complete to true only if all required fields are present
      updateData.profile_complete = !!(email && first_name && last_name && birth_date && gender);
      
      await user.update(updateData);

      console.log('Profile updated successfully');
      console.log('Profile complete:', user.profile_complete);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            phone_e164: user.phone_e164,
            email: user.email,
            display_name: user.display_name,
            first_name: user.first_name,
            last_name: user.last_name,
            father_name: user.father_name,
            gender: user.gender,
            birth_date: user.birth_date,
            additional_phones: user.additional_phones,
            is_verified: user.is_verified,
            role: user.role,
            status: user.status,
            profile_complete: user.profile_complete,
          },
        },
        message: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Profile update error:', error);
      next(error);
    }
  }
}

