'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for offer status
    // Note: Using final enum values ('published', 'archived', 'cancelled')
    // The update migration (20250120000001) will handle existing databases with old enum values
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_driver_offers_status" AS ENUM (
        'published',
        'archived',
        'cancelled'
      );
    `);

    // Create driver_offers table
    // Note: Using INTEGER id (not UUID) as the final state
    // The change-id migration (20250225000001) will handle existing databases with UUID ids
    await queryInterface.createTable('driver_offers', {
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
      vehicle_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'driver_vehicles', key: 'id' },
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
      seats_total: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 8
        }
      },
      seats_free: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 8
        }
      },
      price_per_seat: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      front_price_per_seat: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
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
        type: 'enum_driver_offers_status',
        allowNull: false,
        defaultValue: 'published'
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reviewed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'admin_users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      reviewed_at: {
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
    await queryInterface.addIndex('driver_offers', ['user_id', 'status', 'start_at'], {
      name: 'idx_driver_offers_user_status_start'
    });
    await queryInterface.addIndex('driver_offers', ['vehicle_id'], {
      name: 'idx_driver_offers_vehicle_id'
    });
    await queryInterface.addIndex('driver_offers', ['status'], {
      name: 'idx_driver_offers_status'
    });
    await queryInterface.addIndex('driver_offers', ['start_at'], {
      name: 'idx_driver_offers_start_at'
    });
    await queryInterface.addIndex('driver_offers', ['from_text'], {
      name: 'idx_driver_offers_from_text'
    });
    await queryInterface.addIndex('driver_offers', ['to_text'], {
      name: 'idx_driver_offers_to_text'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('driver_offers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_driver_offers_status";');
  }
};

