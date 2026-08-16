/**
 * Source-IP gate for the Paynet web service — T-088.
 *
 * 🔴 CONTRACTUAL, NOT DISCRETIONARY. docs/PAYNET.md §2: the provider MUST refuse
 * other IPs and MUST NOT accept payments arriving in violation of the list.
 *
 * 🔴 IT IS ALSO THE MAIN MITIGATION FOR AN INFORMATION LEAK. `GetInformation`
 * returns a payer identity to whoever asks, and T-092 made `users.id` enumerable
 * from a known origin (1 100 001, 1 100 002 …). If this gate is wrong, the
 * endpoint becomes a name-lookup oracle over a guessable id space.
 *
 * ⚠️ MOUNTED ON THE ROUTER, NEVER INSIDE A HANDLER, so a method added later
 * cannot forget it.
 */

import type { Request, Response, NextFunction } from 'express';

import { loadAllowList, isAllowed, type Cidr } from '../utils/paynet/ipAllowList.js';
import { extractId, failure } from '../utils/paynet/envelope.js';

/**
 * Which address do we trust?
 *
 * 🔴 `req.ip` — AND THE REASONING MATTERS, because the obvious alternative is
 * silently forgeable.
 *
 * `app.ts:35` sets `trust proxy = 1`: exactly one hop (the k8s ingress). Express
 * therefore takes the entry the ingress itself appended to `X-Forwarded-For`,
 * which a caller cannot influence.
 *
 * ⚠️ `utils/auditLogger.ts:59` does the opposite — `x-forwarded-for.split(',')[0]`,
 * the FIRST entry, which is whatever the client sent. Anyone can put
 * `X-Forwarded-For: 213.230.106.112` on a request. For an audit log that is a
 * cosmetic flaw; **for this gate it would defeat the entire allow-list**, so that
 * helper is deliberately NOT reused here. (Boarded separately — see the card.)
 *
 * `req.socket.remoteAddress` is the fallback for a direct connection with no
 * proxy in front (local runs), and is genuine when it applies.
 */
export function clientAddress(req: Request): string | undefined {
  return req.ip ?? req.socket.remoteAddress ?? undefined;
}

/**
 * Build the gate.
 *
 * The list is parsed ONCE at mount time, not per request: a malformed
 * `PAYNET_ALLOWED_IPS` should stop the process at startup, where it is visible,
 * rather than throwing inside a payment request under a 500 ms budget.
 */
export function paynetIpGate(list: Cidr[] = loadAllowList()) {
  if (list.length === 0) {
    // An empty list means "nobody", which is never a deployment anyone intends.
    // Failing loudly here beats refusing every real payment in production.
    throw new Error(
      'T-088: the Paynet IP allow-list is empty. Set PAYNET_ALLOWED_IPS or leave it unset ' +
        'to use the documented ranges. Refusing to start with a gate that admits nobody.'
    );
  }

  return function paynetIpGateMiddleware(req: Request, res: Response, next: NextFunction): void {
    const address = clientAddress(req);

    if (isAllowed(address, list)) {
      next();
      return;
    }

    // 🔴 Logged in full, because a rejected call on this endpoint is either a
    // misconfiguration or somebody probing a payment API. Both are worth seeing.
    //
    // 🔴 T-100 — THE RAW HEADERS ARE LOGGED TOO, AND THAT IS DELIBERATE.
    // `req.ip` alone cannot tell you WHY it is wrong: a missing header, a
    // truncated chain and a mis-set `trust proxy` all look identical from the
    // resolved value. Two rounds of guessing at hop counts were spent before
    // this line existed. It prints the evidence instead.
    // ⚠️ Safe to log: these are the caller's own claims about routing, on a
    // request that has ALREADY been refused. No credentials, no payer data.
    console.warn(
      `T-088: refused a Paynet request from ${address ?? 'an unknown address'} ` +
        `(allow-list: ${list.map((cidr) => cidr.source).join(', ')})`
    );
    console.warn(
      `T-100 diag: req.ip=${req.ip ?? 'none'} · socket=${req.socket?.remoteAddress ?? 'none'} · ` +
        `x-forwarded-for=${JSON.stringify(req.headers?.['x-forwarded-for'] ?? null)} · ` +
        `x-real-ip=${JSON.stringify(req.headers?.['x-real-ip'] ?? null)}`
    );

    // ⚠️ Answered as JSON-RPC, not as a bare HTTP 403. Paynet's terminal speaks
    // this protocol; an HTML error page or empty body would be logged by them as
    // a malformed provider rather than an access refusal, which is the wrong
    // diagnosis for whoever has to fix the network rule.
    //
    // HTTP 200 with a JSON-RPC error is the correct pairing: the HTTP call
    // succeeded, the RPC did not.
    res.status(200).json(failure(extractId(req.body), 'ACCESS_DENIED', 'Access denied'));
  };
}
