# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-081 moved intact → `docs/PLAN-T081.md`** (steps 1-4 done; the owner's user-app rebuild,
> the salon booking walk and the commit remain). ✅ **T-078** → `docs/PLAN-T078.md`.
> ✅ **T-077** → `docs/PLAN-T077.md`. ✅ **T-065** → `PLAN-T065.md`. ✅ **T-066+T-067** →
> `PLAN-T066-T067.md`. ✅ **T-061** → `PLAN-T061.md`.
> ✅ **T-059 · T-055 · T-057 · T-054 · T-045 · T-024** → their own files.
> 🔴 **T-047 PARKED.** 🟡 **T-031** — items 5-6 done, item 4 **cancelled** → `PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own files.

## 🔴 BOARD STATE 2026-08-14 — read before starting anything

**`tsc` BASELINES: API 281 · admin 0 · user 6 · driver 28.** All four projects lint at **0 errors**.

✅ **All four pending migrations ran clean on test3 (2026-08-13) and the API is deployed.**
🛑 **WHAT REMAINS FROM THE OLD BOARD IS THE TWO APP REBUILDS** — nothing else blocks it.
⚠️ **The driver rebuild is mandatory, not JS-only** (T-076 removed a native dep + an Expo plugin).
🔴 **33 files are uncommitted** (T-010 tests, T-028 nav types, T-032 lint config, T-061/T-063,
T-081's `OfferDetailsScreen`). The driver wizard work is safely in `0e82b1a`; the rest is not
committed anywhere. **`/end-day` is overdue** — `JOURNAL.md` stops at `2026-08-13 (2)`.

**Swept 2026-08-14: 26 plan files, 54 unchecked boxes, and NONE of them are Claude's** — every one
is an owner step or an owner-approved commit, except T-031 step 4 (blocked on the owner's repro).

---

## Task
- **ID / name:** T-087 — the three accounts and the ledger under them
- **Goal (definition of "done"):**
  1. Every user can have three accounts — **`real`** (money), **`token`**, **`bonus`** — and a
     balance can be read for each.
  2. **Every movement of value is an append-only ledger entry** that records the amount, the
     account, the reason, **who** caused it and **through what** — the owner's *"nima qanday yoki kim
     orqali o'zgartirilgani"*. No entry is ever updated or deleted.
  3. **A mistake is corrected by a reversing entry that cites the row it reverses**, and the balance
     follows automatically — the owner's *"qayta hisob kitob yoki qaytarish"*.
  4. **Two concurrent spends cannot both pass the balance check**, and a provider callback delivered
     twice credits **once**.
  5. A reconciliation query proves every cached balance equals the sum of its own entries.
  6. `tsc` at baselines: API **281** · admin **0** · user **6** · driver **28**.
  7. The pure ledger logic has a `*.test.ts` beside it, **proven able to fail**.
- **Why now:** the owner's billing batch of 2026-08-14, and **this is its spine**. T-088 (top-ups),
  T-089 (token earnings) and T-090 (the bonus) all write into this ledger — building any of them
  first means designing the ledger three times and reconciling it never.

## Owner decisions (2026-08-14 — asked and answered before planning)
1. 🔴 **Tokens and bonuses are an IN-SERVICE DISCOUNT ONLY — never convertible to cash.**
   ✅ **This removes the heaviest half of the card:** no withdrawal path, no exchange-rate table, no
   cash-out fraud surface. ⚠️ It is also a **constraint the schema must record, not just obey** —
   `real` and `token`/`bonus` are therefore **not interchangeable**, and no code path may ever move
   value from a token account into a real one. *Stated here so a later card cannot quietly add one.*
2. **The driver's 10 000 fires on the FIRST CONFIRMED BOOKING** — detectable from real data
   (`OfferPassenger` status), **not** from `driver_arrived_at`, which the driver's own app sets.
   *(T-089's business, recorded here because it is what the ledger's `reason` vocabulary must name.)*
3. **ONE ledger, three account kinds** — not three parallel tables. *(My recommendation ⑤ on the
   card; no objection raised.)* One code path, one audit trail, one reconciliation query.

## Approach
**Two tables, one service, and the pure arithmetic pulled out so it can actually be tested.**

- **`wallet_accounts`** — one row per `(user_id, kind)`, unique. Holds a **cached** balance.
- **`wallet_transactions`** — the append-only ledger. **Signed `amount`** (negative = debit), so
  **the sum of the entries IS the balance** and reconciliation is one `GROUP BY`. A reversal is a
  new row with the negated amount and `reverses_id` pointing at the row it corrects.
  *The alternative — a `direction` column with positive amounts — is more conventional in accounting
  software, but it makes every balance query a `CASE` expression and gives two ways to write the
  same fact. Boring wins (rule 6).*
- **`balance_after` is stored on every row.** It makes each entry self-verifying and reconciliation
  trivial. It is only correct if writes are serialised — which they are, see below.
- **All money operations run inside `sequelize.transaction()` with `SELECT … FOR UPDATE`** on the
  account row. 🔴 **This project has no precedent for row locking**, so it is written here once,
  deliberately, rather than copied from a service that never needed it.
- 🔴 **The pure logic goes in `utils/ledger.ts`, NOT in the service** — `foldBalance`,
  `reverseOf`, `assertSufficient`, `idempotencyKey`. **This is the direct answer to the limit
  recorded in `CLAUDE.md` and the journal:** every service imports Sequelize, so service logic
  cannot be tested at all today. Putting the arithmetic in a DB-free module means the part that must
  never be wrong is the part that gets a real, runnable test.

## Steps
- [x] 1. **DONE 2026-08-14. Migration — `wallet_accounts` + `wallet_transactions`**
  (`20260814000001-create-wallet-tables.cjs`). Approved by the owner; **written, NOT run** — the
  owner runs it on test3.
  ✅ **`uuid_generate_v4()`, not `gen_random_uuid()`** — the `uuid-ossp` extension is created by
  `20250118000001` and every UUID pk in this schema uses it. *Checked rather than assumed.*
  ✅ **`wallet_transactions.id` is BIGSERIAL, not UUID, on purpose** — Paynet's `providerTrnId` is
  the id we mint and they quote back, and their sample shows a **number** (`2323`). Reusing the
  primary key means T-088 needs no second identity column.
  ✅ **Three CHECK constraints** — `balance >= 0` (the last line of defence under a double spend,
  so it fails loudly instead of going quietly negative), `amount <> 0`, and allow-lists for `kind`
  and `actor_type`.
  🔴 **`BIGINT` in integer TIYIN — REVISED 2026-08-14 from `DECIMAL(14,2)` on the evidence of the
  Paynet documents** (`docs/PAYNET.md` §6). The annex types the balance as **`long`** and labels it
  **тийин**; the sample `"amount": 100000` is **1 000 so'm**. A decimal-so'm ledger facing an
  integer-tiyin counterparty turns every call into a ×100 conversion, and a conversion bug inside a
  payment endpoint is silent and expensive. **Integer tiyin also removes the rounding question
  entirely** — and `DECIMAL` is what Sequelize hands back as a *string*, the T-077 trap.
  🔴 **never `FLOAT`.**
  ⚠️ **Ride prices stay `DECIMAL(10,2)` so'm** — different concern, different counterparty (a human
  paying a driver in a car). **The two conventions must meet in exactly ONE converter**, or they
  will leak into each other.
  **A partial unique index on `(provider, external_id) WHERE external_id IS NOT NULL`** — this is
  the idempotency guarantee and it must exist from the first day, not be retrofitted after a double
  credit has to be unpicked by hand. ✅ **The Paynet contract confirms this design:** their
  `transactionId` is the key, and error **201 «Транзакция уже существует»** is the mandated answer
  to a repeat.
- [x] 2. **DONE 2026-08-14. Models** — `WalletAccount`, `WalletTransaction`, associations (including
  the self-referential `reverses`), registered in `models/index.ts`. `tsc` **281 = baseline**, zero
  new errors.
  🔴 **A trap found while writing them: `BIGINT` arrives from node-postgres as a STRING**, exactly
  like `DECIMAL` — so an un-normalised balance would do `'100' + 50 === '10050'`, the T-077 bug in a
  new place. **Killed at the source with a getter on every 64-bit column** rather than at each call
  site.
- [x] 3. **DONE 2026-08-14. `utils/ledger.ts` + `utils/ledger.test.ts`** — the pure arithmetic:
  `toAmount` · `assertMovement` · `foldBalance` · `applyEntry` · `canDebit` · `reverseOf` ·
  `reconcile` · `somToTiyin` · `tiyinToSom`, plus a `LedgerError` carrying a stable code (which
  T-088 maps to Paynet's numbers — `insufficient_funds` **is** their 77).
  🔴 **`somToTiyin` parses through BigInt and NEVER multiplies as a float** — `19.99 * 100` is
  `1998.9999999999998` in JavaScript, which truncates to 1998 and steals a tiyin on every single
  conversion. The test pins `19.99`, `0.29` and `8.87`.
  🔴 **It refuses precision finer than a tiyin rather than rounding it away.** Rounding money is a
  policy nobody has decided here, and a silent half-tiyin loss repeated across a million rides is a
  real number.
  ✅ **`tiyinToSom` returns a STRING**, so no caller can re-introduce the float error it exists to
  prevent.
  **74/74 (46 new), and PROVEN ABLE TO FAIL — four mutations, each caught by the right tests:**
  float conversion → **2 red** · overdraft allowed → **4 red** · fractional tiyin accepted →
  **1 red** · zero-amount entries allowed → **3 red**.
  ⚠️ **Each restore was verified byte-identical against a backup** — the journal records a near-miss
  where a mutation was left in the tree after a command timed out. *Injecting a mutation means
  owning the restore.*
- [x] 4. **DONE 2026-08-14. `WalletService`** — `move` (the single entry point for every credit and
  debit), `reverse`, `getBalances`, `getStatement`, `reconcileAccount`, `logMovement`. Every write
  runs in `sequelize.transaction()` holding `lock: tx.LOCK.UPDATE` on the account row.
  🟡 **A CLAIM IN THIS PLAN WAS WRONG:** it said *"this project has no precedent for row locking"*.
  **It does** — `OfferPassengerService:352,583` already locks the offer row the same way. So this
  follows an existing pattern rather than inventing one. *Better outcome than the plan assumed, but
  worth recording that the plan asserted something unchecked.*
  ✅ **Idempotency is answered twice**: a pre-check on `(provider, external_id)`, and — for the
  request that races it — a catch on `SequelizeUniqueConstraintError` that returns the ORIGINAL
  entry. So a retrying provider gets the first entry back, never a second credit, and T-088 can
  answer Paynet's 201 rather than a 500.
  ✅ **`reverse` refuses to reverse the same entry twice**, and refuses when the payer has already
  spent the money — Paynet's error 77.
  ⚠️ **`AuditLog` is complementary, never a substitute.** `logAudit` deliberately swallows its own
  failures, and that is correct here: the ledger entry is the money record and is already committed
  in the transaction. Losing an audit row must not roll back a payment.
- [x] 5. **DONE 2026-08-14. Read-only endpoints** — `GET /api/wallet/balances` and
  `GET /api/wallet/:kind/statement`, both behind `authenticate`.
  🔴 **NOTHING that creates value is exposed.** No top-up route, no admin grant, no spend — the
  write surfaces are T-088/T-089/T-090. *A balance endpoint that returns 0 for everyone is the
  correct output of this card.*
  ✅ Balances are returned **both** as raw integer tiyin and as a formatted so'm string, so a client
  that computes uses the integer and a client that displays never re-derives the decimal itself.
- [x] 6. **DONE 2026-08-14. Verified.**
  `tsc` **API 281 · admin 0 · user 6 · driver 28 — all four at baseline**, and **zero errors in any
  new file** (checked by name, not just by total).
  **74/74 tests pass (46 new), proven able to fail with four mutations → 2 / 4 / 1 / 3 red.**
  Lint **230 problems, 0 errors = baseline**, with **no finding in any new file**.
  ✅ **Reconciliation is covered by the suite** — `reconcile` folds the entries and compares them to
  the cached balance, including the drift case and a cache that arrived as a string.
  ✅ **i18n needed nothing:** this card ships no UI and no user-facing string. Only 3 of 32
  controllers use `t()`; the other 29 use plain English messages, and the new controller matches its
  neighbours. **No new key in any locale — so there is nothing to evaluate, rather than something
  skipped.**
- [ ] 7. **Owner:** run the migration, deploy, confirm the three balances read as `0` for a real
  account and that nothing else on the API moved.
  ✅ **PRE-FLIGHTED 2026-08-14 (Claude, no DB needed):** the `.cjs` loads, `up`/`down` are functions,
  `Sequelize.Op` resolves, and the two riskiest statements were **rendered as SQL offline** and are
  correct — `CREATE UNIQUE INDEX … WHERE "external_id" IS NOT NULL` and `CHECK ("kind" IN (…))`.
  🔴 **Rendering them found a real hole, now fixed:** in Postgres **NULL is never equal to NULL
  inside a multi-column unique index**, so `(NULL, 'TRX-1')` twice would BOTH have inserted and the
  idempotency guarantee would silently not have held for any entry with no provider. A
  `CHECK (external_id IS NULL OR provider IS NOT NULL)` closes it, with a matching guard in
  `WalletService.move`. *Caught before the migration was ever run.*
  🔴 **FIRST RUN FAILED ON test3, 2026-08-14 — and the pre-flight could not have caught it**, because
  it is a fact about the live schema, not about the SQL:
  `Key columns "actor_admin_id" and "id" are of incompatible types: integer and uuid`.
  **`users.id` is an INTEGER but `admin_users.id` is a UUID** — this schema has two id types, and
  the column assumed admins were integers like users. Fixed to `UUID`, in the migration, the model
  and `WalletActor`.
  🔴 **AND THE FAILURE LEFT DEBRIS**, which is the more useful lesson: `wallet_accounts` had already
  been created, `wallet_transactions` had not, and **nothing was recorded in `SequelizeMeta`** — so
  a re-run would have failed with *"already exists"* instead. **The whole migration now runs inside
  ONE transaction** (Postgres has transactional DDL), so any future failure leaves the database
  exactly as it was. *Every other migration in this project has the same exposure.*
- [ ] 8. Commit (only after the owner's approval).

## Files to touch
- `api,admin,db/apps/api/src/database/migrations/2026081400000?-create-wallet-tables.cjs` **(new)**
- `api,admin,db/apps/api/src/database/models/WalletAccount.ts` **(new)**
- `api,admin,db/apps/api/src/database/models/WalletTransaction.ts` **(new)**
- `api,admin,db/apps/api/src/database/models/index.ts` — register + associate
- `api,admin,db/apps/api/src/utils/ledger.ts` **(new)** · `utils/ledger.test.ts` **(new)**
- `api,admin,db/apps/api/src/services/WalletService.ts` **(new)**
- `api,admin,db/apps/api/src/controllers/WalletController.ts` **(new)** · `routes/wallet.routes.ts` **(new)** · `routes/index.ts`
- `api,admin,db/apps/api/src/i18n/translations/{uz,ru,en}.ts` — error keys
- ❌ **No app changes.** ❌ No admin page (a later card) — this card ships no UI at all.

## Risks / open questions (READ before coding)
- 🔴 **Concurrency is the whole risk.** Without `FOR UPDATE`, two simultaneous debits both read the
  old balance and both succeed — the classic double-spend, and the one bug in this card that costs
  real money. It is also **invisible in single-user testing**, so the lock has to be right by
  construction rather than by observation.
- 🔴 **The tiyin ↔ so'm boundary is the new sharp edge.** The ledger is integer tiyin; ride prices
  are `DECIMAL(10,2)` so'm, which **Sequelize returns as a STRING** (`'100' + 50 === '10050'` —
  T-077 was bitten by exactly this). **One converter, tested at the boundary, used everywhere.** Two
  conversion sites is how a balance ends up 100× wrong in one screen and right in another.
- 🔴 **Idempotency cannot be added later.** A provider that retries — and they all retry — double
  credits without the unique index. Retrofitting it means reconciling real balances by hand.
- ⚠️ **A cached balance is a denormalisation and can drift.** It is worth it (every screen reads it),
  but only with the reconciliation query in step 6 proving it. If they ever disagree, **the entries
  win** — that is what append-only buys.
- ✅ **The "half a token" question is now closed by the type change** — `BIGINT` makes tokens and
  bonuses whole by construction, so nothing has to be enforced at the service boundary. *One of the
  two open questions on this plan was dissolved by reading the Paynet spec rather than answered.*
- 🔴 **Paynet's contract lands ON this ledger, and three of its rules are ledger rules:**
  **①** `GetStatement` must return every transaction in an arbitrary date range, and Paynet
  reconciles against it **daily, contractually** — the append-only ledger answers this for free.
  **②** error **77** requires refusing a cancellation when the payer already spent the money —
  answerable from entries, **impossible on a mutable balance column**.
  **③** the whole path must answer in **≤ 500 ms** or Paynet may disconnect us, which is a real
  budget for a row-locked transaction. *See `docs/PAYNET.md`.*
- ⚠️ **Bonus expiry (T-090) must be expressible without a schema change** — an expiring grant is just
  a reversing entry with reason `bonus_expired`. Noted now so this card does not paint T-090 into a
  corner. **But there is no job runner in this project**, which is T-090's problem, not this one's.
- 🛑 **STILL OPEN, question ⑥ on the card — who may hand-enter a REAL top-up, and is there a
  ceiling?** *"admin tomonidan kiritib beriladi"* means an admin can create money from nothing.
  **This does not block T-087** — the `actor_type` / `actor_admin_id` columns record *who* either
  way — but **T-088 cannot ship without the answer**, so it is worth deciding while this is built.
- ⚠️ **`users.promo_code` means the REFERRER's code, not the user's own** (T-091). Not touched by
  this card, but the next one in the batch trips on it.
- Environment: Avast breaks npm/Gradle/git TLS. `.claude/settings.json` stays out of commits.

## Session notes
- **2026-08-14** — planned, approved and steps 1-6 built the same day. The **Paynet documents
  arrived between the plan and the approval** and changed the money type before a line was written:
  `DECIMAL(14,2)` so'm → **`BIGINT` integer tiyin**. *Reading the counterparty's spec first is what
  made that a design decision instead of a migration later.*
- **Two things the plan asserted without checking, both found while building:**
  ① *"no precedent for row locking"* — **false**, `OfferPassengerService` already does it.
  ② The plan worried about `DECIMAL`-as-string; the real trap turned out to be **`BIGINT`-as-string**,
  which node-postgres returns for the same reason. Same class, different column type.
- **2026-08-14 (`/next`)** — step 7 is the owner's, so the only thing available was to **de-risk it**:
  pre-flighted the migration without a database by rendering its generated SQL. **That found a real
  defect in the idempotency index (Postgres NULL semantics) and fixed it before the migration was
  ever run.** *A migration that has not been executed is still cheap to correct; the same fix after
  a double credit is a hand reconciliation of real balances.*
- **2026-08-14 (migration run 1)** — failed on test3: **`admin_users.id` is a UUID while `users.id`
  is an INTEGER.** A schema fact no amount of offline SQL rendering would have surfaced — it needed
  the real database. ⚠️ **The more transferable lesson is the debris**: the failure left a half-built
  schema and no `SequelizeMeta` row, so the retry would have failed for a different reason. The
  migration is transactional now; **every other migration in this project still is not.**
- **Three pre-existing type defects surfaced and were deliberately NOT fixed here** (see Risks):
  `AuditLogData.userId` and `AuthTokenPayload.userId` are typed `string` while `users.id` is an
  `INTEGER`. They already produce baseline errors. Boarded rather than folded into a billing card.

## Resume point (for the next chat)
**STEPS 1-6 DONE 2026-08-14, code-complete and untested on a device. Only step 7 (owner: run the
migration, deploy, check the balances read 0) and step 8 (commit) remain.**

**What exists now:** the first money layer in this project — `wallet_accounts` (real / token /
bonus) and an **append-only** `wallet_transactions` ledger, with `WalletService` as the only way
value moves and `utils/ledger.ts` holding the arithmetic where it can actually be tested.

🔴 **The card ships a ledger and NO WAY TO WRITE TO IT, on purpose.** No top-up, no grant, no spend.
**A balance endpoint that returns 0 for everyone is the correct output.** The write surfaces are
T-088 (Paynet) / T-089 (referral tokens) / T-090 (the bonus).

🔴 **The four decisions that matter, and why each is the way it is:**
① **Integer tiyin, not decimal so'm** — Paynet types the balance `long` in tiyin. `somToTiyin`
parses through **BigInt and never multiplies as a float**, because `19.99 * 100` is
`1998.9999999999998` and would steal a tiyin on every conversion.
② **Append-only with reversing entries** — the only way "qayta hisob kitob yoki qaytarish" works,
and the only way Paynet's error 77 can be answered at all.
③ **Row lock on every write** — without it two simultaneous debits both pass, and that is
**invisible in single-user testing**. `CHECK (balance >= 0)` is the last line of defence.
④ **Idempotency from day one** — a partial unique index on `(provider, external_id)`, plus a catch
on the race. It cannot be retrofitted after a double credit.

**Verification:** `tsc` **API 281 · admin 0 · user 6 · driver 28**, all at baseline, zero errors in
any new file. **74/74 tests (46 new), proven able to fail — 4 mutations → 2/4/1/3 red**, each
restore verified byte-identical. Lint **230 = baseline, 0 errors**.

⚠️ **The migration has NOT been run** — it is the only unrun one on the board. ✅ **It has been
pre-flighted without a DB** (loads, `Op` resolves, generated SQL rendered and checked), and that
pre-flight **caught a NULL-semantics hole in the idempotency index**, now closed by
`CHECK (external_id IS NULL OR provider IS NOT NULL)`.

🛑 **THE FIRST MIGRATION RUN FAILED ON test3 (2026-08-14) AND LEFT A PARTIAL TABLE BEHIND.**
`wallet_accounts` was created, `wallet_transactions` was not, and `SequelizeMeta` recorded nothing.
**Before re-running, the orphaned table must be dropped:**

```sql
DROP TABLE IF EXISTS wallet_accounts CASCADE;
```

It is safe: the table was created seconds earlier by the failed run, it is empty, and nothing in
the schema references it. Then `npx sequelize db:migrate` again — the migration is now atomic, so
this cannot recur.

**Then, still the owner's:** deploy, and `GET /api/wallet/balances` on a real account → expect
`{ real: 0, real_som: "0.00", token: 0, bonus: 0 }`. Step 8 is the commit.
