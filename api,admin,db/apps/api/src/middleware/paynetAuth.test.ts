/**
 * Tests for Paynet HTTP Basic auth (T-088).
 *
 * 🔴 The behaviour that matters most is failing CLOSED when the service is not
 * configured. Between deploying this code and receiving Paynet's credentials
 * there is a window in which `PAYNET_PASSWORD` is unset — and an unconfigured
 * payment endpoint must refuse everyone, not admit them.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';

import { parseBasicAuth, paynetBasicAuth, paynetCredentials } from './paynetAuth.js';
import { PAYNET_ERRORS } from '../utils/paynet/errors.js';
import type { RpcFailure } from '../utils/paynet/envelope.js';

function basic(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`;
}

function fakeRequest(authorization?: string, body: unknown = {}): Request {
  return {
    headers: authorization === undefined ? {} : { authorization },
    body
  } as unknown as Request;
}

function runAuth(req: Request) {
  // Typed as the failure envelope it actually is, so the compiler checks the
  // assertions below rather than waving them through as `any`.
  const sent: { status?: number; body?: RpcFailure } = {};
  const res = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    json(body: RpcFailure) {
      sent.body = body;
      return this;
    }
  } as unknown as Response;

  let passed = false;
  paynetBasicAuth(req, res, () => {
    passed = true;
  });

  /**
   * The response body, asserting one was actually sent.
   *
   * Typing this honestly (rather than `any`) surfaced that it is unset when the
   * middleware calls `next()` — so this doubles as a check that a refusal
   * really did answer, which `any` silently skipped.
   */
  function body(): RpcFailure {
    assert.ok(sent.body, 'expected the middleware to send a response');
    return sent.body;
  }

  return { passed, sent, body };
}

describe('parseBasicAuth', () => {
  it('decodes a well-formed header', () => {
    assert.deepEqual(parseBasicAuth(basic('paynet', 'secret')), {
      username: 'paynet',
      password: 'secret'
    });
  });

  it('is case-insensitive about the scheme and tolerates extra spacing', () => {
    const encoded = Buffer.from('paynet:secret', 'utf8').toString('base64');
    assert.deepEqual(parseBasicAuth(`basic ${encoded}`), {
      username: 'paynet',
      password: 'secret'
    });
    assert.deepEqual(parseBasicAuth(`  Basic   ${encoded}  `), {
      username: 'paynet',
      password: 'secret'
    });
  });

  it('splits on the FIRST colon, so a password may contain colons', () => {
    // A generated password containing ':' would otherwise be silently truncated
    // and every request refused, with nothing in the logs explaining why.
    assert.deepEqual(parseBasicAuth(basic('paynet', 'a:b:c')), {
      username: 'paynet',
      password: 'a:b:c'
    });
  });

  it('accepts an empty password without crashing', () => {
    assert.deepEqual(parseBasicAuth(basic('paynet', '')), { username: 'paynet', password: '' });
  });

  it('returns null for anything malformed', () => {
    assert.equal(parseBasicAuth(undefined), null);
    assert.equal(parseBasicAuth(''), null);
    assert.equal(parseBasicAuth('Bearer sometoken'), null);
    assert.equal(parseBasicAuth('Basic'), null);
    // Base64 that decodes to something with no colon at all.
    assert.equal(parseBasicAuth(`Basic ${Buffer.from('nocolon').toString('base64')}`), null);
  });
});

describe('🔴 paynetBasicAuth fails closed when unconfigured', () => {
  it('refuses EVERY request when no credentials are set', () => {
    // paynetCredentials was constructed from an env with nothing set (the test
    // environment), so this is the real unconfigured path, not a stub.
    assert.equal(paynetCredentials.isConfigured(), false, 'precondition: env is unset here');

    const { passed, body } = runAuth(fakeRequest(basic('paynet', 'anything')));
    assert.equal(passed, false, 'an unconfigured service must admit nobody');
    assert.equal(body().error.code, PAYNET_ERRORS.BAD_LOGIN);
  });

  it('refuses an empty username/password pair too', () => {
    assert.equal(runAuth(fakeRequest(basic('', ''))).passed, false);
  });
});

describe('paynetBasicAuth — configured', () => {
  // Set the credentials directly rather than reaching into process.env, which
  // is read once at construction.
  function configure(password: string) {
    (paynetCredentials as unknown as { username: string }).username = 'paynet';
    paynetCredentials.setPassword(password);
  }

  function unconfigure() {
    (paynetCredentials as unknown as { username: string }).username = '';
    paynetCredentials.setPassword('');
  }

  it('admits the correct pair', () => {
    configure('correct-horse');
    try {
      assert.ok(runAuth(fakeRequest(basic('paynet', 'correct-horse'))).passed);
    } finally {
      unconfigure();
    }
  });

  it('refuses a wrong password, a wrong username, and a missing header', () => {
    configure('correct-horse');
    try {
      assert.equal(runAuth(fakeRequest(basic('paynet', 'wrong'))).passed, false);
      assert.equal(runAuth(fakeRequest(basic('someone', 'correct-horse'))).passed, false);
      assert.equal(runAuth(fakeRequest(undefined)).passed, false);
    } finally {
      unconfigure();
    }
  });

  it('refuses a password of the wrong LENGTH without throwing', () => {
    // `timingSafeEqual` throws on unequal buffer lengths — unguarded, this path
    // is a 500 rather than a clean 412, and the crash itself leaks the length.
    configure('correct-horse');
    try {
      assert.equal(runAuth(fakeRequest(basic('paynet', 'x'))).passed, false);
      assert.equal(runAuth(fakeRequest(basic('paynet', 'correct-horse-and-more'))).passed, false);
    } finally {
      unconfigure();
    }
  });

  it('reflects a rotated password immediately', () => {
    // What ChangePassword depends on: the new secret takes effect without a
    // redeploy, and the old one stops working at once.
    configure('old-password');
    try {
      assert.ok(runAuth(fakeRequest(basic('paynet', 'old-password'))).passed);
      paynetCredentials.setPassword('new-password');
      assert.equal(runAuth(fakeRequest(basic('paynet', 'old-password'))).passed, false);
      assert.ok(runAuth(fakeRequest(basic('paynet', 'new-password'))).passed);
    } finally {
      unconfigure();
    }
  });

  it('never echoes the attempted credentials into the response', () => {
    configure('correct-horse');
    try {
      const { body } = runAuth(fakeRequest(basic('attacker', 'guess')));
      const serialised = JSON.stringify(body());
      assert.ok(!serialised.includes('attacker'));
      assert.ok(!serialised.includes('guess'));
      assert.ok(!serialised.includes('correct-horse'));
    } finally {
      unconfigure();
    }
  });

  it('echoes the request id on a refusal', () => {
    configure('correct-horse');
    try {
      const { sent, body } = runAuth(fakeRequest(basic('paynet', 'wrong'), { id: 77 }));
      assert.equal(body().id, 77);
      assert.equal(sent.status, 200);
    } finally {
      unconfigure();
    }
  });
});
