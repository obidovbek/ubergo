/**
 * Driver Offer Model
 * Stores driver's ride offers for passengers
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Driver Offer status enum
export type DriverOfferStatus = 'published' | 'archived' | 'cancelled';

// Driver Offer attributes
export interface DriverOfferAttributes {
  id: number;
  user_id: number;
  vehicle_id: string;
  from_text: string;
  from_lat?: number | null;
  from_lng?: number | null;
  to_text: string;
  to_lat?: number | null;
  to_lng?: number | null;
  start_at: Date;
  seats_total: number;
  seats_free: number;
  price_per_seat: number;
  front_price_per_seat?: number | null;
  currency: string;
  note?: string | null;
  status: DriverOfferStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface DriverOfferCreationAttributes
  extends Optional<
    DriverOfferAttributes,
    | 'id'
    | 'from_lat'
    | 'from_lng'
    | 'to_lat'
    | 'to_lng'
    | 'note'
    | 'status'
    | 'rejection_reason'
    | 'reviewed_by'
    | 'reviewed_at'
    | 'created_at'
    | 'updated_at'
  > {}

// Driver Offer model class
export class DriverOffer
  extends Model<DriverOfferAttributes, DriverOfferCreationAttributes>
  implements DriverOfferAttributes
{
  declare id: number;
  declare user_id: number;
  declare vehicle_id: string;
  declare from_text: string;
  declare from_lat?: number | null;
  declare from_lng?: number | null;
  declare to_text: string;
  declare to_lat?: number | null;
  declare to_lng?: number | null;
  declare start_at: Date;
  declare seats_total: number;
  declare seats_free: number;
  declare price_per_seat: number;
  declare front_price_per_seat?: number | null;
  declare currency: string;
  declare note?: string | null;
  declare status: DriverOfferStatus;
  declare rejection_reason?: string | null;
  declare reviewed_by?: string | null;
  declare reviewed_at?: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initDriverOffer(sequelize: Sequelize) {
  DriverOffer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      vehicle_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'driver_vehicles',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      from_text: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      from_lat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      from_lng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      to_text: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      to_lat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      to_lng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      start_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      seats_total: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 8
        }
      },
      seats_free: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 8
        }
      },
      price_per_seat: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      front_price_per_seat: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      currency: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        defaultValue: 'UZS'
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('published', 'archived', 'cancelled'),
        allowNull: false,
        defaultValue: 'published'
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'admin_users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      reviewed_at: {
        type: DataTypes.DATE,
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
      tableName: 'driver_offers',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['user_id', 'status', 'start_at']
        },
        {
          fields: ['vehicle_id']
        },
        {
          fields: ['status']
        },
        {
          fields: ['start_at']
        },
        {
          fields: ['from_text']
        },
        {
          fields: ['to_text']
        }
      ]
    }
  );

  return DriverOffer;
}

export default DriverOffer;

