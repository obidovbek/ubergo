/**
 * Driver Taxi License Model
 * Stores driver's taxi operating license information
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Driver Taxi License attributes
export interface DriverTaxiLicenseAttributes {
  id: string;
  driver_profile_id: number;
  // License Information
  license_number?: string | null;
  license_issue_date?: Date | null;
  license_registry_number?: string | null;
  license_document_url?: string | null; // PDF or image
  // License Sheet/Card Information
  license_sheet_number?: string | null;
  license_sheet_valid_from?: Date | null;
  license_sheet_valid_until?: Date | null;
  license_sheet_document_url?: string | null; // PDF or image
  // Self-Employment
  self_employment_number?: string | null;
  self_employment_document_url?: string | null; // PDF or image
  // Power of Attorney
  power_of_attorney_document_url?: string | null; // PDF or image
  // Insurance
  insurance_document_url?: string | null; // PDF or image
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface DriverTaxiLicenseCreationAttributes
  extends Optional<DriverTaxiLicenseAttributes, 'id' | 'license_number' | 'license_issue_date' | 'license_registry_number' | 'license_document_url' | 'license_sheet_number' | 'license_sheet_valid_from' | 'license_sheet_valid_until' | 'license_sheet_document_url' | 'self_employment_number' | 'self_employment_document_url' | 'power_of_attorney_document_url' | 'insurance_document_url' | 'created_at' | 'updated_at'> {
  driver_profile_id: number;
}

// Driver Taxi License model class
export class DriverTaxiLicense extends Model<DriverTaxiLicenseAttributes, DriverTaxiLicenseCreationAttributes> implements DriverTaxiLicenseAttributes {
  declare id: string;
  declare driver_profile_id: number;
  declare license_number?: string | null;
  declare license_issue_date?: Date | null;
  declare license_registry_number?: string | null;
  declare license_document_url?: string | null;
  declare license_sheet_number?: string | null;
  declare license_sheet_valid_from?: Date | null;
  declare license_sheet_valid_until?: Date | null;
  declare license_sheet_document_url?: string | null;
  declare self_employment_number?: string | null;
  declare self_employment_document_url?: string | null;
  declare power_of_attorney_document_url?: string | null;
  declare insurance_document_url?: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initDriverTaxiLicense(sequelize: Sequelize) {
  DriverTaxiLicense.init(
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
      license_number: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      license_issue_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      license_registry_number: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      license_document_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      license_sheet_number: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      license_sheet_valid_from: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      license_sheet_valid_until: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      license_sheet_document_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      self_employment_number: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      self_employment_document_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      power_of_attorney_document_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      insurance_document_url: {
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
      tableName: 'driver_taxi_licenses',
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
        },
        {
          fields: ['license_sheet_number']
        }
      ]
    }
  );

  return DriverTaxiLicense;
}

export default DriverTaxiLicense;

