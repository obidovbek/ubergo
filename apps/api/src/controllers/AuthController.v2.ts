/**
 * Auth Controller v2
 * Handles OTP, SSO, and token-based authentication
 */

import type { Request, Response } from 'express';
import { User } from '../database/models/index.js';
import OtpService from '../services/OtpService.js';
import SsoService from '../services/SsoService.js';
import { generateTokenPair, rotateTokens, revokeToken, verifyAccessToken } from '../utils/jwt.js';
import { logAudit, AuditActions } from '../utils/auditLogger.js';
import { AppError } from '../errors/AppError.js';

/**
 * Send OTP code
 * POST /auth/otp/send
 */
export async function sendOtp(req: Request, res: Response): Promise<void> {
  try {
    const { phone: rawPhone, userId, channel = 'sms' } = req.body as any;

    let phone = rawPhone as string | undefined;

    if (!phone && userId) {
      const user = await User.findByPk(userId);
      if (!user || !user.phone_e164) {
        throw new AppError('User not found or phone missing', 404);
      }
      phone = user.phone_e164;
    }

    if (!phone) {
      throw new AppError('Phone number or userId is required', 400);
    }

    if (!['sms', 'call', 'push'].includes(channel)) {
      throw new AppError('Invalid channel. Use "sms", "call" or "push"', 400);
    }

    const metadata = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    const result = await OtpService.sendOtp(phone, channel as any, metadata);

    res.status(200).json({
      success: true,
      data: {
        sent: result.sent,
        channel,
        expiresInSec: result.expiresInSec,
      },
      message: `Verification code sent via ${channel}`,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to send OTP', 500);
  }
}

/**
 * Verify OTP code and login/register
 * POST /auth/otp/verify
 */
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { phone: rawPhone, userId, code } = req.body as any;

    let phone = rawPhone as string | undefined;
    if (!phone && userId) {
      const userById = await User.findByPk(userId);
      if (!userById || !userById.phone_e164) {
        throw new AppError('User not found or phone missing', 404);
      }
      phone = userById.phone_e164;
    }

    if (!phone || !code) {
      throw new AppError('Phone number or userId and code are required', 400);
    }

    // Verify OTP
    const isValid = await OtpService.verifyOtp(phone, code);

    if (!isValid) {
      throw new AppError('Invalid or expired code', 400);
    }

    // Find or create user
    let user = await User.findOne({ where: { phone_e164: phone } });

    if (!user) {
      // Create new user
      user = await User.create({
        phone_e164: phone,
        is_verified: true,
        status: 'active',
        role: 'user',
        profile_complete: false,
      });

      await logAudit({
        userId: user.id,
        action: AuditActions.USER_REGISTER,
        payload: { method: 'otp', phone },
        req,
      });
    } else {
      // Update verification status
      if (!user.is_verified) {
        await user.update({ is_verified: true });
      }
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      phone: user.phone_e164 || '',
      email: user.email || '',
      role: user.role,
    });

    await logAudit({
      userId: user.id,
      action: AuditActions.AUTH_OTP_VERIFY,
      payload: { phone },
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        access: tokens.access,
        refresh: tokens.refresh,
        user: {
          id: user.id,
          phone_e164: user.phone_e164,
          email: user.email,
          display_name: user.display_name,
          is_verified: user.is_verified,
          role: user.role,
          status: user.status,
          profile_complete: user.profile_complete || false,
        },
      },
      message: 'Authentication successful',
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to verify OTP', 500);
  }
}

/**
 * Google SSO authentication
 * POST /auth/social/google
 */
export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      throw new AppError('Google ID token is required', 400);
    }

    // Authenticate with Google
    const user = await SsoService.authenticate('google', id_token);

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      phone: user.phone_e164 || '',
      email: user.email || '',
      role: user.role,
    });

    await logAudit({
      userId: user.id,
      action: AuditActions.AUTH_SSO_LOGIN,
      payload: { provider: 'google' },
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        access: tokens.access,
        refresh: tokens.refresh,
        user: {
          id: user.id,
          phone_e164: user.phone_e164,
          email: user.email,
          display_name: user.display_name,
          is_verified: user.is_verified,
          role: user.role,
          status: user.status,
        },
      },
      message: 'Google authentication successful',
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Google authentication failed', 500);
  }
}

