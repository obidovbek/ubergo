/**
 * Authentication Middleware
 */

import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../errors/AppError.js';
import { UserRole } from '../constants/index.js';
import { UserModel } from '../models/User.js';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { t } from '../i18n/translator.js';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // T-038: this middleware runs before any handler, so there is no user record to
  // read a language preference from — the header is all we have. Every message
  // below used to be hard-coded English, which is what the owner saw on a device.
  const language = getLanguageFromHeaders(req.headers['accept-language']);

  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(t('auth.noToken', language));
    }
    const token = authHeader.substring(7);

    let decoded: ReturnType<typeof verifyToken>;
    try {
      decoded = verifyToken(token);
    } catch {
      throw new UnauthorizedError(t('auth.tokenExpired', language));
    }

    // OR-002: reject tokens whose account no longer exists, so an admin delete takes
    // effect immediately on every endpoint (not only on /auth/me). Blocked/pending_delete
    // users still pass here — the app routes them to its BlockedScreen.
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError(t('auth.accountNotFound', language));
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    // Unexpected error (e.g. DB unavailable) — surface it as-is instead of turning a
    // transient outage into a false "invalid token" that would log everyone out.
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const language = getLanguageFromHeaders(req.headers['accept-language']);

    if (!req.user) {
      return next(new UnauthorizedError(t('auth.notAuthenticated', language)));
    }

    if (!roles.includes(req.user.role)) {
      return next(new UnauthorizedError(t('auth.insufficientPermissions', language)));
    }

    next();
  };
};
