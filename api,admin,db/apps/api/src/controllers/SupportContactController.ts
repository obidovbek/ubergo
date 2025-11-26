/**
 * Support Contact Controller (Public)
 * Handles public requests for support contact information
 */

import type { Request, Response, NextFunction } from 'express';
import SupportContactService from '../services/SupportContactService.js';
import { successResponse } from '../utils/response.js';

export class SupportContactController {
  /**
   * Get support contact (public endpoint)
   * GET /support-contacts
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
}

export default SupportContactController;

