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
        let base64Data = req.body.image;
        
        // Remove data URL prefix if present (data:image/jpeg;base64, or data:image/png;base64, etc.)
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
        } else if (base64Data.match(/^data:image\/\w+;base64,/)) {
          base64Data = base64Data.replace(/^data:image\/\w+;base64,/, '');
        }
        
        // Validate base64 string
        if (!base64Data || base64Data.trim().length === 0) {
          throw new AppError('Invalid base64 image data', 400);
        }
        
        // Validate file size (max 5MB)
        const buffer = Buffer.from(base64Data, 'base64');
        if (buffer.length > config.upload.maxFileSize) {
          throw new AppError(`Image size exceeds maximum allowed size of ${config.upload.maxFileSize / 1024 / 1024}MB`, 400);
        }
        
        // Validate file extension
        const fileExtension = (req.body.type || 'jpg').toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        const normalizedExt = fileExtension === 'jpeg' ? 'jpg' : fileExtension;
        
        if (!allowedExtensions.includes(normalizedExt)) {
          throw new AppError(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`, 400);
        }
        
        const fileName = `${crypto.randomUUID()}.${normalizedExt}`;
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

