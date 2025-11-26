'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create app_store_urls table
    await queryInterface.createTable('app_store_urls', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      app_name: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
        defaultValue: 'user_app'
      },
      android_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ios_url: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Create unique index on app_name
    await queryInterface.addIndex('app_store_urls', ['app_name'], {
      unique: true,
      name: 'app_store_urls_app_name_unique'
    });

    // Insert default record for user_app
    await queryInterface.bulkInsert('app_store_urls', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        app_name: 'user_app',
        android_url: null,
        ios_url: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('app_store_urls');
  }
};

