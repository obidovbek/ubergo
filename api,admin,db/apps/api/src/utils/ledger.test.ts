/**
 * Tests for the ledger arithmetic (T-087).
 *
 * ⚠️ This is the money. Everything in the billing batch — Paynet top-ups
 * (T-088), referral tokens (T-089), the signup bonus (T-090) — reduces to these
 * functions, and unlike the services they can actually be executed here.
 *
 * The cases below are not decoration. Each one is a way this project has
 * already been bitten or a rule taken from the Paynet contract:
 *   · BIGINT/DECIMAL arriving as a STRING          (T-077)
 *   · float multiplication losing a tiyin          (19.99 * 100)
 *   · a balance going negative under a double spend
 *   · a reversal that does not exactly cancel      (Paynet error 77)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  LedgerError,
  toAmount,
  assertMovement,
  foldBalance,
  applyEntry,
  canDebit,
  reverseOf,
  reconcile,
  somToTiyin,
  tiyinToSom,
} from './ledger.js';

/** Assert that `fn` throws a LedgerError carrying exactly `code`. */
function throwsCode(fn: () => unknown, code: string) {
  assert.throws(fn, (error: unknown) => {
    assert.ok(error instanceof LedgerError, `expected a LedgerError, got ${error}`);
    assert.equal(error.code, code);
    return true;
  });
}

describe('toAmount — the BIGINT-as-string trap', () => {
  it('accepts a plain number', () => {
    assert.equal(toAmount(100000), 100000);
  });

  it('accepts the STRING node-postgres actually returns for BIGINT', () => {
    // The whole reason this function exists: without it, '100' + 50 === '10050'.
    assert.equal(toAmount('100000'), 100000);
    assert.equal(typeof toAmount('100000'), 'number');
  });

  it('accepts a negative string (a debit)', () => {
    assert.equal(toAmount('-2500'), -2500);
  });

  it('accepts zero (a balance, not a movement)', () => {
    assert.equal(toAmount(0), 0);
    assert.equal(toAmount('0'), 0);
  });

  it('refuses a fractional number — tiyin are whole', () => {
    throwsCode(() => toAmount(100.5), 'amount_not_integer');
  });

  it('refuses a decimal STRING — that is a so\'m value in the wrong place', () => {
    throwsCode(() => toAmount('100.50'), 'not_numeric');
  });

  it('refuses NaN and Infinity', () => {
    throwsCode(() => toAmount(NaN), 'not_numeric');
    throwsCode(() => toAmount(Infinity), 'not_numeric');
  });

  it('refuses garbage rather than coercing it to 0', () => {
    throwsCode(() => toAmount('abc'), 'not_numeric');
    throwsCode(() => toAmount(''), 'not_numeric');
    throwsCode(() => toAmount(null), 'not_numeric');
    throwsCode(() => toAmount(undefined), 'not_numeric');
    throwsCode(() => toAmount({}), 'not_numeric');
  });

  it('refuses a value past the safe integer range instead of rounding it', () => {
    throwsCode(() => toAmount('9007199254740993'), 'amount_unsafe');
  });
});

describe('assertMovement', () => {
  it('refuses a zero entry', () => {
    // A zero row moves nothing and pollutes the statement Paynet reconciles
    // against daily.
    throwsCode(() => assertMovement(0), 'amount_zero');
    throwsCode(() => assertMovement('0'), 'amount_zero');
  });

  it('allows both directions', () => {
    assert.equal(assertMovement(500), 500);
    assert.equal(assertMovement(-500), -500);
  });
});

describe('foldBalance — the balance IS the sum of the entries', () => {
  it('is zero for a fresh account', () => {
    assert.equal(foldBalance([]), 0);
  });

  it('sums credits and debits', () => {
    assert.equal(
      foldBalance([{ amount: 100000 }, { amount: -25000 }, { amount: -5000 }]),
      70000
    );
  });

  it('sums entries that arrived as strings', () => {
    assert.equal(foldBalance([{ amount: '100000' }, { amount: '-25000' }]), 75000);
  });

  it('nets to zero when a reversal cancels its original', () => {
    assert.equal(foldBalance([{ amount: 100000 }, { amount: -100000 }]), 0);
  });
});

describe('applyEntry — the double-spend guard', () => {
  it('credits', () => {
    assert.equal(applyEntry(0, 100000), 100000);
  });

  it('debits', () => {
    assert.equal(applyEntry(100000, -30000), 70000);
  });

  it('allows a debit that lands exactly on zero', () => {
    // The boundary is the interesting case: off-by-one here either blocks a
    // legitimate "spend everything" or allows an overdraft.
    assert.equal(applyEntry(100000, -100000), 0);
  });

  it('refuses a debit one tiyin larger than the balance', () => {
    throwsCode(() => applyEntry(100000, -100001), 'insufficient_funds');
  });

  it('refuses to overdraw an empty account', () => {
    throwsCode(() => applyEntry(0, -1), 'insufficient_funds');
  });

  it('refuses a zero-amount entry', () => {
    throwsCode(() => applyEntry(1000, 0), 'amount_zero');
  });

  it('works on the string balance the DB hands back', () => {
    assert.equal(applyEntry('100000', '-100000'), 0);
  });
});

