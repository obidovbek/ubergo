/**
 * User Controller
 * Handles HTTP requests for user operations
 */

import type { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { UserService } from '../services/UserService.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import { HttpStatus, SuccessMessages } from '../constants/index.js';
import { UserRole, UserStatus } from '../constants/index.js';
import { AppError } from '../errors/AppError.js';
import { User } from '../database/models/index.js';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { identifierValidationError } from '../middleware/validator.js';
import { identifiersMatch, isIdentifierProvided } from '../utils/identifiers.js';

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
        referral_phone,
        own_promo_code,
        username,
      } = req.body;

      console.log('=== Update Profile Debug ===');
      console.log('User ID:', userId);
      console.log('Profile data:', { first_name, last_name, father_name, gender, birth_date, email, additional_phones });

      // Find user
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      /*
       * ── T-091: the user's OWN promo code and username ────────────────────
       *
       * Format is already settled by `profileIdentifiersValidation`, which also
       * trimmed these values. The two rules left are the ones that need the
       * database, so they cannot live in middleware:
       *   ① a promo code is PERMANENT once set;
       *   ② somebody else may already hold this code or handle.
       *
       * 🔴 ② is a pre-check, NOT the guarantee. Two users can claim the same
       * code in the gap between this SELECT and the UPDATE below, and only the
       * unique index can refuse the loser. That path returns 409 through the
       * error handler; this one exists so the ordinary case gets a field-named
       * 422 the app can put under the right input.
       */
      const language = getLanguageFromHeaders(req.headers['accept-language']);
      const claims: Array<{ field: 'own_promo_code' | 'username'; value: string }> = [];

      if (isIdentifierProvided(own_promo_code)) {
        claims.push({ field: 'own_promo_code', value: own_promo_code });
      }
      if (isIdentifierProvided(username)) {
        claims.push({ field: 'username', value: username });
      }

      if (claims.length > 0) {
        const identifierErrors: Array<{ field: string; type: string }> = [];

        /*
         * ① A promo code cannot be changed once it is set.
         *
         * 🔴 By the time a code is worth changing it has been given out. Freeing
         * it would break every copy already in circulation AND hand the string
         * to whoever claims it next — who would then collect referral credit
         * (T-089) from people who meant to name the first user.
         *
         * ⚠️ Re-sending the SAME code is not a change. Both screens PUT the
         * whole profile, so a user editing their email re-sends the code they
         * already own on every save. `identifiersMatch` folds case, agreeing
         * with the CITEXT column: 'AB12X' is not a change from 'ab12x'.
         *
         * ✅ A username has none of this and stays editable — nobody is paid
         * against it, and it is not something users hand out to be re-typed.
         */
        const promoClaim = claims.find((claim) => claim.field === 'own_promo_code');
        if (
          promoClaim &&
          user.own_promo_code &&
          !identifiersMatch(user.own_promo_code, promoClaim.value)
        ) {
          identifierErrors.push({ field: 'own_promo_code', type: 'immutable' });
        }

        // ② One query for both fields. The columns are CITEXT, so the DB does
        // the case-insensitive comparison itself — no LOWER() in application
        // code, which is what would disagree with the unique index.
        const clashes = await User.findAll({
          where: {
            id: { [Op.ne]: userId },
            [Op.or]: claims.map((claim) => ({ [claim.field]: claim.value })),
          },
          attributes: ['id', 'own_promo_code', 'username'],
        });

        for (const claim of claims) {
          // Already refused as immutable — naming a second reason for the same
          // field would only tell the user to change something they cannot.
          if (identifierErrors.some((error) => error.field === claim.field)) continue;

          const isTaken = clashes.some((row) => {
            const existing =
              claim.field === 'own_promo_code' ? row.own_promo_code : row.username;
            return typeof existing === 'string' && identifiersMatch(existing, claim.value);
          });

          if (isTaken) identifierErrors.push({ field: claim.field, type: 'unique' });
        }

        if (identifierErrors.length > 0) {
          throw identifierValidationError(identifierErrors, language);
        }
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
      if (referral_phone !== undefined) updateData.referral_phone = referral_phone;
      /*
       * 🔴 `isIdentifierProvided`, NOT `!== undefined` like the fields above.
       * These two columns are UNIQUE. An app that sends an empty box would write
       * `''` — and the second user to save an untouched profile would collide
       * with the first on a field neither of them ever filled in.
       */
      if (isIdentifierProvided(own_promo_code)) updateData.own_promo_code = own_promo_code;
      if (isIdentifierProvided(username)) updateData.username = username;
      
      await user.update(updateData);

      // A profile counts as complete once it has the fields the sign-up form actually
      // requires — name and gender. (Email and birth date are optional in the app, so
      // demanding them here marked finished registrations as incomplete.) Computed from
      // the saved record, not the request body, so a partial PUT can't undo it.
      // The apps route on this flag, so it must mean exactly one thing (OR-006).
      const isComplete = !!(user.first_name && user.last_name && user.gender);

      if (isComplete !== user.profile_complete) {
        await user.update({ profile_complete: isComplete });
      }

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
            // Returned so the app can show what is now claimed — and lock the
            // promo code input, since it can never be changed again.
            own_promo_code: user.own_promo_code ?? null,
            username: user.username ?? null,
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

