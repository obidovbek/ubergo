/**
 * Geo City District Model
 * Represents cities or districts within a province
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface GeoCityDistrictAttributes {
  id: number;
  name: string;
  province_id: number;
  latitude?: number | null;
  longitude?: number | null;
  created_at: Date;
  updated_at: Date;
}

export type GeoCityDistrictCreationAttributes = Optional<
  GeoCityDistrictAttributes,
  'id' | 'latitude' | 'longitude' | 'created_at' | 'updated_at'
>;

export class GeoCityDistrict
  extends Model<GeoCityDistrictAttributes, GeoCityDistrictCreationAttributes>
  implements GeoCityDistrictAttributes
{
  declare id: number;
  declare name: string;
  declare province_id: number;
  declare latitude?: number | null;
  declare longitude?: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initGeoCityDistrict(sequelize: Sequelize) {
  GeoCityDistrict.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      province_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'geo_provinces',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'geo_city_districts',
      underscored: true,
      indexes: [
        {
          fields: ['province_id'],
          name: 'idx_geo_city_districts_province_id'
        },
        {
          unique: true,
          fields: ['province_id', 'name'],
          name: 'idx_geo_city_districts_province_name'
        }
      ]
    }
  );

  return GeoCityDistrict;
}

export default GeoCityDistrict;


