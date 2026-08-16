/**
 * PaynetService — T-088. The six methods, over T-087's ledger.
 *
 * 🔴 THIS FILE MOVES REAL MONEY. Three rules govern it, and all three are
 * enforced somewhere OTHER than here — which is deliberate:
 *
 *   201 "already exists"  → the DB's partial unique index on
 *                           (provider, external_id). `WalletService.move`
 *                           returns the ORIGINAL entry on a repeat.
 *   77  "cannot cancel"   → `utils/ledger.ts` `applyEntry`, which refuses a
 *                           debit that would take the balance below zero,
 *                           read under `WalletService.reverse`'s row lock.
 *   the arithmetic        → `utils/ledger.ts`, because this file imports
 *                           Sequelize and therefore cannot be unit-tested.
 *
 * **If you are about to add arithmetic or a uniqueness check here, it belongs
 * in one of those two places instead.**
 *
 * ⚠️ ≤500 ms or Paynet may disconnect us (docs/PAYNET.md §2). Every method below
 * is one indexed lookup plus at most one locked write.
 */

import { Op } from 'sequelize';

import { User } from '../database/models/index.js';
import { Phone } from '../database/models/index.js';
import { WalletTransaction } from '../database/models/index.js';
import { WalletService } from './WalletService.js';
import { PaynetError } from '../utils/paynet/errors.js';
import { maskPhoneForAgent, readClientId, parseUserId } from '../utils/paynet/identity.js';
import { toAmount } from '../utils/ledger.js';

/** `transactionState` values from the protocol samples (docs/PAYNET.md §5). */
const STATE_PERFORMED = 1;
const STATE_CANCELLED = 2;

/** Paynet is the actor on every entry this service writes. */
const PAYNET_ACTOR = { type: 'provider' as const };

const PROVIDER = 'paynet';

/**
 * Shown to the agent when the payer has no phone number on file.
 *
 * ⚠️ Deliberately NOT an empty string. Blank reads as a broken screen; this
 * reads as "the account is real, we just have nothing to confirm it by", which
 * is the true state and lets the agent decide whether to proceed.
 * ⚠️ Latin, not Cyrillic/Uzbek — the terminal's encoding is not ours to assume.
 */
const NO_PHONE_ON_FILE = 'UbexGo';

export class PaynetService {
  /**
   * Resolve the payer named by a request's `fields`, or throw the documented
   * "no such client" error.
   *
   * ⚠️ Both failure modes answer `CLIENT_NOT_FOUND`, deliberately: a malformed
   * id and an absent user are the same fact to the agent standing at the
   * terminal, and distinguishing them would confirm which ids exist — the
   * enumeration risk T-092 created.
   */
  private static async resolveUser(fields: unknown): Promise<User> {
    const userId = parseUserId(readClientId(fields));
    if (userId === null) {
      throw new PaynetError('CLIENT_NOT_FOUND', 'Client not found');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new PaynetError('CLIENT_NOT_FOUND', 'Client not found');
    }
    return user;
  }

  /**
   * `GetInformation` — what the agent reads back before taking the cash.
   *
   * 🔴 THE MASKING IS SERVER-SIDE AND MUST STAY THAT WAY. Returning the full
   * number for a UI to hide would leak it in the response body. See
   * `utils/paynet/identity.ts`.
   */
  static async getInformation(fields: unknown): Promise<Record<string, unknown>> {
    const user = await PaynetService.resolveUser(fields);

    /*
     * 🔴 THE NUMBER LIVES ON `users.phone_e164`, NOT IN THE `phones` TABLE.
     *
     * This read was originally `Phone.findOne({ label: 'primary' })` and it
     * returned NOTHING for a real registered user — proven on test3, where the
     * agent's field came back EMPTY. `phones` holds the *additional* contacts a
     * user may add (the "up to 5" feature) and is empty for most accounts; the
     * registration number is a column on `users`.
     *
     * The model's own header comment says "Manages primary/trusted/extra phone
     * numbers", which is what misled me. ⚠️ The `phones` row is still consulted
     * as a fallback, because a user MAY have a row labelled 'primary' there.
     */
    let e164 = user.phone_e164 ?? null;

    if (!e164) {
      const fallback = await Phone.findOne({
        where: { user_id: user.id, label: 'primary' }
      });
      e164 = fallback?.e164 ?? null;
    }

    const balances = await WalletService.getBalances(user.id);

    // 🔴 THE SHAPE COMES FROM THE JSON SPEC §3.1, NOT FROM THE ANNEX.
    // The response is `status` + `timestamp` + a `fields` OBJECT — the
    // per-service values are nested inside `fields`, they are NOT top-level.
    // (An earlier version of this method returned `{client_id, fio}` at the top
    // level, copied from the spec's *narrative* example rather than its
    // response table. It would have failed on Paynet's first real call.)
    return {
      status: 0,
      timestamp: PaynetService.formatTimestamp(new Date()),
      fields: {
        client_id: String(user.id),
        // ⚠️ BLOCKER ② — the spec's own example puts `name` and `balance` here.
        // We send a MASKED PHONE instead of a name: it is what the owner asked
        // for, and it is what an agent needs to read back ("is this you?")
        // without disclosing a stranger's identity. Confirm with Paynet.
        //
        // 🔴 NEVER RETURN AN EMPTY STRING HERE. A blank field on the agent's
        // screen means they take cash with nothing to confirm the payer by, and
        // it looks like a display glitch rather than missing data. A user with
        // no number on file is rare but real (proven on test3), so it gets an
        // explicit marker instead.
        name: maskPhoneForAgent(e164) || NO_PHONE_ON_FILE,
        // "остаток текущего депозита Плательщика" — the payer's balance, in
        // tiyin, which is the unit the whole contract uses (§6).
        balance: balances.real
      }
    };
  }

