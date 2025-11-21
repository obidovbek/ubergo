'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add vehicle_type_id column
    await queryInterface.addColumn('driver_vehicles', 'vehicle_type_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'vehicle_types', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Migrate existing data: map enum values to vehicle_type_id
    // Update records with 'light' vehicle_type
    await queryInterface.sequelize.query(`
      UPDATE driver_vehicles
      SET vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'light' LIMIT 1)
      WHERE vehicle_type = 'light' AND vehicle_type_id IS NULL
    `);

    // Update records with 'cargo' vehicle_type
    await queryInterface.sequelize.query(`
      UPDATE driver_vehicles
      SET vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'cargo' LIMIT 1)
      WHERE vehicle_type = 'cargo' AND vehicle_type_id IS NULL
    `);

    // Create index for foreign key
    await queryInterface.addIndex('driver_vehicles', ['vehicle_type_id'], {
      name: 'idx_driver_vehicles_type_id'
    });

    // Note: We keep the old vehicle_type enum column for backward compatibility
    // It can be removed in a future migration after data migration is complete
  },

  async down(queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex('driver_vehicles', 'idx_driver_vehicles_type_id');

    // Remove column
    await queryInterface.removeColumn('driver_vehicles', 'vehicle_type_id');
  }
};

