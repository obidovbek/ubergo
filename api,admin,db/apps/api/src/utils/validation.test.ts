/**
 * Tests for the validation helpers (T-010).
 *
 * ⚠️ `isValidPhone`'s regex was edited in T-032 to drop useless escapes. The
 * claim then was "the matched set is unchanged" — these tests are what makes
 * that claim checkable instead of a comment nobody can verify.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isIsoDate,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidUUID,
  sanitizeString,
} from './validation.js';

describe('isValidEmail', () => {
  it('accepts an ordinary address', () => {
    assert.equal(isValidEmail('driver@ubexgo.uz'), true);
  });

  it('rejects a missing @, domain or dot', () => {
    for (const bad of ['nope', 'a@b', 'a@.uz', '@b.uz', 'a@b.']) {
      assert.equal(isValidEmail(bad), false, `${bad} should be rejected`);
    }
  });

  it('rejects whitespace anywhere', () => {
    assert.equal(isValidEmail('a b@c.uz'), false);
    assert.equal(isValidEmail(' a@c.uz'), false);
  });

  it('rejects an empty string', () => {
    assert.equal(isValidEmail(''), false);
  });
});

describe('isValidPhone', () => {
  it('accepts the shapes Uzbek numbers are actually typed in', () => {
    for (const good of [
      '+998901234567',
      '998 90 123 45 67',
      '(90) 123-45-67 998',
      '90-123-45-67-99',
    ]) {
      assert.equal(isValidPhone(good), true, `${good} should be accepted`);
    }
  });

  it('rejects letters', () => {
    assert.equal(isValidPhone('+998 90 ABC 45 67'), false);
  });

  it('rejects fewer than 10 digits', () => {
    assert.equal(isValidPhone('+998 90 12'), false);
  });

  it('rejects an empty string', () => {
    assert.equal(isValidPhone(''), false);
  });

  /*
   * 🔴 The T-032 claim, pinned. The old pattern was
   * `/^[\d\s\-\+\(\)]+$/` and the new one is `/^[\d\s\-+()]+$/`; inside a
   * character class those escapes were decorative. If a future edit changes the
   * SET rather than the escaping, this fails.
   */
  it('T-032: the matched character set is exactly digits, space, - + ( )', () => {
    const allowed = '0123456789 -+()';
    for (const ch of allowed) {
      // Pad to 10 digits so only the character under test can fail it.
      assert.equal(isValidPhone('0123456789' + ch), true, `${ch} should be allowed`);
    }
    for (const ch of ['a', '.', '/', '#', '*', '_']) {
      assert.equal(isValidPhone('0123456789' + ch), false, `${ch} should be rejected`);
    }
  });
});

describe('isValidPassword', () => {
  it('needs 8 characters', () => {
    assert.equal(isValidPassword('1234567'), false);
    assert.equal(isValidPassword('12345678'), true);
  });
});

describe('isValidUUID', () => {
  it('accepts a v4 uuid in either case', () => {
    assert.equal(isValidUUID('9f8b7c6d-1e2f-4a3b-8c9d-0e1f2a3b4c5d'), true);
    assert.equal(isValidUUID('9F8B7C6D-1E2F-4A3B-8C9D-0E1F2A3B4C5D'), true);
  });

  it('rejects a malformed one', () => {
    for (const bad of [
      '',
      'not-a-uuid',
      '9f8b7c6d1e2f4a3b8c9d0e1f2a3b4c5d',
      '9f8b7c6d-1e2f-4a3b-8c9d-0e1f2a3b4c5',
    ]) {
      assert.equal(isValidUUID(bad), false, `${bad} should be rejected`);
    }
  });
});

describe('sanitizeString', () => {
  it('trims and strips angle brackets', () => {
    assert.equal(sanitizeString('  <script>  '), 'script');
  });

  it('leaves ordinary Uzbek text alone, apostrophes included', () => {
    assert.equal(sanitizeString("Toshkent shahri, Yunusobod tumani"), 'Toshkent shahri, Yunusobod tumani');
    assert.equal(sanitizeString("Ma'lumot"), "Ma'lumot");
  });

  /*
   * ⚠️ Documented, not a claim of safety: this strips `<` and `>` only. It is
   * NOT HTML escaping and must not be relied on as XSS protection — quotes,
   * ampersands and `javascript:` all pass through untouched.
   */
  it('is NOT an HTML escaper — quotes and ampersands survive', () => {
    assert.equal(sanitizeString('a & b "c"'), 'a & b "c"');
  });
});

/*
 * T-129. The two inputs that matter are the owner's: the driver app posted the
 * display format `DD.MM.YYYY`, and the ORM's `moment(value)` read `15.03.2015` as
 * invalid and `01.03.2015` as January 3rd. Both must be refused HERE, before the
 * database sees them — the second one used to be stored, swapped, in silence.
 */
describe('isIsoDate — the only date format a DATEONLY column may receive', () => {
  it('accepts a real YYYY-MM-DD, leap day included', () => {
    for (const ok of ['2015-03-15', '2016-02-29', '1990-01-01', '2031-12-31']) {
      assert.equal(isIsoDate(ok), true, `${ok} should be accepted`);
    }
  });

  it('refuses the display format the app used to post — both the crash and the silent swap', () => {
    // moment('15.03.2015') → "Invalid date" → Postgres 500 → the generic toast.
    assert.equal(isIsoDate('15.03.2015'), false);
    // moment('01.03.2015') → 2015-01-03: saved with day and month exchanged.
    assert.equal(isIsoDate('01.03.2015'), false);
  });

  it('refuses a date the calendar does not have', () => {
    for (const bad of ['2015-02-30', '2015-02-29', '2015-04-31', '2015-13-01', '2015-00-10', '2015-03-00']) {
      assert.equal(isIsoDate(bad), false, `${bad} should be refused`);
    }
  });

  it('refuses near-misses: unpadded parts, a time part, slashes, prose', () => {
    for (const bad of ['2015-3-5', '2015-03-15T00:00:00Z', '2015-03-15 10:00', '2015/03/15', '15 March 2015', '20150315']) {
      assert.equal(isIsoDate(bad), false, `${bad} should be refused`);
    }
  });

  it('refuses anything that is not a string — the rule itself skips absent values', () => {
    for (const bad of [undefined, null, 20150315, new Date('2015-03-15'), {}, '']) {
      assert.equal(isIsoDate(bad), false);
    }
  });
});
