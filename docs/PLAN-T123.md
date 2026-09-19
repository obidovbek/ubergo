# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 📦 **T-121 (the utils test suites) → `docs/PLAN-T121.md`, moved 2026-09-18 when T-123 took this
> file.** It is **DONE, all 9 steps, committed as `2cd01c9`.** Nothing in it is open.
> 📦 **T-118 (the app test suites) → `docs/PLAN-T118.md`.** Done and committed (`7526742`) except
> **step 12's proof**: the CI workflow is written and pushed but **nobody has confirmed a green
> run on GitHub**. It cannot be checked from the Claude shell (no `gh`, network cert-blocked).
> 📦 **T-101 (the design system) → `docs/PLAN-T101.md`.** Still in *Now*; steps 2b and 19-26 are
> open; sub-plans `PLAN-T101-step14b/16/17/18/19.md` and `PLAN-T101-SCOPES.md`.
> 📦 **T-102 → `PLAN-T102.md`** (T-102i next, the read side) · **T-102c-3 → `PLAN-T102c3.md`**.
> 📦 **T-088 (Paynet) → `docs/PLAN-T088.md`.** One code step (`ChangePassword` persistence), the
> rest is T-100 and Paynet's credentials.
> 📦 **T-114 → `PLAN-T114.md`**, sub-step ① planned, not started.
> ✅ **T-092** → `PLAN-T092.md`. ✅ **T-091** → `PLAN-T091.md`. ✅ **T-087** → `PLAN-T087.md`.
> ✅ **T-081** → `PLAN-T081.md`. ✅ **T-078** → `PLAN-T078.md`. ✅ **T-077** → `PLAN-T077.md`.
> ✅ **T-065** → `PLAN-T065.md`. ✅ **T-066+T-067** → `PLAN-T066-T067.md`. ✅ **T-061** → `PLAN-T061.md`.
> 🔴 **T-047 PARKED** — its decision logic is now pinned by T-121's `notificationRouting` tests,
> but closing it still needs a `logcat` line from a real killed app.
> 🛑 **T-031 — item 1 CLOSED by the owner, do NOT reopen** → `PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own files.

---

## 🔴 BOARD STATE 2026-09-18 — read before starting anything

**`tsc` BASELINES: API 281 · admin 6 (via `tsc -b`) · user 5 · driver 28.** All four lint at
**0 errors**. **Lint WARNING baselines: user 208 · driver 275.** **Raw-colour ceilings: user 1 ·
driver 3**, enforced by `scripts/check-design-tokens.mjs` in each app.
🔴 **Never rebaseline upward.** A test file that adds a `tsc` error or a lint warning is a defect
in the test file, not a new baseline. The user app's **5** is a floor set deliberately by T-121
step 6 (a dead block deleted); everything else has held since T-118.

**Test suites that must stay green** (all three are `npm test`, one command each):
**API 357** · **user app 252 Jest + 11 checkers** · **driver app 278 Jest + 11 checkers**.
*(All three measured green 2026-09-18 at T-121's close. Re-measure; every previous set of numbers
written here went stale within two sessions.)*
⚠️ **Run `tsc` as well as `jest`** after writing a test file — Jest strips types without checking
them, so a type error in a test file hides behind a fully green suite.

**Board rot, still not fixed (rule 1):** `docs/TODO.md` has **two `## 🔥 Now` sections** whose
contents overlap, and **22 card IDs appear more than once**. **Boarded as T-122.**

---

## Task

- **ID / name:** T-123 — a timed-out request is not recognised as a timeout, in both apps
- **Why now:** the owner picked it from the four cards offered at T-121's close. It is the defect
  T-121's own tests found (step 5, 2026-09-15) and **recorded rather than fixed**, per that card's
  rule. Two tests already exist that were **written to go red when it is fixed**, so the proof is
  half-built. It is the smallest card on the board with a real user-facing effect.
