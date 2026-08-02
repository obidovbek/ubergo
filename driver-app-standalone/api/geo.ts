/**
 * Geo API
 *
 * Re-export shim. The geo client already lives in `./driver` — this file exists
 * so `SearchPassengerOffersScreen` can `import * as GeoAPI from '../api/geo'`
 * (the same module path the user app uses) without a second copy of the client
 * that would drift out of sync. Add new geo calls to `./driver`, not here.
 */

export type { GeoOption } from './driver';
export {
  fetchGeoCountries,
  fetchGeoProvinces,
  fetchGeoCityDistricts,
  // The deeper levels were implemented in ./driver but never re-exported here,
  // so no driver screen could reach the data the admin panel already holds
  // (OR-011 item 3). All three hang off the CITY DISTRICT — administrative area,
  // settlement and mahalla are siblings, not a chain.
  fetchGeoAdministrativeAreas,
  fetchGeoSettlements,
  fetchGeoNeighborhoods,
} from './driver';
