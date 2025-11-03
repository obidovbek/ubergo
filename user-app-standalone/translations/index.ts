/**
 * Translation Index
 * Central export for all translations
 */

import { Language } from '../config/languages';
import uz from './uz';
import en from './en';
import ru from './ru';

export type TranslationKeys = typeof uz;

const translations: Record<Language, TranslationKeys> = {
  uz,
  en,
  ru,
};

export default translations;

