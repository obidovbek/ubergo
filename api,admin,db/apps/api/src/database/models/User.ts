/**
 * User Model
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// User attributes
export interface UserAttributes {
  id: number;
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
  /**
   * 🔴 THE REFERRER'S promo code — the one this user TYPED IN at registration to
   * say who invited them. **NOT their own code.** One of three alternatives
   * (`promo_code` / `referral_id` / `referral_phone`), exactly one of which the
   * app allows to be filled. See migration 20260802000002.
   * ⚠️ The user's OWN code is `own_promo_code`. Reading this one when you mean
   * that one credits the wrong person (T-089).
   */
  promo_code?: string | null;
  referral_id?: string | null;
  /** Referrer's phone (OR-010). Not the user's own number. */
  referral_phone?: string | null;
  /**
   * 🔴 THE CODE THIS USER OWNS and gives to others (T-091). 5 chars,
   * alphanumeric, unique, case-insensitive. **The opposite of `promo_code`.**
   */
  own_promo_code?: string | null;
  /** The handle this user chose (T-091). ≥6 chars, alphanumeric, unique. */
  username?: string | null;
  profile_complete: boolean;
  /** The person's own UI language — what push notifications must be written in. */
  language?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes (optional fields during creation)
export interface UserCreationAttributes
  extends Optional<UserAttributes, 'phone_e164' | 'email' | 'password_hash' | 'is_verified' | 'status' | 'display_name' | 'country_code' | 'role' | 'first_name' | 'last_name' | 'father_name' | 'gender' | 'birth_date' | 'additional_phones' | 'promo_code' | 'referral_id' | 'referral_phone' | 'own_promo_code' | 'username' | 'profile_complete' | 'language' | 'created_at' | 'updated_at'> {}

// User model class
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
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
  declare referral_phone?: string | null;
  declare own_promo_code?: string | null;
  declare username?: string | null;
  declare profile_complete: boolean;
  declare language?: string | null;
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
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      referral_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      // CITEXT so 'ABC12' and 'abc12' are the same code — these are read off a
      // screen and re-typed. Case-insensitivity lives in the column because
      // doing it with LOWER() in code loses the race between check and insert.
      own_promo_code: {
        type: DataTypes.CITEXT,
        allowNull: true,
        unique: true
      },
      username: {
        type: DataTypes.CITEXT,
        allowNull: true,
        unique: true
      },
      profile_complete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      // Nullable on purpose: existing accounts have no recorded language, and
      // the push helpers fall back to 'uz' until the app reports one.
      language: {
        type: DataTypes.STRING(5),
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

