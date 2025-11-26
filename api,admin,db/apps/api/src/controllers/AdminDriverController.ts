/**
 * Admin Driver Controller
 * Handles HTTP requests for driver management
 */

import type { Request, Response, NextFunction } from 'express';
import { AdminDriverService } from '../services/AdminDriverService.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import { HttpStatus, SuccessMessages } from '../constants/index.js';

export class AdminDriverController {
  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 25;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const registrationStep = req.query.registrationStep as string | undefined;

      const result = await AdminDriverService.getAll(page, pageSize, { 
        status, 
        search, 
        registrationStep 
      });

      paginatedResponse(res, result.drivers, page, pageSize, result.total);
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
      const driver = await AdminDriverService.getById(id);

      successResponse(res, driver);
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
      const updateData = req.body;

      const driver = await AdminDriverService.update(id, updateData);

      successResponse(res, driver, SuccessMessages.USER_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['active', 'blocked', 'pending_delete'].includes(status)) {
        throw new Error('Invalid status. Must be one of: active, blocked, pending_delete');
      }

      const driver = await AdminDriverService.updateStatus(id, status);

      successResponse(res, driver, SuccessMessages.USER_UPDATED || 'Status updated successfully');
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
      await AdminDriverService.delete(id);

      successResponse(res, null, SuccessMessages.USER_DELETED, HttpStatus.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  }
}

