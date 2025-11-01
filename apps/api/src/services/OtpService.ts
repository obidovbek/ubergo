/**
 * OTP Service
 * Handles OTP generation, sending via SMS/IVR, and verification
 */

import axios, { type AxiosInstance } from 'axios';
import validator from 'validator';
import { Op } from 'sequelize';
import { config } from '../config/index.js';
import { OtpCode, User, PushToken } from '../database/models/index.js';
import { logAudit, AuditActions } from '../utils/auditLogger.js';
import PushService from './PushService.js';

interface EskizAuthResponse {
  message: string;
  data: {
    token: string;
  };
}

interface EskizSendResponse {
  status: string;
  message: string;
  id?: string;
}

class OtpService {
  private eskizToken: string | null = null;
  private eskizTokenExpiry: number = 0;
  private eskizClient: AxiosInstance;
  private ivrClient: AxiosInstance;

  constructor() {
    this.eskizClient = axios.create({
      baseURL: config.eskiz.apiUrl,
      timeout: 10000,
    });

    this.ivrClient = axios.create({
      baseURL: config.ivr.apiUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${config.ivr.apiKey}`,
      },
    });

    // // Initialize with provided token if available
    // if (config.eskiz.token) {
    //   this.eskizToken = config.eskiz.token;
    //   // Set expiry to 30 days from now
    //   this.eskizTokenExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
    //   console.log('Eskiz token loaded from configuration');
    // }
  }

  /**
   * Validate phone number (E.164 format)
   */
  private validatePhone(phone: string): boolean {
    return validator.isMobilePhone(phone, 'any', { strictMode: true });
  }

  /**
   * Generate random OTP code
   */
  private generateCode(length: number = config.otp.codeLength): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }

  /**
   * Authenticate with Eskiz API and get token
   */
  private async authenticateEskiz(): Promise<string> {
    // Return cached token if still valid
    if (this.eskizToken && Date.now() < this.eskizTokenExpiry) {
      console.log('Using cached Eskiz token');
      return this.eskizToken;
    }

    // If email and password are provided, authenticate
    if (config.eskiz.email && config.eskiz.password) {
      try {
        console.log('Authenticating with Eskiz using email/password...');
        const response = await this.eskizClient.post<EskizAuthResponse>('/auth/login', {
          email: config.eskiz.email,
          password: config.eskiz.password,
        });
        console.log('Eskiz authentication response:', response.data);
        this.eskizToken = response.data.data.token;
        // Token typically expires in 30 days, we'll refresh after 29 days
        this.eskizTokenExpiry = Date.now() + (29 * 24 * 60 * 60 * 1000);

        console.log('Eskiz authentication successful');
        return this.eskizToken;
      } catch (error: any) {
        console.error('Eskiz authentication failed:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with SMS provider');
      }
    }

    throw new Error('No Eskiz token or credentials available');
  }

  /**
   * Send OTP via SMS using Eskiz
   */
  private async sendSms(phone: string, code: string): Promise<boolean> {
    try {
      console.log('before token send sms to phone', phone);
      const token = await this.authenticateEskiz();
      console.log('send sms to phone', phone);
      // Clean phone number - Eskiz expects format without +
      const cleanPhone = phone.replace(/\+/g, '');
      console.log('clean phone', cleanPhone);
      console.log(`Sending SMS to ${cleanPhone} with code: ${code}`);

      const response = await this.eskizClient.post<EskizSendResponse>(
        '/message/sms/send',
        {
          mobile_phone: cleanPhone,
          message: `Код верификации для входа к мобильному приложению UbexGo: ${code}`,
          from: '4546',
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('Eskiz SMS response:', response.data);
      
      // Check for both 'success' and 'waiting' statuses as valid
      const isSuccess = response.data.status === 'success' || response.data.status === 'waiting';
      
      if (isSuccess) {
        console.log('SMS sent successfully');
      } else {
        console.warn('SMS send status:', response.data);
      }

      return isSuccess;
    } catch (error: any) {
      console.error('Eskiz SMS send failed:', error.response?.data || error.message);
      
      // Provide more specific error messages
      if (error.response?.data?.message) {
        throw new Error(`SMS yuborishda xatolik: ${error.response.data.message}`);
      }
      
      throw new Error('SMS yuborishda xatolik yuz berdi');
    }
  }

  /**
   * Send OTP via IVR call
   */
  private async sendIvr(phone: string, code: string): Promise<boolean> {
    if (!config.ivr.apiUrl || !config.ivr.apiKey) {
      throw new Error('IVR service not configured');
    }

    try {
      // Format code for TTS: "1 2 3 4 5 6" instead of "123456"
      const spokenCode = code.split('').join(' ');

      const response = await this.ivrClient.post('/call/outbound', {
        phone: phone,
        message: `Sizning UberGo tasdiqlash kodingiz: ${spokenCode}. Yana bir bor aytaman: ${spokenCode}`,
        retries: 2,
      });

      return response.data.status === 'success';
    } catch (error: any) {
      console.error('IVR call failed:', error.response?.data || error.message);
      throw new Error('Failed to initiate call');
    }
  }

  /**
   * Check rate limits for OTP sending
   */
  private async checkRateLimit(phone: string): Promise<void> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check: max 1 request per minute
    const recentCodes = await OtpCode.count({
      where: {
        target: phone,
        created_at: {
          [Op.gte]: oneMinuteAgo,
        },
      },
    });

    if (recentCodes > 0) {
      throw new Error('Please wait at least 60 seconds before requesting a new code');
    }

    // Check: max 5 requests per hour
    const hourlyCount = await OtpCode.count({
      where: {
        target: phone,
        created_at: {
          [Op.gte]: oneHourAgo,
        },
      },
    });

    if (hourlyCount >= 100) {
      throw new Error('Too many OTP requests. Please try again later');
    }
  }

  /**
   * Send OTP code
   */
  async sendOtp(
    phone: string,
    channel: 'sms' | 'call' | 'push' = 'sms',
    metadata?: Record<string, any>
  ): Promise<{ sent: boolean; expiresInSec: number }> {
    // Validate phone number
    if (!this.validatePhone(phone)) {
      throw new Error('Invalid phone number format');
    }

    // Check rate limits
    await this.checkRateLimit(phone);

    // Generate OTP code
    const code = this.generateCode();

    // Calculate expiry
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);
    
    console.log('sendOtp metadata', metadata);
    console.log('sendOtp channel', channel);
    console.log('sendOtp phone', phone);
    console.log('sendOtp code', code);
    console.log('sendOtp expiresAt', expiresAt);
    console.log('sendOtp attempts', 0);
    console.log('sendOtp meta', metadata || {});

    // Save OTP to database
    await OtpCode.create({
      channel,
      target: phone,
      code,
      expires_at: expiresAt,
      attempts: 0,
      meta: metadata || {},
    });

    // Send OTP via selected channel
    let sent = false;
    try {
      if (channel === 'sms') {
        sent = await this.sendSms(phone, code);
      } else if (channel === 'call') {
        sent = await this.sendIvr(phone, code);
      } else if (channel === 'push') {
        // Find user by phone
        console.log('push phone', phone);
        const user = await User.findOne({ where: { phone_e164: phone } });
        console.log('push user data', user);
        if (!user) {
          throw new Error('User not found for provided phone');
        }

        // Find latest push token for user app
        const push = await PushToken.findOne({
          where: { user_id: user.id, app: 'user' },
          order: [['updated_at', 'DESC']],
        });
        console.log('push token', push);
        if (!push) {
          throw new Error('User device token not registered');
        }

        sent = await PushService.send({
          token: push.token,
          title: 'UbexGo tasdiqlash kodingiz',
          body: `Kodni haydovchi ilovasiga kiriting: ${code}`,
          data: { type: 'otp', code, phone },
        });
      }
    } catch (error: any) {
      console.error(`Failed to send OTP via ${channel}:`, error.message);
      throw error;
    }

    // Log audit
    await logAudit({
      action: AuditActions.AUTH_OTP_SEND,
      payload: {
        phone,
        channel,
        sent,
      },
    });

    return {
      sent,
      expiresInSec: config.otp.expiryMinutes * 60,
    };
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    // Find the most recent valid OTP
    const otpRecord = await OtpCode.findOne({
      where: {
        target: phone,
        code,
        expires_at: {
          [Op.gte]: new Date(),
        },
      },
      order: [['created_at', 'DESC']],
    });

    if (!otpRecord) {
      await logAudit({
        action: AuditActions.AUTH_OTP_VERIFY_FAILED,
        payload: {
          phone,
          reason: 'Code not found or expired',
        },
      });
      return false;
    }

    // Check max attempts
    if (otpRecord.attempts >= config.otp.maxAttempts) {
      await logAudit({
        action: AuditActions.AUTH_OTP_VERIFY_FAILED,
        payload: {
          phone,
          reason: 'Max attempts exceeded',
        },
      });
      return false;
    }

    // Increment attempts
    await otpRecord.update({
      attempts: otpRecord.attempts + 1,
    });

    // Verify code
    const isValid = otpRecord.code === code;

    if (isValid) {
      // Delete OTP after successful verification
      await otpRecord.destroy();

      await logAudit({
        action: AuditActions.AUTH_OTP_VERIFY,
        payload: {
          phone,
          channel: otpRecord.channel,
        },
      });
    } else {
      await logAudit({
        action: AuditActions.AUTH_OTP_VERIFY_FAILED,
        payload: {
          phone,
          reason: 'Invalid code',
        },
      });
    }

    return isValid;
  }

  /**
   * Clean up expired OTP codes (should be run periodically)
   */
  async cleanupExpiredCodes(): Promise<number> {
    const result = await OtpCode.destroy({
      where: {
        expires_at: {
          [Op.lt]: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${result} expired OTP codes`);
    return result;
  }
}

export default new OtpService();

