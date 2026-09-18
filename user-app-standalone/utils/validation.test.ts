/**
 * T-121 step 8 — `validation.ts`, the USER app.
 *
 * ⚠️ **NOT a twin.** The two apps' `validation.ts` share only `isValidEmail` and a near-identical
 * `isValidPhone`; 219 of their lines differ (user 102, driver 144). This app has a bag of small
 * predicates; the driver app has a whole rule-driven `validateForm` engine and a `DD.MM.YYYY`
 * date validator, and has none of the password/url/length helpers below. Two real files, read
 * from source — copying either would have been wrong.
 *
 * 📌 **Only `isValidEmail` is live in this app** (2 importers); the other eight exports have no
 * callers at all. Tested because they are nearly free, but a failure outside `isValidEmail` means
 * "this was always wrong", not "a user is hitting this".
 *
 * 📌 **A drift worth recording, and deliberately not fixed:** `isValidPhone` demands **≥ 10
 * digits here and ≥ 9 in the driver app**. An Uzbek national number is **9** digits
 * (`90 123 45 67`), 12 with the `998` country code — so this app's threshold would reject a
 * national-format number the driver app accepts. It reaches nobody: this app never imports
 * `isValidPhone`, and the driver app only reaches its copy through a `validateForm` rule of type
 * `'phone'`, which **no screen in either app uses** (counted: `required` 47, `minLength` 25,
 * `custom` 16, `date` 4, `in` 2, `email` 2 — and no `phone`). Pinned below from both sides so the
 * disagreement is at least visible.
 */
import { describe, expect, it } from '@jest/globals';

import {
  isNumeric,
  isPositive,
  isRequired,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidUrl,
  maxLength,
  minLength,
} from './validation';

describe('isValidEmail — the only live export in this app', () => {
  it.each([
    'a@b.co',
    'driver@example.com',
    'first.last@sub.domain.uz',
    'user+tag@example.com',
  ])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['no @', 'plainaddress'],
    ['no domain dot', 'a@b'],
    ['nothing before the @', '@b.co'],
    ['nothing after the @', 'a@'],
    ['a space inside', 'a b@c.co'],
    ['two @', 'a@b@c.co'],
    ['a trailing space', 'a@b.co '],
  ])('rejects %s', (_label, email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it('📌 is permissive by design — it is a typo check, not RFC 5322', () => {
    // Worth pinning so nobody "fixes" it into a stricter regex and starts rejecting real
    // addresses. The server validates properly; this only catches a fat-fingered entry.
    expect(isValidEmail('a@b.c')).toBe(true);
    expect(isValidEmail('"weird"@example.com')).toBe(true);
  });
});

describe('isValidPhone — DEAD here, and stricter than the driver app’s copy', () => {
  it('requires at least TEN digits, where the driver app requires nine', () => {
    // 🔴 The drift, pinned from this side. A 9-digit Uzbek national number fails here.
    expect(isValidPhone('901234567')).toBe(false);
    expect(isValidPhone('9012345678')).toBe(true);
    expect(isValidPhone('+998 90 123 45 67')).toBe(true);
  });

  it('rejects anything carrying a letter, whatever its length', () => {
    expect(isValidPhone('998abc1234567')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });

  it('accepts the punctuation a person actually types', () => {
    expect(isValidPhone('(998) 90-123-45-67')).toBe(true);
    expect(isValidPhone('+998 90 123 45 67')).toBe(true);
  });
});

describe('isValidPassword — DEAD: no callers in this app', () => {
  it('accepts a password meeting all four rules', () => {
    expect(isValidPassword('Salom123')).toStrictEqual({ isValid: true, errors: [] });
  });

  it('names every rule the password breaks, not just the first', () => {
    // The shape matters more than the wording: the caller renders the list.
    const result = isValidPassword('abc');

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3); // too short, no uppercase, no digit
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it.each([
    ['too short', 'Sal123', 'at least 8 characters'],
    ['no uppercase', 'salom123', 'one uppercase letter'],
    ['no lowercase', 'SALOM123', 'one lowercase letter'],
    ['no digit', 'SalomSalom', 'one number'],
  ])('rejects one that is %s', (_label, password, fragment) => {
    const result = isValidPassword(password);

    expect(result.isValid).toBe(false);
    expect(result.errors.join(' ')).toContain(fragment);
  });

  it('📌 says nothing about symbols, and its messages are hardcoded ENGLISH', () => {
    // Both are facts a caller would need to know: there is no symbol requirement, and these
    // strings are not translation keys — rendering them in the Uzbek UI would show English.
    // Unreachable today; it is why nothing calls this.
    expect(isValidPassword('Salom123!@#').isValid).toBe(true);
    expect(isValidPassword('abc').errors[0]).toMatch(/^Password must/);
  });
});

describe('the remaining predicates — DEAD: no callers in this app', () => {
  it('isRequired treats whitespace as empty, but zero and false as present', () => {
    // The distinction that makes this function worth having: `''.trim()` is empty, but `0` is a
    // legitimate value a form may hold, and a naive `!value` would reject it.
    expect(isRequired('a')).toBe(true);
    expect(isRequired('   ')).toBe(false);
    expect(isRequired('')).toBe(false);
    expect(isRequired(0)).toBe(true);
    expect(isRequired(false)).toBe(true);
    expect(isRequired(null)).toBe(false);
    expect(isRequired(undefined)).toBe(false);
  });

  it('minLength and maxLength are inclusive at the boundary', () => {
    expect(minLength('abc', 3)).toBe(true);
    expect(minLength('ab', 3)).toBe(false);
    expect(maxLength('abc', 3)).toBe(true);
    expect(maxLength('abcd', 3)).toBe(false);
  });

  it('isNumeric rejects the empty string, which Number() would call zero', () => {
    // `Number('')` is 0 and `Number('  ')` is 0, so the explicit trim check is the whole point.
    expect(isNumeric('42')).toBe(true);
    expect(isNumeric('4.2')).toBe(true);
    expect(isNumeric('-42')).toBe(true);
    expect(isNumeric('')).toBe(false);
    expect(isNumeric('   ')).toBe(false);
    expect(isNumeric('abc')).toBe(false);
  });

  it('isPositive excludes zero', () => {
    expect(isPositive(1)).toBe(true);
    expect(isPositive(0)).toBe(false);
    expect(isPositive(-1)).toBe(false);
  });

  it('isValidUrl answers via the URL constructor, so it accepts any scheme', () => {
    // Pinned because it is broader than "a web address": `tel:` and `mailto:` parse fine, and a
    // bare domain does not.
    expect(isValidUrl('https://ubexgo.uz')).toBe(true);
    expect(isValidUrl('tel:+998901234567')).toBe(true);
    expect(isValidUrl('ubexgo.uz')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});
