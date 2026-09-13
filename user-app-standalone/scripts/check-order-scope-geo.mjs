/**
 * T-114 ① — the order form's per-scope geo shape.
 *
 * Bundles `types/orderScope.ts` and the pure merge out of `LocationCard` with esbuild and
 * executes them. Same pattern as the other checkers here (no RN test runner exists; adding
 * one is a new dependency and the owner's call — CLAUDE.md rule 4).
 *
 * 🛑 WHAT IT DEFENDS. Two silent failures, neither of which throws:
 *   ① A scope whose picker opens at the wrong level, or draws a root card it should not —
 *      which is the defect the owner reported on 2026-09-13 ("there must be different FROM,
 *      TO part"), in the form it would come back.
 *   ② `mergeScopeRoot` getting its precedence backwards, so re-opening a half-filled
 *      endpoint shows the scope root instead of what the passenger picked. It renders
 *      perfectly and describes the wrong place.
 *
 * ⚠️ The four rows below are MEASURED from the artboards' `openFrom` lines, not chosen:
 *     aro { sheetStep: 1 } · viloyat { 2, tmpAdm1 } · tuman { 3, tmpAdm1, tmpAdm2 } · yaqin { 1 }
 *   and `openVil` appears zero times in the aro and yaqin files.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const bundle = (entry, name) => {
  const out = path.join(root, 'node_modules', '.cache', name);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execSync(
    `npx esbuild ${entry} --bundle --format=esm --platform=neutral ` +
      `--outfile="${out}" --log-level=error`,
    { cwd: root, stdio: 'inherit' },
  );
  return out;
};

const scopeOut = bundle('types/orderScope.ts', 'check-order-scope-geo.mjs');
const M = await import(pathToFileURL(scopeOut).href);
fs.rmSync(scopeOut, { force: true });

let pass = 0;
const fails = [];
const ok = (label, cond) => {
  if (cond) pass++;
  else fails.push(label);
};
const eq = (label, a, b) =>
  ok(label + ' (got ' + JSON.stringify(a) + ')', JSON.stringify(a) === JSON.stringify(b));

// ── the table, scope by scope ───────────────────────────────────────────────
eq('aro: no root card, opens at province', M.orderScopeGeo('aro'), {
  rootLevel: null,
  startLevel: 'province',
});
eq('viloyat: province root, opens at district', M.orderScopeGeo('viloyat'), {
  rootLevel: 'province',
  startLevel: 'district',
});
eq('tuman: district root, opens at settlement', M.orderScopeGeo('tuman'), {
  rootLevel: 'district',
  startLevel: 'settlement',
});
eq('yaqin: no root card, opens at province', M.orderScopeGeo('yaqin'), {
  rootLevel: null,
  startLevel: 'province',
});

// 🔴 The defect itself: if all four ever agree again, the card has regressed.
ok(
  'the four scopes do NOT all draw the same block',
  new Set(M.ORDER_SCOPES.map((s) => JSON.stringify(M.orderScopeGeo(s.key)))).size > 1,
);

// ⚠️ Measured, not an oversight — aro and yaqin ARE the same here. Asserted so that a
// future reader does not "fix" it, and so that ② (completeness) is where they diverge.
eq(
  'aro and yaqin are deliberately identical in step ①',
  M.orderScopeGeo('aro'),
  M.orderScopeGeo('yaqin'),
);

// ── the root card is exactly the two boards that draw one ───────────────────
eq(
  'exactly two scopes have a root card',
  M.ORDER_SCOPES.filter((s) => M.orderScopeGeo(s.key).rootLevel !== null)
    .map((s) => s.key)
    .sort(),
  ['tuman', 'viloyat'],
);
ok(
  'a scope with no root card has no root label',
  M.scopeRootLabelKey('aro') === null && M.scopeRootLabelKey('yaqin') === null,
);
ok(
  'a scope WITH a root card has both a label and a sheet title',
  !!M.scopeRootLabelKey('viloyat') &&
    !!M.scopeRootSheetTitleKey('viloyat') &&
    !!M.scopeRootLabelKey('tuman') &&
    !!M.scopeRootSheetTitleKey('tuman'),
);
ok(
  'the two root cards do not share a label',
  M.scopeRootLabelKey('viloyat') !== M.scopeRootLabelKey('tuman'),
);

/*
 * 🔴 The root must be SHALLOWER than where the picker starts, always. If they ever meet,
 * the passenger is asked for a level the scope already fixed — the exact double-pick
 * `GeoSheet`'s `startLevel` was written to prevent.
 */
