/**
 * Tests for the four order scopes (T-102).
 *
 * 🔴 WHAT IS ACTUALLY AT RISK HERE. These rules decide which rides a passenger is shown. Every
 * failure mode is silent: a too-loose rule offers a ride going somewhere else, a too-strict one
 * shows an empty list, and both look like "the search is a bit odd" rather than a bug. Nothing
 * in `tsc` or a lint pass can see any of it.
 *
 * 🔴 THE TWO SIDES HAVE DIFFERENT SHAPES. An order is one path; an offer is a SET of places per
 * direction (`DriverElon` multi-selects districts and QFYs). The cases below use a two-district
 * offer wherever the set matters, because a one-place set cannot tell "equals" from "is one of".
 *
 * The cases worth pinning are the ones the owner's spec turns on:
 *   • both directions must match — an `OR` offers a ride going the opposite way;
 *   • "uni ichki qismlari emas" — an adm2 match is never satisfied by a settlement alone;
 *   • `aro` ≡ `viloyat` as queries, differing only in validation;
 *   • `yaqin` refuses the SAME district, and does NOT refuse non-bordering ones;
 *   • the loose rule applies only to a district-only place, never to a named QFY;
 *   • a pre-T-102 order with no ids must be detectable, not silently unmatchable.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  directionHit,
  directionMatches,
  hasMatchableIds,
  isOrderScope,
  isScopeValid,
  LOOSE_PARENT_MATCH,
  matchesOrder,
  matchLevelFor,
  matchPrecision,
  neighborsFirst,
  ORDER_SCOPES,
  validateOfferPlaces,
  validateScope,
  type Journey,
  type OfferPlaces,
  type OrderScope
} from './geoMatch.js';

/** Farg'ona viloyat(1): Farg'ona sh.(10) w/ QFY 100,101 · Marg'ilon(11). Toshkent(2): Yunusobod(20) w/ QFY 200 · Mirzo Ulug'bek(21). */
const place = (province: number | null, city: number | null, settlement: number | null = null) => ({
  country_id: 1,
  province_id: province,
  city_id: city,
  settlement_id: settlement
});

const order = (from: ReturnType<typeof place>, to: ReturnType<typeof place>): Journey => ({ from, to });
const offer = (from: ReturnType<typeof place>[], to: ReturnType<typeof place>[]): OfferPlaces => ({ from, to });

/** Passenger: Farg'ona sh. -> Yunusobod, district level. */
const O2 = order(place(1, 10), place(2, 20));
/** Passenger: QFY 100 (in Farg'ona sh.) -> QFY 200 (in Yunusobod). */
const O3 = order(place(1, 10, 100), place(2, 20, 200));

/** Driver, the artboard's own sample: {Farg'ona sh., Marg'ilon} -> {Yunusobod, Mirzo Ulug'bek}, no QFYs. */
const F_CORRIDOR = offer([place(1, 10), place(1, 11)], [place(2, 20), place(2, 21)]);
/** Driver naming the exact QFYs. */
const F_EXACT3 = offer([place(1, 10, 100)], [place(2, 20, 200)]);

describe('match level', () => {
  it('aro and viloyat match at adm2, tuman and yaqin at adm3', () => {
    assert.equal(matchLevelFor('aro'), 'adm2');
    assert.equal(matchLevelFor('viloyat'), 'adm2');
    assert.equal(matchLevelFor('tuman'), 'adm3');
    assert.equal(matchLevelFor('yaqin'), 'adm3');
  });

  it('recognises only the four scopes', () => {
    assert.ok(isOrderScope('aro'));
    assert.ok(!isOrderScope('shahar'));
    assert.ok(!isOrderScope(undefined));
    for (const s of ORDER_SCOPES) assert.ok(matchLevelFor(s));
  });
});

