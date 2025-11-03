'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable extensions
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "citext";');

    // Create enum types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_status" AS ENUM ('active', 'blocked', 'pending_delete');
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_role" AS ENUM ('user', 'driver', 'admin');
    `);

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      phone_e164: {
        type: 'CITEXT',
        allowNull: true,
        unique: true
      },
      email: {
        type: 'CITEXT',
        allowNull: true,
        unique: true
      },
      password_hash: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      status: {
        type: 'enum_users_status',
        defaultValue: 'active',
        allowNull: false
      },
      display_name: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      country_code: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      role: {
        type: 'enum_users_role',
        defaultValue: 'user',
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
    await queryInterface.addIndex('users', ['status'], {
      name: 'idx_users_status'
    });
    await queryInterface.addIndex('users', ['role'], {
      name: 'idx_users_role'
    });
    await queryInterface.addIndex('users', ['phone_e164'], {
      name: 'idx_users_phone_e164',
      where: { phone_e164: { [Sequelize.Op.ne]: null } }
    });
    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
      where: { email: { [Sequelize.Op.ne]: null } }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  }
};

