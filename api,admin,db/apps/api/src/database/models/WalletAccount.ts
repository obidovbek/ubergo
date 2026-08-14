/**
 * WalletAccount Model — T-087
 *
 * One row per (user, kind). Three kinds:
 *   real  — money, in integer TIYIN (Paynet's unit; see docs/PAYNET.md §6)
 *   token — earned by referral / promo (T-089)
 *   bonus — granted on signup, by an admin, or by a campaign (T-090)
 *
 * 🔴 `balance` is a CACHE of the sum of this account's ledger entries, not the
 * truth. The entries are the truth. If the two ever disagree the entries win —
 * that is what append-only buys, and `reconcile()` in utils/ledger.ts proves it.
 *
 * 🔴 Owner decision 2026-08-14: tokens and bonuses are an IN-SERVICE DISCOUNT
 * ONLY and are never convertible to cash. No code path may move value from a
 * token or bonus account into a real one. Written down so a later card cannot
 * quietly add one.
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** The three accounts every user can have. */
export type WalletAccountKind = 'real' | 'token' | 'bonus';

export const WALLET_ACCOUNT_KINDS: readonly WalletAccountKind[] = ['real', 'token', 'bonus'];

export interface WalletAccountAttributes {
  id: string;
  user_id: number;
  kind: WalletAccountKind;
  /** Integer tiyin for `real`; whole units for `token` / `bonus`. Never negative. */
  balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface WalletAccountCreationAttributes
  extends Optional<WalletAccountAttributes, 'id' | 'balance' | 'created_at' | 'updated_at'> {}

export class WalletAccount
  extends Model<WalletAccountAttributes, WalletAccountCreationAttributes>
  implements WalletAccountAttributes
{
  declare id: string;
  declare user_id: number;
  declare kind: WalletAccountKind;
  declare balance: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initWalletAccount(sequelize: Sequelize) {
  WalletAccount.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      kind: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          isIn: [[...WALLET_ACCOUNT_KINDS]]
        }
      },
      balance: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
        // 🔴 node-postgres returns BIGINT (int8) as a STRING so a 64-bit value
        // cannot silently lose precision in a JS number. That means an
        // un-normalised balance would do `'100' + 50 === '10050'` — the exact
        // trap that bit T-077 with DECIMAL. Normalising in the getter kills the
        // whole class of bug at the source rather than at each call site.
        // Safe: the largest realistic balance is ~1e12 tiyin, and
        // Number.MAX_SAFE_INTEGER is ~9e15.
        get(this: WalletAccount): number {
          const raw = this.getDataValue('balance') as unknown;
          return typeof raw === 'number' ? raw : Number(raw ?? 0);
        }
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    },
    {
      sequelize,
      tableName: 'wallet_accounts',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['user_id', 'kind'],
          unique: true,
          name: 'uq_wallet_accounts_user_kind'
        }
      ]
    }
  );

  return WalletAccount;
}

export default WalletAccount;
