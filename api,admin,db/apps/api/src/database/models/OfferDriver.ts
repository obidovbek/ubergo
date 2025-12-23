/**
 * Offer Driver Model
 * Tracks drivers who join passenger offers
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Offer Driver status enum
export type OfferDriverStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

// Offer Driver attributes
export interface OfferDriverAttributes {
  id: string;
  offer_id: number;
  driver_id: number;
  vehicle_id: string;
  seats_offered: number;
  offered_price_per_seat: number; // Price driver is offering
  total_offered_price: number; // Total price for all seats
  currency: string; // Currency of the offered price
  status: OfferDriverStatus;
  message?: string | null;
  rejection_reason?: string | null;
  confirmed_at?: Date | null;
  rejected_at?: Date | null;
  cancelled_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface OfferDriverCreationAttributes
  extends Optional<
    OfferDriverAttributes,
    | 'id'
    | 'seats_offered'
    | 'status'
    | 'message'
    | 'rejection_reason'
    | 'confirmed_at'
    | 'rejected_at'
    | 'cancelled_at'
    | 'created_at'
    | 'updated_at'
  > {}

// Offer Driver model class
export class OfferDriver
  extends Model<OfferDriverAttributes, OfferDriverCreationAttributes>
  implements OfferDriverAttributes
{
  declare id: string;
  declare offer_id: number;
  declare driver_id: number;
  declare vehicle_id: string;
  declare seats_offered: number;
  declare offered_price_per_seat: number;
  declare total_offered_price: number;
  declare currency: string;
  declare status: OfferDriverStatus;
  declare message?: string | null;
  declare rejection_reason?: string | null;
  declare confirmed_at?: Date | null;
  declare rejected_at?: Date | null;
  declare cancelled_at?: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initOfferDriver(sequelize: Sequelize) {
  OfferDriver.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
      },
      offer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'passenger_offers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
      seats_offered: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 8
        }
      },
      offered_price_per_seat: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      total_offered_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        defaultValue: 'UZS'
      },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      rejected_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      cancelled_at: {
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
      tableName: 'offer_drivers',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['offer_id', 'status']
        },
        {
          fields: ['driver_id', 'status']
        },
        {
          unique: true,
          fields: ['offer_id', 'driver_id']
        },
        {
          fields: ['vehicle_id']
        },
        {
          fields: ['created_at']
        }
      ]
    }
  );

  return OfferDriver;
}

export default OfferDriver;



