/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../types';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants';

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
        SUCCESS_MESSAGES.REGISTER_SUCCESS,
        HTTP_STATUS.CREATED
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

      successResponse(res, result, SUCCESS_MESSAGES.LOGIN_SUCCESS);
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
      successResponse(res, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }
}

