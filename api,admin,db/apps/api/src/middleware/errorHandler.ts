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

    /*
     * 🔴 T-116 — TRANSLATE THE THROWN ERROR HERE, AT THE EDGE, NOT AT THE THROW SITE.
     *
     * Every other branch of this function already answers in the caller's language; this one
     * passed `err.message` through untouched, and `err.message` is an English literal in 130
     * of the API's 221 `new AppError(...)` calls. So an Uzbek phone asking for something the
     * server refuses got an English sentence — which is what the owner reported.
     *
     * ⚠️ WHY NOT LOCALISE WHERE IT IS THROWN. Most of those 130 sit in helpers with no `req`
     * and therefore no language: `validateOfferData`, `parsePrice`, `parseDate`,
     * `buildOfferFields`. Reaching them would mean threading a `language` argument through
     * about fifteen signatures, and every future helper would have to remember to do it. This
     * middleware already resolves `language` for everything else, so one place does the work
     * and a throw site only has to name a KEY.
     *
     * ⚠️ FALLS BACK TO THE LITERAL, never to a dotted identifier. The API's `t()` returns the
     * key itself when it is missing (`i18n/translator.ts`), so comparing against the key IS
     * the presence test — an un-migrated throw keeps its English text, which is exactly the
     * behaviour it has today. That is what makes this safe to adopt one call site at a time.
     *
     * ⚠️ `data.messageKey` is the API's i18n key; `data.code` is the STABLE, app-facing code
     * the two apps map to their own strings (`errors.codes.*`). Separate fields because they
     * have separate jobs — a code is a contract, a key is an implementation detail.
     *
     * 🔴 WHAT STAYS ENGLISH, AND WHY — decided 2026-09-19 (T-116, owner: option A). Every
     * message a real user can hit carries a key. The ~107 unkeyed 4xx that remain fall in four
     * classes, and a new English 4xx that fits none of them is a bug:
     *   ① UNREACHABLE — `'Unauthorized'` behind `authenticate` (every route mounts it first,
     *     and it answers in the caller's language); endpoints no app calls (archive, driver
     *     location, the wallet).
     *   ② 5xx — never shown: both apps answer every 5xx with their own translated message.
     *   ③ ADMIN — the admin panel is not localised at all.
     *   ④ CLIENT-BUG FORMAT CHECKS — `${field} must be a number` and kin. The apps enforce these
     *     rules before sending; only a bug reaches them, and an Uzbek sentence wrapped round a
     *     raw column name like `seat_counts.front` would help nobody.
     * The count is held by `i18n/unkeyedErrors.test.ts` (it may only fall), and every key used
     * is resolved in uz/ru/en — with its parameters — by `i18n/messageKeys.test.ts`.
     * (The 4 upload messages are English for another reason: the driver app matches on their
     * text. They move with that fix — T-126.)
     */
    const errorData = (err as {
      data?: { messageKey?: unknown; messageParams?: Record<string, unknown> };
    }).data;
    const messageKey = errorData?.messageKey;
    /*
     * `messageParams` carries the numbers a message interpolates — "at least {minutes}
     * minutes", "{booked} seat(s) already booked". Without it a parameterised key would
     * render its placeholders literally, which reads worse than the English it replaced.
     */
    const translated =
      typeof messageKey === 'string'
        ? t(messageKey, language, errorData?.messageParams)
        : null;
    message = translated && translated !== messageKey ? translated : err.message;
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
// T-032 — `Function` accepts anything callable, so it turned off checking on
// every route handler this wraps. Typed to the real signature instead.
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => unknown
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
