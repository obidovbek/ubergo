'use strict';

/**
 * Owner decisions of 2026-08-02, taken after the driver-connection review.
 *
 * 1. `passenger_offers.status` gains 'driver_found'. Confirming a driver used to
 *    jump the offer straight to 'completed' — the trip was marked finished
 *    before anyone had travelled, and the losing drivers were left pending
 *    forever. 'driver_found' is now the state between "a driver was picked" and
 *    "the ride happened"; 'completed' keeps its literal meaning.
 *
 * 2. `users.language` stores the person's own language. Push notifications were
 *    built from the Accept-Language of whoever pressed the button, so a driver
 *    on a Russian phone made the passenger's Uzbek phone buzz in Russian. There
 *    was nowhere to look the recipient's language up; now there is.
 *
 * Additive only — no column is dropped or renamed, and old app builds are
 * unaffected (they simply never see 'driver_found' because no offer reaches it
 * until the new API is deployed).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Postgres enum values cannot be added inside an explicit transaction on
    // older servers; IF NOT EXISTS keeps the migration re-runnable either way.
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_passenger_offers_status\" ADD VALUE IF NOT EXISTS 'driver_found'"
    );

    await queryInterface.addColumn('users', 'language', {
      type: Sequelize.STRING(5),
      allowNull: true,
      comment: "The person's own UI language (uz|ru|en) — used for push and SMS"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'language');

    // Postgres cannot remove a single value from an enum type. Rolling this
    // back means rebuilding the type, which would rewrite a live column, so the
    // value is deliberately left in place — it is inert once nothing writes it.
  }
};
