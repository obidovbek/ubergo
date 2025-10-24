/**
 * useTranslation Hook
 * Hook for accessing translations in components
 */

import { useState, useCallback } from 'react';
import { Language, DEFAULT_LANGUAGE } from '../config/languages';
import translations, { TranslationKeys } from '../translations';

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.');
      let value: any = translations[currentLanguage];

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }

      return typeof value === 'string' ? value : key;
    },
    [currentLanguage]
  );

  const changeLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
  }, []);

  return {
    t,
    currentLanguage,
    changeLanguage,
  };
};

