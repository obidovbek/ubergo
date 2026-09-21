/**
 * Tests for the write-side scope guard (T-127).
 *
 * 🔴 WHAT IS ACTUALLY AT RISK HERE, and it is not what it looks like. The obvious risk is a
 * too-loose rule letting through an order the matcher cannot serve. The expensive one is the
 * opposite: a **wrong refusal on a correct order**, which reaches the passenger as "the app
 * won't let me order" and cannot be acted on. Two of the cases below exist only for that:
 *
 *   ① **BIGINT comes back from pg as a STRING.** Every geo id on `passenger_offers` is BIGINT
 *      and nothing overrides the type parser, while `parseId` makes the patch's ids numbers.
 *      Unnormalised, `10 !== '10'` tells a passenger editing a valid `Tuman ichi` order that
 *      its endpoints are in different districts. The model's types say `number | null`, so
 *      `tsc` sees nothing. Every update case here sends the stored side as pg sends it.
 *   ② **The form re-sends the whole form on every save.** So "did the route change?" cannot be
 *      answered by presence — only by value — or a passenger editing the price would be judged
 *      on geo they never touched, which is exactly what decision ① promised not to do.
 *
 * The rest pin the owner's own table (`validateScope` owns it; this module only decides when to
 * ask and which sentence the answer becomes) and the grandfathering that keeps orders created
 * 2026-09-13…2026-09-21 editable.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateScope, type OrderScope } from './geoMatch.js';
import {
  relaxUnavailable,
  SCOPE_PROBLEM_ORDER,
  SCOPE_SENSITIVE_FIELDS,
  scopeMessageKey,
  scopeSensitiveChange,
  scopeVerdict,
  toGeoId
} from './scopeGuard.js';

/**
 * Farg'ona viloyat(1): Farg'ona sh.(10) w/ QFY 100,101 · Marg'ilon(11).
 * Toshkent(2): Yunusobod(20) w/ QFY 200.
 */
const row = (
  scope: string | null,
  from: [number | null, number | null, number | null],
  to: [number | null, number | null, number | null]
): Record<string, unknown> => ({
  match_scope: scope,
  from_province_id: from[0],
  from_city_id: from[1],
  from_settlement_id: from[2],
  to_province_id: to[0],
  to_city_id: to[1],
  to_settlement_id: to[2]
});

/** The same row as pg hands it back: every BIGINT a string. */
const asStored = (r: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(r).map(([k, v]) => [
      k,
      k.endsWith('_id') && v !== null ? String(v) : v
    ])
  );

// A valid Tuman ichi order: two QFYs inside Farg'ona sh.
const TUMAN_OK = row('tuman', [1, 10, 100], [1, 10, 101]);
// The same order with no QFYs — what the form allowed until this card.
const TUMAN_NO_QFY = row('tuman', [1, 10, null], [1, 10, null]);

/**
 * 🔴 THE PARITY — the same table the user app's `check-scope-completeness.mjs` executes.
 *
 * The rule lives twice: here in `geoMatch.validateScope`, and in the app's
 * `utils/scopeCompleteness.scopeProblems`, because the two packages share no code. Two readers
 * of one rule drifting apart silently is what cost T-123 and T-116, so both run these cases and
 * must produce the same problems. Change a branch on either side and the other goes red.
 *
 * ⚠️ Read from the repo root at TEST time only — nothing imports it at runtime, so neither
 * package bundles anything foreign. CI checks out the whole repo, so this path resolves there.
 */
describe('🔴 parity with the user app — shared/scope-cases.json', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../../../../..');
  const table = JSON.parse(
    readFileSync(join(root, 'shared', 'scope-cases.json'), 'utf8')
  ) as {
    cases: {
      name: string;
      scope: OrderScope;
      from: [number | null, number | null, number | null];
      to: [number | null, number | null, number | null];
      problems: string[];
    }[];
  };

  it('finds the table (a path that silently resolved to nothing would prove nothing)', () => {
    assert.ok(table.cases.length >= 15, `found ${table.cases.length} cases`);
  });

  const side = ([province_id, city_id, settlement_id]: (number | null)[]) => ({
    province_id: province_id ?? null,
    city_id: city_id ?? null,
    settlement_id: settlement_id ?? null
  });

  for (const c of table.cases) {
    it(`case: ${c.name}`, () => {
      const got = validateScope(
        { from: side(c.from), to: side(c.to) },
        c.scope
      ).slice().sort();
      assert.deepEqual(got, [...c.problems].sort());
    });
  }
});

describe('toGeoId — the BIGINT-as-string normaliser', () => {
  it('reads what pg sends and what the client sends as the same id', () => {
    assert.equal(toGeoId('10'), 10);
    assert.equal(toGeoId(10), 10);
  });

  it('treats absent, empty and unusable ids as null rather than 0 or NaN', () => {
    for (const v of [null, undefined, '', 'abc', 0, -1, 1.5, {}])
      assert.equal(toGeoId(v), null, `expected null for ${JSON.stringify(v)}`);
  });
});

