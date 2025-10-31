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
router.post('/otp/send',  asyncHandler(AuthController.sendOtp));
router.post('/otp/verify',  asyncHandler(AuthController.verifyOtp));

// SSO routes
router.post('/social/google',  asyncHandler(AuthController.googleAuth));
router.post('/social/apple',  asyncHandler(AuthController.appleAuth));
router.post('/social/facebook',  asyncHandler(AuthController.facebookAuth));

// Token management
router.post('/refresh',  asyncHandler(AuthController.refreshToken));
router.post('/logout',  asyncHandler(AuthController.logout));

// User info
router.get('/me',  asyncHandler(AuthController.getCurrentUser));

export default router;

