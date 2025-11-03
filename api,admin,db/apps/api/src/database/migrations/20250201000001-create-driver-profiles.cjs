'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_driver_profiles_gender" AS ENUM ('male', 'female');
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_driver_profiles_vehicle_owner_type" AS ENUM ('own', 'other_person', 'company');
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_driver_profiles_vehicle_usage_type" AS ENUM ('rent', 'free_use');
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_driver_profiles_registration_step" AS ENUM ('personal', 'passport', 'license', 'vehicle', 'taxi_license', 'complete');
    `);

    // Create driver_profiles table
    await queryInterface.createTable('driver_profiles', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      first_name: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      last_name: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      father_name: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      gender: {
        type: 'enum_driver_profiles_gender',
        allowNull: true
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      email: {
        type: 'CITEXT',
        allowNull: true
      },
      address_country: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      address_region: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      address_city: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      address_settlement_type: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      address_mahalla: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      address_street: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      photo_face_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      photo_body_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vehicle_owner_type: {
        type: 'enum_driver_profiles_vehicle_owner_type',
        allowNull: true
      },
      vehicle_usage_type: {
        type: 'enum_driver_profiles_vehicle_usage_type',
        allowNull: true
      },
      registration_step: {
        type: 'enum_driver_profiles_registration_step',
        defaultValue: 'personal',
        allowNull: false
      },
      is_complete: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
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
    await queryInterface.addIndex('driver_profiles', ['user_id'], {
      unique: true,
      name: 'idx_driver_profiles_user_id'
    });
    await queryInterface.addIndex('driver_profiles', ['registration_step'], {
      name: 'idx_driver_profiles_registration_step'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('driver_profiles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_driver_profiles_gender";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_driver_profiles_vehicle_owner_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_driver_profiles_vehicle_usage_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_driver_profiles_registration_step";');
  }
};

