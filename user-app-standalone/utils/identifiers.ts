/**
 * The user's OWN promo code and username — the app's copy of the rules (T-091).
 *
 * 🔴 THIS IS A SECOND COPY OF `api/src/utils/identifiers.ts` AND HAS TO STAY IN
 * STEP WITH IT. Only the API's copy has tests (this project has no RN test
 * runner), so if the two ever disagree, the tested one is right.
 *
 * The rule they must both obey (T-063): **the server must never refuse what the
 * app accepted.** The checks here exist so a user is told immediately instead of
 * after a round trip — they are not the guarantee. Uniqueness cannot be checked
 * here at all; only the server knows whether a code is taken.
 *
 * ⚠️ A promo code here is the one the user OWNS and hands out. It is NOT the
 * `PROMO:` field in the referral block, which names whoever invited THEM. The
 * two live on the same screen and mean opposite things.
 */

/** Exactly 5 characters, digits and latin letters. */
export const PROMO_CODE_LENGTH = 5;

/** At least 6, at most 30 — the same bounds the API enforces. */
export const USERNAME_MIN_LENGTH = 6;
export const USERNAME_MAX_LENGTH = 30;

const ALPHANUMERIC = /^[A-Za-z0-9]+$/;

/**
 * Names nobody may claim. Kept identical to the server's list.
 * Compared case-insensitively, because the columns are CITEXT: blocking
 * `support` while allowing `SUPPORT` would be no block at all.
 */
const RESERVED_NAMES = [
  'admin',
  'administrator',
  'support',
  'help',
  'ubexgo',
  'ubex',
  'root',
  'system',
  'moderator',
  'official',
  'driver',
  'passenger',
  'null',
  'undefined',
];

/** The translation key of what is wrong, or `null` when the value is fine. */
export type IdentifierIssue = string | null;

const isReserved = (value: string): boolean =>
  RESERVED_NAMES.includes(value.toLowerCase());

/**
 * Check a promo code the user wants to own.
 *
 * ⚠️ Empty means "not chosen", which is allowed — both fields are optional.
 * ⚠️ Length is measured AFTER trimming, exactly as the server does, or `'AB1  '`
 * would pass here and be refused there.
 */
export const checkOwnPromoCode = (raw: string): IdentifierIssue => {
  const value = raw.trim();

  if (value.length === 0) return null;
  if (value.length !== PROMO_CODE_LENGTH) return 'userDetails.errorOwnPromoLength';
  if (!ALPHANUMERIC.test(value)) return 'userDetails.errorIdentifierChars';
  if (isReserved(value)) return 'userDetails.errorIdentifierReserved';

  return null;
};

/** Check a username. Same policy as above. */
export const checkUsername = (raw: string): IdentifierIssue => {
  const value = raw.trim();

  if (value.length === 0) return null;
  if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) {
    return 'userDetails.errorUsernameLength';
  }
  if (!ALPHANUMERIC.test(value)) return 'userDetails.errorIdentifierChars';
  if (isReserved(value)) return 'userDetails.errorIdentifierReserved';

  return null;
};