describe('create — the order must reach the depth its scope matches at', () => {
  it('🔴 tuman with no QFY is refused, and the message names the QFY, not the district', () => {
    const v = scopeVerdict(TUMAN_NO_QFY, null);
    assert.ok(v);
    assert.deepEqual(v.problems, ['missing_from', 'missing_to']);
    assert.equal(v.messageKey, 'offers.scope_missing_from_adm3');
  });

  it('🔴 yaqin with no QFY is refused the same way — it matches at adm3 too', () => {
    const v = scopeVerdict(row('yaqin', [1, 10, null], [2, 20, null]), null);
    assert.ok(v);
    assert.equal(v.messageKey, 'offers.scope_missing_from_adm3');
  });

  it('aro missing a district asks for the DISTRICT — same problem, different level', () => {
    const v = scopeVerdict(row('aro', [1, null, null], [2, 20, null]), null);
    assert.ok(v);
    assert.deepEqual(v.problems, ['missing_from']);
    assert.equal(v.messageKey, 'offers.scope_missing_from_adm2');
  });

  it('viloyat refuses two provinces', () => {
    const v = scopeVerdict(row('viloyat', [1, 10, null], [2, 20, null]), null);
    assert.ok(v);
    assert.equal(v.messageKey, 'offers.scope_different_province');
  });

  it('tuman refuses two districts', () => {
    const v = scopeVerdict(row('tuman', [1, 10, 100], [1, 11, 110]), null);
    assert.ok(v);
    assert.equal(v.messageKey, 'offers.scope_different_district');
  });

  it('🔴 yaqin refuses the SAME district — that order is a tuman order', () => {
    const v = scopeVerdict(row('yaqin', [1, 10, 100], [1, 10, 101]), null);
    assert.ok(v);
    assert.equal(v.messageKey, 'offers.scope_same_district');
  });

  it('every scope accepts an order that satisfies it', () => {
    assert.equal(scopeVerdict(TUMAN_OK, null), null);
    assert.equal(scopeVerdict(row('aro', [1, 10, null], [2, 20, null]), null), null);
    assert.equal(scopeVerdict(row('viloyat', [1, 10, null], [1, 11, null]), null), null);
    assert.equal(scopeVerdict(row('yaqin', [1, 10, 100], [2, 20, 200]), null), null);
  });

  it('an order claiming NO scope is left alone — inferring one would be a guess (T-114)', () => {
    assert.equal(scopeVerdict(row(null, [1, null, null], [2, null, null]), null), null);
    assert.equal(scopeVerdict({ from_city_id: 10 }, null), null);
  });

  it('a scope that is not one of the four is not this rule to refuse', () => {
    // `buildOfferFields` already 400s on it; this module must not throw on the way past.
    assert.equal(scopeVerdict(row('nonsense', [1, null, null], [2, null, null]), null), null);
  });
});

describe('🔴 update — pg sends BIGINT as a string, and a wrong refusal is the expensive failure', () => {
  it('🔴 a valid tuman order whose ONE edited side meets a stored side is NOT refused', () => {
    /*
     * The shape that actually triggers it, and it took a mutation to find: the two sides must
     * arrive in DIFFERENT types. A patch carrying the whole form makes both sides numbers and
     * proves nothing. Here the passenger moves only the FROM endpoint — so `from_city_id` is a
     * number from `parseId` while `to_city_id` is still the stored BIGINT string, and
     * `validateScope` compares them with `!==`.
     *
     * Unnormalised: `10 !== '10'` → `different_district` on an order that is plainly correct,
     * and the passenger is told their two endpoints are in different districts.
     */
    const stored = asStored(TUMAN_OK); // to_city_id: '10'
    const patch = { from_city_id: 10, from_settlement_id: 101 }; // numbers
    assert.equal(scopeVerdict(patch, stored), null);
  });

  it('…and the same shape for viloyat, whose rule compares provinces', () => {
    const stored = asStored(row('viloyat', [1, 10, null], [1, 11, null]));
    assert.equal(scopeVerdict({ from_province_id: 1, from_city_id: 12 }, stored), null);
  });

  it('re-sending the form unchanged, numbers against pg strings, is not a change', () => {
    assert.equal(scopeSensitiveChange(TUMAN_OK, asStored(TUMAN_OK)), false);
    assert.equal(scopeVerdict(TUMAN_OK, asStored(TUMAN_NO_QFY)), null);
  });

  it('a real move is still seen through the string/number difference', () => {
    assert.equal(
      scopeSensitiveChange({ from_city_id: 11 }, asStored(TUMAN_OK)),
      true
    );
  });
});

