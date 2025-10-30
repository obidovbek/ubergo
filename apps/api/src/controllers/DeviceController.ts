import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { PushToken } from '../database/models/index.js';
import { AppError } from '../errors/AppError.js';

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
}


