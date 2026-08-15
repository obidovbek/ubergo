/**
 * Tests for the profile identifier validator (T-091).
 *
 * This middleware is the only thing standing between a request and two UNIQUE,
 * effectively permanent columns. It is testable at all because `validator.ts`
 * imports no Sequelize — only the i18n bundles, which are plain objects — so
 * unlike a service it can be executed here.
 *
 * ⚠️ The i18n assertions below EVALUATE the messages in all three locales
 * rather than grepping the translation files. A missing key does not throw in
 * this project: `t()` returns the key itself, so the user is shown the literal
 * string "validation.reserved". Only rendering the message catches that.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';

import { profileIdentifiersValidation, ValidationError } from './validator.js';

type Body = Record<string, unknown>;

/** Run the middleware over a body, reporting what happened to both sides. */
function run(body: Body, acceptLanguage?: string) {
  // Only `body` and `headers` are read, so a full Express Request is not built.
  const req = {
    body,
    headers: acceptLanguage ? { 'accept-language': acceptLanguage } : {}
  } as unknown as Request;

  let nexted = false;
  const next = () => {
    nexted = true;
  };

  try {
    profileIdentifiersValidation(req, {} as unknown as Response, next);
  } catch (error) {
    assert.ok(error instanceof ValidationError, `expected a ValidationError, got ${error}`);
    return { passed: false, error, body: req.body as Body, nexted };
  }

  return { passed: nexted, error: undefined, body: req.body as Body, nexted };
}

/** The single error for a field, or a failure naming what did come back. */
function errorFor(result: ReturnType<typeof run>, field: string) {
  assert.ok(result.error, 'expected the request to be refused, but it passed');
  const detail = result.error.errors.find((item) => item.field === field);
  assert.ok(
    detail,
    `expected an error on ${field}, got ${JSON.stringify(result.error.errors)}`
  );
  return detail;
}

describe('profileIdentifiersValidation — what it lets through', () => {
  it('accepts a valid code and username and calls next()', () => {
    const result = run({ own_promo_code: 'AB12X', username: 'bekzod94' });
    assert.equal(result.passed, true);
  });

  it('TRIMS both values into req.body — the controller must store what was checked', () => {
    // Length is measured after trimming, so if the controller stored the raw
    // value it would store something this validator never approved.
    const result = run({ own_promo_code: '  AB12X  ', username: ' bekzod94 ' });
    assert.equal(result.passed, true);
    assert.equal(result.body.own_promo_code, 'AB12X');
    assert.equal(result.body.username, 'bekzod94');
  });

  it('does NOT fold case — CITEXT owns uniqueness, the user owns their display', () => {
    const result = run({ own_promo_code: 'ab12x', username: 'BekzodX' });
    assert.equal(result.passed, true);
    assert.equal(result.body.own_promo_code, 'ab12x');
    assert.equal(result.body.username, 'BekzodX');
  });

  it('ignores a profile save that never mentions the two fields', () => {
    const result = run({ first_name: 'Bekzod', email: 'a@b.uz' });
    assert.equal(result.passed, true);
    assert.equal('own_promo_code' in result.body, false);
    assert.equal('username' in result.body, false);
  });

  it("treats '' and null as UNTOUCHED, not as a value and not as a clear", () => {
    // 🔴 Both screens PUT the whole profile. An empty box is a field the user
    // did not fill in — validating it would refuse an ordinary email edit, and
    // storing it would write '' into a UNIQUE column, where the second user to
    // save an untouched profile collides with the first.
    const result = run({ own_promo_code: '', username: null });
    assert.equal(result.passed, true);
    assert.equal(result.body.own_promo_code, '');
    assert.equal(result.body.username, null);
  });

  it('accepts the exact boundaries: 5 characters, 6 characters, 30 characters', () => {
    assert.equal(run({ own_promo_code: '12345' }).passed, true);
    assert.equal(run({ username: 'abc123' }).passed, true);
    assert.equal(run({ username: 'a'.repeat(30) }).passed, true);
  });
});

