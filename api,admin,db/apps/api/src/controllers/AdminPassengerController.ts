/**
 * Admin Passenger Controller
 * Handles HTTP requests for passenger management
 */

import type { Request, Response, NextFunction } from 'express';
import { AdminPassengerService } from '../services/AdminPassengerService.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import { HttpStatus, SuccessMessages } from '../constants/index.js';

export class AdminPassengerController {
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

      console.log(`[AdminPassengerController] getAll called with:`, {
        page,
        pageSize,
        status,
        search
      });

      const result = await AdminPassengerService.getAll(page, pageSize, { status, search });

      console.log(`[AdminPassengerController] Service returned:`, {
        passengersCount: result.passengers.length,
        total: result.total
      });

      paginatedResponse(res, result.passengers, page, pageSize, result.total);
    } catch (error) {
      console.error('[AdminPassengerController] Error:', error);
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
      const passenger = await AdminPassengerService.getById(id);

      successResponse(res, passenger);
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

      const passenger = await AdminPassengerService.update(id, updateData);

      successResponse(res, passenger, SuccessMessages.USER_UPDATED);
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

      const passenger = await AdminPassengerService.updateStatus(id, status);

      successResponse(res, passenger, SuccessMessages.USER_UPDATED || 'Status updated successfully');
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
      await AdminPassengerService.delete(id);

      successResponse(res, null, SuccessMessages.USER_DELETED, HttpStatus.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  }
}

