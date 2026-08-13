'use strict';

/**
 * T-081 — a passenger can book a SALON, not only single seats.
 *
 * T-078 gave the driver `price_back_salon` and `price_whole_salon`, but
 * `offer_passengers` could only ever say "N seats, front or not" — so those
 * prices were write-only and no passenger could buy one.
 *
 * ✅ **One column, not a table.** The seat arithmetic maps onto columns that
 * already exist:
 *   back_salon_full → seats_requested = the back seats, is_front_seat = false
 *   whole_salon     → seats_requested = seats_total,    is_front_seat = true
 * so `seats_free` accounting, the "only one front seat" rule and the
 * cancel/restore path all keep working untouched. This column records only
 * **what was bought**, for price provenance and for display.
 *
 * ⚠️ Vocabulary reused from `PassengerOfferSalonScope`
 * (`'whole_salon' | 'back_salon_full'`) so the two halves of one concept stay
 * comparable.
 *
 * 🔴 No backfill: every existing booking genuinely IS a per-seat one, and NULL
 * says exactly that.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('offer_passengers', 'salon_scope', {
      // STRING(20), not a PG enum — the same choice `payment_type` and
      // `vehicle_class` made, and the reason those cards stayed cheap.
      type: Sequelize.STRING(20),
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('offer_passengers', 'salon_scope');
  }
};
