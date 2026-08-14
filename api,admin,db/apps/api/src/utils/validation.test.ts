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
