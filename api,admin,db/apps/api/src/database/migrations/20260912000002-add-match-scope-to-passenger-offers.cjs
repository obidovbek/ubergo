'use strict';

/**
 * T-102 — remember which of the four scopes an order was placed with.
 *
 * 🔴 THE SCOPE IS STORED, NOT THE MATCH LEVEL, AND THAT IS THE WHOLE POINT OF THIS COLUMN.
 * `aro` and `viloyat` BOTH match at adm2, and `tuman` and `yaqin` both match at adm3 — so a
 * stored level would be a one-way door: two different orders would become indistinguishable
 * and could never be told apart again, not by a report, not by a support question, not by a
 * later feature. The level is derived from the scope (`matchLevelFor`), never the reverse.
 *
 * ⚠️ NULLABLE with no default. An order created before T-102 genuinely did not choose a scope,
 * and inventing `'aro'` for it would be a lie the data can never be cleaned of. The service
 * treats NULL as "pre-T-102" and falls back to the old text search for that row.
 *
 * ⚠️ A real ENUM rather than a free string: these four values are a closed set the owner
 * defined, and a typo reaching the column would be found months later by someone wondering why
 * one order never matches.
 *
 * @type {import('sequelize-cli').Migration}
 */

const SCOPES = ['aro', 'viloyat', 'tuman', 'yaqin'];
const ENUM_NAME = 'enum_passenger_offers_match_scope';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('passenger_offers', 'match_scope', {
      type: Sequelize.ENUM(...SCOPES),
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('passenger_offers', 'match_scope');
    // Postgres keeps the enum type behind after the column goes; drop it or a re-run fails.
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUM_NAME}";`);
  }
};
