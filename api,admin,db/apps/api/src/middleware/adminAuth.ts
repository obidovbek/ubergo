/**
 * Admin Authentication Middleware
 */

import type { Response, NextFunction } from 'express';
import type { AdminAuthRequest } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../errors/AppError.js';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { t } from '../i18n/translator.js';

export const authenticateAdmin = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const language = getLanguageFromHeaders(req.headers['accept-language']);

  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(t('auth.noToken', language));
    }
    const token = authHeader.substring(7);
    const decoded: any = verifyToken(token);

    // Verify it has admin roles
    const roles: string[] = decoded.roles || [];
    const adminRoleSlugs = ['main_admin', 'dispatcher', 'support', 'manager', 'viewer'];
    const hasAdminRole = roles.some((role: string) => adminRoleSlugs.includes(role));

    if (!hasAdminRole) {
      throw new UnauthorizedError(t('auth.adminTokenInvalid', language));
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email || '',
      roles: roles,
    };
    next();
  } catch (error) {
    // T-038: this catch used to rewrite EVERY failure as "Invalid or expired
    // token", including the two specific errors thrown above — so translating
    // them would have been pointless, they never reached the client. Pass an
    // UnauthorizedError through unchanged and only map the rest.
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    next(new UnauthorizedError(t('auth.tokenExpired', language)));
  }
};

export const authorizeAdmin = (...requiredRoles: string[]) => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction): void => {
    const language = getLanguageFromHeaders(req.headers['accept-language']);

    if (!req.user) {
      return next(new UnauthorizedError(t('auth.notAuthenticated', language)));
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return next(new UnauthorizedError(t('auth.insufficientPermissions', language)));
    }

    next();
  };
};

