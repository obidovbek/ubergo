/**
 * Authentication Middleware
 */

import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../errors/AppError.js';
import { UserRole } from '../constants/index.js';
import { UserModel } from '../models/User.js';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    const token = authHeader.substring(7);

    let decoded: ReturnType<typeof verifyToken>;
    try {
      decoded = verifyToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // OR-002: reject tokens whose account no longer exists, so an admin delete takes
    // effect immediately on every endpoint (not only on /auth/me). Blocked/pending_delete
    // users still pass here — the app routes them to its BlockedScreen.
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('Account no longer exists');
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
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};
