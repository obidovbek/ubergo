/**
 * T-129 — `readField` is what lets a validation rule name a nested field.
 *
 * The case that matters is the first one: the licence screen's body, with the
 * number one level down. Everything else is the edges a body from an unknown
 * client can present — a branch that is missing, null, or a string.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { readField } from './readField.js';

/** The shape `DriverLicenseScreen` actually posts. */
const LICENCE_BODY = {
  license: { license_number: 'AB1234567', issue_date: '2015-03-15', category_b: '2015-03-15' },
  emergencyContacts: [{ phone_country_code: '+998', phone_number: '901234567', relationship: 'Otam' }],
};

describe('readField', () => {
  it('reads one level down — the licence number where the screen puts it', () => {
    assert.equal(readField(LICENCE_BODY, 'license.license_number'), 'AB1234567');
    assert.equal(readField(LICENCE_BODY, 'license.category_b'), '2015-03-15');
  });

  it('a plain key still reads the top level, so every flat rule is unchanged', () => {
    assert.equal(readField({ pinfl: '12345678901234' }, 'pinfl'), '12345678901234');
    assert.deepEqual(readField(LICENCE_BODY, 'license'), LICENCE_BODY.license);
  });

  it('is undefined when the path does not exist — at the top or below', () => {
    assert.equal(readField(LICENCE_BODY, 'license_number'), undefined); // the OLD rule's view
    assert.equal(readField(LICENCE_BODY, 'license.expiry_date'), undefined);
    assert.equal(readField(LICENCE_BODY, 'passport.pinfl'), undefined);
  });

  it('is undefined, not a throw, when a branch is null, a string or a number', () => {
    assert.equal(readField({ license: null }, 'license.license_number'), undefined);
    assert.equal(readField({ license: 'AB1234567' }, 'license.license_number'), undefined);
    assert.equal(readField({ license: 42 }, 'license.license_number'), undefined);
    assert.equal(readField(null, 'license.license_number'), undefined);
    assert.equal(readField(undefined, 'pinfl'), undefined);
  });

  it('walks into an array by index', () => {
    assert.equal(readField(LICENCE_BODY, 'emergencyContacts.0.phone_number'), '901234567');
    assert.equal(readField(LICENCE_BODY, 'emergencyContacts.1.phone_number'), undefined);
  });
});
