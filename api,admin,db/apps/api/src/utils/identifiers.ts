/**
 * User-chosen identifiers — T-091.
 *
 * The rules for a user's OWN promo code and their username. DB-free on purpose,
 * for the same reason `utils/ledger.ts` is: every service imports Sequelize and
 * therefore cannot be unit-tested, so the rules that decide what a user is
 * allowed to claim live where `npm test` can execute them.
 *
 * 🔴 A PROMO CODE HERE IS THE USER'S OWN — the one they hand out. It is NOT
 * `users.promo_code`, which holds the code they typed in to name whoever
 * invited THEM. See the comments on the User model.
 */

export type IdentifierErrorCode =
  | 'required'
  | 'wrong_length'
  | 'invalid_characters'
  | 'reserved';

export class IdentifierError extends Error {
  readonly code: IdentifierErrorCode;
  /** The field this is about, so the API can name it in the response. */
  readonly field: 'own_promo_code' | 'username';

  constructor(
    field: 'own_promo_code' | 'username',
    code: IdentifierErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'IdentifierError';
    this.code = code;
    this.field = field;
  }
}

/** Exactly 5 characters, digits and latin letters. Owner's rule, 2026-08-14. */
export const PROMO_CODE_LENGTH = 5;

/** At least 6 characters, digits and latin letters. Owner's rule, 2026-08-14. */
export const USERNAME_MIN_LENGTH = 6;

/**
 * An upper bound the owner did not specify, but a column and a UI both need one.
 * 30 is the common handle limit and leaves the value far inside CITEXT's limits.
 */
export const USERNAME_MAX_LENGTH = 30;

const ALPHANUMERIC = /^[A-Za-z0-9]+$/;

/**
 * Is the request actually trying to SET this identifier?
 *
 * 🔴 Absent, `null` and `''` all mean "not provided" — never "clear it". Both
 * screens PUT the whole profile on every save, so a user editing their email
 * re-sends an empty box for a code they never claimed. Treating `''` as a value
 * would write an empty string into a UNIQUE column, and the SECOND user to save
 * their profile would collide with the first on a field neither of them touched.
 *
 * ⚠️ Used by the validator AND the controller. If the two disagree about what
 * counts as provided, the one that skips validation and the one that writes are
 * no longer the same set of requests — which is exactly how an unvalidated
 * value reaches the column.
 */
export function isIdentifierProvided(raw: unknown): boolean {
  return raw !== undefined && raw !== null && raw !== '';
}

/**
 * Names nobody may claim.
 *
 * ⚠️ Far cheaper to decide now than later: taking a username back from a real
 * user who is already using it is a support problem, not a code change.
 * Compared case-insensitively, like the column itself.
 *
 * ⚠️ MATCHING IS EXACT, NOT SUBSTRING. `admin1` and `supporter` are claimable.
 * Substring matching would refuse a lot of legitimate names for little benefit,
 * and near-miss impersonation is a policy question needing a richer rule than a
 * list — not something to smuggle in here.
 *
 * ⚠️ Some entries are currently unreachable, and that is deliberate: `admin` (5)
 * can only ever be a promo code, and `ubex` / `root` / `help` / `null` (4) fit
 * neither rule today. They are kept because this list is a POLICY that should
 * outlive the current length rules — not dead configuration to be pruned.
 */
export const RESERVED_NAMES: readonly string[] = [
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
  'undefined'
];

function isReserved(value: string): boolean {
  return RESERVED_NAMES.includes(value.toLowerCase());
}

/**
 * Validate and normalise a user's OWN promo code.
 *
 * Returns the trimmed value as typed. ⚠️ Case is NOT folded here: the column is
 * CITEXT, so uniqueness is already case-insensitive, and folding would rewrite
 * what the user chose to display. Storage decides identity; this decides
 * legality.
 */
export function normalisePromoCode(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw new IdentifierError('own_promo_code', 'required', 'A promo code is required');
  }

  const value = raw.trim();

  if (value.length === 0) {
    throw new IdentifierError('own_promo_code', 'required', 'A promo code is required');
  }
  if (value.length !== PROMO_CODE_LENGTH) {
    throw new IdentifierError(
      'own_promo_code',
      'wrong_length',
      `A promo code must be exactly ${PROMO_CODE_LENGTH} characters`
    );
  }
  if (!ALPHANUMERIC.test(value)) {
    throw new IdentifierError(
      'own_promo_code',
      'invalid_characters',
      'A promo code may contain only latin letters and digits'
    );
  }
  if (isReserved(value)) {
    throw new IdentifierError('own_promo_code', 'reserved', 'That promo code is not available');
  }

  return value;
}

/** Validate and normalise a username. Same normalisation policy as above. */
export function normaliseUsername(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw new IdentifierError('username', 'required', 'A username is required');
  }

  const value = raw.trim();

  if (value.length === 0) {
    throw new IdentifierError('username', 'required', 'A username is required');
  }
  if (value.length < USERNAME_MIN_LENGTH) {
    throw new IdentifierError(
      'username',
      'wrong_length',
      `A username must be at least ${USERNAME_MIN_LENGTH} characters`
    );
  }
  if (value.length > USERNAME_MAX_LENGTH) {
    throw new IdentifierError(
      'username',
      'wrong_length',
      `A username may be at most ${USERNAME_MAX_LENGTH} characters`
    );
  }
  if (!ALPHANUMERIC.test(value)) {
    throw new IdentifierError(
      'username',
      'invalid_characters',
      'A username may contain only latin letters and digits'
    );
  }
  if (isReserved(value)) {
    throw new IdentifierError('username', 'reserved', 'That username is not available');
  }

  return value;
}

/**
 * True when two identifiers are the same as far as the database is concerned.
 *
 * ⚠️ The columns are CITEXT, so `ABC12` and `abc12` ARE the same code. Any
 * comparison in application code has to agree with that or a "check if taken"
 * will disagree with the unique index and report a code free that then fails
 * to insert.
 */
export function identifiersMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
