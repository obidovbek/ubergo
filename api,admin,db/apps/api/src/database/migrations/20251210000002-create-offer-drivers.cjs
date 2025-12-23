'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for offer driver status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_offer_drivers_status" AS ENUM (
        'pending',
        'confirmed',
        'rejected',
        'cancelled'
      );
    `);

    // Create offer_drivers table
    await queryInterface.createTable('offer_drivers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      offer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'passenger_offers', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      vehicle_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'driver_vehicles', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      seats_offered: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 8
        }
      },
      offered_price_per_seat: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total_offered_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.CHAR(3),
        allowNull: false,
        defaultValue: 'UZS'
      },
      status: {
        type: 'enum_offer_drivers_status',
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
    await queryInterface.addIndex('offer_drivers', ['offer_id', 'status'], {
      name: 'idx_offer_drivers_offer_status'
    });
    await queryInterface.addIndex('offer_drivers', ['driver_id', 'status'], {
      name: 'idx_offer_drivers_driver_status'
    });
    await queryInterface.addIndex('offer_drivers', ['offer_id', 'driver_id'], {
      name: 'idx_offer_drivers_offer_driver',
      unique: true
    });
    await queryInterface.addIndex('offer_drivers', ['vehicle_id'], {
      name: 'idx_offer_drivers_vehicle_id'
    });
    await queryInterface.addIndex('offer_drivers', ['created_at'], {
      name: 'idx_offer_drivers_created_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('offer_drivers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_offer_drivers_status";');
  }
};



