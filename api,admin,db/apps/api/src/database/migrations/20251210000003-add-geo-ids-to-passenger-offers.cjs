'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add geo ID columns to passenger_offers table
    await queryInterface.addColumn('passenger_offers', 'from_country_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'geo_countries', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addColumn('passenger_offers', 'from_province_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'geo_provinces', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addColumn('passenger_offers', 'from_city_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'geo_city_districts', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addColumn('passenger_offers', 'to_country_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'geo_countries', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addColumn('passenger_offers', 'to_province_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'geo_provinces', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addColumn('passenger_offers', 'to_city_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'geo_city_districts', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Create indexes for geo IDs
    await queryInterface.addIndex('passenger_offers', ['from_country_id'], {
      name: 'idx_passenger_offers_from_country_id'
    });
    await queryInterface.addIndex('passenger_offers', ['from_province_id'], {
      name: 'idx_passenger_offers_from_province_id'
    });
    await queryInterface.addIndex('passenger_offers', ['from_city_id'], {
      name: 'idx_passenger_offers_from_city_id'
    });
    await queryInterface.addIndex('passenger_offers', ['to_country_id'], {
      name: 'idx_passenger_offers_to_country_id'
    });
    await queryInterface.addIndex('passenger_offers', ['to_province_id'], {
      name: 'idx_passenger_offers_to_province_id'
    });
    await queryInterface.addIndex('passenger_offers', ['to_city_id'], {
      name: 'idx_passenger_offers_to_city_id'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('passenger_offers', 'idx_passenger_offers_from_country_id');
    await queryInterface.removeIndex('passenger_offers', 'idx_passenger_offers_from_province_id');
    await queryInterface.removeIndex('passenger_offers', 'idx_passenger_offers_from_city_id');
    await queryInterface.removeIndex('passenger_offers', 'idx_passenger_offers_to_country_id');
    await queryInterface.removeIndex('passenger_offers', 'idx_passenger_offers_to_province_id');
    await queryInterface.removeIndex('passenger_offers', 'idx_passenger_offers_to_city_id');

    // Remove columns
    await queryInterface.removeColumn('passenger_offers', 'from_country_id');
    await queryInterface.removeColumn('passenger_offers', 'from_province_id');
    await queryInterface.removeColumn('passenger_offers', 'from_city_id');
    await queryInterface.removeColumn('passenger_offers', 'to_country_id');
    await queryInterface.removeColumn('passenger_offers', 'to_province_id');
    await queryInterface.removeColumn('passenger_offers', 'to_city_id');
  }
};