  /**
   * `PerformTransaction` — take a payment in.
   *
   * 🔴 IDEMPOTENT VIA `transactionId`, WHICH IS PAYNET'S ID, NOT OURS. A repeat
   * returns the original entry unchanged — `WalletService.move` short-circuits
   * on `external_id`, and the unique index catches anything that races it.
   * We return `providerTrnId` = our `wallet_transactions.id`.
   */
  static async performTransaction(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const transactionId = PaynetService.requireTransactionId(params);
    const user = await PaynetService.resolveUser(params.fields);
    const amount = PaynetService.requireAmount(params.amount);

    const entry = await WalletService.move({
      userId: user.id,
      kind: 'real',
      amount,
      reason: 'paynet_topup',
      actor: PAYNET_ACTOR,
      provider: PROVIDER,
      externalId: transactionId,
      meta: { paynet_transaction_id: transactionId }
    });

    // ⚠️ A repeat lands here too, with the ORIGINAL entry — same providerTrnId,
    // same timestamp. That is the contract: a retry is answered, not refused,
    // and never credited twice.
    return {
      timestamp: PaynetService.formatTimestamp(entry.created_at),
      providerTrnId: entry.id,
      fields: { client_id: String(user.id) }
    };
  }

  /** `CheckTransaction` — report the state of a payment we have already seen. */
  static async checkTransaction(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const transactionId = PaynetService.requireTransactionId(params);

    const entry = await WalletTransaction.findOne({
      where: { provider: PROVIDER, external_id: transactionId }
    });
    if (!entry) {
      // Paynet asking about a transaction we never received is a real answer,
      // not a system error.
      // ✅ 203, not 302. The JSON spec has a dedicated "транзакция не найдена";
      // answering "client not found" for a missing PAYMENT is a different fact
      // and would point whoever debugs it at the customer record.
      throw new PaynetError('TRANSACTION_NOT_FOUND', 'Transaction not found');
    }

    const reversal = await WalletTransaction.findOne({ where: { reverses_id: entry.id } });

    return {
      transactionState: reversal ? STATE_CANCELLED : STATE_PERFORMED,
      timestamp: PaynetService.formatTimestamp(entry.created_at),
      providerTrnId: entry.id
    };
  }

  /**
   * `CancelTransaction` — reverse a payment.
   *
   * 🔴 ERROR 77 LIVES HERE, AND IT IS THE REASON THE LEDGER IS APPEND-ONLY.
   * `WalletService.reverse` debits the account under a row lock; if the payer
   * has already spent the money, `applyEntry` refuses and we must answer 77
   * rather than driving the balance negative.
   */
  static async cancelTransaction(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const transactionId = PaynetService.requireTransactionId(params);

    const entry = await WalletTransaction.findOne({
      where: { provider: PROVIDER, external_id: transactionId }
    });
    if (!entry) {
      // ✅ 203, not 302. The JSON spec has a dedicated "транзакция не найдена";
      // answering "client not found" for a missing PAYMENT is a different fact
      // and would point whoever debugs it at the customer record.
      throw new PaynetError('TRANSACTION_NOT_FOUND', 'Transaction not found');
    }

    const existingReversal = await WalletTransaction.findOne({
      where: { reverses_id: entry.id }
    });
    if (existingReversal) {
      // Already cancelled: answer 202 and report the state, rather than
      // attempting a second reversal.
      return {
        providerTrnId: entry.id,
        transactionState: STATE_CANCELLED,
        timestamp: PaynetService.formatTimestamp(existingReversal.created_at)
      };
    }

    let reversal: WalletTransaction;
    try {
      reversal = await WalletService.reverse(entry.id, 'reversal', PAYNET_ACTOR, {
        paynet_transaction_id: transactionId
      });
    } catch (error) {
      // 🔴 The one translation that matters. `WalletService` reports a refused
      // debit as a 400 carrying the ledger code; Paynet needs 77.
      if (PaynetService.isInsufficientFunds(error)) {
        throw new PaynetError(
          'CANNOT_CANCEL',
          'Insufficient funds to cancel this payment',
          { transactionId }
        );
      }
      throw error;
    }

    return {
      providerTrnId: entry.id,
      transactionState: STATE_CANCELLED,
      timestamp: PaynetService.formatTimestamp(reversal.created_at)
    };
  }

