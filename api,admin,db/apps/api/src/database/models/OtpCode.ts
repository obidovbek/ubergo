/**
 * OtpCode Model
 * Manages OTP codes for SMS/Call verification
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// OtpCode attributes
export interface OtpCodeAttributes {
  id: string;
  channel: 'sms' | 'call' | 'push';
  target: string;
  code: string;
  expires_at: Date;
  attempts: number;
  meta: Record<string, any>;
  created_at: Date;
}

// Creation attributes
export interface OtpCodeCreationAttributes
  extends Optional<OtpCodeAttributes, 'id' | 'attempts' | 'meta' | 'created_at'> {}

// OtpCode model class
export class OtpCode extends Model<OtpCodeAttributes, OtpCodeCreationAttributes> implements OtpCodeAttributes {
  declare id: string;
  declare channel: 'sms' | 'call' | 'push';
  declare target: string;
  declare code: string;
  declare expires_at: Date;
  declare attempts: number;
  declare meta: Record<string, any>;
  declare readonly created_at: Date;

  // Timestamp
  declare createdAt: Date;
}

export function initOtpCode(sequelize: Sequelize) {
  OtpCode.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      channel: {
        type: DataTypes.ENUM('sms', 'call', 'push'),
        allowNull: false
      },
      target: {
        type: DataTypes.CITEXT,
        allowNull: false
      },
      code: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      }
    },
    {
      sequelize,
      tableName: 'otp_codes',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ['target', 'created_at'],
          name: 'idx_otp_codes_target_created'
        },
        {
          fields: ['expires_at'],
          name: 'idx_otp_codes_expires_at'
        }
      ]
    }
  );
  
  return OtpCode;
}

export default OtpCode;