/**
 * Apple SSO authentication
 * POST /auth/social/apple
 */
export async function appleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      throw new AppError('Apple ID token is required', 400);
    }

    // Authenticate with Apple
    const user = await SsoService.authenticate('apple', id_token);

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      phone: user.phone_e164 || '',
      email: user.email || '',
      role: user.role,
    });

    await logAudit({
      userId: user.id,
      action: AuditActions.AUTH_SSO_LOGIN,
      payload: { provider: 'apple' },
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        access: tokens.access,
        refresh: tokens.refresh,
        user: {
          id: user.id,
          phone_e164: user.phone_e164,
          email: user.email,
          display_name: user.display_name,
          is_verified: user.is_verified,
          role: user.role,
          status: user.status,
        },
      },
      message: 'Apple authentication successful',
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Apple authentication failed', 500);
  }
}

/**
 * Facebook SSO authentication
 * POST /auth/social/facebook
 */
export async function facebookAuth(req: Request, res: Response): Promise<void> {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      throw new AppError('Facebook access token is required', 400);
    }

    const user = await SsoService.authenticate('facebook', access_token);
    const tokens = generateTokenPair({
      userId: user.id,
      phone: user.phone_e164 || '',
      email: user.email || '',
      role: user.role,
    });

    await logAudit({
      userId: user.id,
      action: AuditActions.AUTH_SSO_LOGIN,
      payload: { provider: 'facebook' },
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        access: tokens.access,
        refresh: tokens.refresh,
        user: {
          id: user.id,
          phone_e164: user.phone_e164,
          email: user.email,
          display_name: user.display_name,
          is_verified: user.is_verified,
          role: user.role,
          status: user.status,
        },
      },
      message: 'Facebook authentication successful',
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Facebook authentication failed', 500);
  }
}

/**
 * Refresh access token
 * POST /auth/refresh
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refresh } = req.body;

    if (!refresh) {
      throw new AppError('Refresh token is required', 400);
    }

    // Rotate tokens
    const newTokens = rotateTokens(refresh);

    await logAudit({
      action: AuditActions.AUTH_REFRESH,
      payload: { tokenRotated: true },
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        access: newTokens.access,
        refresh: newTokens.refresh,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to refresh token', 401);
  }
}

/**
 * Logout (revoke tokens)
 * POST /auth/logout
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refresh } = req.body;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (refresh) {
      revokeToken(refresh);
    }

    if (accessToken) {
      revokeToken(accessToken);
    }

    // Get user ID from access token if available
    let userId: string | undefined;
    if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken);
        userId = payload.userId;
      } catch (error) {
        // Token might be expired, that's okay for logout
      }
    }

    await logAudit({
      userId: userId || '',
      action: AuditActions.AUTH_LOGOUT,   
      payload: { tokensRevoked: true },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to logout', 500);
  }
}

/**
 * Get current user
 * GET /auth/me
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    const payload = verifyAccessToken(token);

    const user = await User.findByPk(payload.userId, {
      attributes: ['id', 'phone_e164', 'email', 'display_name', 'is_verified', 'role', 'status', 'created_at', 'updated_at'],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.status === 'blocked') {
      throw new AppError('User account is blocked', 403);
    }

    if (user.status === 'pending_delete') {
      throw new AppError('User account is pending deletion', 403);
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        phone_e164: user.phone_e164,
        email: user.email,
        display_name: user.display_name,
        is_verified: user.is_verified,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to get user info', 500);
  }
}

export default {
  sendOtp,
  verifyOtp,
  googleAuth,
  appleAuth,
  facebookAuth,
  refreshToken,
  logout,
  getCurrentUser,
};

