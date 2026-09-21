/**
 * T-127 — the order form's per-scope completeness rule, and its parity with the API's.
 *
 * Bundles `utils/scopeCompleteness.ts` with esbuild and executes it. Same pattern as the other
 * checkers here (no RN test runner exists for pure modules; adding one is a new dependency and
 * the owner's call — CLAUDE.md rule 4).
 *
 * 🛑 WHAT IT DEFENDS. Three failures, none of which throws:
 *   ① The app's rule drifting from the API's. They live in two packages with no shared code, so
 *      nothing but this makes them agree. A too-lenient app posts an order the server refuses,
 *      and the passenger sees a failure they cannot place; a too-strict one refuses an order
 *      that was fine. **Both readers run `shared/scope-cases.json` — that is the parity.**
 *   ② A problem with no sentence. The keys are computed, so a missing one shows the passenger
 *      a raw key like `passengerOffers.scope_missing_from_adm3`. `tsc` cannot see a string key,
 *      and `translations/index.ts` already carries 2 of the app's 3 baseline errors, so the
 *      locale shapes do NOT type-check against each other (T-108) — nothing else would catch it.
 *   ③ The level falling out of a key, which would ask a `Tuman ichi` passenger for a district.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const repo = path.resolve(root, '..');

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

const out = bundle('utils/scopeCompleteness.ts', 'check-scope-completeness.mjs');
const M = await import(pathToFileURL(out).href);
fs.rmSync(out, { force: true });

// One bundle of the index, removed straight after — the idiom `check-order-scope-geo.mjs` uses.
// (This file first bundled the three locales separately and never deleted them; every sibling
// checker cleans up after itself, so it was the odd one out.)
const trOut = bundle('translations/index.ts', 'check-scope-completeness-i18n.mjs');
const T = await import(pathToFileURL(trOut).href);
fs.rmSync(trOut, { force: true });
const dict = T.translations ?? T.default;
const translations = { uz: dict.uz, ru: dict.ru, en: dict.en };

let pass = 0;
const fails = [];
const ok = (label, cond) => {
  if (cond) pass++;
  else fails.push(label);
};
const eq = (label, a, b) =>
  ok(`${label} (got ${JSON.stringify(a)})`, JSON.stringify(a) === JSON.stringify(b));

const SCOPES = ['aro', 'viloyat', 'tuman', 'yaqin'];

// ── ① parity: the SAME table the API's suite runs ───────────────────────────
const tablePath = path.join(repo, 'shared', 'scope-cases.json');
ok(
  'the shared case table is where both readers expect it',
  fs.existsSync(tablePath),
);

const table = JSON.parse(fs.readFileSync(tablePath, 'utf8'));
ok(
  `the table has cases (found ${table.cases?.length ?? 0})`,
  Array.isArray(table.cases) && table.cases.length >= 15,
);

const side = ([province_id, city_id, settlement_id]) => ({
  province_id,
  city_id,
  settlement_id,
});

for (const c of table.cases) {
  const got = M.scopeProblems(side(c.from), side(c.to), c.scope).sort();
  eq(`case: ${c.name}`, got, [...c.problems].sort());
}

// The table must exercise both levels and every problem, or "parity" is only parity on
// whatever it happens to cover.
const covered = new Set(table.cases.flatMap((c) => c.problems));
for (const problem of M.SCOPE_PROBLEM_ORDER) {
  ok(`the table exercises ${problem}`, covered.has(problem));
}
ok(
  'the table exercises both match levels',
  new Set(table.cases.map((c) => M.matchLevelFor(c.scope))).size === 2,
);

// ── the empty-QFY escape (owner decision ②) ─────────────────────────────────
// 🔴 It relaxes the rule's ANSWER and never the rule itself, which is why it is tested here
// and deliberately absent from the shared table: both sides must keep agreeing on `scopeProblems`.
{
  const noQfy = { province_id: 1, city_id: 10, settlement_id: null };
  const unavailable = { ...noQfy, settlementUnavailable: true };

  eq(
    'without the claim, tuman demands a QFY at both ends',
    M.orderProblems(noQfy, noQfy, 'tuman').sort(),
    ['missing_from', 'missing_to'],
  );
  eq(
    'the claim excuses only the side that made it',
    M.orderProblems(unavailable, noQfy, 'tuman'),
    ['missing_to'],
  );
  eq(
    'both sides claimed → the order may be posted',
    M.orderProblems(unavailable, unavailable, 'tuman'),
    [],
  );
  eq(
    '🔴 the claim never excuses a CONTRADICTION',
    M.orderProblems(
      { province_id: 1, city_id: 10, settlement_id: null, settlementUnavailable: true },
      { province_id: 1, city_id: 11, settlement_id: null, settlementUnavailable: true },
      'tuman',
    ),
    ['different_district'],
  );
  eq(
    '🔴 the claim buys nothing at adm2 — every province has districts',
    M.orderProblems(
      { province_id: 1, city_id: null, settlement_id: null, settlementUnavailable: true },
      { province_id: 2, city_id: 20, settlement_id: null },
      'aro',
    ),
    ['missing_from'],
  );
  ok(
    'an order matched one level shallower says so',
    M.matchesShallower(unavailable, unavailable, 'tuman') === true,
  );
  ok(
    'a complete tuman order does NOT claim to be shallower',
    M.matchesShallower(
      { province_id: 1, city_id: 10, settlement_id: 100 },
      { province_id: 1, city_id: 10, settlement_id: 101 },
      'tuman',
    ) === false,
  );
  ok(
    'and neither does an adm2 scope, whatever the flags say',
    M.matchesShallower(unavailable, unavailable, 'aro') === false,
  );
}

// ── ② every problem has a sentence, in all three locales ────────────────────
const lookup = (dict, key) =>
  key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), dict);

for (const problem of M.SCOPE_PROBLEM_ORDER) {
  for (const scope of SCOPES) {
    const key = M.scopeProblemKey(problem, scope);
    for (const [locale, dict] of Object.entries(translations)) {
      const value = lookup(dict, key);
      ok(
        `${locale}: ${key} exists (${problem}/${scope})`,
        typeof value === 'string' && value.trim().length > 0,
      );
    }
  }
}

for (const scope of SCOPES) {
  const key = M.scopeMatchKey(scope);
  for (const [locale, dict] of Object.entries(translations)) {
    const value = lookup(dict, key);
    ok(`${locale}: ${key} exists (match strip, ${scope})`, typeof value === 'string' && !!value.trim());
  }
}

// ── ③ the level is in the key, per scope ────────────────────────────────────
eq('tuman asks for the QFY', M.scopeProblemKey('missing_from', 'tuman'), 'passengerOffers.scope_missing_from_adm3');
eq('yaqin asks for the QFY', M.scopeProblemKey('missing_to', 'yaqin'), 'passengerOffers.scope_missing_to_adm3');
eq('aro asks for the district', M.scopeProblemKey('missing_from', 'aro'), 'passengerOffers.scope_missing_from_adm2');
eq('viloyat asks for the district', M.scopeProblemKey('missing_to', 'viloyat'), 'passengerOffers.scope_missing_to_adm2');
ok(
  'a relational problem carries no level — it already names one scope',
  M.scopeProblemKey('same_district', 'yaqin') === 'passengerOffers.scope_same_district',
);

// 🔴 The defect itself: if tuman/yaqin ever stop demanding adm3, this card has regressed.
eq('tuman matches at adm3', M.matchLevelFor('tuman'), 'adm3');
eq('yaqin matches at adm3', M.matchLevelFor('yaqin'), 'adm3');
eq('aro matches at adm2', M.matchLevelFor('aro'), 'adm2');
eq('viloyat matches at adm2', M.matchLevelFor('viloyat'), 'adm2');

// ── which field a problem marks ─────────────────────────────────────────────
eq('a missing FROM marks only the from field', M.fieldsForProblem('missing_from'), ['from_text']);
eq('a missing TO marks only the to field', M.fieldsForProblem('missing_to'), ['to_text']);
eq(
  'a relational problem marks BOTH — neither endpoint is wrong alone',
  M.fieldsForProblem('same_district'),
  ['from_text', 'to_text'],
);

// ── the order problems are reported in ──────────────────────────────────────
eq(
  'a missing endpoint is named before a relational problem',
  M.firstProblem(['same_district', 'missing_to']),
  'missing_to',
);
eq('no problems, nothing to say', M.firstProblem([]), null);

if (fails.length) {
  console.error(`\n❌ check-scope-completeness: ${fails.length} failed, ${pass} passed\n`);
  for (const f of fails) console.error(`   · ${f}`);
  process.exit(1);
}
console.log(`✓ check-scope-completeness: ${pass} assertions`);
