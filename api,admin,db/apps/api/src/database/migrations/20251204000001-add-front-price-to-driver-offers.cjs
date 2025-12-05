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
    // Check if driver_offers table exists
    const [results] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'driver_offers'
      );
    `);
    
    const tableExists = results[0].exists;
    
    // If table doesn't exist, skip this migration
    // The create migration will create it with the column directly
    if (!tableExists) {
      console.log('driver_offers table does not exist yet, skipping front_price_per_seat migration');
      return;
    }

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
    // Check if driver_offers table exists
    const [results] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'driver_offers'
      );
    `);
    
    const tableExists = results[0].exists;
    
    // If table doesn't exist, skip this migration
    if (!tableExists) {
      console.log('driver_offers table does not exist, skipping front_price_per_seat rollback migration');
      return;
    }

    const tableDefinition = await queryInterface.describeTable('driver_offers');

    if (tableDefinition.front_price_per_seat) {
      await queryInterface.removeColumn('driver_offers', 'front_price_per_seat');
    }
  },
};


