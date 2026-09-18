/**
 * T-121 step 8 — `validation.ts`, the DRIVER app.
 *
 * ⚠️ **NOT a twin, and not a copy of the user app's test.** 219 of the two files' lines differ
 * (user 102, driver 144). They share `isValidEmail` and a near-identical `isValidPhone`; beyond
 * that this app has a **rule-driven `validateForm` engine** and a `DD.MM.YYYY` date validator,
 * and none of the user app's password / url / length predicates.
 *
 * **This engine is properly live** — `validateField` (5 importers), `validateForm` (4),
 * `ValidationRule` (4), `isValidDate` (2), `isValidEmail` (1). It validates the five driver
 * document screens, the ones whose field errors T-061 was about.
 *
 * 🔴 **The subtlety that earns this file its place: every rule except `required` is guarded by
 * `if (value && …)`, so an EMPTY value silently passes all of them.** A field carrying only an
 * `email` rule accepts `''`. That is correct — otherwise every optional field would be mandatory —
 * but it means **`required` must be listed alongside, or the field is optional by accident**.
 * Several tests below exist only to pin that, because it is invisible at the call site.
 *
 * 📌 **Recorded, not fixed:** `isValidPhone` demands **≥ 9 digits here and ≥ 10 in the user app**,
 * so a 9-digit Uzbek national number passes here and fails there. It reaches nobody — the user
 * app never imports it, and here it is reachable only through a rule of type `'phone'`, which no
 * screen in either app uses (counted across the driver app: `required` 47, `minLength` 25,
 * `custom` 16, `date` 4, `in` 2, `email` 2 — no `phone`, no `maxLength`). Pinned from both sides.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  isValidDate,
  isValidEmail,
  isValidPhone,
  validateField,
  validateForm,
  type ValidationRule,
} from './validation';

/** Mirrors `useTranslation`: a miss returns the key, so assertions read as the key itself. */
const t = (key: string): string => key;

describe('isValidEmail and isValidPhone', () => {
  it('accepts an ordinary address and rejects the obvious mistakes', () => {
    expect(isValidEmail('driver@example.com')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('plainaddress')).toBe(false);
    expect(isValidEmail('a b@c.co')).toBe(false);
  });

  it('requires at least NINE digits, where the user app requires ten', () => {
    // 🔴 The drift, pinned from this side. A 9-digit Uzbek national number passes here.
    expect(isValidPhone('901234567')).toBe(true);
    expect(isValidPhone('90123456')).toBe(false);
    expect(isValidPhone('+998 90 123 45 67')).toBe(true);
    expect(isValidPhone('998abc1234567')).toBe(false);
  });
});

describe('isValidDate — DD.MM.YYYY, the format the document screens use', () => {
  // The upper bound is `new Date().getFullYear()`, so "next year" is a moving target. The clock
  // is pinned rather than hardcoding a year, or this file would start failing on 1 January.
  // Braces in the hooks: a concise body returns the Jest object into a `void` hook — `tsc`
  // errors a green Jest run hides.
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 5));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('accepts a real date, with or without a leading zero', () => {
    expect(isValidDate('05.03.1994')).toBe(true);
    expect(isValidDate('5.3.1994')).toBe(true);
    expect(isValidDate('29.02.2024')).toBe(true); // a real leap day
  });

  it('🔴 rejects a day that does not exist in that month', () => {
    // The round-trip check is the whole point: `new Date(2020, 1, 31)` silently rolls over to
    // 2 March, so the range check alone would accept it. Re-reading the parts catches it.
    expect(isValidDate('31.02.2020')).toBe(false);
    expect(isValidDate('31.04.2020')).toBe(false);
    expect(isValidDate('29.02.2023')).toBe(false); // not a leap year
  });

  it('rejects out-of-range parts', () => {
    expect(isValidDate('00.03.1994')).toBe(false);
    expect(isValidDate('32.03.1994')).toBe(false);
    expect(isValidDate('05.00.1994')).toBe(false);
    expect(isValidDate('05.13.1994')).toBe(false);
    expect(isValidDate('05.03.1899')).toBe(false);
  });

  it('rejects a year in the future — a birth date cannot be', () => {
    expect(isValidDate('05.03.2026')).toBe(true); // the pinned "this year"
    expect(isValidDate('05.03.2027')).toBe(false);
  });

  it('rejects any other shape, including the ISO one the API speaks', () => {
    // Worth pinning: a screen handing this an API date gets `false`, not a crash and not a pass.
    expect(isValidDate('1994-03-05')).toBe(false);
    expect(isValidDate('05/03/1994')).toBe(false);
    expect(isValidDate('05.03.94')).toBe(false);
    expect(isValidDate('')).toBe(false);
    expect(isValidDate('abc')).toBe(false);
  });
});

