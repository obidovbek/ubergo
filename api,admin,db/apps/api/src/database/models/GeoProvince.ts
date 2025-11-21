/**
 * Geo Province Model
 * Represents provinces (regions) within a country
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface GeoProvinceAttributes {
  id: number;
  name: string;
  country_id: number;
  latitude?: number | null;
  longitude?: number | null;
  created_at: Date;
  updated_at: Date;
}

export type GeoProvinceCreationAttributes = Optional<
  GeoProvinceAttributes,
  'id' | 'latitude' | 'longitude' | 'created_at' | 'updated_at'
>;

export class GeoProvince
  extends Model<GeoProvinceAttributes, GeoProvinceCreationAttributes>
  implements GeoProvinceAttributes
{
  declare id: number;
  declare name: string;
  declare country_id: number;
  declare latitude?: number | null;
  declare longitude?: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initGeoProvince(sequelize: Sequelize) {
  GeoProvince.init(
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
      country_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'geo_countries',
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
      tableName: 'geo_provinces',
      underscored: true,
      indexes: [
        {
          fields: ['country_id'],
          name: 'idx_geo_provinces_country_id'
        },
        {
          unique: true,
          fields: ['country_id', 'name'],
          name: 'idx_geo_provinces_country_name'
        }
      ]
    }
  );

  return GeoProvince;
}

export default GeoProvince;


