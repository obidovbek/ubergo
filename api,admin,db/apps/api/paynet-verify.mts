/**
 * T-088 step 8a — prove the money path against a real database.
 *
 * 🔴 TEMPORARY VERIFICATION SCRIPT. Delete after the run; it is not part of the
 * service. It exists because the HTTP route is unreachable for testing (T-100:
 * the caller's IP never survives the proxy chain, so the contractual allow-list
 * cannot be opened for a tester without opening it for everyone).
 *
 * It calls `PaynetService` DIRECTLY — the same code the JSON-RPC route calls —
 * so everything below the controller is genuinely exercised: the ledger, the
 * row lock, the unique index, the reversal.
 *
 * ⚠️ IT WRITES TO THE REAL LEDGER, WHICH IS APPEND-ONLY. A successful run
 * leaves a credit and its reversal permanently on the target account. They
 * cancel out to zero; they cannot be deleted.
 *
 * Run:  npx tsx paynet-verify.mts
 */

import { PaynetService } from './src/services/PaynetService.js';
import { WalletService } from './src/services/WalletService.js';
import { sequelize } from './src/database/models/index.js';

/** The account to credit. T-092's verified user. */
const CLIENT_ID = '1100001';

/** 1 000 so'm, expressed the way Paynet does: integer tiyin. */
const AMOUNT_TIYIN = 100_000;

/** Paynet's transaction id. Unique per run so re-running is safe. */
const TRANSACTION_ID = `verify-${Date.now()}`;

let failures = 0;

function check(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `${ok ? '  ✅' : '  ❌'} ${label}\n       expected ${JSON.stringify(expected)}\n       actual   ${JSON.stringify(actual)}`
  );
}

function note(label: string, value: unknown): void {
  console.log(`  ·  ${label}: ${JSON.stringify(value)}`);
}

async function main(): Promise<void> {
  console.log('\n=== T-088 money-path verification ===');
  console.log(`account ${CLIENT_ID} · amount ${AMOUNT_TIYIN} tiyin · txn ${TRANSACTION_ID}\n`);

  const userId = Number(CLIENT_ID);
  const before = (await WalletService.getBalances(userId)).real;
  console.log(`Opening balance: ${before} tiyin\n`);

  // ── 1. GetInformation ────────────────────────────────────────────────────
  console.log('1. GetInformation — what the agent sees before taking cash');
  const info = await PaynetService.getInformation({ client_id: CLIENT_ID });
  note('response', info);
  const fields = (info as { fields: Record<string, unknown> }).fields;
  check('client_id echoed', fields.client_id, CLIENT_ID);
  check('status is 0', (info as { status: unknown }).status, 0);
  // 🔴 The leak check: the full phone must NEVER appear.
  const name = String(fields.name ?? '');
  check('phone is masked (contains ***)', name.includes('***'), true);
  console.log();

  // ── 2. PerformTransaction ────────────────────────────────────────────────
  console.log('2. PerformTransaction — the credit');
  const first = await PaynetService.performTransaction({
    amount: AMOUNT_TIYIN,
    serviceId: 1,
    transactionId: TRANSACTION_ID,
    fields: { client_id: CLIENT_ID }
  });
  note('response', first);
  const afterCredit = (await WalletService.getBalances(userId)).real;
  check('balance rose by the amount', afterCredit - before, AMOUNT_TIYIN);
  console.log();

  // ── 3. THE ONE THAT MATTERS: a repeat must not credit twice ──────────────
  console.log('3. 🔴 PerformTransaction AGAIN with the SAME transactionId');
  console.log('   (this is the double-charge guarantee — the whole reason for the unique index)');
  const repeat = await PaynetService.performTransaction({
    amount: AMOUNT_TIYIN,
    serviceId: 1,
    transactionId: TRANSACTION_ID,
    fields: { client_id: CLIENT_ID }
  });
  note('response', repeat);
  const afterRepeat = (await WalletService.getBalances(userId)).real;
  check('balance UNCHANGED by the repeat', afterRepeat, afterCredit);
  check(
    'same providerTrnId returned',
    (repeat as { providerTrnId: unknown }).providerTrnId,
    (first as { providerTrnId: unknown }).providerTrnId
  );
  console.log();

  // ── 4. CheckTransaction ──────────────────────────────────────────────────
  console.log('4. CheckTransaction — state before cancelling');
  const state1 = await PaynetService.checkTransaction({ transactionId: TRANSACTION_ID });
  note('response', state1);
  check('transactionState is 1 (performed)', (state1 as { transactionState: unknown }).transactionState, 1);
  console.log();

  // ── 5. CancelTransaction ─────────────────────────────────────────────────
  console.log('5. CancelTransaction — the reversal');
  const cancelled = await PaynetService.cancelTransaction({ transactionId: TRANSACTION_ID });
  note('response', cancelled);
  const afterCancel = (await WalletService.getBalances(userId)).real;
  check('balance back to where it started', afterCancel, before);
  console.log();

  // ── 6. CheckTransaction again ────────────────────────────────────────────
  console.log('6. CheckTransaction — state after cancelling');
  const state2 = await PaynetService.checkTransaction({ transactionId: TRANSACTION_ID });
  check('transactionState is 2 (cancelled)', (state2 as { transactionState: unknown }).transactionState, 2);
  console.log();

  // ── 7. An unknown transaction ────────────────────────────────────────────
  console.log('7. CheckTransaction for a transactionId we never saw');
  try {
    await PaynetService.checkTransaction({ transactionId: 'never-existed-xyz' });
    check('should have thrown', 'no error', 'TRANSACTION_NOT_FOUND');
  } catch (error) {
    const name = (error as { errorName?: string }).errorName;
    const code = (error as { code?: number }).code;
    note('error', { errorName: name, code });
    check('answers TRANSACTION_NOT_FOUND (203)', code, 203);
  }
  console.log();

  // ── 8. GetStatement ──────────────────────────────────────────────────────
  console.log('8. GetStatement — the daily reconciliation Paynet runs');
  const from = new Date(Date.now() - 60 * 60 * 1000);
  const to = new Date(Date.now() + 60 * 60 * 1000);
  const fmt = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  const statement = await PaynetService.getStatement({ dateFrom: fmt(from), dateTo: fmt(to) });
  const rows = (statement as { statements: unknown[] }).statements;
  note('entries in window', rows.length);
  const mine = rows.filter(
    (r) => (r as { transactionId?: string }).transactionId === TRANSACTION_ID
  );
  check('our transaction appears exactly ONCE', mine.length, 1);
  console.log();

  // ── result ───────────────────────────────────────────────────────────────
  const finalBalance = (await WalletService.getBalances(userId)).real;
  console.log('=== RESULT ===');
  console.log(`Opening balance: ${before} · closing balance: ${finalBalance}`);
  check('NET EFFECT ON THE ACCOUNT IS ZERO', finalBalance, before);
  console.log(
    failures === 0
      ? '\n✅ ALL CHECKS PASSED — the money path behaves as specified.\n'
      : `\n❌ ${failures} CHECK(S) FAILED — read the ❌ lines above.\n`
  );

  await sequelize.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error('\n❌ THE RUN ITSELF FAILED:', error);
  try {
    await sequelize.close();
  } catch {
    /* already closing */
  }
  process.exit(1);
});