describe('profileIdentifiersValidation — what it refuses', () => {
  it('refuses a 4- and a 6-character promo code, naming the field', () => {
    for (const code of ['AB12', 'AB12XY']) {
      const detail = errorFor(run({ own_promo_code: code }), 'own_promo_code');
      assert.equal(detail.type, 'exactLength');
    }
  });

  it('refuses a username of 5 and of 31 characters with ONE range message', () => {
    // The util throws a single `wrong_length` for both ends; answering with a
    // range means the length rule is never re-derived here to pick a side.
    for (const name of ['abc12', 'a'.repeat(31)]) {
      const detail = errorFor(run({ username: name }), 'username');
      assert.equal(detail.type, 'lengthRange');
    }
  });

  it('refuses a code that is only 5 characters because of padding', () => {
    // 'AB1  ' trims to 3. Measured before trimming, this would have been legal.
    const detail = errorFor(run({ own_promo_code: 'AB1  ' }), 'own_promo_code');
    assert.equal(detail.type, 'exactLength');
  });

  it('reports whitespace-only as required, not as a length problem', () => {
    const detail = errorFor(run({ own_promo_code: '     ' }), 'own_promo_code');
    assert.equal(detail.type, 'required');
  });

  it('refuses anything outside latin letters and digits', () => {
    for (const code of ['AB-12', 'AB 12', 'AB_12', 'ABÇ12', 'АБВ12']) {
      const detail = errorFor(run({ own_promo_code: code }), 'own_promo_code');
      assert.equal(detail.type, 'alphanumeric', `expected ${code} to be refused`);
    }
  });

  it('refuses a reserved name whatever case it is typed in', () => {
    // CITEXT makes SUPPORT and support the same row, so the block has to fold
    // case or it is bypassed by holding shift.
    for (const name of ['support', 'SUPPORT', 'Support']) {
      const detail = errorFor(run({ username: name }), 'username');
      assert.equal(detail.type, 'reserved');
    }
  });

  it('still allows near-misses — matching is exact, not substring', () => {
    assert.equal(run({ username: 'supporter' }).passed, true);
    assert.equal(run({ username: 'admin1' }).passed, true);
  });

  it('reports BOTH fields at once, never one round trip each', () => {
    const result = run({ own_promo_code: 'AB', username: 'ab' });
    assert.ok(result.error);
    assert.equal(result.error.errors.length, 2);
    assert.deepEqual(
      result.error.errors.map((item) => item.field).sort(),
      ['own_promo_code', 'username']
    );
  });

  it('answers 422 — the status the apps read field errors from', () => {
    const result = run({ username: 'ab' });
    assert.ok(result.error);
    assert.equal(result.error.statusCode, 422);
  });

  it('does not call next() when it refuses', () => {
    const result = run({ username: 'ab' });
    assert.equal(result.nexted, false);
  });
});

describe('profileIdentifiersValidation — the message a user actually sees', () => {
  const LANGUAGES = ['uz', 'ru', 'en'];

  /** Every way each field can be refused, so no template is left unrendered. */
  const CASES: Array<{ body: Body; field: string }> = [
    { body: { own_promo_code: '   ' }, field: 'own_promo_code' },
    { body: { own_promo_code: 'AB12' }, field: 'own_promo_code' },
    { body: { own_promo_code: 'AB-12' }, field: 'own_promo_code' },
    { body: { own_promo_code: 'admin' }, field: 'own_promo_code' },
    { body: { username: '   ' }, field: 'username' },
    { body: { username: 'abc12' }, field: 'username' },
    { body: { username: 'a'.repeat(31) }, field: 'username' },
    { body: { username: 'abc-123' }, field: 'username' },
    { body: { username: 'support' }, field: 'username' }
  ];

  for (const language of LANGUAGES) {
    it(`renders every refusal in ${language} with no key and no placeholder left`, () => {
      for (const testCase of CASES) {
        const detail = errorFor(run(testCase.body, language), testCase.field);
        const message = detail.message;

        // A missing key renders as the key itself — the only symptom there is.
        assert.ok(
          !message.includes('validation.') && !message.includes('fields.'),
          `${language}: untranslated key in "${message}"`
        );
        // `t()` substitutes {field}/{min}/{max}/{length}; a leftover brace means
        // the template asked for a parameter nothing supplied.
        assert.ok(!message.includes('{'), `${language}: unsubstituted placeholder in "${message}"`);
        assert.ok(message.length > 0, `${language}: empty message`);
      }
    });
  }

  it('names the FIELD in the message — an error without its subject is useless', () => {
    // T-061: the owner's report was "it says the data is wrong but not which
    // line". The label is what makes two adjacent promo inputs distinguishable.
    const uz = errorFor(run({ own_promo_code: 'AB12' }, 'uz'), 'own_promo_code');
    assert.ok(uz.message.includes('promo'), `expected the label in "${uz.message}"`);

    const en = errorFor(run({ username: 'abc12' }, 'en'), 'username');
    assert.ok(en.message.includes('Username'), `expected the label in "${en.message}"`);
  });

  it('states the actual numbers, not a vague "wrong length"', () => {
    const code = errorFor(run({ own_promo_code: 'AB12' }, 'en'), 'own_promo_code');
    assert.ok(code.message.includes('5'), `expected the length in "${code.message}"`);

    const name = errorFor(run({ username: 'abc12' }, 'en'), 'username');
    assert.ok(name.message.includes('6'), `expected the minimum in "${name.message}"`);
    assert.ok(name.message.includes('30'), `expected the maximum in "${name.message}"`);
  });

  it('actually differs per locale — one bundle serving all three would pass everything above', () => {
    const uz = errorFor(run({ username: 'abc12' }, 'uz'), 'username').message;
    const ru = errorFor(run({ username: 'abc12' }, 'ru'), 'username').message;
    const en = errorFor(run({ username: 'abc12' }, 'en'), 'username').message;
    assert.notEqual(uz, ru);
    assert.notEqual(ru, en);
    assert.notEqual(uz, en);
  });

  it('falls back to uz for an unknown Accept-Language rather than leaking a key', () => {
    const detail = errorFor(run({ username: 'abc12' }, 'de'), 'username');
    const uz = errorFor(run({ username: 'abc12' }, 'uz'), 'username');
    assert.equal(detail.message, uz.message);
  });
});
