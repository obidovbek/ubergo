/**
 * Admin Authentication Middleware
 */

import type { Response, NextFunction } from 'express';
import type { AdminAuthRequest } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../errors/AppError.js';

export const authenticateAdmin = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    const token = authHeader.substring(7);
    const decoded: any = verifyToken(token);
    
    // Verify it has admin roles
    const roles: string[] = decoded.roles || [];
    const adminRoleSlugs = ['main_admin', 'dispatcher', 'support', 'manager', 'viewer'];
    const hasAdminRole = roles.some((role: string) => adminRoleSlugs.includes(role));
    
    if (!hasAdminRole) {
      throw new UnauthorizedError('Invalid admin token');
    }
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email || '',
      roles: roles,
    };
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const authorizeAdmin = (...requiredRoles: string[]) => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};

