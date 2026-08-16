# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-091 COMPLETE — moved intact → `docs/PLAN-T091.md`** (steps 1-6; owner reported the run
> good on 2026-08-15). 🛑 **Its step 7 — the COMMIT — is still open and its files are uncommitted.**
> ✅ **T-087** → `docs/PLAN-T087.md`. ✅ **T-081** → `docs/PLAN-T081.md` (owner's rebuild + walk remain).
> ✅ **T-078** → `PLAN-T078.md`. ✅ **T-077** → `PLAN-T077.md`. ✅ **T-065** → `PLAN-T065.md`.
> ✅ **T-066+T-067** → `PLAN-T066-T067.md`. ✅ **T-061** → `PLAN-T061.md`.
> ✅ **T-059 · T-055 · T-057 · T-054 · T-045 · T-024** → their own files.
> 🔴 **T-047 PARKED.** 🟡 **T-031** — items 5-6 done, item 4 **cancelled** → `PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own files.

## 🔴 BOARD STATE 2026-08-15 — read before starting anything

**`tsc` BASELINES: API 281 · admin 0 · user 6 · driver 28.** All four projects lint at **0 errors**
(API **230** · user **225** · driver **304**).

🔴 **T-091 IS DONE BUT NOT COMMITTED** — 15 files sit in the working tree. This card must not be
committed on top of them without saying which commit is which.
🛑 **THE TWO APP REBUILDS ARE STILL OUTSTANDING** — user (T-077 · T-083 · T-084) and driver
(T-078 · T-079/T-080 · T-061; **mandatory native rebuild**, T-076 removed a native dep).
🔴 **`JOURNAL.md` STOPS AT `2026-08-13 (2)`** and is missing twelve cards. `/end-day` is overdue.

---

## Task
- **ID / name:** T-092 — new user IDs start at **1 100 001**
- **Goal (definition of "done"):**
  1. The **next user to register** gets id **1 100 001**; the one after, 1 100 002.
  2. **Every existing user keeps their id.** Not one foreign key is rewritten.
  3. The migration is **atomic** (T-095's rule) and **safe to re-run** — it can only move the
     sequence **forwards**, never backwards onto an id that has already been handed out.
  4. `down` leaves the sequence **continuing from the data**, never restarted at 1.
  5. `tsc` at baselines: API **281** · admin **0** · user **6** · driver **28**; lint unmoved.
  6. Verified by **reading the sequence back and registering one real user**, not by assuming.
- **Why now:** it is the **only unblocked card in the billing batch** — T-088/T-090/T-093 wait on
  the owner, T-089 waits on questions ① and ②. It is also the one that gets **worse with delay**:
  every user who registers before it runs gets a 1-digit id forever. And **T-088 reads `users.id`
  as the account number a Paynet operator types**, so the origin must be set before real ids are
  handed out to operators.

## 🔴 What is already there (verified 2026-08-15 — do NOT re-derive)
✅ **`users.id` is `INTEGER` with `DEFAULT nextval('users_id_seq')`, and the sequence is
`OWNED BY users.id`** — created by `20250125000001-convert-uuids-to-integers.cjs:298-305`. Because
it is *owned*, **`pg_get_serial_sequence('users','id')` resolves it**, so the name never has to be
hard-coded.
✅ **That same migration already ends with the exact idiom this card needs** —
`setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true)` (line 391). **Mirror it,
don't invent one.**
🔴 **`users.id` is an FK target in at least `phones`, `user_identities`, `deletion_requests`,
`audit_logs`, `push_tokens`, `driver_profiles`** (and further tables added since).
**Renumbering is off the table** — this card changes only where the *next* id starts.
✅ **The referral-ID input has NO `maxLength`** (`UserDetailsScreen:768-781`, `keyboardType=
"number-pad"`), so a 7-digit id can already be typed in. **Nothing in that screen needs changing.**
✅ **A user's own id is already on screen** (`ProfileScreen:172-175`, label `"ID:"`), so a referrer
can read it off and pass it on; 7 digits render in the same `<Text>`.
✅ **`driver_profiles.id` has its own separate sequence** (same migration, line 348) and is **not**
in scope — the owner asked about user IDs.
✅ **No seeder inserts users.** The only seeder is `20250210000001-admin-users.cjs`, and
`admin_users.id` is a **UUID** in a different table (T-094's note).
✅ **No overflow risk:** `INTEGER` tops out at 2 147 483 647, so an origin of 1 100 001 leaves
~2.1 billion ids.
🔴 **Nothing anywhere references `users_id_seq` outside that one migration** — grep across
`apps/**` returns only lines 299/304/391 of it.

## Approach
**One migration. One statement. No application code, no model change.**

```
setval( pg_get_serial_sequence('users','id'),
        GREATEST( (SELECT COALESCE(MAX(id),0) FROM users),
                  <the sequence's own last_value>,
                  1100000 ),
        true )
```

- 🔴 **`1 100 000`, not `1 100 001`.** `setval(seq, N, true)` makes the **next** value `N+1`.
  Writing the owner's number literally would start users at 1 100 002. **This off-by-one is the
  entire risk of the card** and is invisible until a real person registers — so it gets a comment
  in the migration saying which number means what.
- 🔴 **`GREATEST`, not `ALTER SEQUENCE … RESTART WITH`.** `RESTART` moves the sequence **backwards**
  whenever it is re-run after ids past the origin exist — a `db:reset`, an undo+redo, a restore from
  backup. The next insert then reissues a **live primary key** and registration starts failing; and
  if that row had been *deleted*, the id is silently reused and every `audit_logs` row naming it now
  points at a different person. `GREATEST` can only move forwards.
- 🔴 **`last_value` is read as well as `MAX(id)`**, because a **deleted user drops `MAX(id)` below
  what has already been handed out**. This project deletes users (`deletion_requests`, `ON DELETE
  CASCADE`), so `MAX(id)` alone is not a safe floor.
- ✅ **It prints the before/after value**, so the owner's run is self-evidencing rather than silent —
  the T-046 / T-031 precedent of a migration that reports what it did.
- ✅ **The model is not touched.** `users.id` stays `INTEGER autoIncrement`; where a sequence starts
  is a database fact, and duplicating it in TypeScript would create a second place to be wrong.
- ❌ **No `account_number`, no renumbering, no display padding.** See the open question below.

## Steps
- [x] 1. **DONE 2026-08-15. Migration** `20260815000002-set-users-id-sequence-origin.cjs` —
  **approved by the owner**, written, **NOT run**.
  ✅ **One statement.** `setval(pg_get_serial_sequence('users','id'), GREATEST(MAX(id), last_value,
  1100000), true)` — the floor and the write in a single statement, so no other connection can
  register into a gap between deciding and applying.
  ✅ **The sequence is asked for, never named** — `pg_get_serial_sequence`, which works because
  `20250125000001:298-305` created it `OWNED BY users.id`. If it ever returns null the migration
  **throws with the reason** instead of guessing `users_id_seq`.
  ✅ **It prints before/after and the id the next user will get**, plus an explicit note when the
  sequence was already past the origin and was therefore left alone.
  🔴 **NO TRANSACTION WRAPPER, DELIBERATELY — and this is T-095's stated exception, not an
  oversight.** **Sequences are non-transactional in Postgres: `setval` is not undone by a rollback.**
  A wrapper would promise a guarantee it cannot give, and the half-applied state T-095 exists to
  prevent cannot arise from a single statement. Written in the file's header so the next person does
  not "fix" it.
  🔴 **`down` sets the sequence to `MAX(id)`, never `RESTART WITH 1`** — ids 1..N are live primary
  keys. ⚠️ And it says in the code that after a deletion this **can re-issue a departed user's id**:
  an undo cannot both restore the old numbering and keep `up`'s guard, so it is not a casual step.
- [x] 2. **DONE 2026-08-15. Sweep — all four projects, and NOTHING needed changing.** Reported
  rather than assumed:
  ✅ **No `maxLength` anywhere sits on a user-id input.** The driver app's 12 are passport / licence /
  PINFL / phone; the admin's 4 are country and colour codes; the user app's referral-id box has none
  at all.
  ✅ **Both apps render a user's own id the same way** and neither box is width-constrained —
  `ProfileScreen:172-175` (user) and `:180-183` (driver), a flex row with `fontFamily: 'monospace'`.
  7 digits fit where 1 did.
  ✅ **No `padStart`/`padEnd` anywhere touches an id** — every hit is a date, a time, or ledger money.
  ✅ **Nothing validates a user id by length or range** — `referral_id` reaches `UserController:232`
  through no validator at all (which T-091 already recorded), and `validator.ts` / `validation.ts`
  have no id rule to widen.
  ✅ **The admin panel never touches `users.id`** — its only `user.id` uses are `admin_users`, a
  different table with **UUID** keys (T-094's note).
  ✅ **The driver app has no referral input at all**, so the id-typing surface exists once, not twice
  — *unusually for this project, this is not a "one app swept, the other not" card.*
- [x] 3. **DONE 2026-08-15. Verified everything that can be verified without a database.**
  ✅ **`tsc` ×4 ALL AT BASELINE: API 281 · admin 0 · user 6 · driver 28.** ✅ **Lint API 230 = baseline,
  0 errors.** ✅ **`npm test` 128/128.** **Every number is unmoved, which is the point** — this card
  adds one `.cjs` file and touches no TypeScript, so *any* movement would have meant I changed
  something I did not intend.
  ✅ **The migration parses and exports what sequelize-cli needs** — `node --check` clean,
  `require()` gives `up` and `down` as functions. (A `.cjs` is invisible to both `tsc` and
  `eslint . --ext .ts`, so without this check nothing in the toolchain would have looked at the file
  at all.)
  🔴 **THE SQL ITSELF IS REASONED, NOT EXECUTED, AND THAT IS THE HONEST STATE OF THIS CARD.**
  There is a **local PostgreSQL 16 accepting connections on :5432** which could prove all four
  behaviours (fresh origin · re-run does not go backwards · the deleted-user floor · `down` does not
  restart at 1) on a throwaway database — but it needs a password. **Offered to the owner; until
  then, step 4 on test3 is the first execution.**
  ❌ **No `*.test.ts`** — the card adds no pure TypeScript logic, only SQL, and this project has no
  database-backed test harness. *Said plainly so the Definition of Done is not quietly marked green.*
- [ ] 4. **Owner:** `npm run db:migrate` in `api,admin,db/apps/api` — ⚠️ **this also carries T-091's
  `20260815000001` if that has not been applied yet.** Then: read the printed before/after,
  **register ONE new user, and confirm the id is exactly `1100001`.** ⚠️ **A second registration
  giving 1100002 is the check that the sequence was set, not the row.**
- [ ] 5. Commit (only after the owner's approval). ⚠️ **T-091's 15 files are still uncommitted** —
  they are a **separate commit**, made first.

## Files to touch
- `api,admin,db/apps/api/src/database/migrations/20260815000002-set-users-id-sequence-origin.cjs`
  **(new — the only code file in this card)**
- `docs/PLAN.md` · `docs/TODO.md` · `docs/JOURNAL.md`
- ❌ **No model change** — `User.ts` is already correct.
- ❌ **No API, admin, user-app or driver-app change expected.** Step 2 confirms rather than assumes.

## Risks / open questions (READ before coding)
- 🔴 **THE OFF-BY-ONE IS THE WHOLE CARD.** `setval(N, true)` → next is `N+1`, so the literal in the
  file is **1 100 000**. Nothing catches this but a real registration, and by then ids have been
  handed out.
- 🔴 **Backwards is the dangerous direction**, and a plain `RESTART WITH` goes there. See Approach.
- ⚠️ **OPEN — billing-batch question ④: new users only, or a separate display `account_number`?**
  *Recommendation: **new users only** — this card, as the owner's own note on T-092 proposes.*
  A separate display number means **two ways to name one person**, which is precisely how a Paynet
  operator credits the wrong account. **Approving this plan settles it as "new users only".**
- ⚠️ **Today's users keep ids like `7`**, which an operator cannot tell from a typo. That is
  **T-088's** lookup/rate-limit problem — noted here, deliberately not solved here.
- ⚠️ **Ids become enumerable from a known origin.** This is exactly why T-088's masked-phone lookup
  must be rate-limited (the two cards are linked), and why **T-091's 5-character promo code must
  never become a lookup key** — a known id range plus a guessable code is an enumeration pair.
- ⚠️ **`db:reset` is already broken independently** — `20250125000001`'s `down` throws on purpose
  ("restore from backup"), so `migrate:undo:all` cannot run past it. The `down` here is still
  written correctly rather than left to throw; it just is not reachable through that script.
- ⚠️ **Migration order:** `20260815000002` sorts after T-091's `20260815000001`. One
  `npm run db:migrate` applies whichever are outstanding, in order.
- Environment: Avast breaks npm/Gradle/git TLS. `.claude/settings.json` stays out of commits.

## Session notes
- **2026-08-15** — planned, approved, **steps 1-3 done in one sitting.** The card is as small as it
  looked; what it was *not* is a one-liner.
- 🔴 **THE CARD'S OWN RECOMMENDED FIX WAS WRONG, and this is the third time a card written earlier
  turned out to be a hypothesis rather than an instruction** (T-035's "keep the union", T-083's
  correction of T-077, now this). `ALTER SEQUENCE … RESTART WITH 1100001` had two independent
  defects in one line: it starts users at 1 100 00**2**, and it moves the sequence **backwards** on
  any re-run. **Neither is visible by reading it** — both need someone to ask what happens the
  second time it runs.
- **The interesting fact this card turned up: `setval` is NOT transactional.** So the T-095 rule
  everyone is now applying by reflex — wrap every migration in a transaction — **would have been
  theatre here**, promising a rollback Postgres does not perform on sequences. Written into the
  migration's header, because the next person to see a wrapperless migration will otherwise "fix"
  it. *A rule applied without its reason is how the wrong thing gets done confidently.*
- **The sweep found nothing, and that is worth recording rather than skipping** — 12 driver
  `maxLength`s, 4 admin ones, every `padStart` in four projects, and not one of them touches a user
  id. **It is also, unusually, NOT a "one app swept, the other not" card**: the driver app has no
  referral input at all, so the id-typing surface exists exactly once.
- 🟡 **A pre-existing landmine surfaced while checking how a fresh database is built:**
  `src/database/schema.sql` (`npm run db:setup`) is **stale — it declares `users.id` as a UUID and a
  `name` column that has not existed for months.** Any database built from it would not match the
  migrations at all. **Boarded as T-098, not fixed here.** ✅ On such a database this migration
  **throws with a named reason** rather than guessing a sequence — the fail-loud path earning its
  keep on the first day.
- ❌ **The SQL has not been executed.** A local PostgreSQL 16 is running and could prove all four
  behaviours on a scratch database; it needs a password, and the offer is with the owner.

## Resume point (for the next chat)
**STEPS 1-3 DONE 2026-08-15. THE CARD IS CODE-COMPLETE AND THE SQL HAS NEVER RUN.**
`tsc` API **281** · admin **0** · user **6** · driver **28**, all at baseline. Lint API **230**,
0 errors. Tests **128/128**. Every number unmoved — this card adds one `.cjs` and no TypeScript.

**One file exists:** `20260815000002-set-users-id-sequence-origin.cjs`. It is **one statement** —
`setval(pg_get_serial_sequence('users','id'), GREATEST(MAX(id), last_value, 1100000), true)` — with
**no transaction wrapper on purpose** (sequences are non-transactional; T-095's stated exception,
explained in the file header).

**Only steps 4 (the owner's run) and 5 (commit) remain.** Step 4 in order:
1. `npm run db:migrate` in `api,admin,db/apps/api` — ⚠️ **this also carries T-091's
   `20260815000001` if that has not been applied**, 2. read the line the migration prints
   (`was last_value=… → now last_value=1100000 … next user gets id 1100001`),
3. **register ONE new user and confirm the id is exactly `1100001`**,
4. ⚠️ **a second registration giving `1100002`** is what proves the sequence moved rather than the
   row.

⚠️ **OPEN OFFER TO THE OWNER:** a **local PostgreSQL 16 is accepting connections on :5432**. With its
password, all four behaviours can be **executed** on a throwaway database before test3 ever sees
this — fresh origin · re-run does not move backwards · the deleted-user floor · `down` does not
restart at 1. Without it, **the owner's run is the first execution.**

🔴 **Before this card's commit: T-091 is complete but its 15 files are uncommitted.** They are a
separate commit, made first.
