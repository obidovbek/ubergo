'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, delete any incomplete passport records that have NULL values for required fields
    // This ensures data integrity before making columns NOT NULL
    await queryInterface.sequelize.query(`
      DELETE FROM driver_passports
      WHERE first_name IS NULL
         OR last_name IS NULL
         OR gender IS NULL
         OR birth_date IS NULL
         OR citizenship IS NULL
         OR id_card_number IS NULL
         OR pinfl IS NULL
         OR issue_date IS NULL
         OR expiry_date IS NULL;
    `);

    // Now alter columns to be NOT NULL
    await queryInterface.changeColumn('driver_passports', 'first_name', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    await queryInterface.changeColumn('driver_passports', 'last_name', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    await queryInterface.changeColumn('driver_passports', 'gender', {
      type: 'enum_driver_passports_gender',
      allowNull: false
    });

    await queryInterface.changeColumn('driver_passports', 'birth_date', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });

    await queryInterface.changeColumn('driver_passports', 'citizenship', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    await queryInterface.changeColumn('driver_passports', 'id_card_number', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    await queryInterface.changeColumn('driver_passports', 'pinfl', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    await queryInterface.changeColumn('driver_passports', 'issue_date', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });

    await queryInterface.changeColumn('driver_passports', 'expiry_date', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert columns back to nullable
    await queryInterface.changeColumn('driver_passports', 'first_name', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.changeColumn('driver_passports', 'last_name', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.changeColumn('driver_passports', 'gender', {
      type: 'enum_driver_passports_gender',
      allowNull: true
    });

    await queryInterface.changeColumn('driver_passports', 'birth_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.changeColumn('driver_passports', 'citizenship', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.changeColumn('driver_passports', 'id_card_number', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.changeColumn('driver_passports', 'pinfl', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.changeColumn('driver_passports', 'issue_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.changeColumn('driver_passports', 'expiry_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  }
};

