# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **T-018 is parked mid-task, not finished** — plan in `docs/PLAN-T018.md`, live at step 9.
> ⏸️ **T-025 is parked mid-task, not finished** — plan in `docs/PLAN-T025.md`, live at **step 8**
> (owner: deploy + 7 smoke tests). No Claude work is left on it.
> ⏸️ **Also parked (implemented, awaiting owner device test):** T-011 · T-012 · T-014 ·
> T-015 · T-016 (`2a76e12`) · T-017 (`a1ecedd`).

## Task
- **ID / name:** T-026A — offer concurrency: the `confirmPassenger` overbooking race + the single
  front seat
- **Goal (definition of "done"):**
  1. Two confirms racing on the same offer can **never** sell more seats than exist.
  2. **At most one confirmed front seat** per offer — the second confirm is a clean 400.
  3. A driver **cannot confirm a passenger onto a cancelled/completed or already-started offer**.
  4. The join row and the offer row move **together or not at all** — no half-applied confirm.
  5. `cancelJoin` restores seats atomically too, so the race cannot simply relocate there.
  6. No new `tsc` errors (API baseline **282**); API deployed to test3; race proven closed by a
     concurrent smoke test.
- **Why now:** these are the only findings in T-026 that **lose money instead of throwing a 500** —
  a passenger pays for a seat that does not exist, or two people are sold the same front seat.
  They are backend-only, so they do not add a third app rebuild on top of the two T-025 step 8
  already needs. Both Now cards are blocked on the owner's device, so this is the work that can
  actually move today.
- **Source:** audit 2 (passenger↔driver-offer leg), 2026-08-02 (3), findings 4–7 of 17. The other
  13 stay in **T-026**.

## Owner decisions already taken (2026-08-02 — do NOT re-ask)
1. **App-level enforcement only.** A `SELECT … FOR UPDATE` row lock on `driver_offers` inside a
   transaction. **No migration, no schema change.** The partial unique index
   (`UNIQUE (offer_id) WHERE is_front_seat AND status='confirmed'`) was considered and rejected for
   now: it is a rule-4 schema change *and* it would fail to apply if test3 already contains a
   double-booked front seat — which is exactly the bug being fixed.
2. **T-025 parked, not dropped**, to keep *Now* at two. Its plan is preserved at
   `docs/PLAN-T025.md`; step 8 is still owed.
3. **Scope stops at the four findings above.** The 500-instead-of-4xx sweep, mass assignment,
   `min_rating` pagination, rate limiting and the unguarded `response.json()` calls stay in
   **T-026**.

## Current state (verified in code 2026-08-02)
- Models are **Sequelize**, not the raw `pg` pool. `sequelize` is a named export of
  `src/database/models/index.ts:362`, so `sequelize.transaction()` and `lock:` are available.
  (`src/config/database.ts` also exports a raw `pool` + a `transaction` helper — **unrelated**, and
  not what the offer services use. Do not mix them.)
- `confirmPassenger` (`OfferPassengerService.ts:225-307`): loads the join with the offer eagerly
  included (:231), checks `seats_requested > offer.seats_free` (:263), then **separately** writes
  `passengerJoin.update({status:'confirmed'})` (:268) and `offer.update({seats_free: … - …})`
  (:274). Read-modify-write with no lock and no transaction across the two writes.
- The `status !== 'pending'` check (:258) is the same shape — two concurrent confirms of the *same*
  join both pass it and decrement twice.
- `confirmPassenger` checks ownership (:253) and pending-ness (:258) but **never** re-checks
  `offer.status` or `offer.start_at` — `joinOffer` checks both (:85, :89), confirm checks neither.
- **Front seat:** `joinOffer` accepts `is_front_seat` (:42) and prices the premium (:136) with no
  uniqueness check anywhere; `confirmPassenger` never looks at `is_front_seat` at all. The model has
  a unique index on `(offer_id, passenger_id)` only (`OfferPassenger.ts:195-198`) — nothing on the
  front seat.
- `cancelJoin` (:392-432): same unguarded read-modify-write in reverse — `offer.update({seats_free:
  offer.seats_free + n})` (:429) after a separate join update (:422), no transaction.
- `rejectPassenger` (:312-387) touches **no** seat counts, so it is out of scope.

## Approach
One pattern, applied to the two functions that move seats. Inside
`sequelize.transaction(async (t) => { … })`:

1. **Re-read the offer with `lock: t.LOCK.UPDATE`** (`SELECT … FOR UPDATE`). This is the whole
   fix: once the `driver_offers` row is locked, every confirm for that offer serialises, so the
   seat check and the front-seat check both become reliable without any new column or index.
2. **Re-read the join row inside the transaction too** and re-assert `status === 'pending'` there,
   so a double-confirm of the same join cannot slip past.
3. Do all the checks under the lock, then both `update`s with `{ transaction: t }`.
4. **Push notifications and audit logs stay OUTSIDE the transaction** — they are slow network
   calls and must not hold a row lock, and a failed push must not roll back a confirmed booking.
   The transaction returns what the notification needs.

