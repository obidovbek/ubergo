/**
 * Ledger arithmetic — T-087.
 *
 * 🔴 THIS MODULE IS DELIBERATELY DB-FREE, AND THAT IS THE WHOLE POINT.
 * Every service in this project imports Sequelize, which is why none of them
 * can be tested (CLAUDE.md records this limit honestly). The part of a billing
 * system that must never be wrong is the arithmetic — so it lives here, where
 * `npm test` can actually execute it, and `WalletService` does nothing but
 * apply it inside a transaction.
 *
 * Two conventions this file enforces, both of which cost real money if broken:
 *
 * ① MONEY IS INTEGER TIYIN. Paynet types the balance `long` in tiyin
 *   (docs/PAYNET.md §6) — their `"amount": 100000` is 1 000 so'm. Ride prices
 *   are DECIMAL(10,2) so'm. `somToTiyin` / `tiyinToSom` are the ONLY places the
 *   two conventions are allowed to meet.
 *
 * ② NOTHING IS PARSED WITH FLOATING POINT. `19.99 * 100` is
 *   1998.9999999999998 in JavaScript. Conversion goes through the string form
 *   and BigInt, so it is exact for every value a DECIMAL(10,2) column can hold.
 */

export type LedgerErrorCode =
  | 'not_numeric'
  | 'amount_zero'
  | 'amount_not_integer'
  | 'amount_unsafe'
  | 'precision_too_fine'
  | 'insufficient_funds';

/**
 * A ledger rule was broken. Carries a stable `code` so callers can map it to a
 * translation key and — for T-088 — to a Paynet error code (`insufficient_funds`
 * is their 77, `not_numeric` / `amount_zero` are their 413).
 */
export class LedgerError extends Error {
  readonly code: LedgerErrorCode;

  constructor(code: LedgerErrorCode, message: string) {
    super(message);
    this.name = 'LedgerError';
    this.code = code;
  }
}

/**
 * Normalise a value that came out of a BIGINT column.
 *
 * 🔴 node-postgres returns BIGINT as a STRING so a 64-bit value cannot silently
 * lose precision in a JS number. Un-normalised, `'100' + 50` is `'10050'` — the
 * same trap that bit T-077 with DECIMAL. Everything entering the arithmetic
 * goes through here first.
 */
export function toAmount(raw: unknown): number {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      throw new LedgerError('not_numeric', `not a finite number: ${raw}`);
    }
    if (!Number.isInteger(raw)) {
      throw new LedgerError('amount_not_integer', `amounts are whole tiyin, got ${raw}`);
    }
    if (!Number.isSafeInteger(raw)) {
      throw new LedgerError('amount_unsafe', `outside safe integer range: ${raw}`);
    }
    return raw;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!/^-?\d+$/.test(trimmed)) {
      throw new LedgerError('not_numeric', `not an integer string: "${raw}"`);
    }
    const parsed = Number(trimmed);
    if (!Number.isSafeInteger(parsed)) {
      throw new LedgerError('amount_unsafe', `outside safe integer range: "${raw}"`);
    }
    return parsed;
  }

  throw new LedgerError('not_numeric', `cannot read an amount from ${typeof raw}`);
}

/** An amount that actually moves value: a whole, non-zero, safe integer. */
export function assertMovement(raw: unknown): number {
  const amount = toAmount(raw);
  if (amount === 0) {
    // A zero entry moves nothing and pollutes the statement Paynet reconciles
    // against daily. The DB has the same CHECK; this is the readable half.
    throw new LedgerError('amount_zero', 'a ledger entry must move a non-zero amount');
  }
  return amount;
}

/**
 * The balance is the sum of the entries. This is the definition, not an
 * optimisation — `wallet_accounts.balance` is only ever a cache of it.
 */
export function foldBalance(entries: ReadonlyArray<{ amount: unknown }>): number {
  let total = 0;
  for (const entry of entries) {
    total += toAmount(entry.amount);
    if (!Number.isSafeInteger(total)) {
      throw new LedgerError('amount_unsafe', 'balance left the safe integer range');
    }
  }
  return total;
}

/**
 * Apply one entry to a balance, refusing to go negative.
 *
 * 🔴 This is the double-spend guard in its pure form. `WalletService` calls it
 * while holding a row lock; without the lock two callers read the same balance
 * and both pass, which is invisible in single-user testing. The DB also carries
 * `CHECK (balance >= 0)` as the last line of defence.
 */
