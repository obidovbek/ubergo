/**
 * Passenger Offer Model
 * Stores passenger's ride requests for drivers
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/**
 * Passenger Offer status enum.
 *
 * 'driver_found' sits between "the passenger picked a driver" and "the ride
 * happened". Confirming used to jump straight to 'completed', which marked the
 * trip finished before anyone had travelled.
 */
export type PassengerOfferStatus =
  | 'published'
  | 'driver_found'
  | 'archived'
  | 'cancelled'
  | 'completed';

// Stored as VARCHAR (not PG enums) — new values need no migration.
export type PassengerOfferPaymentType = 'cash' | 'click_payme' | 'friend_pays';
export type PassengerOfferSalonScope = 'whole_salon' | 'back_salon_full';
export type PassengerOfferVehicleClass =
  | 'standard'
  | 'comfort'
  | 'business'
  | 'econom'
  | 'tourist';
export type PassengerOfferVehicleType = 'minivan' | 'damas' | 'microbus';

// seat_counts JSONB — seats_needed keeps their sum
export interface PassengerOfferSeatCounts {
  front_male: number;
  front_female: number;
  back_male: number;
  back_female: number;
}

// special_order JSONB — data only, nothing is charged yet (see T-006)
export interface PassengerOfferSpecialOrder {
  price_front?: number | null;
  price_back?: number | null;
  price_back_salon?: number | null;
  price_whole_salon?: number | null;
  review_driver_offers?: boolean;
  fixed_price?: boolean;
  waiting_fee_per_min?: number | null;
  free_waiting_min?: number | null;
}

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
  from_settlement_id?: number | null;
  from_landmark?: string | null;
  to_text: string;
  to_lat?: number | null;
  to_lng?: number | null;
  to_country_id?: number | null;
  to_province_id?: number | null;
  to_city_id?: number | null;
  to_settlement_id?: number | null;
  to_landmark?: string | null;
  start_at: Date;
  depart_until?: Date | null;
  arrive_from?: Date | null;
  arrive_until?: Date | null;
  is_urgent: boolean;
  seats_needed: number;
  max_price_per_seat?: number | null;
  currency: string;
  /**
   * @deprecated T-031 — superseded by the three flags below, but still written
   * for one release so un-rebuilt app installs keep working. Do not read it for
   * new logic.
   */
  payment_type?: PassengerOfferPaymentType | null;
  /** T-031: cash and card are independent — both may be true. */
  payment_cash: boolean;
  payment_card: boolean;
  /** T-031: "Do'stimga" is its own choice, not a payment method. */
  paid_by_friend: boolean;
  payer_phone?: string | null;
  seat_counts?: PassengerOfferSeatCounts | null;
  seat_position_any: boolean;
  salon_scope?: PassengerOfferSalonScope | null;
  vehicle_class?: PassengerOfferVehicleClass | null;
  vehicle_types?: PassengerOfferVehicleType[] | null;
  front_seat: boolean;
  pets: boolean;
  large_baggage: boolean;
  woman_in_car: boolean;
  roof_rack_needed: boolean;
  trailer: boolean;
  road_pickup: boolean;
  road_pickup_note?: string | null;
  special_order?: PassengerOfferSpecialOrder | null;
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
    | 'from_settlement_id'
    | 'from_landmark'
    | 'to_lat'
    | 'to_lng'
    | 'to_country_id'
    | 'to_province_id'
    | 'to_city_id'
    | 'to_settlement_id'
    | 'to_landmark'
    | 'depart_until'
    | 'arrive_from'
    | 'arrive_until'
    | 'is_urgent'
    | 'max_price_per_seat'
    | 'payment_type'
    | 'payment_cash'
    | 'payment_card'
    | 'paid_by_friend'
    | 'payer_phone'
    | 'seat_counts'
    | 'seat_position_any'
    | 'salon_scope'
    | 'vehicle_class'
    | 'vehicle_types'
    | 'front_seat'
    | 'pets'
    | 'large_baggage'
    | 'woman_in_car'
    | 'roof_rack_needed'
    | 'trailer'
    | 'road_pickup'
    | 'road_pickup_note'
    | 'special_order'
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
  declare from_settlement_id?: number | null;
  declare from_landmark?: string | null;
  declare to_text: string;
  declare to_lat?: number | null;
  declare to_lng?: number | null;
  declare to_country_id?: number | null;
  declare to_province_id?: number | null;
  declare to_city_id?: number | null;
  declare to_settlement_id?: number | null;
  declare to_landmark?: string | null;
  declare start_at: Date;
  declare depart_until?: Date | null;
  declare arrive_from?: Date | null;
  declare arrive_until?: Date | null;
  declare is_urgent: boolean;
  declare seats_needed: number;
  declare max_price_per_seat?: number | null;
  declare currency: string;
  declare payment_type?: PassengerOfferPaymentType | null;
  declare payment_cash: boolean;
  declare payment_card: boolean;
  declare paid_by_friend: boolean;
  declare payer_phone?: string | null;
  declare seat_counts?: PassengerOfferSeatCounts | null;
  declare seat_position_any: boolean;
  declare salon_scope?: PassengerOfferSalonScope | null;
  declare vehicle_class?: PassengerOfferVehicleClass | null;
  declare vehicle_types?: PassengerOfferVehicleType[] | null;
  declare front_seat: boolean;
  declare pets: boolean;
  declare large_baggage: boolean;
  declare woman_in_car: boolean;
  declare roof_rack_needed: boolean;
  declare trailer: boolean;
  declare road_pickup: boolean;
  declare road_pickup_note?: string | null;
  declare special_order?: PassengerOfferSpecialOrder | null;
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
      from_settlement_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_settlements',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      from_landmark: {
        type: DataTypes.STRING(255),
        allowNull: true
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
      to_settlement_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_settlements',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      to_landmark: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      start_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      depart_until: {
        type: DataTypes.DATE,
        allowNull: true
      },
      arrive_from: {
        type: DataTypes.DATE,
        allowNull: true
      },
      arrive_until: {
        type: DataTypes.DATE,
        allowNull: true
      },
      is_urgent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      seats_needed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 8
        }
      },
      // Optional since the new Figma form has no price field — prices live in
      // special_order only.
      max_price_per_seat: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      currency: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        defaultValue: 'UZS'
      },
      payment_type: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      payment_cash: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      payment_card: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      paid_by_friend: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      payer_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      seat_counts: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      seat_position_any: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      salon_scope: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      vehicle_class: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      vehicle_types: {
        type: DataTypes.JSONB,
        allowNull: true
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
      woman_in_car: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      roof_rack_needed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      trailer: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      road_pickup: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      road_pickup_note: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      special_order: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('published', 'driver_found', 'archived', 'cancelled', 'completed'),
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
        },
        {
          fields: ['from_settlement_id']
        },
        {
          fields: ['to_settlement_id']
        }
      ]
    }
  );

  return PassengerOffer;
}

export default PassengerOffer;



