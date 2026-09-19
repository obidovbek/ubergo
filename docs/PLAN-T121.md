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

**`tsc` BASELINES: API 281 · admin 6 (via `tsc -b`) · user 5 · driver 28.** All four lint at
**0 errors**. **Lint WARNING baselines: user 208 · driver 275.** **Raw-colour ceilings: user 1 ·
driver 3**, enforced by `scripts/check-design-tokens.mjs` in each app.
🔴 **Never rebaseline upward.** A test file that adds a `tsc` error or a lint warning is a defect
in the test file, not a new baseline. T-118 corrected **three** stale numbers by measuring
(user lint 216 → 208, checkers 12 → 11 per app, "23 checkers" → 22). **Re-measure; do not trust
these numbers, including these.**
🟢 **DONE 2026-09-15 (3): the user `tsc` baseline moved DOWN, 6 → 5**, in step 6 — the one kind of
baseline move this card allows. The 6th error was `utils/date.ts(97,7) TS2367` on an unreachable
duplicate block, now deleted (9 lines) with 29 tests proving the deletion changed nothing.

**Test suites that must stay green** (all three are `npm test`):
**API 357** · **user app 252 Jest + 11 checkers** · **driver app 278 Jest + 11 checkers**.
*(Re-measured 2026-09-18 after step 9. These numbers read 34 and 46 until step 5 and 155/178 until
step 8 — each set was stale within two sessions of being written down. Re-measure, always.)*
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

