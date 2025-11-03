'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_driver_vehicles_vehicle_type" AS ENUM ('light', 'cargo');
    `);

    // Create driver_vehicles table
    await queryInterface.createTable('driver_vehicles', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      driver_profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'driver_profiles', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      company_name: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      company_tax_id: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      owner_first_name: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      owner_last_name: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      owner_father_name: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      owner_pinfl: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      owner_address_country: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      owner_address_region: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      owner_address_city: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      owner_address_mahalla: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      owner_address_street: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vehicle_type: {
        type: 'enum_driver_vehicles_vehicle_type',
        allowNull: true
      },
      body_type: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      make: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      model: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      color: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      license_plate: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      gross_weight: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      unladen_weight: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      fuel_types: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      seating_capacity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      tech_passport_series: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tech_passport_front_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tech_passport_back_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      photo_front_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      photo_back_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      photo_right_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      photo_left_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      photo_angle_45_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      photo_interior_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex('driver_vehicles', ['driver_profile_id'], {
      unique: true,
      name: 'idx_driver_vehicles_profile_id'
    });
    await queryInterface.addIndex('driver_vehicles', ['license_plate'], {
      name: 'idx_driver_vehicles_license_plate'
    });
    await queryInterface.addIndex('driver_vehicles', ['tech_passport_series'], {
      name: 'idx_driver_vehicles_tech_passport'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('driver_vehicles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_driver_vehicles_vehicle_type";');
  }
};

