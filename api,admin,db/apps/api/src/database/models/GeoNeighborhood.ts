/**
 * Geo Neighborhood Model
 * Represents neighborhoods (mahalla) within a city/district
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface GeoNeighborhoodAttributes {
  id: number;
  name: string;
  city_district_id: number;
  latitude?: number | null;
  longitude?: number | null;
  created_at: Date;
  updated_at: Date;
}

export type GeoNeighborhoodCreationAttributes = Optional<
  GeoNeighborhoodAttributes,
  'id' | 'latitude' | 'longitude' | 'created_at' | 'updated_at'
>;

export class GeoNeighborhood
  extends Model<GeoNeighborhoodAttributes, GeoNeighborhoodCreationAttributes>
  implements GeoNeighborhoodAttributes
{
  declare id: number;
  declare name: string;
  declare city_district_id: number;
  declare latitude?: number | null;
  declare longitude?: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initGeoNeighborhood(sequelize: Sequelize) {
  GeoNeighborhood.init(
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
      city_district_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'geo_city_districts',
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
      tableName: 'geo_neighborhoods',
      underscored: true,
      indexes: [
        {
          fields: ['city_district_id'],
          name: 'idx_geo_neighborhoods_city_district_id'
        },
        {
          unique: true,
          fields: ['city_district_id', 'name'],
          name: 'idx_geo_neighborhoods_city_district_name'
        }
      ]
    }
  );

  return GeoNeighborhood;
}

export default GeoNeighborhood;


