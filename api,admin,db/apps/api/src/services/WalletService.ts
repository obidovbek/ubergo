/**
 * WalletService — T-087.
 *
 * The ONLY way value moves in this system. Every method here is a thin
 * transactional wrapper around `utils/ledger.ts`; the arithmetic lives there
 * because this file imports Sequelize and therefore cannot be unit-tested.
 * **If you are about to add arithmetic here, put it in the ledger module and
 * call it from here instead.**
 *
 * 🔴 EVERY WRITE TAKES A ROW LOCK. Without `lock: tx.LOCK.UPDATE` two
 * simultaneous debits both read the same balance and both succeed — the classic
 * double spend, and it is invisible in single-user testing. The precedent is
 * `OfferPassengerService`, which locks the offer row the same way.
 *
 * 🔴 NOTHING IN THIS CARD EXPOSES A WAY TO CREATE VALUE. The write surfaces are
 * T-088 (Paynet), T-089 (referral tokens) and T-090 (the bonus). This service
 * is what they will call.
 */

import { Op, type Transaction } from 'sequelize';

import { sequelize, WalletAccount, WalletTransaction } from '../database/models/index.js';
import type { WalletAccountKind } from '../database/models/WalletAccount.js';
import type {
  WalletActorType,
  WalletReason
} from '../database/models/WalletTransaction.js';
import { WALLET_ACCOUNT_KINDS } from '../database/models/WalletAccount.js';
import { AppError, ConflictError } from '../errors/AppError.js';
import { applyEntry, foldBalance, reconcile, reverseOf, LedgerError } from '../utils/ledger.js';
import { logAudit } from '../utils/auditLogger.js';

/** Who caused a movement, and through what. Recorded on every single entry. */
export interface WalletActor {
  type: WalletActorType;
  /** UUID — `admin_users.id` is a UUID, unlike `users.id` which is an INTEGER. */
  admin_id?: string | null;
  user_id?: number | null;
}

export interface MovementInput {
  userId: number;
  kind: WalletAccountKind;
  /** Signed, in integer tiyin for `real`. Never zero. */
  amount: number;
  reason: WalletReason;
  actor: WalletActor;
  provider?: string | null;
  /** The provider's own id. Makes the movement idempotent. */
  externalId?: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Translate a ledger rule violation into the HTTP shape the API speaks.
 *
 * ⚠️ `insufficient_funds` is a 400, not a 500 — it is a legitimate answer to a
 * legitimate request, and T-088 maps this same code onto Paynet's error 77.
 */
function toAppError(error: unknown): never {
  if (error instanceof LedgerError) {
    throw new AppError(error.message, 400, { code: error.code });
  }
  throw error;
}

export class WalletService {
  /**
   * Fetch (or create) one account, locked for update.
   *
   * ⚠️ Creation is idempotent under concurrency: two parallel first-time
   * movements would both see "no account", and the unique index on
   * (user_id, kind) is what stops the second one inventing a duplicate.
   */
  private static async lockAccount(
    userId: number,
    kind: WalletAccountKind,
    tx: Transaction
  ): Promise<WalletAccount> {
    if (!WALLET_ACCOUNT_KINDS.includes(kind)) {
      throw new AppError(`Unknown wallet kind: ${kind}`, 400);
    }

    const existing = await WalletAccount.findOne({
      where: { user_id: userId, kind },
      transaction: tx,
      lock: tx.LOCK.UPDATE
    });
    if (existing) return existing;

    await WalletAccount.create({ user_id: userId, kind, balance: 0 }, { transaction: tx });

    // Re-read under the lock rather than using the created instance: the row
    // must be locked for the balance check that follows, and `create` does not
    // lock it.
    const created = await WalletAccount.findOne({
      where: { user_id: userId, kind },
      transaction: tx,
      lock: tx.LOCK.UPDATE
    });
    if (!created) {
      throw new AppError('Failed to open a wallet account', 500);
    }
    return created;
  }

  /**
   * Move value. The single entry point for every credit and debit.
   *
   * 🔴 Idempotent when `externalId` is given: a provider that retries — and
   * they all retry — gets the ORIGINAL entry back, not a second credit. The
   * unique index does the real work; this is the readable half.
   */
  static async move(input: MovementInput): Promise<WalletTransaction> {
    const { userId, kind, amount, reason, actor, provider, externalId, meta } = input;

    // An external id with no provider cannot be made unique at the DB level:
    // Postgres treats NULLs as distinct inside a multi-column unique index, so
    // the idempotency guarantee would quietly not apply. The table carries the
    // matching CHECK; this is the readable half, and it fails before the write
    // rather than after it.
    if (externalId && !provider) {
      throw new AppError('An external transaction id must name its provider', 400);
    }

    if (externalId) {
      const existing = await WalletTransaction.findOne({
        where: { provider: provider ?? null, external_id: externalId }
      });
      if (existing) return existing;
    }

    try {
      return await sequelize.transaction(async (tx) => {
        const account = await WalletService.lockAccount(userId, kind, tx);

        // The balance check and the write happen under the same lock. This is
        // the whole reason the method is shaped this way.
        const nextBalance = applyEntry(account.balance, amount);

        const entry = await WalletTransaction.create(
          {
            account_id: account.id,
            amount,
            balance_after: nextBalance,
            reason,
            actor_type: actor.type,
            actor_admin_id: actor.admin_id ?? null,
            actor_user_id: actor.user_id ?? null,
            provider: provider ?? null,
            external_id: externalId ?? null,
            meta: meta ?? {}
          },
          { transaction: tx }
        );

        await account.update({ balance: nextBalance }, { transaction: tx });

        return entry;
      });
    } catch (error) {
      // A retry that raced the check above loses at the unique index. Report it
      // as a conflict so T-088 can answer Paynet with 201 "already exists"
      // rather than a 500.
      if (
        error instanceof Error &&
        error.name === 'SequelizeUniqueConstraintError' &&
        externalId
      ) {
        const existing = await WalletTransaction.findOne({
          where: { provider: provider ?? null, external_id: externalId }
        });
        if (existing) return existing;
        throw new ConflictError('Duplicate transaction');
      }
      return toAppError(error);
    }
  }

