# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 📦 **T-122 (the task board) → `docs/PLAN-T122.md`, moved 2026-09-19 when T-088 took this file.**
> **DONE, committed as `636ba45`.** `node scripts/check-board.mjs` guards the board now.
> 📦 **T-088's 2026-08-16 plan → `docs/PLAN-T088.md`** — steps 1-8a done, committed `890878c`.
> **This file is its continuation**, not a new card.
> 📦 **T-123 → `docs/PLAN-T123.md`** (DONE, `fed25f9`; one device check owed, `CHECKLIST.md` §2).
> 📦 **T-121 → `PLAN-T121.md`** (DONE, `2cd01c9`). **T-118 → `PLAN-T118.md`** — done except step
> 12's proof: nobody has confirmed a green CI run on GitHub.
> 📦 **T-101 (the design system) → `docs/PLAN-T101.md`.** Steps 2b and 19-26 are open.
> 📦 **T-102 → `PLAN-T102.md`** (T-102i next) · **T-102c-3 → `PLAN-T102c3.md`** · **T-114 →
> `PLAN-T114.md`** (sub-step ① planned).
> 🔴 **T-047 PARKED** — needs a `logcat` line from a real killed app.
> 🛑 **T-031 — item 1 CLOSED by the owner, do NOT reopen** → `PLAN-T031.md`.

---

## 🔴 BOARD STATE 2026-09-19 — read before starting anything

**`tsc` BASELINES: API 281 · admin 6 (via `tsc -b`) · user 5 · driver 28.** All four lint at
**0 errors**. **Lint WARNING baselines: user 208 · driver 275** (API's warning count is re-measured
in step 1 — the last number written down, 230, is from 2026-08-16). **Never rebaseline upward.**
**Suites (all `npm test`):** **API 357** · **user 255 + 11 checkers** · **driver 281 + 11**.
**Board:** `node scripts/check-board.mjs` → ✓ one board; *Now* = **T-088 · T-101**.

---

## Task

- **ID / name:** T-088 (continued) — the last code in the Paynet card: **the password question**
  and **a 401 defect** the original documents turned up.
- **Why now:** top of *Next*, in the order the owner approved at T-122 (T-088 → T-115 → T-116);
  owner said *"next"*. Its board card says one code step is left — `ChangePassword` persistence,
  *"a pod restart reverts the password and locks us out"*.

### 🔴 What reading the originals changed (2026-09-19 — read before trusting the card)

Both documents in `paynet/` were re-read (`pdftotext -enc UTF-8`, and the `.docx` as XML), and
**every load-bearing sentence below was corroborated in three extraction modes** (default,
`-layout`, `-raw`) — the old plan's lesson that a rendering is not a measurement.

1. 🟢 **`ChangePassword` is OPTIONAL.** The spec says so twice: §2.1 *"ChangePassword – изменение
   пароля (**необязательный метод**)"* and §3.6 *"**Необязательный** метод ChangePassword…"*. The
   questionnaire adds the rule that made it look mandatory: *"**при наличии** метода ChangePassword
   UZPAYNET обязан поменять пароль при первом успешном соединении… **В других случаях пароль
   передается отдельно по любым безопасным каналам.**"* — **Paynet rotates on first connect only
   IF we offer the method; otherwise the password is handed over by a secure channel.**
   **So the lock-out risk the card describes exists only because we list the method.** The card,
   the old plan and two code comments all assumed rotation was obligatory. It is conditional.
