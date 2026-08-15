/**
 * Tests for the user-chosen identifier rules (T-091).
 *
 * ⚠️ These decide what a user is allowed to claim permanently. A promo code
 * that slips through wrong is one T-089 will later pay referral credit against,
 * and a username taken back from a real user is a support problem.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  IdentifierError,
  normalisePromoCode,
  normaliseUsername,
  identifiersMatch,
  isIdentifierProvided,
  RESERVED_NAMES,
  PROMO_CODE_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from './identifiers.js';

/** Assert that `fn` throws an IdentifierError with exactly this code and field. */
function throwsCode(fn: () => unknown, code: string, field?: string) {
  assert.throws(fn, (error: unknown) => {
    assert.ok(error instanceof IdentifierError, `expected an IdentifierError, got ${error}`);
    assert.equal(error.code, code);
    if (field) assert.equal(error.field, field);
    return true;
  });
}

describe('normalisePromoCode — exactly 5 alphanumeric characters', () => {
  it('accepts a valid code', () => {
    assert.equal(normalisePromoCode('AB12X'), 'AB12X');
  });

  it('accepts all digits and all letters', () => {
    assert.equal(normalisePromoCode('12345'), '12345');
    assert.equal(normalisePromoCode('ABCDE'), 'ABCDE');
  });

  it('trims surrounding whitespace', () => {
    // A code pasted from a message usually arrives with a space attached.
    assert.equal(normalisePromoCode('  AB12X  '), 'AB12X');
  });

  it('does NOT fold case — the column is CITEXT, display stays as chosen', () => {
    assert.equal(normalisePromoCode('ab12x'), 'ab12x');
    assert.equal(normalisePromoCode('AB12X'), 'AB12X');
  });

  it('refuses 4 and 6 characters — the boundary on both sides', () => {
    throwsCode(() => normalisePromoCode('AB12'), 'wrong_length', 'own_promo_code');
    throwsCode(() => normalisePromoCode('AB12XY'), 'wrong_length', 'own_promo_code');
  });

  it('refuses a code that is 5 characters only because of spaces', () => {
    // "AB1  " trims to 3 — length must be measured AFTER trimming, or a user
    // could claim a short code by padding it.
    throwsCode(() => normalisePromoCode('AB1  '), 'wrong_length');
  });

  it('refuses non-latin and punctuation', () => {
    throwsCode(() => normalisePromoCode('AB-12'), 'invalid_characters');
    throwsCode(() => normalisePromoCode('AB 12'), 'invalid_characters');
    throwsCode(() => normalisePromoCode("O'REY"), 'invalid_characters');
    // Cyrillic and Uzbek letters are not latin, and would be unreadable to an
    // operator reading a code back over the phone.
    throwsCode(() => normalisePromoCode('АБВГД'), 'invalid_characters');
    throwsCode(() => normalisePromoCode('ABC😀'), 'invalid_characters');
  });

  it('refuses empty and non-strings rather than coercing', () => {
    throwsCode(() => normalisePromoCode(''), 'required');
    throwsCode(() => normalisePromoCode('   '), 'required');
    throwsCode(() => normalisePromoCode(null), 'required');
    throwsCode(() => normalisePromoCode(undefined), 'required');
    throwsCode(() => normalisePromoCode(12345), 'required');
  });

  it('is exactly PROMO_CODE_LENGTH, not a hard-coded 5', () => {
    assert.equal(PROMO_CODE_LENGTH, 5);
    assert.equal(normalisePromoCode('A'.repeat(PROMO_CODE_LENGTH)).length, PROMO_CODE_LENGTH);
  });
});

describe('normaliseUsername — at least 6 alphanumeric characters', () => {
  it('accepts a valid username', () => {
    assert.equal(normaliseUsername('bekzod94'), 'bekzod94');
  });

  it('accepts exactly the minimum length', () => {
    assert.equal(normaliseUsername('abc123'), 'abc123');
  });

  it('refuses one character below the minimum', () => {
    throwsCode(() => normaliseUsername('abc12'), 'wrong_length', 'username');
  });

  it('accepts the maximum and refuses one past it', () => {
    const max = 'a'.repeat(USERNAME_MAX_LENGTH);
    assert.equal(normaliseUsername(max), max);
    throwsCode(() => normaliseUsername('a'.repeat(USERNAME_MAX_LENGTH + 1)), 'wrong_length');
  });

  it('refuses punctuation, spaces and non-latin', () => {
    throwsCode(() => normaliseUsername('bek_zod'), 'invalid_characters');
    throwsCode(() => normaliseUsername('bek zod'), 'invalid_characters');
    throwsCode(() => normaliseUsername('bekzod!'), 'invalid_characters');
    throwsCode(() => normaliseUsername('бекзод1'), 'invalid_characters');
  });

  it('refuses empty and non-strings', () => {
    throwsCode(() => normaliseUsername(''), 'required');
    throwsCode(() => normaliseUsername(null), 'required');
    throwsCode(() => normaliseUsername(42), 'required');
  });

  it('reports the field so the API can name it', () => {
    throwsCode(() => normaliseUsername('ab'), 'wrong_length', 'username');
    throwsCode(() => normalisePromoCode('ab'), 'wrong_length', 'own_promo_code');
  });

  it('has a sane min/max relationship', () => {
    assert.ok(USERNAME_MIN_LENGTH < USERNAME_MAX_LENGTH);
    assert.equal(USERNAME_MIN_LENGTH, 6);
  });
});

