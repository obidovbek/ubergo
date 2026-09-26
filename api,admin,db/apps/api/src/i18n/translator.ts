/**
 * Translator Utility
 * Provides translation functions for API responses
 */

import type { Language } from './types.js';
import { DEFAULT_LANGUAGE } from './config.js';
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
 *
 * 🔴 T-129: a field key may be a PATH (`license.license_number`) since a
 * validation rule can name a nested field. `t()` returns the key itself when it
 * misses, so `fields.license.license_number` would have put the literal string
 * "fields.license.license_number" in front of a driver — T-061's headless
 * sentence again, one level down. The dictionary is flat and keyed by column, so
 * fall back to the LEAF of the path before giving up on it.
 */
export const getFieldName = (fieldKey: string, language: Language = DEFAULT_LANGUAGE): string => {
  const direct = t(`fields.${fieldKey}`, language);
  if (direct !== `fields.${fieldKey}`) {
    return direct || fieldKey;
  }

  const leaf = fieldKey.slice(fieldKey.lastIndexOf('.') + 1);
  if (leaf !== fieldKey) {
    const byLeaf = t(`fields.${leaf}`, language);
    if (byLeaf !== `fields.${leaf}`) {
      return byLeaf || leaf;
    }
  }

  // Neither the path nor its leaf is in the dictionary: the column name is a
  // poor label, but it is the field's real name and not a translation key.
  return leaf;
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

