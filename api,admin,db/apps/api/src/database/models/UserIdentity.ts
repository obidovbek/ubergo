/**
 * UserIdentity Model
 * Manages SSO and external identifiers (Google/Apple/Facebook/MS/Telegram/OneID)
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// UserIdentity attributes
export interface UserIdentityAttributes {
  id: string;
  user_id: string;
  provider: 'google' | 'apple' | 'facebook' | 'microsoft' | 'telegram' | 'oneid';
  provider_uid: string;
  meta: Record<string, any>;
  created_at: Date;
}

// Creation attributes
export interface UserIdentityCreationAttributes
  extends Optional<UserIdentityAttributes, 'id' | 'meta' | 'created_at'> {}

// UserIdentity model class
export class UserIdentity
  extends Model<UserIdentityAttributes, UserIdentityCreationAttributes>
  implements UserIdentityAttributes {
  declare id: string;
  declare user_id: string;
  declare provider: 'google' | 'apple' | 'facebook' | 'microsoft' | 'telegram' | 'oneid';
  declare provider_uid: string;
  declare meta: Record<string, any>;
  declare readonly created_at: Date;

  // Timestamp
  declare createdAt: Date;
}

export function initUserIdentity(sequelize: Sequelize) {
  UserIdentity.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      provider: {
        type: DataTypes.ENUM('google', 'apple', 'facebook', 'microsoft', 'telegram', 'oneid'),
        allowNull: false
      },
      provider_uid: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      meta: {
        type: DataTypes.JSONB,
        defaultValue: {},
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
      tableName: 'user_identities',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['provider', 'provider_uid'],
          name: 'uniq_provider_uid'
        },
        {
          fields: ['user_id'],
          name: 'idx_user_identities_user_id'
        }
      ]
    }
  );
  
  return UserIdentity;
}

export default UserIdentity;

