/**
 * Admin User Controller
 * Handles HTTP requests for admin user management
 */

import type { Request, Response, NextFunction } from 'express';
import type { AdminAuthRequest } from '../types/index.js';
import { AdminUserService } from '../services/AdminUserService.js';
import { successResponse } from '../utils/response.js';
import { HttpStatus, SuccessMessages } from '../constants/index.js';

export class AdminUserController {
  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 25;
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await AdminUserService.getAll(page, pageSize, { role, status });

      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const adminUser = await AdminUserService.getById(id);

      successResponse(res, adminUser);
    } catch (error) {
      next(error);
    }
  }

  static async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password, full_name, role_slugs, status } = req.body;
      const created_by = (req as AdminAuthRequest).user?.userId;

      const adminUser = await AdminUserService.create({
        email,
        password,
        full_name,
        role_slugs,
        status,
        created_by,
      });

      successResponse(
        res,
        adminUser,
        SuccessMessages.USER_CREATED,
        HttpStatus.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  static async update(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { email, password, full_name, role_slugs, status } = req.body;

      const adminUser = await AdminUserService.update(id, {
        email,
        password,
        full_name,
        role_slugs,
        status,
      });

      successResponse(res, adminUser, SuccessMessages.USER_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  static async delete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await AdminUserService.delete(id);

      successResponse(res, null, SuccessMessages.USER_DELETED);
    } catch (error) {
      next(error);
    }
  }
}

