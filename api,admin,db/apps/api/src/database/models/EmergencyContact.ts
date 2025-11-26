/**
 * Emergency Contact Model
 * Stores driver's emergency contact information
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Emergency Contact attributes
export interface EmergencyContactAttributes {
  id: string;
  driver_profile_id: number;
  phone_country_code?: string | null;
  phone_number?: string | null;
  relationship?: string | null; // Ota, Ona, Aka, etc.
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface EmergencyContactCreationAttributes
  extends Optional<EmergencyContactAttributes, 'id' | 'phone_country_code' | 'phone_number' | 'relationship' | 'created_at' | 'updated_at'> {
  driver_profile_id: number;
}

// Emergency Contact model class
export class EmergencyContact extends Model<EmergencyContactAttributes, EmergencyContactCreationAttributes> implements EmergencyContactAttributes {
  declare id: string;
  declare driver_profile_id: number;
  declare phone_country_code?: string | null;
  declare phone_number?: string | null;
  declare relationship?: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initEmergencyContact(sequelize: Sequelize) {
  EmergencyContact.init(
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
      phone_country_code: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      phone_number: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      relationship: {
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
      tableName: 'emergency_contacts',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['driver_profile_id']
        }
      ]
    }
  );

  return EmergencyContact;
}

export default EmergencyContact;

