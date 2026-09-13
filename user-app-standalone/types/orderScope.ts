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
 * 🔴 **UPDATED 2026-09-13 (T-114 ①): THE FOUR NO LONGER BEHAVE IDENTICALLY ON THIS SCREEN.**
 * `ORDER_SCOPE_GEO` below now drives the order form's root card and how deep its location
 * sheet opens, which is what the four artboards actually differ by. What is still NOT wired
 * is the MATCHING — `matchLevel` remains unsent, and `DriverOffer` gains searchable geo only
 * with T-102. **A passenger can now state a scope precisely; the search still ignores it.**
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

/** A level of the geo cascade, mirroring `components/geo/GeoSheet.tsx`'s `GeoLevel`. */
export type ScopeGeoLevel = 'country' | 'province' | 'district' | 'settlement';

/** What one scope fixes up front, and where its from/to picker therefore starts. */
export interface OrderScopeGeo {
  /**
   * The level the scope pins for BOTH endpoints, shown as the card above the route block.
   * `null` = no root card: the scope fixes nothing and the picker starts from the top.
   */
  rootLevel: null | 'province' | 'district';
  /** Where the from/to sheet opens. Everything above it comes from the root card. */
  startLevel: ScopeGeoLevel;
}

/**
 * 🎯 T-114 ① — THE ONLY THING THE FOUR ORDER ARTBOARDS DIFFER BY, as data.
 *
 * Measured 2026-09-13 from the four `UserBuyurtma*.dc.html` files rather than described:
 * their pickers are **byte-identical** (`pickAdm2`/`pickAdm3` run 1→2→3→4 in all four, step 4
 * being the landmark form). The single line that changes is `openFrom`:
 *
 *   aro      { sheetStep: 1 }
 *   viloyat  { sheetStep: 2, tmpAdm1: viloyat }
 *   tuman    { sheetStep: 3, tmpAdm1: viloyat, tmpAdm2: tuman }
 *   yaqin    { sheetStep: 1 }
 *
 * and whether the board draws the root card at all — `openVil` and its `map` icon appear
 * **zero** times in the `aro` and `yaqin` files.
 *
 * ⚠️ `aro` and `yaqin` ARE IDENTICAL HERE. That is measured, not an oversight: they diverge
 * only in COMPLETENESS (`yaqin` demands a QFY on both ends, the other three do not), which is
 * T-114 ② and overlaps `validateScope` on the API. **Do not invent a difference.**
 *
 * ⚠️ `endLevel` is deliberately absent: all four boards run the picker down to adm3, which is
 * already what `LocationCard` asks for. Only the START differs.
 */
export const ORDER_SCOPE_GEO: Record<OrderScope, OrderScopeGeo> = {
  aro: { rootLevel: null, startLevel: 'province' },
  viloyat: { rootLevel: 'province', startLevel: 'district' },
  tuman: { rootLevel: 'district', startLevel: 'settlement' },
  yaqin: { rootLevel: null, startLevel: 'province' },
};

export const orderScopeGeo = (scope: OrderScope): OrderScopeGeo => ORDER_SCOPE_GEO[scope];

/**
 * Is this unknown value one of the four scopes? Needed because the EDIT path reads the
 * scope off a server field (`match_scope`) that is not in the app's types yet — the column
 * is migrated but nothing writes it until T-102d.
 */
export const isOrderScope = (value: unknown): value is OrderScope =>
  typeof value === 'string' && ORDER_SCOPES.some((s) => s.key === value);

/**
 * The eyebrow above the root card's value — the artboards' own wording, which names the adm
 * level out loud: "Viloyat (Adm1)" / "Tuman (Adm2)". Null for a scope with no root card.
 */
export const scopeRootLabelKey = (scope: OrderScope): string | null => {
  const { rootLevel } = ORDER_SCOPE_GEO[scope];
  if (rootLevel === 'province') return 'passengerOffers.scopeRootProvince';
  if (rootLevel === 'district') return 'passengerOffers.scopeRootDistrict';
  return null;
};

/** The title of the root card's own picker sheet. Null where there is no root card. */
export const scopeRootSheetTitleKey = (scope: OrderScope): string | null => {
  const { rootLevel } = ORDER_SCOPE_GEO[scope];
  if (rootLevel === 'province') return 'passengerOffers.scopeRootPickProvince';
  if (rootLevel === 'district') return 'passengerOffers.scopeRootPickDistrict';
  return null;
};

/** The i18n key naming a scope, used as the order screen's top-bar subtitle. */
export const orderScopeLabelKey = (scope: OrderScope): string =>
  ORDER_SCOPES.find((s) => s.key === scope)?.labelKey ?? 'menu.scopeAro';
