/**
 * Driver Rating Model
 * Stores passenger ratings for drivers after ride completion
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Driver Rating attributes
export interface DriverRatingAttributes {
  id: string;
  driver_id: number;
  passenger_id: number;
  offer_passenger_id: string;
  rating: number; // 1-5 stars
  comment?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface DriverRatingCreationAttributes
  extends Optional<
    DriverRatingAttributes,
    'id' | 'comment' | 'created_at' | 'updated_at'
  > {}

// Driver Rating model class
export class DriverRating
  extends Model<DriverRatingAttributes, DriverRatingCreationAttributes>
  implements DriverRatingAttributes
{
  declare id: string;
  declare driver_id: number;
  declare passenger_id: number;
  declare offer_passenger_id: string;
  declare rating: number;
  declare comment?: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initDriverRating(sequelize: Sequelize) {
  DriverRating.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
      },
      driver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      passenger_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      offer_passenger_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'offer_passengers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    },
    {
      sequelize,
      tableName: 'driver_ratings',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['driver_id']
        },
        {
          fields: ['passenger_id']
        },
        {
          unique: true,
          fields: ['offer_passenger_id']
        },
        {
          fields: ['rating']
        },
        {
          fields: ['created_at']
        }
      ]
    }
  );

  return DriverRating;
}

export default DriverRating;