- **What the user sees today:** they lose signal while registering. The request aborts after
  `API_TIMEOUT`, and the screen says **"could not send the code"** — the caller's generic default —
  instead of telling them they are offline. **This is the first screen every new install sees.**

### 🔴 What the measurement changed (read this before trusting the card text)

The board says *"the mismatch is one substring"* — `errorHandler` matches `'timeout'` while
`api/auth.ts` throws *"Request timed **out**"*. **That is true and it is not the whole defect.**
Measured 2026-09-18 across both apps:

1. **24 abort branches exist across both apps' `api/` folders, and all 24 throw a sentence** —
   18 in the user app (`auth` 1, `geo` 1, `offers` 7, `passengerOffers` 9) and 6 in the driver app
   (`auth` 1, `passengerOffers` 5). Only the two in `auth.ts` say *"timed out"*; the other 22 say
   *"timeout"* and are matched correctly today.
2. 🔴 **But most of `auth.ts` has no abort branch at all.** Of the user app's **8** exported
   functions only `sendOtp` converts the abort; `verifyOtp`, `googleSignIn`, `appleSignIn`,
   `facebookSignIn`, `getCurrentUser`, `refreshAccessToken` and `logout` re-throw the **raw
   `AbortError`**, whose message is *"Aborted"* — which matches **neither** spelling. The driver
   app is the same shape: **5** exported functions, **1** abort branch.
   **So fixing only the spelling fixes `sendOtp` and leaves twelve functions wrong**, including
   `verifyOtp` (the OTP screen) and `refreshAccessToken` (the T-038 session path).
3. 📌 **`isNetworkError` has NO callers** in either app outside its own module and its tests.
   The card names it as half the damage; it is dead code. **The entire live effect runs through
   `handleBackendError`** (14 files call it).
4. ✅ **`errors.timeout` exists in all six translation files** (uz/ru/en × 2 apps), so the fix has
   a string to show. ⚠️ Confirm the driver app's `uz` copy sits inside the `errors:` block — it is
   at a suspiciously early line (73) — before relying on it.

### Goal (definition of "done")

1. **An aborted request is recognised as a timeout in both apps, however it surfaces:** as the raw
   `AbortError` (12 functions), as *"Request timed out…"* (2), or as *"Request timeout…"* (22).
   The user reads `errors.timeout` in their own language instead of a generic default.
