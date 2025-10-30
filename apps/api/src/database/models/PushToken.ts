import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface PushTokenAttributes {
  id: string;
  user_id: string;
  token: string;
  platform: 'android' | 'ios';
  app: 'user' | 'driver';
  created_at: Date;
  updated_at: Date;
}

export interface PushTokenCreationAttributes
  extends Optional<PushTokenAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class PushToken extends Model<PushTokenAttributes, PushTokenCreationAttributes> implements PushTokenAttributes {
  declare id: string;
  declare user_id: string;
  declare token: string;
  declare platform: 'android' | 'ios';
  declare app: 'user' | 'driver';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initPushToken(sequelize: Sequelize) {
  PushToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      platform: {
        type: DataTypes.ENUM('android', 'ios'),
        allowNull: false,
      },
      app: {
        type: DataTypes.ENUM('user', 'driver'),
        allowNull: false,
        defaultValue: 'user',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'push_tokens',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return PushToken;
}

export default PushToken;


