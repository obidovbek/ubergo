/**
 * Putting a saved offer's ENDPOINTS back onto the form — T-101 step 16e.
 *
 * 🛑 This module exists because of the warning `OfferWizardScreen` has carried since T-078:
 * a field that saves but never loads back means **the next save silently blanks it**.
 * Nothing errors, nothing is logged; the driver opens their own offer, presses save, and
 * loses data they never touched.
 *
 * 🔴 THE DEFECT THIS STEP FOUND, and the reason these rules are here rather than inline:
 * `loadExistingOffer` computed the multi-city selections correctly and then applied them
 * INSIDE `if (offer.stops && offer.stops.length > 0)`. A multi-city endpoint whose extra
 * cities all coincide with From/To — or any offer whose stops come back empty — parsed its
 * cities, dropped them on the floor, and rendered an endpoint with no selection behind it.
 *
 * Everything here is pure: no React, no react-native, no network. `parseLocationText` and
 * the geo fetches stay in the screen; what is decided from their RESULTS lives here, where
 * it can be executed by `scripts/check-offer-restore.mjs`.
 */

export interface RestoreGeoLike {
  /**
   * ⚠️ `string | number`, deliberately: `GeoOption.id` is a **number** while the stop
   * records are keyed by string ids. Comparison here is only ever `===` between two ids
   * of the same origin, so the union is safe and keeps the caller's own type flowing
   * through the generics rather than forcing a cast at every call site.
   */
  id: string | number;
  name: string;
}

/** One endpoint's resolved geo, as the screen holds it. */
export interface EndpointRestore<T extends RestoreGeoLike> {
  /** The single picked city — `null` whenever the endpoint names several. */
  city: T | null;
  /** Every named city. One entry for a single selection, 2+ for a multi-select. */
  cities: T[];
}

/**
 * Does this saved text name SEVERAL cities rather than one place?
 *
 * ⚠️ The shapes are genuinely different, which is what makes this decidable at all:
 * a single endpoint is written by `buildLocationText` as `city, province[, country]`,
 * while a multi-select is written as a bare `name, name, …` city list.
 *
 * The province/country words are the discriminator the screen has always used. It is a
 * heuristic on Uzbek place names, not a parse — kept verbatim from the screen so this
 * refactor changes no behaviour, and pinned by assertions so a future change is deliberate.
 */
export const namesMultipleCities = (text: string | null | undefined): boolean => {
  const parts = splitLocationParts(text);
  if (parts.length <= 1) return false;
  return !parts.some(
    (p) => p.toLowerCase().includes('viloyat') || p.toLowerCase().includes('respublik'),
  );
};

/** `"A, B , "` → `['A','B']`. Empty segments never become cities. */
export const splitLocationParts = (text: string | null | undefined): string[] =>
  (text ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

/**
 * Match each name in a multi-city text against the province's real cities.
 *
 * ⚠️ The three-way comparison (exact, contains, contained-by) is the screen's own and is
 * kept: saved text and the geo table disagree about suffixes often enough that an exact
 * match alone loses cities. Duplicates are dropped — the same city named twice is one city.
 */
export const matchCitiesByName = <T extends RestoreGeoLike>(
  names: string[],
  available: T[],
): T[] => {
  const found: T[] = [];
  for (const name of names) {
    const needle = name.toLowerCase();
    const hit = available.find((c) => {
      const hay = c.name.toLowerCase();
      return hay === needle || hay.includes(needle) || needle.includes(hay);
    });
    if (hit && !found.some((c) => c.id === hit.id)) found.push(hit);
  }
  return found;
};

/**
 * 🛑 THE FIX. Turn the cities gathered for one endpoint into the pair of states the form
 * renders — unconditionally, with no reference to stops.
 *
 * The convention is the screen's and is preserved exactly:
 *   • several cities → `city: null`, all of them in `cities`
 *   • exactly one    → that one in `city`, `cities` EMPTY
 *   • none           → both empty
 *
 * 🔴 The one-city case must clear `cities`, not leave it holding the single entry: the
 * render path treats a non-empty `cities` as a multi-select and would draw a joined list
 * for a plain single city.
 */
export const resolveEndpointRestore = <T extends RestoreGeoLike>(
  cities: T[],
): EndpointRestore<T> => {
  const unique: T[] = [];
  for (const c of cities) if (!unique.some((u) => u.id === c.id)) unique.push(c);

  if (unique.length === 0) return { city: null, cities: [] };
  if (unique.length === 1) return { city: unique[0], cities: [] };
  return { city: null, cities: unique };
};

/**
 * Is a stop returned by the API really an intermediate stop, or is it one of the extra
 * cities of a multi-city From/To that `handleSave` wrote into the stops list?
 *
 * 🔴 T-102c ENDED THE PRACTICE THIS DEFENDS AGAINST, BUT NOT THE NEED FOR IT. `handleSave`
 * used to append an endpoint's cities 2..n to the stops list (`fromStops`/`toStops`, both now
 * gone) because `driver_offers` has one `from_text`; they travel as ids in `from_places` /
 * `to_places` now. Offers saved BEFORE that change still carry the fake stops, and this is
 * what pulls them back out — so it stays until T-102g backfills them. On an offer that has
 * ids the screen skips this test entirely, or a real stop in the origin's province would be
 * swallowed into the origin.
 */
/** One place, as the wizard sends it. Mirrors the API's `CreateOfferPlaceData`. */
export interface OfferPlaceIds {
  country_id: number | null;
  province_id: number | null;
  city_id: number;
}

/**
 * T-102c — WHICH districts an endpoint SENDS, as ids. The inverse of `resolveEndpointRestore`,
 * and it exists in this module for exactly the same reason that one does.
 *
 * 🔴 THE TRAP IT ENCODES: `resolveEndpointRestore` deliberately CLEARS `cities` for a one-city
 * endpoint and puts that city in `city`. A caller reading only the array therefore sends
 * NOTHING for the commonest offer there is — one district to one district — and the offer
 * saves with no ids at all, silently falling back to the text search it was meant to replace.
 * Both shapes, one set.
 *
 * ⚠️ NO `settlement_id`. The wizard stops at `endLevel="district"` and cannot name a QFY yet
 * (T-102c step 3). A null settlement means "anywhere in this district" — precisely what a
 * driver who was never asked has said, and what `LOOSE_PARENT_MATCH` on the API reads.
 */
export const buildOfferPlaces = <T extends { id: number }>(
  country: { id: number } | null,
  province: { id: number } | null,
  cities: T[],
  primary: T | null,
): OfferPlaceIds[] => {
  const picked = cities.length > 0 ? cities : primary ? [primary] : [];

  const unique: T[] = [];
  for (const c of picked) if (!unique.some((u) => u.id === c.id)) unique.push(c);

  return unique.map((city) => ({
    country_id: country?.id ?? null,
    province_id: province?.id ?? null,
    city_id: city.id,
  }));
};

export const stopBelongsToEndpoint = (
  stop: { countryId?: string | null; provinceId?: string | null },
  endpoint: { countryId?: string | null; provinceId?: string | null },
): boolean => {
  if (!stop.countryId || !stop.provinceId) return false;
  if (!endpoint.countryId || !endpoint.provinceId) return false;
  return stop.countryId === endpoint.countryId && stop.provinceId === endpoint.provinceId;
};
