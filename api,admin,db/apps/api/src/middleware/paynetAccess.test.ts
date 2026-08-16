/**
 * Tests for the Paynet source-IP gate (T-088).
 *
 * The CIDR matching itself is covered in `utils/paynet/ipAllowList.test.ts`.
 * What is tested here is the part that only exists in the middleware: WHICH
 * address it trusts, and what a refusal looks like on the wire.
 *
 * 🔴 The address question is the one that matters. Trusting a client-supplied
 * header instead of the proxy-appended one would let anyone spoof
 * `X-Forwarded-For: 213.230.106.112` and walk straight through a gate that
 * looks correct in every other respect.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';

import { paynetIpGate, clientAddress } from './paynetAccess.js';
import { loadAllowList } from '../utils/paynet/ipAllowList.js';
import { PAYNET_ERRORS } from '../utils/paynet/errors.js';
import type { RpcFailure } from '../utils/paynet/envelope.js';

/** A request stub. `ip` is what Express resolves via `trust proxy`. */
function fakeRequest(options: {
  ip?: string | undefined;
  remoteAddress?: string | undefined;
  headers?: Record<string, string>;
  body?: unknown;
}): Request {
  return {
    ip: options.ip,
    socket: { remoteAddress: options.remoteAddress },
    headers: options.headers ?? {},
    body: options.body ?? {}
  } as unknown as Request;
}

/**
 * A response stub that records what the middleware sent.
 *
 * `body` is a JSON-RPC failure envelope; typed as such rather than `any` so the
 * assertions below are actually checked by the compiler.
 */
function fakeResponse() {
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
  return { res, sent };
}

/** Run the gate and report whether it called `next()`. */
function run(req: Request) {
  const gate = paynetIpGate(loadAllowList(''));
  const { res, sent } = fakeResponse();
  let passed = false;
  gate(req, res, () => {
    passed = true;
  });

  /**
   * The response body, asserting one was actually sent.
   *
   * Typing `sent.body` honestly (rather than `any`) surfaced that it is unset
   * when the gate calls `next()` instead of responding — so this doubles as a
   * check that a refusal really did answer, which `any` silently skipped.
   */
  function body(): RpcFailure {
    assert.ok(sent.body, 'expected the gate to send a response');
    return sent.body;
  }

  return { passed, sent, body };
}

describe('the gate admits Paynet and refuses everyone else', () => {
  it('admits an address inside a documented range', () => {
    assert.ok(run(fakeRequest({ ip: '213.230.106.112' })).passed);
    assert.ok(run(fakeRequest({ ip: '213.230.106.127' })).passed);
    assert.ok(run(fakeRequest({ ip: '213.230.65.80' })).passed);
  });

  it('admits the IPv4-mapped form Node reports on a dual-stack socket', () => {
    // Without this the gate refuses every genuine Paynet request on some
    // deployments while looking perfectly correct in review.
    assert.ok(run(fakeRequest({ ip: '::ffff:213.230.106.112' })).passed);
  });

  it('refuses an address just outside a range', () => {
    assert.equal(run(fakeRequest({ ip: '213.230.106.111' })).passed, false);
    assert.equal(run(fakeRequest({ ip: '213.230.106.128' })).passed, false);
  });

  it('refuses an unrelated address', () => {
    assert.equal(run(fakeRequest({ ip: '8.8.8.8' })).passed, false);
    assert.equal(run(fakeRequest({ ip: '127.0.0.1' })).passed, false);
  });

  it('refuses a request with no resolvable address at all', () => {
    assert.equal(run(fakeRequest({})).passed, false);
  });
});

describe('🔴 which address is trusted — the spoofing question', () => {
  it('IGNORES a forged X-Forwarded-For when req.ip says otherwise', () => {
    // The attack: anyone can set this header. `trust proxy = 1` makes Express
    // read the entry the ingress appended, so `req.ip` is the real caller.
    // If this test ever fails, the allow-list is decorative.
    const forged = fakeRequest({
      ip: '8.8.8.8',
      headers: { 'x-forwarded-for': '213.230.106.112' }
    });
    assert.equal(run(forged).passed, false, 'a forged header must not open the gate');
  });

  it('ignores a forged header even when it lists an allowed IP first', () => {
    // `auditLogger.ts` takes split(',')[0] — this is exactly that shape, and it
    // must not be what the gate reads.
    const forged = fakeRequest({
      ip: '8.8.8.8',
      headers: { 'x-forwarded-for': '213.230.106.112, 8.8.8.8' }
    });
    assert.equal(run(forged).passed, false);
  });

  it('prefers req.ip over the raw socket address', () => {
    assert.ok(
      run(fakeRequest({ ip: '213.230.106.112', remoteAddress: '10.0.0.5' })).passed,
      'req.ip is the proxy-resolved caller and wins'
    );
    assert.equal(
      run(fakeRequest({ ip: '8.8.8.8', remoteAddress: '213.230.106.112' })).passed,
      false,
      'a Paynet-looking socket address must not rescue a non-Paynet req.ip'
    );
  });

  it('falls back to the socket address only when req.ip is absent', () => {
    // The no-proxy case: a direct connection, where remoteAddress is genuine.
    assert.equal(clientAddress(fakeRequest({ remoteAddress: '213.230.106.112' })), '213.230.106.112');
    assert.equal(clientAddress(fakeRequest({ ip: '1.2.3.4', remoteAddress: '5.6.7.8' })), '1.2.3.4');
    assert.equal(clientAddress(fakeRequest({})), undefined);
  });
});

describe('what a refusal looks like on the wire', () => {
  it('answers JSON-RPC, not a bare HTTP error', () => {
    // Paynet's terminal speaks this protocol. An HTML page or empty body gets
    // logged by them as "malformed provider", which sends whoever debugs it
    // looking in the wrong place.
    const { sent, body } = run(fakeRequest({ ip: '8.8.8.8', body: { jsonrpc: '2.0', id: 4242 } }));
    assert.equal(sent.status, 200, 'the HTTP call succeeded; the RPC did not');
    assert.equal(body().jsonrpc, '2.0');
    assert.equal(body().error.code, PAYNET_ERRORS.ACCESS_DENIED);
  });

  it('echoes the request id so the refusal can be correlated', () => {
    const { body } = run(fakeRequest({ ip: '8.8.8.8', body: { jsonrpc: '2.0', id: 4242 } }));
    assert.equal(body().id, 4242);
  });

  it('preserves a string id, as the envelope does everywhere else', () => {
    const { body } = run(fakeRequest({ ip: '8.8.8.8', body: { id: '4242' } }));
    assert.strictEqual(body().id, '4242');
  });

  it('still answers when the body is missing or unparseable', () => {
    const { body } = run(fakeRequest({ ip: '8.8.8.8', body: undefined }));
    assert.equal(body().id, null);
    assert.equal(body().error.code, PAYNET_ERRORS.ACCESS_DENIED);
  });

  it('does not disclose the allow-list to the caller', () => {
    // The ranges go to our log, not into the response.
    const { body } = run(fakeRequest({ ip: '8.8.8.8' }));
    assert.equal(body().error.message, 'Access denied');
    assert.ok(!JSON.stringify(body()).includes('213.230'));
  });
});

describe('mount-time safety', () => {
  it('refuses to build a gate that admits nobody', () => {
    // An empty list is never intended, and failing at startup is far better
    // than refusing every real payment in production.
    assert.throws(() => paynetIpGate([]), /admits nobody/);
  });
});