  /**
   * Reverse an entry: a NEW row of the opposite sign, citing the original.
   *
   * ⚠️ Refuses when the payer has already spent the money — that is Paynet's
   * error 77, and it is answerable only because the ledger is append-only.
   * ⚠️ Refuses to reverse a reversal twice.
   */
  static async reverse(
    entryId: number,
    reason: WalletReason,
    actor: WalletActor,
    meta?: Record<string, unknown>
  ): Promise<WalletTransaction> {
    try {
      return await sequelize.transaction(async (tx) => {
        const original = await WalletTransaction.findByPk(entryId, { transaction: tx });
        if (!original) {
          throw new AppError('Ledger entry not found', 404);
        }

        const alreadyReversed = await WalletTransaction.findOne({
          where: { reverses_id: entryId },
          transaction: tx
        });
        if (alreadyReversed) {
          throw new ConflictError('This entry has already been reversed');
        }

        const account = await WalletAccount.findByPk(original.account_id, {
          transaction: tx,
          lock: tx.LOCK.UPDATE
        });
        if (!account) {
          throw new AppError('Wallet account not found', 500);
        }

        const { amount, reverses_id } = reverseOf(original);
        const nextBalance = applyEntry(account.balance, amount);

        const entry = await WalletTransaction.create(
          {
            account_id: account.id,
            amount,
            balance_after: nextBalance,
            reason,
            actor_type: actor.type,
            actor_admin_id: actor.admin_id ?? null,
            actor_user_id: actor.user_id ?? null,
            reverses_id,
            meta: meta ?? {}
          },
          { transaction: tx }
        );

        await account.update({ balance: nextBalance }, { transaction: tx });

        return entry;
      });
    } catch (error) {
      return toAppError(error);
    }
  }

  /** All three balances. Missing accounts read as 0 — they are opened on first use. */
  static async getBalances(userId: number): Promise<Record<WalletAccountKind, number>> {
    const accounts = await WalletAccount.findAll({ where: { user_id: userId } });

    const balances = { real: 0, token: 0, bonus: 0 } as Record<WalletAccountKind, number>;
    for (const account of accounts) {
      balances[account.kind] = account.balance;
    }
    return balances;
  }

  /** One account's entries, newest first. */
  static async getStatement(
    userId: number,
    kind: WalletAccountKind,
    options: { from?: Date; to?: Date; limit?: number; offset?: number } = {}
  ): Promise<{ rows: WalletTransaction[]; count: number }> {
    const account = await WalletAccount.findOne({ where: { user_id: userId, kind } });
    if (!account) return { rows: [], count: 0 };

    const where: Record<string, unknown> = { account_id: account.id };
    if (options.from && options.to) {
      where.created_at = { [Op.between]: [options.from, options.to] };
    } else if (options.from) {
      where.created_at = { [Op.gte]: options.from };
    } else if (options.to) {
      where.created_at = { [Op.lte]: options.to };
    }

    return WalletTransaction.findAndCountAll({
      where,
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit: Math.min(options.limit ?? 50, 200),
      offset: options.offset ?? 0
    });
  }

  /**
   * Prove the cached balance equals the sum of its own entries.
   *
   * ⚠️ If they disagree, THE ENTRIES WIN — this reports the drift, it does not
   * "fix" the ledger to match a cache. Repairing a real divergence is a
   * decision with money attached, not something a getter should do silently.
   */
  static async reconcileAccount(userId: number, kind: WalletAccountKind) {
    const account = await WalletAccount.findOne({ where: { user_id: userId, kind } });
    if (!account) return { ok: true, expected: 0, actual: 0, difference: 0 };

    const entries = await WalletTransaction.findAll({
      where: { account_id: account.id },
      attributes: ['amount']
    });

    return reconcile(account.balance, entries.map((entry) => ({ amount: entry.amount })));
  }

  /**
   * Best-effort audit trail alongside the ledger.
   *
   * ⚠️ `logAudit` deliberately swallows its own failures, and that is correct
   * here: the LEDGER entry is the money record and it is already committed
   * inside the transaction. The audit log records the action, not the value —
   * losing it must not roll back a payment.
   */
  static async logMovement(
    entry: WalletTransaction,
    action: string,
    actor: WalletActor
  ): Promise<void> {
    // ⚠️ Two shared-code quirks met here, and neither is worth widening a
    // billing card to fix:
    //  · `AuditLogData.userId` is typed `string`, but `users.id` is an INTEGER
    //    and every existing caller passes a number — the type is simply wrong
    //    and already produces errors in the baseline.
    //  · `exactOptionalPropertyTypes` is on, so an absent user means OMITTING
    //    the key, not setting it to `undefined`.
    // Both are boarded rather than fixed here.
    const audit: Parameters<typeof logAudit>[0] = {
      action,
      payload: {
        transaction_id: entry.id,
        account_id: entry.account_id,
        amount: entry.amount,
        balance_after: entry.balance_after,
        reason: entry.reason,
        actor_type: actor.type,
        actor_admin_id: actor.admin_id ?? null,
        provider: entry.provider ?? null
      }
    };
    if (actor.user_id != null) {
      audit.userId = String(actor.user_id);
    }

    await logAudit(audit);
  }
}

export default WalletService;

/** Re-exported so callers do not have to reach into the model for the sum. */
export { foldBalance };