describe('canDebit — the question Paynet error 77 asks', () => {
  it('is true when the money is still there', () => {
    // A Paynet CancelTransaction for a 1 000 so'm top-up the payer has not spent.
    assert.equal(canDebit(100000, -100000), true);
  });

  it('is false once the payer has spent it — this is error 77', () => {
    assert.equal(canDebit(40000, -100000), false);
  });

  it('does not swallow unrelated errors', () => {
    // A zero amount is a bug, not a "no". Returning false here would hide it.
    throwsCode(() => canDebit(1000, 0), 'amount_zero');
  });
});

describe('reverseOf — a correction is a new row, never an edit', () => {
  it('produces the exact opposite amount', () => {
    assert.deepEqual(reverseOf({ id: 2323, amount: 100000 }), {
      amount: -100000,
      reverses_id: 2323,
    });
  });

  it('reverses a debit back into a credit', () => {
    assert.deepEqual(reverseOf({ id: 7, amount: -4500 }), {
      amount: 4500,
      reverses_id: 7,
    });
  });

  it('always nets to zero against its original', () => {
    const original = { id: 1, amount: 123456 };
    const reversal = reverseOf(original);
    assert.equal(foldBalance([original, reversal]), 0);
  });

  it('carries the id Paynet quotes back at us as providerTrnId', () => {
    assert.equal(reverseOf({ id: 2323, amount: 1 }).reverses_id, 2323);
  });
});

describe('reconcile — the cached balance is a cache, the entries are the truth', () => {
  const entries = [{ amount: 100000 }, { amount: -30000 }];

  it('agrees when the cache is right', () => {
    const result = reconcile(70000, entries);
    assert.equal(result.ok, true);
    assert.equal(result.difference, 0);
  });

  it('reports drift and its direction', () => {
    const result = reconcile(80000, entries);
    assert.equal(result.ok, false);
    assert.equal(result.expected, 70000);
    assert.equal(result.actual, 80000);
    assert.equal(result.difference, 10000);
  });

  it('reads a cached balance that arrived as a string', () => {
    assert.equal(reconcile('70000', entries).ok, true);
  });
});

describe("somToTiyin — the ONE crossing point between so'm and tiyin", () => {
  it("matches Paynet's own sample: 100000 tiyin is 1 000 so'm", () => {
    // docs/PAYNET.md §5 — "amount": 100000.
    assert.equal(somToTiyin('1000'), 100000);
    assert.equal(tiyinToSom(100000), '1000.00');
  });

  it('converts a DECIMAL(10,2) string exactly', () => {
    assert.equal(somToTiyin('1000.50'), 100050);
    assert.equal(somToTiyin('0.01'), 1);
    assert.equal(somToTiyin('0'), 0);
  });

  it('does NOT lose a tiyin to floating point', () => {
    // 19.99 * 100 === 1998.9999999999998 in JavaScript. Multiplying would
    // truncate to 1998 and quietly steal a tiyin on every conversion.
    assert.equal(somToTiyin('19.99'), 1999);
    assert.equal(somToTiyin(19.99), 1999);
    assert.equal(somToTiyin('0.29'), 29);
    assert.equal(somToTiyin('8.87'), 887);
  });

  it('pads a single decimal digit correctly', () => {
    // "1000.5" is five hundred tiyin, not five.
    assert.equal(somToTiyin('1000.5'), 100050);
  });

  it('handles a negative so\'m value', () => {
    assert.equal(somToTiyin('-25.50'), -2550);
  });

  it('refuses precision finer than a tiyin rather than silently rounding', () => {
    throwsCode(() => somToTiyin('0.005'), 'precision_too_fine');
    throwsCode(() => somToTiyin('1000.501'), 'precision_too_fine');
  });

  it('accepts trailing zeros beyond two decimals — they lose nothing', () => {
    assert.equal(somToTiyin('1000.5000'), 100050);
  });

  it('refuses garbage', () => {
    throwsCode(() => somToTiyin('abc'), 'not_numeric');
    throwsCode(() => somToTiyin(''), 'not_numeric');
    throwsCode(() => somToTiyin('1 000.50'), 'not_numeric');
  });
});

describe('tiyinToSom', () => {
  it('always renders exactly two decimals', () => {
    assert.equal(tiyinToSom(100050), '1000.50');
    assert.equal(tiyinToSom(1), '0.01');
    assert.equal(tiyinToSom(0), '0.00');
    assert.equal(tiyinToSom(10), '0.10');
  });

  it('renders a negative amount', () => {
    assert.equal(tiyinToSom(-2550), '-25.50');
  });

  it('returns a STRING, so no caller can re-introduce float error', () => {
    assert.equal(typeof tiyinToSom(100050), 'string');
  });

  it('reads the string the DB hands back', () => {
    assert.equal(tiyinToSom('100050'), '1000.50');
  });
});

describe('round trip', () => {
  it("survives so'm → tiyin → so'm for every 2-decimal value", () => {
    const values = ['0.00', '0.01', '0.99', '1.00', '19.99', '1000.50', '999999.99'];
    for (const som of values) {
      assert.equal(tiyinToSom(somToTiyin(som)), som, `round trip failed for ${som}`);
    }
  });

  it('survives a full account life: top up, spend, refund', () => {
    // 1 000 so'm in from Paynet, 300 spent, then the top-up reversed.
    const topUp = { id: 1, amount: somToTiyin('1000') };
    const spend = { id: 2, amount: -somToTiyin('300') };
    assert.equal(foldBalance([topUp, spend]), 70000);

    // The refund cannot happen — 700 so'm left, 1 000 to give back. Error 77.
    assert.equal(canDebit(foldBalance([topUp, spend]), reverseOf(topUp).amount), false);
  });
});
