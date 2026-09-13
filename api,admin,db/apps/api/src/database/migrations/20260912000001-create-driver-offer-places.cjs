'use strict';

/**
 * T-102 — WHERE a driver's offer picks up and drops off, as geo ids, so it can be MATCHED
 * instead of text-searched.
 *
 * 🔴 A CHILD TABLE, NOT EIGHT COLUMNS — AND THIS FILE REPLACES A MIGRATION THAT HAD EIGHT.
 * The first draft (2026-09-12, never run) mirrored `passenger_offers` field for field: one
 * `from_city_id`, one `to_city_id`, and so on. Then the driver artboard was measured
 * (`DriverElon.dc.html`, `toggleAdm2` / `toggleAdm3`): a driver picks ONE province and then
 * a SET of districts and a SET of QFYs per direction — the sample offer leaves from
 * *Farg'ona t.* OR *Marg'ilon sh.* A scalar column can hold one of those. The passenger's
 * order stays a single path (all four `UserBuyurtma*` boards single-select), which is why
 * `passenger_offers` keeps its columns and `driver_offers` gets rows instead.
 *
 * ONE ROW PER SELECTED PLACE, and the rule for what a row is:
 *   • a district chosen with no QFY        → one row, `settlement_id` NULL
 *   • a district chosen with QFYs A and B  → two rows, each carrying the district
 * So adm2 matching is "the order's city is among this direction's `city_id`s", and adm3
 * matching is the same over `settlement_id`. A NULL settlement row means "anywhere in this
 * district" — that is the driver's statement, and it is what the loose rule in
 * `utils/geoMatch.ts` reads.
 *
 * ⚠️ `from_text` / `to_text` on `driver_offers` are KEPT: the app displays them, an old client
 * still sends them, and an offer with no rows here falls back to the text search.
 *
 * ⚠️ `ON DELETE CASCADE` from the offer — a place has no meaning without its offer — but
 * `SET NULL` from the geo tables, mirroring `passenger_offers`: deleting a district in the
 * admin panel must not delete drivers' offers.
 *
 * @type {import('sequelize-cli').Migration}
 */

const GEO = [
  ['country_id', 'geo_countries'],
  ['province_id', 'geo_provinces'],
  ['city_id', 'geo_city_districts'],
  ['settlement_id', 'geo_settlements']
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const geoColumns = {};
    for (const [name, table] of GEO) {
      geoColumns[name] = {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: table, key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      };
    }

    await queryInterface.createTable('driver_offer_places', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      offer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'driver_offers', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      direction: {
        type: Sequelize.ENUM('from', 'to'),
        allowNull: false
      },
      ...geoColumns,
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Reading an offer's places: always by offer, usually by direction too.
    await queryInterface.addIndex('driver_offer_places', ['offer_id', 'direction'], {
      name: 'driver_offer_places_offer_direction_idx'
    });

    // The matcher's two probes — "which offers have a FROM row in city X" and the same at adm3.
    await queryInterface.addIndex('driver_offer_places', ['direction', 'city_id'], {
      name: 'driver_offer_places_direction_city_idx'
    });
    await queryInterface.addIndex('driver_offer_places', ['direction', 'settlement_id'], {
      name: 'driver_offer_places_direction_settlement_idx'
    });

    /*
     * One place, once. A plain UNIQUE would let two `(offer, from, city X, NULL)` rows coexist,
     * because Postgres treats NULLs as distinct — so the NULL settlement is folded to 0 inside
     * the index expression. Raw SQL: Sequelize's addIndex cannot express a COALESCE.
     */
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX "driver_offer_places_unique_place" ' +
        'ON "driver_offer_places" ("offer_id", "direction", "city_id", COALESCE("settlement_id", 0));'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('driver_offer_places');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_driver_offer_places_direction";');
  }
};
