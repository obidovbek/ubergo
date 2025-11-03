/**
 * Upload Controller
 * Handles file/image uploads
 */

import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../utils/response.js';
import { AppError } from '../errors/AppError.js';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/index.js';
import crypto from 'crypto';

export class UploadController {
  /**
   * POST /api/upload/image
   * Upload an image file (accepts base64 or multipart/form-data)
   */
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      // Handle base64 image
      if (req.body.image) {
        const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileExtension = req.body.type || 'jpg';
        const fileName = `${crypto.randomUUID()}.${fileExtension}`;
        const filePath = path.join(config.upload.uploadPath, 'driver-photos', fileName);

        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        // Write file
        await fs.writeFile(filePath, buffer);

        // Return URL (relative to server)
        const fileUrl = `/uploads/driver-photos/${fileName}`;

        return successResponse(res, {
          url: fileUrl,
          fileName,
          message: 'Image uploaded successfully'
        });
      }

      throw new AppError('No image provided', 400);
    } catch (error) {
      next(error);
    }
  }
}

