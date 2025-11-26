/**
 * Driver Profile Model
 * Stores driver's personal information and address
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Driver Profile attributes
export interface DriverProfileAttributes {
  id: number;
  user_id: number;
  // Personal Information
  first_name?: string | null;
  last_name?: string | null;
  father_name?: string | null;
  gender?: 'male' | 'female' | null;
  birth_date?: Date | null;
  email?: string | null;
  // Current Residence Address
  address_country_id?: number | null;
  address_province_id?: number | null;
  address_city_district_id?: number | null;
  address_administrative_area_id?: number | null;
  address_settlement_id?: number | null;
  address_neighborhood_id?: number | null;
  address_street?: string | null;
  // Photo Uploads
  photo_face_url?: string | null;
  photo_body_url?: string | null;
  // Vehicle Ownership
  vehicle_owner_type?: 'own' | 'other_person' | 'company' | null;
  vehicle_usage_type?: 'rent' | 'free_use' | null;
  // Registration Status
  registration_step: 'personal' | 'passport' | 'license' | 'vehicle' | 'taxi_license' | 'complete';
  is_complete: boolean;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface DriverProfileCreationAttributes
  extends Optional<
    DriverProfileAttributes,
    | 'first_name'
    | 'last_name'
    | 'father_name'
    | 'gender'
    | 'birth_date'
    | 'email'
    | 'address_country_id'
    | 'address_province_id'
    | 'address_city_district_id'
    | 'address_administrative_area_id'
    | 'address_settlement_id'
    | 'address_neighborhood_id'
    | 'address_street'
    | 'photo_face_url'
    | 'photo_body_url'
    | 'vehicle_owner_type'
    | 'vehicle_usage_type'
    | 'registration_step'
    | 'is_complete'
    | 'created_at'
    | 'updated_at'
  > {
  user_id: number;
}

// Driver Profile model class
export class DriverProfile extends Model<DriverProfileAttributes, DriverProfileCreationAttributes> implements DriverProfileAttributes {
  declare id: number;
  declare user_id: number;
  declare first_name?: string | null;
  declare last_name?: string | null;
  declare father_name?: string | null;
  declare gender?: 'male' | 'female' | null;
  declare birth_date?: Date | null;
  declare email?: string | null;
  declare address_country_id?: number | null;
  declare address_province_id?: number | null;
  declare address_city_district_id?: number | null;
  declare address_administrative_area_id?: number | null;
  declare address_settlement_id?: number | null;
  declare address_neighborhood_id?: number | null;
  declare address_street?: string | null;
  declare photo_face_url?: string | null;
  declare photo_body_url?: string | null;
  declare vehicle_owner_type?: 'own' | 'other_person' | 'company' | null;
  declare vehicle_usage_type?: 'rent' | 'free_use' | null;
  declare registration_step: 'personal' | 'passport' | 'license' | 'vehicle' | 'taxi_license' | 'complete';
  declare is_complete: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initDriverProfile(sequelize: Sequelize) {
  DriverProfile.init(
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
      first_name: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      last_name: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      father_name: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: true
      },
      birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      email: {
        type: DataTypes.CITEXT,
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      address_country_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_countries',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      address_province_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_provinces',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      address_city_district_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_city_districts',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      address_administrative_area_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_administrative_areas',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      address_settlement_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_settlements',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      address_neighborhood_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'geo_neighborhoods',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      address_street: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      photo_face_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      photo_body_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      vehicle_owner_type: {
        type: DataTypes.ENUM('own', 'other_person', 'company'),
        allowNull: true
      },
      vehicle_usage_type: {
        type: DataTypes.ENUM('rent', 'free_use'),
        allowNull: true
      },
      registration_step: {
        type: DataTypes.ENUM('personal', 'passport', 'license', 'vehicle', 'taxi_license', 'complete'),
        defaultValue: 'personal',
        allowNull: false
      },
      is_complete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
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
      tableName: 'driver_profiles',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['user_id']
        }
      ]
    }
  );

  return DriverProfile;
}

export default DriverProfile;

