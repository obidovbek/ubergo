# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 📦 **T-118 (the app test suites) → `docs/PLAN-T118.md`, moved 2026-09-14 when T-121 took this
> file.** It is **DONE and committed as `7526742`** except **step 12's proof**: the CI workflow
> is written and pushed but **nobody has confirmed a green run on GitHub yet**. Tick it there.
> 📦 **T-101 (the design system) → `docs/PLAN-T101.md`.** Still in *Now*; steps 2b and 19-26 are
> open; sub-plans `PLAN-T101-step14b/16/17/18/19.md` and `PLAN-T101-SCOPES.md`.
> 📦 **T-102 → `PLAN-T102.md`** (T-102i next, the read side) · **T-102c-3 → `PLAN-T102c3.md`**.
> 📦 **T-088 (Paynet) → `docs/PLAN-T088.md`.** One code step (`ChangePassword` persistence), the
> rest is T-100 and Paynet's credentials.
> 📦 **T-114 → `PLAN-T114.md`**, sub-step ① planned, not started.
> ✅ **T-092** → `PLAN-T092.md`. ✅ **T-091** → `PLAN-T091.md`. ✅ **T-087** → `PLAN-T087.md`.
> ✅ **T-081** → `PLAN-T081.md`. ✅ **T-078** → `PLAN-T078.md`. ✅ **T-077** → `PLAN-T077.md`.
> ✅ **T-065** → `PLAN-T065.md`. ✅ **T-066+T-067** → `PLAN-T066-T067.md`. ✅ **T-061** → `PLAN-T061.md`.
> 🔴 **T-047 PARKED** — but see step 3 below: **this card tests the code that was supposed to fix
> it**, which is the closest anyone has come to proving whether it is actually fixed.
> 🛑 **T-031 — item 1 CLOSED by the owner, do NOT reopen** → `PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own files.

---

## 🔴 BOARD STATE 2026-09-14 (4) — read before starting anything

**`tsc` BASELINES: API 281 · admin 6 (via `tsc -b`) · user 6 · driver 28.** All four lint at
**0 errors**. **Lint WARNING baselines: user 208 · driver 275.** **Raw-colour ceilings: user 1 ·
driver 3**, enforced by `scripts/check-design-tokens.mjs` in each app.
🔴 **Never rebaseline upward.** A test file that adds a `tsc` error or a lint warning is a defect
in the test file, not a new baseline. T-118 corrected **three** stale numbers by measuring
(user lint 216 → 208, checkers 12 → 11 per app, "23 checkers" → 22). **Re-measure; do not trust
these numbers, including these.**
🟢 **This card is EXPECTED to move the user `tsc` baseline DOWN, 6 → 5** (step 6). That is the one
kind of baseline move that is allowed, and only with the explanation written into the step.

**Test suites that must stay green** (all three are `npm test`):
**API 357** · **user app 34 Jest + 11 checkers** · **driver app 46 Jest + 11 checkers**.
⚠️ **Run `tsc` as well as `jest` after writing a test file** — Jest strips types without checking
them, so a type error in a test file hides behind a fully green suite (T-118 lost a step to this).

**Board rot, noted and NOT fixed here (rule 1):** `docs/TODO.md` has **two `## 🔥 Now` sections**
(lines ~64 and ~663) whose contents overlap, and **22 card IDs appear more than once** (T-078 four
times) — 142 card lines for 118 distinct ids. A board that contradicts itself is a memory that
cannot be trusted. **Boarded as T-122 in *Later*.**

---

## Task

- **ID / name:** T-121 — Jest tests for the untested `utils/` in both RN apps, starting with the
  four byte-identical twins and the four that have drifted apart
- **Why now:** the owner, straight after T-118 closed: *"Is there continue of writing test?"*
  Measured answer: **yes.** T-118 deliberately covered "the screens that keep needing a phone".
  It left **~12 utils per app with no coverage of any kind** — not Jest, not a `check-*.mjs`
  checker. These are the cheapest tests in the project (pure logic, no harness, no device) and
  **three of them sit directly on open or parked bugs**:
  - `tokenStore` — the T-038 refresh-token path. `ARCHITECTURE.md` still marks it
    *"Not yet confirmed working on a device"*; before T-038 every session died after 15 minutes.
  - `notificationRouting` — **T-047**, the killed-app tap, is still *PARKED*. The code already
    contains a fix (a bounded re-park instead of a discard) with a long comment explaining the
    regression it caused. **Nothing has ever verified it.**
  - `date` — contains a **confirmed dead duplicate block** and is one of the 6 live `tsc` errors.
