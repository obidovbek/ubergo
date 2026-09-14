/**
 * T-121 step 1 — `tokenStore.ts`, the single owner of the access/refresh token pair (T-038).
 *
 * Why this file is worth testing: before T-038 the refresh token was thrown away, so every
 * session died after 15 minutes and the next app start logged the user out through OR-002's
 * "account deleted" branch. `ARCHITECTURE.md` still records the repair as **not confirmed on a
 * device**. Nothing here can confirm that — but it can pin the decisions the repair rests on:
 * which storage keys are used, when a token counts as expiring, and what happens when a refresh
 * finally fails for good.
 *
 * Two rules from the source are asserted as rules, not as incidental behaviour:
 *   - `getTokenExpirySec` returns `null` for "unknown", and every caller must read that as
 *     "do not refresh" rather than "expired" — guessing "expired" would refresh on every
 *     request, and each refresh REVOKES the previous refresh token server-side.
 *   - `setTokens` with no refresh token must leave the stored one alone.
 *
 * `test/setup.ts` installs AsyncStorage's official jest mock, which is a real in-memory store,
 * so these are genuine round trips rather than assertions about a spy.
 *
 * ⚠️ The driver app's copy of `tokenStore.ts` is byte-identical and has its own copy of this
 * file (step 2). Change both.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  TOKEN_KEYS,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getTokenExpirySec,
  isTokenExpiringSoon,
  notifyAuthLost,
  onAuthLost,
  setTokens,
} from './tokenStore';

/** base64url, built with split/join so no backslash can be mangled on the way into this file. */
const base64Url = (text: string): string =>
  Buffer.from(text, 'latin1')
    .toString('base64')
    .split('+')
    .join('-')
    .split('/')
    .join('_')
    .split('=')
    .join('');

/** A JWT is only ever read for its payload here, so the other two segments are filler. */
const jwtWithPayload = (payload: string): string => `header.${base64Url(payload)}.signature`;
const jwt = (claims: Record<string, unknown>): string => jwtWithPayload(JSON.stringify(claims));

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('TOKEN_KEYS', () => {
  it('uses the key every existing install already has on disk', () => {
    // 🔴 Renaming ACCESS would log out every user who upgrades: their token is on disk under
    // '@auth_token' and nothing migrates it. The source says so; this makes it cost a red test.
    expect(TOKEN_KEYS.ACCESS).toBe('@auth_token');
    expect(TOKEN_KEYS.REFRESH).toBe('@auth_refresh_token');
  });
});

describe('storing and reading the pair', () => {
  it('round trips both tokens', async () => {
    await setTokens('access-1', 'refresh-1');

    await expect(getAccessToken()).resolves.toBe('access-1');
    await expect(getRefreshToken()).resolves.toBe('refresh-1');
  });

  it('returns null when nothing has been stored', async () => {
    await expect(getAccessToken()).resolves.toBeNull();
    await expect(getRefreshToken()).resolves.toBeNull();
  });

  it('LEAVES THE REFRESH TOKEN ALONE when called with only an access token', async () => {
    // The rotation case: a caller that holds only a fresh access token must not wipe the
    // refresh token, or the session ends at the next expiry — the exact T-038 failure.
    await setTokens('access-1', 'refresh-1');

    await setTokens('access-2');

    await expect(getAccessToken()).resolves.toBe('access-2');
    await expect(getRefreshToken()).resolves.toBe('refresh-1');
  });

  it('treats an empty or null refresh token as "not supplied" rather than "erase it"', async () => {
    await setTokens('access-1', 'refresh-1');

    await setTokens('access-2', null);
    await expect(getRefreshToken()).resolves.toBe('refresh-1');

    await setTokens('access-3', '');
    await expect(getRefreshToken()).resolves.toBe('refresh-1');
  });

  it('clears both', async () => {
    await setTokens('access-1', 'refresh-1');

    await clearTokens();

    await expect(getAccessToken()).resolves.toBeNull();
    await expect(getRefreshToken()).resolves.toBeNull();
  });
});

