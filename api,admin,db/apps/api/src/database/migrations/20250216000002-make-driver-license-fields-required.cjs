'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, delete any incomplete license records that have NULL values for required fields
    await queryInterface.sequelize.query(`
      DELETE FROM driver_licenses
      WHERE license_number IS NULL
         OR issue_date IS NULL;
    `);

    // Now alter columns to be NOT NULL
    await queryInterface.changeColumn('driver_licenses', 'license_number', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    await queryInterface.changeColumn('driver_licenses', 'issue_date', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert columns back to nullable
    await queryInterface.changeColumn('driver_licenses', 'license_number', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.changeColumn('driver_licenses', 'issue_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  }
};

