'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'push' to enum type used by otp_codes.channel
    // Note: PostgreSQL does not support IF NOT EXISTS for enum values in older versions
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_otp_codes_channel" ADD VALUE 'push';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert enum change by recreating the type without 'push'
    // 1) Ensure no 'push' values remain, map them to 'sms'
    await queryInterface.sequelize.query(`
      UPDATE otp_codes SET channel = 'sms' WHERE channel = 'push';
    `);

    // 2) Create a new enum without 'push'
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_otp_codes_channel_old" AS ENUM ('sms', 'call');
    `);

    // 3) Alter column to use the old enum
    await queryInterface.sequelize.query(`
      ALTER TABLE otp_codes
      ALTER COLUMN channel TYPE "enum_otp_codes_channel_old"
      USING channel::text::"enum_otp_codes_channel_old";
    `);

    // 4) Drop the current enum type
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_otp_codes_channel";
    `);

    // 5) Rename the old enum back to original name
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_otp_codes_channel_old" RENAME TO "enum_otp_codes_channel";
    `);
  }
};


