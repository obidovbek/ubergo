/**
 * Pending OTP persistence (OR-001)
 *
 * Remembers that the user is in the middle of the OTP ("Kodni kiriting") step so
 * that if the OS kills the app while it is backgrounded, reopening it resumes the
 * OTP screen (with the phone prefilled) instead of dropping to the main menu.
 *
 * The record is cleared on successful verification, on logout, when the user edits
 * the phone, or automatically once it is older than TTL_MS.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@pending_otp';

// Only resume the OTP screen if it was left fairly recently. After this, the code
// has almost certainly expired, so we start fresh at phone registration instead.
const TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface PendingOtp {
  phone: string;
  userId?: string;
  at: number;
}

export async function savePendingOtp(data: { phone?: string; userId?: string }): Promise<void> {
  try {
    if (!data.phone && !data.userId) return;
    const record: PendingOtp = {
      phone: data.phone || '',
      userId: data.userId,
      at: Date.now(),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(record));
  } catch (error) {
    console.warn('savePendingOtp failed:', error);
  }
}

export async function loadPendingOtp(): Promise<PendingOtp | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as PendingOtp;
    if (!record || (!record.phone && !record.userId)) return null;
    if (typeof record.at === 'number' && Date.now() - record.at > TTL_MS) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    return record;
  } catch (error) {
    console.warn('loadPendingOtp failed:', error);
    return null;
  }
}

export async function clearPendingOtp(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (error) {
    console.warn('clearPendingOtp failed:', error);
  }
}
