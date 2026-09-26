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
import type { NextFunction, Request, Response } from 'express';

import {
  licenseValidation,
  passportValidation,
  personalInfoValidation,
  profileIdentifiersValidation,
  taxiLicenseValidation,
  ValidationError,
} from './validator.js';

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

/*
 * ── T-129: the driver-registration validators ──────────────────────────────
 *
 * Two defects the owner hit on a phone, both invisible to a type checker:
 *   ① `licenseValidation` required `license_number` at the TOP level while
 *      `DriverLicenseScreen` posts it under `license` — so every licence save
 *      was refused for a field the body did contain.
 *   ② the `date` rule was `Date.parse`, which reads `01.03.2015` as January 3rd
 *      exactly as the ORM did — a swapped date passed the server and was stored.
 *
 * ⚠️ These assertions run the REAL exported middleware over the REAL payload
 * shape the screens send, and they EVALUATE every message in all three locales.
 * A rule naming a field the dictionary has not got shows the raw column instead,
 * and only rendering the sentence catches that.
 */

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

/** Run any of the exported validators over a body. */
function check(middleware: Middleware, body: Body, acceptLanguage?: string) {
  const req = {
    body,
    params: {},
    query: {},
    headers: acceptLanguage ? { 'accept-language': acceptLanguage } : {},
  } as unknown as Request;

  let nexted = false;
  try {
    middleware(req, {} as unknown as Response, () => {
      nexted = true;
    });
  } catch (error) {
    assert.ok(error instanceof ValidationError, `expected a ValidationError, got ${error}`);
    return { passed: false, errors: error.errors, status: error.statusCode };
  }
  return { passed: nexted, errors: [] as ValidationError['errors'], status: 200 };
}

/** The refusal for one field, or a failure naming what did come back. */
function detailFor(result: ReturnType<typeof check>, field: string) {
  assert.equal(result.passed, false, 'expected the request to be refused, but it passed');
  const detail = result.errors.find((item) => item.field === field);
  assert.ok(detail, `expected an error on ${field}, got ${JSON.stringify(result.errors)}`);
  return detail;
}

/** Exactly what `DriverLicenseScreen` posts, once its dates are converted. */
const LICENCE_BODY = {
  license: {
    license_number: 'AB1234567',
    issue_date: '2015-03-15',
    category_b: '2015-03-15',
    category_be: '2018-07-01',
  },
  emergencyContacts: [
    { phone_country_code: '+998', phone_number: '901234567', relationship: 'Otam' },
  ],
};

/** What `DriverPassportScreen` posts (it drops empty strings before sending). */
const PASSPORT_BODY = {
  first_name: 'Bekzod',
  last_name: 'Obidov',
  gender: 'male',
  birth_date: '1994-05-20',
  id_card_number: 'AB1234567',
  pinfl: '12345678901234',
  issue_date: '2020-01-15',
  expiry_date: '2030-01-15',
};

describe('T-129 ① licenseValidation reads the field where the screen puts it', () => {
  it("accepts the screen's own nested payload — this is the save that used to fail", () => {
    const result = check(licenseValidation, LICENCE_BODY);
    assert.equal(result.passed, true, JSON.stringify(result.errors));
  });

  it('still refuses a licence with no number, and names it', () => {
    const detail = detailFor(
      check(licenseValidation, { license: {} }, 'uz'),
      'license.license_number'
    );
    assert.equal(detail.type, 'required');
    assert.equal(detail.message, 'Guvohnoma raqami majburiy maydon');
  });

  it('refuses a body that puts the number at the TOP level — that is not the contract', () => {
    // The mirror of the old bug: whichever level the rule is read at, one of
    // these two tests goes red if it is the wrong one.
    assert.equal(check(licenseValidation, { license_number: 'AB1234567' }).passed, false);
  });

  it('names the field in every locale, never a translation key or a raw column', () => {
    for (const [language, expected] of [
      ['uz', 'Guvohnoma raqami'],
      ['ru', 'Номер прав'],
      ['en', 'License Number'],
    ] as const) {
      const message = detailFor(
        check(licenseValidation, { license: {} }, language),
        'license.license_number'
      ).message;
      assert.ok(message.includes(expected), `expected "${expected}" in "${message}" (${language})`);
      assert.ok(!message.includes('fields.'), `a translation key leaked: "${message}"`);
      assert.ok(!message.includes('license_number'), `the raw column leaked: "${message}"`);
    }
  });

  it('reports the field with its full path, which is what the app maps onto its form', () => {
    // `DriverLicenseScreen` strips the `license.` prefix. A bare leaf would work
    // too, but the path says which object the field came from.
    const detail = detailFor(check(licenseValidation, { license: {} }), 'license.license_number');
    assert.equal(detail.field, 'license.license_number');
  });
});

