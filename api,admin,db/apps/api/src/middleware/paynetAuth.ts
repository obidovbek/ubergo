/**
 * HTTP Basic auth for the Paynet web service — T-088.
 *
 * docs/PAYNET.md §2: the transport is HTTP username/password over HTTPS.
 *
 * The credentials come from the env (`PAYNET_USERNAME` / `PAYNET_PASSWORD`),
 * read once at startup, and nothing at runtime changes them. **That is a
 * decision, not a gap:** we do not offer the optional `ChangePassword`, so
 * Paynet never rotates the password — it is handed over by a secure channel
 * instead (see `PAYNET_METHODS` in `utils/paynet/envelope.ts`). Rotating it is
 * changing the secret and restarting the pod. Never bake it into an image.
 *
 * 🔴 NOTHING HERE MAY BE LOGGED. Rule 5: credentials live in env only.
 */

import { timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

import { extractId, failure } from '../utils/paynet/envelope.js';

/** The credentials, held in one place so everything has one thing to read. */
class PaynetCredentials {
  private readonly username: string;
  private readonly password: string;

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
 * Refuse a request that did not authenticate.
 *
 * 🔴 HTTP 401, NOT 200 — spec §2.2, marked "Важно!!!": *"Если в запросе не
 * передан заголовок с данными аутентификации или переданы неверные данные,
 * система должна вернуть HTTP статус 401 – Unauthorized."* Until 2026-09-19 this
 * answered 200, on the theory that Paynet reads failures from the RPC body; the
 * spec says otherwise. The body still carries JSON-RPC `412` (the error table's
 * "wrong login or password") with the request id echoed, so a client reading
 * either signal gets the same answer. No `WWW-Authenticate` challenge: Paynet's
 * caller is not a browser.
 *
 * Both refusal paths come through here so their answers cannot drift apart.
 */
function refuse(req: Request, res: Response, message: string): void {
  res.status(401).json(failure(extractId(req.body), 'BAD_LOGIN', message));
}

/** Require valid Basic credentials; every refusal goes through `refuse`. */
export function paynetBasicAuth(req: Request, res: Response, next: NextFunction): void {
  if (!paynetCredentials.isConfigured()) {
    // 🔴 Fail CLOSED. An unconfigured service must never be an open one —
    // otherwise the window between deploying and receiving Paynet's credentials
    // is a payment endpoint anyone past the IP gate can call.
    console.error(
      'T-088: PAYNET_USERNAME / PAYNET_PASSWORD are not set — refusing every request. ' +
        'Set them in the environment (never in code or a commit).'
    );
    refuse(req, res, 'Service not configured');
    return;
  }

  const credentials = parseBasicAuth(req.headers.authorization);

  if (!credentials || !paynetCredentials.matches(credentials.username, credentials.password)) {
    // ⚠️ Deliberately does not say WHICH of the two was wrong, and never echoes
    // the attempted username back.
    console.warn('T-088: refused a Paynet request with bad or missing credentials');
    refuse(req, res, 'Bad login');
    return;
  }

  next();
}
