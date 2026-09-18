/**
 * T-121 step 8 — `pendingOtp.ts`. **Byte-identical in both apps** (re-verified with
 * `git show HEAD:<path>`), written once and copied, re-proved red in the second app.
 *
 * **What it is for (OR-001):** it remembers that the user is mid-OTP, so that if Android kills a
 * backgrounded app, reopening it resumes the code screen with the phone prefilled instead of
 * dumping them back at phone registration. Every export is live in both apps.
 *
 * **The two behaviours worth guarding:**
 *   1. **The 30-minute TTL, and that a stale record is DELETED, not merely ignored.** Resuming an
 *      OTP screen for a code that expired long ago is worse than starting fresh — the user types
 *      a code that cannot work and is told it is wrong.
 *   2. **Nothing here may ever throw.** All three functions swallow storage failures, because
 *      they are called from app-start and auth paths where a rejection is a crash or a hang.
 *
 * `AsyncStorage` is the official in-memory jest mock installed once in `test/setup.ts`, so these
 * are real round trips through a real store rather than assertions about a mock's call list.
 * ⚠️ That store is shared between tests in a file — hence `clearPendingOtp()` in `beforeEach`.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearPendingOtp, loadPendingOtp, savePendingOtp } from './pendingOtp';

/** The module's own key. Pinned: renaming it silently orphans every record in the wild. */
const KEY = '@pending_otp';
const TTL_MS = 30 * 60 * 1000;

/**
 * 🔴 **Failure paths use `...Once`, never `jest.spyOn(...).mockRejectedValue(...)`. This cost a
 * debugging round and is worth writing down.** `AsyncStorage`'s methods are already `jest.fn()`s
 * (the official mock installed in `test/setup.ts`), and **`jest.restoreAllMocks()` does not put
 * them back** — restore only reverts a spy to a real implementation, and there is none here. So a
 * `mockRejectedValue` survives into the next test, where an ordinary `setItem` call rejects with
 * the *previous* test's "disk full" and Jest reports the failure against the wrong test entirely.
 * A one-shot mock cannot leak: it is consumed by the call it was meant for.
 */
const failNextCall = (method: 'setItem' | 'getItem' | 'removeItem', message: string) => {
  jest.mocked(AsyncStorage[method]).mockRejectedValueOnce(new Error(message) as never);
};

beforeEach(async () => {
  await clearPendingOtp();
});

describe('a round trip', () => {
  it('remembers the phone and the user id', async () => {
    await savePendingOtp({ phone: '998901234567', userId: '42' });

    const record = await loadPendingOtp();

    expect(record).toMatchObject({ phone: '998901234567', userId: '42' });
    expect(typeof record?.at).toBe('number');
  });

  it('stores it under the key the app has always used', async () => {
    // Pinned deliberately: a rename would leave every half-registered install with a record
    // nothing reads, and nothing migrates the key.
    await savePendingOtp({ phone: '998901234567' });

    expect(await AsyncStorage.getItem(KEY)).toContain('998901234567');
  });

  it('accepts a phone alone, or a user id alone', async () => {
    await savePendingOtp({ phone: '998901234567' });
    expect(await loadPendingOtp()).toMatchObject({ phone: '998901234567' });

    await clearPendingOtp();
    await savePendingOtp({ userId: '42' });

    // Note the shape: with no phone the record still stores `phone: ''`, not undefined.
    expect(await loadPendingOtp()).toMatchObject({ phone: '', userId: '42' });
  });

  it('writes nothing at all when given neither', async () => {
    await savePendingOtp({});
    await savePendingOtp({ phone: '', userId: '' });

    expect(await AsyncStorage.getItem(KEY)).toBeNull();
    expect(await loadPendingOtp()).toBeNull();
  });

  it('returns null when nothing was ever saved', async () => {
    expect(await loadPendingOtp()).toBeNull();
  });

  it('forgets on demand — the logout and edit-phone path', async () => {
    await savePendingOtp({ phone: '998901234567' });
    await clearPendingOtp();

    expect(await loadPendingOtp()).toBeNull();
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
  });
});

describe('the 30-minute TTL', () => {
  /** Write a record by hand with an `at` we choose — the public API always stamps `Date.now()`. */
  const saveAgedRecord = (ageMs: number) =>
    AsyncStorage.setItem(
      KEY,
      JSON.stringify({ phone: '998901234567', at: Date.now() - ageMs })
    );

  it('still resumes a record from just inside the window', async () => {
    await saveAgedRecord(TTL_MS - 1000);

    expect(await loadPendingOtp()).toMatchObject({ phone: '998901234567' });
  });

  it('refuses one from just outside it', async () => {
    await saveAgedRecord(TTL_MS + 1000);

    expect(await loadPendingOtp()).toBeNull();
  });

  it('🔴 DELETES the stale record rather than just ignoring it', async () => {
    // The difference matters: an ignored record is re-read and re-rejected on every app start,
    // and any later reader that forgets the TTL would resume an OTP whose code expired.
    await saveAgedRecord(TTL_MS + 1000);

    await loadPendingOtp();

    expect(await AsyncStorage.getItem(KEY)).toBeNull();
  });

  it('keeps a record whose timestamp is not a number, rather than losing the user', async () => {
    // The TTL check is guarded by `typeof record.at === 'number'`, so a corrupted timestamp
    // fails OPEN. That is the safer direction here: the worst case is one dead OTP screen the
    // user can leave, against losing a resume that would have worked.
    await AsyncStorage.setItem(KEY, JSON.stringify({ phone: '998901234567', at: 'yesterday' }));

    expect(await loadPendingOtp()).toMatchObject({ phone: '998901234567' });
  });
});

describe('nothing here may ever throw', () => {
  // These run at app start and inside auth flows; a rejection is a crash or a hang, not a log
  // line. Each function has its own try/catch and each is proved separately.
  it('survives a storage write that fails', async () => {
    failNextCall('setItem', 'disk full');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(savePendingOtp({ phone: '998901234567' })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it('survives a storage read that fails, and answers null', async () => {
    failNextCall('getItem', 'storage unavailable');
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(loadPendingOtp()).resolves.toBeNull();
  });

  it('survives a remove that fails', async () => {
    failNextCall('removeItem', 'storage unavailable');
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(clearPendingOtp()).resolves.toBeUndefined();
  });

  it('answers null for a record that is not valid JSON at all', async () => {
    // A half-written record from a process the OS killed mid-write.
    await AsyncStorage.setItem(KEY, 'not json {');
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(loadPendingOtp()).resolves.toBeNull();
  });

  it('answers null for valid JSON that is not a usable record', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ at: Date.now() }));
    expect(await loadPendingOtp()).toBeNull();

    await AsyncStorage.setItem(KEY, 'null');
    expect(await loadPendingOtp()).toBeNull();
  });
});
