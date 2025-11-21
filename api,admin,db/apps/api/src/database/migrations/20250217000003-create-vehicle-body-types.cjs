'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicle_body_types', {
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
    await queryInterface.addIndex('vehicle_body_types', ['name'], {
      unique: true,
      name: 'idx_vehicle_body_types_name'
    });
    await queryInterface.addIndex('vehicle_body_types', ['is_active'], {
      name: 'idx_vehicle_body_types_is_active'
    });
    await queryInterface.addIndex('vehicle_body_types', ['sort_order'], {
      name: 'idx_vehicle_body_types_sort_order'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vehicle_body_types');
  }
};

