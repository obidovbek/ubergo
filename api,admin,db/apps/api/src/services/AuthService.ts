/**
 * Authentication Service
 * Business logic for authentication
 */

import { UserModel } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { AuthResponse, UserDTO } from '../types';
import { UserRole } from '../constants';
import { UnauthorizedError, ConflictError, BadRequestError } from '../errors/AppError';
import { ERROR_MESSAGES } from '../constants';

export class AuthService {
  static async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
  }): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError(ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await UserModel.create({
      ...data,
      password: hashedPassword,
    });

    // Generate tokens
    const userDTO = UserModel.toDTO(user);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: userDTO,
      token,
      refreshToken,
    };
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      throw new UnauthorizedError(ERROR_MESSAGES.USER_SUSPENDED);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const userDTO = UserModel.toDTO(user);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: userDTO,
      token,
      refreshToken,
    };
  }

  static async getCurrentUser(userId: string): Promise<UserDTO> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return UserModel.toDTO(user);
  }
}

