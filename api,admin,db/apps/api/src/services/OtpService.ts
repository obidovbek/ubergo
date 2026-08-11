/**
 * OTP Service
 * Handles OTP generation, sending via SMS/IVR, and verification
 */

import axios, { type AxiosInstance } from 'axios';
import validator from 'validator';
import { timingSafeEqual } from 'node:crypto';
import { Op } from 'sequelize';
import { config } from '../config/index.js';
import { OtpCode, User, PushToken } from '../database/models/index.js';
import { logAudit, AuditActions } from '../utils/auditLogger.js';
import PushService from './PushService.js';
import { AppError } from '../errors/AppError.js';
import { HttpStatus } from '../constants/index.js';
import { t } from '../i18n/translator.js';
import { DEFAULT_LANGUAGE } from '../i18n/config.js';
import type { Language } from '../i18n/types.js';

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

/** Android SMS Retriever only delivers messages up to 140 bytes. */
const SMS_RETRIEVER_MAX_BYTES = 140;

/**
 * Cyrillic SMS is encoded as UCS-2, where a single segment holds 70 characters.
 * Going over splits the SMS: double cost, and SMS Retriever stops working.
 */
const SMS_UCS2_SINGLE_SEGMENT_CHARS = 70;

/**
 * One OTP per phone per minute. An SMS-cost control, not a security check — the
 * brute-force defence is `otpVerifyLimiter` plus the code's own expiry.
 * The apps show a countdown of this length on their "resend" links.
 */
const OTP_RESEND_COOLDOWN_SEC = 60;

/** Runaway guard per phone per hour — see the comment in `checkRateLimit`. */
const OTP_MAX_PER_HOUR = 1000;

/**
 * 🔒 T-034. A phone number in a log is still personal data, and it is the
 * *identifier* half of a credential pair — so logs keep only enough to correlate
 * a request, never enough to target someone.
 *
 * `+998901234567` → `+99890***4567`.
 */
