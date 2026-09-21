/**
 * T-127 — does an order reach the depth its scope matches at, and when do we ask?
 *
 * 🔴 WHY THIS IS A MODULE AND NOT A PRIVATE METHOD ON `PassengerOfferService`.
 * A service imports Sequelize models, and this project's suite covers DB-free modules only
 * (CLAUDE.md) — so logic left inside the service is **untestable**. The same reasoning put
 * `groupPlaceRows` here in T-102i and `utils/scopeRoot.ts` in the user app. The rule below has
 * a failure mode that renders as a perfectly ordinary 400 on a perfectly valid order, which is
 * precisely the kind that has to be executed rather than reviewed.
 *
 * ⚠️ **The scope rules themselves are NOT here.** What each scope demands lives in
 * `geoMatch.validateScope`, where it has been since 2026-09-12. This module decides only
 * WHEN to ask it and WHICH message the answer becomes.
 */

import {
  isOrderScope,
  matchLevelFor,
  validateScope,
  type GeoPathIds,
  type OrderScope,
  type ScopeProblem
} from './geoMatch.js';

/**
 * 🔴 THE TRAP THIS FUNCTION EXISTS FOR — and it is the second time this exact thing has bitten.
 *
 * Every geo id on `passenger_offers` is **BIGINT**, and `pg` returns BIGINT as a **string**
 * (there is no `setTypeParser` override in this project — `DriverOfferService.ts:168` says so,
 * written when T-102i hit the same wall on `driver_offer_places`). The model declares these
 * columns `number | null`, so TypeScript reports nothing: the lie is only true at runtime.
 *
 * On an UPDATE the two sides therefore arrive in different types — `parseId` makes the patch's
 * ids NUMBERS, while the stored row's are STRINGS — and `validateScope` compares with `!==`.
 * `10 !== '10'` is true, so a passenger editing a perfectly valid `Tuman ichi` order would be
 * told its two endpoints are in different districts and refused. Not a mislabel like T-102i's:
 * a **wrong refusal on a correct order**, with a message that cannot be acted on.
 *
 * ⚠️ Every test here feeds ids as strings on at least one side, because that is what pg sends.
 */
export const toGeoId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/** The columns `validateScope` reads, per direction. */
const SIDE_KEYS = ['province_id', 'city_id', 'settlement_id'] as const;

/** A row or patch, with ids in whatever shape their source sends them. */
export type ScopeFields = Record<string, unknown>;

const sideOf = (row: ScopeFields, direction: 'from' | 'to'): GeoPathIds => ({
  province_id: toGeoId(row[`${direction}_province_id`]),
  city_id: toGeoId(row[`${direction}_city_id`]),
  settlement_id: toGeoId(row[`${direction}_settlement_id`])
});

/**
 * The fields whose change re-opens the scope question on an update.
 *
 * ⚠️ `*_country_id` is deliberately absent: no scope rule reads it (`validateScope` compares
 * province, city and settlement), so changing it can neither satisfy nor break a scope, and
 * listing it would refuse an edit for a reason the rule cannot explain.
 */
export const SCOPE_SENSITIVE_FIELDS: readonly string[] = [
  'match_scope',
  ...(['from', 'to'] as const).flatMap((d) => SIDE_KEYS.map((k) => `${d}_${k}`))
];

/**
 * Did this patch actually MOVE the route or the ride type — by value, not by presence?
 *
 * 🔴 Presence is not enough. The order form re-sends the whole form on every save, so
 * `'from_city_id' in patch` is true even when the passenger only touched the price. Comparing
 * values is what makes decision ①'s promise real.
 */
export const scopeSensitiveChange = (
  patch: ScopeFields,
  stored: ScopeFields
): boolean =>
  SCOPE_SENSITIVE_FIELDS.some((key) => {
    if (!(key in patch)) return false;
    if (key === 'match_scope') return (patch[key] ?? null) !== (stored[key] ?? null);
    return toGeoId(patch[key]) !== toGeoId(stored[key]);
  });

/**
 * Which problem names the error when an order has several.
 *
 * A missing endpoint is the one the passenger can act on directly, so it is reported before the
 * relational problems; `from` before `to`, the order of the form. Fixed rather than "whatever
 * `validateScope` happened to push first", so the same broken order always produces the same
 * sentence — a message that moves when the rule's internals are reordered is one nobody can
 * write a test, or a support answer, against.
 */
