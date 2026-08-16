/**
 * Tests for what a Paynet agent is shown about a payer (T-088).
 *
 * 🔴 `GetInformation` answers whoever calls it, and T-092 made `users.id`
 * enumerable from a known origin — so every test here is about the leak
 * direction: what escapes when the input is unexpected.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { maskPhoneForAgent, readClientId, parseUserId } from './identity.js';

describe('maskPhoneForAgent', () => {
  it('produces the shape the owner asked for', () => {
    // Enough for an agent to read back to the person in front of them.
    assert.equal(maskPhoneForAgent('+998901234585'), '+99890 ***4585');
  });

  it('hides the middle digits', () => {
    const masked = maskPhoneForAgent('+998901234585');
    assert.ok(!masked.includes('123'), 'the subscriber digits must not appear');
  });

  it('keeps the operator code, which a log-style mask would not', () => {
    // auditLogger's mask gives `+998**...85`; that is useless for a read-back.
    assert.ok(maskPhoneForAgent('+998901234585').startsWith('+99890'));
    assert.ok(maskPhoneForAgent('+998331234585').startsWith('+99833'));
  });

  it('tolerates formatting noise in the stored value', () => {
    assert.equal(maskPhoneForAgent('+998 90 123 45 85'), '+99890 ***4585');
    assert.equal(maskPhoneForAgent('+998-90-123-45-85'), '+99890 ***4585');
  });

  it('handles a number stored without the leading +', () => {
    assert.equal(maskPhoneForAgent('998901234585'), '+99890 ***4585');
  });

  it('🔴 reveals NOTHING for a value too short to mask safely', () => {
    // The failure direction that matters: an unforeseen format must not fall
    // through and print itself.
    assert.equal(maskPhoneForAgent('12345'), '***');
    assert.equal(maskPhoneForAgent('+9989'), '***');
    assert.equal(maskPhoneForAgent('1'), '***');
  });

  it('returns empty for a missing number rather than the word "null"', () => {
    // ⚠️ The CALLER must turn this into something an agent can read —
    // `PaynetService.getInformation` substitutes a marker, because a blank
    // field on a payment terminal looks like a broken screen rather than
    // "no number on file". Proven on test3: a real user had no phone row and
    // the agent's field came back empty.
    assert.equal(maskPhoneForAgent(null), '');
    assert.equal(maskPhoneForAgent(undefined), '');
    assert.equal(maskPhoneForAgent(''), '');
    assert.equal(maskPhoneForAgent('   '), '');
  });

  it('🔴 an empty result is falsy, so `|| fallback` works at the call site', () => {
    // Pins the contract getInformation relies on. If this ever returned '   '
    // or 'null' instead, the fallback would silently stop firing and the blank
    // would come back.
    assert.equal(Boolean(maskPhoneForAgent(null)), false);
    assert.equal(Boolean(maskPhoneForAgent('')), false);
    assert.ok(Boolean(maskPhoneForAgent('+998901234585')), 'a real number stays truthy');
  });

  it('never emits more than four consecutive subscriber digits', () => {
    // A blunt guard against a future edit widening the window by accident.
    for (const number of ['+998901234585', '+998887776655', '998901112233']) {
      const masked = maskPhoneForAgent(number);
      const runs = masked.match(/\d{5,}/g) ?? [];
      // The head (+99890 = 5 digits) is expected; nothing longer should appear
      // after the mask marker.
      const afterMask = masked.split('***')[1] ?? '';
      assert.ok(afterMask.length <= 4, `too much revealed in ${masked}`);
      assert.ok(runs.every((run) => run.length <= 6), `unexpected long run in ${masked}`);
    }
  });
});

describe('readClientId — blocker ②, the negotiated field name', () => {
  it('reads the JSON spec’s client_id', () => {
    assert.equal(readClientId({ client_id: '634247' }), '634247');
  });

  it('reads a numeric client_id, which the spec’s own sample uses', () => {
    // GetInformation's sample sends 634247 unquoted; PerformTransaction quotes
    // it. Both must work or one of the two methods breaks on day one.
    assert.equal(readClientId({ client_id: 634247 }), '634247');
  });

  it('accepts the annex’s `account` as an alias', () => {
    // Costs one line, removes a whole class of go-live failure if Paynet
    // answers "call it account".
    assert.equal(readClientId({ account: '1100001' }), '1100001');
  });

  it('prefers client_id when both are present', () => {
    assert.equal(readClientId({ client_id: '111', account: '222' }), '111');
  });

  it('returns null rather than guessing', () => {
    assert.equal(readClientId({}), null);
    assert.equal(readClientId(null), null);
    assert.equal(readClientId(undefined), null);
    assert.equal(readClientId('not an object'), null);
    assert.equal(readClientId({ client_id: '' }), null);
    assert.equal(readClientId({ client_id: '   ' }), null);
    assert.equal(readClientId({ client_id: { nested: 1 } }), null);
    assert.equal(readClientId({ client_id: null }), null);
  });

  it('refuses an unsafe numeric id instead of truncating it', () => {
    assert.equal(readClientId({ client_id: 1e300 }), null);
  });
});

describe('parseUserId', () => {
  it('parses a post-T-092 id', () => {
    assert.equal(parseUserId('1100001'), 1100001);
  });

  it('tolerates the spaces a human types into a terminal', () => {
    assert.equal(parseUserId('1 100 001'), 1100001);
  });

  it('🔴 refuses anything that is not purely digits', () => {
    // A lenient parse here looks up the WRONG PERSON'S account.
    assert.equal(parseUserId('1100001abc'), null);
    assert.equal(parseUserId('abc'), null);
    assert.equal(parseUserId('11.0'), null);
    assert.equal(parseUserId('-1100001'), null);
    assert.equal(parseUserId('+1100001'), null);
    assert.equal(parseUserId('0x10'), null);
    assert.equal(parseUserId('1e6'), null);
  });

  it('refuses zero, negatives and the empty string', () => {
    assert.equal(parseUserId('0'), null);
    assert.equal(parseUserId(''), null);
    assert.equal(parseUserId(null), null);
  });

  it('refuses an id beyond the safe integer range', () => {
    assert.equal(parseUserId('99999999999999999999'), null);
  });
});
