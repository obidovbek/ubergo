'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUM type for notification types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_notifications_type" AS ENUM ('info', 'success', 'warning', 'error');
    `);

    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: 'enum_notifications_type',
        allowNull: false,
        defaultValue: 'info'
      },
      read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('notifications', ['user_id'], {
      name: 'idx_notifications_user_id'
    });

    await queryInterface.addIndex('notifications', ['read'], {
      name: 'idx_notifications_read'
    });

    await queryInterface.addIndex('notifications', ['created_at'], {
      name: 'idx_notifications_created_at'
    });

    await queryInterface.addIndex('notifications', ['user_id', 'read'], {
      name: 'idx_notifications_user_id_read'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
  }
};

