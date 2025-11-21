/**
 * Geo Settlement Model
 * Represents settlements within a city/district
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface GeoSettlementAttributes {
  id: number;
  name: string;
  city_district_id: number;
  type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: Date;
  updated_at: Date;
}

export type GeoSettlementCreationAttributes = Optional<
  GeoSettlementAttributes,
  'id' | 'type' | 'latitude' | 'longitude' | 'created_at' | 'updated_at'
>;

export class GeoSettlement
  extends Model<GeoSettlementAttributes, GeoSettlementCreationAttributes>
  implements GeoSettlementAttributes
{
  declare id: number;
  declare name: string;
  declare city_district_id: number;
  declare type: string | null | undefined;
  declare latitude?: number | null;
  declare longitude?: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initGeoSettlement(sequelize: Sequelize) {
  GeoSettlement.init(
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
      type: {
        type: DataTypes.STRING(100),
        allowNull: true
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
      tableName: 'geo_settlements',
      underscored: true,
      indexes: [
        {
          fields: ['city_district_id'],
          name: 'idx_geo_settlements_city_district_id'
        },
        {
          unique: true,
          fields: ['city_district_id', 'name'],
          name: 'idx_geo_settlements_city_district_name'
        }
      ]
    }
  );

  return GeoSettlement;
}

export default GeoSettlement;


