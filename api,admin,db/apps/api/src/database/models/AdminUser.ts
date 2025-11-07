/**
 * Admin User Model
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Admin User attributes
export interface AdminUserAttributes {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  // Role removed - now using many-to-many relationship
  status: 'active' | 'inactive' | 'suspended';
  last_login_at?: Date | null;
  last_login_ip?: string | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface AdminUserCreationAttributes
  extends Optional<AdminUserAttributes, 'id' | 'status' | 'last_login_at' | 'last_login_ip' | 'created_by' | 'created_at' | 'updated_at'> {}

// Admin User model class
export class AdminUser extends Model<AdminUserAttributes, AdminUserCreationAttributes> implements AdminUserAttributes {
  declare id: string;
  declare email: string;
  declare password_hash: string;
  declare full_name: string;
  // Role removed - now using many-to-many relationship via user_roles
  declare status: 'active' | 'inactive' | 'suspended';
  declare last_login_at?: Date | null;
  declare last_login_ip?: string | null;
  declare created_by?: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initAdminUser(sequelize: Sequelize) {
  AdminUser.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: DataTypes.CITEXT,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      full_name: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      // Role removed - now using many-to-many relationship
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
        allowNull: false
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      last_login_ip: {
        type: DataTypes.INET,
        allowNull: true
      },
      created_by: {
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
      tableName: 'admin_users',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return AdminUser;
}

export default AdminUser;

