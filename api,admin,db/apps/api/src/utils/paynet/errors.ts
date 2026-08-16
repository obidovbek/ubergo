/**
 * Paynet error codes — T-088.
 *
 * The catalogue from docs/PAYNET.md §7, plus the mapping from this project's own
 * `LedgerError` codes onto it.
 *
 * 🔴 THE SIGN OF `error.code` IS NOT CONFIRMED, AND IT IS A REAL AMBIGUITY IN THE
 * SOURCE DOCUMENTS — not an oversight here. The commercial annex lists the codes
 * as POSITIVE (`301`, `413`, `601`); the JSON-RPC sample in the protocol spec
 * shows `{"code": -253}`. Both documents are from Paynet.
 *
 * Guessing wrong does not fail loudly — it produces a service that answers every
 * error with a code Paynet classifies as something else, which is worst in the
 * one case that matters: `201` (transaction already exists) being unrecognised
 * means their terminal retries a payment we have already credited.
 *
 * So the sign lives in ONE constant, driven by env, and every code goes through
 * `paynetErrorCode()`. When Paynet answers question ③, one env var changes.
 */

/**
 * ✅ RESOLVED 2026-08-16 BY READING THE SOURCE DOCUMENTS PROPERLY — the sign is
 * POSITIVE, and the two "conflicting" documents were never in conflict.
 *
 * The JSON spec (§2.5) has TWO ranges, and they mean different things:
 *   · NEGATIVE `-32700 / -32600 / -32601 / -32602 / -32603 / -32300` — these are
 *     the JSON-RPC 2.0 standard's own protocol errors (bad JSON, method not
 *     found, not POST). Identical in every JSON-RPC implementation on earth.
 *   · POSITIVE `412 / 413 / 415 / 601 / 603 …` — Paynet's BUSINESS errors.
 * The `-253` in the spec's example is a placeholder inside an illustration, not
 * a real code.
 *
 * So business codes are emitted positive. The env var is kept as an escape
 * hatch only; nothing is expected to set it.
 */
const SIGN_IS_NEGATIVE = process.env.PAYNET_ERROR_SIGN === 'negative';

/**
 * ✅ THE TWO DOCUMENTS AGREE. There is no numbering conflict.
 *
 * 🔴 A "conflict" was reported here on 2026-08-16 and it was an ARTEFACT OF PDF
 * TEXT EXTRACTION, not a fact about the documents. `pdftotext -layout` renders
 * the error table with the description column shifted DOWN one row, because the
 * `-32603` description wraps onto three lines and the next code (`0`) prints
 * alongside its last line. Read naively, every code appears to carry the
 * following code's meaning — which produced the absurd `77 = "Проведено
 * успешно"` (77 = "completed successfully") that should have been the tell.
 *
 * Re-extracted WITHOUT `-layout` (raw reading order), the table emits 32 codes
 * then 32 descriptions, pairing 1:1 and matching the annex exactly:
 *   0 = success · 77 = insufficient funds to cancel · 201 = already exists ·
 *   202 = already cancelled · 302 = client not found · 401-410 = param 1-10.
 *
 * **Lesson: when two sources "disagree", suspect the reader before the sources
 * — especially a table read out of a PDF.**
 *
 * The JSON spec only ADDS codes the annex lacks: 113, 140, 141, 203, 415.
 */

/**
 * The codes this service can emit, by name.
 *
 * Named rather than inlined because two of them carry the contract's real
 * obligations and must be greppable: see `ALREADY_EXISTS` and `CANNOT_CANCEL`.
 */
/**
 * The codes this service emits, by name.
 *
 * Both source documents agree on every code below. Where they differ, it is
 * only that the JSON spec **adds** entries the annex lacks — marked ✚.
 */
