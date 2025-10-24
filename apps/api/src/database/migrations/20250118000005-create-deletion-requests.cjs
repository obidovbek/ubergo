'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum type for deletion request status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_deletion_requests_status" AS ENUM ('pending', 'done', 'cancelled');
    `);

    // Create deletion_requests table
    await queryInterface.createTable('deletion_requests', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      requested_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      deadline_at: {
        type: 'TIMESTAMPTZ',
        allowNull: false
      },
      status: {
        type: 'enum_deletion_requests_status',
        defaultValue: 'pending',
        allowNull: false
      }
    });

    // Create index on user_id
    await queryInterface.addIndex('deletion_requests', ['user_id'], {
      name: 'idx_deletion_requests_user_id'
    });

    // Create composite index on status and deadline_at for cron jobs
    await queryInterface.addIndex('deletion_requests', ['status', 'deadline_at'], {
      name: 'idx_deletion_requests_status_deadline'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('deletion_requests');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_deletion_requests_status";');
  }
};

