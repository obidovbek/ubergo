'use strict';

/**
 * T-091 — the user's OWN promo code and username.
 *
 * 🔴 THIS DOES NOT TOUCH `users.promo_code`, AND THAT IS THE WHOLE POINT.
 * `promo_code` already exists and means the OPPOSITE of what this card adds.
 * Migration 20260802000002 spells it out: there are three alternative ways for
 * a new user to name WHOEVER INVITED THEM — phone, user id, promo code — stored
 * in `referral_phone`, `referral_id` and `promo_code`. The app enforces exactly
 * one of the three (UserDetailsScreen:348-360). So `promo_code` holds SOMEBODY
 * ELSE'S code.
 *
 * `own_promo_code` is the code this user OWNS and hands out. Merging the two
 * would equate "the code I typed in" with "the code I own" — the
 * departs_when_full / is_urgent mistake from the 2026-08-13 meaning review, but
 * with money attached: T-089's payout would credit the wrong person.
 *
 * 🔴 CITEXT, not TEXT. These are strings people read off a screen and re-type,
 * so `ABC12` and `abc12` must be the SAME code. Case-insensitivity has to live
 * in the column — doing it with LOWER() in application code loses the race
 * between the check and the insert. `phone_e164` and `email` already use CITEXT
 * for exactly this reason; the extension is created by 20250118000001.
 *
 * 🔴 ATOMIC, per T-095 — the rule T-087's half-applied migration produced.
 * Postgres has transactional DDL, so a failure leaves the database untouched
 * instead of half-built with no SequelizeMeta row.
 *
 * Both columns are nullable: every existing user has neither, and NULL says
 * "not chosen" honestly. Partial unique indexes so those NULLs never collide.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable('users');

      // Re-runnable, following 20260802000002's precedent: a half-applied
      // migration should never block a retry.
      if (!table.own_promo_code) {
        await queryInterface.addColumn(
          'users',
          'own_promo_code',
          { type: 'CITEXT', allowNull: true },
          { transaction }
        );
      }

      if (!table.username) {
        await queryInterface.addColumn(
          'users',
          'username',
          { type: 'CITEXT', allowNull: true },
          { transaction }
        );
      }

      // Partial: only rows that actually claimed one participate. Postgres
      // treats NULLs as distinct so a plain unique index would also work, but
      // being explicit is what T-087's NULL-semantics near-miss taught.
      await queryInterface.addIndex('users', ['own_promo_code'], {
        unique: true,
        name: 'uq_users_own_promo_code',
        where: { own_promo_code: { [Sequelize.Op.ne]: null } },
        transaction
      });

      await queryInterface.addIndex('users', ['username'], {
        unique: true,
        name: 'uq_users_username',
        where: { username: { [Sequelize.Op.ne]: null } },
        transaction
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const table = await queryInterface.describeTable('users');

      if (table.username) {
        await queryInterface.removeColumn('users', 'username', { transaction });
      }
      if (table.own_promo_code) {
        await queryInterface.removeColumn('users', 'own_promo_code', { transaction });
      }
    });
  }
};
