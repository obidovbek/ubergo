/**
 * Matching a passenger's search to a driver's offer BY ID, with the old text search kept as a
 * per-offer fallback. T-102e.
 *
 * 🔴 THE FALLBACK IS PER-OFFER, NOT PER-REQUEST, AND THAT IS THE WHOLE DESIGN.
 * `driver_offer_places` only started being written when T-102c shipped, so today almost every
 * offer in the database has no rows there. A request-level "use ids if the search has ids"
 * switch would therefore return nothing for a perfectly good search. The rule has to be read
 * offer by offer:
 *
 *   • the offer HAS place rows  → match on ids, and ignore its free text entirely
 *   • the offer has NONE        → fall back to `from_text ILIKE '%name%'`, exactly as before
 *
 * So a pre-T-102 offer keeps behaving the way it does today, a new offer is matched properly,
 * and the two coexist in one query with no backfill. T-102g can then convert the old rows at
 * its leisure — and *that* is what makes the backfill low-risk rather than urgent.
 *
 * ⚠️ RAW SQL, BECAUSE SEQUELIZE CANNOT EXPRESS THIS. The condition is a correlated EXISTS
 * against a child table combined with a NOT EXISTS on the same table; `where` objects have no
 * form for it. Everything interpolated is therefore escaped here, by this module, and the
 * tests below include the injection cases — an id that is not an integer is refused outright
 * rather than coerced, and a place name has its quotes doubled.
 *
 * ⚠️ PURE. It builds strings. No Sequelize, no connection — which is what lets it be tested at
 * all (CLAUDE.md: the suite covers DB-free modules only).
 */

import { LOOSE_PARENT_MATCH, type GeoPathIds } from './geoMatch.js';

export type Direction = 'from' | 'to';

/** The geo columns a search can constrain, shallowest first. */
export type PlaceLevel = 'province' | 'city' | 'settlement';

const COLUMN: Record<PlaceLevel, string> = {
  province: 'province_id',
  city: 'city_id',
  settlement: 'settlement_id',
};

/**
 * 🔴 An id that is not a positive integer is REFUSED, not coerced. `Number('1 OR 1=1')` is
 * NaN and would otherwise reach the SQL as the string "NaN"; silently dropping the condition
 * instead would widen the search, which is worse than failing.
 */
export const isSafeId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

/**
 * Postgres string literal escaping: a single quote is doubled. Place names really do contain
 * them in Uzbek — *Qo'qon*, *G'uzor*, *To'rtko'l* — so this is an everyday path, not a
 * hardening afterthought.
 */
export const quoteLiteral = (value: string): string => `'${value.replace(/'/g, "''")}'`;

/** `EXISTS` — this offer names the place at this level in this direction. */
export const placeExistsSql = (
  direction: Direction,
  level: PlaceLevel,
  id: number,
  offerIdRef: string,
): string => {
  if (!isSafeId(id)) throw new Error(`unsafe geo id: ${String(id)}`);
  return (
    `EXISTS (SELECT 1 FROM driver_offer_places dop ` +
    `WHERE dop.offer_id = ${offerIdRef} ` +
    `AND dop.direction = '${direction}' ` +
    `AND dop.${COLUMN[level]} = ${id})`
  );
};

/** `NOT EXISTS` — this offer has no place rows at all, so it predates T-102c. */
export const hasNoPlacesSql = (offerIdRef: string): string =>
  `NOT EXISTS (SELECT 1 FROM driver_offer_places dop2 WHERE dop2.offer_id = ${offerIdRef})`;

export interface DirectionFilter {
  /** The deepest id the passenger constrained, and the level it is at. */
  id?: number | undefined;
  level?: PlaceLevel | undefined;
  /** The place's NAME, for the fallback against the offer's free text. */
  name?: string | undefined;
  /** The column the fallback matches — `from_text` or `to_text`. */
  textColumn: string;
}

/**
 * One direction's condition: ids where the offer has them, text where it does not.
 *
 * Returns `null` when the passenger constrained nothing for this direction, so the caller adds
 * no condition at all rather than a tautology.
 */
export const directionMatchSql = (
  direction: Direction,
  filter: DirectionFilter,
  offerIdRef: string,
): string | null => {
  const byId =
    filter.id !== undefined && filter.level
      ? placeExistsSql(direction, filter.level, filter.id, offerIdRef)
      : null;

  const byText =
    filter.name && filter.name.trim() !== ''
      ? `${filter.textColumn} ILIKE ${quoteLiteral(`%${filter.name}%`)}`
      : null;

  if (!byId && !byText) return null;
  // No ids to match on (the caller knows only a name): the old behaviour, unconditionally.
  if (!byId) return `(${byText})`;
  // Ids but no name: nothing sensible to fall back to, so an old offer simply cannot match.
  if (!byText) return `(${byId})`;

  return `(${byId} OR (${hasNoPlacesSql(offerIdRef)} AND ${byText}))`;
};

// ---------------------------------------------------------------------------- adm3 — T-102i

/**
 * One place-row condition, as DATA: every named column must equal its value, `null` meaning
 * IS NULL. Data first, SQL second, so the parity test can evaluate the very clauses the SQL is
 * rendered from against `geoMatch.placeHit` — without a database.
 */
