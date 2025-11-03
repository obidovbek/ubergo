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
  message?: string;
  code?: string;
}

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

  // Check if it's a network error
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorMessage = t('errors.timeout');
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
      errorMessage = t('errors.network');
    }
  } else {
    // Handle HTTP status codes
    const status = error.response.status;
    const serverMessage = error.response.data?.error || 
                         error.response.data?.message || 
                         error.message;

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
      case 500:
      case 502:
      case 503:
      case 504:
        errorTitle = t('errors.serverError');
        errorMessage = `${t('errors.serverError')}. ${t('errors.tryAgain')}`;
        break;
      default:
        errorMessage = serverMessage || t('errors.unknown');
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
 */
export const getErrorMessage = (error: any, defaultMsg: string = 'An error occurred'): string => {
  if (typeof error === 'string') return error;
  
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  
  return defaultMsg;
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