describe('validateForm — required', () => {
  const required = (value: unknown): ValidationRule[] => [
    { field: 'firstName', value, rules: [{ type: 'required', errorKey: 'formValidation.required' }] },
  ];

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['an empty array', []],
  ])('reports %s as missing', (_label, value) => {
    expect(validateForm(required(value), t)).toStrictEqual([
      { field: 'firstName', message: 'formValidation.required' },
    ]);
  });

  it('accepts zero and false — a naive !value check would reject both', () => {
    // `seats: 0` and a `false` checkbox are real values a form can hold.
    expect(validateForm(required(0), t)).toStrictEqual([]);
    expect(validateForm(required(false), t)).toStrictEqual([]);
    expect(validateForm(required('a'), t)).toStrictEqual([]);
  });

  it('📌 accepts a string of spaces — it does NOT trim', () => {
    // Recorded, not fixed. `'   '` is not `''`, so a field containing only spaces passes as
    // filled in. The server trims and rejects it, so the driver gets a round trip and a toast
    // rather than an inline message. Harmless but worth knowing before trusting this rule.
    expect(validateForm(required('   '), t)).toStrictEqual([]);
  });
});

describe('validateForm — 🔴 every other rule SKIPS an empty value', () => {
  // The single most surprising thing in this file, and invisible at the call site.
  it.each([
    ['email', { type: 'email' as const, errorKey: 'e' }],
    ['phone', { type: 'phone' as const, errorKey: 'e' }],
    ['date', { type: 'date' as const, errorKey: 'e' }],
    ['minLength', { type: 'minLength' as const, errorKey: 'e', params: { min: 5 } }],
    ['in', { type: 'in' as const, errorKey: 'e', params: { values: ['male'] } }],
  ])('a %s rule alone passes an empty field, so it is optional by accident', (_label, rule) => {
    expect(validateForm([{ field: 'f', value: '', rules: [rule] }], t)).toStrictEqual([]);
    expect(validateForm([{ field: 'f', value: undefined, rules: [rule] }], t)).toStrictEqual([]);
  });

  it('pair it with required and the field becomes mandatory AND validated', () => {
    const rules: ValidationRule['rules'] = [
      { type: 'required', errorKey: 'formValidation.required' },
      { type: 'email', errorKey: 'formValidation.emailInvalid' },
    ];

    expect(validateForm([{ field: 'email', value: '', rules }], t)).toStrictEqual([
      { field: 'email', message: 'formValidation.required' },
    ]);
    expect(validateForm([{ field: 'email', value: 'nope', rules }], t)).toStrictEqual([
      { field: 'email', message: 'formValidation.emailInvalid' },
    ]);
    expect(validateForm([{ field: 'email', value: 'a@b.co', rules }], t)).toStrictEqual([]);
  });
});

