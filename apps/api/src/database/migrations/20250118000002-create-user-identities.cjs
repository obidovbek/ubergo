'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for providers
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_user_identities_provider" AS ENUM (
        'google', 'apple', 'facebook', 'microsoft', 'telegram', 'oneid'
      );
    `);

    // Create user_identities table
    await queryInterface.createTable('user_identities', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      provider: {
        type: 'enum_user_identities_provider',
        allowNull: false
      },
      provider_uid: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      meta: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    // Create unique constraint on provider + provider_uid
    await queryInterface.addConstraint('user_identities', {
      fields: ['provider', 'provider_uid'],
      type: 'unique',
      name: 'uniq_provider_uid'
    });

    // Create index on user_id
    await queryInterface.addIndex('user_identities', ['user_id'], {
      name: 'idx_user_identities_user_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_identities');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_identities_provider";');
  }
};

