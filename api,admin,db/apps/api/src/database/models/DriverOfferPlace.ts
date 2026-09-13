/**
 * Driver Offer Place — WHERE an offer picks up and drops off, as geo ids. T-102c.
 *
 * 🔴 ROWS, NOT COLUMNS, AND THAT IS THE WHOLE POINT OF THE TABLE. A passenger's order is one
 * path per direction (all four `UserBuyurtma*` boards single-select), so `PassengerOffer` keeps
 * scalar `from_/to_*_id` columns. A driver's offer is one province and then a SET of districts
 * per direction — `DriverElon.dc.html` toggles them, and the wizard has multi-selected into
 * `selectedFromCities` / `selectedToCities` all along. A scalar column can hold one of those.
 *
 * WHAT A ROW IS:
 *   • a district chosen with no QFY        → one row, `settlement_id` NULL
 *   • a district chosen with QFYs A and B  → two rows, each carrying the district
 * A NULL `settlement_id` means "anywhere in this district" — the driver's actual statement, and
 * what `LOOSE_PARENT_MATCH` in `utils/geoMatch.ts` reads.
 *
 * ⚠️ `driver_offers.from_text` / `to_text` are KEPT and still written: they are what the apps
 * DISPLAY, an old client still sends only them, and an offer with no rows here falls back to
 * the old text search (T-102e).
 *
 * ⚠️ BIGINT on the geo columns mirrors `passenger_offers` field for field; `offer_id` is BIGINT
 * against an INTEGER `driver_offers.id`, which is what the migration wrote and what Postgres
 * accepts (int8 = int4 exists). Declared `number` here, as `PassengerOffer` declares its own.
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type DriverOfferPlaceDirection = 'from' | 'to';

export interface DriverOfferPlaceAttributes {
  id: number;
  offer_id: number;
  direction: DriverOfferPlaceDirection;
  country_id?: number | null;
  province_id?: number | null;
  city_id?: number | null;
  settlement_id?: number | null;
  created_at: Date;
}

export interface DriverOfferPlaceCreationAttributes
  extends Optional<
    DriverOfferPlaceAttributes,
    'id' | 'country_id' | 'province_id' | 'city_id' | 'settlement_id' | 'created_at'
  > {}

export class DriverOfferPlace
  extends Model<DriverOfferPlaceAttributes, DriverOfferPlaceCreationAttributes>
  implements DriverOfferPlaceAttributes
{
  declare id: number;
  declare offer_id: number;
  declare direction: DriverOfferPlaceDirection;
  declare country_id?: number | null;
  declare province_id?: number | null;
  declare city_id?: number | null;
  declare settlement_id?: number | null;
  declare readonly created_at: Date;

  declare createdAt: Date;
}

export function initDriverOfferPlace(sequelize: Sequelize) {
  const geoColumn = (model: string) => ({
    type: DataTypes.BIGINT,
    allowNull: true,
    references: { model, key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });

  DriverOfferPlace.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      offer_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'driver_offers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      direction: {
        type: DataTypes.ENUM('from', 'to'),
        allowNull: false
      },
      country_id: geoColumn('geo_countries'),
      province_id: geoColumn('geo_provinces'),
      city_id: geoColumn('geo_city_districts'),
      settlement_id: geoColumn('geo_settlements'),
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at'
      }
    },
    {
      sequelize,
      tableName: 'driver_offer_places',
      /*
       * 🔴 `updated_at` DOES NOT EXIST on this table — the migration wrote `created_at` only,
       * because a place is never edited in situ: an edit deletes the offer's rows and writes
       * the new set. Leaving Sequelize's default `timestamps: true` here would make every
       * INSERT name a column that is not there.
       */
      timestamps: true,
      updatedAt: false,
      underscored: true,
      createdAt: 'created_at'
    }
  );

  return DriverOfferPlace;
}

export default DriverOfferPlace;
