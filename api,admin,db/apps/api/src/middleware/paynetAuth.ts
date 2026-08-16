/**
 * HTTP Basic auth for the Paynet web service — T-088.
 *
 * docs/PAYNET.md §2: the transport is HTTP username/password over HTTPS.
 *
 * 🔴 THE PASSWORD MUST BE ROTATABLE WITHOUT A REDEPLOY. Paynet is obliged to
 * change it on first successful connection (§3), so a value baked into an image
 * cannot satisfy the contract — `ChangePassword` would succeed on their side and
 * lock us out on ours at the next restart.
 *
 * The store below is the seam for that. It reads the env at startup and holds
 * the current password in memory; `ChangePassword` (step 6) replaces it and
 * persists it. **Until that persistence exists, a restart reverts to the env
 * value — which is written down rather than hidden, because it is the exact
 * failure that locks us out.**
 *
 * 🔴 NOTHING HERE MAY BE LOGGED. Rule 5: credentials live in env only.
 */

import { timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

import { extractId, failure } from '../utils/paynet/envelope.js';

/**
 * The credentials, held in one place so `ChangePassword` has something to
 * update and everything else has one thing to read.
 */
class PaynetCredentials {
  private username: string;
  private password: string;

  constructor() {
    this.username = process.env.PAYNET_USERNAME ?? '';
    this.password = process.env.PAYNET_PASSWORD ?? '';
  }

  /** False when the service has not been configured — see `paynetBasicAuth`. */
  isConfigured(): boolean {
    return this.username.length > 0 && this.password.length > 0;
  }

  matches(username: string, password: string): boolean {
    // 🔴 Constant-time on BOTH fields. A plain `===` leaks the length and the
    // first differing byte through timing, and this endpoint is reachable by
    // anyone who gets past the IP gate — including Paynet's own network.
    return safeEqual(username, this.username) && safeEqual(password, this.password);
  }

  /** Called by ChangePassword (step 6). */
  setPassword(next: string): void {
    this.password = next;
  }
}

export const paynetCredentials = new PaynetCredentials();

/**
 * Compare two strings without leaking their contents through timing.
 *
 * ⚠️ `timingSafeEqual` THROWS when the buffers differ in length, which would
 * turn a wrong-length password into a 500 instead of a 412 — and reintroduce
 * the length leak it exists to prevent. Hashing both sides to a fixed width
 * first is the standard way round it; here the cheaper equivalent is to compare
 * lengths separately and always run the constant-time comparison anyway.
 */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');

  if (bufferA.length !== bufferB.length) {
    // Still do a comparison so the work is not obviously shorter, then fail.
    timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

/** Parse `Authorization: Basic base64(user:pass)`. Returns null if absent or malformed. */
export function parseBasicAuth(header: string | undefined): { username: string; password: string } | null {
  if (!header) return null;

  const match = /^Basic\s+(.+)$/i.exec(header.trim());
  if (!match) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(match[1] as string, 'base64').toString('utf8');
  } catch {
    return null;
  }

  // The password may itself contain ':', so only the FIRST one separates.
  const separator = decoded.indexOf(':');
  if (separator < 0) return null;

  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1)
  };
}

/**
 * Require valid Basic credentials.
 *
 * ⚠️ Answers JSON-RPC `412` (bad login), not an HTTP 401 with a
 * `WWW-Authenticate` challenge: Paynet's terminal is not a browser and the
 * contract expresses failures in the RPC body.
 */
export function paynetBasicAuth(req: Request, res: Response, next: NextFunction): void {
  if (!paynetCredentials.isConfigured()) {
    // 🔴 Fail CLOSED. An unconfigured service must never be an open one —
    // otherwise the window between deploying and receiving Paynet's credentials
    // is a payment endpoint anyone past the IP gate can call.
    console.error(
      'T-088: PAYNET_USERNAME / PAYNET_PASSWORD are not set — refusing every request. ' +
        'Set them in the environment (never in code or a commit).'
    );
    res.status(200).json(failure(extractId(req.body), 'BAD_LOGIN', 'Service not configured'));
    return;
  }

  const credentials = parseBasicAuth(req.headers.authorization);

  if (!credentials || !paynetCredentials.matches(credentials.username, credentials.password)) {
    // ⚠️ Deliberately does not say WHICH of the two was wrong, and never echoes
    // the attempted username back.
    console.warn('T-088: refused a Paynet request with bad or missing credentials');
    res.status(200).json(failure(extractId(req.body), 'BAD_LOGIN', 'Bad login'));
    return;
  }

  next();
}
