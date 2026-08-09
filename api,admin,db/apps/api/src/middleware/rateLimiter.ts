/**
 * Rate Limiting Middleware
 * Protects against abuse and brute force attacks
 */

import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
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
 * ⚠️⚠️ TEMPORARY — TESTING ONLY. REVERT BEFORE PRODUCTION. ⚠️⚠️
 *
 * Owner request, 2026-08-09: shorten the auth-family window to **1 minute** so a
 * limit hit during device testing clears in a minute instead of a quarter of an
 * hour. T-041's step 7 needs repeated sign-out/sign-in cycles, and a 15-minute
 * lockout after each mistake makes that unworkable.
 *
 * 🛑 **This is a real loosening, not a no-op.** The `max` values are unchanged,
 * so a 1-minute window multiplies every allowed rate by **15** — `authLimiter`
 * becomes 20 login attempts *per minute*, which is a brute-force budget, not a
 * defence. Acceptable on test3 while testing; **must not ship**.
 *
 * To revert: set this back to `15 * 60 * 1000`. One line, one place — which is
 * why it is a constant rather than four edited call sites.
 */
const AUTH_WINDOW_MS = 1 * 60 * 1000; // ← REVERT TO 15 * 60 * 1000

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
 *
 * ⚠️ T-041: this used to also guard `POST /auth/refresh` and `GET /auth/me`.
 * It must not again — see `refreshLimiter` and `sessionReadLimiter` below.
 */
export const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS, // ⚠️ TESTING: 1 min (was 15)
  max: 20, // per window — see AUTH_WINDOW_MS
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler(
    'common.tooManyRequests',
    'Too many authentication attempts. Please try again later'
  ),
});

/**
 * Bucket key for the two token-bearing routes below.
 *
 * T-041: keying these on `req.ip` is what made them fire in ordinary use. One
 * phone runs BOTH apps behind a single IP, an office Wi-Fi puts every tester
 * behind one, and a mobile carrier NAT puts thousands of real users behind one
 * — so an IP-keyed budget is really a shared budget. The token in the request
 * says who is actually asking, so key on that instead.
 *
 * ⚠️ The token is DECODED, never verified — this picks a counter and grants
 * nothing. A forged `userId` buys an attacker their own empty bucket, which is
 * precisely what a per-user limit hands out anyway, and the endpoints still
 * reject the unsigned token itself. Falls back to the IP when no token is
 * readable, which is the same shape as `otpSendLimiter`'s `phone || req.ip`.
 */
const tokenSubjectKey = (token: string | undefined, req: Request): string => {
  if (token) {
    try {
      const decoded = jwt.decode(token) as { userId?: string } | null;
      if (decoded?.userId) return `user:${decoded.userId}`;
    } catch {
      // Unreadable token — fall through to the IP.
    }
  }
  return `ip:${req.ip || 'unknown'}`;
};

/**
 * Token refresh limiter — `POST /auth/refresh`.
 *
 * A healthy app refreshes about 4×/hour (the access token lives 15 minutes),
 * and a phone with both apps installed doubles that to ~8/hour. 30 per 15
 * minutes leaves a wide margin for restarts and retries while still capping a
 * runaway client.
 *
 * 🛑 Do NOT fold this back into `authLimiter`. Sharing a 20-per-15-minutes
 * budget with `/auth/logout` and `GET /auth/me` — which fires on EVERY app
 * launch — is what produced the 429 that both apps read as "your session is
 * over", logging real users out for a quarter of an hour at a time (T-041).
 */
export const refreshLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS, // ⚠️ TESTING: 1 min (was 15)
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => tokenSubjectKey(req.body?.refresh, req),
  handler: jsonLimitHandler(
    'common.tooManyRequests',
    'Too many token refreshes. Please try again later'
  ),
});

/**
 * Session read limiter — `GET /auth/me`.
 *
 * An authenticated read that both apps call on every cold start. It verifies
 * the access token itself, so it is not a brute-force target and does not
 * belong on a brute-force budget; it only needs a ceiling on a client stuck in
 * a loop (which T-017 was — the driver app re-checked the profile forever until
 * the API rate-limited it).
 */
export const sessionReadLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS, // ⚠️ TESTING: 1 min (was 15)
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    tokenSubjectKey(req.headers.authorization?.replace('Bearer ', ''), req),
  handler: jsonLimitHandler(
    'common.tooManyRequests',
    'Too many requests. Please try again later'
  ),
});

/**
 * SSO rate limiter
 */
export const ssoLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS, // ⚠️ TESTING: 1 min (was 15)
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
  refreshLimiter,
  sessionReadLimiter,
  ssoLimiter,
  createRateLimiter,
};
