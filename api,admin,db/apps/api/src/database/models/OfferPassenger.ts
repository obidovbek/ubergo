/**
 * Offer Passenger Model
 * Tracks passengers who join driver offers
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Offer Passenger status enum
export type OfferPassengerStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

// Offer Passenger attributes
export interface OfferPassengerAttributes {
  id: string;
  offer_id: number;
  passenger_id: number;
  seats_requested: number;
  is_front_seat: boolean;
  agreed_price_per_seat: number; // Price agreed at time of booking
  total_agreed_price: number; // Total price for all seats
  currency: string; // Currency of the agreed price
  status: OfferPassengerStatus;
  message?: string | null;
  rejection_reason?: string | null;
  confirmed_at?: Date | null;
  rejected_at?: Date | null;
  cancelled_at?: Date | null;
  driver_10min_notified_at?: Date | null;
  driver_arrived_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface OfferPassengerCreationAttributes
  extends Optional<
    OfferPassengerAttributes,
    | 'id'
    | 'seats_requested'
    | 'is_front_seat'
    | 'status'
    | 'message'
    | 'rejection_reason'
    | 'confirmed_at'
    | 'rejected_at'
    | 'cancelled_at'
    | 'driver_10min_notified_at'
    | 'driver_arrived_at'
    | 'created_at'
    | 'updated_at'
  > {}

// Offer Passenger model class
export class OfferPassenger
  extends Model<OfferPassengerAttributes, OfferPassengerCreationAttributes>
  implements OfferPassengerAttributes
{
  declare id: string;
  declare offer_id: number;
  declare passenger_id: number;
  declare seats_requested: number;
  declare is_front_seat: boolean;
  declare agreed_price_per_seat: number;
  declare total_agreed_price: number;
  declare currency: string;
  declare status: OfferPassengerStatus;
  declare message?: string | null;
  declare rejection_reason?: string | null;
  declare confirmed_at?: Date | null;
  declare rejected_at?: Date | null;
  declare cancelled_at?: Date | null;
  declare driver_10min_notified_at?: Date | null;
  declare driver_arrived_at?: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initOfferPassenger(sequelize: Sequelize) {
  OfferPassenger.init(
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
          model: 'driver_offers',
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
      seats_requested: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 8
        }
      },
      is_front_seat: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      agreed_price_per_seat: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      total_agreed_price: {
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
      driver_10min_notified_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      driver_arrived_at: {
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
      tableName: 'offer_passengers',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['offer_id', 'status']
        },
        {
          fields: ['passenger_id', 'status']
        },
        {
          unique: true,
          fields: ['offer_id', 'passenger_id']
        },
        {
          fields: ['created_at']
        }
      ]
    }
  );

  return OfferPassenger;
}

export default OfferPassenger;

