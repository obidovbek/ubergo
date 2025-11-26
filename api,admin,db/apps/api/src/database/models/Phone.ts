/**
 * Phone Model
 * Manages primary/trusted/extra phone numbers (up to 5 per user)
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Phone attributes
export interface PhoneAttributes {
  id: string;
  user_id: number;
  label: 'primary' | 'trusted' | 'extra';
  e164: string;
  is_verified: boolean;
  created_at: Date;
}

// Creation attributes
export interface PhoneCreationAttributes
  extends Optional<PhoneAttributes, 'id' | 'label' | 'is_verified' | 'created_at'> {}

// Phone model class
export class Phone extends Model<PhoneAttributes, PhoneCreationAttributes> implements PhoneAttributes {
  declare id: string;
  declare user_id: number;
  declare label: 'primary' | 'trusted' | 'extra';
  declare e164: string;
  declare is_verified: boolean;
  declare readonly created_at: Date;

  // Timestamp
  declare createdAt: Date;
}

export function initPhone(sequelize: Sequelize) {
  Phone.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      label: {
        type: DataTypes.ENUM('primary', 'trusted', 'extra'),
        defaultValue: 'extra',
        allowNull: false
      },
      e164: {
        type: DataTypes.CITEXT,
        allowNull: false,
        validate: {
          is: /^\+[1-9]\d{1,14}$/ // E.164 format validation
        }
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at'
      }
    },
    {
      sequelize,
      tableName: 'phones',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'e164'],
          name: 'uniq_user_phone'
        },
        {
          fields: ['user_id'],
          name: 'idx_phones_user_id'
        },
        {
          fields: ['e164'],
          name: 'idx_phones_e164'
        }
      ]
    }
  );
  
  return Phone;
}

export default Phone;

