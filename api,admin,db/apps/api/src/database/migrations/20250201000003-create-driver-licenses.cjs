'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create driver_licenses table
    await queryInterface.createTable('driver_licenses', {
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
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      license_number: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      category_a: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      category_b: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      category_c: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      category_d: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      category_be: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      category_ce: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      category_de: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      license_front_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      license_back_url: {
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
    await queryInterface.addIndex('driver_licenses', ['driver_profile_id'], {
      unique: true,
      name: 'idx_driver_licenses_profile_id'
    });
    await queryInterface.addIndex('driver_licenses', ['license_number'], {
      name: 'idx_driver_licenses_number'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('driver_licenses');
  }
};

