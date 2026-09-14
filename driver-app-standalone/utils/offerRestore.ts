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
  /**
   * The QFY, or null for "anywhere in this district" — T-102c-3.
   *
   * ⚠️ ALWAYS PRESENT, null included. Until this step the key was simply absent, which made
   * "no QFY" and "this field does not exist" two different shapes on the wire and invited the
   * `hasOwnProperty` test that used to stand in the checker. One shape, one meaning.
   */
  settlement_id: number | null;
}

/**
 * T-102c-3 — CAN this endpoint name a QFY at all?
 *
 * 🛑 Only when it names exactly ONE district (owner decision ①, 2026-09-14). A driver who lists
 * several districts is saying "anywhere in these", and `LOOSE_PARENT_MATCH` on the API already
 * matches that against an adm3 order at `'district'` precision — so nothing is lost, and the
 * grouped multi-district picker the artboard's `"<tuman> / <QFY>"` key shape implies stays
 * unbuilt. The row shape already carries both, so it can be added later with no data change.
 *
 * ⚠️ Exported because `GeoSheet` asks it whether to offer the QFY step. The rule lives HERE and
 * not in the component: a rule inside a component is a rule no checker in this project can
 * execute — the lesson `mergeScopeRoot` cost on T-114.
 */
export const canPickSettlements = (districts: readonly { id: number }[]): boolean =>
  districts.length === 1;

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
 * 🔴 T-102c-3 — THE QFYs, AND THE ROW THEY DO *NOT* PRODUCE. One row per (district, QFY): a
 * district with no QFY is one row with a null settlement, a district with QFYs A and B is two
 * rows and **no third row for the district itself**. That omission is the rule, not an oversight
 * — `LOOSE_PARENT_MATCH`'s own doc says a driver who named QFY A did NOT say "anywhere in the
 * district", and the API's UNIQUE index keys on `(city, COALESCE(settlement, 0))`, so a stray
 * district-only row would survive dedupe and silently widen the offer back out.
 *
 * ⚠️ The QFYs are DROPPED, not honoured, when the endpoint names more than one district. The
 * sheet should never collect them in that state; this is the guarantee that the payload cannot
 * lie even if it does.
 */
export const buildOfferPlaces = <T extends { id: number }>(
  country: { id: number } | null,
  province: { id: number } | null,
  cities: T[],
  primary: T | null,
  settlements: readonly { id: number }[] = [],
): OfferPlaceIds[] => {
  const picked = cities.length > 0 ? cities : primary ? [primary] : [];

  const unique: T[] = [];
  for (const c of picked) if (!unique.some((u) => u.id === c.id)) unique.push(c);

  const districtRow = (city: T): OfferPlaceIds => ({
    country_id: country?.id ?? null,
    province_id: province?.id ?? null,
    city_id: city.id,
    settlement_id: null,
  });

  if (!canPickSettlements(unique)) return unique.map(districtRow);

  const qfys: { id: number }[] = [];
  for (const s of settlements) if (!qfys.some((u) => u.id === s.id)) qfys.push(s);
  if (qfys.length === 0) return unique.map(districtRow);

  const [only] = unique;
  return qfys.map((qfy) => ({ ...districtRow(only), settlement_id: qfy.id }));
};

export const stopBelongsToEndpoint = (
  stop: { countryId?: string | null; provinceId?: string | null },
  endpoint: { countryId?: string | null; provinceId?: string | null },
): boolean => {
  if (!stop.countryId || !stop.provinceId) return false;
  if (!endpoint.countryId || !endpoint.provinceId) return false;
  return stop.countryId === endpoint.countryId && stop.provinceId === endpoint.provinceId;
};
