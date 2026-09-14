import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  directionMatchSql,
  hasNoPlacesSql,
  isSafeId,
  placeExistsSql,
  quoteLiteral,
} from './offerGeoQuery.js';

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