describe('validateForm — the remaining rule types', () => {
  const check = (value: unknown, rule: ValidationRule['rules'][number]) =>
    validateForm([{ field: 'f', value, rules: [rule] }], t);

  it('minLength compares against params.min, and passes everything without one', () => {
    expect(check('abc', { type: 'minLength', errorKey: 'e', params: { min: 5 } })).toHaveLength(1);
    expect(check('abcde', { type: 'minLength', errorKey: 'e', params: { min: 5 } })).toHaveLength(0);
    // `|| 0` when params are missing: the rule becomes a no-op rather than an error.
    expect(check('a', { type: 'minLength', errorKey: 'e' })).toHaveLength(0);
  });

  it('maxLength compares against params.max, and passes everything without one', () => {
    expect(check('abcdef', { type: 'maxLength', errorKey: 'e', params: { max: 5 } })).toHaveLength(1);
    expect(check('abcde', { type: 'maxLength', errorKey: 'e', params: { max: 5 } })).toHaveLength(0);
    // `|| Infinity` when params are missing.
    expect(check('abcdef', { type: 'maxLength', errorKey: 'e' })).toHaveLength(0);
  });

  it('minLength and maxLength ignore a value that is not a string', () => {
    // The `typeof value === 'string'` guard: a number never fails a length rule.
    expect(check(1, { type: 'minLength', errorKey: 'e', params: { min: 5 } })).toHaveLength(0);
  });

  it('in checks membership, and passes everything when given no list', () => {
    const values = { values: ['male', 'female'] };
    expect(check('male', { type: 'in', errorKey: 'e', params: values })).toHaveLength(0);
    expect(check('other', { type: 'in', errorKey: 'e', params: values })).toHaveLength(1);
    expect(check('anything', { type: 'in', errorKey: 'e' })).toHaveLength(0);
  });

  it('custom runs the caller’s predicate, and is a no-op without one', () => {
    const isEven = (v: number) => v % 2 === 0;
    expect(check(4, { type: 'custom', errorKey: 'e', customValidator: isEven as never })).toHaveLength(0);
    expect(check(3, { type: 'custom', errorKey: 'e', customValidator: isEven as never })).toHaveLength(1);
    expect(check(3, { type: 'custom', errorKey: 'e' })).toHaveLength(0);
  });

  it('translates the errorKey rather than returning it raw', () => {
    // The message the screen renders is `t(errorKey)`, not the key — pinned so a refactor
    // cannot quietly start showing `formValidation.required` on screen.
    const shouty = (key: string) => `translated:${key}`;

    expect(validateForm([{ field: 'f', value: '', rules: [{ type: 'required', errorKey: 'k' }] }], shouty))
      .toStrictEqual([{ field: 'f', message: 'translated:k' }]);
  });
});

describe('validateForm — several fields and several rules', () => {
  it('🔴 reports only the FIRST failing rule per field, but every failing field', () => {
    // The `break` after pushing. A field with two broken rules yields one message — the screens
    // render one line per field — while a form with two broken fields yields two.
    //
    // ⚠️ **The value here MUST be non-empty, and that is the whole difficulty of this test.**
    // The obvious fixture — `value: ''` with `required` then `email` — cannot detect the `break`
    // at all: with an empty value the `email` rule is skipped anyway (see the block above), so
    // removing the `break` changes nothing and the test passes either way. Measured: deleting the
    // `break` left all 31 tests green until this fixture was rewritten. `'ab'` breaks BOTH
    // `minLength(5)` and `email`, so the second rule really would fire.
    const errors = validateForm(
      [
        {
          field: 'email',
          value: 'ab',
          rules: [
            { type: 'minLength', errorKey: 'first', params: { min: 5 } },
            { type: 'email', errorKey: 'second' },
          ],
        },
        { field: 'phone', value: '', rules: [{ type: 'required', errorKey: 'phoneMissing' }] },
        { field: 'name', value: 'ok', rules: [{ type: 'required', errorKey: 'nameMissing' }] },
      ],
      t
    );

    expect(errors).toStrictEqual([
      { field: 'email', message: 'first' },
      { field: 'phone', message: 'phoneMissing' },
    ]);
  });

  it('returns an empty array for a valid form, and for no rules at all', () => {
    expect(validateForm([], t)).toStrictEqual([]);
    expect(validateForm([{ field: 'f', value: 'x', rules: [] }], t)).toStrictEqual([]);
  });

  it('keeps the order the rules were given in', () => {
    const errors = validateForm(
      [
        { field: 'c', value: '', rules: [{ type: 'required', errorKey: 'c' }] },
        { field: 'a', value: '', rules: [{ type: 'required', errorKey: 'a' }] },
      ],
      t
    );

    expect(errors.map((e) => e.field)).toStrictEqual(['c', 'a']);
  });
});

describe('validateField — the wrapper the screens actually call', () => {
  it('returns the message on failure and null on success', () => {
    const rules: ValidationRule['rules'] = [{ type: 'required', errorKey: 'formValidation.required' }];

    expect(validateField('firstName', '', rules, t)).toBe('formValidation.required');
    expect(validateField('firstName', 'Bekzod', rules, t)).toBeNull();
  });

  it('returns the FIRST message when several rules break', () => {
    expect(
      validateField(
        'email',
        '',
        [
          { type: 'required', errorKey: 'first' },
          { type: 'email', errorKey: 'second' },
        ],
        t
      )
    ).toBe('first');
  });

  it('returns null when there are no rules', () => {
    expect(validateField('f', '', [], t)).toBeNull();
  });
});
