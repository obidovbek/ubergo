'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create driver_offer_stops table (optional, for future use)
    await queryInterface.createTable('driver_offer_stops', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      offer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'driver_offers', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      order_no: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      label_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      lat: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      lng: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
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
    await queryInterface.addIndex('driver_offer_stops', ['offer_id', 'order_no'], {
      name: 'idx_driver_offer_stops_offer_order',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('driver_offer_stops');
  }
};

