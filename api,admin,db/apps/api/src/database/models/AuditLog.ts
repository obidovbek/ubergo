/**
 * AuditLog Model
 * Tracks user actions and system events
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// AuditLog attributes
export interface AuditLogAttributes {
  id: string;
  user_id?: string | null;
  action: string;
  ip?: string | null;
  ua?: string | null;
  payload: Record<string, any>;
  created_at: Date;
}

// Creation attributes
export interface AuditLogCreationAttributes
  extends Optional<AuditLogAttributes, 'id' | 'user_id' | 'ip' | 'ua' | 'payload' | 'created_at'> {}

// AuditLog model class
export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  declare id: string;
  declare user_id?: string | null;
  declare action: string;
  declare ip?: string | null;
  declare ua?: string | null;
  declare payload: Record<string, any>;
  declare readonly created_at: Date;

  // Timestamp
  declare createdAt: Date;
}

export function initAuditLog(sequelize: Sequelize) {
  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      action: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      ip: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ua: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      payload: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      }
    },
    {
      sequelize,
      tableName: 'audit_logs',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ['user_id', 'created_at'],
          name: 'idx_audit_logs_user_created'
        },
        {
          fields: ['action', 'created_at'],
          name: 'idx_audit_logs_action_created'
        },
        {
          fields: ['created_at'],
          name: 'idx_audit_logs_created_at'
        }
      ]
    }
  );
  
  return AuditLog;
}

export default AuditLog;

