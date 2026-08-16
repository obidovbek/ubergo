/**
 * Paynet web service route — T-088.
 *
 * 🔴 PAYNET CALLS US. This is the endpoint their terminals call when a customer
 * hands cash to an agent; there is no outbound API in this contract.
 *
 * 🔴 ONE POST, SIX METHODS, DISPATCHED BY `method` IN THE BODY. That is what
 * JSON-RPC is — do not add REST-shaped sub-paths later, or a method will end up
 * mounted without the two middlewares below.
 *
 * ⚠️ THE ORDER OF THE MIDDLEWARE IS THE SECURITY MODEL:
 *   1. `paynetIpGate`   — is this Paynet's network at all? (contractual, §2)
 *   2. `paynetBasicAuth` — are these Paynet's credentials?
 *   3. the handler      — only now does anything touch the ledger.
 * Both are mounted on the ROUTER so no future method can forget them.
 */

import { Router } from 'express';

import { paynetIpGate } from '../middleware/paynetAccess.js';
import { paynetBasicAuth } from '../middleware/paynetAuth.js';
import { PaynetController } from '../controllers/PaynetController.js';

const router = Router();

router.post('/', paynetIpGate(), paynetBasicAuth, PaynetController.handle);

export default router;