describe('reserved names — cannot be claimed by anyone', () => {
  it('refuses the obvious impersonation risks', () => {
    throwsCode(() => normaliseUsername('support'), 'reserved');
    throwsCode(() => normaliseUsername('ubexgo'), 'reserved');
    throwsCode(() => normaliseUsername('official'), 'reserved');
    throwsCode(() => normaliseUsername('moderator'), 'reserved');
  });

  it('🔴 ACCEPTS "admin1" — matching is EXACT, not substring', () => {
    // This assertion was originally written the other way round and failed,
    // which is worth keeping: 'admin1' is 6 characters (so it passes the length
    // rule) and is not the string 'admin', so it IS claimable. If that is not
    // wanted, the fix is a policy decision about near-miss impersonation, not a
    // bug — and it needs a rule richer than an exact list.
    assert.equal(normaliseUsername('admin1'), 'admin1');
  });

  it('is case-insensitive, like the column', () => {
    // 'SUPPORT' and 'support' are the same row to CITEXT, so the reserved list
    // must agree or the block is trivially bypassed by pressing shift.
    throwsCode(() => normaliseUsername('SUPPORT'), 'reserved');
    throwsCode(() => normaliseUsername('SuPpOrT'), 'reserved');
    throwsCode(() => normaliseUsername('UbexGo'), 'reserved');
  });

  it('blocks a reserved 5-char name as a promo code too', () => {
    throwsCode(() => normalisePromoCode('admin'), 'reserved');
  });

  it('does not over-block names that merely contain a reserved word', () => {
    // 'adminish' is not 'admin'. Substring matching here would refuse a lot of
    // legitimate names for no benefit.
    assert.equal(normaliseUsername('adminish'), 'adminish');
    assert.equal(normaliseUsername('supporter'), 'supporter');
  });

  it('every reserved name is lowercase, so the comparison works', () => {
    for (const name of RESERVED_NAMES) {
      assert.equal(name, name.toLowerCase(), `${name} must be listed in lowercase`);
    }
  });
});

describe('identifiersMatch — must agree with CITEXT', () => {
  it('treats differing case as the same identifier', () => {
    // If this disagreed with the column, a "is this code free?" check would say
    // yes and the insert would then fail on the unique index.
    assert.equal(identifiersMatch('AB12X', 'ab12x'), true);
    assert.equal(identifiersMatch('BekZod94', 'bekzod94'), true);
  });

  it('ignores surrounding whitespace', () => {
    assert.equal(identifiersMatch(' AB12X ', 'ab12x'), true);
  });

  it('still distinguishes genuinely different values', () => {
    assert.equal(identifiersMatch('AB12X', 'AB12Y'), false);
    assert.equal(identifiersMatch('bekzod94', 'bekzod95'), false);
  });
});

describe('isIdentifierProvided — is the request trying to SET this at all?', () => {
  it('says no to absent, null and empty string', () => {
    // 🔴 The columns are UNIQUE. If '' counted as a value, the second user to
    // save a profile they never typed a code into would collide with the first.
    assert.equal(isIdentifierProvided(undefined), false);
    assert.equal(isIdentifierProvided(null), false);
    assert.equal(isIdentifierProvided(''), false);
  });

  it('says yes to a real value', () => {
    assert.equal(isIdentifierProvided('AB12X'), true);
    assert.equal(isIdentifierProvided('bekzod94'), true);
  });

  it('says yes to whitespace, so it is REFUSED rather than silently skipped', () => {
    // '   ' is someone typing spaces into the box. Skipping it would treat a
    // filled-in field as untouched; the length rule must get to see it.
    assert.equal(isIdentifierProvided('   '), true);
  });
});

describe('the two identifiers are independent rules', () => {
  it('a valid promo code is too short to be a username', () => {
    const code = normalisePromoCode('AB12X');
    throwsCode(() => normaliseUsername(code), 'wrong_length');
  });

  it('a valid username is too long to be a promo code', () => {
    const name = normaliseUsername('bekzod94');
    throwsCode(() => normalisePromoCode(name), 'wrong_length');
  });
});
