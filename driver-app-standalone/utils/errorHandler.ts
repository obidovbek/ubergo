/**
 * Error Handler Utility
 * Handles backend errors and displays appropriate toast messages
 */

import { showToast } from './toast';

interface ErrorHandlerOptions {
  t: (key: string) => string; // Translation function
  defaultMessage?: string;
  showToastNotification?: boolean;
}

interface BackendError {
  response?: {
    status: number;
    data?: {
      error?: string;
      message?: string;
      success?: boolean;
    };
  };
  status?: number;
  data?: any;
  message?: string;
  code?: string;
}

/**
 * Error thrown by the fetch-based API modules.
 *
 * `handleBackendError` and most screens read the **axios** shape
 * (`error.response.status`) — but nothing in this project uses axios, and `fetch` never
 * sets `.response`. Several API modules hand-built `error.response = { status, data }`
 * to work around that; the OTP calls did not, so the server's message was silently
 * dropped and every screen fell back to its own generic default.
 *
 * This carries `status`, `data` **and** `response` so every existing reader — screens
 * doing `error?.response?.status || error?.status`, and the USER_NOT_REGISTERED lookup
 * in `PhoneRegistrationScreen` — keeps working unchanged.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly data: any;
  readonly response: { status: number; data: any };

  constructor(status: number, body: any, fallbackMessage?: string) {
    super(body?.message || body?.error || fallbackMessage || `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.data = body;
    this.response = { status, data: body };
  }
}

/**
 * Seconds the server asked us to wait before retrying, if it said.
 *
 * The API puts it in the `data` envelope of a 429 (`errorHandler.ts` on the server
 * forwards `AppError.data`), so it lands at `response.data.data.retryAfterSec`.
 */
export const getRetryAfterSec = (error: any): number | undefined => {
  const raw =
    error?.response?.data?.data?.retryAfterSec ?? error?.data?.data?.retryAfterSec;
  return typeof raw === 'number' && raw > 0 ? Math.ceil(raw) : undefined;
};

/**
 * Handle backend errors with translation and toast notification
 */
export const handleBackendError = (
  error: any,
  options: ErrorHandlerOptions
): string => {
  const { t, defaultMessage, showToastNotification = true } = options;

  let errorTitle = t('common.error');
  let errorMessage = defaultMessage || t('errors.unknown');

  // Read both shapes: the axios one that some modules hand-build, and the plain
  // `status`/`data` that `ApiError` carries. Without this the whole switch below was
  // dead code, because `fetch` never sets `.response`.
  const status: number | undefined = error?.response?.status ?? error?.status;

  // Check if it's a network error — i.e. we never got a response at all
  if (status === undefined) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorMessage = t('errors.timeout');
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
      errorMessage = t('errors.network');
    }
  } else {
    // Handle HTTP status codes
    const body = error?.response?.data ?? error?.data;
    const serverMessage = body?.error || body?.message || error.message;

    switch (status) {
      case 400:
        errorTitle = t('errors.badRequest');
        errorMessage = serverMessage || t('errors.validation');
        break;
      case 401:
        errorTitle = t('errors.unauthorized');
        errorMessage = serverMessage || t('errors.unauthorized');
        break;
      case 403:
        errorTitle = t('errors.forbidden');
        errorMessage = serverMessage || t('errors.forbidden');
        break;
      case 404:
        errorTitle = t('errors.notFound');
        errorMessage = serverMessage || t('errors.notFound');
        break;
      case 409:
        errorTitle = t('errors.conflict');
        errorMessage = serverMessage || t('errors.conflict');
        break;
      case 422:
        errorTitle = t('errors.validation');
        errorMessage = serverMessage || t('errors.validation');
        break;
      case 429:
        // Rate limits are expected, not failures — the server explains the wait
        // (and for how long), so always prefer its message over a generic default.
        errorTitle = t('common.error');
        errorMessage = serverMessage || t('errors.tooManyRequests');
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorTitle = t('errors.serverError');
        errorMessage = `${t('errors.serverError')}. ${t('errors.tryAgain')}`;
        break;
      default:
        if (defaultMessage && serverMessage) {
          errorMessage = `${defaultMessage}: ${serverMessage}`;
        } else {
          errorMessage = serverMessage || defaultMessage || t('errors.unknown');
        }
    }
  }

  // Show toast notification
  if (showToastNotification) {
    showToast.error(errorTitle, errorMessage);
  }

  return errorMessage;
};

/**
 * Extract error message from various error formats
 * Backend messages are already translated, so we prefer them
 */
export const getErrorMessage = (error: any, t?: (key: string) => string, defaultMsg?: string): string => {
  if (typeof error === 'string') return error;

  // Prefer backend-translated messages (they're already in user's language)
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;

  // Fallback to translated default or provided default
  if (t && defaultMsg) {
    return t(defaultMsg);
  }
  if (t) {
    return t('errors.unknown');
  }
  return defaultMsg || 'An error occurred';
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return (
    !error.response &&
    (error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network') ||
      error.message?.includes('timeout'))
  );
};

/**
 * Check if error is an auth error
 */
export const isAuthError = (error: any): boolean => {
  return error?.response?.status === 401 || error?.response?.status === 403;
};

/**
 * Parse validation errors from backend
 */
export const parseValidationErrors = (error: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (error?.response?.data?.errors) {
    const backendErrors = error.response.data.errors;

    if (Array.isArray(backendErrors)) {
      backendErrors.forEach((err: any) => {
        if (err.field && err.message) {
          errors[err.field] = err.message;
        }
      });
    } else if (typeof backendErrors === 'object') {
      Object.keys(backendErrors).forEach(key => {
        errors[key] = backendErrors[key];
      });
    }
  }

  return errors;
};

/**
 * Display validation errors with toast notifications
 */
export const displayValidationErrors = (
  error: any,
  t: (key: string) => string,
  showFirstOnly: boolean = true
): void => {
  const errors = parseValidationErrors(error);
  const errorEntries = Object.entries(errors);

  if (errorEntries.length > 0) {
    if (showFirstOnly) {
      // Show only the first error
      const [field, message] = errorEntries[0];
      showToast.error(t('common.error'), message);
    } else {
      // Show all errors (up to 3)
      const maxErrors = Math.min(errorEntries.length, 3);
      for (let i = 0; i < maxErrors; i++) {
        const [field, message] = errorEntries[i];
        setTimeout(() => {
          showToast.error(t('common.error'), message);
        }, i * 300); // Stagger the toasts
      }
    }
  }
};

