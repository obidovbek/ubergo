/**
 * Admin App Store URL Controller
 * Handles admin operations for managing app store URLs
 */

import type { Request, Response, NextFunction } from 'express';
import AppStoreUrlService from '../services/AppStoreUrlService.js';
import { successResponse } from '../utils/response.js';
import { SuccessMessages, HttpStatus } from '../constants/index.js';

export class AdminAppStoreUrlController {
  /**
   * Get app store URLs
   * GET /admin/app-store-urls
   */
  static async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { appName = 'user_app' } = req.query;
      const urls = await AppStoreUrlService.getAppStoreUrls(appName as string);
      successResponse(res, urls);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update app store URLs
   * PUT /admin/app-store-urls
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { appName = 'user_app', android_url, ios_url } = req.body;
      
      if (android_url !== undefined && android_url !== null && !isValidUrl(android_url)) {
        throw new Error('Invalid Android URL format');
      }
      
      if (ios_url !== undefined && ios_url !== null && !isValidUrl(ios_url)) {
        throw new Error('Invalid iOS URL format');
      }

      const appStoreUrl = await AppStoreUrlService.updateAppStoreUrls(appName, {
        android_url: android_url ?? null,
        ios_url: ios_url ?? null
      });
      
      successResponse(res, appStoreUrl, SuccessMessages.UPDATED || 'App store URLs updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default AdminAppStoreUrlController;

