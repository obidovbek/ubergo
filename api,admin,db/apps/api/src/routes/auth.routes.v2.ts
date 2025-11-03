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
router.post('/refresh', authLimiter, asyncHandler(AuthController.refreshToken));
router.post('/logout', authLimiter, asyncHandler(AuthController.logout));

// User info
router.get('/me', authLimiter, asyncHandler(AuthController.getCurrentUser));

export default router;

