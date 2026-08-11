/**
 * Error Handling Middleware with i18n support
 */

import type { Request, Response, NextFunction } from 'express';
import { HttpStatus, ErrorMessages } from '../constants/index.js';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { t, getValidationError, type ValidationErrorDetail } from '../i18n/translator.js';
import type { Language } from '../i18n/types.js';
import { ValidationError } from './validator.js';
import { AppError as AppErrorFromErrors } from '../errors/AppError.js';

/**
 * Turn Sequelize's own validation items into our translated, field-named shape.
 *
 * T-061: this used to forward `e.message` verbatim — Sequelize's internal
 * English ("Validation isEmail on email failed"), shown to an Uzbek driver.
 * Nothing here reads `e.message` any more; the message is rebuilt from the
 * field dictionary (`fields.*`) and a validation template, so an unrecognised
 * validator degrades to a named "{field} noto'g'ri formatda" rather than
 * leaking English.
 */
const SEQUELIZE_VALIDATOR_TYPES: Record<string, string> = {
  isEmail: 'email',
  isUrl: 'url',
  isDate: 'invalidDate',
  is_null: 'required',
  notNull: 'required',
};

const mapSequelizeErrors = (err: unknown, language: Language): ValidationErrorDetail[] => {
  const items = (err as any)?.errors;
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item: any) => {
    // `path` is the column; a composite unique index reports the first column.
    const field = item?.path ?? '';
    const type = SEQUELIZE_VALIDATOR_TYPES[item?.validatorKey] ?? 'invalid';
    return {
      field,
      message: getValidationError(type, field, language),
      type,
    };
  });
};

// Custom error class (kept for backward compatibility)
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
    // Validation errors with field-specific messages.
    //
    // T-061: the headline used to be `t('validation.invalid', { field: '' })` —
    // the template is "{field} noto'g'ri formatda", so blanking the field
    // produced a sentence with its subject deleted. That is precisely what the
    // owner reported: "it says the data is wrong but not which line."
    // `err.errors` is already translated AND already names its field, so the
    // first entry IS the summary. Nothing new needs to be built.
    statusCode = err.statusCode;
    errors = err.errors;
    message = err.errors[0]?.message ?? t('common.badRequest', language);
  } else if (err instanceof AppError || err instanceof AppErrorFromErrors) {
    statusCode = err.statusCode;
    message = err.message;
    // Note: data will be included in response object below
  } else if (err.name === 'ValidationError') {
    statusCode = HttpStatus.BAD_REQUEST;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = HttpStatus.UNAUTHORIZED;
    message = t('common.unauthorized', language);
  } else if (err.name === 'SequelizeValidationError') {
    // T-061: a model-level failure (User.email's `isEmail`, for instance) is a
    // 400, not a 422 — which is why the apps, gating on 422 alone, used to
    // discard these details and fall back to a generic toast.
    statusCode = HttpStatus.BAD_REQUEST;
    errors = mapSequelizeErrors(err, language);
    message = errors[0]?.message ?? t('common.badRequest', language);
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = HttpStatus.CONFLICT;
    // "{field} allaqachon mavjud" beats a bare "conflict" — a duplicate email
    // is the common case and the driver can only fix it if told which field.
    errors = mapSequelizeErrors(err, language).map((detail) => ({
      ...detail,
      type: 'unique',
      message: getValidationError('unique', detail.field, language),
    }));
    message = errors[0]?.message ?? t('common.conflict', language);
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  const response: any = {
    success: false,
    message,
  };

  // T-061: an empty array is truthy, and shipping `errors: []` makes the apps
  // take their "field errors arrived" branch and then find nothing to show.
  if (Array.isArray(errors) ? errors.length > 0 : Boolean(errors)) {
    response.errors = errors;
  }

  // Include data from AppError if present
  if ((err instanceof AppErrorFromErrors) && (err as any).data) {
    response.data = (err as any).data;
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
