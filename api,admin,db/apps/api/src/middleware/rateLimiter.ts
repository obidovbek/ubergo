/**
 * Rate Limiting Middleware
 * Protects against abuse and brute force attacks
 */

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * General API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OTP send rate limiter (stricter)
 * Prevents SMS/call abuse
 */
export const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 OTP requests per hour per IP
  message: 'Too many OTP requests. Please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req: Request) => {
    // Use phone number if available, fallback to IP
    const phone = req.body?.phone;
    return phone || req.ip || 'unknown';
  },
});

/**
 * OTP verify rate limiter
 * Prevents brute force attacks
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 verification attempts per 5 minutes
  message: 'Too many verification attempts. Please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful verifications
  keyGenerator: (req: Request) => {
    const phone = req.body?.phone;
    return phone || req.ip || 'unknown';
  },
});

/**
 * Auth endpoints rate limiter
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 auth requests per 15 minutes
  message: 'Too many authentication attempts. Please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * SSO rate limiter
 */
export const ssoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 SSO attempts per 15 minutes
  message: 'Too many SSO login attempts. Please try again later',
  standardHeaders: true,
  legacyHeaders: false,
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
    message: options.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator,
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

