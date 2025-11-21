'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicle_colors', {
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
      hex_code: {
        type: Sequelize.STRING(7),
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
    await queryInterface.addIndex('vehicle_colors', ['name'], {
      unique: true,
      name: 'idx_vehicle_colors_name'
    });
    await queryInterface.addIndex('vehicle_colors', ['is_active'], {
      name: 'idx_vehicle_colors_is_active'
    });
    await queryInterface.addIndex('vehicle_colors', ['sort_order'], {
      name: 'idx_vehicle_colors_sort_order'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vehicle_colors');
  }
};

