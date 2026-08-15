# 🎯 PLAN — T-087 (moved out of PLAN.md on 2026-08-14, COMPLETE)

> ✅ **All 8 steps done 2026-08-14** — planned, approved, built, migrated, deployed, verified on
> test3 and committed (`be0c445` → `e22e51a`) **in one day**. Moved when T-091 took the active slot.
>
> **What it delivered:** the first money layer in this project — `wallet_accounts`
> (`real` / `token` / `bonus`) and an **append-only** `wallet_transactions` ledger, with
> `WalletService` as the only way value moves and `utils/ledger.ts` holding the arithmetic where it
> can actually be tested.
>
> 🔴 **It ships a ledger and NO WAY TO WRITE TO IT, deliberately.** A balance endpoint returning 0
> for everyone is the correct output; the write surfaces are T-088 / T-089 / T-090.

## The four decisions, and why each is the way it is
① **Integer tiyin, not decimal so'm** — Paynet types the balance `long` in tiyin
(`docs/PAYNET.md` §6). `somToTiyin` parses through **BigInt and never multiplies as a float**,
because `19.99 * 100` is `1998.9999999999998` and would steal a tiyin on every conversion.
② **Append-only with reversing entries** — the only way *"qayta hisob kitob yoki qaytarish"* works,
and the only way Paynet's error 77 can be answered at all.
③ **Row lock on every write** — without it two simultaneous debits both pass, and that is
**invisible in single-user testing**. `CHECK (balance >= 0)` is the last line of defence.
④ **Idempotency from day one** — a partial unique index on `(provider, external_id)`, plus a catch
on the race. It cannot be retrofitted after a double credit.

## Owner decisions (2026-08-14)
1. **Tokens and bonuses are an IN-SERVICE DISCOUNT ONLY, never convertible to cash.** No code path
   may move value from a token or bonus account into a real one.
2. **The driver's 10 000 fires on the FIRST CONFIRMED BOOKING** — real data, not `driver_arrived_at`,
   which the driver's own app sets and could therefore mint.
3. **ONE ledger, three account kinds.**

## What went wrong, and what it taught
🔴 **The migration FAILED on its first run against test3:**
`Key columns "actor_admin_id" and "id" are of incompatible types: integer and uuid`.
**`users.id` is an INTEGER but `admin_users.id` is a UUID** — this schema has two id types. No
amount of offline SQL rendering would have caught it; it needed the real database.
🔴 **The failure left debris, which is the more transferable lesson:** `wallet_accounts` created,
`wallet_transactions` missing, **nothing in `SequelizeMeta`** — so the retry failed with *"already
exists"* rather than the original error. **The migration is atomic now**; no other migration in this
project is. → **T-095**.
🔴 **A pre-flight caught a real defect before the first run:** rendering the generated SQL showed
that in Postgres **NULL is never equal to NULL inside a multi-column unique index**, so
`(NULL, 'TRX-1')` twice would BOTH have inserted and the idempotency guarantee would silently not
have held. Closed with `CHECK (external_id IS NULL OR provider IS NOT NULL)`.
🟡 **The plan asserted something unchecked and was wrong:** it claimed *"this project has no
precedent for row locking"*. `OfferPassengerService:352,583` already does it.
🔴 **The predicted trap was `DECIMAL`-as-string; the real one was `BIGINT`-as-string** — node-postgres
returns both as strings for the same precision reason.

## Verification
`tsc` **API 281 · admin 0 · user 6 · driver 28**, all at baseline, **zero errors in any new file**.
**74/74 tests (46 new), PROVEN ABLE TO FAIL — four mutations → 2 / 4 / 1 / 3 red**, every restore
verified byte-identical against a backup. Lint **230 = baseline, 0 errors**.

**Verified on test3 (user 15, `role: driver`, `email: null`, pod-minted token):**
· `GET /api/wallet/balances` → `{"real":0,"real_som":"0.00","token":0,"bonus":0}`
· `GET /api/wallet/real/statement` → `{"count":0,"rows":[]}`
· `GET /api/wallet/nonsense/statement` → **400** · unauthenticated → **401** (not 404)
✅ Each proved something the migration succeeding did not: the tiyin→so'm converter, the
`string`→`number` user-id coercion, the empty-account early return, and the kind allow-list.
✅ **Reading created nothing** — accounts open on first *movement*. The ledger is correctly empty.

## Cards this work put on the board
**T-094** (user id typed `string` in two shared places) · **T-095** (migrations are not atomic) ·
**T-096** (`PORT` unset in the pod while the manifest hardcodes 4000).

## Still open for the rest of the batch
🛑 **Question ⑥ — who may hand-enter a REAL top-up, and is there a ceiling?** Does not block T-087;
**T-088 cannot ship without it.**
🛑 **UbexGo's own Paynet `serviceId`, URL, username and password** — the sample document is filled in
for a different company (*TV Turon Navoi*, `navpay.tn.uz`). Nothing from it may be hard-coded.
