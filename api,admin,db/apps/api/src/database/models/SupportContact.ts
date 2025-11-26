/**
 * Support Contact Model
 * Stores support contact information (email and phone) for blocked users
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Support Contact attributes
export interface SupportContactAttributes {
  id: string;
  app_name: string; // 'user_app' or 'driver_app'
  email: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface SupportContactCreationAttributes
  extends Optional<SupportContactAttributes, 'id' | 'email' | 'phone' | 'created_at' | 'updated_at'> {
  app_name: string;
}

// Support Contact model class
export class SupportContact extends Model<SupportContactAttributes, SupportContactCreationAttributes> implements SupportContactAttributes {
  declare id: string;
  declare app_name: string;
  declare email: string | null;
  declare phone: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initSupportContact(sequelize: Sequelize) {
  SupportContact.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      app_name: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        defaultValue: 'user_app'
      },
      email: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      phone: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          is: /^\+?[\d\s-()]+$/ // Basic phone validation
        }
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
      tableName: 'support_contacts',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['app_name']
        }
      ]
    }
  );

  return SupportContact;
}

export default SupportContact;