- [x] **0. Owner approval of this plan** (rule 3) — ✅ *"i confirm"*, 2026-09-14 (4). Ticked
  2026-09-15 to stop this box contradicting the Resume point, which has said "steps 0-3 done"
  since that session. ⚠️ **The question inside it is still not answered in words** and is
  repeated in Risks: **step 6 deletes 6 lines of**
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
- [x] **4. `notificationRouting`, driver app.** ✅ **DONE 2026-09-15.** `utils/notificationRouting.test.ts`,
  **25 tests**. **Measured first, and it changed the work:** the two modules' park/flush halves
  differ ONLY in comments (compared with `git show HEAD:` per step 2's gotcha), so that half is
  the same behaviour and was copied — but the two routing tables **share not one push type**, so
  the table half is written from the driver's source: `passenger_join_request` /
  `passenger_cancelled` → `OfferPassengers` (fallback `OffersList`); the four own-bid outcomes →
  `MyJoinRequests` **with no params**; `passenger_offer_updated` → `PassengerOfferDetails`
  (fallback **`MyJoinRequests`, not `OffersList`** — the two branches have different fallbacks,
  asserted so). The trap is pinned in mirror image: here `offer_id` is the driver's own
  DriverOffer in the join payloads and the PASSENGER's PassengerOffer in `passenger_offer_updated`.
  Also asserted: a **user-app** push type (`join_confirmed`) must NOT resolve here — it falls to
  `Notifications`. **All five route names verified registered** in `MainNavigator` / `MainTabs`
  before being pinned (`OffersList` is a tab; the navigator's own comment says `navigate` still
  bubbles to it).
  **Prove red — FOUR mutations, red set PREDICTED before each run, and all four matched exactly:**
  ⓐ the flush's `pendingTarget = target` removed (the literal T-047 bug) → predicted 5, got the
  same 5 (the whole T-047 block); ⓑ `clearPendingNotification` not resetting `flushAttempts` →
  predicted 1, got "does not charge one target's failures"; ⓒ the success path not resetting it →
  predicted 1, got "resets the budget"; ⓓ `passenger_offer_updated` pointed at `OfferPassengers`
  (the trap itself) → predicted 3, got the trap test plus the two T-047 tests that deliver that
  target. All reverted; `git status` shows only the new test file.
  Baselines after: driver `tsc` **28**, lint **0 / 275**, suite **88 Jest + 11 checkers** (was 63).
  User app untouched and re-measured anyway: **76 + 11**, `tsc` **6**.
- [x] **5. `errorHandler`, both apps.** ✅ **DONE 2026-09-15.** `utils/errorHandler.test.ts` in both:
  **user 50 tests, driver 57.** Pinned: the `ApiError` shape itself (status + data + the
  hand-built `.response`, and its message precedence); `handleBackendError` reading **both**
  `.response.status` and a plain `.status` — the read whose absence made the whole switch dead
  code; 400 / 409 / 422 / 429 / the 5xx group / the default branch's `default: server` join; the
  three network branches; the toast and its `showToastNotification: false` suppression;
  `getRetryAfterSec`'s two shapes and its `Math.ceil`; `getErrorMessage`'s **T-115 code-beats-
  sentence** rule *including the miss test* (`t(key) !== key`, or the user reads
  `errors.codes.WHATEVER`); `isNetworkError` / `isAuthError`; `parseValidationErrors` in both
  array and object form.
  **The 59 lines of drift are NOT stale-twin rot** — measured before writing: the driver's copy is
  the richer one, and both differences are the T-061 fix that this app needed and the user app did
  not (`parseValidationErrors` reading `.data.errors` too, plus `getFieldErrors` and
  `displayValidationErrors`, used by five driver document screens). The user app has no live bug
  from lacking them: every thrower there is an `ApiError` (which always sets `.response`) or a
  bare `new Error` with no fields at all, and its two callers never gated on 422. **Each file
  documents the other**, so whichever is read first says the same thing.
  **Prove red — 3 mutations user (4+1+1 red), 4 driver (4+1+1+1 red), every red set predicted
  correctly except one, below. All reverted.**
  🔴 **A REAL DEFECT, FOUND AND BOARDED AS T-123, NOT FIXED** (the card's own rule): a **timed-out
  OTP send is not recognised as a timeout, in BOTH apps**. The branch matches the substring
  `timeout`; every module throws *"Request timeout…"* except `api/auth.ts`, which throws
  *"Request timed **out**…"*. So the first screen every new install sees answers a dropped
  connection with a generic "could not send the code", and `isNetworkError` returns `false`.
  **Two tests pin the wrong-but-real behaviour on purpose and are written to go RED when T-123 is
  fixed** — flip them then, do not delete them.
  🔴 **The one missed prediction, and it was a defect in MY test:** mutating
  `if (err.field && err.message)` → `if (err.field)` reddened **nothing**. Cause: **`toEqual`
  ignores `undefined` properties**, so `{firstName: undefined, email:'Bad'}` compares equal to
  `{email:'Bad'}`. Switched every `parseValidationErrors` assertion to **`toStrictEqual`**; the
  same mutation then reddened exactly the one predicted test. *Same shape as step 3's finding: a
  mutation that reddens fewer tests than predicted is a finding about the tests.*
  🔴 **The post-step re-measure earned its keep again: driver `tsc` read 30 against a baseline of
  28.** Both errors were mine — `beforeEach(() => jest.useFakeTimers())` returns the `Jest` object
  from a hook typed `void`. A concise arrow body returns it; braces do not. **A fully green Jest
  run hid both**, because Jest strips types without checking them. Fixed in the test file, not
  rebaselined. Baselines after: user `tsc` **6** / lint **0 · 208** / **126 Jest + 11 checkers**
  (was 76) · driver `tsc` **28** / lint **0 · 275** / **145 + 11** (was 88).
- [x] **6. `date`, user app — the dead block.** ✅ **DONE 2026-09-15.** The owner said `next` to the
  direct question, so the deletion went ahead as recommended.
  🟢 **THE USER `tsc` BASELINE IS NOW 5, DOWN FROM 6** — the one baseline move this card allows.
  The deleted block *was* the 6th error: `utils/date.ts(97,7) TS2367, "this comparison appears to
  be unintentional because the types '"en" | "ru"' and '"uz"' have no overlap"`. The compiler had
  already narrowed `language` past `'uz'` at the first copy's `return`, which is the same fact as
  "unreachable", stated in type language.
  **It was 9 lines, not the 6 the plan estimated** — the card counted only the `if` block, but the
  block was preceded by a duplicated `// For other languages, use locale formatting` comment
  belonging to the code *after* it. Deleting only the 6 would have left two identical comments
  stranded around a blank line. Nothing else in the file changed: `git diff` reads
  `1 file changed, 9 deletions(-)`.
  **Then tested: `utils/date.test.ts`, 29 tests**, covering every branch either side of the cut —
  all 12 uz short and long month names, the zero-padded clock, the `format`/`language` defaults,
  the string-or-Date input, `formatDateTime`, `formatTime`, `getRelativeTime` (including the
  singular arms and the 7-day cut-off), `isToday` and `calculateDuration`.
  **How the assertions split, which is the part worth copying:** uz is asserted **exactly**
  (our own pure JS, identical on every machine); ru/en are asserted through a **spy on the
  `toLocale*` methods**, checking the locale and options *we* pass and never the text ICU
  returns — Node 22 renders `ru-RU` as `5 мар. 2026 г.` and Hermes on a phone need not agree, and
  neither is a decision this codebase made. The spy also reaches the otherwise-unreachable
  `catch` fallbacks by making the locale call throw.
  ⚠️ Every fixture uses `new Date(y, m, d, …)`, never an ISO string with a `Z` — the function
  reads local-time getters, so a `Z` fixture would pass here and fail on CI at UTC.
  **Prove red — 4 mutations:** ⓐ `'ru-RU'` → `'en-US'` in the locale map → predicted 4, got 4;
  ⓑ `hour12: language === 'en'` → `true` → predicted 2, **got 1** (my prediction was imprecise,
  not the test: I changed only the `try` branch, and the `catch` fallback carries its own copy —
  so the two branches are pinned independently, which is right); ⓒ the `!== 1` plural arm →
  predicted 1, got it; ⓓ `uzMonthsShort[2]` broken → predicted 5, got 5, **including the
  deletion-guard test**, which is what proves that guard bites.
  🔴 **`git checkout` CANNOT be used to revert a mutation in this step** — it would restore the
  deleted block along with it. A golden copy in the scratchpad was the revert instead. Anything
  that mutates a file this card has legitimately changed has the same problem.
  🔴 **The re-measure caught three `tsc` errors of my own again**, and a green Jest run hid all
  three: `it.each([...] as const)` makes every row its own tuple type, and the callback's widened
  parameters are not assignable to that union. Fixed with typed tables
  (`const localeCases: [Language, string][]`), not rebaselined. **Third session running that the
  post-step `tsc` has found a defect in the new test file.**
  🔴 **Checked the driver's `date.ts` FIRST, and it is not a twin at all** — no manual Uzbek
  mapping anywhere, a `formatDate` that takes no `language`, an exported `getLocaleFromLanguage`,
  and three `*ByLanguage` functions this app has not got. **The duplication is user-only.** Step 7
  is therefore a genuinely different test, not a copy.
  Baselines after: user `tsc` **5** / lint **0 · 208** / **155 Jest + 11 checkers** (was 126) ·
  driver unchanged at **28** / **145 + 11**.
- [x] **7. `date`, driver app.** ✅ **DONE 2026-09-15.** `utils/date.test.ts`, **33 tests**, and it
  confirmed step 6's finding: **this is not the user app's module and had nothing to delete.** No
  manual Uzbek mapping (it delegates every character to ICU), `formatDate` takes no `language`,
  `getLocaleFromLanguage` is exported, and three extras — `formatDateTime`, `formatDateByLanguage`,
  `formatTimeByLanguage` — **all default to `'uz'` where every user-app equivalent defaults to
  `'en'`**. That default is pinned in its own test: copying a call site between the apps silently
  changes the language it renders in.
  🔴 **Counted the callers before deciding what the tests were worth, and only THREE of the eight
  exports are reachable from the running app:** `formatDateTime` (7 importers),
  `formatDateByLanguage` (3), `formatTimeByLanguage` (2). The other five are dead —
  `getRelativeTime`, `isToday`, `calculateDuration` and the exported `getLocaleFromLanguage` have
  no callers at all, and `formatDate` / `formatTime` are imported only by
  `components/cards/RideCard.tsx`, **which nothing imports and no barrel exports**. All are tested
  anyway (they are cheap and may yet be wired up), but each `describe` says which group it is in,
  so a future failure reads as "always wrong" rather than "a driver is seeing this".
  📌 **That orphan defuses what would otherwise be a real bug:** `formatDate` and `formatTime`
  **ignore the app's language and hardcode `en-US`**, so a Russian-speaking driver would read
  `Mar 5, 2026` and a 12-hour `02:30 PM` — while `formatTimeByLanguage` deliberately forces
  `hour12: false`. The same app would show both clocks. **Not boarded**: it reaches nobody today,
  and the fix is really "delete the orphan or wire it up", which is a judgement for the owner.
  📌 **Also pinned, not fixed:** this app's `formatDateTime` has **no try/catch**, where the user
  app's identical call retries in `en-US`. On a device without full ICU this throws inside render.
  Not reproduced on a device, so a note rather than a card.
  **Assertions are spy-based throughout** — with no manual mapping here, every output belongs to
  ICU rather than to us, so the tests hold the locale and option bags we pass and never the
  rendered text. `getLocaleFromLanguage` is the exception and is asserted exactly.
  **Prove red — 4 mutations, all four red sets predicted correctly:** ⓐ `ru: 'ru-RU'` → `'en-US'`
  → 5; ⓑ `hour12: false` → `true` in `formatTimeByLanguage` → 3; ⓒ the `'uz'` default → `'en'` →
  1; ⓓ `hour` dropped from the long date → 1. All reverted.
  🟢 **First step this card with NO `tsc` errors of its own** — typed `it.each` tables and braces
  in the hooks from the start, both lessons from steps 5 and 6. Baselines after: driver `tsc` **28**
  / lint **0 · 275** / **178 Jest + 11 checkers** (was 145) · user unchanged at **5** / **155 + 11**.
- [x] **8. Tier 2, both apps: `contactPhone`, `format`, `pendingOtp`, `validation` — plus
  `pushEvents`, which the Resume point left as an open question and which earned its place.**
  ✅ **DONE: the ten files were WRITTEN 2026-09-15, the PROOF was owed and was finished
  2026-09-18.** Per app: `contactPhone` 15, `format` 16, `pendingOtp` 15, `pushEvents` 23,
  `validation` **user 28 / driver 31**. **User +97, driver +100.**
  🔴 **THE SESSION THAT WROTE THEM ENDED WITHOUT TICKING THIS BOX, WITHOUT A SESSION NOTE AND
  WITHOUT ONE MUTATION RECORDED.** A fresh session on 2026-09-18 found ten green, *unproven* test
  files and a Resume point that still said "next is step 8". **A test that has never been red
  proves nothing**, so the whole ritual was run now: **18 mutations, 17 red sets predicted
  exactly, 1 UNDER-predicted, none over-predicted.** Every one reverted; `git status` at the end
  is byte-for-byte what it was at the start of the session.
  **The mutations, per module (same two or three re-proved in the second app, never assumed):**
  - **`contactPhone`** — ⓐ **the T-056 gate re-added** (`canOpenURL` before `openURL` in
    `dialPhone`) → predicted 1, got 1: *"🔴 NEVER calls canOpenURL"*. `openEmail`'s twin guard
    stayed green, which is exactly what shows the two are pinned **independently**. ⓑ
    `digits.length === 12` → `>= 12` → 1: the 13-digit case in *"returns anything that is not a
    12-digit 998 number untouched"*.
  - **`format`** — ⓐ `Math.round(Number(num))` → `Number(num)` → predicted 2, got 2: the
    **pg-string** test (`'1234567.89'` → `1 234 567.89`) and *"rounds rather than truncates"*.
    ⓑ the `Number.isFinite` guard returning `String(num)` instead of `''` → 1.
  - **`pendingOtp`** — ⓐ **TTL 30 min → 60 min** → predicted 2, got 2: *"refuses one from just
    outside it"* and the delete guard. ⓑ the stale record **ignored rather than deleted**
    (`removeItem` → `void 0`) → 1, and only the guard that exists for it.
  - **`pushEvents`** — ⓐ **`'otp'` added to `RIDE_DATA_PUSH_TYPES`**, the one rule the file is
    written around → **predicted 4, got 5**. ⓑ unsubscribe deleting `listener` instead of
    `wrapped` → 1: *"unsubscribes correctly even though the filter wraps the listener"* (the
    unfiltered case is `wrapped === listener`, so it cannot catch this — the filtered one can).
    ⓒ the per-subscriber type filter dropped → 2.
  - **`validation`, user** — ⓐ phone floor 10 → 9 → 1. ⓑ `isValid: errors.length === 0` → `>= 0`
    → predicted 5, got 5: the summary test plus **all four parameterised rule rows**. ⓒ
    `minLength`'s inclusive boundary → 1.
  - **`validation`, driver** (a different module, not a copy) — ⓐ phone floor 9 → 10 → 1. ⓑ **the
    per-field `break` removed** → 1. ⓒ the `email` rule's `value &&` guard dropped → 1: the
    *"optional by accident"* row. ⓓ `isValidDate`'s real-calendar check → `true` → 1: *"rejects a
    day that does not exist in that month"* (the range check still catches day 32, so only the
    calendar test moves).
  🔴 **THE ONE MISSED PREDICTION, AND IT IS THE OPPOSITE OF STEP 3's AND STEP 5's:** `pushEvents`
  ⓐ reddened a **fifth** test I had not predicted — *"still cannot be woken by a type the module
  filters out globally"*, a belt-and-braces test asserting `notifyPushReceived` drops `otp`
  **before** the per-listener filter is consulted. **More reds than predicted is a finding about
  the prediction; FEWER is a finding about the tests.** Only the second kind means a test is fake
  green. Both directions are worth writing down, and only predicting first reveals either.
  📌 **`pushEvents` earned the ninth file** (the question the Resume point left open): its list is
  the single place a future hand could reload every screen underneath someone typing an OTP, and
  mutation ⓐ shows five tests standing on that one rule.
  📌 **Evidence that ONE file was partly proved on 09-15 before the session ended:** the driver
  `validation.test.ts` carries a comment recording that deleting the `break` *"left all 31 tests
  green until this fixture was rewritten"* — a real prove-red round that hardened the fixture.
  Nothing else carried any such record, which is why all eighteen were run rather than trusted.
  ⚠️ **Revert was a scratchpad golden copy per file, never `git checkout`** — step 2's
  `core.autocrlf` gotcha and step 6's deleted block make a checkout the wrong instrument. The
  ritual is scripted at `scratchpad/mutate.sh`, which refuses a `sed` expression that matches
  nothing (a mutation that changes no byte proves nothing) and re-checks `git status` after
  restoring. Baselines after: user `tsc` **5** / lint **0 · 208** · driver **28** / **0 · 275**.
- [x] **9. Close.** ✅ **DONE 2026-09-18.**
  **All six baselines re-measured, every one unchanged:** user `tsc` **5** / lint **0 · 208** /
  raw colours **1** · driver `tsc` **28** / **0 · 275** / **3** (the colour ceilings are enforced
  by `check-design-tokens.mjs`, which is inside the 11 green checkers). **The ten new files add
  no `tsc` error and no lint warning** — measured, not assumed, because that is the defect the
  last three sessions each found in their own test files.
  **Both suites green: user 252 Jest (15 files) + 11 checkers · driver 278 (16) + 11.** The API is
  untouched at 357. **Project total: 530 app tests, up from 80 when T-118 closed.**
  **Docs:** `CLAUDE.md` §1 (the stale "34 + 46 tests" was T-118's number, two cards old) and
  `ARCHITECTURE.md`'s Tests & CI row; `docs/TODO.md` (T-121 → Done) and `docs/JOURNAL.md`.
  **Boarded, not fixed: T-124** — three dead util halves that would misbehave the moment anyone
  wired them up (below, and on the board).

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

### 2026-09-15 — step 4 done

- **`notificationRouting` in the driver app: 25 tests, four mutations, all four red sets predicted
  correctly before running.** Driver Jest total 63 → **88**; all six baselines unchanged.
- **Measuring before writing paid again.** The park/flush half turned out comment-identical to the
  user app's (so: copy), while the routing tables share **zero** push types (so: write from
  source). Two things the copy would have got wrong: `MyJoinRequests` takes **no params**, and the
  module's **two branches have different fallbacks** (`OffersList` vs `MyJoinRequests`). Both are
  now assertions, as is "a user-app push type must not resolve in the driver app".
- 📌 **Correction to the previous session's Resume point: steps 1-3 ARE committed**, as `d9b7dac`
  ("T-121 steps 1-3"). The owner committed after that note was written. Nothing since.

### 2026-09-15 (2) — step 5 done, and it found the defect the card predicted it would

- **`errorHandler` in both apps: 107 tests (user 50, driver 57), 7 mutations, all reverted.**
  Totals: user 76 → **126**, driver 88 → **145**.
- 🔴 **T-123 boarded** — a timed-out OTP send is not recognised as a timeout, **in both apps**,
  because `api/auth.ts` throws *"Request timed out"* while the check looks for *"timeout"*. The
  card said `errorHandler` was one of the two utils most likely to prove a real defect, and it
  did. **Recorded and boarded, not fixed** — and two tests deliberately pin the wrong behaviour so
  they go red when someone fixes it.
- **The 59-line drift turned out to be legitimate**, not rot: it is the T-061 fix, which the
  driver app needed (five document screens gating on `statusCode === 422`) and the user app never
  did. Worth saying because this project's most-repeated defect is assuming the opposite.
- 🔴 **Two more lessons, both about the tests rather than the app:**
  **`toEqual` ignores `undefined` properties** — it let a mutation through green, and
  `toStrictEqual` is what catches it. And **`beforeEach(() => jest.useFakeTimers())` costs two
  `tsc` errors** that a green Jest run hides completely: the concise arrow body returns the `Jest`
  object into a `void` hook. Use braces. *Both were caught only by the rituals — predicting the
  red set, and re-measuring after the step.*

### 2026-09-15 (3) — step 6 done: the deletion, and the baseline drop

- 🟢 **The user `tsc` baseline is 6 → 5**, the card's one permitted baseline move. The dead block
  in `user-app-standalone/utils/date.ts` is gone (**9 lines**, not the 6 the plan estimated — the
  extra three were a stranded duplicate comment and its blank line), and **29 tests** prove the
  deletion changed nothing. Owner said `next` to the direct question; deletion went ahead.
- 🔴 **The driver's `date.ts` is NOT a twin** — checked before touching anything, because walking
  past the twin is this project's most repeated defect. It has no Uzbek mapping at all and three
  exports the user app lacks. Step 7 is a different test, not a copy.
- 🔴 **Third session running, the post-step `tsc` found errors in my own new test file** — this
  time three, from `it.each([...] as const)`: each row becomes its own tuple type and the
  callback's widened parameters will not assign to the union. **Typed tables instead**
  (`const cases: [Language, string][]`). A fully green Jest run hid all three, again.
- ⚠️ **`git checkout` is no longer a safe revert in this card.** It restores the deleted block
  along with the mutation. Step 6 used a golden copy in the scratchpad; any later step that
  mutates a file this card has legitimately changed must do the same.
- **A testing decision worth reusing:** pin *our* decisions, not ICU's output. Uzbek is asserted
  exactly (pure JS, deterministic everywhere); ru/en are asserted through a spy on the `toLocale*`
  methods — locale and options in, never the rendered text out. Node renders `ru-RU` as
  `5 мар. 2026 г.`; a phone need not agree, and neither is ours to pin. The same spy is what
  reaches the `catch` fallbacks, which nothing else can.

### 2026-09-15 (4) — step 7 done

- **`date` in the driver app: 33 tests, 4 mutations, all four red sets predicted correctly.**
  Driver 145 → **178**. **First step with no `tsc` errors of my own** — the typed-table and
  braces-in-hooks lessons applied from the start rather than discovered by the re-measure.
- 🔴 **Counting callers changed what the file says.** Only **three of the eight exports** are
  reachable from the running app; `formatDate` and `formatTime` are imported solely by
  `components/cards/RideCard.tsx`, **an orphan nothing imports**. Each `describe` is labelled LIVE
  or DEAD so a future failure can be read correctly. Worth doing everywhere: "is this code even
  reached?" is a cheaper question than any test and it changes what the test means.
- 📌 **Two things pinned and deliberately not fixed:** `formatDate`/`formatTime` hardcode `en-US`
  and ignore the app's language (harmless only because their one caller is an orphan — the same
  app would otherwise show both a 12- and a 24-hour clock); and this app's `formatDateTime` has
  **no try/catch** where the user app's identical call retries in `en-US`. Neither reaches a user
  today. **Raised for the owner rather than boarded** — the fix for the first is "delete the
  orphan or wire it up", which is not mine to decide.

