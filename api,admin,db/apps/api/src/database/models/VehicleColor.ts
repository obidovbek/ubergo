/**
 * Vehicle Color Model
 * Stores vehicle colors (e.g., White, Black, Silver, etc.)
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Vehicle Color attributes
export interface VehicleColorAttributes {
  id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  hex_code?: string | null; // Color hex code for UI display
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface VehicleColorCreationAttributes
  extends Optional<VehicleColorAttributes, 'id' | 'name_uz' | 'name_ru' | 'name_en' | 'hex_code' | 'is_active' | 'sort_order' | 'created_at' | 'updated_at'> {
  name: string;
}

// Vehicle Color model class
export class VehicleColor extends Model<VehicleColorAttributes, VehicleColorCreationAttributes> implements VehicleColorAttributes {
  declare id: string;
  declare name: string;
  declare name_uz?: string | null;
  declare name_ru?: string | null;
  declare name_en?: string | null;
  declare hex_code?: string | null;
  declare is_active: boolean;
  declare sort_order: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initVehicleColor(sequelize: Sequelize) {
  VehicleColor.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      name_uz: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      name_ru: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      name_en: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      hex_code: {
        type: DataTypes.STRING(7), // #RRGGBB format
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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
      tableName: 'vehicle_colors',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['name']
        },
        {
          fields: ['is_active']
        },
        {
          fields: ['sort_order']
        }
      ]
    }
  );

  return VehicleColor;
}

export default VehicleColor;