2. **The fix lives in `utils/errorHandler.ts`, one file per app** — the single place both reads
   (`handleBackendError`'s network branch and `isNetworkError`) already sit.
3. **The two tests that pin the defect on purpose are FLIPPED, not deleted** —
   `📌 DEFECT, pinned as-is` in `utils/errorHandler.test.ts:208` (user) and `:212` (driver). They
   were written to go red here; they become the tests that prove the fix.
4. **New cases are tested and proven red:** the raw `AbortError` (name, not message), both
   spellings, `ECONNABORTED`, and **a message that merely contains neither** — so the predicate
   cannot be made to swallow everything.
5. **All six baselines unchanged and re-measured** (user `tsc` 5 / lint 0·208 / colours 1 ·
   driver 28 / 0·275 / 3) and **both suites green**, plus the API's 357 untouched.
6. **No new dependency. No migration. No screen changed.** Two runtime files, two test files.

### Explicitly OUT of scope

- 🛑 **Re-wording the 24 thrown sentences.** They are also what `console.error` logs, and matching
  the abort itself makes the wording irrelevant — which is the point. *If the wording is unified
  later it is cosmetic, and it is a separate card.*
- 🛑 **Adding abort branches to the twelve functions that lack one.** The fix in `errorHandler`
  covers them; adding 12 more `try/catch` arms is the shape of change this project's rule 2 warns
  about, and every one would be a new place to get the wording wrong.
- 🛑 **Giving `isNetworkError` callers.** It is dead; this card fixes it because it is the twin
  read of the same rule, not because anything runs it.
- 🛑 **T-124** (the dead util halves) and **T-122** (the duplicated board). Both boarded.

## Approach

- **One predicate, used twice.** A module-private `isTimeoutError(error)` in each app's
  `errorHandler.ts`, read by the network branch of `handleBackendError` and by `isNetworkError`,
  so the two reads cannot drift apart again — *drifting apart is what this card is*.
- **Recognise the abort, not the prose:** `error.name === 'AbortError'` first, then
  `code === 'ECONNABORTED'`, then a message test covering both spellings. Order matters only for
  readability; any one match is enough.
- ⚠️ **The two apps' `errorHandler.ts` differ by 59 lines** (T-121 step 5 measured it: the driver's
  is the richer copy, carrying T-061's `getFieldErrors` / `displayValidationErrors`). **The two
  reads sit at the same lines — 87 and 202 — in both**, but read each file before editing it.
  **Fix both apps in the same card** — walking past the twin is this project's most-repeated
  defect class.
- **The test fixtures must construct the error explicitly.** Node 22 gives an aborted fetch the
  message *"This operation was aborted"*; React Native's polyfill gives *"Aborted"*. Neither is
  ours to pin, so the tests build `Object.assign(new Error('Aborted'), { name: 'AbortError' })`
  and assert on **what we decide** (the name), never on what a runtime happens to say.
- **Prove red, both apps, predicting the red set before running each mutation** — the ritual that
  T-121 paid for, scripted at `scratchpad/mutate.sh` (it refuses a mutation that changes no byte).
  Revert from a scratchpad golden copy, **never `git checkout`** (`core.autocrlf`).

## Steps

- [x] **0. Owner approval of this plan** (rule 3). ✅ *"i confirm"*, 2026-09-18 — **the WIDE fix**,
  answered against the question below in so many words. One question inside it, and it was the only one:
  **the fix matches `AbortError` by name, which changes behaviour for the twelve `auth.ts`
  functions that today surface a raw abort** — `verifyOtp`, the three SSO calls, `getCurrentUser`,
  `refreshAccessToken`, `logout` and their driver-app equivalents. They will start saying "your
  connection timed out" where they now say the caller's generic default. **That is the fix, not a
  side effect** — but it is wider than the board's one-substring description, so it is yours to
  confirm. *(If you'd rather keep it narrow: say so and I will match only the two spellings, which
  fixes `sendOtp` alone and leaves the other twelve as they are.)*
- [x] **1. User app — the predicate and both reads.** ✅ **DONE 2026-09-18.** `isTimeoutError` in
  `utils/errorHandler.ts`, read by `handleBackendError`'s network branch and by `isNetworkError`.
  The pinned test was **flipped, not deleted**, and three cases added. **50 → 53 tests.**
  🔴 **A SECOND DEFECT, FOUND BY MY OWN NEW TEST AND FIXED HERE** (it is one line, inside the file
  this card already owns — `CheckRow.tsx` is the precedent): **`error.message?.includes(…)` throws
  a `TypeError` when `message` is not a string.** Optional chaining guards `null` and `undefined`
  only, so a **numeric** message reaches `.includes` — and both readers run inside a `catch`,
  where a throw is a crash. Extracted as `messageOf`, used by all three reads.
  **Prove red — 4 mutations, all four red sets predicted exactly** (the second time round, see
  below): ⓐ the `AbortError` arm dropped → 1, the raw-abort test; ⓑ the `timed out` arm dropped →
  1, the flipped test — *which is the whole card, proven*; ⓒ the predicate forced to `true` → 5,
  including the two `it.each` rows that must stay `errors.network`; ⓓ `messageOf` stops checking
  the type → 3.
  🔴 **LINT CAUGHT ME REBASELINING: 208 → 210.** Both new helpers took `error: any`, and
  `@typescript-eslint/no-explicit-any` is a warning here. **A change that adds a warning is a
  defect in the change, not a new baseline** — rewritten with `unknown` plus an explicit narrowing
  cast, back to **208**. *(The surrounding file is full of `any`; that is the existing 14 warnings,
  not mine to widen.)*
  ⚠️ **The four mutations were first run against the `any` version, so they were RE-RUN against the
  final code** — a proof against code you then edit is not a proof. Second run: 4 predicted, 4
  matched, including ⓓ which the first run had under-predicted (1 predicted, 3 red: the guard also
  covers an **absent** message, not only a wrongly-typed one).
  Baselines after: user `tsc` **5** / lint **0 · 208**.
- [x] **2. Driver app — the same, read from its own source.** ✅ **DONE 2026-09-18.** **57 → 60
  tests.** The two reads sit at the same lines as the user app's and were confirmed before
  editing; the header comment is written from **this** app's numbers (4 of its 5 `auth.ts`
  functions have no abort branch, and its sentence-throwing branches are in `passengerOffers`,
  not `offers`/`geo`, which this app has not got in that shape).
  **Re-proved red here, all four, red sets predicted first and all four matched** — ⓐ 1, ⓑ 1,
  ⓒ 5, ⓓ 3. **Never assume the copy passes.**
  ✅ **The driver's `uz` `errors.timeout` was checked and is fine** — inside the `errors:` block,
  a full sentence (*"So'rov vaqti tugadi. Iltimos, qayta urinib ko'ring."*). The suspicious line
  number was just this file's ordering. Baselines after: driver `tsc` **28** / lint **0 · 275**.
