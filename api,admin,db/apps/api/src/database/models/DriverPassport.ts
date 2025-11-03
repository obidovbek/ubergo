/**
 * Driver Passport Model
 * Stores driver's passport/ID card information
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Driver Passport attributes
export interface DriverPassportAttributes {
  id: string;
  driver_profile_id: string;
  // Personal Information (from passport)
  first_name?: string | null;
  last_name?: string | null;
  father_name?: string | null;
  gender?: 'male' | 'female' | null;
  birth_date?: Date | null;
  citizenship?: string | null;
  birth_place_country?: string | null;
  birth_place_region?: string | null;
  birth_place_city?: string | null;
  // Passport Details
  id_card_number?: string | null;
  pinfl?: string | null; // JSHSHIR / ПИНФЛ
  issue_date?: Date | null;
  expiry_date?: Date | null;
  // Document Images
  passport_front_url?: string | null;
  passport_back_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface DriverPassportCreationAttributes
  extends Optional<DriverPassportAttributes, 'id' | 'first_name' | 'last_name' | 'father_name' | 'gender' | 'birth_date' | 'citizenship' | 'birth_place_country' | 'birth_place_region' | 'birth_place_city' | 'id_card_number' | 'pinfl' | 'issue_date' | 'expiry_date' | 'passport_front_url' | 'passport_back_url' | 'created_at' | 'updated_at'> {
  driver_profile_id: string;
}

// Driver Passport model class
export class DriverPassport extends Model<DriverPassportAttributes, DriverPassportCreationAttributes> implements DriverPassportAttributes {
  declare id: string;
  declare driver_profile_id: string;
  declare first_name?: string | null;
  declare last_name?: string | null;
  declare father_name?: string | null;
  declare gender?: 'male' | 'female' | null;
  declare birth_date?: Date | null;
  declare citizenship?: string | null;
  declare birth_place_country?: string | null;
  declare birth_place_region?: string | null;
  declare birth_place_city?: string | null;
  declare id_card_number?: string | null;
  declare pinfl?: string | null;
  declare issue_date?: Date | null;
  declare expiry_date?: Date | null;
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
        type: DataTypes.UUID,
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
      citizenship: {
        type: DataTypes.TEXT,
        allowNull: true
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
        allowNull: true
      },
      pinfl: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      issue_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
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

