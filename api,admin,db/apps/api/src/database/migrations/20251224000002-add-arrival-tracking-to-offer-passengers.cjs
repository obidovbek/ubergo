'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('offer_passengers', 'driver_10min_notified_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('offer_passengers', 'driver_arrived_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('offer_passengers', 'driver_arrived_at');
    await queryInterface.removeColumn('offer_passengers', 'driver_10min_notified_at');
  },
};

