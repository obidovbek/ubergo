/**
 * i18n Configuration
 */

import type { Language } from './types.js';

export const DEFAULT_LANGUAGE: Language = 'uz';

export const SUPPORTED_LANGUAGES: Language[] = ['uz', 'en', 'ru'];

/**
 * Get language from request headers
 */
export const getLanguageFromHeaders = (acceptLanguage?: string): Language => {
  if (!acceptLanguage) return DEFAULT_LANGUAGE;

  const lang = acceptLanguage.toLowerCase().split(',')[0].split('-')[0];
  
  if (SUPPORTED_LANGUAGES.includes(lang as Language)) {
    return lang as Language;
  }

  return DEFAULT_LANGUAGE;
};