describe('onAuthLost / notifyAuthLost', () => {
  // The listener Set is module-level state, so a leaked listener would fire in later tests.
  // Every handle is collected and detached in afterEach; detaching twice is harmless.
  const handles: (() => void)[] = [];
  const listen = (listener: () => void): (() => void) => {
    const off = onAuthLost(listener);
    handles.push(off);
    return off;
  };

  afterEach(() => {
    handles.splice(0).forEach((off) => off());
  });

  it('tells every listener, and stops once unsubscribed', () => {
    const first = jest.fn();
    const second = jest.fn();
    const unsubscribeFirst = listen(first);
    listen(second);

    notifyAuthLost();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    notifyAuthLost();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('a listener that throws does not stop the others hearing about it', () => {
    const angry = jest.fn(() => {
      throw new Error('listener blew up');
    });
    const calm = jest.fn();
    listen(angry);
    listen(calm);

    expect(() => notifyAuthLost()).not.toThrow();
    expect(angry).toHaveBeenCalledTimes(1);
    expect(calm).toHaveBeenCalledTimes(1);
  });
});

describe('getTokenExpirySec', () => {
  it('reads the exp claim', () => {
    expect(getTokenExpirySec(jwt({ exp: 1893456000, sub: 7 }))).toBe(1893456000);
  });

  it('decodes base64url, not plain base64', () => {
    // This payload encodes to base64 containing both + and /, so a decoder that did not map
    // - and _ back to them would garble the text and fail to find exp. The guard below keeps
    // the fixture honest if the payload is ever edited.
    const encoded = base64Url(JSON.stringify({ exp: 1893456000, note: '~~~?>>>' }));
    expect(encoded.includes('-') && encoded.includes('_')).toBe(true);

    expect(getTokenExpirySec(`header.${encoded}.signature`)).toBe(1893456000);
  });

  it('returns null — "unknown", never "expired" — for anything it cannot read', () => {
    expect(getTokenExpirySec(null)).toBeNull();
    expect(getTokenExpirySec(undefined)).toBeNull();
    expect(getTokenExpirySec('')).toBeNull();
    expect(getTokenExpirySec('not-a-jwt')).toBeNull();
    expect(getTokenExpirySec('header..signature')).toBeNull();
    expect(getTokenExpirySec(jwt({ sub: 7 }))).toBeNull();
    expect(getTokenExpirySec(jwt({ exp: '1893456000' }))).toBeNull();
  });

  it('falls back to reading exp out of a payload that will not parse as JSON', () => {
    // The documented case is a non-ASCII claim surviving the latin-1 decode as invalid JSON.
    // Any unparseable payload takes the same branch; this is the cheapest one to build.
    expect(getTokenExpirySec(jwtWithPayload('{"exp":1893456000,"name":'))).toBe(1893456000);
  });
});

describe('isTokenExpiringSoon', () => {
  /** 2026-09-14T12:00:00Z, so the skew arithmetic has a fixed "now" to work against. */
  const NOW_MS = Date.UTC(2026, 8, 14, 12, 0, 0);
  const expiringInSec = (seconds: number) => jwt({ exp: Math.floor(NOW_MS / 1000) + seconds });

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW_MS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is true for a token that has already expired', () => {
    expect(isTokenExpiringSoon(expiringInSec(-1))).toBe(true);
  });

  it('is false for a token with plenty of life left', () => {
    expect(isTokenExpiringSoon(expiringInSec(15 * 60))).toBe(false);
  });

  it('treats the default 60-second skew as INCLUSIVE at the boundary', () => {
    // A request made now could arrive after the token expires, so exactly-at-the-skew counts
    // as expiring. One second beyond it does not.
    expect(isTokenExpiringSoon(expiringInSec(60))).toBe(true);
    expect(isTokenExpiringSoon(expiringInSec(61))).toBe(false);
  });

  it('honours a custom skew', () => {
    expect(isTokenExpiringSoon(expiringInSec(120), 120)).toBe(true);
    expect(isTokenExpiringSoon(expiringInSec(121), 120)).toBe(false);
    expect(isTokenExpiringSoon(expiringInSec(30), 0)).toBe(false);
  });

  it('is FALSE when the expiry is unknown — an unreadable token must not trigger a refresh', () => {
    expect(isTokenExpiringSoon(null)).toBe(false);
    expect(isTokenExpiringSoon('not-a-jwt')).toBe(false);
    expect(isTokenExpiringSoon(jwt({ sub: 7 }))).toBe(false);
  });
});
