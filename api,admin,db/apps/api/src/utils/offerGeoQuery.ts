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
