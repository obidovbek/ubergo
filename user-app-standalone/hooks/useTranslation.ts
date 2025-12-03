/**
 * useTranslation Hook
 * Hook for accessing translations in components
 */

import { useCallback } from 'react';
import { Language, DEFAULT_LANGUAGE } from '../config/languages';
import translations from '../translations';
import { useLanguageContext } from '../contexts/LanguageContext';

export const useTranslation = () => {
  const { currentLanguage, changeLanguage } = useLanguageContext();

  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.');

      const getValue = (lang: Language) => {
        let value: any = translations[lang];
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return undefined;
          }
        }
        return value;
      };

      // Try current language
      let value = getValue(currentLanguage);

      // If not found and current is not default, fallback to default language
      if (value === undefined && currentLanguage !== DEFAULT_LANGUAGE) {
        console.warn(`Translation key '${key}' missing in '${currentLanguage}', falling back to '${DEFAULT_LANGUAGE}'`);
        value = getValue(DEFAULT_LANGUAGE);
      }

      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }

      return typeof value === 'string' ? value : key;
    },
    [currentLanguage]
  );

  return {
    t,
    currentLanguage,
    changeLanguage,
  };
};