### 2026-09-18 — steps 8 and 9 done; T-121 is CLOSED

- **The session opened on a contradiction, and that is the lesson of the day.** The Resume point
  said *"next is step 8"*; the working tree already held **all ten of step 8's test files, green**
  — written 09-15 and then abandoned mid-ritual, with **no tick, no session note and no mutation
  recorded**. *(Third time this project has caught a plan file disagreeing with reality — see the
  board rot note at the top and T-122. **Measure the tree; do not trust the prose, including
  mine.**)*
- **Ten green files with no proof are not ten passing tests.** All **18 mutations** were run now:
  17 red sets predicted exactly, one under-predicted, **none over-predicted**. Full record in
  step 8. **User 155 → 252, driver 178 → 278.**
- 🔴 **A NEW EDGE ON AN OLD RULE.** Steps 3 and 5 learned that *fewer* reds than predicted is a
  finding about the tests (a fake-green assertion). Today `pushEvents` ⓐ produced **one MORE** red
  than predicted — a belt-and-braces test proving the global `otp` filter runs *before* the
  per-listener one. **More than predicted is a finding about the prediction; fewer is a finding
  about the tests.** Only the second kind is a defect, and only predicting first tells them apart.
- 📌 **`pushEvents` earned the ninth file** — the open question in the old Resume point, now
  answered by mutation ⓐ, which reddens five tests standing on the single rule that `otp` must
  never reload a list under someone typing their code.
