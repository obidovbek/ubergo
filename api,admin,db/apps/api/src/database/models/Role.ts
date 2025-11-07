/**
 * Role Model
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Role attributes
export interface RoleAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  permissions?: string[] | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface RoleCreationAttributes
  extends Optional<RoleAttributes, 'id' | 'description' | 'permissions' | 'is_active' | 'created_at' | 'updated_at'> {}

// Role model class
export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: string;
  declare name: string;
  declare slug: string;
  declare description?: string | null;
  declare permissions?: string[] | null;
  declare is_active: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initRole(sequelize: Sequelize) {
  Role.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
      },
      slug: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      permissions: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
      tableName: 'roles',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return Role;
}

export default Role;

