'use strict';

/**
 * T-018 / OR-007 — extend passenger_offers with the fields of the new Figma
 * order screen (K_buyurtma001Yangi.png).
 *
 * Additive only: every new column is nullable or has a default, so old app
 * builds keep working. The single relaxation is max_price_per_seat, which the
 * new form does not collect at all (prices live inside the special order).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Departure / arrival windows ────────────────────────────────────────
    // start_at stays the start of the departure window.
    await queryInterface.addColumn('passenger_offers', 'is_urgent', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('passenger_offers', 'depart_until', {
      type: 'TIMESTAMPTZ',
      allowNull: true
    });
    await queryInterface.addColumn('passenger_offers', 'arrive_from', {
      type: 'TIMESTAMPTZ',
      allowNull: true
    });
    await queryInterface.addColumn('passenger_offers', 'arrive_until', {
      type: 'TIMESTAMPTZ',
      allowNull: true
    });

    // ── Route: 4th geo level + landmarks (mo'ljal) ─────────────────────────
    await queryInterface.addColumn('passenger_offers', 'from_settlement_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'geo_settlements', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    await queryInterface.addColumn('passenger_offers', 'to_settlement_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'geo_settlements', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    await queryInterface.addColumn('passenger_offers', 'from_landmark', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('passenger_offers', 'to_landmark', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    // ── Payment (To'lov turi) ──────────────────────────────────────────────
    // 'cash' | 'click_payme' | 'friend_pays' — validated in the service layer,
    // VARCHAR instead of a PG enum so adding a method needs no migration.
    await queryInterface.addColumn('passenger_offers', 'payment_type', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
    // Friend's number, may be foreign (the Figma example is +33).
    await queryInterface.addColumn('passenger_offers', 'payer_phone', {
      type: Sequelize.STRING(20),
      allowNull: true
    });

    // ── Seats ──────────────────────────────────────────────────────────────
    // { front_male, front_female, back_male, back_female } — seats_needed keeps
    // the total so the old list screens and admin panel stay correct.
    await queryInterface.addColumn('passenger_offers', 'seat_counts', {
      type: Sequelize.JSONB,
      allowNull: true
    });
    await queryInterface.addColumn('passenger_offers', 'seat_position_any', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    // 'whole_salon' | 'back_salon_full'
    await queryInterface.addColumn('passenger_offers', 'salon_scope', {
      type: Sequelize.STRING(20),
      allowNull: true
    });

    // ── Vehicle wishes ─────────────────────────────────────────────────────
    // 'standard' | 'comfort' | 'business' | 'econom' | 'tourist'
    await queryInterface.addColumn('passenger_offers', 'vehicle_class', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
    // Optional subset of ["minivan","damas","microbus"] — kept for the driver
    // side filters; the Figma folds these into the "Econom" class.
    await queryInterface.addColumn('passenger_offers', 'vehicle_types', {
      type: Sequelize.JSONB,
      allowNull: true
    });
    await queryInterface.addColumn('passenger_offers', 'woman_in_car', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('passenger_offers', 'roof_rack_needed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('passenger_offers', 'trailer', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // ── Pitak (passenger walks out to the road) ────────────────────────────
    await queryInterface.addColumn('passenger_offers', 'road_pickup', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('passenger_offers', 'road_pickup_note', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // ── Special order (data only — nothing is charged yet, see T-006) ──────
    // { price_front, price_back, price_back_salon, price_whole_salon,
    //   review_driver_offers, fixed_price, waiting_fee_per_min, free_waiting_min }
    await queryInterface.addColumn('passenger_offers', 'special_order', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    // ── Indexes for the two new FKs (Postgres does not index FKs itself) ───
    await queryInterface.addIndex('passenger_offers', ['from_settlement_id'], {
      name: 'idx_passenger_offers_from_settlement_id'
    });
    await queryInterface.addIndex('passenger_offers', ['to_settlement_id'], {
      name: 'idx_passenger_offers_to_settlement_id'
    });

    // ── The new form has no price field at all → price becomes optional ────
    await queryInterface.sequelize.query(
      'ALTER TABLE "passenger_offers" ALTER COLUMN "max_price_per_seat" DROP NOT NULL;'
    );
  },

  async down(queryInterface, Sequelize) {
    // Rows created by the new form have no price; give them 0 so NOT NULL can
    // come back, otherwise the constraint would fail.
    await queryInterface.sequelize.query(
      'UPDATE "passenger_offers" SET "max_price_per_seat" = 0 WHERE "max_price_per_seat" IS NULL;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "passenger_offers" ALTER COLUMN "max_price_per_seat" SET NOT NULL;'
    );

    await queryInterface.removeIndex('passenger_offers', 'idx_passenger_offers_from_settlement_id');
    await queryInterface.removeIndex('passenger_offers', 'idx_passenger_offers_to_settlement_id');

    const columns = [
      'special_order',
      'road_pickup_note',
      'road_pickup',
      'trailer',
      'roof_rack_needed',
      'woman_in_car',
      'vehicle_types',
      'vehicle_class',
      'salon_scope',
      'seat_position_any',
      'seat_counts',
      'payer_phone',
      'payment_type',
      'to_landmark',
      'from_landmark',
      'to_settlement_id',
      'from_settlement_id',
      'arrive_until',
      'arrive_from',
      'depart_until',
      'is_urgent'
    ];

    for (const column of columns) {
      await queryInterface.removeColumn('passenger_offers', column);
    }
  }
};