describe('matching at adm2 — the order is ONE OF the offer places', () => {
  it('the corridor offer serves an order for either of its districts', () => {
    assert.ok(matchesOrder(O2, F_CORRIDOR, 'aro'));
    const fromMargilon = order(place(1, 11), place(2, 21));
    assert.ok(matchesOrder(fromMargilon, F_CORRIDOR, 'aro'));
  });

  it('🔴 BOTH directions must match — a served origin with an unserved destination does not', () => {
    const wrongTo = order(place(1, 10), place(2, 99));
    assert.ok(!matchesOrder(wrongTo, F_CORRIDOR, 'aro'));
  });

  it('🔴 and an unserved origin with a served destination does not either', () => {
    const wrongFrom = order(place(1, 99), place(2, 20));
    assert.ok(!matchesOrder(wrongFrom, F_CORRIDOR, 'aro'));
  });

  it('🔴 REVERSED is not a match — the ride goes the other way', () => {
    const reversed = order(place(2, 20), place(1, 10));
    assert.ok(!matchesOrder(reversed, F_CORRIDOR, 'aro'));
  });

  it('an offer that ALSO names QFYs still matches at adm2 (every place carries its city)', () => {
    assert.ok(matchesOrder(O2, F_EXACT3, 'aro'));
  });

  it('🔴 "uni ichki qismlari emas" — a matching QFY under the wrong district does not match', () => {
    const sameQfyOtherCity = offer([place(1, 77, 100)], [place(2, 88, 200)]);
    assert.ok(!matchesOrder(O2, sameQfyOtherCity, 'aro'));
  });

  it('aro and viloyat are the SAME query', () => {
    for (const f of [F_CORRIDOR, F_EXACT3]) {
      assert.equal(matchesOrder(O2, f, 'aro'), matchesOrder(O2, f, 'viloyat'));
    }
  });

  it('an order with no district cannot match on adm2', () => {
    assert.ok(!matchesOrder(order(place(1, null), place(2, null)), F_CORRIDOR, 'aro'));
  });

  it('an offer with an EMPTY side matches nothing', () => {
    assert.ok(!matchesOrder(O2, offer([], [place(2, 20)]), 'aro'));
  });
});

describe('matching at adm3', () => {
  it('matches the exact QFY pair', () => {
    assert.ok(matchesOrder(O3, F_EXACT3, 'tuman'));
    assert.equal(matchPrecision(O3, F_EXACT3, 'tuman'), 'exact');
  });

  it('a different QFY in the same district does NOT match exactly', () => {
    const otherQfy = offer([place(1, 10, 101)], [place(2, 20, 200)]);
    assert.equal(directionHit(O3.from, otherQfy.from, 'adm3'), null);
  });

  it('🔴 a NAMED QFY never loosely matches a different QFY — the driver did not say "anywhere"', () => {
    const otherQfy = offer([place(1, 10, 101)], [place(2, 20, 200)]);
    assert.ok(!matchesOrder(O3, otherQfy, 'tuman'));
  });

  it('tuman and yaqin are the SAME query', () => {
    assert.equal(matchesOrder(O3, F_EXACT3, 'tuman'), matchesOrder(O3, F_EXACT3, 'yaqin'));
  });

  it('🛑 the LOOSE rule: a district-only place serves an adm3 order in that district', () => {
    assert.equal(matchesOrder(O3, F_CORRIDOR, 'tuman'), LOOSE_PARENT_MATCH);
  });

  it('🔴 loose only when the DISTRICT agrees — not a free pass', () => {
    const otherDistrict = offer([place(1, 11)], [place(2, 20)]);
    assert.ok(!matchesOrder(O3, otherDistrict, 'tuman'));
  });

  it('🔴 a loose match is REPORTED as district-level, never as exact', () => {
    assert.equal(matchPrecision(O3, F_CORRIDOR, 'tuman'), LOOSE_PARENT_MATCH ? 'district' : null);
  });

  it('half-loose (exact one way, district-only the other) is district-level', () => {
    const half = offer([place(1, 10, 100)], [place(2, 20)]);
    assert.equal(matchPrecision(O3, half, 'tuman'), LOOSE_PARENT_MATCH ? 'district' : null);
  });

  it('a set holding BOTH a named QFY and a district-only row: the exact one wins', () => {
    const both = offer([place(1, 10, 100), place(1, 10)], [place(2, 20, 200)]);
    assert.equal(matchPrecision(O3, both, 'tuman'), 'exact');
  });

  it('precision is null when there is no match', () => {
    assert.equal(matchPrecision(O3, offer([place(1, 77, 777)], [place(2, 88, 888)]), 'tuman'), null);
  });

  it('an adm2 match is always exact — the loose rule is an adm3 idea only', () => {
    assert.equal(matchPrecision(O2, F_CORRIDOR, 'aro'), 'exact');
  });
});

describe('directionHit / directionMatches on their own', () => {
  it('compares the level it is given, not the deepest present', () => {
    assert.equal(directionHit(place(1, 10), [place(1, 10, 999)], 'adm2'), 'exact');
    assert.equal(directionHit(place(1, 10, 100), [place(1, 10, 999)], 'adm3'), null);
  });

  it('an order side with nothing at the level never matches', () => {
    assert.ok(!directionMatches(place(1, null), [place(1, 10)], 'adm2'));
    assert.equal(directionHit(place(1, 10), [place(1, 10)], 'adm3'), null);
  });

  it('membership, not first-element equality', () => {
    assert.equal(directionHit(place(1, 11), [place(1, 10), place(1, 11)], 'adm2'), 'exact');
  });
});