describe('T-129 ② a DATEONLY field accepts ISO only, on every driver route', () => {
  it("accepts the screens' real payloads", () => {
    assert.equal(check(passportValidation, PASSPORT_BODY).passed, true);
    assert.equal(
      check(personalInfoValidation, {
        first_name: 'Bekzod',
        last_name: 'Obidov',
        gender: 'male',
        birth_date: '1994-05-20',
      }).passed,
      true
    );
    assert.equal(
      check(taxiLicenseValidation, {
        license_number: 'TX-1',
        license_issue_date: '2024-02-29',
        license_sheet_valid_from: '2024-03-01',
        license_sheet_valid_until: '2026-03-01',
      }).passed,
      true
    );
  });

  /*
   * 🔴 The exact two strings off the owner's phone. `15.03.2015` became
   * "Invalid date" (a 500 behind a generic toast); `01.03.2015` became
   * 2015-01-03 and was SAVED, day and month exchanged.
   */
  for (const bad of ['15.03.2015', '01.03.2015']) {
    it(`refuses ${bad} — the display format the app used to post`, () => {
      for (const field of ['birth_date', 'issue_date', 'expiry_date']) {
        const result = check(passportValidation, { ...PASSPORT_BODY, [field]: bad });
        assert.equal(detailFor(result, field).type, 'invalidDate');
      }

      const licence = { ...LICENCE_BODY, license: { ...LICENCE_BODY.license, category_b: bad } };
      assert.equal(detailFor(check(licenseValidation, licence), 'license.category_b').type, 'invalidDate');

      const personal = { first_name: 'B', last_name: 'O', gender: 'male', birth_date: bad };
      assert.equal(detailFor(check(personalInfoValidation, personal), 'birth_date').type, 'invalidDate');

      const taxi = { license_number: 'TX-1', license_sheet_valid_until: bad };
      assert.equal(
        detailFor(check(taxiLicenseValidation, taxi), 'license_sheet_valid_until').type,
        'invalidDate'
      );
    });
  }

  it('refuses a date the calendar has not got, and an unpadded one', () => {
    // moment rolls 2015-02-30 forward to March 2nd rather than refusing it, and
    // `Date.parse('2015-3-5')` succeeds — both used to reach the column.
    for (const bad of ['2015-02-30', '2015-3-5', '2015-13-01']) {
      const result = check(passportValidation, { ...PASSPORT_BODY, issue_date: bad });
      assert.equal(detailFor(result, 'issue_date').type, 'invalidDate', `${bad} should be refused`);
    }
  });

  it('skips a date that is absent or empty — no screen requires one', () => {
    const { birth_date: _b, issue_date: _i, expiry_date: _e, ...noDates } = PASSPORT_BODY;
    assert.equal(check(passportValidation, noDates).passed, true);
    assert.equal(check(passportValidation, { ...noDates, issue_date: '' }).passed, true);
    assert.equal(check(licenseValidation, { license: { license_number: 'AB1' } }).passed, true);
  });

  it('every one of the 16 validated date fields renders a named message in all three locales', () => {
    const licenceDateFields = [
      'birth_date',
      'issue_date',
      'category_a',
      'category_b',
      'category_c',
      'category_d',
      'category_be',
      'category_ce',
      'category_de',
    ];

    const cases: Array<[Middleware, Body, string]> = [
      [personalInfoValidation, { first_name: 'B', last_name: 'O', gender: 'male', birth_date: 'x' }, 'birth_date'],
      [passportValidation, { ...PASSPORT_BODY, birth_date: 'x' }, 'birth_date'],
      [passportValidation, { ...PASSPORT_BODY, issue_date: 'x' }, 'issue_date'],
      [passportValidation, { ...PASSPORT_BODY, expiry_date: 'x' }, 'expiry_date'],
      ...licenceDateFields.map(
        (field) =>
          [licenseValidation, { license: { license_number: 'AB1', [field]: 'x' } }, `license.${field}`] as
            [Middleware, Body, string]
      ),
      [taxiLicenseValidation, { license_number: 'TX', license_issue_date: 'x' }, 'license_issue_date'],
      [taxiLicenseValidation, { license_number: 'TX', license_sheet_valid_from: 'x' }, 'license_sheet_valid_from'],
      [taxiLicenseValidation, { license_number: 'TX', license_sheet_valid_until: 'x' }, 'license_sheet_valid_until'],
    ];

    assert.equal(cases.length, 16, 'the driver routes validate 16 DATEONLY fields');

    for (const [middleware, body, field] of cases) {
      for (const language of ['uz', 'ru', 'en'] as const) {
        const message = detailFor(check(middleware, body, language), field).message;
        assert.ok(message.length > 0, `${field} (${language}) rendered nothing`);
        assert.ok(!message.includes('fields.'), `${field} (${language}) leaked a key: "${message}"`);
        assert.ok(!message.includes('validation.'), `${field} (${language}) leaked a key: "${message}"`);
        /*
         * 🔴 The assertion that earns its keep. Removing one `fields.*` entry
         * left every check above happy, because `getFieldName` falls back to the
         * column name — which is a plausible-looking word, not a visible key. No
         * label in any of the three dictionaries contains a snake_case token, so
         * one appearing here means the dictionary is missing that field.
         */
        assert.ok(
          !/[a-z]+_[a-z]+/.test(message),
          `${field} (${language}) shows the raw column instead of a label: "${message}"`
        );
      }
    }
  });

  it('a date refusal NAMES which date — nine of them share the licence page', () => {
    // Before T-129 every one of these read "Sana noto'g'ri formatda", so a
    // driver with nine date fields was told only that one of them was wrong.
    const issue = detailFor(check(passportValidation, { ...PASSPORT_BODY, issue_date: 'x' }, 'uz'), 'issue_date').message;
    const expiry = detailFor(check(passportValidation, { ...PASSPORT_BODY, expiry_date: 'x' }, 'uz'), 'expiry_date').message;
    assert.notEqual(issue, expiry);
    assert.ok(issue.includes('Berilgan sana'), issue);
    assert.ok(expiry.includes('Amal qilish muddati'), expiry);

    const categoryB = detailFor(
      check(licenseValidation, { license: { license_number: 'AB1', category_b: 'x' } }, 'uz'),
      'license.category_b'
    ).message;
    assert.ok(categoryB.includes('Kategoriya B'), categoryB);
  });

  it('answers 422 with a per-field array — the shape the apps read', () => {
    const result = check(passportValidation, { ...PASSPORT_BODY, issue_date: '15.03.2015' });
    assert.equal(result.status, 422);
    assert.equal(result.errors.length, 1);
    assert.equal(detailFor(result, 'issue_date').field, 'issue_date');
  });
});
