/**
 * JSON-RPC 2.0 envelope for the Paynet web service — T-088.
 *
 * Parsing and building only. No database, no Express — so `npm test` can
 * actually execute it (the project's suite covers DB-free modules only).
 *
 * Shapes are verbatim from docs/PAYNET.md §4-5:
 *
 *   request  { "jsonrpc":"2.0", "method":"…", "id":123, "params":{…} }
 *   success  { "jsonrpc":"2.0", "id":123, "result":{…} }
 *   failure  { "jsonrpc":"2.0", "id":1,   "error":{ "code":-253, "message":"…" } }
 *
 * 🔴 `id` IS ECHOED BACK EXACTLY AS IT ARRIVED, TYPE INCLUDED. Paynet's own
 * samples are inconsistent — the request sends `"id":12345` (number) and the
 * response quotes `"id":"12345"` (string). Since they are the ones matching
 * responses to requests, we mirror whatever they sent rather than normalising
 * it to a type we prefer.
 */

import { PaynetError, paynetErrorCode, type PaynetErrorName } from './errors.js';

/** The six mandatory methods (docs/PAYNET.md §3). Anything else is 603. */
export const PAYNET_METHODS = [
  'PerformTransaction',
  'CheckTransaction',
  'CancelTransaction',
  'GetStatement',
  'GetInformation',
  'ChangePassword'
] as const;

export type PaynetMethod = (typeof PAYNET_METHODS)[number];

/**
 * A JSON-RPC id. Paynet uses numbers and strings interchangeably; `null` is
 * valid JSON-RPC for a notification and is preserved so a reply can still be
 * correlated (or recognised as uncorrelatable).
 */
export type RpcId = string | number | null;

export interface PaynetRequest {
  method: PaynetMethod;
  id: RpcId;
  params: Record<string, unknown>;
}

export interface RpcSuccess {
  jsonrpc: '2.0';
  id: RpcId;
  result: Record<string, unknown>;
}

export interface RpcFailure {
  jsonrpc: '2.0';
  id: RpcId;
  error: { code: number; message: string };
}

export type RpcResponse = RpcSuccess | RpcFailure;

/**
 * Read the `id` out of a body that has not been validated yet.
 *
 * 🔴 SEPARATE FROM `parseRequest` ON PURPOSE. When a request is malformed we
 * still have to answer with its id, so the id must be recoverable from a body
 * that failed validation. Folding this into the parser would mean every parse
 * failure answered with `id: null`, and Paynet could not match the error to the
 * call that caused it.
 */
export function extractId(body: unknown): RpcId {
  if (typeof body !== 'object' || body === null) return null;
  const id = (body as Record<string, unknown>).id;
  if (typeof id === 'string' || typeof id === 'number') return id;
  return null;
}

/**
 * Validate an incoming body into a `PaynetRequest`.
 *
 * Throws `PaynetError` — the caller turns it into a failure envelope carrying
 * the id from `extractId`.
 */
export function parseRequest(body: unknown): PaynetRequest {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    // A JSON-RPC *batch* (an array) is legal in the 2.0 spec but appears
    // nowhere in Paynet's documents, so it is refused rather than half-handled.
    throw new PaynetError('BAD_COMMAND', 'request body must be a JSON object');
  }

  const record = body as Record<string, unknown>;

  if (record.jsonrpc !== '2.0') {
    throw new PaynetError('BAD_COMMAND', `unsupported jsonrpc version: ${String(record.jsonrpc)}`);
  }

  const method = record.method;
  if (typeof method !== 'string') {
    throw new PaynetError('BAD_COMMAND', 'method must be a string');
  }
  if (!isPaynetMethod(method)) {
    throw new PaynetError('BAD_COMMAND', `unknown method: ${method}`);
  }

  // `params` absent is treated as empty rather than rejected: ChangePassword is
  // the only method with a single required field, and per-method validation is
  // the handler's job, not the envelope's.
  const rawParams = record.params ?? {};
  if (typeof rawParams !== 'object' || rawParams === null || Array.isArray(rawParams)) {
    throw new PaynetError('MISSING_PARAMETER', 'params must be an object');
  }

  return {
    method,
    id: extractId(body),
    params: rawParams as Record<string, unknown>
  };
}

export function isPaynetMethod(value: string): value is PaynetMethod {
  return (PAYNET_METHODS as readonly string[]).includes(value);
}

export function success(id: RpcId, result: Record<string, unknown>): RpcSuccess {
  return { jsonrpc: '2.0', id, result };
}

/**
 * Build a failure envelope.
 *
 * ⚠️ The message is for a human reading Paynet's logs; the CODE is what their
 * terminal acts on. Never put anything private in the message — it leaves our
 * network. `PaynetError.detail` exists for what should be audited instead.
 */
export function failure(id: RpcId, name: PaynetErrorName, message: string): RpcFailure {
  return { jsonrpc: '2.0', id, error: { code: paynetErrorCode(name), message } };
}

/** Turn any thrown value into a failure envelope, without leaking internals. */
export function failureFrom(id: RpcId, error: unknown): RpcFailure {
  if (error instanceof PaynetError) {
    return failure(id, error.errorName, error.message);
  }
  // 🔴 An unexpected exception must not put a stack trace or a SQL fragment on
  // the wire. Paynet gets the generic system error; the real one is logged.
  return failure(id, 'SYSTEM_ERROR', 'internal error');
}
