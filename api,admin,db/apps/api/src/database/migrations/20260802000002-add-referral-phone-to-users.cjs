'use strict';

/**
 * OR-010 items 1-2 (T-027): the "get a bonus" block on the registration form
 * lets the new user name whoever invited them. There were three ways to do that
 * in the UI — phone, user ID, promo code — but only two columns to store them:
 * `referral_id` and `promo_code`. The phone field was not a referrer field at
 * all; it displayed the registering user's OWN number, read-only, which told
 * them nothing and made the bonus impossible to claim by phone.
 *
 * This adds the missing third column. It is deliberately NOT folded into
 * `referral_id`: only one of the three may be filled (enforced in the app), but
 * a phone number sitting in a column called `referral_id` would be indistinguishable
 * from a user id to whoever writes the bonus payout logic later.
 *
 * Nullable and additive — no column is dropped or renamed, and existing rows and
 * older app builds are unaffected (they simply never send the field).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    // Re-runnable: a half-applied migration on test3 should not block a retry.
    if (!table.referral_phone) {
      await queryInterface.addColumn('users', 'referral_phone', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');

    if (table.referral_phone) {
      await queryInterface.removeColumn('users', 'referral_phone');
    }
  },
};
