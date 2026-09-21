/**
 * Does an order reach the depth its scope matches at? T-127 (T-114 ②).
 *
 * 🔴 WHY THIS IS A MODULE AND NOT THREE IFS INSIDE `validateForm`. A component imports
 * react-native, and a react-native import cannot be bundled for `--platform=neutral` — so
 * anything living in one is UNTESTABLE by this project's checkers. `utils/scopeRoot.ts` exists
 * for exactly this reason and says exactly this. The rule below decides whether a passenger's
 * order is accepted at all, and getting it wrong in the lenient direction is invisible: the
 * order posts, the server refuses it, and the passenger sees a failure they cannot place.
 *
 * 🔴 THE SECOND READER. The API holds the same rule in `utils/geoMatch.validateScope`, and there
 * is no shared package between the two — the apps were split out of the monorepo on purpose. Two
 * readers of one rule drifting apart is precisely what cost T-123 and T-116, so the two are held
 * together by **one case table both suites execute**: `shared/scope-cases.json`, run here by
 * `scripts/check-scope-completeness.mjs` and there by `utils/scopeGuard.test.ts`. Change the rule
 * on one side and the other goes red.
 *
 * ⚠️ THE PROBLEM NAMES ARE PART OF THE CONTRACT. They are the API's own (`ScopeProblem`), so the
 * shared table can be read by both. Renaming one here silently breaks the parity check.
 */

import { ORDER_SCOPES, type OrderScope } from '../types/orderScope';

export type ScopeProblem =
  | 'missing_from'
  | 'missing_to'
  | 'different_province'
  | 'different_district'
  | 'same_district';

/** The adm level a scope matches at. */
export type MatchLevel = 'adm2' | 'adm3';

/** One endpoint's ids. Levels the passenger has not chosen are null/undefined. */
export interface ScopeSide {
  province_id?: number | null;
  city_id?: number | null;
  settlement_id?: number | null;
  /**
   * 🔴 The district genuinely offers NO QFY list — owner decision ②, 2026-09-21.
   *
   * ⚠️ This is a claim only the CLIENT can make: it opened the picker at the QFY level and the
   * server sent back an empty list. Without it, requiring a QFY would make such a district
   * **unorderable** — `GeoSheet` opens at `settlement` for `tuman`, and with nothing to show,
   * Back is pinned by the root card and the only exit is closing the sheet.
   *
   * ⚠️ It is NOT part of the rule, and deliberately not part of `shared/scope-cases.json`: it
   * relaxes the rule's answer afterwards (`orderProblems`), so the rule itself stays identical
   * on both sides and the parity table keeps meaning what it says.
   */
  settlementUnavailable?: boolean;
}

/**
 * ⚠️ Derived from `ORDER_SCOPES`, never re-listed. That table already carries `matchLevel` for
 * all four scopes and has since T-101 step 8; writing the mapping out a second time here is how
 * the two would come to disagree about `yaqin`.
 */
export const matchLevelFor = (scope: OrderScope): MatchLevel =>
  (ORDER_SCOPES.find((s) => s.key === scope)?.matchLevel as MatchLevel) ?? 'adm2';

const idAt = (side: ScopeSide, level: MatchLevel): number | null | undefined =>
  level === 'adm2' ? side.city_id : side.settlement_id;

/**
 * Everything wrong with this order under this scope. Empty = the order can be posted.
 *
 * ⚠️ Mirrors `geoMatch.validateScope` branch for branch, including two behaviours that read
 * like mistakes and are not:
 *   · an ABSENT province reports as `different_province`, not as a missing level — the scope's
 *     promise is "both ends in one province", and an unknown province does not keep it;
 *   · `same_district` fires only when BOTH districts are known, so a half-filled `yaqin` order
 *     reports the missing QFY and nothing else.
 */