- 📌 **Three dead util halves, boarded as T-124, not fixed** (the card's own rule): `format.ts`'s
  US-shaped half (`formatPhoneNumber` hands back an Uzbek number **unchanged**), the user app's
  `validation.ts` password/URL predicates (**hardcoded English** messages in an Uzbek UI), and
  `isValidPhone` demanding **≥ 10 digits in the user app and ≥ 9 in the driver app**. All three
  reach nobody today; all three would misbehave the moment someone wired them up. Each is pinned
  from both sides in the tests, so the cleanup has a spec waiting for it.

## Resume point

> **Updated 2026-09-18. T-121 IS COMPLETE — all 9 steps done. Nothing in this card is open.**
> **Steps 1-3 are committed as `d9b7dac`; steps 4-9 are NOT committed** — the commit is proposed
> and waiting for the owner's yes. The working tree holds **15 untracked test files**, **one
> modified runtime file** (`user-app-standalone/utils/date.ts`, 9 deletions, step 6 — the only
> runtime change this card made) and the four memory files.
> **Thirteen test files, 353 tests, every one proven able to fail:** `tokenStore` (17 each),
> `notificationRouting` (25 each), `errorHandler` (user 50 / driver 57), `date` (29 / 33),
> `contactPhone` (15), `format` (16), `pendingOtp` (15), `pushEvents` (23), `validation` (28 / 31).
> 🟢 **ALL SIX BASELINES RE-MEASURED AND HOLDING: user `tsc` 5 / lint 0·208 / colours 1 · driver
> `tsc` 28 / 0·275 / 3.** The 5 is the floor set in step 6 — never upward from here.
> 🟢 **Suites: user 252 Jest + 11 checkers · driver 278 + 11 · API 357.** App tests 80 → **530**.
> **▶️ NEXT: nothing in this card. The next card is the owner's pick** — `docs/TODO.md` *Now* holds
> **T-101** (the design system, step 18 next) and **T-088**'s one code step; the tests raised
> **T-123** (P2, the OTP timeout defect, with two tests written to go red when it is fixed) and
> **T-124** (P3, the dead util halves).
> ⚠️ **T-118's step 12 is still unticked and is not code:** nobody has confirmed the first CI run
> went green on GitHub. It cannot be checked from the Claude shell (no `gh`, network cert-blocked).
> **The owner opens the Actions tab, or it stays unproven.**
> ⚠️ **The rules this card paid for, for whoever writes the next test file:** predict the red set
> **before** running the mutation; `toStrictEqual`, not `toEqual`; typed `it.each` tables, never
> `as const`; braces in `beforeEach`; **run `tsc` as well as `jest`** (three sessions running, the
> re-measure found errors a green suite hid); assert **call counts** on anything retry-shaped,
> because a mock that throws still records the call; and **revert from a scratchpad golden copy,
> never `git checkout`** (`core.autocrlf` rewrites the line endings, and in `date.ts` a checkout
> would restore the block step 6 deleted). The ritual is scripted at `scratchpad/mutate.sh`.

**STATE:** T-118 is done and committed (`7526742`); its plan is preserved at `docs/PLAN-T118.md`
and its **only open item is confirming the first CI run went green on GitHub**. Both apps have a
working Jest setup and a harness. This card added **pure-logic `*.test.ts` files only** — no new
dependency, no harness change, and exactly one runtime file touched (`date.ts`, step 6, approved).

**The measurements that grounded this plan**, kept because they date the drift: user had 4 of 16
screens and ~12 utils untested, driver 4 of 23 and ~12; `contactPhone` / `format` / `pendingOtp` /
`tokenStore` were **byte-identical** across the apps, while `pushEvents` / `errorHandler` /
`notificationRouting` / `validation` / `date` differed by 3 / 59 / 123 / 219 / 201 lines;
`routeForNotification` is module-private and reached through `handleNotificationTap`.