const DEPTH = { country: 0, province: 1, district: 2, settlement: 3 };
for (const { key } of M.ORDER_SCOPES) {
  const { rootLevel, startLevel } = M.orderScopeGeo(key);
  if (rootLevel === null) continue;
  ok(
    `${key}: the picker starts BELOW the level the root pins`,
    DEPTH[startLevel] === DEPTH[rootLevel] + 1,
  );
}

// ── isOrderScope, the edit path's guard ────────────────────────────────────
ok('isOrderScope accepts a real scope', M.isOrderScope('tuman') === true);
ok('isOrderScope rejects an unknown string', M.isOrderScope('shahar') === false);
ok('isOrderScope rejects undefined (the pre-T-102d edit path)', M.isOrderScope(undefined) === false);
ok('isOrderScope rejects a non-string', M.isOrderScope(3) === false);

// ── mergeScopeRoot — precedence, the silent one ────────────────────────────
const merged = bundle('utils/scopeRoot.ts', 'check-order-scope-geo-merge.mjs');
const L = await import(pathToFileURL(merged).href);
fs.rmSync(merged, { force: true });

const FARGONA = { id: 1, name: "Farg'ona" };
const ANDIJON = { id: 2, name: 'Andijon' };
const ASAKA = { id: 3, name: 'Asaka' };

eq(
  'merge: the root fills what the passenger has not chosen',
  L.mergeScopeRoot({ province: FARGONA }, {}).province,
  FARGONA,
);
eq(
  "merge: the passenger's own choice WINS over the root",
  L.mergeScopeRoot({ province: FARGONA }, { province: ANDIJON }).province,
  ANDIJON,
);
eq(
  'merge: a deeper choice survives alongside the root',
  L.mergeScopeRoot({ province: FARGONA }, { district: ASAKA }),
  { country: undefined, province: FARGONA, district: ASAKA, settlement: undefined },
);
eq('merge: no root at all is a no-op', L.mergeScopeRoot(undefined, { province: ANDIJON }).province, ANDIJON);
ok('merge: nothing anywhere stays empty', Object.values(L.mergeScopeRoot(undefined, {})).every((v) => v === undefined));

/*
 * 🔴 `scopeRootChanged` decides whether BOTH endpoints get cleared. Too eager and it wipes
 * work the passenger has done; too lax and two endpoints go on naming districts of a
 * province that is no longer the root. It compares ids because `GeoSheet` hands back fresh
 * objects on every confirm — `!==` on the objects would fire every time.
 */
ok(
  'changed: same province by VALUE is not a change (fresh object each confirm)',
  L.scopeRootChanged({ province: FARGONA }, { province: { id: 1, name: "Farg'ona" } }) === false,
);
ok(
  'changed: a different province IS a change',
  L.scopeRootChanged({ province: FARGONA }, { province: ANDIJON }) === true,
);
ok(
  'changed: the DISTRICT moving counts too (the tuman root)',
  L.scopeRootChanged(
    { province: FARGONA, district: ASAKA },
    { province: FARGONA, district: { id: 9, name: 'Rishton' } },
  ) === true,
);
ok(
  'changed: picking a root for the first time is a change',
  L.scopeRootChanged({}, { province: FARGONA }) === true,
);
ok('changed: nothing to nothing is not a change', L.scopeRootChanged({}, {}) === false);

