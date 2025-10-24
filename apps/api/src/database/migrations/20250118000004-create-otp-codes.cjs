'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for OTP channels
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_otp_codes_channel" AS ENUM ('sms', 'call');
    `);

    // Create otp_codes table
    await queryInterface.createTable('otp_codes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      channel: {
        type: 'enum_otp_codes_channel',
        allowNull: false
      },
      target: {
        type: 'CITEXT',
        allowNull: false
      },
      code: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      expires_at: {
        type: 'TIMESTAMPTZ',
        allowNull: false
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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

    // Create composite index on target and created_at
    await queryInterface.addIndex('otp_codes', ['target', 'created_at'], {
      name: 'idx_otp_codes_target_created'
    });

    // Create index on expires_at for cleanup queries
    await queryInterface.addIndex('otp_codes', ['expires_at'], {
      name: 'idx_otp_codes_expires_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('otp_codes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_otp_codes_channel";');
  }
};