2. 🔴 **A DEFECT IN SHIPPED CODE: a bad or missing login answers HTTP 200.** Spec §2.2:
   *"**Важно!!!** Если в запросе не передан заголовок с данными аутентификации или переданы
   неверные данные, система должна вернуть **HTTP статус 401 – Unauthorized**."*
   `middleware/paynetAuth.ts:119` and `:129` send `res.status(200)` with a JSON-RPC 412 body, and
   the comment above them argues the opposite of the spec (*"the contract expresses failures in the
   RPC body"*). **`paynetAuth.test.ts:200` pins the wrong status** (`assert.equal(sent.status, 200)`).
   The 2026-08-16 probes recorded "→ 412" — the body code — and never looked at the status.
3. ℹ️ `ChangePassword`'s success answer is `"result": "success"` — a **string**, not an object.
   *(Relevant only to option B.)*
4. ℹ️ **No settings table exists** in the API, so persisting a password needs **a new table and a
   migration** (rule 4). `bcrypt` is already a dependency. test3 runs **1 API replica**
   (`infra/k8s/overlays/test3/api-deployment.yaml`, read, not touched) — production's count is
   unknown. *(Relevant only to option B.)*
5. ℹ️ **A method we do not list is already answered `603`** (*"Неправильный код команды"*) by
   `utils/paynet/envelope.ts:101`, before the controller runs. `PAYNET_METHODS` drives both the
   envelope and the controller's exhaustive `switch`, so removing a method is a compile-checked change.

### Goal (definition of "done")

1. **An authentication failure answers HTTP 401**, on both refusal paths (unconfigured, and bad /
   missing credentials), **still carrying the JSON-RPC `412` body** with the request id echoed —
   so both the spec's status rule and its error table are satisfied.
2. **The password question is settled by decision ①** (below) and the code says so — no comment
   left claiming rotation is obligatory when it is not.
3. **The flipped / new tests are proven red** by mutation, red set predicted first.
4. **API `tsc` 281 · lint 0 errors and warnings ≤ step 1's measure · `npm test` green**, 357 + the
   new tests.
5. `docs/PAYNET.md` corrected on both points; `CHECKLIST.md` gains the one thing tests cannot see
   (the live endpoint's status code through the ingress); board, journal, plan updated.

### Explicitly OUT of scope

- 🛑 **T-100** (the API cannot see a caller's IP — infra, somebody else's access) and **T-099**
  (`auditLogger` trusts a forgeable header). Both boarded.
- 🛑 **Paynet's credentials** and **the deploy** — the owner's. Credentials go into the server env
  only, never a commit, a doc or the chat.
- 🛑 The open Paynet questions (the `415` ceiling's value; whether a masked phone may stand in for a
  name). Owner's email.

## Approach

- **The 401: status changes, body stays.** `res.status(401)` with the same `failure(…, 'BAD_LOGIN')`
  body. No `WWW-Authenticate` header — Paynet is not a browser, and a challenge header can make some
  proxies or clients prompt. *(If Paynet's acceptance test wants one, it is one line.)*
- **Option A (recommended): do not offer `ChangePassword`.** Remove it from `PAYNET_METHODS`; the
  envelope then answers it `603` like any method we do not implement, and the compiler removes the
  controller's stub `case`. Remove the `setPassword` rotation seam (the tests configure the store
  through the same cast they already use for `username`), and rewrite the three comments that call
  rotation obligatory. **The owner tells Paynet the method is not implemented**; the password
  arrives by a secure channel and lives in the server env / k8s secret. Rotation = change the
  secret, restart the pod — rare, deliberate, and impossible to lock ourselves out with.
- **Option B: implement it.** A migration for a one-row credentials table holding a **bcrypt hash**
  (never the password), seeded from env; `ChangePassword` commits the new hash, then answers
  `"success"`. 🔴 **The hard part is a lost reply:** if our `"success"` never reaches Paynet, they
  may retry with the OLD password and we refuse it — locked out. Safe rotation needs two phases
  (keep accepting the old password until the new one is used once), plus every replica reading the
  same row. **A migration, a model, a two-phase state machine and a bcrypt compare inside the
  500 ms budget — to save a manual rotation that happens a few times a year.**
- **Prove red on every change**, predictions written first; revert from a scratchpad golden copy,
  never `git checkout` (`core.autocrlf`).

## Steps

- [x] **0. Owner approval (rule 3) and decision ①.** ✅ *"ok"*, 2026-09-19 — **option A: do not
  offer `ChangePassword`.** Owner's action: tell Paynet the method is not implemented; the password
  arrives by a secure channel into the server env.
- [x] **1. Baselines, before touching anything.** ✅ **2026-09-19: `tsc` 281 · lint 0 errors /
  230 warnings (unchanged since 2026-08-16 — this card's ceiling) · `npm test` 357/357.**
- [x] **2. The 401.** ✅ **DONE 2026-09-19.** Both refusal paths now go through one `refuse()`
  helper — **HTTP 401**, the JSON-RPC `412` body and the echoed id unchanged — so the two cannot
  drift apart; its comment quotes §2.2. Tests: the line that pinned `200` was **flipped to 401, not
  deleted**; the unconfigured path gained a status assertion; the wrong-password / wrong-username /
  missing-header test now checks **all three** are 401 (§2.2 names both "missing" and "wrong").
  **Prove red — 3 mutations, all three predicted exactly:** ⓐ `refuse()` answers 200 → **3** red
  (unconfigured, the three-case test, the echoed-id test); ⓑ only the unconfigured path answers
  200 → **1**; ⓒ only the bad-login path → **2**. Restores verified byte for byte.
  **After:** `tsc` 281 · lint 0 / 230 · `npm test` 357/357 (stricter tests, not more of them).
- [x] **3. Decision ① — option A.** ✅ **DONE 2026-09-19.** `'ChangePassword'` out of
  `PAYNET_METHODS` (its comment now says why, quoting §2.1/§3.6 and the questionnaire), the
  controller's stub `case` gone, the `setPassword` seam gone and the credential fields
  `readonly` — **nothing writes them at runtime, and now the type says so**. Every comment that
  called rotation obligatory rewritten. 🔧 **One twin found and fixed:** the controller's header
  said it answers *"never a bare HTTP status"* — true for business errors, false for login since
  step 2; it now names authentication as the one exception.
  Tests: **new** — Paynet's own §3.6 sample is answered **603 with id 12351 echoed**; the "all six
  methods" test now pins **the exact five by name** (a count would pass with the wrong five);
  `isPaynetMethod('ChangePassword')` **flipped** to `false`; the "reflects a rotated password"
  test went with the seam it tested; the auth tests set credentials through a test-only cast.
  **Prove red — ⓓ `ChangePassword` put back in the list, predicted and got: 3 tests red** (the
  exact five, the 603 answer, `isPaynetMethod`) **and `tsc` 281 → 282**, the single error being the
  controller's exhaustive `switch` (`'"ChangePassword"' is not assignable to … 'never'`) — **so
  re-adding the method without a handler cannot even compile.**
- [x] **4. Measure.** ✅ **`tsc` 281 · lint 0 errors / 230 warnings · `npm test` 357/357** — as
  predicted: one rotation test out, one 603 test in. 5 code files, +102 / −78.
- [x] **5. Close.** ✅ **DONE 2026-09-19.** `docs/PAYNET.md`: §2's auth row now states the **401**
  rule; §3 was *"the six methods — all mandatory"* and is now five implemented + one optional not
  offered, quoting §2.1/§3.6 and the questionnaire's *"при наличии"*; the §5 `ChangePassword`
  sample is marked "answered 603". `docs/ARCHITECTURE.md`'s Paynet row: *"five of six … stub"* →
  five offered, `ChangePassword` not offered, 401. `docs/PLAN-T088.md`: a **SUPERSEDED** banner —
  its rotation warnings are history now. **T-088 → *Parked*** (code-complete; what waits is the
  owner's), its status lines rewritten, the August probe line annotated (*"412" was the body; the
  status was 200*). `docs/CHECKLIST.md` §13: two post-deploy probes (wrong password → **HTTP 401**
  through the ingress; `ChangePassword` → 603). `docs/JOURNAL.md` written. `check-board.mjs` ✓ —
  *Now* holds **T-101** alone. Commit proposed.
  🔧 **Found while closing — a pointer class I created twice this session:** T-122's and T-123's
  *Done* entries said *"→ `docs/PLAN.md`"*, but `/new-task` had since moved their plans to
  `PLAN-T122.md` / `PLAN-T123.md`. Both repointed, and **`.claude/commands/new-task.md` step 2 now
  says to move the finished plan and repoint its card** before rewriting `PLAN.md`. Conservation
  against `636ba45`: exactly T-088, T-122 and T-123 changed, nothing lost.

**Every code step:** read the file → change → prove red → revert the mutation → `tsc` AND lint AND
`npm test` → `[x]` with the mutation recorded.

### ❓ Decision ① (step 0)

**Offer `ChangePassword`, or not?**
- **A — do not offer it (recommended).** The spec makes it optional; not offering it removes the
  lock-out risk instead of managing it. Small change, no migration. **Your action:** tell Paynet
  the method is not implemented (the questionnaire's method table), and receive the password by a
  secure channel into the server env. ⚠️ **If you already told Paynet we support it, A means
  telling them otherwise** — say so and I will note it on the card.
- **B — implement it.** A migration (asked for separately), a hashed credential row, and a
  two-phase rotation so a lost reply cannot lock us out. Several times the code, the riskiest
  failure mode in the card, for a convenience.

*The 401 fix is not a decision — the spec says* **Важно!!!** *— but it changes what the live
endpoint answers after the next deploy. Nothing but Paynet calls it, and Paynet is not connected yet.*

## Files to touch

**Code (API only):** `src/middleware/paynetAuth.ts` · `src/middleware/paynetAuth.test.ts` ·
**if A:** `src/utils/paynet/envelope.ts` · `src/controllers/PaynetController.ts` · a test for the
603 answer (in `envelope.test.ts` or beside the controller, whichever already covers method routing)
**Docs:** `docs/PAYNET.md` · `docs/PLAN-T088.md` · `docs/PLAN.md` · `docs/TODO.md` ·
`docs/JOURNAL.md` · `docs/CHECKLIST.md`
**NOT touched:** either app, the admin panel, `infra/**`, any `.env`, any migration (unless B, and
then only after asking).

## Risks / open questions

1. ⚠️ **What the ingress does to a 401.** nginx or Traefik may swap the body for its own error page
   on a 401. The status would still be right, but the JSON-RPC body (and its echoed id) might not
   survive. Tests cannot see this; it goes on `CHECKLIST.md` for the first post-deploy probe.
2. ⚠️ **Option A needs one sentence to Paynet.** If their onboarding already lists `ChangePassword`
   for us, they will call it on first connect and get `603` — harmless (nothing changes), but
   confusing unless they were told.
3. ⚠️ **`docs/PAYNET.md` is a summary**, and it is where both mistakes lived (it says rotation is
   obligatory; it never mentions 401). Quote the originals when correcting it.
4. ℹ️ The API lint warning count has not been written down since 2026-08-16 (230). Step 1 measures
   it; whatever it is becomes the ceiling for this card.

## Session notes

### 2026-09-19 — planned, approved (option A) and finished, steps 0-5

- **Re-reading the originals turned "one code step: persist `ChangePassword`" into "do not offer
  it".** Every document this project had written about Paynet — the card, the old plan, three code
  comments, `PAYNET.md` — said rotation was obligatory. The spec says the method is optional twice,
  and the questionnaire's obligation is conditional (*"при наличии"*). **The risk the card spent a
  month warning about existed only because we listed the method.**
- 🔴 **The same re-read found a defect nobody was looking for:** auth failures answered HTTP 200,
  and a code comment argued for it against a spec sentence marked *"Важно!!!"*. The August probes
  wrote down "→ 412" — the body — and never the status. **A probe records what it was pointed at.**
- **5 code files, +102 / −78; 4 mutations, every red set predicted and matched,** including the one
  that proves re-adding `ChangePassword` without a handler cannot compile (`tsc` 281 → 282, one error).
- **Baselines held throughout: `tsc` 281 · lint 0 / 230 · tests 357.**

## Resume point

> **Updated 2026-09-19. T-088's LAST CODE IS DONE — steps 0-5. NOT COMMITTED** — the commit is
> proposed and waiting for the owner's yes.
> **What changed:** a bad or missing Paynet login answers **HTTP 401** (JSON-RPC `412` body kept),
> and **`ChangePassword` is not offered** (603) — the password lives in env, so nothing can rotate
> us out. **Working tree:** 5 API files (`paynetAuth.ts` + test, `envelope.ts` + test,
> `PaynetController.ts`), `docs/` (PLAN, PLAN-T122 new, PLAN-T088, PAYNET, ARCHITECTURE, TODO,
> CHECKLIST, JOURNAL), `.claude/commands/new-task.md`.
> 🟢 **API `tsc` 281 · lint 0 / 230 · `npm test` 357/357. `check-board.mjs` ✓, *Now* = T-101.**
> 🛑 **T-088 now waits only on the owner:** ① tell Paynet `ChangePassword` is **not implemented** ·
> ② **T-100** (the ingress hides caller IPs — infra) · ③ Paynet's credentials → **server env only** ·
> ④ deploy, then the two `CHECKLIST.md` §13 probes (401 through the ingress; 603).
> **▶️ NEXT: the owner's pick** — *Now* has a free slot; top of *Next* is **T-115 → T-116**.
