/**
 * Tests for the Paynet JSON-RPC envelope (T-088).
 *
 * The shapes are verbatim from docs/PAYNET.md §4-5, so the samples below are
 * used as the fixtures — if Paynet's own examples do not round-trip, nothing
 * else matters.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseRequest,
  extractId,
  success,
  failure,
  failureFrom,
  isPaynetMethod,
  PAYNET_METHODS
} from './envelope.js';
import { PaynetError, PAYNET_ERRORS } from './errors.js';

/** The GetInformation sample from docs/PAYNET.md §5, verbatim. */
const SAMPLE_GET_INFORMATION = {
  jsonrpc: '2.0',
  method: 'GetInformation',
  id: 12350,
  params: { serviceId: 1, fields: { client_id: 634247 } }
};

/** The PerformTransaction sample from docs/PAYNET.md §5, verbatim. */
const SAMPLE_PERFORM = {
  jsonrpc: '2.0',
  method: 'PerformTransaction',
  id: 12345,
  params: {
    amount: 100000,
    serviceId: 1,
    transactionId: 12345678900,
    fields: { client_id: '634247' }
  }
};

describe('parseRequest — Paynet’s own samples', () => {
  it('accepts the GetInformation sample', () => {
    const parsed = parseRequest(SAMPLE_GET_INFORMATION);
    assert.equal(parsed.method, 'GetInformation');
    assert.equal(parsed.id, 12350);
    assert.deepEqual(parsed.params.fields, { client_id: 634247 });
  });

  it('accepts the PerformTransaction sample', () => {
    const parsed = parseRequest(SAMPLE_PERFORM);
    assert.equal(parsed.method, 'PerformTransaction');
    assert.equal(parsed.params.amount, 100000);
    assert.equal(parsed.params.transactionId, 12345678900);
  });

  it('accepts all six mandatory methods', () => {
    for (const method of PAYNET_METHODS) {
      const parsed = parseRequest({ jsonrpc: '2.0', method, id: 1, params: {} });
      assert.equal(parsed.method, method);
    }
    assert.equal(PAYNET_METHODS.length, 6);
  });
});

describe('parseRequest — rejection', () => {
  it('rejects a body that is not an object', () => {
    for (const body of [null, undefined, 'string', 42, true]) {
      assert.throws(() => parseRequest(body), PaynetError);
    }
  });

  it('rejects a JSON-RPC batch, which Paynet’s documents never use', () => {
    assert.throws(() => parseRequest([SAMPLE_PERFORM]), PaynetError);
  });

  it('rejects a wrong or missing jsonrpc version', () => {
    assert.throws(() => parseRequest({ method: 'GetStatement', id: 1 }), PaynetError);
    assert.throws(
      () => parseRequest({ jsonrpc: '1.0', method: 'GetStatement', id: 1 }),
      PaynetError
    );
  });

  it('rejects an unknown method with BAD_COMMAND', () => {
    assert.throws(
      () => parseRequest({ jsonrpc: '2.0', method: 'DropEverything', id: 1, params: {} }),
      (error: unknown) => {
        assert.ok(error instanceof PaynetError);
        assert.equal(error.errorName, 'BAD_COMMAND');
        return true;
      }
    );
  });

  it('is case-sensitive about method names', () => {
    // "performtransaction" is not the contract's name for anything.
    assert.throws(
      () => parseRequest({ jsonrpc: '2.0', method: 'performtransaction', id: 1, params: {} }),
      PaynetError
    );
  });

  it('rejects params that are not an object', () => {
    assert.throws(
      () => parseRequest({ jsonrpc: '2.0', method: 'GetStatement', id: 1, params: 'nope' }),
      PaynetError
    );
    assert.throws(
      () => parseRequest({ jsonrpc: '2.0', method: 'GetStatement', id: 1, params: [1, 2] }),
      PaynetError
    );
  });

  it('treats absent params as empty, leaving field checks to the handler', () => {
    const parsed = parseRequest({ jsonrpc: '2.0', method: 'GetStatement', id: 7 });
    assert.deepEqual(parsed.params, {});
  });
});

