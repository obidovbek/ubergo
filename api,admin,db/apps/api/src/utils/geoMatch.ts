/**
 * Geo matching — the rules behind the four order scopes. T-102.
 *
 * 🔴 WHY THIS IS A SEPARATE, PURE MODULE. The scopes have been specified since 2026-08-30 and
 * unimplemented since, because the search matched a place NAME as a substring. Getting the
 * semantics right is the whole card; expressing them as a `WHERE` clause is the easy part. So
 * the rules live here, with a test beside them, and `DriverOfferService` calls them.
 *
 * THE OWNER'S MODEL (`docs/PLAN-T101-SCOPES.md` §0/§1, restated verbatim 2026-09-12):
 *
 *   adm0 davlat   adm1 viloyat   adm2 tuman   adm3 QFY
 *
 *   aro      Viloyatlar aro   adm1+adm2 -> adm1+adm2   match adm2 -> adm2
 *   viloyat  Viloyat ichi     adm1 once, then adm2     match adm2 -> adm2, "uni ichki qismlari emas"
 *   tuman    Tuman ichi       adm1+adm2 once, adm3     match adm3 -> adm3
 *   yaqin    Yaqin            full path both sides     match adm3 -> adm3
 *
 * 🔴 THE TWO SIDES ARE NOT THE SAME SHAPE, AND THE FIRST DRAFT OF THIS FILE GOT THAT WRONG.
 * A passenger's ORDER is one path per direction — all four `UserBuyurtma*` artboards single-
 * select. A driver's OFFER is one province and then a SET of districts and a SET of QFYs per
 * direction — `DriverElon.dc.html` toggles them, and its sample offer leaves from *Farg'ona t.*
 * OR *Marg'ilon sh.* So the offer side here is a `PlaceSet`, and "equals" becomes "is one of".
 *
 * 🔴 IT STILL REDUCES TO ONE SENTENCE:
 *
 *   > An offer matches an order when, for BOTH directions independently, the order's node at
 *   > the order's match level is AMONG the offer's nodes at that level.
 *
 *   ① "uni ichki qismlari emas" needs no code. Comparing cities never looks at settlements.
 *   ② `aro` and `viloyat` are the SAME query — the owner said so. They differ in validation.
 *   ③ An offer MORE precise than the order matches for free: every place row carries its city.
 *   ④ `tuman` and `yaqin` are the same query (adm3), differing only in validation.
 *   ⑤ Direction is NOT symmetric. `from` matches `from`. An `OR` would offer a ride going the
 *      opposite way.
 *
 * 🔴 "CHEGARADOSH" IS NOT ENFORCED — corrected 2026-09-12 with the owner. The Yaqin artboard's
 * destination picker is the standard unfiltered one, and enforcing adjacency would leave a
 * passenger who wants QFY precision between two NON-adjacent districts with no scope at all
 * (Viloyatlar aro stops at adm2). So Yaqin = QFY precision on both ends, and the neighbours
 * table lists the origin's neighbours FIRST in the picker as a convenience (`neighborsFirst`),
 * never as a refusal. What Yaqin DOES refuse is the same district on both ends — that is
 * `tuman`, and letting it through would make the two scopes indistinguishable.
 *
 * ⚠️ ONE RULE IS NOT DERIVABLE FROM THE SPEC AND IS A PRODUCT CALL — see `LOOSE_PARENT_MATCH`.
 *
 * ⚠️ PURE. No Sequelize, no request, no `t()`. It decides; the service queries.
 */

// ---------------------------------------------------------------------------- types

export type OrderScope = 'aro' | 'viloyat' | 'tuman' | 'yaqin';
export type MatchLevel = 'adm2' | 'adm3';
export type Direction = 'from' | 'to';

export const ORDER_SCOPES: readonly OrderScope[] = ['aro', 'viloyat', 'tuman', 'yaqin'];

/** One place, as ids. Every level is optional — an old row has none. */
export interface GeoPathIds {
  country_id?: number | null;
  province_id?: number | null;
  city_id?: number | null;
  settlement_id?: number | null;
}

/** The passenger's order: ONE path per direction. */
export interface Journey {
  from: GeoPathIds;
  to: GeoPathIds;
}