export const PAYNET_ERRORS = {
  SUCCESS: 0,

  /** 🔴 THE IDEMPOTENCY CONTRACT: a repeat must return this, never a 2nd credit. */
  ALREADY_EXISTS: 201,
  ALREADY_CANCELLED: 202,

  /** 🔴 THE REFUND RULE: refuse a cancellation once the payer has spent it. */
  CANNOT_CANCEL: 77,

  SERVICE_UNSUPPORTED: 100,
  QUOTA_EXHAUSTED: 101,
  SYSTEM_ERROR: 102,
  UNKNOWN_ERROR: 103,

  /** ✚ spec only — the wallet could not be identified. */
  WALLET_NOT_IDENTIFIED: 113,
  /** ✚ spec only — monthly limit exceeded for this account. */
  MONTHLY_LIMIT_EXCEEDED: 140,
  /** ✚ spec only — daily limit exceeded for this account. */
  DAILY_LIMIT_EXCEEDED: 141,

  /**
   * ✚ spec only — the transaction does not exist.
   *
   * ⚠️ The RIGHT answer when Paynet asks about a `transactionId` we have never
   * seen. Before this was found, `CheckTransaction`/`CancelTransaction`
   * answered `CLIENT_NOT_FOUND` (302, "client not found") for a missing
   * transaction — a different fact, and one that would send whoever debugged it
   * looking at the customer record instead of the payment.
   */
  TRANSACTION_NOT_FOUND: 203,

  NUMBER_NOT_FOUND: 301,
  CLIENT_NOT_FOUND: 302,
  PRODUCT_NOT_FOUND: 304,
  SERVICE_NOT_FOUND: 305,

  MISSING_PARAMETER: 411,
  BAD_LOGIN: 412,
  BAD_AMOUNT: 413,
  BAD_DATE_FORMAT: 414,

  /**
   * ✚ spec only — "Сумма превышает максимальный лимит".
   *
   * ✅ Answers blocker ④ in part: a maximum top-up **exists** as a concept and
   * we must be able to report it. Only its VALUE still has to come from Paynet.
   */
  AMOUNT_OVER_LIMIT: 415,

  TRANSACTIONS_FORBIDDEN: 501,
  ACCESS_DENIED: 601,
  BAD_COMMAND: 603
} as const;

export type PaynetErrorName = keyof typeof PAYNET_ERRORS;

/** Validation errors on parameter 1..10 are 401..410 (annex §7). */
export function parameterErrorCode(position: number): number {
  if (!Number.isInteger(position) || position < 1 || position > 10) {
    // Outside the range the annex defines, so the honest answer is the generic
    // "required parameter missing" rather than inventing 411+n.
    return applySign(PAYNET_ERRORS.MISSING_PARAMETER);
  }
  return applySign(400 + position);
}

/**
 * The wire value for a named error, with the configured sign applied.
 *
 * ⚠️ Call this rather than reading `PAYNET_ERRORS.X` directly when building a
 * response — the constants are the catalogue, this is the wire format.
 */
export function paynetErrorCode(name: PaynetErrorName): number {
  return applySign(PAYNET_ERRORS[name]);
}

function applySign(code: number): number {
  // Zero has no sign, and negating it produces `-0`, which serialises as `0`
  // but compares surprisingly. Left alone deliberately.
  if (code === 0) return 0;
  return SIGN_IS_NEGATIVE ? -code : code;
}

/**
 * A failure that should become a JSON-RPC `error` object.
 *
 * Carries the NAME rather than the number so the sign is applied once, at the
 * edge, and a test can assert on the meaning instead of on the encoding.
 */
export class PaynetError extends Error {
  readonly name = 'PaynetError';
  readonly errorName: PaynetErrorName;
  /**
   * Extra context for the audit log. Never sent to Paynet.
   *
   * ⚠️ `| undefined` is explicit because this project compiles with
   * `exactOptionalPropertyTypes`, under which `detail?: T` refuses an assigned
   * `undefined` — the constructor parameter is optional, so it assigns exactly
   * that.
   */
  readonly detail: Record<string, unknown> | undefined;

  constructor(errorName: PaynetErrorName, message: string, detail?: Record<string, unknown>) {
    super(message);
    this.errorName = errorName;
    this.detail = detail;
  }

  get code(): number {
    return paynetErrorCode(this.errorName);
  }
}

/**
 * Map a `LedgerError` code (utils/ledger.ts) onto the Paynet catalogue.
 *
 * 🔴 `insufficient_funds` → **77**, the refund rule. `utils/ledger.ts` already
 * names this correspondence in `canDebit`'s comment; this is the other half of
 * it, written where the wire format is decided.
 */
export function ledgerErrorToPaynet(code: string): PaynetErrorName {
  switch (code) {
    case 'insufficient_funds':
      return 'CANNOT_CANCEL';
    case 'not_numeric':
    case 'amount_zero':
    case 'amount_not_integer':
    case 'amount_unsafe':
    case 'precision_too_fine':
      return 'BAD_AMOUNT';
    default:
      return 'SYSTEM_ERROR';
  }
}
