/**
 * Admin Authentication Service
 * Business logic for admin authentication
 */

import { AdminUserModel } from '../models/AdminUser.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.js';
import type { AdminAuthResponse, AdminUserDTO, AdminAuthTokenPayload } from '../types/index.js';
import { UnauthorizedError, ConflictError, BadRequestError } from '../errors/AppError.js';
import { ERROR_MESSAGES } from '../constants/index.js';

export class AdminAuthService {
  static async register(data: {
    email: string;
    password: string;
    full_name: string;
    role_slugs: string[];
    created_by?: string;
  }): Promise<AdminAuthResponse> {
    // Check if admin user already exists
    const existingAdmin = await AdminUserModel.findByEmail(data.email, false);
    if (existingAdmin) {
      throw new ConflictError(ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create admin user
    const adminUser = await AdminUserModel.create({
      email: data.email,
      password_hash: hashedPassword,
      full_name: data.full_name,
      role_slugs: data.role_slugs,
      created_by: data.created_by || null,
    });

    // Generate tokens
    const adminUserDTO = AdminUserModel.toDTO(adminUser);
    const roleSlugs = adminUserDTO.roles.map(r => r.slug);
    
    const token = generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      roles: roleSlugs,
    });
    const refreshToken = generateRefreshToken({
      userId: adminUser.id,
      email: adminUser.email,
      roles: roleSlugs,
    });

    return {
      user: adminUserDTO,
      token,
      refreshToken,
    };
  }

  static async login(email: string, password: string, ip?: string): Promise<AdminAuthResponse> {
    // Find admin user
    const adminUser = await AdminUserModel.findByEmail(email, true);
    if (!adminUser) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if admin user is active
    if (adminUser.status !== 'active') {
      throw new UnauthorizedError('Admin hisobi faol emas');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, adminUser.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Update last login
    await AdminUserModel.updateLastLogin(adminUser.id, ip);

    // Generate tokens
    const adminUserDTO = AdminUserModel.toDTO(adminUser);
    const roleSlugs = adminUserDTO.roles.map(r => r.slug);
    
    const token = generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      roles: roleSlugs,
    });
    const refreshToken = generateRefreshToken({
      userId: adminUser.id,
      email: adminUser.email,
      roles: roleSlugs,
    });

    return {
      user: adminUserDTO,
      token,
      refreshToken,
    };
  }

  static async getCurrentAdmin(userId: string): Promise<AdminUserDTO> {
    const adminUser = await AdminUserModel.findById(userId, true);
    if (!adminUser) {
      throw new UnauthorizedError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return AdminUserModel.toDTO(adminUser);
  }
}

