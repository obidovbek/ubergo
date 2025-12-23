/**
 * Passenger Offer Model
 * Stores passenger's ride requests for drivers
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Passenger Offer status enum
export type PassengerOfferStatus = 'published' | 'archived' | 'cancelled' | 'completed';

// Passenger Offer attributes
export interface PassengerOfferAttributes {
  id: number;
  user_id: number;
  from_text: string;
  from_lat?: number | null;
  from_lng?: number | null;
  from_country_id?: number | null;
  from_province_id?: number | null;
  from_city_id?: number | null;
  to_text: string;
  to_lat?: number | null;
  to_lng?: number | null;
  to_country_id?: number | null;
  to_province_id?: number | null;
  to_city_id?: number | null;
  start_at: Date;
  seats_needed: number;
  max_price_per_seat: number;
  currency: string;
  front_seat: boolean;
  pets: boolean;
  large_baggage: boolean;
  note?: string | null;
  status: PassengerOfferStatus;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface PassengerOfferCreationAttributes
  extends Optional<
    PassengerOfferAttributes,
    | 'id'
    | 'from_lat'
    | 'from_lng'
    | 'from_country_id'
    | 'from_province_id'
    | 'from_city_id'
    | 'to_lat'
    | 'to_lng'
    | 'to_country_id'
    | 'to_province_id'
    | 'to_city_id'
    | 'front_seat'
    | 'pets'
    | 'large_baggage'
    | 'note'
    | 'status'
    | 'created_at'
    | 'updated_at'
  > {}

// Passenger Offer model class
export class PassengerOffer
  extends Model<PassengerOfferAttributes, PassengerOfferCreationAttributes>
  implements PassengerOfferAttributes
{
  declare id: number;
  declare user_id: number;
  declare from_text: string;
  declare from_lat?: number | null;
  declare from_lng?: number | null;
  declare from_country_id?: number | null;
  declare from_province_id?: number | null;
  declare from_city_id?: number | null;
  declare to_text: string;
  declare to_lat?: number | null;
  declare to_lng?: number | null;
  declare to_country_id?: number | null;
  declare to_province_id?: number | null;
  declare to_city_id?: number | null;
  declare start_at: Date;
  declare seats_needed: number;
  declare max_price_per_seat: number;
  declare currency: string;
  declare front_seat: boolean;
  declare pets: boolean;
  declare large_baggage: boolean;
  declare note?: string | null;
  declare status: PassengerOfferStatus;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initPassengerOffer(sequelize: Sequelize) {
  PassengerOffer.init(
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
      from_country_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_countries',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      from_province_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_provinces',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      from_city_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_city_districts',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      to_country_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_countries',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      to_province_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_provinces',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      to_city_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_city_districts',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      start_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      seats_needed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 8
        }
      },
      max_price_per_seat: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        defaultValue: 'UZS'
      },
      front_seat: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      pets: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      large_baggage: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('published', 'archived', 'cancelled', 'completed'),
        allowNull: false,
        defaultValue: 'published'
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
      tableName: 'passenger_offers',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['user_id', 'status', 'start_at']
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
        },
        {
          fields: ['from_country_id']
        },
        {
          fields: ['from_province_id']
        },
        {
          fields: ['from_city_id']
        },
        {
          fields: ['to_country_id']
        },
        {
          fields: ['to_province_id']
        },
        {
          fields: ['to_city_id']
        }
      ]
    }
  );

  return PassengerOffer;
}

export default PassengerOffer;