- **What is NOT the reason:** the four twins being byte-identical is *fine* — the apps duplicate
  shared code on purpose. The point is that one test file protects both copies, so the cost per
  app is halved. Equally, `notificationRouting` differing by 123 lines between apps is **expected**
  (different screens, different push types), not evidence of a bug.

### Goal (definition of "done")

1. **Jest tests exist for these eight utils, in both apps where both have them**, each proven able
   to fail by mutating the code and reverting:
   **Tier 1 (the ones with open bugs behind them)** — `tokenStore`, `notificationRouting`,
   `errorHandler`, `date`.
   **Tier 2 (cheap and identical)** — `contactPhone`, `format`, `pendingOtp`, `validation`.
2. **`notificationRouting`'s test is the T-047 regression guard**, explicitly: a tap that arrives
   before the navigator is ready is **parked**; a flush whose `navigate` throws **re-parks** it
   rather than discarding it; after `MAX_FLUSH_ATTEMPTS` (10) it gives up **once and for all**;
   and `clearPendingNotification` resets the retry budget so one target's failures are not charged
   to the next. *That third behaviour is the exact bug the owner saw as "it opens the main menu".*
3. **`tokenStore`'s test pins the JWT expiry maths** (`getTokenExpirySec`, `isTokenExpiringSoon`
   and its 60-second skew) and the `onAuthLost` / `notifyAuthLost` listener contract — the
   mechanism that decides when a session silently dies.
4. **`routeForNotification`'s documented trap is pinned:** `offer_id` means a **DriverOffer** in
   some payloads and the passenger's **own PassengerOffer** in others, and the id must agree with
   the screen. A malformed or missing id must fall back to the list, never push `NaN` into a
   screen that reads `route.params.offerId`.
5. **The dead duplicate in `user-app-standalone/utils/date.ts` is deleted** and the **user `tsc`
   baseline moves 6 → 5**, with the reason recorded in this plan, the journal and the board.
   ⚠️ Check the driver app's `date.ts` for the same duplication before assuming it is user-only.
6. **All baselines otherwise unchanged and re-measured after every step:** user `tsc` 5 (after
   step 6; 6 before) / lint 0·208 / colours 1 · driver 28 / 0·275 / 3. **Both suites green.**
7. **No new dependency.** The harness, the mocks and the runner all already exist (T-118).

### Explicitly OUT of scope

- 🛑 **More screen tests.** That is the other slice the owner was offered and did not pick; it
  stays available as its own card.
- 🛑 **The admin panel.** It has no runner at all — a T-118-shaped card of its own.
- 🛑 **The API's server-flow tests.** Still **T-010**, still blocked on extracting logic from the
  Sequelize-importing services.
- 🛑 **Fixing the two utils whose tests may go red.** If a test proves a real defect, the card
  **stops, records it, and boards it** — except where the fix is as small and as provable as the
  `date.ts` deletion in step 6. *T-118's one-character `CheckRow.tsx` fix is the precedent for
  what counts as small enough.*
- 🛑 **De-duplicating `docs/TODO.md`.** Real, boarded as T-122, not this card.
- 🛑 **Refactoring a util to make it testable.** `routeForNotification` is module-private on
  purpose; test it through `handleNotificationTap`, which is the public behaviour anyway. If
  something genuinely cannot be reached, log why and move on (rule 1).

## Approach

- **Everything needed already exists.** T-118 built the runner, and `test/setup.ts` already mocks
  AsyncStorage with its official jest mock — which is `tokenStore`'s only import. **No new
  dependency, no harness change, no `App.tsx` change.**
- **These are `*.test.ts`, not `.tsx`** — pure logic, no rendering, no `renderScreen`. They will
  run in milliseconds, unlike the screen tests.
- **Module-level state is the trap in this card.** `notificationRouting` keeps `pendingTarget` and
  `flushAttempts` at module scope, so tests leak into each other. Use the author's own seam —
  `clearPendingNotification()` in `beforeEach` (its doc comment literally says *"Test seam"*) —
  and `jest.resetModules()` only if that proves insufficient. `clearMocks: true` is already on in
  both configs.
- **`navigationRef` is the seam for routing tests:** mock `@react-navigation/native`'s
  `createNavigationContainerRef` so `isReady()` and `navigate()` are controllable
  `jest.fn()`s — that is what lets a test reproduce a cold start, and a `navigate` that throws.
  ⚠️ **Spread `jest.requireActual`** — the T-118 lesson: an automock blanks the module's other
  exports and the assertions go quiet.
