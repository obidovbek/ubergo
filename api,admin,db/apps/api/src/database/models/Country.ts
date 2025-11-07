/**
 * Country Model
 * Stores metadata about supported countries for phone registration
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type CountryPattern = 'uz' | 'ru' | 'generic';

export interface CountryAttributes {
  id: string;
  name: string;
  code: string;
  flag?: string | null;
  local_length: number;
  pattern: CountryPattern;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type CountryCreationAttributes = Optional<
  CountryAttributes,
  'id' | 'flag' | 'sort_order' | 'is_active' | 'created_at' | 'updated_at'
>;

export class Country
  extends Model<CountryAttributes, CountryCreationAttributes>
  implements CountryAttributes
{
  declare id: string;
  declare name: string;
  declare code: string;
  declare flag: string | null | undefined;
  declare local_length: number;
  declare pattern: CountryPattern;
  declare sort_order: number;
  declare is_active: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initCountry(sequelize: Sequelize) {
  Country.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(8),
        allowNull: false,
      },
      flag: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      local_length: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      pattern: {
        type: DataTypes.ENUM('uz', 'ru', 'generic'),
        allowNull: false,
        defaultValue: 'generic',
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'countries',
      underscored: true,
      indexes: [
        {
          fields: ['code'],
          name: 'idx_countries_code',
        },
        {
          fields: ['is_active'],
          name: 'idx_countries_is_active',
        },
        {
          fields: ['sort_order'],
          name: 'idx_countries_sort_order',
        },
      ],
    }
  );

  return Country;
}

export default Country;