/**
 * The driver's offer: a SET of places per direction, one entry per `driver_offer_places` row.
 * A place with `settlement_id` null means "anywhere in this district" — the driver chose the
 * district and named no QFY. A place WITH a settlement means exactly that QFY.
 */
export type PlaceSet = readonly GeoPathIds[];

export interface OfferPlaces {
  from: PlaceSet;
  to: PlaceSet;
}

/**
 * 🛑 THE ONE PRODUCT DECISION IN THIS FILE (plan §4 ①, recommended and taken 2026-09-12).
 *
 * An order asking at adm3 meets an offer whose place row named the district and no QFY.
 * Strict equality would find almost nothing until every driver fills a settlement, which
 * reads as a broken app. So a district-only place DOES match an adm3 order in that district.
 *
 * ⚠️ It applies ONLY to a place with a NULL settlement. A driver who named QFY A did NOT say
 * "anywhere in the district", so QFY A never loosely matches an order for QFY B.
 *
 * 🔴 THE CALLER MUST THEN SAY SO. `matchPrecision()` returns `'district'` for these, and the
 * card has to show it — otherwise the passenger believes a precision the driver never
 * promised. **Flip this to `false` and the rule becomes strict; nothing else changes.**
 */
export const LOOSE_PARENT_MATCH = true;

// ---------------------------------------------------------------------------- level

export const matchLevelFor = (scope: OrderScope): MatchLevel =>
  scope === 'tuman' || scope === 'yaqin' ? 'adm3' : 'adm2';

/** The column a level compares on. */
export const levelKey = (level: MatchLevel): 'city_id' | 'settlement_id' =>
  level === 'adm2' ? 'city_id' : 'settlement_id';

const idAt = (path: GeoPathIds, level: MatchLevel): number | null | undefined =>
  level === 'adm2' ? path.city_id : path.settlement_id;

// ---------------------------------------------------------------------------- matching

/** How one direction matched. `null` = it did not. */
export type DirectionHit = 'exact' | 'district' | null;

/**
 * One direction: is the order's node AMONG the offer's places at this level?
 *
 * Exported because the service builds its `EXISTS` subquery from the same shape.
 */
export const directionHit = (
  orderSide: GeoPathIds,
  offerSide: PlaceSet,
  level: MatchLevel,
): DirectionHit => {
  const wanted = idAt(orderSide, level);
  // An order that never named a node at this level cannot be matched on it.
  if (wanted == null) return null;

  if (offerSide.some((p) => idAt(p, level) === wanted)) return 'exact';

  // The offer only named the district — see LOOSE_PARENT_MATCH.
  if (level === 'adm3' && LOOSE_PARENT_MATCH) {
    const orderCity = orderSide.city_id;
    if (orderCity == null) return null;
    const districtOnly = offerSide.some(
      (p) => p.settlement_id == null && p.city_id != null && p.city_id === orderCity,
    );
    if (districtOnly) return 'district';
  }
  return null;
};

export const directionMatches = (
  orderSide: GeoPathIds,
  offerSide: PlaceSet,
  level: MatchLevel,
): boolean => directionHit(orderSide, offerSide, level) !== null;

/**
 * Does this offer serve this order?
 *
 * ⚠️ BOTH directions must match. This is the rule that makes the whole card correct, and the
 * one an `OR` would quietly destroy.
 */
export const matchesOrder = (order: Journey, offer: OfferPlaces, scope: OrderScope): boolean => {
  const level = matchLevelFor(scope);
  return (
    directionMatches(order.from, offer.from, level) &&
    directionMatches(order.to, offer.to, level)
  );
};

/**
 * How exact a match is, so the app can label it. `'exact'` when BOTH directions hit a place
 * that named the order's own level; `'district'` when either side was accepted by the loose
 * rule. `null` when there is no match.
 */
export const matchPrecision = (
  order: Journey,
  offer: OfferPlaces,
  scope: OrderScope,
): 'exact' | 'district' | null => {
  const level = matchLevelFor(scope);
  const a = directionHit(order.from, offer.from, level);
  const b = directionHit(order.to, offer.to, level);
  if (a === null || b === null) return null;
  return a === 'exact' && b === 'exact' ? 'exact' : 'district';
};

// ---------------------------------------------------------------------------- order validation

