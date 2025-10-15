/**
 * User Controller
 * Handles HTTP requests for user operations
 */

import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { successResponse, paginatedResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants';
import { UserRole, UserStatus } from '../constants';

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

      successResponse(res, user, SUCCESS_MESSAGES.UPDATE_SUCCESS);
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

      successResponse(res, null, SUCCESS_MESSAGES.DELETE_SUCCESS, HTTP_STATUS.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  }
}

