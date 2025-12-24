'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add is_active column to push_tokens table
    await queryInterface.addColumn('push_tokens', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    // Add index for better query performance
    await queryInterface.addIndex('push_tokens', ['user_id', 'app', 'is_active'], {
      name: 'idx_push_tokens_user_app_active',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex('push_tokens', 'idx_push_tokens_user_app_active');
    
    // Remove column
    await queryInterface.removeColumn('push_tokens', 'is_active');
  },
};

