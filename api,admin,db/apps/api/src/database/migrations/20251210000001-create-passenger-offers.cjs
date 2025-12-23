'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for passenger offer status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_passenger_offers_status" AS ENUM (
        'published',
        'archived',
        'cancelled',
        'completed'
      );
    `);

    // Create passenger_offers table
    await queryInterface.createTable('passenger_offers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      from_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      from_lat: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      from_lng: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      to_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      to_lat: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      to_lng: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      start_at: {
        type: 'TIMESTAMPTZ',
        allowNull: false
      },
      seats_needed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 8
        }
      },
      max_price_per_seat: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.CHAR(3),
        allowNull: false,
        defaultValue: 'UZS'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: 'enum_passenger_offers_status',
        allowNull: false,
        defaultValue: 'published'
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
    await queryInterface.addIndex('passenger_offers', ['user_id', 'status', 'start_at'], {
      name: 'idx_passenger_offers_user_status_start'
    });
    await queryInterface.addIndex('passenger_offers', ['status'], {
      name: 'idx_passenger_offers_status'
    });
    await queryInterface.addIndex('passenger_offers', ['start_at'], {
      name: 'idx_passenger_offers_start_at'
    });
    await queryInterface.addIndex('passenger_offers', ['from_text'], {
      name: 'idx_passenger_offers_from_text'
    });
    await queryInterface.addIndex('passenger_offers', ['to_text'], {
      name: 'idx_passenger_offers_to_text'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('passenger_offers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_passenger_offers_status";');
  }
};



