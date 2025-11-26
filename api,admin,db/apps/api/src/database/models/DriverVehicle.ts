/**
 * Driver Vehicle Model
 * Stores driver's vehicle information
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Driver Vehicle attributes
export interface DriverVehicleAttributes {
  id: string;
  driver_profile_id: number;
  // Company Information (if vehicle belongs to company)
  company_name?: string | null;
  company_tax_id?: string | null;
  // Personal Information (from technical passport)
  owner_first_name?: string | null;
  owner_last_name?: string | null;
  owner_father_name?: string | null;
  owner_pinfl?: string | null;
  // Owner Address (Geo IDs)
  owner_address_country_id?: number | null;
  owner_address_province_id?: number | null;
  owner_address_city_district_id?: number | null;
  owner_address_administrative_area_id?: number | null;
  owner_address_settlement_id?: number | null;
  owner_address_neighborhood_id?: number | null;
  owner_address_street?: string | null;
  // Legacy string fields (kept for backward compatibility)
  owner_address_country?: string | null;
  owner_address_region?: string | null;
  owner_address_city?: string | null;
  owner_address_mahalla?: string | null;
  // Vehicle Identification
  vehicle_type?: 'light' | 'cargo' | null; // Legacy enum field (kept for backward compatibility)
  vehicle_type_id?: string | null;
  vehicle_make_id?: string | null;
  vehicle_model_id?: string | null;
  vehicle_body_type_id?: string | null;
  vehicle_color_id?: string | null;
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
  extends Optional<DriverVehicleAttributes, 'id' | 'company_name' | 'company_tax_id' | 'owner_first_name' | 'owner_last_name' | 'owner_father_name' | 'owner_pinfl' | 'owner_address_country_id' | 'owner_address_province_id' | 'owner_address_city_district_id' | 'owner_address_administrative_area_id' | 'owner_address_settlement_id' | 'owner_address_neighborhood_id' | 'owner_address_street' | 'owner_address_country' | 'owner_address_region' | 'owner_address_city' | 'owner_address_mahalla' | 'vehicle_type' | 'vehicle_type_id' | 'vehicle_make_id' | 'vehicle_model_id' | 'vehicle_body_type_id' | 'vehicle_color_id' | 'license_plate' | 'year' | 'gross_weight' | 'unladen_weight' | 'fuel_types' | 'seating_capacity' | 'tech_passport_series' | 'tech_passport_front_url' | 'tech_passport_back_url' | 'photo_front_url' | 'photo_back_url' | 'photo_right_url' | 'photo_left_url' | 'photo_angle_45_url' | 'photo_interior_url' | 'created_at' | 'updated_at'> {
  driver_profile_id: number;
}

// Driver Vehicle model class
export class DriverVehicle extends Model<DriverVehicleAttributes, DriverVehicleCreationAttributes> implements DriverVehicleAttributes {
  declare id: string;
  declare driver_profile_id: number;
  declare company_name?: string | null;
  declare company_tax_id?: string | null;
  declare owner_first_name?: string | null;
  declare owner_last_name?: string | null;
  declare owner_father_name?: string | null;
  declare owner_pinfl?: string | null;
  declare owner_address_country_id?: number | null;
  declare owner_address_province_id?: number | null;
  declare owner_address_city_district_id?: number | null;
  declare owner_address_administrative_area_id?: number | null;
  declare owner_address_settlement_id?: number | null;
  declare owner_address_neighborhood_id?: number | null;
  declare owner_address_street?: string | null;
  // Legacy string fields
  declare owner_address_country?: string | null;
  declare owner_address_region?: string | null;
  declare owner_address_city?: string | null;
  declare owner_address_mahalla?: string | null;
  declare vehicle_type?: 'light' | 'cargo' | null; // Legacy enum field
  declare vehicle_type_id?: string | null;
  declare vehicle_make_id?: string | null;
  declare vehicle_model_id?: string | null;
  declare vehicle_body_type_id?: string | null;
  declare vehicle_color_id?: string | null;
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
        type: DataTypes.INTEGER,
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
      owner_address_country_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_countries',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      owner_address_province_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_provinces',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      owner_address_city_district_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_city_districts',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      owner_address_administrative_area_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_administrative_areas',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      owner_address_settlement_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_settlements',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      owner_address_neighborhood_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_neighborhoods',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      owner_address_street: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      // Legacy string fields (kept for backward compatibility)
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
      vehicle_type: {
        type: DataTypes.ENUM('light', 'cargo'),
        allowNull: true
      },
      vehicle_type_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'vehicle_types',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      vehicle_make_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'vehicle_makes',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      vehicle_model_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'vehicle_models',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      vehicle_body_type_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'vehicle_body_types',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      vehicle_color_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'vehicle_colors',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
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
        },
        {
          fields: ['vehicle_type_id']
        },
        {
          fields: ['owner_address_country_id']
        },
        {
          fields: ['owner_address_province_id']
        },
        {
          fields: ['owner_address_city_district_id']
        },
        {
          fields: ['owner_address_administrative_area_id']
        },
        {
          fields: ['owner_address_settlement_id']
        },
        {
          fields: ['owner_address_neighborhood_id']
        },
        {
          fields: ['vehicle_make_id']
        },
        {
          fields: ['vehicle_model_id']
        },
        {
          fields: ['vehicle_body_type_id']
        },
        {
          fields: ['vehicle_color_id']
        }
      ]
    }
  );

  return DriverVehicle;
}

export default DriverVehicle;

