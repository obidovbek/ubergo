/**
 * Error Handling Middleware with i18n support
 */

import type { Request, Response, NextFunction } from 'express';
import { HttpStatus, ErrorMessages } from '../constants/index.js';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { t } from '../i18n/translator.js';
import { ValidationError } from './validator.js';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const language = getLanguageFromHeaders(req.headers['accept-language']);
  const error = new AppError(
    t('common.notFound', language),
    HttpStatus.NOT_FOUND
  );
  next(error);
};

// Global error handler
export const errorHandler = (
  err: Error | AppError | ValidationError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const language = getLanguageFromHeaders(req.headers['accept-language']);
  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let message = t('common.serverError', language);
  let errors: any = undefined;

  if (err instanceof ValidationError) {
    // Validation errors with field-specific messages
    statusCode = err.statusCode;
    message = t('validation.invalid', language, { field: '' });
    errors = err.errors;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = HttpStatus.BAD_REQUEST;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = HttpStatus.UNAUTHORIZED;
    message = t('common.unauthorized', language);
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = HttpStatus.BAD_REQUEST;
    message = t('validation.invalid', language, { field: '' });
    errors = (err as any).errors?.map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = HttpStatus.CONFLICT;
    message = t('common.conflict', language);
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  const response: any = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