export type PlaceClause = Partial<Record<'city_id' | 'settlement_id', number | null>>;

const CLAUSE_COLUMNS: ReadonlySet<string> = new Set(['city_id', 'settlement_id']);

/**
 * The adm3 match for one direction, as clauses — a row matches when ANY holds. These are
 * `geoMatch.placeHit`'s two branches:
 *   ① exact — the row names the order's QFY;
 *   ② loose — the row names the order's DISTRICT and NO QFY (`LOOSE_PARENT_MATCH`). The
 *     `settlement_id: null` is the whole rule: a row naming a different QFY in the same
 *     district is not "anywhere in the district".
 * With no district id known, ② is omitted — narrower, never wider.
 */
export const adm3Clauses = (
  settlementId: number,
  cityId: number | undefined,
  loose: boolean = LOOSE_PARENT_MATCH,
): PlaceClause[] => [
  { settlement_id: settlementId },
  ...(loose && isSafeId(cityId) ? [{ settlement_id: null, city_id: cityId }] : []),
];

/** Does a place row satisfy a clause? The equality the SQL expresses, for the parity test. */
export const rowSatisfies = (row: GeoPathIds, clause: PlaceClause): boolean =>
  Object.entries(clause).every(
    ([column, value]) => (row[column as keyof GeoPathIds] ?? null) === value,
  );

/** A clause as an `EXISTS` over one direction's place rows. Ids are checked, columns listed. */
export const clauseExistsSql = (
  direction: Direction,
  clause: PlaceClause,
  offerIdRef: string,
): string => {
  const conditions = Object.entries(clause).map(([column, value]) => {
    if (!CLAUSE_COLUMNS.has(column)) throw new Error(`unknown place column: ${column}`);
    if (value === null) return `dop.${column} IS NULL`;
    if (!isSafeId(value)) throw new Error(`unsafe geo id: ${String(value)}`);
    return `dop.${column} = ${value}`;
  });
  if (conditions.length === 0) throw new Error('an empty clause would match every row');
  return (
    `EXISTS (SELECT 1 FROM driver_offer_places dop ` +
    `WHERE dop.offer_id = ${offerIdRef} ` +
    `AND dop.direction = '${direction}' ` +
    `AND ${conditions.join(' AND ')})`
  );
};

/** A `driver_offer_places` row as a raw query returns it. */
export interface PlaceRow {
  offer_id: number | string;
  direction: Direction;
  province_id?: number | string | null;
  city_id?: number | string | null;
  settlement_id?: number | string | null;
}

/**
 * Raw place rows → each offer's place set, ready for `geoMatch`.
 *
 * 🔴 BIGINT COMES BACK AS A STRING. `offer_id` and every geo column on `driver_offer_places`
 * are BIGINT, and `pg` returns BIGINT as TEXT in a raw row — while `DriverOffer.id` and the
 * search's ids are numbers. Unconverted, the lookup by offer never finds its rows and
 * `placeHit`'s `===` is never exact: every result would be labelled `district`, silently, with
 * nothing failing. Converted here, once, where it can be tested.
 */
export const groupPlaceRows = (
  rows: readonly PlaceRow[],
): Map<number, { from: GeoPathIds[]; to: GeoPathIds[] }> => {
  const idOf = (value: unknown): number | null =>
    value === null || value === undefined ? null : Number(value);
  const byOffer = new Map<number, { from: GeoPathIds[]; to: GeoPathIds[] }>();
  for (const row of rows) {
    const offerId = Number(row.offer_id);
    const entry = byOffer.get(offerId) ?? { from: [], to: [] };
    (row.direction === 'to' ? entry.to : entry.from).push({
      province_id: idOf(row.province_id),
      city_id: idOf(row.city_id),
      settlement_id: idOf(row.settlement_id),
    });
    byOffer.set(offerId, entry);
  }
  return byOffer;
};

export interface SettlementFilter {
  /** The order's QFY on this side. */
  settlementId: number;
  /** Its district — needed for the loose clause. */
  cityId?: number | undefined;
  /** The DISTRICT's name, for an offer with no place rows (a QFY name is rarely in free text). */
  districtName?: string | undefined;
  /** `from_text` or `to_text`. */
  textColumn: string;
}

/**
 * One direction at adm3: any clause's `EXISTS`; an offer with NO place rows falls back to its
 * free text on the district's name, exactly as `directionMatchSql` does at adm2 — and is later
 * labelled `district`, because it never named a village.
 */
export const settlementMatchSql = (
  direction: Direction,
  filter: SettlementFilter,
  offerIdRef: string,
): string => {
  if (!isSafeId(filter.settlementId)) throw new Error(`unsafe geo id: ${String(filter.settlementId)}`);
  const byId = adm3Clauses(filter.settlementId, filter.cityId)
    .map((clause) => clauseExistsSql(direction, clause, offerIdRef))
    .join(' OR ');
  const byText =
    filter.districtName && filter.districtName.trim() !== ''
      ? `${filter.textColumn} ILIKE ${quoteLiteral(`%${filter.districtName}%`)}`
      : null;
  return byText
    ? `((${byId}) OR (${hasNoPlacesSql(offerIdRef)} AND ${byText}))`
    : `(${byId})`;
};
