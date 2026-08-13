/**
 * Driver Offer Model
 * Stores driver's ride offers for passengers
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Driver Offer status enum
export type DriverOfferStatus = 'published' | 'archived' | 'cancelled';

/**
 * T-078 — the mockup's five radios (Standart / Comfort / Biznes / Econom /
 * Turistik).
 *
 * ⚠️ Deliberately the SAME vocabulary as `PassengerOfferVehicleClass`, so the
 * two can be compared one day — but it is a **separate type on purpose**,
 * because the meaning differs: there it is the class the passenger *wants*,
 * here the class the driver *drives*. Importing the passenger's type would
 * hide that difference behind a shared name.
 */
export type DriverOfferVehicleClass =
  | 'standard'
  | 'comfort'
  | 'business'
  | 'econom'
  | 'tourist';

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
  /**
   * T-078 — the rest of the `Narxlar` list. Names mirror
   * `PassengerOfferSpecialOrder`; storage does not (see the migration).
   */
  price_back_salon?: number | null;
  price_whole_salon?: number | null;
  /**
   * 🔴 A RATE TO DISPLAY, NOT MONEY TO CHARGE (owner, 2026-08-13). Nothing
   * meters a real wait, so no code may add this to any total.
   */
  waiting_fee_per_min?: number | null;
  free_waiting_min?: number | null;
  /** "Joyidan olish" — door pickup. */
  pickup_fee?: number | null;
  /**
   * T-078 — `null` means the driver was never asked (any offer predating this
   * card); `false` means they refuse it. Do not collapse the two.
   */
  payment_cash?: boolean | null;
  payment_card?: boolean | null;
  /**
   * ⚠️ The class the driver DRIVES. On `PassengerOffer` the same vocabulary
   * means the class the passenger WANTS — do not join them without saying so.
   */
  vehicle_class?: DriverOfferVehicleClass | null;
  /**
   * T-079 — what the car offers. These default to `false`, unlike T-078's
   * payment flags: "no air conditioner" is a safe and honest default for an
   * offer created before the field existed, whereas "refuses cash" was not.
   */
  air_conditioner: boolean;
  wifi: boolean;
  roof_rack_needed: boolean;
  trailer: boolean;
  /** T-079 — Jo'natma (pochta). The weight limit is the driver's, not a constant. */
  parcel_accepted: boolean;
  parcel_price?: number | null;
  parcel_max_kg?: number | null;
  /** T-079 — "Faqat pitakdan yoki yo'lga chiqib tursa olaman". */
  road_pickup: boolean;
  road_pickup_note?: string | null;
  /** T-080 — `start_at` is the window's START; these are the rest of it. */
  depart_until?: Date | null;
  arrive_from?: Date | null;
  arrive_until?: Date | null;
  /**
   * T-080 — "to'lishi bilan yuraman".
   *
   * 🔴 **NOT the passenger's `is_urgent`**, which means "I want to leave now"
   * and sets `start_at = now`. This means "I leave when the car fills up"
   * (owner-confirmed 2026-08-13). Same-looking flag, different fact.
   */
  departs_when_full: boolean;
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
    // T-079/T-080 — all defaulted or nullable, so a create need not send them.
    | 'air_conditioner'
    | 'wifi'
    | 'roof_rack_needed'
    | 'trailer'
    | 'parcel_accepted'
    | 'parcel_price'
    | 'parcel_max_kg'
    | 'road_pickup'
    | 'road_pickup_note'
    | 'depart_until'
    | 'arrive_from'
    | 'arrive_until'
    | 'departs_when_full'
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
  // T-078 — see the attributes interface above for what each one means.
  declare price_back_salon?: number | null;
  declare price_whole_salon?: number | null;
  declare waiting_fee_per_min?: number | null;
  declare free_waiting_min?: number | null;
  declare pickup_fee?: number | null;
  declare payment_cash?: boolean | null;
  declare payment_card?: boolean | null;
  declare vehicle_class?: DriverOfferVehicleClass | null;
  declare air_conditioner: boolean;
  declare wifi: boolean;
  declare roof_rack_needed: boolean;
  declare trailer: boolean;
  declare parcel_accepted: boolean;
  declare parcel_price?: number | null;
  declare parcel_max_kg?: number | null;
  declare road_pickup: boolean;
  declare road_pickup_note?: string | null;
  declare depart_until?: Date | null;
  declare arrive_from?: Date | null;
  declare arrive_until?: Date | null;
  declare departs_when_full: boolean;
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
      // T-078 — the rest of the Narxlar list, plus payment and class.
      price_back_salon: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      price_whole_salon: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      waiting_fee_per_min: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      free_waiting_min: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      pickup_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      // Nullable on purpose: null = never asked, false = refuses it.
      payment_cash: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      payment_card: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      // T-079 / T-080 — amenities, jo'natma and the departure/arrival windows.
      air_conditioner: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      wifi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      roof_rack_needed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      trailer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      parcel_accepted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      parcel_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      parcel_max_kg: { type: DataTypes.INTEGER, allowNull: true },
      road_pickup: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      road_pickup_note: { type: DataTypes.TEXT, allowNull: true },
      depart_until: { type: DataTypes.DATE, allowNull: true },
      arrive_from: { type: DataTypes.DATE, allowNull: true },
      arrive_until: { type: DataTypes.DATE, allowNull: true },
      departs_when_full: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      vehicle_class: {
        type: DataTypes.STRING(20),
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