export const SCOPE_PROBLEM_ORDER: readonly ScopeProblem[] = [
  'missing_from',
  'missing_to',
  'different_province',
  'different_district',
  'same_district'
];

/**
 * The key for one problem under one scope.
 *
 * ⚠️ A missing endpoint means a different thing per scope — a district for `aro` / `viloyat`, a
 * QFY for `tuman` / `yaqin` — so the level is baked into the KEY. It cannot be a parameter:
 * `errorHandler` interpolates `messageParams` *after* translating, and the request's language is
 * not known at the throw site, so a level word passed as a param would arrive untranslated.
 */
export const scopeMessageKey = (
  problem: ScopeProblem,
  scope: OrderScope
): string =>
  problem === 'missing_from' || problem === 'missing_to'
    ? `offers.scope_${problem}_${matchLevelFor(scope)}`
    : `offers.scope_${problem}`;

/**
 * 🔴 THE EMPTY-QFY ESCAPE — owner decision ②, 2026-09-21. Request-only, never stored.
 *
 * A district can genuinely have no QFY rows. The app opens its picker straight at the QFY level
 * for `tuman` / `yaqin`, so with nothing to show, that district would become **unorderable** the
 * moment a QFY is required — the picker cannot satisfy the rule it is being held to. The app is
 * the only party that can see this (it received the empty list), so it says so with
 * `from_/to_settlement_unavailable` on the request.
 *
 * ⚠️ **It is a claim, not a column.** Nothing persists it and nothing needs to: it only relaxes
 * a rule that protects the passenger from getting less precision than they asked for, and the
 * order then matches at the district for that side — which is exactly what `getPublicOffers`
 * already does with a side that named no QFY (T-102i). It is not a security boundary, so
 * trusting the client with it costs nothing that matters.
 *
 * ⚠️ **Only `missing_*` at adm3, only for the side that claimed it.** A relational problem is a
 * contradiction whatever the QFY lists contain, and a missing DISTRICT is a fault rather than a
 * fact — every province has districts. This is applied AFTER `validateScope`, never inside it,
 * so the rule itself stays identical to the app's and `shared/scope-cases.json` keeps meaning
 * what it says.
 */
export const relaxUnavailable = (
  problems: ScopeProblem[],
  patch: ScopeFields,
  scope: OrderScope
): ScopeProblem[] => {
  if (matchLevelFor(scope) !== 'adm3') return problems;
  return problems.filter(
    (p) =>
      !(p === 'missing_from' && patch.from_settlement_unavailable === true) &&
      !(p === 'missing_to' && patch.to_settlement_unavailable === true)
  );
};

export interface ScopeVerdict {
  scope: OrderScope;
  problems: ScopeProblem[];
  /** The i18n key for the problem that names the refusal. */
  messageKey: string;
}

/**
 * Should this write be refused, and with what?
 *
 * `null` means "let it through" and covers three cases worth naming:
 *   ① the merged row claims **no scope** — a pre-T-102d order promises nothing, and inferring a
 *     scope from its geo was rejected as a guess in T-114;
 *   ② an update that moved **neither the route nor the scope** — decision ① (owner, 2026-09-21):
 *     a passenger changing the price is not held hostage by geo they never touched;
 *   ③ the order satisfies its scope.
 *
 * ⚠️ Case ② is what keeps orders created 2026-09-13…2026-09-21 editable: they can legitimately
 * be `tuman` with no QFY, because nothing ever asked for one. It does NOT let a client move such
 * an order INTO `tuman` for free — changing `match_scope` is itself a scope-sensitive change.
 */
export const scopeVerdict = (
  patch: ScopeFields,
  stored: ScopeFields | null
): ScopeVerdict | null => {
  const merged: ScopeFields = { ...(stored ?? {}), ...patch };

  const scope = merged.match_scope;
  if (!isOrderScope(scope)) return null; // ①

  if (stored !== null && !scopeSensitiveChange(patch, stored)) return null; // ②

  const problems = relaxUnavailable(
    validateScope(
      { from: sideOf(merged, 'from'), to: sideOf(merged, 'to') },
      scope
    ),
    patch,
    scope
  );
  if (problems.length === 0) return null; // ③

  const named = SCOPE_PROBLEM_ORDER.find((p) => problems.includes(p))!;
  return { scope, problems, messageKey: scopeMessageKey(named, scope) };
};
