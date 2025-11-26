/**
 * App Store URL Model
 * Stores Play Store and App Store URLs for user app
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// App Store URL attributes
export interface AppStoreUrlAttributes {
  id: string;
  app_name: string; // 'user_app' - identifier for which app this is for
  android_url: string | null; // Play Store URL
  ios_url: string | null; // App Store URL
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface AppStoreUrlCreationAttributes
  extends Optional<AppStoreUrlAttributes, 'id' | 'android_url' | 'ios_url' | 'created_at' | 'updated_at'> {
  app_name: string;
}

// App Store URL model class
export class AppStoreUrl extends Model<AppStoreUrlAttributes, AppStoreUrlCreationAttributes> implements AppStoreUrlAttributes {
  declare id: string;
  declare app_name: string;
  declare android_url: string | null;
  declare ios_url: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initAppStoreUrl(sequelize: Sequelize) {
  AppStoreUrl.init(
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
      android_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          isUrl: true
        }
      },
      ios_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          isUrl: true
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
      tableName: 'app_store_urls',
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

  return AppStoreUrl;
}

export default AppStoreUrl;