describe('the id is echoed back exactly as it arrived', () => {
  it('preserves a numeric id', () => {
    assert.equal(extractId({ id: 12345 }), 12345);
    assert.equal(success(12345, {}).id, 12345);
  });

  it('preserves a string id, because Paynet’s own samples use both', () => {
    // Their request shows "id":12345 and the response quotes "id":"12345".
    // Normalising to one type would be us guessing on their behalf.
    assert.equal(extractId({ id: '12345' }), '12345');
    assert.strictEqual(success('12345', {}).id, '12345');
  });

  it('does not coerce a numeric string into a number', () => {
    assert.strictEqual(extractId({ id: '42' }), '42');
    assert.notStrictEqual(extractId({ id: '42' }), 42);
  });

  it('falls back to null for a missing or unusable id', () => {
    assert.equal(extractId({}), null);
    assert.equal(extractId(null), null);
    assert.equal(extractId('not an object'), null);
    assert.equal(extractId({ id: { nested: true } }), null);
  });

  it('recovers the id from a body that FAILS validation', () => {
    // The reason extractId is separate from parseRequest: a malformed request
    // must still be answerable with its own id, or Paynet cannot match the
    // error to the call that caused it.
    const malformed = { jsonrpc: '1.0', method: 'Nope', id: 999 };
    assert.throws(() => parseRequest(malformed), PaynetError);
    assert.equal(extractId(malformed), 999);
  });
});

describe('response envelopes', () => {
  it('builds a success envelope in the documented shape', () => {
    const response = success(123, { client_id: '1463398', fio: '+99890 ***4585' });
    assert.deepEqual(response, {
      jsonrpc: '2.0',
      id: 123,
      result: { client_id: '1463398', fio: '+99890 ***4585' }
    });
  });

  it('builds a failure envelope in the documented shape', () => {
    const response = failure(1, 'ALREADY_EXISTS', 'Transaction already exists');
    assert.equal(response.jsonrpc, '2.0');
    assert.equal(response.id, 1);
    assert.equal(response.error.code, PAYNET_ERRORS.ALREADY_EXISTS);
    assert.equal(response.error.message, 'Transaction already exists');
  });

  it('carries a PaynetError’s own code through failureFrom', () => {
    const response = failureFrom(5, new PaynetError('CANNOT_CANCEL', 'already spent'));
    assert.equal(response.error.code, PAYNET_ERRORS.CANNOT_CANCEL);
    assert.equal(response.error.message, 'already spent');
  });

  it('does NOT leak an unexpected exception onto the wire', () => {
    // A stack trace or SQL fragment leaving our network is the failure mode
    // this guards; Paynet gets the generic system error instead.
    const leaky = new Error('connect ECONNREFUSED 10.0.0.5:5432 — password=hunter2');
    const response = failureFrom(5, leaky);
    assert.equal(response.error.code, PAYNET_ERRORS.SYSTEM_ERROR);
    assert.equal(response.error.message, 'internal error');
    assert.ok(!response.error.message.includes('hunter2'));
    assert.ok(!response.error.message.includes('10.0.0.5'));
  });

  it('preserves the id on a failure, including a null one', () => {
    assert.equal(failureFrom(null, new Error('x')).id, null);
    assert.equal(failureFrom('abc', new Error('x')).id, 'abc');
  });
});

describe('isPaynetMethod', () => {
  it('recognises exactly the six', () => {
    assert.ok(isPaynetMethod('PerformTransaction'));
    assert.ok(isPaynetMethod('ChangePassword'));
    assert.equal(isPaynetMethod('Perform'), false);
    assert.equal(isPaynetMethod(''), false);
    // Not fooled by Object.prototype members.
    assert.equal(isPaynetMethod('toString'), false);
    assert.equal(isPaynetMethod('constructor'), false);
  });
});
