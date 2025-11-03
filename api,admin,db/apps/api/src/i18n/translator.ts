/**
 * Translator Utility
 * Provides translation functions for API responses
 */

import { Language, DEFAULT_LANGUAGE } from './index.js';
import uz from './translations/uz.js';
import en from './translations/en.js';
import ru from './translations/ru.js';

const translations = {
  uz,
  en,
  ru,
};

/**
 * Get translation by key
 */
export const t = (key: string, language: Language = DEFAULT_LANGUAGE, params?: Record<string, any>): string => {
  const keys = key.split('.');
  let value: any = translations[language];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key} for language: ${language}`);
      return key;
    }
  }

  let result = typeof value === 'string' ? value : key;

  // Replace parameters in the translation
  if (params) {
    Object.keys(params).forEach(paramKey => {
      result = result.replace(`{${paramKey}}`, params[paramKey]);
    });
  }

  return result;
};

/**
 * Get field name translation
 */
export const getFieldName = (fieldKey: string, language: Language = DEFAULT_LANGUAGE): string => {
  return t(`fields.${fieldKey}`, language) || fieldKey;
};

/**
 * Get validation error message
 */
export const getValidationError = (
  errorType: string,
  fieldKey: string,
  language: Language = DEFAULT_LANGUAGE,
  params?: Record<string, any>
): string => {
  const fieldName = getFieldName(fieldKey, language);
  const errorMessage = t(`validation.${errorType}`, language, { field: fieldName, ...params });
  return errorMessage;
};

/**
 * Format validation errors for response
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  type?: string;
}

export const formatValidationErrors = (
  errors: Array<{ field: string; type: string; params?: Record<string, any> }>,
  language: Language = DEFAULT_LANGUAGE
): ValidationErrorDetail[] => {
  return errors.map(error => ({
    field: error.field,
    message: getValidationError(error.type, error.field, language, error.params),
    type: error.type,
  }));
};

