import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  adm3Clauses,
  clauseExistsSql,
  directionMatchSql,
  groupPlaceRows,
  hasNoPlacesSql,
  isSafeId,
  placeExistsSql,
  quoteLiteral,
  rowSatisfies,
  settlementMatchSql,
} from './offerGeoQuery.js';
import { placeHit, type GeoPathIds } from './geoMatch.js';

const REF = '"DriverOffer"."id"';

describe('isSafeId — an id reaches raw SQL, so it is refused rather than coerced', () => {
  it('accepts a positive integer', () => {
    assert.equal(isSafeId(7), true);
  });

  it('refuses a string, however numeric it looks', () => {
    assert.equal(isSafeId('7' as unknown), false);
  });

  it('refuses NaN — `Number("1 OR 1=1")` lands here', () => {
    assert.equal(isSafeId(Number('1 OR 1=1')), false);
  });

  it('refuses zero and negatives', () => {
    assert.equal(isSafeId(0), false);
    assert.equal(isSafeId(-3), false);
  });

  it('refuses a float', () => {
    assert.equal(isSafeId(1.5), false);
  });
});

describe('quoteLiteral — Uzbek place names really do contain apostrophes', () => {
  it("doubles the quote in Qo'qon", () => {
    assert.equal(quoteLiteral("Qo'qon"), "'Qo''qon'");
  });

  it('doubles every quote, not just the first', () => {
    assert.equal(quoteLiteral("G'uzor To'rtko'l"), "'G''uzor To''rtko''l'");
  });

  it('leaves an ordinary name alone', () => {
    assert.equal(quoteLiteral('Andijon'), "'Andijon'");
  });

  /* 🔴 The injection case, stated outright rather than implied by the escaping. */
  it("neutralises a closing quote followed by SQL", () => {
    const hostile = "x' OR '1'='1";
    const quoted = quoteLiteral(hostile);
    assert.equal(quoted, "'x'' OR ''1''=''1'");
    // every quote inside the literal is doubled, so none of them can close it
    assert.equal(quoted.slice(1, -1).includes("''"), true);
  });
});

