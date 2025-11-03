'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create emergency_contacts table
    await queryInterface.createTable('emergency_contacts', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      driver_profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'driver_profiles', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      phone_country_code: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      phone_number: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      relationship: {
        type: Sequelize.TEXT,
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

    // Create index
    await queryInterface.addIndex('emergency_contacts', ['driver_profile_id'], {
      name: 'idx_emergency_contacts_profile_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('emergency_contacts');
  }
};

