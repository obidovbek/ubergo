/**
 * Recipient language for push notifications.
 *
 * Every push used to be written in `getLanguageFromHeaders(req)` — the language
 * of whoever pressed the button. So a driver on a Russian phone made the
 * passenger's Uzbek phone buzz in Russian, and a passenger cancelling an offer
 * notified ten drivers in her own language. The person who *reads* the message
 * decides its language, and that is stored on `users.language`.
 *
 * Note the distinction: `getLanguageFromHeaders` is still correct for error
 * messages returned in the HTTP response — those are read by the caller.
 */

import { User } from '../database/models/index.js';
import type { Language } from '../i18n/types.js';

const SUPPORTED: readonly Language[] = ['uz', 'ru', 'en'];
const FALLBACK: Language = 'uz';

/**
 * The user's own language, or 'uz' when the account predates the column or the
 * lookup fails. Never throws — a notification must not break the action that
 * triggered it.
 */
export async function getUserLanguage(userId: number): Promise<Language> {
  try {
    const user = await User.findByPk(userId, { attributes: ['id', 'language'] });
    const language = user?.language as Language | null | undefined;
    return language && SUPPORTED.includes(language) ? language : FALLBACK;
  } catch (error) {
    console.error(`Failed to read language for user ${userId}:`, error);
    return FALLBACK;
  }
}

/** Normalise whatever an app sent us into a language we actually have. */
export function normalizeLanguage(value: unknown): Language | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim().toLowerCase().slice(0, 2) as Language;
  return SUPPORTED.includes(candidate) ? candidate : null;
}