describe('placeExistsSql', () => {
  it('matches the district in the FROM direction', () => {
    const sql = placeExistsSql('from', 'city', 42, REF);
    assert.match(sql, /EXISTS \(SELECT 1 FROM driver_offer_places/);
    assert.match(sql, /dop\.direction = 'from'/);
    assert.match(sql, /dop\.city_id = 42/);
  });

  it('matches the settlement at adm3', () => {
    assert.match(placeExistsSql('to', 'settlement', 9, REF), /dop\.settlement_id = 9/);
  });

  it('correlates on the offer id it is given', () => {
    assert.match(placeExistsSql('from', 'city', 1, REF), /dop\.offer_id = "DriverOffer"\."id"/);
  });

  it('throws on an unsafe id rather than emitting it', () => {
    assert.throws(() => placeExistsSql('from', 'city', Number('oops'), REF), /unsafe geo id/);
  });
});

describe('directionMatchSql — ids where the offer has them, text where it does not', () => {
  const textColumn = '"DriverOffer"."from_text"';

  it('an offer with places matches by id; one without falls back to its text', () => {
    const sql = directionMatchSql('from', { id: 5, level: 'city', name: 'Andijon', textColumn }, REF)!;
    assert.match(sql, /dop\.city_id = 5/);
    assert.match(sql, /NOT EXISTS/);
    assert.match(sql, /ILIKE '%Andijon%'/);
    // the fallback is guarded by "this offer has no places", not applied to everyone
    assert.match(sql, /OR \(NOT EXISTS[\s\S]*ILIKE/);
  });

  /*
   * 🔴 THE POINT OF THE WHOLE MODULE. Almost every offer in the database predates T-102c and
   * has no place rows; a request-level switch would return nothing for them.
   */
  it('never applies the text fallback to an offer that HAS places', () => {
    const sql = directionMatchSql('from', { id: 5, level: 'city', name: 'Andijon', textColumn }, REF)!;
    const fallback = sql.slice(sql.indexOf('OR ('));
    assert.match(fallback, /NOT EXISTS \(SELECT 1 FROM driver_offer_places dop2/);
  });

  it('name only (no ids known) behaves exactly as the old search did', () => {
    const sql = directionMatchSql('from', { name: 'Andijon', textColumn }, REF)!;
    assert.equal(sql, `(${textColumn} ILIKE '%Andijon%')`);
    assert.doesNotMatch(sql, /EXISTS/);
  });

  it('ids only, with no name, cannot fall back — an old offer simply will not match', () => {
    const sql = directionMatchSql('from', { id: 5, level: 'city', textColumn }, REF)!;
    assert.match(sql, /dop\.city_id = 5/);
    assert.doesNotMatch(sql, /ILIKE/);
  });

  it('nothing constrained adds NO condition, rather than a tautology', () => {
    assert.equal(directionMatchSql('from', { textColumn }, REF), null);
  });

  it('an empty name is not a constraint', () => {
    assert.equal(directionMatchSql('from', { name: '   ', textColumn }, REF), null);
  });

  it("escapes the fallback name — Qo'qon must not break the statement", () => {
    const sql = directionMatchSql('from', { name: "Qo'qon", textColumn }, REF)!;
    assert.match(sql, /ILIKE '%Qo''qon%'/);
  });
});

describe('hasNoPlacesSql', () => {
  it('uses its own alias so it can sit beside the EXISTS it guards', () => {
    const inner = placeExistsSql('from', 'city', 1, REF);
    const outer = hasNoPlacesSql(REF);
    assert.equal(inner.includes(' dop '), true);
    assert.equal(outer.includes(' dop2 '), true);
  });
});

// ------------------------------------------------------------------------------ T-102i, adm3

describe('adm3Clauses — the QFY match, as data', () => {
  it('exact QFY, or (loose) the district with NO QFY', () => {
    assert.deepEqual(adm3Clauses(100, 10), [
      { settlement_id: 100 },
      { settlement_id: null, city_id: 10 },
    ]);
  });

  it('the loose clause needs the district — without it, exact only (narrower, never wider)', () => {
    assert.deepEqual(adm3Clauses(100, undefined), [{ settlement_id: 100 }]);
  });

  it('LOOSE_PARENT_MATCH off → exact only', () => {
    assert.deepEqual(adm3Clauses(100, 10, false), [{ settlement_id: 100 }]);
  });
});

/*
 * 🔴 THE PARITY TEST — two readers of one rule, held together (the T-123 / T-116 lesson).
 * `geoMatch.placeHit` decides whether one place row serves the order; the SQL filter is rendered
 * from `adm3Clauses`. Every fixture row goes through both, and they must agree. A branch changed
 * on one side only turns this red.
 */
describe('adm3Clauses ⇔ geoMatch.placeHit — parity over fixture rows', () => {
  const order: GeoPathIds = { province_id: 1, city_id: 10, settlement_id: 100 };
  const rows: Array<[string, GeoPathIds]> = [
    ['the order’s own QFY', { province_id: 1, city_id: 10, settlement_id: 100 }],
    ['ANOTHER QFY in the same district', { province_id: 1, city_id: 10, settlement_id: 101 }],
    ['the same district, no QFY', { province_id: 1, city_id: 10, settlement_id: null }],
    ['the same district, QFY absent (undefined)', { province_id: 1, city_id: 10 }],
    ['another district, no QFY', { province_id: 1, city_id: 11, settlement_id: null }],
    ['another district’s QFY', { province_id: 1, city_id: 11, settlement_id: 200 }],
    ['a row naming no district', { province_id: 1, settlement_id: null }],
  ];

  for (const [label, row] of rows) {
    it(label, () => {
      const bySql = adm3Clauses(100, 10).some((clause) => rowSatisfies(row, clause));
      const byRule = placeHit(row, order, 'adm3') !== null;
      assert.equal(bySql, byRule, `SQL says ${bySql}, the rule says ${byRule}`);
    });
  }

  it('the fixtures cover both answers (a parity test that only ever says "no" proves nothing)', () => {
    const answers = new Set(rows.map(([, row]) => placeHit(row, order, 'adm3') !== null));
    assert.deepEqual([...answers].sort(), [false, true]);
  });
});

describe('clauseExistsSql', () => {
  it('renders the loose clause with IS NULL — the whole rule', () => {
    const sql = clauseExistsSql('from', { settlement_id: null, city_id: 10 }, REF);
    assert.match(sql, /dop\.direction = 'from'/);
    assert.match(sql, /dop\.settlement_id IS NULL AND dop\.city_id = 10/);
  });

  it('throws on an unsafe id rather than emitting it', () => {
    assert.throws(() => clauseExistsSql('to', { settlement_id: Number('1 OR 1=1') }, REF), /unsafe geo id/);
  });

  it('refuses a column it does not know, and an empty clause that would match everything', () => {
    assert.throws(
      () => clauseExistsSql('to', { ['province_id; DROP' as 'city_id']: 1 }, REF),
      /unknown place column/,
    );
    assert.throws(() => clauseExistsSql('to', {}, REF), /empty clause/);
  });
});

describe('groupPlaceRows — raw BIGINT rows, as pg really returns them', () => {
  /*
   * 🔴 Every id below is a STRING, because that is what a raw `findAll` on BIGINT columns
   * hands back. Unconverted, offer 7's rows are filed under "7" and never found by the
   * number 7, and no QFY is ever `===` the order's — every label silently `district`.
   */
  const rows = [
    { offer_id: '7', direction: 'from' as const, province_id: '1', city_id: '10', settlement_id: '100' },
    { offer_id: '7', direction: 'to' as const, province_id: '2', city_id: '20', settlement_id: null },
    { offer_id: '8', direction: 'from' as const, province_id: '1', city_id: '11', settlement_id: null },
  ];

  it('files rows under the NUMERIC offer id, split by direction', () => {
    const grouped = groupPlaceRows(rows);
    assert.deepEqual([...grouped.keys()].sort(), [7, 8]);
    assert.equal(grouped.get(7)?.from.length, 1);
    assert.equal(grouped.get(7)?.to.length, 1);
  });

  it('turns every id into a number — so the rule can see an exact QFY', () => {
    const from = groupPlaceRows(rows).get(7)!.from[0]!;
    assert.deepEqual(from, { province_id: 1, city_id: 10, settlement_id: 100 });
    assert.equal(placeHit(from, { city_id: 10, settlement_id: 100 }, 'adm3'), 'exact');
  });

  it('keeps a missing QFY as null, not 0 — "district only" must stay district only', () => {
    assert.equal(groupPlaceRows(rows).get(7)!.to[0]!.settlement_id, null);
  });
});

describe('settlementMatchSql — one direction at adm3', () => {
  const textColumn = '"DriverOffer"."to_text"';

  it('either clause, and the text fallback only for an offer with NO places', () => {
    const sql = settlementMatchSql('to', { settlementId: 100, cityId: 10, districtName: "Qo'qon", textColumn }, REF);
    assert.match(sql, /dop\.settlement_id = 100/);
    assert.match(sql, /dop\.settlement_id IS NULL AND dop\.city_id = 10/);
    // the fallback is guarded, exactly as at adm2
    assert.match(sql, /OR \(NOT EXISTS \(SELECT 1 FROM driver_offer_places dop2[\s\S]*ILIKE '%Qo''qon%'/);
  });

  it('no district name → no fallback: an old offer simply cannot match a QFY order', () => {
    const sql = settlementMatchSql('to', { settlementId: 100, cityId: 10, textColumn }, REF);
    assert.doesNotMatch(sql, /ILIKE/);
  });

  it('throws on an unsafe QFY id', () => {
    assert.throws(() => settlementMatchSql('to', { settlementId: 1.5, textColumn }, REF), /unsafe geo id/);
  });
});
