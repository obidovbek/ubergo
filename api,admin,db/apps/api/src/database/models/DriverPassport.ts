/**
 * Driver Passport Model
 * Stores driver's passport/ID card information
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Driver Passport attributes
export interface DriverPassportAttributes {
  id: string;
  driver_profile_id: number;
  // Personal Information (from passport)
  first_name: string;
  last_name: string;
  father_name?: string | null;
  gender: 'male' | 'female';
  birth_date: Date;
  citizenship: string;
  birth_place_country?: string | null;
  birth_place_region?: string | null;
  birth_place_city?: string | null;
  // Passport Details
  id_card_number: string;
  pinfl: string; // JSHSHIR / ПИНФЛ
  issue_date: Date;
  expiry_date: Date;
  // Document Images
  passport_front_url?: string | null;
  passport_back_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface DriverPassportCreationAttributes
  extends Optional<DriverPassportAttributes, 'id' | 'father_name' | 'birth_place_country' | 'birth_place_region' | 'birth_place_city' | 'passport_front_url' | 'passport_back_url' | 'created_at' | 'updated_at'> {
  driver_profile_id: number;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female';
  birth_date: Date;
  citizenship: string;
  id_card_number: string;
  pinfl: string;
  issue_date: Date;
  expiry_date: Date;
}

// Driver Passport model class
export class DriverPassport extends Model<DriverPassportAttributes, DriverPassportCreationAttributes> implements DriverPassportAttributes {
  declare id: string;
  declare driver_profile_id: number;
  declare first_name: string;
  declare last_name: string;
  declare father_name?: string | null;
  declare gender: 'male' | 'female';
  declare birth_date: Date;
  declare citizenship: string;
  declare birth_place_country?: string | null;
  declare birth_place_region?: string | null;
  declare birth_place_city?: string | null;
  declare id_card_number: string;
  declare pinfl: string;
  declare issue_date: Date;
  declare expiry_date: Date;
  declare passport_front_url?: string | null;
  declare passport_back_url?: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initDriverPassport(sequelize: Sequelize) {
  DriverPassport.init(
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
      first_name: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      last_name: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      father_name: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: false
      },
      birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      citizenship: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      birth_place_country: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      birth_place_region: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      birth_place_city: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      id_card_number: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      pinfl: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      issue_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      passport_front_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      passport_back_url: {
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
      tableName: 'driver_passports',
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
          fields: ['id_card_number']
        },
        {
          fields: ['pinfl']
        }
      ]
    }
  );

  return DriverPassport;
}

export default DriverPassport;

