/**
 * Migration: Create driver_ratings table
 * Stores passenger ratings for drivers after ride completion
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('driver_ratings', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      passenger_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      offer_passenger_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'offer_passengers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      comment: {
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

    // Create indexes
    await queryInterface.addIndex('driver_ratings', ['driver_id'], {
      name: 'idx_driver_ratings_driver_id'
    });

    await queryInterface.addIndex('driver_ratings', ['passenger_id'], {
      name: 'idx_driver_ratings_passenger_id'
    });

    await queryInterface.addIndex('driver_ratings', ['offer_passenger_id'], {
      name: 'idx_driver_ratings_offer_passenger_id',
      unique: true
    });

    await queryInterface.addIndex('driver_ratings', ['rating'], {
      name: 'idx_driver_ratings_rating'
    });

    await queryInterface.addIndex('driver_ratings', ['created_at'], {
      name: 'idx_driver_ratings_created_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('driver_ratings');
  }
};