- **Twins get ONE test file written twice**, per app, like the components — not a shared import.
  That is the project's deliberate convention (`CLAUDE.md`, and the harness itself). Write the
  user app's, prove it red, then copy and re-prove in the driver app; **do not assume the copy
  passes** — `validation` and `date` differ by 219 and 201 lines.
- **Prove red, every time.** One deliberate mutation per test file, caught by exactly the test
  that should catch it, then `git checkout` the file. A step is not `[x]` until its mutation line
  is filled in with what actually failed.
- **Measure before writing each file.** T-118's card text was wrong about a screen four separate
  times; every correction came from reading the code first. Read the util, then write the test.

## Steps

- [ ] **0. Owner approval of this plan** (rule 3), plus one question: **step 6 deletes 6 lines of
  unreachable duplicate from `user-app-standalone/utils/date.ts` and lowers the user `tsc`
  baseline 6 → 5.** That is a runtime file, so it is the owner's call, not mine. Yes or no?
  *(If no: the test still gets written, the dead block stays, and the baseline stays 6.)*
- [x] **1. `tokenStore`, user app.** ✅ **DONE 2026-09-14 (4).** `utils/tokenStore.test.ts`,
  **17 tests**: `TOKEN_KEYS.ACCESS` pinned at `'@auth_token'` (renaming it logs out every existing
  install — nothing migrates the key); the pair round trip; **`setTokens('access')` alone must NOT
  erase the stored refresh token**, and `null` / `''` count as "not supplied" rather than "erase"
  (this is the T-038 failure itself); `clearTokens`; the listener contract including **a throwing
  listener not stopping the others**; `getTokenExpirySec` on a good token, on base64url needing
  `-`/`_` mapped back, on every unreadable shape → `null`, and the unparseable-payload fallback;
  `isTokenExpiringSoon` across expired / healthy / **the inclusive 60-second skew boundary** /
  a custom skew / unknown-expiry-means-false.
  **Prove red:** `<=` → `<` in the skew comparison → **exactly the two boundary tests failed**,
  the other 15 stayed green; reverted with `git checkout`. Baselines after: `tsc` **6**, lint
  **0 / 208**.
- [x] **2. `tokenStore`, driver app.** ✅ **DONE 2026-09-14 (4).** Copied, header re-pointed,
  **17 tests pass**; the same mutation re-proved red there (same two tests) and was reverted.
  Baselines after: `tsc` **28**, lint **0 / 275**.
  🔴 **Gotcha found here, worth more than the step:** `core.autocrlf=true` in this repo, so
  **`git checkout` — the revert half of the prove-red ritual — rewrites the file's line endings**
  (LF → CRLF). A plain working-tree `diff` then reports two byte-identical twins as *153 of 153
  lines changed*. Git itself still sees the file as unmodified, so **nothing wrong reaches the
  repo** — but it destroys `diff` as a drift check. **Compare twins with
  `git show HEAD:<path>`**, which is what re-confirmed the numbers in the Resume point.
- [x] **3. `notificationRouting`, user app — the T-047 guard.** ✅ **DONE 2026-09-14 (4).**
  `utils/notificationRouting.test.ts`, **25 tests**: the full routing table; the
  `offer_id`-means-two-entities rule (`driver_join_request` → `OfferDrivers`, and asserted NOT to
  reach `OfferDetails`); six malformed ids (missing, empty, `abc`, `0`, `-3`, `NaN`) each falling
  back to the list rather than emitting `NaN`; unknown/absent types → `Notifications`; parking
  when not ready; replay once and only once; and the T-047 block — a failed flush **re-parks**,
  survives repeated failures, **gives up for good at 10**, and the budget is reset both by
  `clearPendingNotification` and by a successful delivery.
  **Prove red — THREE separate mutations, each caught by exactly its own test:** ⓐ the flush's
  `pendingTarget = target` removed (the literal T-047 bug) → the three re-park tests; ⓑ
  `clearPendingNotification` not resetting `flushAttempts` → the "does not charge one target's
  failures" test; ⓒ the success path not resetting it → the "resets the budget" test. All reverted.
  🔴 **THE STEP FOUND A DEFECT IN ITS OWN TESTS FIRST, TWICE.** Mutation ⓐ initially reddened only
  2 of 3 expected tests, and mutation ⓑ reddened **none**. Cause, and it is worth remembering:
  **a `navigate` that THROWS is still a recorded call**, so `toHaveBeenLastCalledWith(...)` passes
  identically whether the target was delivered or attempted-and-dropped. The fix is to assert the
  **call count** — "three attempts: the park, the failed flush, the delivery" — which is what
  actually distinguishes the two. *Three tests were rewritten; the comments in the file say why.*
  **A mutation that reddens fewer tests than predicted is a finding about the tests, not a
  miscount** — predicting the red set before running it is what exposed this.
  🔴 **`import/first` cost one lint warning (208 → 209)** because `jest.mock` sat between the two
  imports. `babel-plugin-jest-hoist` lifts `jest.mock` above the imports anyway, so the block
  moved BELOW them: mock still installed, warning gone, back to 208. Baselines after: `tsc` **6**,
  lint **0 / 208**.
