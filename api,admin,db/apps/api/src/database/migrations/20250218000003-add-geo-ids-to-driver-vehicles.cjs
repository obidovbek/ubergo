'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('driver_vehicles');
    
    // Add owner_address_country_id if it doesn't exist
    if (!tableDescription.owner_address_country_id) {
      await queryInterface.addColumn('driver_vehicles', 'owner_address_country_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_countries', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_vehicles', ['owner_address_country_id'], {
          name: 'idx_driver_vehicles_owner_address_country_id'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Add owner_address_province_id if it doesn't exist
    if (!tableDescription.owner_address_province_id) {
      await queryInterface.addColumn('driver_vehicles', 'owner_address_province_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_provinces', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_vehicles', ['owner_address_province_id'], {
          name: 'idx_driver_vehicles_owner_address_province_id'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Add owner_address_city_district_id if it doesn't exist
    if (!tableDescription.owner_address_city_district_id) {
      await queryInterface.addColumn('driver_vehicles', 'owner_address_city_district_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_city_districts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_vehicles', ['owner_address_city_district_id'], {
          name: 'idx_driver_vehicles_owner_address_city_district_id'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Add owner_address_administrative_area_id if it doesn't exist
    if (!tableDescription.owner_address_administrative_area_id) {
      await queryInterface.addColumn('driver_vehicles', 'owner_address_administrative_area_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_administrative_areas', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_vehicles', ['owner_address_administrative_area_id'], {
          name: 'idx_driver_vehicles_owner_address_administrative_area_id'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Add owner_address_settlement_id if it doesn't exist
    if (!tableDescription.owner_address_settlement_id) {
      await queryInterface.addColumn('driver_vehicles', 'owner_address_settlement_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_settlements', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_vehicles', ['owner_address_settlement_id'], {
          name: 'idx_driver_vehicles_owner_address_settlement_id'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Add owner_address_neighborhood_id if it doesn't exist
    if (!tableDescription.owner_address_neighborhood_id) {
      await queryInterface.addColumn('driver_vehicles', 'owner_address_neighborhood_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'geo_neighborhoods', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      try {
        await queryInterface.addIndex('driver_vehicles', ['owner_address_neighborhood_id'], {
          name: 'idx_driver_vehicles_owner_address_neighborhood_id'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // Note: We keep the old string columns (owner_address_country, owner_address_region, etc.) 
    // for backward compatibility. They can be removed in a future migration after data migration is complete.
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('driver_vehicles');
    
    if (tableDescription.owner_address_neighborhood_id) {
      try {
        await queryInterface.removeIndex('driver_vehicles', 'idx_driver_vehicles_owner_address_neighborhood_id');
      } catch (error) {
        // Index might not exist, ignore
      }
      await queryInterface.removeColumn('driver_vehicles', 'owner_address_neighborhood_id');
    }
    
    if (tableDescription.owner_address_settlement_id) {
      try {
        await queryInterface.removeIndex('driver_vehicles', 'idx_driver_vehicles_owner_address_settlement_id');
      } catch (error) {
        // Index might not exist, ignore
      }
      await queryInterface.removeColumn('driver_vehicles', 'owner_address_settlement_id');
    }
    
    if (tableDescription.owner_address_administrative_area_id) {
      try {
        await queryInterface.removeIndex('driver_vehicles', 'idx_driver_vehicles_owner_address_administrative_area_id');
      } catch (error) {
        // Index might not exist, ignore
      }
      await queryInterface.removeColumn('driver_vehicles', 'owner_address_administrative_area_id');
    }
    
    if (tableDescription.owner_address_city_district_id) {
      try {
        await queryInterface.removeIndex('driver_vehicles', 'idx_driver_vehicles_owner_address_city_district_id');
      } catch (error) {
        // Index might not exist, ignore
      }
      await queryInterface.removeColumn('driver_vehicles', 'owner_address_city_district_id');
    }
    
    if (tableDescription.owner_address_province_id) {
      try {
        await queryInterface.removeIndex('driver_vehicles', 'idx_driver_vehicles_owner_address_province_id');
      } catch (error) {
        // Index might not exist, ignore
      }
      await queryInterface.removeColumn('driver_vehicles', 'owner_address_province_id');
    }
    
    if (tableDescription.owner_address_country_id) {
      try {
        await queryInterface.removeIndex('driver_vehicles', 'idx_driver_vehicles_owner_address_country_id');
      } catch (error) {
        // Index might not exist, ignore
      }
      await queryInterface.removeColumn('driver_vehicles', 'owner_address_country_id');
    }
  }
};