/*
 * 🔴 REGRESSION, DEVICE-REPORTED 2026-09-13: *"tuman ichi -> Viloyat va tuman tanlang shows
 * nothing, the same with others related"*. `ScopeRootCard` opened its sheet with the root
 * value alone, which has no country — and `GeoSheet` loads a level ONLY when the level above
 * it is in the path (`lvl === "province" && p.country`). With it missing the sheet does not
 * error; it renders an EMPTY LIST, indistinguishable from a region with no districts. The
 * root then could never be picked, so the viloyat/tuman from-to pickers (which open at
 * district/settlement) had no ancestor either — one cause, every symptom.
 *
 * These assertions fail on that exact bug.
 */
const UZBEKISTAN = 860;

ok(
  'sheet path: the country is ALWAYS present, or the picker renders empty and silent',
  L.scopeSheetPath(UZBEKISTAN, {}).country?.id === UZBEKISTAN,
);
eq(
  'sheet path: an empty root still opens a loadable province list',
  Object.keys(L.scopeSheetPath(UZBEKISTAN, {})).filter(
    (k) => L.scopeSheetPath(UZBEKISTAN, {})[k] !== undefined,
  ),
  ['country'],
);
ok(
  'sheet path: a chosen province survives alongside the country',
  L.scopeSheetPath(UZBEKISTAN, { province: FARGONA }).province?.id === FARGONA.id &&
    L.scopeSheetPath(UZBEKISTAN, { province: FARGONA }).country?.id === UZBEKISTAN,
);
ok(
  'sheet path: no country id yet (still resolving) degrades to undefined, not a bad id',
  L.scopeSheetPath(null, { province: FARGONA }).country === undefined,
);

/*
 * The general form of the same rule: for every scope, the level the picker OPENS at must
 * have its parent supplied by the root path — otherwise that picker is the empty one.
 */
const PARENT = { province: 'country', district: 'province', settlement: 'district' };
for (const { key } of M.ORDER_SCOPES) {
  const { rootLevel, startLevel } = M.orderScopeGeo(key);
  const root =
    rootLevel === 'province'
      ? { province: FARGONA }
      : rootLevel === 'district'
        ? { province: FARGONA, district: ASAKA }
        : {};
  const opened = L.scopeSheetPath(UZBEKISTAN, L.mergeScopeRoot(root, {}));
  ok(
    `${key}: the from/to picker opens at "${startLevel}" WITH its "${PARENT[startLevel]}" in the path`,
    opened[PARENT[startLevel]] !== undefined,
  );
}

// ── i18n: every key this card names must RESOLVE, in all three locales ─────
/*
 * ⚠️ Evaluated, not grepped. `tsc` cannot see a translation key, and a missing one renders
 * the key itself — which reads as an English-looking string on a Uzbek screen rather than
 * as an error. That failure has been logged twice on this project.
 */
const trOut = bundle('translations/index.ts', 'check-order-scope-geo-i18n.mjs');
const T = await import(pathToFileURL(trOut).href);
fs.rmSync(trOut, { force: true });

const dict = T.translations ?? T.default;
const NEEDED = [
  ...M.ORDER_SCOPES.map((s) => s.labelKey),
  ...M.ORDER_SCOPES.map((s) => M.scopeRootLabelKey(s.key)).filter(Boolean),
  ...M.ORDER_SCOPES.map((s) => M.scopeRootSheetTitleKey(s.key)).filter(Boolean),
];

for (const locale of ['uz', 'ru', 'en']) {
  for (const key of NEEDED) {
    const value = key.split('.').reduce((o, part) => (o == null ? o : o[part]), dict[locale]);
    ok(
      `i18n ${locale}: ${key} resolves to a non-empty string`,
      typeof value === 'string' && value.length > 0,
    );
  }
}

if (fails.length) {
  console.error('FAIL order scope geo: ' + fails.length + ' of ' + (pass + fails.length));
  for (const f of fails) console.error('   - ' + f);
  process.exit(1);
}
console.log(
  '✓ order scope geo: all ' +
    pass +
    ' assertions pass (table · root card · depth · guard · merge · i18n ×3)',
);