- [ ] **4. `notificationRouting`, driver app.** Same structure, **different routing table** (its
  own push types and screens — read them, do not copy the user app's expectations). Re-prove red.
- [ ] **5. `errorHandler`, both apps.** The axios-shaped `.response` convention (both apps use
  `fetch`, yet errors carry `.response` — the shape every screen reads). Pin what a 400 with
  `errors[]`, a 409 duplicate, a 422, a network failure and a thrown string each produce.
  ⚠️ The two files differ by 59 lines — read both. **Prove red** in each.
- [ ] **6. `date`, user app — the dead block.** *Only if the owner said yes in step 0.* Delete the
  duplicated `if (language === 'uz')` block at lines ~97-102 (identical to ~88-93, comment
  included, unreachable because the first returns). **Then test the function** — uz manual month
  mapping, ru/en locale formatting — so the deletion is proven not to change behaviour.
  **Re-measure: user `tsc` 6 → 5.** Record the drop here, in the journal and on the board.
  🔴 **Check the driver app's `date.ts` for the same duplication first** — the two differ by 201
  lines, so it may or may not be there. *This is the defect class this project repeats most.*
- [ ] **7. `date`, driver app.** Whatever step 6 found. Test either way; re-prove red.
- [ ] **8. Tier 2, both apps: `contactPhone`, `format`, `pendingOtp`, `validation`.** The first
  three are byte-identical twins (write once, copy, re-prove). `validation` differs by **219
  lines** — read both, write two real files, not a copy.
- [ ] **9. Close.** Re-measure all six baselines and both suites; update `CLAUDE.md` §1 only if
  the covered-modules sentence is now wrong; `docs/TODO.md` + `docs/JOURNAL.md`; propose the
  commit. **Board anything a test proved that this card did not fix.**

**Every step:** read the util → write the test → prove it red → revert the mutation → `tsc` AND
lint AND both suites → `[x]` with the mutation recorded.

## Files to touch

**New, user app:** `utils/{tokenStore,notificationRouting,errorHandler,date,contactPhone,format,pendingOtp,validation}.test.ts`
**New, driver app:** the same eight.
**Changed (runtime), at most one file:** `user-app-standalone/utils/date.ts` — 6 lines deleted,
and only on the owner's yes in step 0. Possibly its driver twin (step 6).
**Docs:** `docs/PLAN.md` (this file) · `docs/TODO.md` · `docs/JOURNAL.md` · `CLAUDE.md` §1 if the
tests paragraph becomes inaccurate.
**NOT touched:** `test/setup.ts`, `test/render.tsx`, `package.json`, any screen, any navigator.

## Risks / open questions

- ❓ **Step 0, for the owner:** delete the 6 dead lines in `date.ts` and take the user baseline to
  5, or leave them and keep 6? *Recommendation: delete.* It is unreachable code that the compiler
  already flags, and the test written alongside proves the deletion changes nothing.
- 🔴 **A test may prove a real defect rather than pinning correct behaviour.** Most likely in
  `notificationRouting` (T-047 is parked precisely because nobody knows if it is fixed) and in
  `errorHandler` (59 lines of drift between apps that nobody chose deliberately). **The card's
  rule: stop, record, board it — do not fix it here.** The exception is a `CheckRow.tsx`-sized
  one-liner, which is a judgement call to be stated out loud, not made quietly.
- ⚠️ **Module-level state leaking between tests** (`pendingTarget`, `flushAttempts`). T-118 already
  lost time to a mock's call history leaking; this is the same class. `clearPendingNotification`
  in `beforeEach` is the intended seam.
- ⚠️ **"Byte-identical" is true today.** Copy the test, but re-run and re-prove in the second app
  every time — the twins are maintained by hand and drift silently. That is exactly how
  `validation` came to differ by 219 lines.
- ⚠️ **These tests cannot see anything a device sees.** No fonts, no layout, no real push arriving.
  `notificationRouting`'s test proves the *decision*, not that a tapped notification on a real
  killed app reaches it. **T-047 needs a `logcat` line to close, and this card does not close it.**
- ❓ **Is `pushEvents` worth a file?** 111/114 lines, 3 lines of drift, and it is the thin event
  bus the screens subscribe to. Left out of the eight for now; decide in step 8.

## Session notes

### 2026-09-14 (4) — approved; steps 1-3 done

- **Owner approved the plan with "i confirm"**, taken as the recommendations per the T-118
  precedent — including **yes to the `date.ts` deletion** in step 6. Flagged in the reply so it
  can be corrected before step 6 runs.
- **Three test files, 59 tests, all proven red.** `tokenStore` ×2 (17 each) and
  `notificationRouting` user (25).
- 🔴 **The most valuable thing learned is about testing, not about the app:** asserting
  `toHaveBeenLastCalledWith` on a mock whose implementation **throws** cannot tell "delivered"
  from "attempted and discarded" — the throwing call is recorded either way. Two mutations slipped
  through green tests before this was spotted. **Assert the call COUNT for anything retry-shaped.**
  It was caught only because the red set was predicted before each mutation was run.
- 🔴 **`core.autocrlf=true` + `git checkout` (the revert half of prove-red) rewrites line endings**,
  so a working-tree `diff` calls two identical twins "153 of 153 lines changed". Nothing reaches
  the repo — git normalises — but **twin comparison must use `git show HEAD:<path>`.** The plan's
  drift numbers were re-verified that way and all held.
- **Still to do: steps 4-9.** Nothing committed yet.

## Resume point

> **Updated 2026-09-14 (4). Steps 0-3 are DONE (the owner approved with "i confirm", read as yes
> to the `date.ts` deletion). Steps 4-9 are open. NOTHING IS COMMITTED.**
> Three new test files exist and are green: `utils/tokenStore.test.ts` in BOTH apps (17 tests
> each) and `utils/notificationRouting.test.ts` in the user app (25). Baselines re-measured and
> unchanged: user `tsc` 6 / lint 0·208 · driver `tsc` 28 / lint 0·275.
> **▶️ NEXT IS STEP 4** — `notificationRouting` in the DRIVER app, which has a different routing
> table (`passenger_join_request` → `OfferPassengers`, `driver_request_confirmed` /
> `driver_request_rejected` / `driver_not_chosen` / `offer_cancelled_by_passenger` →
> `MyJoinRequests`, `passenger_offer_updated` → `PassengerOfferDetails`). **Read it; do not copy
> the user app's expectations.** The park/flush half IS the same and can be copied.
> ⚠️ **When you write it, assert call COUNTS on the retry tests** — see Session notes.

**STATE:** T-118 is done and committed (`7526742`); its plan is preserved at `docs/PLAN-T118.md`
and its **only open item is confirming the first CI run went green on GitHub** — nobody has looked
yet, and it cannot be checked from the Claude shell (no `gh`, network cert-blocked). Both apps
have a working Jest setup and a harness. **Test totals now: user 76, driver 63 (139 total, up
from 80).** This card adds **pure-logic `*.test.ts` files only** — no new dependency, no harness
change, and so far one runtime file touched (none yet; `date.ts` is step 6).

**⚠️ ONE ASSUMPTION TO CONFIRM BEFORE STEP 6:** the owner's "i confirm" was read as approving the
plan **including** the `date.ts` deletion, on the T-118 precedent that a one-word approval takes
the recommendations. It was flagged in the reply and not contradicted, but it was never answered
in so many words. **If in doubt, ask once before deleting.**

**▶️ RESUMING: steps 0-3 are done; start at step 4.** The measurements
that grounded this plan (so they do not need redoing): user has 4 of 16 screens and ~12 utils
untested; driver 4 of 23 and ~12; `contactPhone` / `format` / `pendingOtp` / `tokenStore` are
**byte-identical** across the apps, while `pushEvents` / `errorHandler` / `notificationRouting` /
`validation` / `date` differ by 3 / 59 / 123 / 219 / 201 lines; `routeForNotification` is
module-private and reached through `handleNotificationTap`; `date.ts` lines ~97-102 are a verbatim
unreachable duplicate of ~88-93 and are one of the user app's 6 `tsc` errors.
