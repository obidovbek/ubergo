/**
 * Geo Country Model
 * Represents countries for driver address hierarchy
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface GeoCountryAttributes {
  id: number;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: Date;
  updated_at: Date;
}

export type GeoCountryCreationAttributes = Optional<
  GeoCountryAttributes,
  'id' | 'latitude' | 'longitude' | 'created_at' | 'updated_at'
>;

export class GeoCountry extends Model<GeoCountryAttributes, GeoCountryCreationAttributes> implements GeoCountryAttributes {
  declare id: number;
  declare name: string;
  declare latitude?: number | null;
  declare longitude?: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initGeoCountry(sequelize: Sequelize) {
  GeoCountry.init(
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
      tableName: 'geo_countries',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['name'],
          name: 'idx_geo_countries_name'
        }
      ]
    }
  );

  return GeoCountry;
}

export default GeoCountry;


