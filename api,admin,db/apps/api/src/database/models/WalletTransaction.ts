/**
 * WalletTransaction Model — T-087
 *
 * 🔴 THE LEDGER IS APPEND-ONLY. Nothing updates or deletes a row here, ever.
 * A correction is a NEW row with the negated amount and `reverses_id` pointing
 * at the row it corrects.
 *
 * That is not style — it is what the owner asked for ("qayta hisob kitob yoki
 * qaytarish" is impossible on a mutable balance column) and it is the only way
 * to answer Paynet's error 77, which requires refusing a cancellation when the
 * payer has already spent the money (docs/PAYNET.md §7).
 *
 * `amount` is SIGNED — negative is a debit — so the sum of the entries IS the
 * balance and reconciliation is one GROUP BY.
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** Who caused an entry. Recorded on every row: the owner asked twice for "kim orqali". */
export type WalletActorType = 'system' | 'admin' | 'provider' | 'user';

export const WALLET_ACTOR_TYPES: readonly WalletActorType[] = ['system', 'admin', 'provider', 'user'];

/**
 * Why an entry exists. Extended by the later cards in this batch — T-089 adds
 * the referral reasons, T-090 the bonus ones — so the column is STRING(40)
 * rather than an enum that would need a migration each time.
 */
export type WalletReason =
  | 'paynet_topup'
  | 'admin_topup'
  | 'referral_user'
  | 'referral_driver'
  | 'bonus_signup'
  | 'bonus_admin'
  | 'bonus_promo'
  | 'bonus_expired'
  | 'ride_discount'
  | 'reversal'
  | 'correction';

export interface WalletTransactionAttributes {
  /**
   * BIGSERIAL. Doubles as Paynet's `providerTrnId` — the id WE mint and they
   * quote back at us — which their samples show as a number (`2323`). Reusing
   * the primary key means T-088 needs no second identity column.
   */
  id: number;
  account_id: string;
  /** Signed: negative is a debit. Integer tiyin for `real` accounts. Never 0. */
  amount: number;
  /** The account balance immediately after this entry. Makes the row self-verifying. */
  balance_after: number;
  reason: WalletReason;
  actor_type: WalletActorType;
  actor_admin_id?: number | null;
  actor_user_id?: number | null;
  /** 'paynet' | 'payme' | 'click' — null for bonuses and referrals. */
  provider?: string | null;
  /** The PROVIDER'S id (Paynet's `transactionId`). The idempotency key. */
  external_id?: string | null;
  /** The entry this one reverses. Set only on reversals. */
  reverses_id?: number | null;
  meta: Record<string, unknown>;
  created_at: Date;
}

export interface WalletTransactionCreationAttributes
  extends Optional<
    WalletTransactionAttributes,
    | 'id'
    | 'actor_admin_id'
    | 'actor_user_id'
    | 'provider'
    | 'external_id'
    | 'reverses_id'
    | 'meta'
    | 'created_at'
  > {}

export class WalletTransaction
  extends Model<WalletTransactionAttributes, WalletTransactionCreationAttributes>
  implements WalletTransactionAttributes
{
  declare id: number;
  declare account_id: string;
  declare amount: number;
  declare balance_after: number;
  declare reason: WalletReason;
  declare actor_type: WalletActorType;
  declare actor_admin_id?: number | null;
  declare actor_user_id?: number | null;
  declare provider?: string | null;
  declare external_id?: string | null;
  declare reverses_id?: number | null;
  declare meta: Record<string, unknown>;
  declare readonly created_at: Date;

  declare createdAt: Date;
}

/**
 * BIGINT arrives from node-postgres as a STRING (see WalletAccount.balance for
 * why). Every 64-bit column here needs the same normalisation, so it is written
 * once instead of four times.
 */
function bigIntGetter(field: 'id' | 'amount' | 'balance_after' | 'reverses_id') {
  return function (this: WalletTransaction): number | null {
    const raw = this.getDataValue(field) as unknown;
    if (raw === null || raw === undefined) return null;
    return typeof raw === 'number' ? raw : Number(raw);
  };
}

export function initWalletTransaction(sequelize: Sequelize) {
  WalletTransaction.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        get: bigIntGetter('id') as unknown as () => number
      },
      account_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'wallet_accounts', key: 'id' }
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get: bigIntGetter('amount') as unknown as () => number
      },
      balance_after: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get: bigIntGetter('balance_after') as unknown as () => number
      },
      reason: {
        type: DataTypes.STRING(40),
        allowNull: false
      },
      actor_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [[...WALLET_ACTOR_TYPES]]
        }
      },
      actor_admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'admin_users', key: 'id' }
      },
      actor_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      },
      provider: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      external_id: {
        type: DataTypes.STRING(64),
        allowNull: true
      },
      reverses_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: { model: 'wallet_transactions', key: 'id' },
        get: bigIntGetter('reverses_id') as unknown as () => number | null
      },
      meta: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      }
    },
    {
      sequelize,
      tableName: 'wallet_transactions',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ['account_id', 'created_at'],
          name: 'idx_wallet_transactions_account_created'
        },
        {
          fields: ['created_at'],
          name: 'idx_wallet_transactions_created_at'
        }
      ]
    }
  );

  return WalletTransaction;
}

export default WalletTransaction;
