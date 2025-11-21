/**
 * Vehicle Model Model
 * Stores vehicle models (e.g., Cobalt, Camry, etc.) - belongs to VehicleMake
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// Vehicle Model attributes
export interface VehicleModelAttributes {
  id: string;
  vehicle_make_id: string;
  name: string;
  name_uz?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes
export interface VehicleModelCreationAttributes
  extends Optional<VehicleModelAttributes, 'id' | 'name_uz' | 'name_ru' | 'name_en' | 'is_active' | 'sort_order' | 'created_at' | 'updated_at'> {
  vehicle_make_id: string;
  name: string;
}

// Vehicle Model model class
export class VehicleModel extends Model<VehicleModelAttributes, VehicleModelCreationAttributes> implements VehicleModelAttributes {
  declare id: string;
  declare vehicle_make_id: string;
  declare name: string;
  declare name_uz?: string | null;
  declare name_ru?: string | null;
  declare name_en?: string | null;
  declare is_active: boolean;
  declare sort_order: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initVehicleModel(sequelize: Sequelize) {
  VehicleModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      vehicle_make_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vehicle_makes',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
      tableName: 'vehicle_models',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['vehicle_make_id']
        },
        {
          unique: true,
          fields: ['vehicle_make_id', 'name']
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

  return VehicleModel;
}

export default VehicleModel;

