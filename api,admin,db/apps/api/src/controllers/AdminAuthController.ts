/**
 * Admin Authentication Controller
 * Handles HTTP requests for admin authentication
 */

import type { Request, Response, NextFunction } from 'express';
import type { AdminAuthRequest } from '../types/index.js';
import { AdminAuthService } from '../services/AdminAuthService.js';
import { successResponse } from '../utils/response.js';
import { HttpStatus, SuccessMessages } from '../constants/index.js';

export class AdminAuthController {
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password, full_name, role_slugs } = req.body;
      const created_by = (req as AdminAuthRequest).user?.userId;

      const result = await AdminAuthService.register({
        email,
        password,
        full_name,
        role_slugs: role_slugs || [],
        created_by,
      });

      successResponse(
        res,
        result,
        SuccessMessages.USER_CREATED,
        HttpStatus.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress || undefined;

      const result = await AdminAuthService.login(email, password, ip);

      successResponse(res, result, SuccessMessages.LOGIN_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentAdmin(
    req: AdminAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      const admin = await AdminAuthService.getCurrentAdmin(userId);

      successResponse(res, admin);
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: AdminAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // In a real app, you might want to blacklist the token
      successResponse(res, null, SuccessMessages.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }
}

