/**
 * App Store URL Service
 * Manages app store URLs for different platforms
 */

import { AppStoreUrl } from '../database/models/index.js';
import { AppError } from '../errors/AppError.js';

class AppStoreUrlService {
  /**
   * Get app store URLs for a specific app
   */
  static async getAppStoreUrls(appName: string = 'user_app'): Promise<{ android_url: string | null; ios_url: string | null }> {
    const appStoreUrl = await AppStoreUrl.findOne({
      where: { app_name: appName }
    });

    if (!appStoreUrl) {
      // Return nulls if not found (shouldn't happen after migration)
      return {
        android_url: null,
        ios_url: null
      };
    }

    return {
      android_url: appStoreUrl.android_url,
      ios_url: appStoreUrl.ios_url
    };
  }

  /**
   * Update app store URLs
   */
  static async updateAppStoreUrls(
    appName: string,
    data: { android_url?: string | null; ios_url?: string | null }
  ): Promise<AppStoreUrl> {
    const [appStoreUrl] = await AppStoreUrl.upsert({
      app_name: appName,
      android_url: data.android_url ?? null,
      ios_url: data.ios_url ?? null
    }, {
      returning: true
    });

    return appStoreUrl;
  }

  /**
   * Get app store URL based on platform
   */
  static async getUrlForPlatform(appName: string, platform: 'android' | 'ios'): Promise<string | null> {
    const urls = await this.getAppStoreUrls(appName);
    return platform === 'android' ? urls.android_url : urls.ios_url;
  }
}

export default AppStoreUrlService;

