/**
 * Notification Model
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Notification attributes
export interface NotificationAttributes {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  data?: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes (optional fields during creation)
export interface NotificationCreationAttributes
  extends Optional<NotificationAttributes, 'id' | 'read' | 'data' | 'created_at' | 'updated_at'> {}

// Notification model class
export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: number;
  declare user_id: number;
  declare title: string;
  declare message: string;
  declare type: 'info' | 'success' | 'warning' | 'error';
  declare read: boolean;
  declare data?: Record<string, any> | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initNotification(sequelize: Sequelize) {
  Notification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
        allowNull: false,
        defaultValue: 'info'
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'notifications',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['read']
        },
        {
          fields: ['created_at']
        },
        {
          fields: ['user_id', 'read']
        }
      ]
    }
  );
  return Notification;
}