- [x] **3. Confirm nothing else moved.** ✅ **DONE 2026-09-18.** Both full suites green —
  **user 255 Jest + 11 checkers · driver 281 + 11** (+3 each, exactly the three tests added per
  app). The branches that already said *"timeout"* still classify as timeouts: that is the
  `it.each` row *"the literal word timeout"* plus mutation ⓑ, which reddens **only** the flipped
  test. **All six baselines re-measured and unchanged:** user 5 / 0·208 / colours 1 · driver
  28 / 0·275 / 3 (the colour ceilings ride inside the 11 green checkers).
- [x] **4. Close.** ✅ **DONE 2026-09-18.** `docs/TODO.md` (T-123 → Done, its "one substring" text
  corrected), `docs/JOURNAL.md`, `docs/CHECKLIST.md` (the one thing tests cannot see: airplane
  mode mid-OTP-send). `ARCHITECTURE.md` needed nothing — no component changed status. Commit
  proposed. **Nothing was found and left unfixed:** the second defect was one line in the file
  this card already owned, so it was fixed here rather than boarded.

**Every step:** read the file → make the change → prove it red → revert the mutation → `tsc` AND
lint AND both suites → `[x]` with the mutation recorded.

## Files to touch

**Runtime (2):** `user-app-standalone/utils/errorHandler.ts` ·
`driver-app-standalone/utils/errorHandler.ts`
**Tests (2, already exist):** `user-app-standalone/utils/errorHandler.test.ts` ·
`driver-app-standalone/utils/errorHandler.test.ts`
**Docs:** `docs/PLAN.md` · `docs/TODO.md` · `docs/JOURNAL.md`
**NOT touched:** any `api/*.ts`, any screen, any translation file, any dependency.

## Risks / open questions

1. ❓ **The one open question is step 0's** — narrow fix (two spellings, `sendOtp` only) or the
   real one (match the abort, twelve more functions behave correctly). **Recommendation: the real
   one.** A raw `AbortError` reaching a user as "something went wrong" is the same bug with a
   different mask, and the tests make the wider behaviour provable.
2. ⚠️ **Matching `'timed out'` as a substring will also catch a SERVER message containing those
   words.** That path is only reachable when `status === undefined` (no response at all), so a
   server sentence cannot get there. Noted so nobody re-derives it.
