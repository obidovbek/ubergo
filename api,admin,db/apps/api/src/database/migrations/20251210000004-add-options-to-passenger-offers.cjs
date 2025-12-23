'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add front_seat, pets, and large_baggage columns to passenger_offers table
    await queryInterface.addColumn('passenger_offers', 'front_seat', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('passenger_offers', 'pets', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('passenger_offers', 'large_baggage', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns
    await queryInterface.removeColumn('passenger_offers', 'front_seat');
    await queryInterface.removeColumn('passenger_offers', 'pets');
    await queryInterface.removeColumn('passenger_offers', 'large_baggage');
  }
};

