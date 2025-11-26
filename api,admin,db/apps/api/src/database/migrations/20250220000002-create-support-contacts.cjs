'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create support_contacts table
    await queryInterface.createTable('support_contacts', {
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
      email: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      phone: {
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
    await queryInterface.addIndex('support_contacts', ['app_name'], {
      unique: true,
      name: 'support_contacts_app_name_unique'
    });

    // Insert default record for user_app
    await queryInterface.bulkInsert('support_contacts', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        app_name: 'user_app',
        email: 'support@ubexgo.uz',
        phone: '+998901234567',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('support_contacts');
  }
};

