/**
 * Tests for the Paynet error catalogue and mapper (T-088).
 *
 * 🔴 Two codes carry the contract's real obligations and are pinned by value:
 * 201 (a repeated transaction must never credit twice) and 77 (a cancellation
 * must be refused once the money is spent). If either drifts, the failure is
 * silent and expensive.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  PAYNET_ERRORS,
  PaynetError,
  paynetErrorCode,
  parameterErrorCode,
  ledgerErrorToPaynet
} from './errors.js';

describe('the catalogue — annex numbering by default', () => {
  it('pins the two codes the contract turns on', () => {
    // 🔴 These two ARE the contract: never credit twice, never refund money
    // already spent. The numbers differ between the two source documents (see
    // below); these are the annex's, which is attached to the signed contract.
    assert.equal(PAYNET_ERRORS.ALREADY_EXISTS, 201, 'the idempotency contract');
    assert.equal(PAYNET_ERRORS.CANNOT_CANCEL, 77, 'the refund rule');
  });

  it('pins the rest of the annex codes', () => {
    assert.equal(PAYNET_ERRORS.SUCCESS, 0);
    assert.equal(PAYNET_ERRORS.ALREADY_CANCELLED, 202);
    assert.equal(PAYNET_ERRORS.SERVICE_UNSUPPORTED, 100);
    assert.equal(PAYNET_ERRORS.QUOTA_EXHAUSTED, 101);
    assert.equal(PAYNET_ERRORS.SYSTEM_ERROR, 102);
    assert.equal(PAYNET_ERRORS.UNKNOWN_ERROR, 103);
    assert.equal(PAYNET_ERRORS.NUMBER_NOT_FOUND, 301);
    assert.equal(PAYNET_ERRORS.CLIENT_NOT_FOUND, 302);
    assert.equal(PAYNET_ERRORS.PRODUCT_NOT_FOUND, 304);
    assert.equal(PAYNET_ERRORS.SERVICE_NOT_FOUND, 305);
    assert.equal(PAYNET_ERRORS.MISSING_PARAMETER, 411);
    assert.equal(PAYNET_ERRORS.BAD_LOGIN, 412);
    assert.equal(PAYNET_ERRORS.BAD_AMOUNT, 413);
    assert.equal(PAYNET_ERRORS.BAD_DATE_FORMAT, 414);
    assert.equal(PAYNET_ERRORS.TRANSACTIONS_FORBIDDEN, 501);
    assert.equal(PAYNET_ERRORS.ACCESS_DENIED, 601);
    assert.equal(PAYNET_ERRORS.BAD_COMMAND, 603);
  });

  it('carries the ceiling code the spec adds and the annex lacks', () => {
    // Blocker ④: the JSON spec's 415 proves a maximum exists as a concept.
    // Only its VALUE is still unknown.
    assert.equal(PAYNET_ERRORS.AMOUNT_OVER_LIMIT, 415);
  });
});

describe('✅ the two source documents AGREE — the "conflict" was a reading error', () => {
  it('pins the codes that a mis-read PDF table appeared to move', () => {
    // 🔴 On 2026-08-16 these were briefly believed to differ between the annex
    // and the JSON spec. They do not. `pdftotext -layout` shifts the error
    // table's description column down one row (the -32603 description wraps
    // onto three lines), so every code appears to carry the NEXT code's
    // meaning. The tell was the absurd result it produced: 77 = "completed
    // successfully". Re-extracted in raw reading order, 32 codes pair 1:1 with
    // 32 descriptions and match the annex exactly.
    //
    // Kept as a test so nobody "re-discovers" the phantom conflict.
    assert.equal(PAYNET_ERRORS.SUCCESS, 0, 'both documents');
    assert.equal(PAYNET_ERRORS.CANNOT_CANCEL, 77, 'both documents');
    assert.equal(PAYNET_ERRORS.ALREADY_EXISTS, 201, 'both documents');
    assert.equal(PAYNET_ERRORS.ALREADY_CANCELLED, 202, 'both documents');
    assert.equal(PAYNET_ERRORS.CLIENT_NOT_FOUND, 302, 'both documents');
  });

  it('carries the five codes the spec ADDS to the annex', () => {
    assert.equal(PAYNET_ERRORS.WALLET_NOT_IDENTIFIED, 113);
    assert.equal(PAYNET_ERRORS.MONTHLY_LIMIT_EXCEEDED, 140);
    assert.equal(PAYNET_ERRORS.DAILY_LIMIT_EXCEEDED, 141);
    assert.equal(PAYNET_ERRORS.TRANSACTION_NOT_FOUND, 203);
    assert.equal(PAYNET_ERRORS.AMOUNT_OVER_LIMIT, 415);
  });

  it('answers a missing PAYMENT with 203, not "client not found"', () => {
    // Two different facts. 302 would send a debugger to the customer record.
    assert.notEqual(PAYNET_ERRORS.TRANSACTION_NOT_FOUND, PAYNET_ERRORS.CLIENT_NOT_FOUND);
  });
});

describe('paynetErrorCode — POSITIVE, and this is now settled', () => {
  it('emits business errors positive', () => {
    // ✅ RESOLVED by reading the JSON spec §2.5 properly: it has two ranges.
    // NEGATIVE (-32700, -32601 …) are JSON-RPC 2.0's own standard protocol
    // errors; POSITIVE (412, 413, 601, 603 …) are Paynet's business errors.
    // The `-253` that caused the confusion is a placeholder in an example.
    assert.equal(paynetErrorCode('ALREADY_EXISTS'), 201);
    assert.equal(paynetErrorCode('CANNOT_CANCEL'), 77);
    assert.equal(paynetErrorCode('ACCESS_DENIED'), 601);
    assert.equal(paynetErrorCode('BAD_LOGIN'), 412);
  });

  it('keeps success signless', () => {
    // Negating zero yields -0, which serialises as 0 but compares oddly.
    assert.equal(paynetErrorCode('SUCCESS'), 0);
    assert.ok(!Object.is(paynetErrorCode('SUCCESS'), -0));
  });
});

describe('parameterErrorCode — 401..410 for parameters 1..10', () => {
  it('maps each documented position', () => {
    assert.equal(parameterErrorCode(1), 401);
    assert.equal(parameterErrorCode(5), 405);
    assert.equal(parameterErrorCode(10), 410);
  });

  it('falls back to MISSING_PARAMETER outside the documented range', () => {
    // Rather than inventing 411+n, which would collide with the real 411-414.
    assert.equal(parameterErrorCode(0), PAYNET_ERRORS.MISSING_PARAMETER);
    assert.equal(parameterErrorCode(11), PAYNET_ERRORS.MISSING_PARAMETER);
    assert.equal(parameterErrorCode(-1), PAYNET_ERRORS.MISSING_PARAMETER);
    assert.equal(parameterErrorCode(1.5), PAYNET_ERRORS.MISSING_PARAMETER);
  });
});

describe('ledgerErrorToPaynet — bridging utils/ledger.ts to the wire', () => {
  it('maps insufficient funds to 77, the refund rule', () => {
    // utils/ledger.ts `canDebit` names this correspondence in its comment;
    // this is the half that decides what Paynet actually receives.
    assert.equal(ledgerErrorToPaynet('insufficient_funds'), 'CANNOT_CANCEL');
    assert.equal(paynetErrorCode(ledgerErrorToPaynet('insufficient_funds')), 77);
  });

  it('maps every amount-shaped ledger failure to BAD_AMOUNT', () => {
    for (const code of [
      'not_numeric',
      'amount_zero',
      'amount_not_integer',
      'amount_unsafe',
      'precision_too_fine'
    ]) {
      assert.equal(ledgerErrorToPaynet(code), 'BAD_AMOUNT', code);
    }
  });

  it('maps anything unrecognised to SYSTEM_ERROR rather than guessing', () => {
    assert.equal(ledgerErrorToPaynet('something_new'), 'SYSTEM_ERROR');
    assert.equal(ledgerErrorToPaynet(''), 'SYSTEM_ERROR');
  });
});

describe('PaynetError', () => {
  it('exposes the wire code for its name', () => {
    const error = new PaynetError('ALREADY_EXISTS', 'duplicate');
    assert.equal(error.code, 201);
    assert.equal(error.errorName, 'ALREADY_EXISTS');
    assert.equal(error.message, 'duplicate');
  });

  it('carries audit detail that is NOT part of the wire message', () => {
    const error = new PaynetError('CANNOT_CANCEL', 'already spent', { balance: 0 });
    assert.deepEqual(error.detail, { balance: 0 });
    assert.ok(!error.message.includes('balance'));
  });

  it('is an Error, so it survives instanceof through a catch', () => {
    assert.ok(new PaynetError('SYSTEM_ERROR', 'x') instanceof Error);
  });
});