3. ⚠️ **`errors.timeout`'s English copy reads "Request timeout"** — terse, and the uz/ru copies are
   full sentences. Not this card's business, but if it looks wrong on a device, that is why.
4. ⚠️ **No device test can be demanded of this card** beyond "turn airplane mode on mid-request".
   It is worth one real run on the OTP screen, and it is the only part tests cannot see.

## Session notes

### 2026-09-18 — card opened and planned

- Measured before writing the plan, and it **corrected the board twice**: the 24 abort branches are
  not "every module except auth" (the driver app has abort branches in only 2 of its modules), and
  **the raw-`AbortError` case — twelve functions — is bigger than the spelling case**. Also found
  **`isNetworkError` has no callers at all**, so the card's second symptom is dead code.
- T-121's plan preserved verbatim at `docs/PLAN-T121.md`.

### 2026-09-18 (2) — approved and finished, steps 0-4

- **The owner confirmed the wide fix in words**, so `AbortError` is matched by name and the twelve
  `auth.ts` functions that surface a raw abort now report a timeout instead of a generic default.
- **Two runtime files, two test files, +6 tests, 8 mutations, every red set predicted exactly.**
- 🔴 **The card found a second defect — with a test I wrote for a different reason.**
  `error.message?.includes(…)` **throws on a non-string message**: optional chaining guards `null`
  and `undefined`, and nothing else. Both readers run inside a `catch`, so that is a crash path.
  It is one line, in the file this card already owned, so it was fixed rather than boarded — the
  T-118 `CheckRow.tsx` precedent. *The test that caught it was written to prove the predicate
  could not swallow everything; it failed for a reason I had not predicted, which is the useful
  kind of failure.*
- 🔴 **I rebaselined lint by two warnings and the re-measure caught it** (208 → 210): both helpers
  took `error: any`. Rewritten with `unknown` and an explicit narrowing cast. **A change that adds
  a warning is a defect in the change** — that rule has now paid for itself in four consecutive
  cards.
- ⚠️ **A proof against code you then edit is not a proof.** The first four mutations ran against
  the `any` version; after the rewrite they were **re-run against the final code**. The re-run
  also corrected an under-prediction in ⓓ (1 predicted, 3 red — the type guard covers an *absent*
  message too, not only a wrongly-typed one).

## Resume point

> **Updated 2026-09-18 (2). T-123 IS COMPLETE — all 5 steps done. Nothing in this card is open.**
> **NOT COMMITTED** — the commit is proposed and waiting for the owner's yes. The working tree
> holds **4 modified files** (`utils/errorHandler.ts` and `utils/errorHandler.test.ts` in each
> app), the memory files, and `docs/PLAN-T121.md` (untracked, T-121's preserved plan).
> **What changed, in one line:** a timeout is now recognised by the **abort itself**
> (`name === 'AbortError'`), by `ECONNABORTED`, and by **both** message spellings — one predicate
> per app, read by `handleBackendError` and `isNetworkError` so the two cannot drift apart again.
> 🟢 **All six baselines re-measured and unchanged: user `tsc` 5 / lint 0·208 / colours 1 · driver
> 28 / 0·275 / 3.** 🟢 **Suites: user 255 Jest + 11 checkers · driver 281 + 11 · API 357.**
> ⚠️ **THE ONE THING TESTS CANNOT SEE, now in `docs/CHECKLIST.md`:** turn airplane mode on while
> the OTP send is in flight, on both apps. It must say the connection timed out
> (`errors.timeout`), not "could not send the code". **Nobody has run it on a device yet.**
> **▶️ NEXT: the owner's pick.** *Now* holds **T-101** (design system, step 18) and **T-088**'s one
> code step; **T-124** (P3, the dead util halves) and **T-122** (the duplicated board) are the
> cheap ones. ⚠️ **T-118's CI run is still unconfirmed on GitHub** — it needs the Actions tab.
