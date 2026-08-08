/**
 * Token store — the single owner of the access/refresh token pair (T-038).
 *
 * Before this, the refresh token was destructured out of every login response
 * and thrown away: `STORAGE_KEYS` held only the access token, and
 * `refreshAccessToken()` had zero call sites. The access token lives 15 minutes,
 * so every session died after 15 minutes and the next app start logged the user
 * out via the OR-002 "account deleted" branch.
 *
 * This module is deliberately **storage + JWT decoding only, no network**, so
 * that `config/api.ts` can import it without an import cycle (`api/auth.ts`
 * already imports `config/api.ts`). The refresh request itself lives in
 * `config/api.ts`.
 *
 * ⚠️ Keep this file byte-identical with the driver app's copy.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * `ACCESS` must stay '@auth_token' — it is what every existing install already
 * has on disk, and what `AuthContext` has always written. `AuthContext` imports
 * these instead of declaring its own so the two can never drift apart.
 */
export const TOKEN_KEYS = {
  ACCESS: '@auth_token',
  REFRESH: '@auth_refresh_token',
} as const;

type AuthLostListener = () => void;

const authLostListeners = new Set<AuthLostListener>();

/**
 * Fires when a refresh failed for good — the session is over, log the user out.
 *
 * There is deliberately no matching "tokens changed" event: pushing every
 * refreshed token back into `AuthContext` state would change the context
 * identity every ~15 minutes and re-run everything keyed on it, which is the
 * churn behind T-017. Readers get the current token from storage instead.
 */
export const onAuthLost = (listener: AuthLostListener): (() => void) => {
  authLostListeners.add(listener);
  return () => {
    authLostListeners.delete(listener);
  };
};

export const notifyAuthLost = (): void => {
  authLostListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // A misbehaving listener must not stop the others from hearing about it.
    }
  });
};

export const getAccessToken = (): Promise<string | null> =>
  AsyncStorage.getItem(TOKEN_KEYS.ACCESS);

export const getRefreshToken = (): Promise<string | null> =>
  AsyncStorage.getItem(TOKEN_KEYS.REFRESH);

/**
 * `refreshToken` is optional only because a caller may have just the access
 * token; when the server rotates the pair, ALWAYS pass both — the old refresh
 * token is revoked server-side the moment it is used.
 */
export const setTokens = async (
  accessToken: string,
  refreshToken?: string | null
): Promise<void> => {
  const writes: Promise<void>[] = [AsyncStorage.setItem(TOKEN_KEYS.ACCESS, accessToken)];
  if (refreshToken) {
    writes.push(AsyncStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken));
  }
  await Promise.all(writes);
};

export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEYS.ACCESS),
    AsyncStorage.removeItem(TOKEN_KEYS.REFRESH),
  ]);
};

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Decodes a base64url segment to a binary string.
 *
 * Hand-rolled because the app has no base64 helper and adding a dependency for
 * ten lines needs the owner's sign-off. We only ever read the numeric `exp`
 * out of the result, so the fact that non-ASCII claims come back as latin-1
 * bytes does not matter.
 */
const decodeBase64Url = (segment: string): string => {
  const normalised = segment.replace(/-/g, '+').replace(/_/g, '/');
  let output = '';
  let buffer = 0;
  let bits = 0;

  for (const char of normalised) {
    const index = BASE64_ALPHABET.indexOf(char);
    if (index === -1) continue; // padding and stray characters
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
};

/**
 * The token's `exp` claim in seconds, or `null` if it cannot be read.
 *
 * ⚠️ `null` means "unknown", and every caller must treat it as "do not refresh"
 * rather than "expired". Guessing "expired" would refresh on every single
 * request, and each refresh **revokes the previous refresh token** server-side.
 */
export const getTokenExpirySec = (token?: string | null): number | null => {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  const payload = decodeBase64Url(parts[1]);
  if (!payload) return null;

  try {
    const parsed = JSON.parse(payload);
    return typeof parsed?.exp === 'number' ? parsed.exp : null;
  } catch {
    // A non-ASCII claim can make the latin-1 text invalid JSON. `exp` is a plain
    // number, so pull it out directly rather than losing the whole token.
    const match = payload.match(/"exp"\s*:\s*(\d+)/);
    return match ? Number(match[1]) : null;
  }
};

/**
 * True when the token is expired, or close enough that a request made now could
 * arrive after it expires. `null` expiry → false (see `getTokenExpirySec`).
 */
export const isTokenExpiringSoon = (token?: string | null, skewSec = 60): boolean => {
  const exp = getTokenExpirySec(token);
  if (exp === null) return false;
  return exp * 1000 <= Date.now() + skewSec * 1000;
};
