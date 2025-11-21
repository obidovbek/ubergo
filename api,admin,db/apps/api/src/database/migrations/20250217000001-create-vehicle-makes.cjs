'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicle_makes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      name_uz: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      name_ru: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      name_en: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    await queryInterface.addIndex('vehicle_makes', ['name'], {
      unique: true,
      name: 'idx_vehicle_makes_name'
    });
    await queryInterface.addIndex('vehicle_makes', ['is_active'], {
      name: 'idx_vehicle_makes_is_active'
    });
    await queryInterface.addIndex('vehicle_makes', ['sort_order'], {
      name: 'idx_vehicle_makes_sort_order'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vehicle_makes');
  }
};

