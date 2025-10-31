/**
 * Driver Vehicle Model
 * Stores driver's vehicle information
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Driver Vehicle attributes
export interface DriverVehicleAttributes {
  id: string;
  driver_profile_id: string;
  // Company Information (if vehicle belongs to company)
  company_name?: string | null;
  company_tax_id?: string | null;
  // Personal Information (from technical passport)
  owner_first_name?: string | null;
  owner_last_name?: string | null;
  owner_father_name?: string | null;
  owner_pinfl?: string | null;
  owner_address_country?: string | null;
  owner_address_region?: string | null;
  owner_address_city?: string | null;
  owner_address_mahalla?: string | null;
  owner_address_street?: string | null;
  // Vehicle Identification
  vehicle_type?: 'light' | 'cargo' | null;
  body_type?: string | null; // Sedan, etc.
  make?: string | null; // Chevrolet, etc.
  model?: string | null; // Cobalt, etc.
  color?: string | null;
  license_plate?: string | null; // Davlat raqami
  year?: number | null;
  // Technical Specifications
  gross_weight?: number | null; // kg
  unladen_weight?: number | null; // kg
  fuel_types?: string[] | null; // ['benzine', 'metan', 'propan', 'electric', 'diesel']
  seating_capacity?: number | null; // Number of seats including driver
  // Technical Passport
  tech_passport_series?: string | null;
  tech_passport_front_url?: string | null;
  tech_passport_back_url?: string | null;
  // Vehicle Images
  photo_front_url?: string | null;
  photo_back_url?: string | null;
  photo_right_url?: string | null;
  photo_left_url?: string | null;
  photo_angle_45_url?: string | null;
  photo_interior_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface DriverVehicleCreationAttributes
  extends Optional<DriverVehicleAttributes, 'id' | 'company_name' | 'company_tax_id' | 'owner_first_name' | 'owner_last_name' | 'owner_father_name' | 'owner_pinfl' | 'owner_address_country' | 'owner_address_region' | 'owner_address_city' | 'owner_address_mahalla' | 'owner_address_street' | 'vehicle_type' | 'body_type' | 'make' | 'model' | 'color' | 'license_plate' | 'year' | 'gross_weight' | 'unladen_weight' | 'fuel_types' | 'seating_capacity' | 'tech_passport_series' | 'tech_passport_front_url' | 'tech_passport_back_url' | 'photo_front_url' | 'photo_back_url' | 'photo_right_url' | 'photo_left_url' | 'photo_angle_45_url' | 'photo_interior_url' | 'created_at' | 'updated_at'> {
  driver_profile_id: string;
}

// Driver Vehicle model class
export class DriverVehicle extends Model<DriverVehicleAttributes, DriverVehicleCreationAttributes> implements DriverVehicleAttributes {
  declare id: string;
  declare driver_profile_id: string;
  declare company_name?: string | null;
  declare company_tax_id?: string | null;
  declare owner_first_name?: string | null;
  declare owner_last_name?: string | null;
  declare owner_father_name?: string | null;
  declare owner_pinfl?: string | null;
  declare owner_address_country?: string | null;
  declare owner_address_region?: string | null;
  declare owner_address_city?: string | null;
  declare owner_address_mahalla?: string | null;
  declare owner_address_street?: string | null;
  declare vehicle_type?: 'light' | 'cargo' | null;
  declare body_type?: string | null;
  declare make?: string | null;
  declare model?: string | null;
  declare color?: string | null;
  declare license_plate?: string | null;
  declare year?: number | null;
  declare gross_weight?: number | null;
  declare unladen_weight?: number | null;
  declare fuel_types?: string[] | null;
  declare seating_capacity?: number | null;
  declare tech_passport_series?: string | null;
  declare tech_passport_front_url?: string | null;
  declare tech_passport_back_url?: string | null;
  declare photo_front_url?: string | null;
  declare photo_back_url?: string | null;
  declare photo_right_url?: string | null;
  declare photo_left_url?: string | null;
  declare photo_angle_45_url?: string | null;
  declare photo_interior_url?: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initDriverVehicle(sequelize: Sequelize) {
  DriverVehicle.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      driver_profile_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'driver_profiles',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      company_name: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      company_tax_id: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      owner_first_name: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      owner_last_name: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      owner_father_name: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      owner_pinfl: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      owner_address_country: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      owner_address_region: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      owner_address_city: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      owner_address_mahalla: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      owner_address_street: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      vehicle_type: {
        type: DataTypes.ENUM('light', 'cargo'),
        allowNull: true
      },
      body_type: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      make: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      model: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      color: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      license_plate: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      gross_weight: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      unladen_weight: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      fuel_types: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
      },
      seating_capacity: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      tech_passport_series: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      tech_passport_front_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      tech_passport_back_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      photo_front_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      photo_back_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      photo_right_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      photo_left_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      photo_angle_45_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      photo_interior_url: {
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
      tableName: 'driver_vehicles',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['driver_profile_id']
        },
        {
          fields: ['license_plate']
        },
        {
          fields: ['tech_passport_series']
        }
      ]
    }
  );

  return DriverVehicle;
}

export default DriverVehicle;

