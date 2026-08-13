'use strict';

/**
 * T-031 items 5-6 — payment becomes independent flags.
 *
 * Owner, 2026-08-13: *"Do'stimga degani alohida punkt. Do'stimgani tanlasa naqd
 * payme deganni tanlab bo'lmayapdi. Naqd, click payme ikkalasini ham tanlasa
 * bo'ladi degani."*
 *
 * `payment_type` holds ONE value, so the three checkboxes behaved as a radio
 * group: choosing "Do'stimga" cleared "Naqd", and cash+card could never both be
 * on. Three booleans replace it.
 *
 * ⚠️ `payment_type` is deliberately KEPT and still written by the API for one
 * release. Old installed app builds still send and read it, and the board
 * carries a long tail of un-rebuilt apps — dropping the column here would make
 * those installs lose the payment method silently. Remove it in a later card,
 * once the rebuilds have landed.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('passenger_offers', 'payment_cash', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('passenger_offers', 'payment_card', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('passenger_offers', 'paid_by_friend', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    /*
     * Backfill from the single enum so existing rows keep their meaning.
     * Without this, every offer already in the DB would read as "no payment
     * method chosen" the moment the new app build starts reading the flags.
     */
    await queryInterface.sequelize.query(`
      UPDATE passenger_offers
         SET payment_cash   = (payment_type = 'cash'),
             payment_card   = (payment_type = 'click_payme'),
             paid_by_friend = (payment_type = 'friend_pays')
       WHERE payment_type IS NOT NULL
    `);

    const [[{ count }]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*)::int AS count FROM passenger_offers WHERE payment_type IS NOT NULL`
    );
    // Printed because this DB is not reachable from the dev machine, so the
    // row count could not be gathered in advance (the T-046 precedent).
    console.log(`[T-031] backfilled payment flags for ${count} passenger offer(s)`);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('passenger_offers', 'payment_cash');
    await queryInterface.removeColumn('passenger_offers', 'payment_card');
    await queryInterface.removeColumn('passenger_offers', 'paid_by_friend');
  }
};