describe('update — decision ①: nothing becomes uneditable', () => {
  it('🔴 an old broken tuman order can still have its price changed', () => {
    // Created 2026-09-13…09-21, when nothing asked for a QFY. Judging it would trap the
    // passenger in an order they cannot edit at all.
    const v = scopeVerdict({ max_price_per_seat: 50000 }, asStored(TUMAN_NO_QFY));
    assert.equal(v, null);
  });

  it('…but touching its route means it must come out valid', () => {
    const v = scopeVerdict({ from_settlement_id: 100 }, asStored(TUMAN_NO_QFY));
    assert.ok(v);
    assert.deepEqual(v.problems, ['missing_to']);
    assert.equal(v.messageKey, 'offers.scope_missing_to_adm3');
  });

  it('…and fixing the route completely is accepted', () => {
    const v = scopeVerdict(
      { from_settlement_id: 100, to_settlement_id: 101 },
      asStored(TUMAN_NO_QFY)
    );
    assert.equal(v, null);
  });

  it('🔴 moving an order INTO tuman without a QFY is refused, not inherited', () => {
    // The hole a "don't report pre-existing problems" rule would leave: the stored row is
    // already missing QFYs, so a diff-of-problems check would find nothing new.
    const stored = asStored(row('aro', [1, 10, null], [1, 10, null]));
    const v = scopeVerdict({ match_scope: 'tuman' }, stored);
    assert.ok(v);
    assert.equal(v.messageKey, 'offers.scope_missing_from_adm3');
  });

  it('changing the country alone never re-opens the question', () => {
    // No scope rule reads country_id, so refusing here would be unexplainable.
    assert.equal(scopeSensitiveChange({ from_country_id: 2 }, asStored(TUMAN_NO_QFY)), false);
    assert.ok(!SCOPE_SENSITIVE_FIELDS.includes('from_country_id'));
  });
});

describe('🔴 the empty-QFY escape (decision ②) — a district with no QFY list', () => {
  it('a claimed side is let through at adm3, and only that side', () => {
    const v = scopeVerdict({ ...TUMAN_NO_QFY, from_settlement_unavailable: true }, null);
    assert.ok(v, 'the unclaimed side must still be reported');
    assert.deepEqual(v.problems, ['missing_to']);
  });

  it('both sides claimed → the order posts, matched at the district', () => {
    const v = scopeVerdict(
      {
        ...TUMAN_NO_QFY,
        from_settlement_unavailable: true,
        to_settlement_unavailable: true
      },
      null
    );
    assert.equal(v, null);
  });

  it('🔴 it never relaxes a CONTRADICTION — different districts under tuman still refuse', () => {
    const v = scopeVerdict(
      {
        ...row('tuman', [1, 10, null], [1, 11, null]),
        from_settlement_unavailable: true,
        to_settlement_unavailable: true
      },
      null
    );
    assert.ok(v);
    assert.equal(v.messageKey, 'offers.scope_different_district');
  });

  it('🔴 it never relaxes a missing DISTRICT — every province has districts', () => {
    // An empty list there is a fault, not a fact, so the claim must not buy anything at adm2.
    const v = scopeVerdict(
      {
        ...row('aro', [1, null, null], [2, 20, null]),
        from_settlement_unavailable: true
      },
      null
    );
    assert.ok(v);
    assert.equal(v.messageKey, 'offers.scope_missing_from_adm2');
  });

  it('the claim is not a stored field — it never reaches the row', () => {
    // It is a request-only claim; `fields` is what gets written and must not carry it.
    assert.ok(!SCOPE_SENSITIVE_FIELDS.includes('from_settlement_unavailable'));
    assert.equal(
      relaxUnavailable(['missing_from'], { from_settlement_unavailable: true }, 'aro').length,
      1,
      'adm2 must be untouched by the claim'
    );
  });
});

describe('the message a passenger gets', () => {
  it('is stable when an order has several problems', () => {
    // Missing endpoints are what the passenger can act on, so they are named first.
    const v = scopeVerdict(row('yaqin', [1, 10, null], [1, 10, null]), null);
    assert.ok(v);
    assert.ok(v.problems.includes('missing_from') && v.problems.includes('same_district'));
    assert.equal(v.messageKey, 'offers.scope_missing_from_adm3');
  });

  it('names every problem the rule can produce — no problem can arrive keyless', () => {
    for (const problem of SCOPE_PROBLEM_ORDER) {
      for (const scope of ['aro', 'viloyat', 'tuman', 'yaqin'] as const) {
        const key = scopeMessageKey(problem, scope);
        assert.match(key, /^offers\.scope_[a-z_0-9]+$/, `${problem}/${scope} → ${key}`);
      }
    }
  });

  it('the level rides on the KEY, because params are interpolated after translation', () => {
    assert.equal(scopeMessageKey('missing_from', 'tuman'), 'offers.scope_missing_from_adm3');
    assert.equal(scopeMessageKey('missing_from', 'aro'), 'offers.scope_missing_from_adm2');
    // A relational problem names one scope already, so it takes no level.
    assert.equal(scopeMessageKey('same_district', 'yaqin'), 'offers.scope_same_district');
  });
});
