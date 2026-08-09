/**
 * Auth Routes v2
 * OTP, SSO, and token management routes
 */

import { Router } from 'express';
import * as AuthController from '../controllers/AuthController.v2.js';
import {
  otpSendLimiter,
  otpVerifyLimiter,
  authLimiter,
  refreshLimiter,
  sessionReadLimiter,
  ssoLimiter,
} from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// OTP routes
router.post('/otp/send', otpSendLimiter, asyncHandler(AuthController.sendOtp));
router.post('/otp/verify', otpVerifyLimiter, asyncHandler(AuthController.verifyOtp));

// SSO routes
router.post('/social/google', ssoLimiter, asyncHandler(AuthController.googleAuth));
router.post('/social/apple', ssoLimiter, asyncHandler(AuthController.appleAuth));
router.post('/social/facebook', ssoLimiter, asyncHandler(AuthController.facebookAuth));

// Token management
// ⚠️ T-041: refresh gets its OWN per-user budget. On `authLimiter` it shared
// 20 requests / 15 min / IP with logout and `/me`, and the resulting 429 was
// read by both apps as "your session is over". Logout stays — it is rare.
router.post('/refresh', refreshLimiter, asyncHandler(AuthController.refreshToken));
router.post('/logout', authLimiter, asyncHandler(AuthController.logout));

// User info
// ⚠️ T-041: fires on EVERY app launch — it must not sit on a brute-force budget.
router.get('/me', sessionReadLimiter, asyncHandler(AuthController.getCurrentUser));

export default router;

