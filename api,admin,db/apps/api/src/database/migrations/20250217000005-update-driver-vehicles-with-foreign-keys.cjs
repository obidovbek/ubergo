'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new foreign key columns
    await queryInterface.addColumn('driver_vehicles', 'vehicle_make_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'vehicle_makes', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addColumn('driver_vehicles', 'vehicle_model_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'vehicle_models', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addColumn('driver_vehicles', 'vehicle_body_type_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'vehicle_body_types', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addColumn('driver_vehicles', 'vehicle_color_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'vehicle_colors', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Create indexes for foreign keys
    await queryInterface.addIndex('driver_vehicles', ['vehicle_make_id'], {
      name: 'idx_driver_vehicles_make_id'
    });
    await queryInterface.addIndex('driver_vehicles', ['vehicle_model_id'], {
      name: 'idx_driver_vehicles_model_id'
    });
    await queryInterface.addIndex('driver_vehicles', ['vehicle_body_type_id'], {
      name: 'idx_driver_vehicles_body_type_id'
    });
    await queryInterface.addIndex('driver_vehicles', ['vehicle_color_id'], {
      name: 'idx_driver_vehicles_color_id'
    });

    // Note: We keep the old columns (make, model, body_type, color) for backward compatibility
    // They can be removed in a future migration after data migration is complete
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('driver_vehicles', 'idx_driver_vehicles_color_id');
    await queryInterface.removeIndex('driver_vehicles', 'idx_driver_vehicles_body_type_id');
    await queryInterface.removeIndex('driver_vehicles', 'idx_driver_vehicles_model_id');
    await queryInterface.removeIndex('driver_vehicles', 'idx_driver_vehicles_make_id');

    // Remove columns
    await queryInterface.removeColumn('driver_vehicles', 'vehicle_color_id');
    await queryInterface.removeColumn('driver_vehicles', 'vehicle_body_type_id');
    await queryInterface.removeColumn('driver_vehicles', 'vehicle_model_id');
    await queryInterface.removeColumn('driver_vehicles', 'vehicle_make_id');
  }
};

