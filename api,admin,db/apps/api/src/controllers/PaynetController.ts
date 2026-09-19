/**
 * Paynet JSON-RPC controller — T-088.
 *
 * The dispatcher. All five methods we offer are live against `PaynetService`.
 * The optional sixth, `ChangePassword`, is deliberately not offered — see
 * `PAYNET_METHODS` in `utils/paynet/envelope.ts` for why.
 *
 * 🔴 THIS IS NOW A LIVE MONEY PATH. `PerformTransaction` credits a real
 * account. The guarantees it depends on live in the ledger, not here: 201 comes
 * from a database unique index, 77 from `applyEntry` under a row lock.
 *
 * ⚠️ It answers HTTP 200 with a JSON-RPC error, never a bare HTTP status —
 * Paynet's terminal reads the RPC body (docs/PAYNET.md §4). **The one exception
 * is authentication**, which the spec requires to be HTTP 401 (§2.2) and which
 * `middleware/paynetAuth.ts` answers before a request ever reaches here.
 */

import type { Request, Response } from 'express';

import {
  parseRequest,
  extractId,
  success,
  failureFrom,
  type PaynetRequest
} from '../utils/paynet/envelope.js';
import { PaynetError } from '../utils/paynet/errors.js';
import { PaynetService } from '../services/PaynetService.js';

export class PaynetController {
  /**
   * The single entry point. Parses the envelope, dispatches on `method`, and
   * guarantees a well-formed JSON-RPC reply on every path including a throw.
   */
  static async handle(req: Request, res: Response): Promise<void> {
    let parsed: PaynetRequest;

    try {
      parsed = parseRequest(req.body);
    } catch (error) {
      // ⚠️ The id comes from the RAW body, because a request that failed
      // validation still has to be answerable with its own id — otherwise
      // Paynet cannot match the error to the call that caused it.
      res.status(200).json(failureFrom(extractId(req.body), error));
      return;
    }

    try {
      const result = await PaynetController.dispatch(parsed);
      res.status(200).json(result);
    } catch (error) {
      // 🔴 The real error is logged; Paynet gets a generic system error, never
      // a stack trace or a SQL fragment. `failureFrom` enforces that.
      console.error(`T-088: ${parsed.method} failed:`, error);
      res.status(200).json(failureFrom(parsed.id, error));
    }
  }

  /**
   * Route one parsed request to its handler.
   *
   * The switch is exhaustive over `PaynetMethod`, so adding a method to
   * `PAYNET_METHODS` without handling it here is a COMPILE error rather than a
   * runtime surprise on a payment endpoint.
   */
  private static async dispatch(request: PaynetRequest) {
    const { params, id } = request;

    switch (request.method) {
      case 'GetInformation':
        return success(id, await PaynetService.getInformation(params.fields));

      case 'PerformTransaction':
        return success(id, await PaynetService.performTransaction(params));

      case 'CheckTransaction':
        return success(id, await PaynetService.checkTransaction(params));

      case 'CancelTransaction':
        return success(id, await PaynetService.cancelTransaction(params));

      case 'GetStatement':
        return success(id, await PaynetService.getStatement(params));

      default:
        return assertNever(request.method, request.id);
    }
  }
}

/**
 * Unreachable while the switch stays exhaustive — and a compile error the
 * moment it stops being.
 */
function assertNever(method: never, id: ReturnType<typeof extractId>): never {
  throw new PaynetError('BAD_COMMAND', `unhandled method: ${String(method)}`, { id });
}
