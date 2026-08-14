/**
 * Wallet Controller — T-087.
 *
 * 🔴 READ-ONLY, AND DELIBERATELY SO. There is no endpoint here that creates
 * value: no top-up, no admin grant, no spend. Those are T-088 (Paynet),
 * T-089 (referral tokens) and T-090 (the bonus).
 *
 * A balance endpoint that returns 0 for everyone is the correct output of this
 * card — the ledger has to be provably right before anything writes into it.
 */

import type { Response } from 'express';

// AuthRequest, not the bare express Request: `req.user` is not on the base type,
// and several older controllers reaching for it are part of the tsc baseline.
import type { AuthRequest } from '../types/index.js';

import { WalletService } from '../services/WalletService.js';
import {
  WALLET_ACCOUNT_KINDS,
  type WalletAccountKind
} from '../database/models/WalletAccount.js';
import { tiyinToSom } from '../utils/ledger.js';

/**
 * The signed-in user's numeric id.
 *
 * ⚠️ `AuthTokenPayload.userId` is typed `string` even though `users.id` is an
 * INTEGER — the same mismatch as `AuditLogData.userId`. Converting once here
 * keeps the coercion out of the money path, where a silently-NaN id would
 * open an account for nobody.
 */
function readUserId(req: AuthRequest): number | undefined {
  if (!req.user) return undefined;
  const id = Number(req.user.userId);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

/** Parse a date query param, refusing garbage instead of silently ignoring it. */
function parseDate(value: unknown, field: string): Date | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${field} date`);
  }
  return parsed;
}

export class WalletController {
  /**
   * GET /api/wallet/balances
   *
   * Returns all three balances in their raw unit (integer tiyin for `real`,
   * whole units for `token` / `bonus`) AND a formatted so'm string for `real`.
   * ⚠️ Both, on purpose: a client that does its own arithmetic must use the
   * integer, and a client that only displays must not re-derive the decimal
   * and get it wrong.
   */
  static async getBalances(req: AuthRequest, res: Response) {
    try {
      const userId = readUserId(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const balances = await WalletService.getBalances(userId);

      return res.json({
        success: true,
        data: {
          real: balances.real,
          real_som: tiyinToSom(balances.real),
          token: balances.token,
          bonus: balances.bonus
        }
      });
    } catch (error) {
      console.error('getBalances failed:', error);
      return res.status(500).json({ success: false, message: 'Failed to load balances' });
    }
  }

  /**
   * GET /api/wallet/:kind/statement
   *
   * One account's entries, newest first. Every row says what moved, why, and
   * who caused it — the owner's "nima qanday yoki kim orqali o'zgartirilgani".
   */
  static async getStatement(req: AuthRequest, res: Response) {
    try {
      const userId = readUserId(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const kind = req.params.kind as WalletAccountKind;
      if (!WALLET_ACCOUNT_KINDS.includes(kind)) {
        return res.status(400).json({
          success: false,
          message: `Unknown account kind. Expected one of: ${WALLET_ACCOUNT_KINDS.join(', ')}`
        });
      }

      let from: Date | undefined;
      let to: Date | undefined;
      try {
        from = parseDate(req.query.from, 'from');
        to = parseDate(req.query.to, 'to');
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : 'Invalid date'
        });
      }

      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);

      const { rows, count } = await WalletService.getStatement(userId, kind, {
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        limit: Number.isFinite(limit) ? limit : 50,
        offset: Number.isFinite(offset) ? offset : 0
      });

      return res.json({
        success: true,
        data: {
          count,
          rows: rows.map((entry) => ({
            id: entry.id,
            amount: entry.amount,
            balance_after: entry.balance_after,
            reason: entry.reason,
            actor_type: entry.actor_type,
            provider: entry.provider ?? null,
            reverses_id: entry.reverses_id ?? null,
            created_at: entry.created_at
          }))
        }
      });
    } catch (error) {
      console.error('getStatement failed:', error);
      return res.status(500).json({ success: false, message: 'Failed to load statement' });
    }
  }
}

export default WalletController;
