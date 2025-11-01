import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { PushToken, User } from '../database/models/index.js';
import { AppError } from '../errors/AppError.js';
import { ForeignKeyConstraintError } from 'sequelize';

export async function registerDevice(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const { token, platform, app = 'user' } = req.body as {
    token: string;
    platform: 'android' | 'ios';
    app?: 'user' | 'driver';
  };

  if (!token || !platform) {
    throw new AppError('token and platform are required', 400);
  }

  // Verify user exists before attempting to register device
  const userExists = await User.findByPk(req.user.userId);
  if (!userExists) {
    throw new AppError('User not found. Please log in again.', 404);
  }

  try {
    // Upsert by token
    const [record] = await PushToken.upsert({
      token,
      user_id: req.user.userId,
      platform,
      app,
    });

    res.status(200).json({
      success: true,
      data: { id: record.id },
      message: 'Device registered',
    });
  } catch (error: any) {
    // Handle foreign key constraint errors specifically
    if (error instanceof ForeignKeyConstraintError) {
      throw new AppError('User not found. Please log in again.', 404);
    }
    throw error;
  }
}


