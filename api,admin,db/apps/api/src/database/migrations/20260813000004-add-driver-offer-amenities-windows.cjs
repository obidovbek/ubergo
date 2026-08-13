'use strict';

/**
 * T-079 + T-080 — the rest of the `D_Elon berish` mockup: what the car offers,
 * what it will carry, and when it actually leaves and arrives.
 *
 * ⚠️ **Two cards, ONE migration, deliberately.** Both add columns to
 * `driver_offers`, both are edited on the same screen and both ship in the same
 * driver rebuild. The owner already has three unrun migrations; splitting these
 * would make five with no benefit to either.
 *
 * ⚠️ Names mirror `PassengerOffer` wherever the concept already exists there —
 * `roof_rack_needed`, `trailer`, `road_pickup`, `road_pickup_note`,
 * `depart_until`, `arrive_from`, `arrive_until` — so the two halves of one
 * product stay comparable.
 *
 * 🔴 **`departs_when_full` is NOT `is_urgent`, and that is the whole point.**
 * The passenger's `is_urgent` means *"I want to leave now"* and literally sets
 * `start_at = now`. The driver's *"hozioq (to'lishi bilan yuraman)"* means
 * *"I leave when the car fills up"* — owner-confirmed 2026-08-13. Mirroring the
 * name would have equated two different facts, so it gets its own.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const flag = {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    };

    // ── T-079: what the car offers ──────────────────────────────────────
    // These default to `false` rather than NULL — unlike T-078's payment
    // flags — because "no air conditioner" is a safe, honest default for an
    // offer created before the field existed, whereas "refuses cash" was not.
    await queryInterface.addColumn('driver_offers', 'air_conditioner', flag);
    await queryInterface.addColumn('driver_offers', 'wifi', flag);
    await queryInterface.addColumn('driver_offers', 'roof_rack_needed', flag);
    await queryInterface.addColumn('driver_offers', 'trailer', flag);

    // ── T-079: Jo'natma (pochta) ────────────────────────────────────────
    await queryInterface.addColumn('driver_offers', 'parcel_accepted', flag);
    await queryInterface.addColumn('driver_offers', 'parcel_price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    // The mockup writes "(20kgacha)" — the limit is the driver's, not a constant.
    await queryInterface.addColumn('driver_offers', 'parcel_max_kg', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // ── T-079: "Faqat pitakdan yoki yo'lga chiqib tursa olaman" ──────────
    await queryInterface.addColumn('driver_offers', 'road_pickup', flag);
    await queryInterface.addColumn('driver_offers', 'road_pickup_note', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // ── T-080: the windows ──────────────────────────────────────────────
    // `start_at` already exists and is the window's START.
    for (const column of ['depart_until', 'arrive_from', 'arrive_until']) {
      await queryInterface.addColumn('driver_offers', column, {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    // ── T-080: "hozioq (to'lishi bilan yuraman)" ────────────────────────
    await queryInterface.addColumn('driver_offers', 'departs_when_full', flag);
  },

  async down(queryInterface) {
    for (const column of [
      'air_conditioner',
      'wifi',
      'roof_rack_needed',
      'trailer',
      'parcel_accepted',
      'parcel_price',
      'parcel_max_kg',
      'road_pickup',
      'road_pickup_note',
      'depart_until',
      'arrive_from',
      'arrive_until',
      'departs_when_full'
    ]) {
      await queryInterface.removeColumn('driver_offers', column);
    }
  }
};
