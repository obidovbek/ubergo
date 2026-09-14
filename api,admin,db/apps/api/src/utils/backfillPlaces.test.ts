import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  describeOutcome,
  isWritable,
  matchDistricts,
  sameName,
  splitParts,
  type NamedPlace,
} from './backfillPlaces.js';

const DISTRICTS: NamedPlace[] = [
  { id: 1, name: 'Andijon', provinceId: 10 },
  { id: 2, name: 'Asaka', provinceId: 10 },
  { id: 3, name: "Qo'qon", provinceId: 20 },
  { id: 4, name: 'Andijon', provinceId: 30 }, // a REAL duplicate: the city and the district
];

const UNIQUE = DISTRICTS.filter((d) => d.id !== 4);

describe('splitParts — the text was built by joining on ", "', () => {
  it('splits and trims', () => {
    assert.deepEqual(splitParts('Andijon, Asaka'), ['Andijon', 'Asaka']);
  });

  it('drops empties from a trailing comma', () => {
    assert.deepEqual(splitParts('Andijon, , '), ['Andijon']);
  });

  it('null and undefined are empty, not a crash', () => {
    assert.deepEqual(splitParts(null), []);
    assert.deepEqual(splitParts(undefined), []);
  });
});

describe('sameName — exact, never "contains"', () => {
  it('matches identical names', () => {
    assert.equal(sameName('Andijon', 'Andijon'), true);
  });

  it('ignores case', () => {
    assert.equal(sameName('ANDIJON', 'andijon'), true);
  });

  /*
   * 🔴 The defect the old loader shipped: `includes()` in both directions made a district
   * match its own province, and every district whose name prefixes another.
   */
  it('does NOT match a district against its province', () => {
    assert.equal(sameName('Andijon', 'Andijon viloyati'), false);
  });

  it('does NOT match a prefix', () => {
    assert.equal(sameName('Andi', 'Andijon'), false);
  });

  /* ⚠️ Uzbek writes one name with several different apostrophes. */
  it("folds the apostrophe: Qo'qon, Qo‘qon and Qoʻqon are one place", () => {
    assert.equal(sameName("Qo'qon", 'Qo‘qon'), true);
    assert.equal(sameName("Qo'qon", 'Qoʻqon'), true);
    assert.equal(sameName("Qo'qon", 'Qoqon'), true);
  });

  it('two empty strings are not a match', () => {
    assert.equal(sameName('', ''), false);
    assert.equal(sameName('   ', ''), false);
  });
});

describe('matchDistricts', () => {
  it('finds one district and ignores the province and country around it', () => {
    const out = matchDistricts("Andijon, Andijon viloyati, O'zbekiston", UNIQUE);
    assert.deepEqual(out, { kind: 'matched', placeIds: [1] });
  });

  it('finds SEVERAL districts — the smuggled multi-district case', () => {
    const out = matchDistricts('Andijon, Asaka', UNIQUE);
    assert.deepEqual(out, { kind: 'matched', placeIds: [1, 2] });
  });

  it('does not repeat a district named twice', () => {
    const out = matchDistricts('Andijon, Andijon', UNIQUE);
    assert.deepEqual(out, { kind: 'matched', placeIds: [1] });
  });

  it("matches a name whose apostrophe differs from the database's", () => {
    const out = matchDistricts('Qo‘qon', UNIQUE);
    assert.deepEqual(out, { kind: 'matched', placeIds: [3] });
  });

  /* 🔴 The whole point: refuse rather than pick. */
  it('is AMBIGUOUS when a name belongs to two districts, and names them', () => {
    const out = matchDistricts('Andijon', DISTRICTS);
    assert.equal(out.kind, 'ambiguous');
    if (out.kind === 'ambiguous') {
      assert.equal(out.part, 'Andijon');
      assert.deepEqual(out.candidateIds, [1, 4]);
    }
  });

  it('ambiguity anywhere fails the WHOLE side — no partial write', () => {
    const out = matchDistricts('Asaka, Andijon', DISTRICTS);
    assert.equal(out.kind, 'ambiguous');
  });

  it('text naming nothing known is no_match, not an empty success', () => {
    const out = matchDistricts('Atlantis', UNIQUE);
    assert.deepEqual(out, { kind: 'no_match', reason: 'no_candidates' });
  });

  it('empty text is no_match', () => {
    assert.deepEqual(matchDistricts('', UNIQUE), { kind: 'no_match', reason: 'no_candidates' });
  });

  it('a renamed district (province only) is no_match, not a wrong guess', () => {
    const out = matchDistricts("Andijon viloyati, O'zbekiston", UNIQUE);
    assert.deepEqual(out, { kind: 'no_match', reason: 'no_candidates' });
  });
});

describe('isWritable — both directions, or neither', () => {
  const matched = matchDistricts('Andijon', UNIQUE);
  const nothing = matchDistricts('Atlantis', UNIQUE);

  it('writes when both ends matched', () => {
    assert.equal(isWritable({ from: matched, to: matched }), true);
  });

  /*
   * 🔴 A half-backfilled offer is worse than an untouched one: it HAS places, so the search
   * stops falling back to its text, and then matches on one end only.
   */
  it('refuses when only the origin matched', () => {
    assert.equal(isWritable({ from: matched, to: nothing }), false);
  });

  it('refuses when only the destination matched', () => {
    assert.equal(isWritable({ from: nothing, to: matched }), false);
  });

  it('refuses when neither matched', () => {
    assert.equal(isWritable({ from: nothing, to: nothing }), false);
  });
});

describe('describeOutcome — the report has to say WHY', () => {
  it('names the ids it matched', () => {
    assert.equal(describeOutcome(matchDistricts('Andijon, Asaka', UNIQUE)), 'matched(1+2)');
  });

  it('names the ambiguous part and how many candidates it had', () => {
    assert.match(describeOutcome(matchDistricts('Andijon', DISTRICTS)), /ambiguous\("Andijon"/);
  });

  it('says no_match plainly', () => {
    assert.equal(describeOutcome(matchDistricts('Atlantis', UNIQUE)), 'no_match');
  });
});
