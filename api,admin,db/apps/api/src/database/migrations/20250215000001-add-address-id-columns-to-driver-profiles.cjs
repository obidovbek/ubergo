'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns exist and add them if they don't
    const tableDescription = await queryInterface.describeTable('driver_profiles');
    
    // Add address_country_id if it doesn't exist
    if (!tableDescription.address_country_id) {
      await queryInterface.addColumn('driver_profiles', 'address_country_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_countries', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_profiles', ['address_country_id'], {
          name: 'idx_driver_profiles_address_country_id'
        });
      } catch (error) {
        // Index might already exist, ignore error
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Add address_province_id if it doesn't exist
    if (!tableDescription.address_province_id) {
      await queryInterface.addColumn('driver_profiles', 'address_province_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_provinces', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_profiles', ['address_province_id'], {
          name: 'idx_driver_profiles_address_province_id'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Add address_city_district_id if it doesn't exist
    if (!tableDescription.address_city_district_id) {
      await queryInterface.addColumn('driver_profiles', 'address_city_district_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_city_districts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_profiles', ['address_city_district_id'], {
          name: 'idx_driver_profiles_address_city_district_id'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Add address_administrative_area_id if it doesn't exist
    if (!tableDescription.address_administrative_area_id) {
      await queryInterface.addColumn('driver_profiles', 'address_administrative_area_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_administrative_areas', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_profiles', ['address_administrative_area_id'], {
          name: 'idx_driver_profiles_address_administrative_area_id'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Add address_settlement_id if it doesn't exist
    if (!tableDescription.address_settlement_id) {
      await queryInterface.addColumn('driver_profiles', 'address_settlement_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_settlements', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_profiles', ['address_settlement_id'], {
          name: 'idx_driver_profiles_address_settlement_id'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Add address_neighborhood_id if it doesn't exist
    if (!tableDescription.address_neighborhood_id) {
      await queryInterface.addColumn('driver_profiles', 'address_neighborhood_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_neighborhoods', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_profiles', ['address_neighborhood_id'], {
          name: 'idx_driver_profiles_address_neighborhood_id'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the columns if they exist
    const tableDescription = await queryInterface.describeTable('driver_profiles');
    
    if (tableDescription.address_neighborhood_id) {
      await queryInterface.removeIndex('driver_profiles', 'idx_driver_profiles_address_neighborhood_id');
      await queryInterface.removeColumn('driver_profiles', 'address_neighborhood_id');
    }
    
    if (tableDescription.address_settlement_id) {
      await queryInterface.removeIndex('driver_profiles', 'idx_driver_profiles_address_settlement_id');
      await queryInterface.removeColumn('driver_profiles', 'address_settlement_id');
    }
    
    if (tableDescription.address_administrative_area_id) {
      await queryInterface.removeIndex('driver_profiles', 'idx_driver_profiles_address_administrative_area_id');
      await queryInterface.removeColumn('driver_profiles', 'address_administrative_area_id');
    }
    
    if (tableDescription.address_city_district_id) {
      await queryInterface.removeIndex('driver_profiles', 'idx_driver_profiles_address_city_district_id');
      await queryInterface.removeColumn('driver_profiles', 'address_city_district_id');
    }
    
    if (tableDescription.address_province_id) {
      await queryInterface.removeIndex('driver_profiles', 'idx_driver_profiles_address_province_id');
      await queryInterface.removeColumn('driver_profiles', 'address_province_id');
    }
    
    if (tableDescription.address_country_id) {
      await queryInterface.removeIndex('driver_profiles', 'idx_driver_profiles_address_country_id');
      await queryInterface.removeColumn('driver_profiles', 'address_country_id');
    }
  }
};

