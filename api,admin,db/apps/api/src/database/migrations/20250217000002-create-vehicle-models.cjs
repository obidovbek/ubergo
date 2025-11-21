'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicle_models', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false
      },
      vehicle_make_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'vehicle_makes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
    await queryInterface.addIndex('vehicle_models', ['vehicle_make_id'], {
      name: 'idx_vehicle_models_make_id'
    });
    await queryInterface.addIndex('vehicle_models', ['vehicle_make_id', 'name'], {
      unique: true,
      name: 'idx_vehicle_models_make_name'
    });
    await queryInterface.addIndex('vehicle_models', ['is_active'], {
      name: 'idx_vehicle_models_is_active'
    });
    await queryInterface.addIndex('vehicle_models', ['sort_order'], {
      name: 'idx_vehicle_models_sort_order'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vehicle_models');
  }
};

