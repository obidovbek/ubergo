/**
 * Rate Limiting Middleware
 * Protects against abuse and brute force attacks
 */

import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { t } from '../i18n/translator.js';

/**
 * express-rate-limit's `message` option is sent as a **bare string**, which arrives as
 * a text/plain body. Every client in this project calls `response.json()` on an error
 * response, so a limited request surfaced as `JSON Parse error` instead of the message
 * — the user was told nothing at all.
 *
 * This replies in the same envelope as `errorHandler`, translated, and carries the
 * real `retryAfterSec` so the apps can drive a countdown from it.
 */
const jsonLimitHandler =
  (translationKey: string, fallback: string) =>
  (req: Request, res: Response, _next: NextFunction, options: any): void => {
    const language = getLanguageFromHeaders(req.headers['accept-language']);
    // `t` returns the key itself when it is missing — fall back to English then.
    const translated = t(translationKey, language);

    const resetTime = (req as any).rateLimit?.resetTime as Date | undefined;
    const retryAfterSec = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : undefined;

    res.status(options.statusCode).json({
      success: false,
      message: translated === translationKey ? fallback : translated,
      ...(retryAfterSec !== undefined ? { data: { retryAfterSec } } : {}),
    });
  };

/**
 * General API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler(
    'common.tooManyRequests',
    'Too many requests from this IP, please try again later'
  ),
});

/**
 * OTP send rate limiter (stricter)
 * Prevents SMS/call abuse
 */
export const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 OTP requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req: Request) => {
    // Use phone number if available, fallback to IP
    const phone = req.body?.phone;
    return phone || req.ip || 'unknown';
  },
  handler: jsonLimitHandler(
    'otp.tooManyRequests',
    'Too many OTP requests. Please try again later'
  ),
});

/**
 * OTP verify rate limiter
 * Prevents brute force attacks
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 verification attempts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful verifications
  keyGenerator: (req: Request) => {
    const phone = req.body?.phone;
    return phone || req.ip || 'unknown';
  },
  handler: jsonLimitHandler(
    'otp.maxAttempts',
    'Too many verification attempts. Please try again later'
  ),
});

/**
 * Auth endpoints rate limiter
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 auth requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler(
    'common.tooManyRequests',
    'Too many authentication attempts. Please try again later'
  ),
});

/**
 * SSO rate limiter
 */
export const ssoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 SSO attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler(
    'common.tooManyRequests',
    'Too many SSO login attempts. Please try again later'
  ),
});

/**
 * Custom rate limiter for specific routes
 */
export function createRateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator,
    handler: jsonLimitHandler(
      'common.tooManyRequests',
      options.message || 'Too many requests'
    ),
  });
}

export default {
  generalLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  authLimiter,
  ssoLimiter,
  createRateLimiter,
};