Deliberately **not** using `decrement()`: it fixes the arithmetic but not the front-seat rule or
the status check, so the lock is needed anyway and one mechanism beats two.

## Steps
- [x] 1. **DONE 2026-08-02. Read both functions end-to-end + inventoried what must survive the move.**
  Findings that shaped the code:
  - **`notifyDriver`/`notifyPassenger` cannot throw** — both wrap their whole body in `try/catch`
    (:701, :739) and swallow. So moving them out of the transaction is provably not a regression.
  - **`t(key: string, …)`** takes an untyped `string` key and returns **the key itself** (plus a
    `console.warn`) on a miss — a typo would ship as literal `offers.frontSeatTaken` in a 400 body,
    so the new key needs a runtime check, not just `tsc`. → step 6.
  - **The controller serialises the returned instance** with its eager-loaded `offer`
    (`OfferPassengerController.ts:66-69`), so the return value must keep its includes → `reload()`
    after the commit.
  - ⚠️ **The lock must be taken on the offer row ALONE.** Postgres refuses `FOR UPDATE` on the
    nullable side of an outer join, which is exactly what Sequelize emits if `lock` is combined
    with `include`. Locking the eagerly-included query would have been a runtime 500 in production.
  - `seats_free` is **INTEGER** (`DriverOffer.ts:153`, `min: 0`), not DECIMAL — so the
    DECIMAL-as-string trap that caused T-025 does **not** apply here. Checked, per the risk note.
  - `rejectPassenger` touches no seat counts → correctly out of scope.
- [x] 2. **DONE 2026-08-02. `confirmPassenger` wrapped in `sequelize.transaction()` + row lock.**
  Offer re-read with `lock: tx.LOCK.UPDATE`; join re-read inside the transaction and its `pending`
  status re-asserted there (two confirms of the *same* request would otherwise both pass and
  decrement twice). Both updates carry `{ transaction: tx }`. The original cheap checks stay in
  front of the lock, so error messages and status codes are unchanged. Notifications + audit log
  now run **after** the commit.
- [x] 3. **DONE 2026-08-02. The two missing guards, under the lock** — `lockedOffer.status !==
  'published'` → 400, and `start_at` in the past → 400. Reused `offers.notAvailable` /
  `offers.alreadyStarted` exactly as `joinOffer` does; both verified present in all three locales
  in step 6. No new strings needed for these.
- [x] 4. **DONE 2026-08-02. One front seat enforced.** When the join has `is_front_seat`, a
  `count()` of confirmed front-seat joins for that offer runs **inside** the transaction; > 0 → 400.
  New key `offers.frontSeatTaken` added to `uz`/`ru`/`en`, following the surrounding naming and
  placed next to `alreadyProcessed` in all three.
- [x] 5. **DONE 2026-08-02. `cancelJoin` given the same transaction + lock.** Also re-asserts the
  cancellable status under the lock, and `wasConfirmed` is now decided **inside** the transaction
  (it was read before it, and the push notification reports it — so it has to be the committed
  truth, not a stale read). No clamp added on the seat restore: that would hide pre-existing
  corruption rather than fix it.
- [x] 6. **DONE 2026-08-02. Static + runtime verification.**
  - `tsc` API: **282 → 282**. Two errors do appear in `OfferPassengerService.ts` (:150, :426) —
    **both pre-existing and neither in touched code**, proven by `git stash`-ing exactly these
    changes and re-running: the pre-fix tree has the identical pair at :149/:351
    (`exactOptionalPropertyTypes` on `message` / `rejection_reason`, in `joinOffer` and
    `rejectPassenger`). A matching total alone would not have ruled out +2/−2, so this was measured,
    not assumed.
  - **21/21 runtime checks green** via `<scratchpad>/i18n-frontseat.mts` (`npx tsx`): all 7 keys
    the new code depends on resolve to a real string in all 3 languages.
  - Re-read both functions: every `throw` inside the callback is an `AppError`, so it rolls back and
    propagates to the controller's `next(error)` — which is the wanted behaviour for all of them.
    No notification or audit log is left inside a transaction.
- [x] 7. **DONE 2026-08-02. Repro script written** → `<scratchpad>/confirm-race.mjs` (`node --check`
  clean). Fires N confirms via `Promise.all` so they start before any is awaited, tolerates a
  non-JSON body (the rate limiter returns plain text — T-026), and carries the SQL for the real
  verdict: `seats_free` never negative, sold-seats-vs-`seats_total` across **all** offers, and the
  at-most-one-confirmed-front-seat query. Cannot be run from here — no DB, no deploy.
- [ ] 8. **Owner: deploy + prove it.** Deploy the API to test3, then:
  (a) two passengers request 2 seats each on a **2-seat** offer; fire both confirms concurrently
  with the step-7 script — exactly one must succeed, `seats_free` must land at **0**, never below;
  (b) two passengers each request the front seat; confirm both — the second must 400;
  (c) cancel the offer as the driver, then try to confirm a pending passenger — must 400, and
  `seats_free` must **not** move;
  (d) a confirmed passenger cancels — `seats_free` goes back up by exactly their seat count;
  (e) sanity: a normal single confirm still works and the passenger still gets the push.
