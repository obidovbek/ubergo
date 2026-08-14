/**
 * Wallet Routes — T-087.
 *
 * 🔴 READ-ONLY. Nothing here creates value. The write surfaces arrive with
 * T-088 (Paynet) / T-089 (referral tokens) / T-090 (the bonus).
 */

import { Router } from 'express';

import { WalletController } from '../controllers/WalletController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All three balances for the signed-in user.
router.get('/balances', authenticate, WalletController.getBalances);

// One account's ledger entries: /real/statement, /token/statement, /bonus/statement.
router.get('/:kind/statement', authenticate, WalletController.getStatement);

export default router;
