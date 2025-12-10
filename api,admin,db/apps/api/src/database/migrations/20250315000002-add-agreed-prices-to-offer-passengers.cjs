/**
 * Migration: Add agreed prices to offer_passengers table
 * Adds fields to remember the agreed-upon price when passenger joins
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns already exist
    const tableDescription = await queryInterface.describeTable('offer_passengers');
    
    if (!tableDescription.agreed_price_per_seat) {
      await queryInterface.addColumn('offer_passengers', 'agreed_price_per_seat', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true, // Allow null for existing records
        comment: 'Price per seat agreed at time of booking'
      });
    }

    if (!tableDescription.total_agreed_price) {
      await queryInterface.addColumn('offer_passengers', 'total_agreed_price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true, // Allow null for existing records
        comment: 'Total price for all seats agreed at time of booking'
      });
    }

    if (!tableDescription.currency) {
      await queryInterface.addColumn('offer_passengers', 'currency', {
        type: Sequelize.CHAR(3),
        allowNull: false,
        defaultValue: 'UZS',
        comment: 'Currency of the agreed price'
      });
    }

    // Update existing records to use current offer prices
    await queryInterface.sequelize.query(`
      UPDATE offer_passengers
      SET 
        agreed_price_per_seat = (
          SELECT CASE 
            WHEN offer_passengers.is_front_seat = true AND driver_offers.front_price_per_seat IS NOT NULL 
            THEN driver_offers.front_price_per_seat
            ELSE driver_offers.price_per_seat
          END
          FROM driver_offers
          WHERE driver_offers.id = offer_passengers.offer_id
        ),
        total_agreed_price = (
          SELECT CASE 
            WHEN offer_passengers.is_front_seat = true AND driver_offers.front_price_per_seat IS NOT NULL 
            THEN driver_offers.front_price_per_seat * offer_passengers.seats_requested
            ELSE driver_offers.price_per_seat * offer_passengers.seats_requested
          END
          FROM driver_offers
          WHERE driver_offers.id = offer_passengers.offer_id
        ),
        currency = (
          SELECT driver_offers.currency
          FROM driver_offers
          WHERE driver_offers.id = offer_passengers.offer_id
        )
      WHERE agreed_price_per_seat IS NULL
    `);

    // Now make the columns NOT NULL (only if they were just added)
    const updatedTableDescription = await queryInterface.describeTable('offer_passengers');
    
    if (updatedTableDescription.agreed_price_per_seat && updatedTableDescription.agreed_price_per_seat.allowNull !== false) {
      await queryInterface.changeColumn('offer_passengers', 'agreed_price_per_seat', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Price per seat agreed at time of booking'
      });
    }

    if (updatedTableDescription.total_agreed_price && updatedTableDescription.total_agreed_price.allowNull !== false) {
      await queryInterface.changeColumn('offer_passengers', 'total_agreed_price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total price for all seats agreed at time of booking'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('offer_passengers', 'agreed_price_per_seat');
    await queryInterface.removeColumn('offer_passengers', 'total_agreed_price');
    await queryInterface.removeColumn('offer_passengers', 'currency');
  }
};