- [ ] 9. **Commit** with a clear message, owner-approved.

## Files to touch (verified against the repo 2026-08-02)
- `api,admin,db/apps/api/src/services/OfferPassengerService.ts` — `confirmPassenger`, `cancelJoin`,
  and the `sequelize` import (now L7-19). **Actual:** exactly as planned, nothing else in the file.
- `api,admin,db/apps/api/src/i18n/translations/uz.ts` · `ru.ts` · `en.ts` — one new key
  (`offers.frontSeatTaken`) each, inserted after `alreadyProcessed` in the `offers` block.
  No type change needed: `t()` takes a plain `string` key.
- **NEW** `<scratchpad>/confirm-race.mjs` — repro script, not committed.
- **NEW** `<scratchpad>/i18n-frontseat.mts` — key-resolution check, not committed.

Nothing else. No model file, no migration, no controller, no app code.

## Risks / open questions (READ before coding)
- ⚠️ **The mass-assignment hole in `DriverOfferService.updateOffer` stays open** (T-026), and it
  lets a client write `seats_free` directly. This card makes the *confirm* path correct; it does
  **not** make `seats_free` tamper-proof. Do not call seats "safe" after this.
- ⚠️ **Moving notifications out of the transaction changes failure behaviour**: today a push
  failure happens after both writes anyway, so this is not a regression — but confirm that
  `notifyPassenger` genuinely cannot throw in a way that used to abort the confirm. Read it.
- ⚠️ **`offer.seats_free` may be a string.** DECIMAL-as-string bit this project three times already
  (see the 2026-08-02 (3) journal), and `seats_free` is `INTEGER` so it should be a real number —
  **verify that in the model before relying on `-` and `>`**, and coerce if not. `>` between two
  strings is lexicographic.
- ⚠️ **A row lock serialises confirms per offer.** That is correct and the volumes here are tiny,
  but a slow query inside the lock would queue every other confirm for that offer. Keep the locked
  section to reads + two writes; no network calls.
- ⚠️ **Existing bad data is not repaired by this card.** If test3 already has an offer with two
  confirmed front seats or a negative `seats_free`, the fix stops it getting worse and does nothing
  about the row that is already wrong. A cleanup query is out of scope — flag it if step 8 finds one.
- ⚠️ **Nothing here can be proven from this machine.** No DB, no deploy, no test suite. `tsc` plus
  reading is the ceiling; step 8 is the only real evidence, and step 8(a) is the *only* test of the
  race itself.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`,
  `GRADLE_OPTS` truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` has ridden along in the last three commits — keep it out of this one.

## Session notes (one line per work session)
- **2026-08-02** — plan approved and **steps 1–7 landed in one session.** Two functions changed in
  one file, plus one new i18n key in three locales. The design turned on one fact found in step 1:
  **the lock has to be on the offer row alone**, because Postgres refuses `FOR UPDATE` on the
  nullable side of an outer join and Sequelize emits exactly that when `lock` meets `include` —
  the obvious implementation would have been a production 500. `tsc` 282 → 282 with the two
  in-file errors **proven pre-existing via `git stash`**; 21/21 i18n runtime checks.
  Nothing ran against a DB. **Steps 8–9 are the owner's.**

## Resume point (for the next chat)
**Steps 1–7 are DONE and verified as far as this machine allows. Only step 8 (owner: deploy +
5 tests) and step 9 (commit) remain.** Uncommitted, four files:
- `api,admin,db/apps/api/src/services/OfferPassengerService.ts` — `confirmPassenger`, `cancelJoin`,
  and the `sequelize` import
- `api,admin,db/apps/api/src/i18n/translations/{uz,ru,en}.ts` — one new key each

Plus, **not part of this card** but in the same working tree: `docs/PLAN-T025.md` (new — T-025's
plan moved aside), `docs/PLAN.md`, `docs/TODO.md`.

⚠️ **API only — neither app needs rebuilding for this card.** The apps still need their T-025
rebuild, which is a different card's step 8.

**Step 8 is the only thing that can prove any of this.** The race has no static test and no runtime
coverage: `<scratchpad>/confirm-race.mjs` is written and syntax-checked but has never been run
against anything. Fill in its 3 placeholders (`API_BASE`, `DRIVER_TOKEN`, two join ids) first.

The four defects and their exact line numbers are in **Current state** above; a cold-start chat
does not need to re-audit the flow. The full 17-finding audit that produced them is summarised in
the **T-026** entry in `docs/TODO.md`.

**Two other cards are parked mid-task and are the owner's, not Claude's:**
- **T-025** → `docs/PLAN-T025.md`, live at step 8 (deploy + 7 smoke tests).
- **T-018** → `docs/PLAN-T018.md`, live at step 9/10 (walk `docs/CHECKLIST.md` on two phones).

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12**, driver app **36**.
