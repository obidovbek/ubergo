'use strict';

/**
 * T-078 — a driver can price a salon, a wait and a door pickup, say how they
 * take payment, and state the vehicle class.
 *
 * Owner mockup `D_Elon berish`, 2026-08-13.
 *
 * ⚠️ **Names mirror `PassengerOfferSpecialOrder`** (`price_back_salon`,
 * `price_whole_salon`, `waiting_fee_per_min`, `free_waiting_min`) so the two
 * halves of one concept stay joinable — but the STORAGE deliberately does not:
 * the passenger keeps them inside a JSONB `special_order` because they are an
 * optional extra there, whereas on the driver's offer they are the core product
 * (filtered, sorted and shown to every passenger). Real DECIMAL columns, matching
 * `price_per_seat` / `front_price_per_seat` on this same table.
 *
 * ⚠️ **`vehicle_class` is STRING(20), not a PG enum** — the same choice
 * `payment_type` made on `passenger_offers`, and the reason T-031's split was
 * cheap on 2026-08-13. An enum here would need a migration to add a class.
 *
 * 🔴 **Nothing is backfilled.** An existing offer genuinely has no salon price,
 * and inventing one would put a number in front of a passenger that the driver
 * never agreed to.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const money = { type: Sequelize.DECIMAL(10, 2), allowNull: true };

    // ── Prices (Narxlar) ────────────────────────────────────────────────
    // `price_per_seat` = Orqa o'rindiq and `front_price_per_seat` = Old
    // o'rindiq already exist and are live — deliberately NOT renamed.
    await queryInterface.addColumn('driver_offers', 'price_back_salon', money);
    await queryInterface.addColumn('driver_offers', 'price_whole_salon', money);

    // ── Waiting (Kutish) ────────────────────────────────────────────────
    // 🔴 A RATE TO DISPLAY, NOT MONEY TO CHARGE (owner, 2026-08-13, confirming
    // the 2026-08-02 rule "stored but not counted"). Metering a real wait needs
    // arrival/boarding timestamps, which do not exist. No code may sum this.
    await queryInterface.addColumn('driver_offers', 'waiting_fee_per_min', money);
    await queryInterface.addColumn('driver_offers', 'free_waiting_min', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // ── Joyidan olish (door pickup) ─────────────────────────────────────
    await queryInterface.addColumn('driver_offers', 'pickup_fee', money);

    /*
     * ── Payment (To'lov turi) ───────────────────────────────────────────
     *
     * 🔴 NULLABLE, not `NOT NULL DEFAULT false` — three states, not two, which
     * is the lesson T-083 paid for hours earlier:
     *   NULL  = the driver was never asked (every offer predating this card)
     *   false = the driver said they do NOT take it
     *   true  = accepted
     * Defaulting to `false` would make every existing offer claim it refuses
     * both cash and card, which no driver ever said.
     *
     * ⚠️ This is why it differs from `passenger_offers`, where T-031 could
     * default to false because it had `payment_type` to backfill from. Here
     * there is nothing to backfill.
     */
    const flag = { type: Sequelize.BOOLEAN, allowNull: true };
    await queryInterface.addColumn('driver_offers', 'payment_cash', flag);
    await queryInterface.addColumn('driver_offers', 'payment_card', flag);

    // ── Avto sinfi ──────────────────────────────────────────────────────
    // 'standard' | 'comfort' | 'business' | 'econom' | 'tourist' — the same
    // vocabulary as `PassengerOfferVehicleClass`.
    // ⚠️ It means something DIFFERENT on each side: there, the class the
    // passenger WANTS; here, the class the driver DRIVES.
    await queryInterface.addColumn('driver_offers', 'vehicle_class', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
  },

  async down(queryInterface) {
    for (const column of [
      'price_back_salon',
      'price_whole_salon',
      'waiting_fee_per_min',
      'free_waiting_min',
      'pickup_fee',
      'payment_cash',
      'payment_card',
      'vehicle_class'
    ]) {
      await queryInterface.removeColumn('driver_offers', column);
    }
  }
};
