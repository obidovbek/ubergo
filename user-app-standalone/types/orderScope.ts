/**
 * The four order scopes — T-101 step 8.
 *
 * Lifted out of `MenuScreen` when step 8 gave the create screen a second reader: the
 * home carousel picks a scope and the order screen names itself after it, so one
 * definition now serves both. Duplicating the four keys across two screens is how the
 * labels and the routing drift apart.
 *
 * The four `UserBuyurtma*` artboards are ONE screen with a mode (owner, 2026-09-01);
 * measured, they differ in 22-78 lines out of ~138 KB — the subtitle, and how deep the
 * location sheet opens.
 *
 * ⚠️ `matchLevel` IS RECORDED BUT NOT SENT ANYWHERE. It is the adm level the backend
 * will match on once **T-102** exists (`DriverOffer` has no geo columns today and search
 * is an `ILIKE` on free text, so no scope can be honoured). It lives in code, beside the
 * labels it belongs to, rather than only in docs/PLAN-T101-SCOPES.md.
 *
 * **Do not read this as "the scopes are wired up".** All four still behave identically.
 */
export const ORDER_SCOPES = [
  { key: 'tuman', labelKey: 'menu.scopeTuman', matchLevel: 'adm3' },
  { key: 'aro', labelKey: 'menu.scopeAro', matchLevel: 'adm2' },
  { key: 'viloyat', labelKey: 'menu.scopeViloyat', matchLevel: 'adm2' },
  { key: 'yaqin', labelKey: 'menu.scopeYaqin', matchLevel: 'adm3' },
] as const;

export type OrderScope = (typeof ORDER_SCOPES)[number]['key'];

/** The artboards' own default: `UserBuyurtma.dc.html` is the "Shaharlar aro" board. */
export const DEFAULT_ORDER_SCOPE: OrderScope = 'aro';

/** The i18n key naming a scope, used as the order screen's top-bar subtitle. */
export const orderScopeLabelKey = (scope: OrderScope): string =>
  ORDER_SCOPES.find((s) => s.key === scope)?.labelKey ?? 'menu.scopeAro';