  /**
   * `GetStatement` — every Paynet transaction in a date range.
   *
   * ⚠️ Paynet reconciles against this DAILY and contractually. It must list our
   * side of the ledger for the window, not a page of it — so there is no limit
   * here, unlike `WalletService.getStatement` which serves a phone screen.
   */
  static async getStatement(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const from = PaynetService.requireDate(params.dateFrom, 'dateFrom');
    const to = PaynetService.requireDate(params.dateTo, 'dateTo');

    if (from > to) {
      throw new PaynetError('BAD_DATE_FORMAT', 'dateFrom must not be after dateTo');
    }

    const entries = await WalletTransaction.findAll({
      where: {
        provider: PROVIDER,
        created_at: { [Op.between]: [from, to] }
      },
      order: [['created_at', 'ASC'], ['id', 'ASC']]
    });

    return {
      statements: entries.map((entry) => ({
        transactionId: entry.external_id,
        providerTrnId: entry.id,
        amount: Math.abs(entry.amount),
        timestamp: PaynetService.formatTimestamp(entry.created_at)
      }))
    };
  }

  // ── validation helpers ────────────────────────────────────────────────────

  /**
   * Paynet's `transactionId`, as a string.
   *
   * ⚠️ Kept as TEXT, never parsed to a number: the sample is `12345678900`,
   * which is beyond a 32-bit int, and it is an opaque key we only ever compare
   * for equality. Parsing it risks precision loss on the ONE value that
   * guarantees we do not double-credit somebody.
   */
  private static requireTransactionId(params: Record<string, unknown>): string {
    const raw = params.transactionId;

    if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
    if (typeof raw === 'number' && Number.isSafeInteger(raw)) return String(raw);

    throw new PaynetError('MISSING_PARAMETER', 'transactionId is required');
  }

  /** The amount, in integer tiyin, positive. */
  private static requireAmount(raw: unknown): number {
    let amount: number;
    try {
      amount = toAmount(raw);
    } catch {
      throw new PaynetError('BAD_AMOUNT', 'amount must be a whole number of tiyin');
    }

    if (amount <= 0) {
      // A zero or negative top-up is not a payment. The ledger would refuse it
      // anyway; refusing here gives Paynet the documented code instead of 102.
      throw new PaynetError('BAD_AMOUNT', 'amount must be greater than zero');
    }
    return amount;
  }

  /**
   * `"2021-04-20 08:00:00"` → Date.
   *
   * ⚠️ Parsed explicitly rather than with `new Date(string)`, whose handling of
   * a space-separated form is implementation-defined — and a date silently
   * read as Invalid would make a reconciliation window empty rather than wrong,
   * which is the harder failure to notice.
   */
  private static requireDate(raw: unknown, field: string): Date {
    if (typeof raw !== 'string') {
      throw new PaynetError('BAD_DATE_FORMAT', `${field} is required`);
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(raw.trim());
    if (!match) {
      throw new PaynetError('BAD_DATE_FORMAT', `${field} must be YYYY-MM-DD HH:mm:ss`);
    }

    const [, year, month, day, hour, minute, second] = match as unknown as string[];
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );

    if (Number.isNaN(date.getTime())) {
      throw new PaynetError('BAD_DATE_FORMAT', `${field} is not a real date`);
    }
    return date;
  }

  /** The protocol's timestamp format (docs/PAYNET.md §5). */
  private static formatTimestamp(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  }

  /**
   * Did `WalletService` refuse this because the balance cannot absorb it?
   *
   * 🔴 THE FIELD IS `data`, NOT `details`. `AppError` (src/errors/AppError.ts:10)
   * stores its payload in `data`, and `WalletService.toAppError` puts the ledger
   * code there as `{ code }`. Reading the wrong property here does not fail
   * loudly — it silently turns **error 77 into a generic system error**, and
   * Paynet would retry the cancellation instead of reporting it to the agent.
   * Verified against the class rather than assumed.
   */
  private static isInsufficientFunds(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const data = (error as { data?: { code?: string } }).data;
    return data?.code === 'insufficient_funds';
  }
}

export default PaynetService;
