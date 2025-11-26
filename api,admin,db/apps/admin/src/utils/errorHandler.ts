/**
 * Error Handler Utilities
 * Provides consistent error handling across the application
 */

import { AuthenticationError, isAuthErrorMessage } from '../config/api';

/**
 * Check if an error is an authentication error
 */
export const isAuthenticationError = (error: unknown): error is AuthenticationError => {
  return error instanceof AuthenticationError;
};

/**
 * Check if error message indicates authentication error (fallback check)
 */
const checkErrorMessageForAuth = (error: unknown): boolean => {
  if (error instanceof Error) {
    return isAuthErrorMessage(error.message);
  }
  if (typeof error === 'string') {
    return isAuthErrorMessage(error);
  }
  return false;
};

/**
 * Handle API errors with authentication error detection
 * Returns true if the error was an auth error (and should redirect)
 * Returns false if it's a regular error (and should be displayed)
 */
export const handleApiError = async (
  error: unknown,
  logout: () => Promise<void>,
  navigate: (path: string, options?: { replace?: boolean }) => void
): Promise<boolean> => {
  // Check if it's an AuthenticationError instance
  if (isAuthenticationError(error)) {
    await logout();
    navigate('/login', { replace: true });
    return true; // Indicates auth error was handled
  }
  
  // Fallback: check error message for auth-related keywords
  // This handles cases where the error might not be properly wrapped
  if (checkErrorMessageForAuth(error)) {
    await logout();
    navigate('/login', { replace: true });
    return true; // Indicates auth error was handled
  }
  
  return false; // Indicates regular error that should be displayed
};

