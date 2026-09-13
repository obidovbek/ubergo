'use strict';

/**
 * T-102 — which districts border which. The data behind the owner's `Yaqin` scope.
 *
 * Owner, 2026-08-30: *"'Yaqin' means two bordering districts is a neighbours table."*
 * Adjacency is EXPLICIT DATA, not a computed radius and not "same province" — the right call
 * for this geography, where a centroid-distance rule would call two districts separated by a
 * mountain range neighbours, and "same province" is not bordering at all.
 *
 * 🔴 ADJACENCY IS SYMMETRIC AND POSTGRES WILL NOT ENFORCE IT FOR YOU. A half-populated
 * symmetric table means A finds B but B does not find A, which presents as "the search works
 * sometimes" — the worst kind of bug to chase.
 * **THE DECISION, MADE ONCE, HERE: BOTH ROWS ARE STORED ON EVERY INSERT.** The alternative
 * (one row plus `CHECK (a < b)` and a `UNION` on every read) pushes the burden onto every
 * future query, where forgetting it is silent. Writing two rows is the admin screen's job and
 * it does it in one transaction.
 *
 * 🔴 `CHECK (city_district_id <> neighbor_city_district_id)` — a district must never be its own
 * neighbour, or `Yaqin` silently degenerates into `Tuman ichi`.
 *
 * ⚠️ **UNTIL THIS TABLE HAS ROWS, `Yaqin` OFFERS NO DESTINATIONS.** That is correct behaviour,
 * not a bug: the picker shows an honest empty state at creation time rather than the search
 * returning nothing later. ~200 districts to populate through the admin screen (T-102f).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('geo_district_neighbors', {
      city_district_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        references: { model: 'geo_city_districts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      neighbor_city_district_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        references: { model: 'geo_city_districts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "geo_district_neighbors" ' +
        'ADD CONSTRAINT "geo_district_neighbors_not_self" ' +
        'CHECK ("city_district_id" <> "neighbor_city_district_id");'
    );

    // The read is always "who borders X", so the leading column is the lookup key. The PK
    // already covers it; this second index serves the reverse lookup used when an admin
    // removes a pairing and both rows must be found.
    await queryInterface.addIndex('geo_district_neighbors', ['neighbor_city_district_id'], {
      name: 'geo_district_neighbors_neighbor_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('geo_district_neighbors');
  }
};
