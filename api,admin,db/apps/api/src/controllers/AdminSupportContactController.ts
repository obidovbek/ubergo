/**
 * Admin Support Contact Controller
 * Handles admin operations for managing support contact information
 */

import type { Request, Response, NextFunction } from 'express';
import SupportContactService from '../services/SupportContactService.js';
import { successResponse } from '../utils/response.js';
import { SuccessMessages, HttpStatus } from '../constants/index.js';

export class AdminSupportContactController {
  /**
   * Get support contact
   * GET /admin/support-contacts
   */
  static async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { appName = 'user_app' } = req.query;
      const contact = await SupportContactService.getSupportContact(appName as string);
      successResponse(res, contact);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all support contacts
   * GET /admin/support-contacts/all
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contacts = await SupportContactService.getAll();
      successResponse(res, contacts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update support contact
   * PUT /admin/support-contacts
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { appName = 'user_app', email, phone } = req.body;
      
      const supportContact = await SupportContactService.updateSupportContact(appName, {
        email: email ?? null,
        phone: phone ?? null
      });
      
      successResponse(res, supportContact, SuccessMessages.UPDATED || 'Support contact updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default AdminSupportContactController;