export const scopeProblems = (
  from: ScopeSide,
  to: ScopeSide,
  scope: OrderScope,
): ScopeProblem[] => {
  const problems: ScopeProblem[] = [];
  const level = matchLevelFor(scope);

  if (idAt(from, level) == null) problems.push('missing_from');
  if (idAt(to, level) == null) problems.push('missing_to');

  const fromCity = from.city_id;
  const toCity = to.city_id;

  if (scope === 'viloyat') {
    const a = from.province_id;
    const b = to.province_id;
    if (a == null || b == null || a !== b) problems.push('different_province');
  }

  if (scope === 'tuman') {
    if (fromCity == null || toCity == null || fromCity !== toCity) {
      problems.push('different_district');
    }
  }

  if (scope === 'yaqin') {
    if (fromCity != null && toCity != null && fromCity === toCity) {
      problems.push('same_district');
    }
  }

  return problems;
};

/**
 * The rule's answer, with the empty-QFY escape applied — what the FORM actually asks.
 *
 * 🔴 Only a `missing_*` at adm3 can be relaxed, and only for the side that saw the empty list.
 * A relational problem is never relaxed: two endpoints in different districts under *Tuman ichi*
 * is a contradiction whatever the QFY lists look like. Nor is a missing DISTRICT — every
 * province has districts, so an empty list there is a fault, not a fact.
 *
 * ⚠️ The order is then matched at the district for that side, which is what T-102i's server
 * already does with a side that named no QFY. The strip must say so
 * (`scopeMatchDistrictFallback`) — a passenger who asked for QFY precision and is quietly given
 * district precision is the defect this whole card exists to remove.
 */
export const orderProblems = (
  from: ScopeSide,
  to: ScopeSide,
  scope: OrderScope,
): ScopeProblem[] => {
  const problems = scopeProblems(from, to, scope);
  if (matchLevelFor(scope) !== 'adm3') return problems;
  return problems.filter(
    (p) =>
      !(p === 'missing_from' && from.settlementUnavailable) &&
      !(p === 'missing_to' && to.settlementUnavailable),
  );
};

/** Is this order being matched one level shallower than its scope promises? */
export const matchesShallower = (
  from: ScopeSide,
  to: ScopeSide,
  scope: OrderScope,
): boolean =>
  matchLevelFor(scope) === 'adm3' &&
  ((from.settlementUnavailable === true && from.settlement_id == null) ||
    (to.settlementUnavailable === true && to.settlement_id == null));

/**
 * Which field a problem marks. Relational problems mark BOTH endpoints, because neither one is
 * wrong on its own — it is the pair that fails — and marking only the second would read as "the
 * destination is invalid", which it is not.
 */
export const fieldsForProblem = (
  problem: ScopeProblem,
): ('from_text' | 'to_text')[] => {
  if (problem === 'missing_from') return ['from_text'];
  if (problem === 'missing_to') return ['to_text'];
  return ['from_text', 'to_text'];
};

/**
 * The i18n key naming a problem to the passenger.
 *
 * ⚠️ A missing endpoint means a different thing per scope — a district for `aro` / `viloyat`, a
 * QFY for `tuman` / `yaqin` — so the level is part of the key. The API builds the same suffixes
 * for its own messages (`scopeGuard.scopeMessageKey`); these are the app's own strings, shown
 * before any request is made.
 */
export const scopeProblemKey = (
  problem: ScopeProblem,
  scope: OrderScope,
): string =>
  problem === 'missing_from' || problem === 'missing_to'
    ? `passengerOffers.scope_${problem}_${matchLevelFor(scope)}`
    : `passengerOffers.scope_${problem}`;

/**
 * The MATCH strip's line when the order is complete — what this scope will actually search on.
 * Two keys, not four: the strip states the LEVEL, and `aro` and `viloyat` share one.
 */
export const scopeMatchKey = (scope: OrderScope): string =>
  `passengerOffers.scopeMatchAt_${matchLevelFor(scope)}`;

/**
 * The first problem to say out loud, when an order has several. A missing endpoint is what the
 * passenger can act on directly, so it comes before the relational problems; `from` before `to`,
 * the order of the form. Same order as the API's `SCOPE_PROBLEM_ORDER`, so the app's line and
 * the server's refusal name the same thing.
 */
export const SCOPE_PROBLEM_ORDER: readonly ScopeProblem[] = [
  'missing_from',
  'missing_to',
  'different_province',
  'different_district',
  'same_district',
];

export const firstProblem = (problems: ScopeProblem[]): ScopeProblem | null =>
  SCOPE_PROBLEM_ORDER.find((p) => problems.includes(p)) ?? null;
