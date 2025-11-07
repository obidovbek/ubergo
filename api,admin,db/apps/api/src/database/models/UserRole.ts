/**
 * User Role Model (Junction Table)
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// UserRole attributes
export interface UserRoleAttributes {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface UserRoleCreationAttributes
  extends Optional<UserRoleAttributes, 'id' | 'assigned_by' | 'created_at' | 'updated_at'> {}

// UserRole model class
export class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  declare id: string;
  declare user_id: string;
  declare role_id: string;
  declare assigned_by?: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initUserRole(sequelize: Sequelize) {
  UserRole.init(
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
          model: 'admin_users',
          key: 'id'
        }
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        }
      },
      assigned_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'admin_users',
          key: 'id'
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
      tableName: 'user_roles',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return UserRole;
}

export default UserRole;

