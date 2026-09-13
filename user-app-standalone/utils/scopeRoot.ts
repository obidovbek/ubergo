/**
 * The scope root, and how it combines with what the passenger has chosen. T-114 ①.
 *
 * 🔴 WHY THIS IS A MODULE AND NOT THREE LINES INSIDE `LocationCard`. A component imports
 * react-native, and a react-native import cannot be bundled for `--platform=neutral` — so
 * anything living in one is UNTESTABLE by this project's checkers. `utils/offerRestore.ts`
 * in the driver app exists for the same reason and says the same thing. The rule that ended
 * up here is one where getting the precedence backwards renders perfectly and describes the
 * wrong place, which is precisely the kind that has to be executed rather than reviewed.
 *
 * ⚠️ The geo type is structural, deliberately. Importing `GeoPath` from `components/geo/
 * GeoSheet` would tie this module to a file that pulls in react-native, undoing the point.
 */

/** One node of the geo cascade — only the fields this rule compares. */
export interface ScopeGeoNode {
  id: number;
  name: string;
}

/** A path through the cascade. Levels not chosen are undefined. */
export interface ScopeGeoPath {
  country?: ScopeGeoNode;
  province?: ScopeGeoNode;
  district?: ScopeGeoNode;
  settlement?: ScopeGeoNode;
}

/**
 * The scope's fixed ancestors, with anything the passenger actually chose taking precedence.
 *
 * 🔴 THE PRECEDENCE IS THE WHOLE RULE. The root is a FLOOR, not an override: re-opening a
 * half-filled endpoint must show what the passenger picked, not the root again. Spreading
 * the chosen path over the root instead would blank the root wherever a level is still
 * undefined, because `{...{province: X}, ...{province: undefined}}` keeps the undefined.
 */
export const mergeScopeRoot = (
  root: ScopeGeoPath | undefined,
  chosen: ScopeGeoPath,
): ScopeGeoPath => ({
  country: chosen.country ?? root?.country,
  province: chosen.province ?? root?.province,
  district: chosen.district ?? root?.district,
  settlement: chosen.settlement ?? root?.settlement,
});

/**
 * 🔴 THE PATH A SHEET MUST BE OPENED WITH — and the bug this function exists to prevent.
 *
 * `GeoSheet` loads a level only when the level ABOVE it is already in the path:
 * `else if (lvl === "province" && p.country)`. When that ancestor is missing it does not
 * throw and does not report an error — it sets an EMPTY LIST. So a sheet opened at
 * `province` with no country, or at `district` with no province, renders as a picker with
 * nothing in it, which is exactly what a genuinely empty region would look like.
 *
 * That is a device-reported defect (2026-09-13): *"tuman ichi -> Viloyat va tuman tanlang
 * shows nothing"*. The country is fixed to Uzbekistan and never shown (OR-004), so every
 * caller has to put it back into the path by hand; `LocationCard` always did, and the scope
 * root card did not. Making it a function means there is one place to get it right.
 *
 * ⚠️ The country is the FLOOR: anything already chosen wins, so re-opening a half-filled
 * sheet still shows the passenger's own picks.
 */
export const scopeSheetPath = (
  countryId: number | null,
  chosen: ScopeGeoPath,
): ScopeGeoPath =>
  mergeScopeRoot(
    countryId ? { country: { id: countryId, name: '' } } : undefined,
    chosen,
  );

/**
 * Did the root actually move? Used to decide whether to clear both endpoints.
 *
 * ⚠️ Re-opening the sheet and confirming the SAME place must not wipe work the passenger has
 * already done, so this compares ids rather than object identity — `GeoSheet` returns fresh
 * objects on every confirm, and `!==` on them would be true every time.
 */
export const scopeRootChanged = (
  before: ScopeGeoPath,
  after: ScopeGeoPath,
): boolean =>
  before.province?.id !== after.province?.id ||
  before.district?.id !== after.district?.id;