export type ScopeProblem =
  | 'missing_from'
  | 'missing_to'
  | 'different_province'
  | 'different_district'
  | 'same_district';

/**
 * Is this ORDER well formed for its scope? Returns the problems, empty when valid.
 *
 * ⚠️ `yaqin` requires the two districts to be DIFFERENT — the same district on both ends is
 * `tuman`, and letting it through would make the two scopes indistinguishable. It does NOT
 * require them to border (see the header). Nothing here reads the neighbours table.
 */
export const validateScope = (order: Journey, scope: OrderScope): ScopeProblem[] => {
  const problems: ScopeProblem[] = [];
  const level = matchLevelFor(scope);

  if (idAt(order.from, level) == null) problems.push('missing_from');
  if (idAt(order.to, level) == null) problems.push('missing_to');

  const fromCity = order.from.city_id;
  const toCity = order.to.city_id;

  if (scope === 'viloyat') {
    const a = order.from.province_id;
    const b = order.to.province_id;
    if (a == null || b == null || a !== b) problems.push('different_province');
  }

  if (scope === 'tuman') {
    if (fromCity == null || toCity == null || fromCity !== toCity) {
      problems.push('different_district');
    }
  }

  if (scope === 'yaqin') {
    if (fromCity != null && toCity != null && fromCity === toCity) problems.push('same_district');
  }

  return problems;
};

export const isScopeValid = (order: Journey, scope: OrderScope): boolean =>
  validateScope(order, scope).length === 0;

// ---------------------------------------------------------------------------- offer validation

export type OfferPlacesProblem =
  | 'from_empty'
  | 'to_empty'
  | 'from_mixed_province'
  | 'to_mixed_province'
  | 'from_no_district'
  | 'to_no_district';

const validateSide = (
  side: PlaceSet,
  direction: Direction,
): OfferPlacesProblem[] => {
  const problems: OfferPlacesProblem[] = [];
  if (side.length === 0) {
    problems.push(`${direction}_empty`);
    return problems;
  }
  // Every place must name its district — the matcher's adm2 probe reads it, and the loose
  // rule depends on it. A settlement without a district is unreachable.
  if (side.some((p) => p.city_id == null)) problems.push(`${direction}_no_district`);

  // The artboard picks ONE province per direction (`tmpAdm1` is a scalar); the set is of
  // districts within it. Two provinces on one side is a corrupted row, not a wider offer.
  const provinces = new Set(side.map((p) => p.province_id).filter((x) => x != null));
  if (provinces.size > 1) problems.push(`${direction}_mixed_province`);
  return problems;
};

/** Is this OFFER's place set well formed? Mirrors `DriverElon`'s `sheetNext` (≥ 1 district). */
export const validateOfferPlaces = (offer: OfferPlaces): OfferPlacesProblem[] => [
  ...validateSide(offer.from, 'from'),
  ...validateSide(offer.to, 'to'),
];

// ---------------------------------------------------------------------------- neighbours

/**
 * The ONLY thing the neighbours table drives: the order of the destination picker in `yaqin`.
 * Districts bordering the origin come first, in their original order; everything else follows,
 * also in order. Nothing is removed. An empty table is a no-op, not an empty picker.
 */
export const neighborsFirst = <T extends { id: number }>(
  originCityId: number | null | undefined,
  districts: readonly T[],
  borders: (a: number, b: number) => boolean,
): T[] => {
  if (originCityId == null) return [...districts];
  const near: T[] = [];
  const rest: T[] = [];
  for (const d of districts) {
    if (d.id !== originCityId && borders(originCityId, d.id)) near.push(d);
    else rest.push(d);
  }
  return [...near, ...rest];
};

// ---------------------------------------------------------------------------- misc

export const isOrderScope = (v: unknown): v is OrderScope =>
  typeof v === 'string' && (ORDER_SCOPES as readonly string[]).includes(v);

/**
 * Can this order be matched by ids at all? A pre-T-102 row has none, and the service must
 * fall back to the old text search for it rather than returning nothing.
 */
export const hasMatchableIds = (order: Journey, scope: OrderScope): boolean => {
  const level = matchLevelFor(scope);
  return idAt(order.from, level) != null && idAt(order.to, level) != null;
};
