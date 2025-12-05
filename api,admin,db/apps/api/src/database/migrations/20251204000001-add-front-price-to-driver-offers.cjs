/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

/**
 * Add optional front seat price column to driver_offers
 *
 * This migration is safe to run on existing databases where the
 * driver_offers table already exists.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists to make migration idempotent
    const tableDefinition = await queryInterface.describeTable('driver_offers');

    if (!tableDefinition.front_price_per_seat) {
      await queryInterface.addColumn('driver_offers', 'front_price_per_seat', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('driver_offers');

    if (tableDefinition.front_price_per_seat) {
      await queryInterface.removeColumn('driver_offers', 'front_price_per_seat');
    }
  },
};


