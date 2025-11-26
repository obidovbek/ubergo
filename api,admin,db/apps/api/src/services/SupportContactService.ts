/**
 * Support Contact Service
 * Manages support contact information for apps
 */

import { SupportContact } from '../database/models/index.js';
import { AppError } from '../errors/AppError.js';

class SupportContactService {
  /**
   * Get support contact for a specific app
   */
  static async getSupportContact(appName: string = 'user_app'): Promise<{ email: string | null; phone: string | null }> {
    const supportContact = await SupportContact.findOne({
      where: { app_name: appName }
    });

    if (!supportContact) {
      // Return defaults if not found
      return {
        email: 'support@ubexgo.uz',
        phone: '+998901234567'
      };
    }

    return {
      email: supportContact.email,
      phone: supportContact.phone
    };
  }

  /**
   * Update support contact
   */
  static async updateSupportContact(
    appName: string,
    data: { email?: string | null; phone?: string | null }
  ): Promise<SupportContact> {
    // Validate email if provided
    if (data.email !== undefined && data.email !== null && data.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new AppError('Invalid email format', 400);
      }
    }

    // Validate phone if provided
    if (data.phone !== undefined && data.phone !== null && data.phone.trim() !== '') {
      const phoneRegex = /^\+?[\d\s-()]+$/;
      if (!phoneRegex.test(data.phone)) {
        throw new AppError('Invalid phone format', 400);
      }
    }

    const [supportContact] = await SupportContact.upsert({
      app_name: appName,
      email: data.email ?? null,
      phone: data.phone ?? null
    }, {
      returning: true
    });

    return supportContact;
  }

  /**
   * Get all support contacts
   */
  static async getAll(): Promise<SupportContact[]> {
    return await SupportContact.findAll({
      order: [['app_name', 'ASC']]
    });
  }
}

export default SupportContactService;