const maskPhone = (phone: string): string => {
  const s = String(phone ?? '');
  if (s.length <= 8) return '***';
  return `${s.slice(0, 6)}***${s.slice(-4)}`;
};

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
        // 🔒 T-034: `response.data` carries the full Eskiz BEARER TOKEN.
        // Printing it handed anyone with log access our SMS account.
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
   * Build the OTP SMS text.
   *
   * Each variant must match an APPROVED Eskiz template exactly, or Eskiz rejects the
   * send. Two different templates are in play:
   *  - no hash  -> the original long text (approved 2025-10-20), used until the owner
   *                sets ESKIZ_OTP_APP_HASH. Keeps today's behaviour byte-for-byte.
   *  - hash set -> a SHORTER text + the hash on its own last line (OR-003), which the
   *                owner registers separately.
   *
   * The shorter text is required, not cosmetic: Cyrillic SMS is UCS-2, so a single
   * segment holds only 70 CHARACTERS. The original long text (62) plus "\n" + an
   * 11-char hash is 74 -> it splits into 2 segments, which costs double AND stops SMS
   * Retriever from firing (it only handles single-part messages).
   *
   * Eskiz Пункт 2 requires a verification-code SMS to name both the PURPOSE ("для
   * входа") and the RESOURCE ("приложение UbexGo"); a bare "Код верификации UbexGo"
   * gets rejected. The wording below satisfies Пункт 2 and, with the hash, is 63
   * chars = 1 segment. This text must match an APPROVED Eskiz template exactly.
   */
  private buildOtpMessage(code: string): string {
    const hash = config.eskiz.otpAppHash;
    if (!hash) {
      return `Код верификации для входа к мобильному приложению UbexGo: ${code}`;
    }

    const withHash = `Код верификации для входа в приложение UbexGo: ${code}\n${hash}`;

    // Guard both limits: the retriever's delivery cap and the single-segment cap.
    const bytes = Buffer.byteLength(withHash, 'utf8');
    const chars = withHash.length;
    if (bytes > SMS_RETRIEVER_MAX_BYTES || chars > SMS_UCS2_SINGLE_SEGMENT_CHARS) {
      console.warn(
        `OTP SMS with app hash is ${chars} chars / ${bytes} bytes (limits: ` +
          `${SMS_UCS2_SINGLE_SEGMENT_CHARS} chars, ${SMS_RETRIEVER_MAX_BYTES} bytes). ` +
          'It would split or be ignored by SMS Retriever. Sending the plain message instead.'
      );
      return `Код верификации для входа к мобильному приложению UbexGo: ${code}`;
    }
    return withHash;
  }

  /**
   * Send OTP via SMS using Eskiz
   */
  private async sendSms(phone: string, code: string): Promise<boolean> {
    try {
      const token = await this.authenticateEskiz();
      // Clean phone number - Eskiz expects format without +
      const cleanPhone = phone.replace(/\+/g, '');
      // 🔒 T-034: never log `code` — this line used to print it verbatim.
      console.log(`Sending OTP SMS to ${maskPhone(cleanPhone)}`);

      const response = await this.eskizClient.post<EskizSendResponse>(
        '/message/sms/send',
        {
          mobile_phone: cleanPhone,
          message: this.buildOtpMessage(code),
          from: '4546',
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // 🔒 T-034: response bodies from Eskiz can echo the message text, which
      // contains the code. Log only the outcome, below.
      
      // Check for both 'success' and 'waiting' statuses as valid
      const isSuccess = response.data.status === 'success' || response.data.status === 'waiting';
      
      if (isSuccess) {
        console.log('SMS sent successfully');
      } else {
        // 🔒 T-034: `response.data` can echo the message text (with the code).
        console.warn(`SMS send failed, status=${response.data?.status ?? 'unknown'}`);
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
   * Check rate limits for OTP sending.
   *
   * Throws an `AppError` with **429**, not a bare Error: hitting the cooldown is an
   * expected outcome of tapping "resend", and the controller's catch-all turns any
   * plain Error into a 500 — which is what made a routine refusal look like a crash.
   * The message is translated and `retryAfterSec` is real (measured from the newest
   * code), so the app can show and drive a countdown instead of a generic toast.
   */
  private async checkRateLimit(phone: string, language: Language = DEFAULT_LANGUAGE): Promise<void> {
    const now = Date.now();

    // Check: max 1 request per minute. Fetch the newest code rather than counting, so
    // the response can say how many seconds are actually left.
    const newestCode = await OtpCode.findOne({
      where: {
        target: phone,
        created_at: {
          [Op.gte]: new Date(now - OTP_RESEND_COOLDOWN_SEC * 1000),
        },
      },
      order: [['created_at', 'DESC']],
    });

    if (newestCode) {
      const elapsedMs = now - new Date(newestCode.created_at).getTime();
      const retryAfterSec = Math.max(
        1,
        Math.ceil((OTP_RESEND_COOLDOWN_SEC * 1000 - elapsedMs) / 1000)
      );
      throw new AppError(
        t('otp.tooSoon', language, { seconds: retryAfterSec }),
        HttpStatus.TOO_MANY_REQUESTS,
        { retryAfterSec }
      );
    }

    // Runaway guard on top of the per-minute cooldown. The real per-hour ceiling is
    // enforced by `otpSendLimiter` (5/hour/phone); this one only catches a client that
    // has somehow slipped past both, and is deliberately generous so a pod restart
    // (which clears the limiter's in-memory store) cannot lock a real user out.
    const hourlyCount = await OtpCode.count({
      where: {
        target: phone,
        created_at: {
          [Op.gte]: new Date(now - 60 * 60 * 1000),
        },
      },
    });

    if (hourlyCount >= OTP_MAX_PER_HOUR) {
      throw new AppError(
        t('otp.tooManyRequests', language),
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  /**
   * Send OTP code
   */
  async sendOtp(
    phone: string,
    channel: 'sms' | 'call' | 'push' = 'sms',
    metadata?: Record<string, any>,
    language: Language = DEFAULT_LANGUAGE
  ): Promise<{ sent: boolean; expiresInSec: number; cooldownSec: number }> {
    // Validate phone number
    if (!this.validatePhone(phone)) {
      throw new Error('Invalid phone number format');
    }

    // Check rate limits
    await this.checkRateLimit(phone, language);

    // Generate OTP code
    const code = this.generateCode();

    // Calculate expiry
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);
    
    // 🔒 T-034: this block used to print the OTP **code** in clear text, along
    // with the phone number and the full metadata. The owner's own `kubectl
    // logs` paste on 2026-08-08 contained a live code — anyone with log access
    // could sign in as any user. A log line is not a private place.
    console.log(`sendOtp: channel=${channel} target=${maskPhone(phone)} expires=${expiresAt.toISOString()}`);

    // 🔒 T-034: retire any code still live for this phone before issuing a new
    // one, so exactly ONE code is valid at a time.
    //
    // This matters because `verifyOtp` now looks up by target alone (it must, or
    // the attempt cap can never fire). Without this, a resend would leave the
    // previous code live but unreachable: a user who typed the FIRST SMS after
    // requesting a second would be told it was wrong. Under the old
    // lookup-by-code both happened to work, so tightening the read without
    // tightening the write would have traded a security hole for a usability one.
    await OtpCode.destroy({
      where: {
        target: phone,
        expires_at: { [Op.gte]: new Date() },
      },
    });

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
        const user = await User.findOne({ where: { phone_e164: phone } });
        // 🔒 T-034: never log the whole user row (phone, names, ids).
        if (!user) {
          throw new Error('User not found for provided phone');
        }

        // Find latest push token for user app
        const push = await PushToken.findOne({
          where: { user_id: user.id, app: 'user' },
          order: [['updated_at', 'DESC']],
        });
        // 🔒 T-034: never log the device push token — it is a send capability.
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
        phone: maskPhone(phone),
        channel,
        sent,
      },
    });

    return {
      sent,
      expiresInSec: config.otp.expiryMinutes * 60,
      // The apps drive their "resend" countdown from this, so the cooldown lives in
      // exactly one place instead of being hard-coded on three clients.
      cooldownSec: OTP_RESEND_COOLDOWN_SEC,
    };
  }

  /**
   * Verify OTP code
   */
  /**
   * 🔒 T-034: the attempt cap only became real here.
   *
   * This used to look the row up by **`{ target, code }`**. A WRONG code
   * therefore matched no row at all and returned at the `!otpRecord` branch —
   * long before the `attempts` increment below. So `attempts` counted only
   * *correct* codes, `config.otp.maxAttempts` (5) never fired once, and the
   * comparison `otpRecord.code === code` was tautological: the query had
   * already done the matching, so the `else` branch was unreachable.
   *
   * On a **4-digit** code (`OTP_CODE_LENGTH` default) that left `otpVerifyLimiter`
   * — 10 tries per 5 minutes — as the only brute-force defence.
   *
   * Now: find the newest live code by **target alone**, count the attempt, and
   * only then compare. `maxAttempts` and the audit reasons mean what they say.
   */
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    // Newest live code for this target — NOT filtered by the submitted code,
    // which is the whole point.
    const otpRecord = await OtpCode.findOne({
      where: {
        target: phone,
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
          phone: maskPhone(phone),
          reason: 'Code not found or expired',
        },
      });
      return false;
    }

    // Check max attempts. Reached by wrong codes now, so it can actually fire.
    if (otpRecord.attempts >= config.otp.maxAttempts) {
      await logAudit({
        action: AuditActions.AUTH_OTP_VERIFY_FAILED,
        payload: {
          phone: maskPhone(phone),
          reason: 'Max attempts exceeded',
        },
      });
      return false;
    }

    // Count the attempt BEFORE comparing, so a wrong guess always costs one
    // even if something below throws.
    await otpRecord.update({
      attempts: otpRecord.attempts + 1,
    });

    // A real comparison at last. `timingSafeEqual` needs equal-length buffers,
    // so length is checked first — an OTP's length is not a secret.
    const submitted = String(code ?? '');
    const expected = String(otpRecord.code ?? '');
    const isValid =
      submitted.length === expected.length &&
      timingSafeEqual(Buffer.from(submitted), Buffer.from(expected));

    if (isValid) {
      // Delete OTP after successful verification
      await otpRecord.destroy();

      await logAudit({
        action: AuditActions.AUTH_OTP_VERIFY,
        payload: {
          phone: maskPhone(phone),
          channel: otpRecord.channel,
        },
      });
    } else {
      await logAudit({
        action: AuditActions.AUTH_OTP_VERIFY_FAILED,
        payload: {
          phone: maskPhone(phone),
          reason: 'Invalid code',
          // Now meaningful: how many of the allowed tries are gone.
          attempts: otpRecord.attempts + 1,
          maxAttempts: config.otp.maxAttempts,
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