describe('order validation', () => {
  it('aro accepts two districts in different provinces', () => {
    assert.deepEqual(validateScope(O2, 'aro'), []);
  });

  it('🔴 viloyat REFUSES two districts in different provinces', () => {
    assert.ok(validateScope(O2, 'viloyat').includes('different_province'));
  });

  it('viloyat accepts two districts inside one province', () => {
    assert.deepEqual(validateScope(order(place(1, 10), place(1, 11)), 'viloyat'), []);
  });

  it('🔴 tuman REFUSES two QFYs in different districts', () => {
    assert.ok(validateScope(O3, 'tuman').includes('different_district'));
  });

  it('tuman accepts two QFYs inside one district', () => {
    assert.deepEqual(validateScope(order(place(1, 10, 100), place(1, 10, 101)), 'tuman'), []);
  });

  it('🔴 yaqin REFUSES the same district — it would be tuman', () => {
    assert.ok(validateScope(order(place(1, 10, 100), place(1, 10, 101)), 'yaqin').includes('same_district'));
  });

  it('🔴 yaqin does NOT refuse non-bordering districts — chegaradosh is not enforced', () => {
    // Farg'ona sh. and Yunusobod are ~300 km apart. Yaqin means QFY precision, not adjacency.
    assert.deepEqual(validateScope(O3, 'yaqin'), []);
  });

  it('a missing level is reported per direction', () => {
    const p = validateScope(order(place(1, null), place(2, null)), 'aro');
    assert.ok(p.includes('missing_from') && p.includes('missing_to'));
  });

  it('isScopeValid agrees with validateScope', () => {
    assert.equal(isScopeValid(O2, 'aro'), true);
    assert.equal(isScopeValid(O2, 'viloyat'), false);
  });
});

describe('offer validation — the driver side', () => {
  it('the artboard sample offer is valid', () => {
    assert.deepEqual(validateOfferPlaces(F_CORRIDOR), []);
  });

  it('🔴 an empty side is refused (sheetNext needs ≥ 1 district)', () => {
    assert.ok(validateOfferPlaces(offer([], [place(2, 20)])).includes('from_empty'));
    assert.ok(validateOfferPlaces(offer([place(1, 10)], [])).includes('to_empty'));
  });

  it('🔴 two provinces on one side is a corrupted row, not a wider offer', () => {
    const mixed = offer([place(1, 10), place(2, 20)], [place(2, 21)]);
    assert.ok(validateOfferPlaces(mixed).includes('from_mixed_province'));
  });

  it('a place with no district is unreachable by the matcher and is refused', () => {
    const noCity = offer([place(1, null, 100)], [place(2, 20)]);
    assert.ok(validateOfferPlaces(noCity).includes('from_no_district'));
  });
});

describe('neighbours — picker ORDER only, never a filter', () => {
  const districts = [{ id: 20 }, { id: 21 }, { id: 22 }, { id: 23 }];
  const borders = (a: number, b: number) => (a === 10 && (b === 22 || b === 21)) || (b === 10 && (a === 22 || a === 21));

  it('bordering districts come first, in their original order', () => {
    assert.deepEqual(neighborsFirst(10, districts, borders).map((d) => d.id), [21, 22, 20, 23]);
  });

  it('🔴 NOTHING is removed — the list length is unchanged', () => {
    assert.equal(neighborsFirst(10, districts, borders).length, districts.length);
  });

  it('an empty neighbours table is a no-op, not an empty picker', () => {
    assert.deepEqual(neighborsFirst(10, districts, () => false).map((d) => d.id), [20, 21, 22, 23]);
  });

  it('the origin itself is never promoted as its own neighbour', () => {
    const withSelf = [{ id: 10 }, { id: 21 }];
    assert.deepEqual(neighborsFirst(10, withSelf, () => true).map((d) => d.id), [21, 10]);
  });

  it('no origin -> the list as given', () => {
    assert.deepEqual(neighborsFirst(null, districts, borders), districts);
  });
});

describe('pre-T-102 rows', () => {
  it('🔴 an order with no ids is DETECTABLE, so the caller can fall back to text', () => {
    assert.equal(hasMatchableIds(order(place(null, null), place(null, null)), 'aro'), false);
    assert.equal(hasMatchableIds(O2, 'aro'), true);
  });

  it('an adm2 order is not matchable at adm3', () => {
    assert.equal(hasMatchableIds(O2, 'tuman'), false);
    assert.equal(hasMatchableIds(O3, 'tuman'), true);
  });

  it('and such an order matches nothing rather than everything', () => {
    const legacy = order(place(null, null), place(null, null));
    for (const s of ORDER_SCOPES) assert.ok(!matchesOrder(legacy, F_CORRIDOR, s as OrderScope));
  });
});
