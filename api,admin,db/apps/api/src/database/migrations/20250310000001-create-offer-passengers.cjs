'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for passenger status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_offer_passengers_status" AS ENUM (
        'pending',
        'confirmed',
        'rejected',
        'cancelled'
      );
    `);

    // Create offer_passengers table
    await queryInterface.createTable('offer_passengers', {
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
      passenger_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      seats_requested: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 8
        }
      },
      is_front_seat: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      status: {
        type: 'enum_offer_passengers_status',
        allowNull: false,
        defaultValue: 'pending'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      confirmed_at: {
        type: 'TIMESTAMPTZ',
        allowNull: true
      },
      rejected_at: {
        type: 'TIMESTAMPTZ',
        allowNull: true
      },
      cancelled_at: {
        type: 'TIMESTAMPTZ',
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
    await queryInterface.addIndex('offer_passengers', ['offer_id', 'status'], {
      name: 'idx_offer_passengers_offer_status'
    });
    await queryInterface.addIndex('offer_passengers', ['passenger_id', 'status'], {
      name: 'idx_offer_passengers_passenger_status'
    });
    await queryInterface.addIndex('offer_passengers', ['offer_id', 'passenger_id'], {
      name: 'idx_offer_passengers_offer_passenger',
      unique: true
    });
    await queryInterface.addIndex('offer_passengers', ['created_at'], {
      name: 'idx_offer_passengers_created_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('offer_passengers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_offer_passengers_status";');
  }
};

