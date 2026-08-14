'use strict';

/**
 * T-087 — the three accounts (real / token / bonus) and the append-only ledger
 * under them. The first money layer in this project: before this there was no
 * account, no balance and no transaction anywhere.
 *
 * 🔴 MONEY IS INTEGER TIYIN (BIGINT), NOT DECIMAL SO'M.
 * Paynet types the balance `long` and labels it "тийин"; their sample
 * `"amount": 100000` is 1 000 so'm (see docs/PAYNET.md §6). A decimal-so'm
 * ledger facing an integer-tiyin counterparty turns every call into a ×100
 * conversion, and a conversion bug inside a payment endpoint is silent and
 * expensive. Integer tiyin also removes rounding entirely, and avoids the
 * DECIMAL-comes-back-as-a-string trap that bit T-077.
 * ⚠️ Ride prices stay DECIMAL(10,2) so'm — a different concern with a different
 * counterparty. The two conventions must meet in exactly ONE converter.
 *
 * 🔴 THE LEDGER IS APPEND-ONLY. Nothing ever updates or deletes a row here.
 * A correction is a NEW row with the negated amount and `reverses_id` pointing
 * at the row it corrects. This is what the owner actually asked for — "qayta
 * hisob kitob yoki qaytarish" is impossible on a mutable balance column — and
 * it is what lets Paynet's error 77 ("insufficient funds to cancel the
 * payment") be answered at all.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallet_accounts', {
      id: {
        type: Sequelize.UUID,
        // uuid_generate_v4(), not gen_random_uuid(): the "uuid-ossp" extension
        // is created by 20250118000001 and every UUID pk in this schema uses it.
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      // STRING(10), not a PG enum — the same choice `payment_type`,
      // `vehicle_class` and `salon_scope` made, and the reason those cards
      // stayed cheap. Values: 'real' | 'token' | 'bonus'.
      kind: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      // A CACHE of the sum of this account's entries, not the truth. The
      // entries are the truth; step 6's reconciliation proves they agree.
      balance: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addIndex('wallet_accounts', ['user_id', 'kind'], {
      unique: true,
      name: 'uq_wallet_accounts_user_kind'
    });

    await queryInterface.addConstraint('wallet_accounts', {
      type: 'check',
      fields: ['kind'],
      name: 'chk_wallet_accounts_kind',
      where: { kind: ['real', 'token', 'bonus'] }
    });

    // The last line of defence against a double spend. The service checks the
    // balance under a row lock; if that check is ever wrong, this makes the
    // write FAIL LOUDLY instead of quietly going negative.
    await queryInterface.sequelize.query(
      'ALTER TABLE wallet_accounts ADD CONSTRAINT chk_wallet_accounts_balance_non_negative CHECK (balance >= 0)'
    );

    await queryInterface.createTable('wallet_transactions', {
      // BIGSERIAL, not UUID, ON PURPOSE: Paynet's `providerTrnId` is the id WE
      // mint and they quote back at us, and their samples show a NUMBER
      // (`"providerTrnId": 2323`). Reusing the primary key means T-088 needs no
      // second identity column and no second thing to keep unique.
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'wallet_accounts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      // SIGNED: negative is a debit, so the sum of the entries IS the balance
      // and reconciliation is one GROUP BY. The alternative — a `direction`
      // column with positive amounts — makes every balance query a CASE
      // expression and gives two ways to write the same fact.
      amount: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      // The account balance immediately after this entry. Makes every row
      // self-verifying; only correct because writes are serialised by the row
      // lock the service takes.
      balance_after: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      reason: {
        type: Sequelize.STRING(40),
        allowNull: false
      },
      // WHO caused this, and THROUGH WHAT — the owner asked for this twice:
      // "kim orqali o'zgartirilgani".
      actor_type: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      actor_admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'admin_users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      actor_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      provider: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      // The PROVIDER'S id for this payment (Paynet's `transactionId`). This is
      // the idempotency key — see the partial unique index below.
      external_id: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      reverses_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'wallet_transactions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      meta: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });

    // A zero-amount entry is always a bug: it moves nothing and pollutes the
    // statement Paynet reconciles against.
    await queryInterface.sequelize.query(
      'ALTER TABLE wallet_transactions ADD CONSTRAINT chk_wallet_transactions_amount_nonzero CHECK (amount <> 0)'
    );

    await queryInterface.addConstraint('wallet_transactions', {
      type: 'check',
      fields: ['actor_type'],
      name: 'chk_wallet_transactions_actor_type',
      where: { actor_type: ['system', 'admin', 'provider', 'user'] }
    });

    // 🔴 THE IDEMPOTENCY GUARANTEE. Providers retry — all of them do — and
    // without this a retried callback credits twice and has to be unpicked by
    // hand against real balances. Paynet's error 201 ("транзакция уже
    // существует") is the mandated answer to a repeat; this index is what makes
    // that answer possible. It CANNOT be added safely after the fact.
    // Partial, because entries with no provider (bonuses, referrals) are all
    // NULL and must not collide with each other.
    await queryInterface.addIndex('wallet_transactions', ['provider', 'external_id'], {
      unique: true,
      name: 'uq_wallet_transactions_provider_external',
      where: { external_id: { [Sequelize.Op.ne]: null } }
    });

    // A user's own statement, newest first.
    await queryInterface.addIndex('wallet_transactions', ['account_id', 'created_at'], {
      name: 'idx_wallet_transactions_account_created'
    });

    // GetStatement is a date-range query across ALL accounts, and Paynet runs
    // it daily under a 500 ms budget.
    await queryInterface.addIndex('wallet_transactions', ['created_at'], {
      name: 'idx_wallet_transactions_created_at'
    });
  },

  async down(queryInterface) {
    // wallet_transactions first: it references wallet_accounts.
    await queryInterface.dropTable('wallet_transactions');
    await queryInterface.dropTable('wallet_accounts');
  }
};
