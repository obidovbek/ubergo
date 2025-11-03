'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_driver_passports_gender" AS ENUM ('male', 'female');
    `);

    // Create driver_passports table
    await queryInterface.createTable('driver_passports', {
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
      gender: {
        type: 'enum_driver_passports_gender',
        allowNull: true
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      citizenship: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      birth_place_country: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      birth_place_region: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      birth_place_city: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      id_card_number: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      pinfl: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      passport_front_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      passport_back_url: {
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
    await queryInterface.addIndex('driver_passports', ['driver_profile_id'], {
      unique: true,
      name: 'idx_driver_passports_profile_id'
    });
    await queryInterface.addIndex('driver_passports', ['id_card_number'], {
      name: 'idx_driver_passports_id_card'
    });
    await queryInterface.addIndex('driver_passports', ['pinfl'], {
      name: 'idx_driver_passports_pinfl'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('driver_passports');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_driver_passports_gender";');
  }
};

