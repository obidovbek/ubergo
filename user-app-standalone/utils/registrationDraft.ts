/**
 * Registration draft persistence (OR-006)
 *
 * Remembers what the passenger has already typed on the registration form
 * ("Ma'lumotlaringizni kiriting") so that a half-finished registration resumes with
 * the fields still filled in, instead of an empty form — or worse, the main menu.
 *
 * Mirrors `utils/pendingOtp.ts`, which does the same for the OTP step (OR-001).
 * The record is cleared once the profile is saved, on logout, or once it is older
 * than TTL_MS.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@registration_draft';

// A draft older than this is stale — the user has moved on. Longer than the OTP TTL
// because nothing here expires server-side; it is only typed-in text.
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface RegistrationDraft {
  /** Whose registration this draft belongs to — a draft is never shown to another phone. */
  phone?: string;
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  gender?: 'male' | 'female' | '';
  birthDate?: string;
  email?: string;
  userId?: string;
  promoCode?: string;
  additionalPhones?: string[];
  at: number;
}

/** Fields the caller supplies; `at` is stamped here. */
export type RegistrationDraftInput = Omit<RegistrationDraft, 'at'>;

/** The phone alone is not "content" — it is only the owner tag of the draft. */
const hasContent = (draft: RegistrationDraftInput): boolean =>
  !!(
    draft.firstName?.trim() ||
    draft.lastName?.trim() ||
    draft.fatherName?.trim() ||
    draft.gender ||
    draft.birthDate?.trim() ||
    draft.email?.trim() ||
    draft.userId?.trim() ||
    draft.promoCode?.trim() ||
    (draft.additionalPhones && draft.additionalPhones.length > 0)
  );

export async function saveRegistrationDraft(draft: RegistrationDraftInput): Promise<void> {
  try {
    // Don't store an all-empty form — that would only re-open a blank draft.
    if (!hasContent(draft)) {
      await AsyncStorage.removeItem(KEY);
      return;
    }
    const record: RegistrationDraft = { ...draft, at: Date.now() };
    await AsyncStorage.setItem(KEY, JSON.stringify(record));
  } catch (error) {
    console.warn('saveRegistrationDraft failed:', error);
  }
}

/**
 * @param phone the phone currently registering. When both it and the stored draft have a
 *   phone and they differ, the draft belongs to someone else and is dropped.
 */
export async function loadRegistrationDraft(phone?: string): Promise<RegistrationDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as RegistrationDraft;
    if (!record) return null;
    if (typeof record.at === 'number' && Date.now() - record.at > TTL_MS) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    const digits = (v?: string) => (v || '').replace(/\D/g, '');
    if (record.phone && phone && digits(record.phone) !== digits(phone)) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    return record;
  } catch (error) {
    console.warn('loadRegistrationDraft failed:', error);
    return null;
  }
}

export async function clearRegistrationDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (error) {
    console.warn('clearRegistrationDraft failed:', error);
  }
}
