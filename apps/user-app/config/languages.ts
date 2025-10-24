/**
 * Language Configuration
 * Centralized language settings for the app
 */

export type Language = 'uz' | 'en' | 'ru';

export const DEFAULT_LANGUAGE: Language = 'uz';

export const AVAILABLE_LANGUAGES = [
  { code: 'uz' as Language, name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'ru' as Language, name: 'Русский', flag: '🇷🇺' },
];

export const getLanguageName = (code: Language): string => {
  const lang = AVAILABLE_LANGUAGES.find(l => l.code === code);
  return lang?.name || 'Unknown';
};

