/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 */

import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import { AuthService } from '../services/AuthService.js';
import { successResponse } from '../utils/response.js';
import { HttpStatus, SuccessMessages } from '../constants/index.js';

export class AuthController {
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, email, phone, password, role } = req.body;

      const result = await AuthService.register({
        name,
        email,
        phone,
        password,
        role,
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

      const result = await AuthService.login(email, password);

      successResponse(res, result, SuccessMessages.LOGIN_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      const user = await AuthService.getCurrentUser(userId);

      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: AuthRequest,
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

