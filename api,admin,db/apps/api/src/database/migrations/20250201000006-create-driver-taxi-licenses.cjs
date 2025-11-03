'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create driver_taxi_licenses table
    await queryInterface.createTable('driver_taxi_licenses', {
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
      license_number: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      license_issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      license_registry_number: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      license_document_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      license_sheet_number: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      license_sheet_valid_from: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      license_sheet_valid_until: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      license_sheet_document_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      self_employment_number: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      self_employment_document_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      power_of_attorney_document_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      insurance_document_url: {
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
    await queryInterface.addIndex('driver_taxi_licenses', ['driver_profile_id'], {
      unique: true,
      name: 'idx_driver_taxi_licenses_profile_id'
    });
    await queryInterface.addIndex('driver_taxi_licenses', ['license_number'], {
      name: 'idx_driver_taxi_licenses_number'
    });
    await queryInterface.addIndex('driver_taxi_licenses', ['license_sheet_number'], {
      name: 'idx_driver_taxi_licenses_sheet_number'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('driver_taxi_licenses');
  }
};