export function applyEntry(balance: unknown, amount: unknown): number {
  const current = toAmount(balance);
  const delta = assertMovement(amount);
  const next = current + delta;

  if (next < 0) {
    throw new LedgerError(
      'insufficient_funds',
      `balance ${current} cannot absorb ${delta}`
    );
  }
  if (!Number.isSafeInteger(next)) {
    throw new LedgerError('amount_unsafe', 'balance left the safe integer range');
  }
  return next;
}

/** True when the debit fits. The question Paynet's error 77 asks before a cancellation. */
export function canDebit(balance: unknown, amount: unknown): boolean {
  try {
    applyEntry(balance, amount);
    return true;
  } catch (error) {
    if (error instanceof LedgerError && error.code === 'insufficient_funds') return false;
    throw error;
  }
}

/**
 * The entry that undoes another one: same size, opposite sign.
 *
 * ⚠️ A reversal is a NEW row, never an edit — that is what makes recalculation
 * and refund possible at all, and it is what the owner asked for.
 */
export function reverseOf(entry: { id: number; amount: unknown }): {
  amount: number;
  reverses_id: number;
} {
  return {
    amount: -assertMovement(entry.amount),
    reverses_id: entry.id
  };
}

export interface Reconciliation {
  ok: boolean;
  /** What the entries say. */
  expected: number;
  /** What `wallet_accounts.balance` claims. */
  actual: number;
  difference: number;
}

/**
 * Compare a cached balance against its own entries.
 *
 * ⚠️ If they ever disagree, THE ENTRIES WIN. The cache is a denormalisation for
 * screens that read a balance constantly; the ledger is the record.
 */
export function reconcile(
  cachedBalance: unknown,
  entries: ReadonlyArray<{ amount: unknown }>
): Reconciliation {
  const expected = foldBalance(entries);
  const actual = toAmount(cachedBalance);
  return {
    ok: expected === actual,
    expected,
    actual,
    difference: actual - expected
  };
}

/**
 * So'm → tiyin. The single crossing point between the two money conventions.
 *
 * Accepts the string a DECIMAL(10,2) column hands back, because that is how it
 * arrives. Exact: parsed through BigInt, never multiplied as a float.
 *
 * 🔴 Refuses anything finer than a tiyin rather than rounding it away. Rounding
 * money is a policy decision nobody has made here, and a silent half-tiyin loss
 * repeated across a million rides is a real number. A caller that genuinely
 * needs rounding must do it explicitly and say why.
 */
export function somToTiyin(value: string | number): number {
  const text = typeof value === 'number' ? formatNumberExactly(value) : value.trim();

  const match = /^(-?)(\d+)(?:\.(\d*))?$/.exec(text);
  if (!match) {
    throw new LedgerError('not_numeric', `not a so'm amount: "${value}"`);
  }

  // `whole` cannot actually be absent — the regex requires \d+ — but the
  // compiler cannot know that, and a default is cheaper than an assertion.
  const [, sign, whole = '0', fractionRaw = ''] = match;

  if (fractionRaw.length > 2 && /[1-9]/.test(fractionRaw.slice(2))) {
    throw new LedgerError(
      'precision_too_fine',
      `"${value}" is finer than one tiyin; round it deliberately if that is intended`
    );
  }

  const fraction = fractionRaw.slice(0, 2).padEnd(2, '0');
  const tiyin = BigInt(whole) * 100n + BigInt(fraction);
  const signed = sign === '-' ? -tiyin : tiyin;

  if (signed > BigInt(Number.MAX_SAFE_INTEGER) || signed < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new LedgerError('amount_unsafe', `outside safe integer range: "${value}"`);
  }
  return Number(signed);
}

/**
 * Tiyin → so'm, as a STRING with exactly two decimals.
 *
 * Deliberately not a number: handing back a float would re-introduce the very
 * error this module exists to prevent, and the DECIMAL(10,2) columns this feeds
 * take a string anyway.
 */
export function tiyinToSom(tiyin: unknown): string {
  const amount = toAmount(tiyin);
  const negative = amount < 0;
  const absolute = Math.abs(amount);
  const whole = Math.floor(absolute / 100);
  const fraction = absolute % 100;
  return `${negative ? '-' : ''}${whole}.${String(fraction).padStart(2, '0')}`;
}

/**
 * A number's exact decimal text, refusing exponent notation.
 *
 * `String(1e21)` is `"1e+21"`, which the so'm parser would reject with a
 * confusing message; and a number that needs exponent notation is far outside
 * any real balance anyway.
 */
function formatNumberExactly(value: number): string {
  if (!Number.isFinite(value)) {
    throw new LedgerError('not_numeric', `not a finite number: ${value}`);
  }
  const text = String(value);
  if (text.includes('e') || text.includes('E')) {
    throw new LedgerError('amount_unsafe', `outside the representable range: ${value}`);
  }
  return text;
}
