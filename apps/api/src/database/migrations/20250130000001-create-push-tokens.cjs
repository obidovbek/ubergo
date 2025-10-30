'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_push_tokens_platform" AS ENUM ('android', 'ios');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_push_tokens_app" AS ENUM ('user', 'driver');
    `);

    await queryInterface.createTable('push_tokens', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      platform: {
        type: 'enum_push_tokens_platform',
        allowNull: false,
      },
      app: {
        type: 'enum_push_tokens_app',
        allowNull: false,
        defaultValue: 'user',
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false,
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false,
      },
    });

    await queryInterface.addIndex('push_tokens', ['user_id', 'app'], {
      name: 'idx_push_tokens_user_app',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('push_tokens');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_push_tokens_platform";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_push_tokens_app";');
  },
};


