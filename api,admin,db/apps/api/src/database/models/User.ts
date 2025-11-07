/**
 * User Model
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// User attributes
export interface UserAttributes {
  id: string;
  phone_e164?: string | null;
  email?: string | null;
  password_hash?: string | null;
  is_verified: boolean;
  status: 'active' | 'blocked' | 'pending_delete';
  display_name?: string | null;
  country_code?: string | null;
  role: 'user' | 'driver' | 'admin';
  first_name?: string | null;
  last_name?: string | null;
  father_name?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  birth_date?: string | null;
  additional_phones?: string[] | null;
  promo_code?: string | null;
  referral_id?: string | null;
  profile_complete: boolean;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes (optional fields during creation)
export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'phone_e164' | 'email' | 'password_hash' | 'is_verified' | 'status' | 'display_name' | 'country_code' | 'role' | 'first_name' | 'last_name' | 'father_name' | 'gender' | 'birth_date' | 'additional_phones' | 'promo_code' | 'referral_id' | 'profile_complete' | 'created_at' | 'updated_at'> {}

// User model class
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare phone_e164?: string | null;
  declare email?: string | null;
  declare password_hash?: string | null;
  declare is_verified: boolean;
  declare status: 'active' | 'blocked' | 'pending_delete';
  declare display_name?: string | null;
  declare country_code?: string | null;
  declare role: 'user' | 'driver' | 'admin';
  declare first_name?: string | null;
  declare last_name?: string | null;
  declare father_name?: string | null;
  declare gender?: 'male' | 'female' | 'other' | null;
  declare birth_date?: string | null;
  declare additional_phones?: string[] | null;
  declare promo_code?: string | null;
  declare referral_id?: string | null;
  declare profile_complete: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initUser(sequelize: Sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      phone_e164: {
        type: DataTypes.CITEXT,
        allowNull: true,
        unique: true,
        validate: {
          is: /^\+[1-9]\d{1,14}$/ // E.164 format validation
        }
      },
      email: {
        type: DataTypes.CITEXT,
        allowNull: true,
        unique: true,
        set(this: User, value: string | null) {
          const normalized = value?.trim() ?? '';
          this.setDataValue('email', normalized ? normalized : null);
        },
        validate: {
          isEmail: true
        }
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('active', 'blocked', 'pending_delete'),
        defaultValue: 'active',
        allowNull: false
      },
      display_name: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      country_code: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('user', 'driver', 'admin'),
        defaultValue: 'user',
        allowNull: false
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
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
      },
      birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        set(this: User, value: string | Date | null) {
          if (value === undefined || value === null || value === '') {
            this.setDataValue('birth_date', null);
            return;
          }

          if (value instanceof Date) {
            this.setDataValue('birth_date', value.toISOString().slice(0, 10));
            return;
          }

          const normalized = value.trim();
          this.setDataValue('birth_date', normalized || null);
        }
      },
      additional_phones: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
      },
      promo_code: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      referral_id: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      profile_complete: {
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
      tableName: 'users',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
  
  return User;
}

export default User;

