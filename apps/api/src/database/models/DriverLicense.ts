/**
 * Driver License Model
 * Stores driver's driving license information
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Driver License attributes
export interface DriverLicenseAttributes {
  id: string;
  driver_profile_id: string;
  // Personal Information (from license)
  first_name?: string | null;
  last_name?: string | null;
  father_name?: string | null;
  birth_date?: Date | null;
  // License Details
  license_number?: string | null;
  issue_date?: Date | null;
  // License Categories
  category_a?: Date | null;
  category_b?: Date | null;
  category_c?: Date | null;
  category_d?: Date | null;
  category_be?: Date | null;
  category_ce?: Date | null;
  category_de?: Date | null;
  // Document Images
  license_front_url?: string | null;
  license_back_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface DriverLicenseCreationAttributes
  extends Optional<DriverLicenseAttributes, 'id' | 'first_name' | 'last_name' | 'father_name' | 'birth_date' | 'license_number' | 'issue_date' | 'category_a' | 'category_b' | 'category_c' | 'category_d' | 'category_be' | 'category_ce' | 'category_de' | 'license_front_url' | 'license_back_url' | 'created_at' | 'updated_at'> {
  driver_profile_id: string;
}

// Driver License model class
export class DriverLicense extends Model<DriverLicenseAttributes, DriverLicenseCreationAttributes> implements DriverLicenseAttributes {
  declare id: string;
  declare driver_profile_id: string;
  declare first_name?: string | null;
  declare last_name?: string | null;
  declare father_name?: string | null;
  declare birth_date?: Date | null;
  declare license_number?: string | null;
  declare issue_date?: Date | null;
  declare category_a?: Date | null;
  declare category_b?: Date | null;
  declare category_c?: Date | null;
  declare category_d?: Date | null;
  declare category_be?: Date | null;
  declare category_ce?: Date | null;
  declare category_de?: Date | null;
  declare license_front_url?: string | null;
  declare license_back_url?: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initDriverLicense(sequelize: Sequelize) {
  DriverLicense.init(
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
      birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      license_number: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      issue_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      category_a: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      category_b: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      category_c: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      category_d: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      category_be: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      category_ce: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      category_de: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      license_front_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      license_back_url: {
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
      tableName: 'driver_licenses',
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
          fields: ['license_number']
        }
      ]
    }
  );

  return DriverLicense;
}

export default DriverLicense;

