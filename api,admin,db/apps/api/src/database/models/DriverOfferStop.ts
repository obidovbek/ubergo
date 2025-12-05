/**
 * Driver Offer Stop Model
 * Stores intermediate stops for driver offers (optional, for future use)
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Driver Offer Stop attributes
export interface DriverOfferStopAttributes {
  id: string;
  offer_id: string;
  order_no: number;
  label_text: string;
  lat?: number | null;
  lng?: number | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface DriverOfferStopCreationAttributes
  extends Optional<DriverOfferStopAttributes, 'id' | 'lat' | 'lng' | 'created_at' | 'updated_at'> {}

// Driver Offer Stop model class
export class DriverOfferStop
  extends Model<DriverOfferStopAttributes, DriverOfferStopCreationAttributes>
  implements DriverOfferStopAttributes
{
  declare id: string;
  declare offer_id: string;
  declare order_no: number;
  declare label_text: string;
  declare lat?: number | null;
  declare lng?: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initDriverOfferStop(sequelize: Sequelize) {
  DriverOfferStop.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      offer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'driver_offers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      order_no: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      label_text: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      lat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      lng: {
        type: DataTypes.DECIMAL(10, 7),
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
      tableName: 'driver_offer_stops',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['offer_id', 'order_no']
        }
      ]
    }
  );

  return DriverOfferStop;
}

export default DriverOfferStop;

