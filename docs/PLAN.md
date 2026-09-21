# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 📦 **T-102i → `docs/PLAN-T102i.md`** (DONE, `a06614c`; the read side this card is the write side of).
> 📦 **T-114 → `PLAN-T114.md`** — ① done and *Parked*; **② IS THIS CARD.** Its §8 lists ①'s device walk.
> 📦 **T-102 → `docs/PLAN-T102.md`** (§9 = the parent's resume point) · **T-101 → `PLAN-T101.md`**
> (steps 2b, 19-26 open) · **T-116 → `PLAN-T116.md`** · **T-088 → `PLAN-T088-finish.md`** ·
> **T-122 / T-123 / T-121 / T-118** → their own files.

---

## 🔴 BOARD STATE 2026-09-21 — read before starting anything

**`tsc` BASELINES: API 281 · admin 6 (`tsc -b`) · user 3 · driver 19.** Lint 0 errors everywhere;
**warnings API 230 · user 208 · driver 275.** Colour ceilings user 1 · driver 3. **Never raise one.**
**Suites:** **API 391** · **user 278 + 12 checkers** · **driver 295 + 12 checkers**.
**Ratchets that this card can trip:** the API's `i18n/unkeyedErrors.test.ts` (**CEILING 107** English
4xx `AppError`s — a new English 400 RAISES it and goes red) and each app's `check-raw-error-toasts.mjs`.
**Board:** `node scripts/check-board.mjs` → ✓ before starting; *Now* = **T-127 · T-102** (see step 0).
🛑 **The device backlog is long and this card adds to it:** T-102c 1-3, T-102e, T-102i, T-114 ①,
T-115, T-116, T-123, T-088's 401 — **none walked on a phone, and the API is not deployed.**

---

## Task

- **ID / name:** T-127 — **per-scope completeness: each order scope demands the geo depth it
  matches at, and the form says so.**
- **Why now:** owner picked it (2026-09-21). It is the **write side of T-102i**, which shipped the
  read side two days ago: the server now matches a `tuman` / `yaqin` order **at the QFY** — but
  nothing anywhere requires the passenger to give one, so the order matches at a level it may not
  have reached. The blocking decision was already taken by the owner on 2026-09-13.
- **What is wrong today, in one line:** **the form accepts an order the matcher cannot serve** —
  `Tuman ichi` with no QFY, or with its two endpoints in different districts.

### 🔴 What is true today (measured 2026-09-21, read from the code)

1. **`geoMatch.validateScope` has ZERO callers.** Grepped across the whole API: `validateScope`,
   `isScopeValid` and `ScopeProblem` appear only in `geoMatch.ts` and `geoMatch.test.ts`. The rule
   is written, tested (9 assertions) and applied nowhere — the same state `placeHit`'s half was in
   before T-102i gave it readers. **It already encodes exactly the owner's table:**
   `missing_from` / `missing_to` at `matchLevelFor(scope)` · `different_province` (viloyat) ·
   `different_district` (tuman) · `same_district` (yaqin).
2. **The form demands province + district and nothing else, for all four scopes.**
   `CreatePassengerOfferScreen.tsx:566-571` — *"Province + city/district are required; settlement
   and landmark are not"*. So `Tuman ichi` submits with no QFY, and `T-102i`'s adm3 branch then
   silently falls back to the district for that side.
3. **The API validates the scope's SPELLING and not its content.** `PassengerOfferService`
   (`:517-528`) refuses a `match_scope` that is not one of the four — deliberately, so a typo cannot
   become NULL — and never looks at whether the geo ids satisfy it. The 8 geo id columns are parsed
   (`:480-485`) with no cross-field rule at all.
4. **So the contradiction T-114 recorded is still live**, word for word: *"the Tuman board accepts
   an endpoint with NO QFY, but `validateScope(order,'tuman')` matches at adm3 and refuses it."*
5. **`yaqin` and `aro` are still identical in the form** (`ORDER_SCOPE_GEO`: both `rootLevel: null`,
   `startLevel: 'province'`). `orderScope.ts:72` says so out loud and says **the ONLY difference is
   completeness — this card.**
6. **Three entry points navigate to the form with no scope at all** (`MyOrdersScreen:729`,
   `MyPassengerOffersScreen:589` and `:629`) → they fall back to `aro`, whose demands are exactly
   what the form already enforces. **Unchanged by this card**, but it means the strictest scopes are
   reachable only from the home carousel.
7. **Old orders:** `match_scope` is NULL before 2026-09-13 and those open as `aro`. Orders made
   between 2026-09-13 and today **can carry `tuman` with no QFY** — they are exactly what a new
   server-side rule would lock out of editing. **Risk 1 below; it decides step 2's shape.**
8. **The driver app is not involved.** A driver states a place SET, validated by a different rule
   (`validateOfferPlaces`, which *does* have a caller: `DriverOfferService:548`).

### ✅ Decision ① — how hard does the server refuse? **ANSWERED 2026-09-21: A**

- **A — refuse on create, and on update only when the order would still be incomplete
  (recommended). ← the owner's choice.** The client stops it first; the server is the backstop. An order made before this
  card that is already incomplete **can still be edited** — the rule is applied to the merged row,
  so the passenger fixing the route fixes the order, and a passenger only changing the price is not
  held hostage by geo they cannot see. *Why:* nothing is un-editable, and the rule still cannot be
  bypassed by a client that skips the form.
- **B — refuse on create and on every update, no exception.** Simpler sentence, but an order created
  on 2026-09-14 as `tuman` with no QFY becomes **uneditable** until the passenger re-picks the
  route — including when they only wanted to change the seat count.
- **C — client only, server unchanged.** Cheapest, and it leaves the contradiction in place for any
  caller that is not this form. **Not recommended** — it is what "the rules exist and nothing
  applies them" already cost us twice (T-102i, T-116).

### ✅ Decision ② — what happens when a district has NO QFYs? **ANSWERED 2026-09-21: A**

**The question for the owner, in one line: do all districts in `geo_settlements` have QFY rows, or
are there districts with none?** (Two minutes in the admin panel; I cannot reach the DB.)

- **A — the sheet offers a way out, always (recommended). ← the owner's choice**, taken without
  checking the data first *because it is correct either way*: if no district is empty the row never
  renders, and if one is, nobody is trapped. When the QFY list comes back empty, the
  sheet shows one row: *"Bu tumanda QFY ro'yxati yo'q — tuman bo'yicha davom etish"*, which
  completes the endpoint at the district. The form accepts it and **the strip says that side will
  match at the district, not the QFY.** *Why:* it is correct whichever way the data turns out, the
  passenger is never trapped, and T-102i's loose rule already serves such an order sensibly.
  Costs one sheet change and one more string.
- **B — nothing special; require the QFY unconditionally.** Right **only if** every district really
  has QFYs. If even a handful do not, those districts silently become unorderable for two of the
  four ride types, and it will present as *"the app won't let me order"* with no clue why.
- **C — fix the DATA instead** (populate the missing QFYs), then B. The cleanest end state, but it
  is an owner data job of unknown size and it blocks this card until it is done.

### Goal (definition of "done", for A)

1. **The form demands what the scope matches at.** `Tuman ichi` and `Yaqin` require a **QFY on both
   ends**; `Viloyat ichi` requires **both endpoints in the chosen province**; `Yaqin` requires **two
   DIFFERENT districts**; `Viloyatlar aro` is unchanged. Each failure marks **its own field** and
   says what is missing in the passenger's language.
2. **The MATCH strip:** one line on the form, under the route block, that states in words what this
   scope will match on — *"Tuman ichi: QFY darajasida qidiriladi"* — and turns into the reason when
   something is missing. It is the only place the passenger can learn why the form refuses.
3. **The server refuses the same order** (decision ① A), with a **keyed** message per problem —
   `messageKey` at the throw site, **the 107 ceiling must not rise**.
4. **One rule, two readers, pinned together** — the app's copy and `geoMatch.validateScope` run the
   **same case table**, as T-102i's parity test does for `placeHit` ⇔ `adm3Clauses`.
5. **Every new test proven red; all baselines held** (API 281 / 0·230 · user 3 / 0·208 · driver
   untouched); uz · ru · en for every new string.

### Explicitly OUT of scope

- 🛑 **Adjacency.** `yaqin` will demand *two different districts*, **not two NEIGHBOURING ones** —
  `geo_district_neighbors` is unpopulated and its admin screen is **T-102f**. Demanding real
  adjacency now would refuse every `yaqin` order on the planet.
- 🛑 **T-128** (the driver side, still by text) · **T-102f / T-102h** · **running the backfill**.
- 🛑 **The `aro` / `yaqin` picker difference** — they stay identical in `ORDER_SCOPE_GEO`; T-114 ①
  measured that and it is correct. This card separates them by COMPLETENESS only.
- 🛑 **Any migration.** Every column exists. ❌ No dependency, no `infra/**`.
- 🛑 **Backfilling a scope onto pre-2026-09-13 orders** — inferring one from stored geo is a guess
  (T-114 settled this).

## Approach

- **The API's `validateScope` is the rule; nothing re-decides it.** The service calls it — the
  module gets its first reader, exactly as T-102i did for `placeHit`.
- **The app needs its own copy** (two standalone apps, no shared package — CLAUDE.md), so the
  drift risk is the T-123 / T-116 class. Mitigation, up front rather than discovered: a **shared
  case table** — one list of `(from, to, scope) → problems[]` fixtures written once and run by
  **both** the API test and the app checker, so a rule that changes on one side goes red on the
  other. If the two cannot share a file cleanly, the fallback is the same table duplicated with a
  checker asserting the two copies are identical — decided by measurement in step 1, not now.
- **The strip renders from the rule's output, not from a second `if`** — the same problem list that
  blocks submit writes the sentence.
- **Per-field errors reuse the form's existing `errors` map** (`from_text` / `to_text`), so the
  inline marking and the toast both work with no new plumbing.
- **Prove red on every change**, predictions written before running; revert from a scratchpad
  golden copy.
- ⚠️ **No test here touches Postgres.** Whether a real `tuman` order now refuses on a phone is a
  **device check**, and it is listed as one.

## Steps

- [x] **0a. Board.** ✅ **DONE 2026-09-21.** Owner moved **T-101 → *Next*** (no work in flight; its
  resume point is safe in `PLAN-T101.md`), keeping T-102 beside this card because T-127 sits on its
  rules, its deploy and its device walk. **T-127 *Next* → *Now*, P2 → P1.** One card, one copy —
  both were MOVED, and each carries a dated line saying where it went and why.
  `node scripts/check-board.mjs` → ✓ (129 cards, 2 in *Now*). The T-102 card's pointer was
  repointed to `docs/PLAN-T102i.md`, and that file's resume point — which still read **"NOT
  COMMITTED"** two days after `a06614c` landed — was corrected.
- [x] **0b. Owner approval of this plan (rule 3).** ✅ **APPROVED 2026-09-21** ("ok", after the plan
  was restated in plain language). **Decision ①: option A** — the server refuses on create, and on
  update only when the row would STILL be incomplete. The owner also accepted the two warnings:
  the app will start refusing what it used to accept (they read the new sentences before ship), and
  `yaqin` checks *different* districts, not *adjoining* ones, until T-102f.
- [x] **1. Measure, read-only.** ✅ **DONE 2026-09-21.** Four questions answered, and a fifth found.
  - **The case table, read out of `validateScope` (not invented):**

    | scope | level | from / to each need | cross-field rule | problem |
    |---|---|---|---|---|
    | `aro` | adm2 | `city_id` | — | — |
    | `viloyat` | adm2 | `city_id` | same province | `different_province` |
    | `tuman` | adm3 | `settlement_id` | same district | `different_district` |
    | `yaqin` | adm3 | `settlement_id` | districts must DIFFER | `same_district` |

    Plus `missing_from` / `missing_to` at the scope's own level. ⚠️ Two naming traps to carry into
    the app's copy: `different_province` also fires when a province is **absent** (`a == null ||
    b == null || a !== b`), and `same_district` fires **only when both districts are present** — so
    a half-filled `yaqin` order reports `missing_*`, never `same_district`.
  - **The shared case table WORKS, as JSON, with no bundler involved.** The app's checkers already
    run `esbuild --platform=neutral` over app `.ts` (`check-order-scope-geo.mjs:28-41`) — but the
    fixture needs no bundling at all: both sides are Node, so both `JSON.parse(readFileSync(...))`.
    CI checks out the whole repo and only changes `working-directory`, so a repo-root path resolves
    in CI exactly as locally. **Test-time only — no runtime import crosses a package**, so the apps
    stay standalone in the sense that matters (nothing foreign is bundled into the shipped app).
  - **The strip's place is settled by the layout:** between the `routeCard` and the `timeCard`
    (`CreatePassengerOfferScreen.tsx:1016`), directly under the block it describes. Per-field errors
    already have their plumbing — both `LocationCard`s take `error={errors.from_text|to_text}`.
  - **A keyed 400 does not touch the ratchet.** `unkeyedErrors.test.ts:113` counts a site as `keyed`
    when any argument after the status matches `/messageKey\s*:/`, so
    `new AppError('…', 400, { messageKey: 'offers.…' })` leaves the ceiling at 107. The existing
    pattern to copy is `PassengerOfferService.ts:947`.
  - 🔴 **THE FIFTH THING, WHICH NOBODY WROTE DOWN — demanding a QFY can create a DEAD END.**
    `GeoSheet` opens at `settlement` for `tuman`; if that district has no settlement rows it renders
    `ListEmptyComponent` → *"Ro'yxat bo'sh"* (`GeoSheet.tsx:220`) and offers **no way forward** —
    only Back (blocked: the root card pinned the district) and Close. ~~Today that is survivable
    because the QFY is optional: the passenger closes the sheet and submits the district alone.~~
    🔴 **CORRECTED IN STEP 5 — THAT SENTENCE WAS FALSE, AND I TOLD THE OWNER IT.** `GeoSheet`
    commits an endpoint in exactly two places — `pick` at `endLevel` (`:172`) and the escape this
    card added (`:255`) — and **closing it saves nothing**. So since **2026-09-03**, when
    `LocationCard` moved onto `GeoSheet` with `endLevel="settlement"`, a district with no QFY list
    has been **unorderable in ALL FOUR scopes**, not merely at risk of becoming so. The escape fixes
    all four (`LocationCard` passes it whatever the scope); a test now pins it for `aro` too. I
    reasoned about the sheet instead of reading its commit paths — the exact thing step 1 was for. The form's own comment claims this is common: *"many
    districts have no settlements at all"* (`:565`). **I cannot measure the truth of that from
    here — it is a DB question** → decision ② below. ⚠️ Also noted, not fixed: that empty-state
    string is hardcoded Uzbek (the T-126 class, in the user app).
- [x] **2. Server — `validateScope` gets its first caller.** ✅ **DONE 2026-09-21.**
  **`utils/scopeGuard.ts` (new, pure)** — `scopeVerdict(patch, stored)` answers "refuse, and with
  which sentence"; `PassengerOfferService.assertScopeSatisfied` is now ten lines that throw what it
  returns, called from `buildOfferFields` beside `validateOfferData`. **The scope rules themselves
  were not touched** — `geoMatch.validateScope` is unchanged and finally has a reader.
  ⚠️ **It had to be a `utils/` module, not a private method:** services import Sequelize models and
  this suite covers DB-free code only, so logic left in the service is untestable (the T-102i
  precedent, `groupPlaceRows`). **7 keyed strings × uz/ru/en**, worded with the app's own names
  (*«В районе» · «Tuman ichi» · Mavze / QFY · массив / СГМ*); ratchet **unmoved at 107**.
  🔴 **THE BIGINT TRAP, A SECOND TIME — and this one refuses a CORRECT order.** Every geo id on
  `passenger_offers` is **BIGINT**, which `pg` returns as a **string** (no `setTypeParser` in this
  project), while `parseId` makes the patch's ids numbers. `validateScope` compares with `!==`, so
  `10 !== '10'` would tell a passenger editing a valid *Tuman ichi* order that its two endpoints
  are in different districts. The model's types say `number | null`, so `tsc` sees nothing.
  Normalised in `toGeoId`, in the pure module, fed strings by every update test.
  **Tests +28 (391 → 419)** — `scopeGuard.test.ts` (22) and a **computed-key block in
  `messageKeys.test.ts`** (6).
  🔴 **That block exists because I made a hole and noticed it:** T-116's key checker scans for
  `messageKey: '<literal>'`, and this card's key is **computed** — so the whole family was invisible
  to it and could have gone missing from ru/uz with every test green.
  **Prove red — 7 mutations, 5 exact, and TWO THAT TAUGHT SOMETHING:**
  ⓑ change-by-presence → 1 ✓ · ⓒ the untouched-route exemption dropped → 1 ✓ · ⓓ `match_scope` not
  scope-sensitive → 1 ✓ · ⓔ the level dropped from the key → 10 ✓ · ⓕ one ru key renamed → 1 ✓ ·
  ⓖ problem order reshuffled → 1 ✓.
  🔴 **ⓐ — the BIGINT mutation — came back GREEN, proving my headline test tested nothing.** The
  patch in it carried the *whole* form, so both sides were numbers and the mixed comparison never
  happened. Rewritten to the shape that actually triggers it (**one side edited, the other read
  from the stored row**) → now 2 red. *The test asserted the right outcome and never built the
  condition; only the mutation could show that.*
  🔴 **And `tsc` caught what the green suite hid** (the `ubexgo-verification-habits` lesson, exactly
  as written): the API's `ORDER_SCOPES` is a list of **strings** while the user app's is a list of
  **objects with `.key`** — same name, two shapes. My `s.key` was `undefined`, `matchLevelFor`
  answered `'adm2'`, so **every computed key came out adm2 and the adm3 half was never checked**.
  Suite green, `tsc` 282. Fixed, and the block now asserts both levels appear.
  ⚠️ **Also self-inflicted and repaired:** a PowerShell `Set-Content -Encoding utf8` restore added a
  **BOM and rewrote every line ending** in `ru.ts` (569-line diff for 7 keys). Restored from git and
  re-applied with the editor — the three locale diffs are now **+15 / +15 / +20, zero deletions**.
  **After:** `tsc` **281** · lint **0 / 230** · `npm test` **419/419**.
- [x] **3. App — the rule, the form, the strip.** ✅ **DONE 2026-09-21.**
  **`utils/scopeCompleteness.ts`** (pure, no react-native — the `scopeRoot.ts` precedent), deriving
  the level from `ORDER_SCOPES` rather than re-listing it; `validateForm` marks **per field**
  (relational problems mark BOTH — neither endpoint is wrong alone); the **MATCH strip** renders
  under the route. **10 strings × uz/ru/en**, scopes named as the MENU names them.
  ✅ **The shared case table is real:** `shared/scope-cases.json`, **17 cases**, executed by
  **both** `check-scope-completeness.mjs` and the API's `scopeGuard.test.ts` — change a branch on
  either side and the other goes red. Test-time only; nothing crosses a package at runtime.
  ✅ **Decision ② built:** `GeoSheet` offers a way out when the deepest level's list is genuinely
  empty (never for a search that found nothing), `LocationValue` records `settlementUnavailable`,
  and the claim rides to the server as `from_/to_settlement_unavailable` — **a request-only claim,
  not a column** (`scopeGuard.relaxUnavailable`). It relaxes ONLY `missing_*` at adm3 and only for
  the side that made it: never a contradiction, never a missing district.
  🔴 **What step 1 could not see, and only writing the tests revealed: the create path CANNOT
  express an incomplete endpoint.** `GeoSheet` commits only on reaching `endLevel`, so an endpoint
  either arrives complete or is never set. The client-side rule therefore guards **the EDIT path**
  — an order created 2026-09-13…09-21 with no QFY — and the empty-list case. Written down in the
  test file so the next reader does not "fix" an untested create-path branch that cannot happen.
  **Tests +6 (278 → 284)** · **checker 119 assertions** (13 checkers now).
  **Prove red — 6 mutations, ALL red, 3 counts off:** ⓗ escape never relaxes → jest 1 (predicted 2
  — "offers a way out" never submits) + checker RED · ⓘ strip never admits the shallower match →
  1 + RED ✓ · ⓙ every scope at adm2 → jest 3 (predicted 2 — it also breaks the edit-path refusal)
  + RED · ⓚ picker stops reporting WHY → 2 ✓ · ⓛ escape row never rendered → jest 2 (predicted 3 —
  the "populated district" case asserts absence, so it survives) · ⓜ form drops the rule → 1 ✓.
  ⚠️ **Two test-authoring traps cost real time and are written into the test file:** a completed
  endpoint renders its province on its own line, and **RNTL matches a button by its TEXT as well as
  its label**, so "press Fargona viloyati" was ambiguous between the finished card and the open
  sheet — and each `LocationCard` keeps its own `GeoSheet` MOUNTED when closed, so stale rows stay
  in the tree. Both surfaced as *"Unable to find Rishton"* several steps later. Resolved by giving
  the two endpoints different provinces, which is also the owner's own `yaqin` example.
  **After:** user `tsc` **3** · lint **0 / 208** · **284** Jest + **13** checkers · API **442** ·
  API `tsc` **281** · **driver app untouched**.
- [x] **4. Measure.** ✅ **DONE 2026-09-21 — every number predicted, every number exact.**
  API `tsc` 281 · lint 0/230 · 442 · ceiling 107 ✓ · user `tsc` 3 · lint 0/208 · 284 · 13 checkers ·
  colour 1 ✓ · driver **0 files changed**, `tsc` 19 · lint 0/275 · 295 + 12 ✓.
  ⚠️ **One defect of my own, found by re-reading rather than by any check:**
  `check-scope-completeness.mjs` bundled the three locales separately and **never deleted them**
  (`node_modules/.cache/scope-{uz,ru,en}.mjs`), while every sibling checker removes its bundles.
  Harmless (gitignored) but the odd one out — rewritten to the house idiom (one bundle of
  `translations/index.ts`, removed at once, as `check-order-scope-geo.mjs:243` does). **Re-proven
  after the change:** still 119 assertions, nothing left in the cache, and **red (2) with
  `scopeMatchAt_adm3` renamed in ru** — both QFY-level scopes share that line. Restored with
  `File.WriteAllText` this time; `ru.ts` stayed at exactly +23 / −0.
  **Predicted 2026-09-21, written before running:** API `tsc` **281** · lint **0 / 230** · **442** ·
  English-4xx ceiling **107** (every new throw is keyed) · user `tsc` **3** · lint **0 / 208** ·
  Jest **284** · **13** checkers · colour ceiling **1** (the strip uses a token) · driver: **no file
  in `git status`**, `tsc` **19** · lint **0 / 275** · **295 + 12** — unchanged because nothing in
  it was touched and `shared/` has no driver-app reader.
- [x] **5. Close.** ✅ **DONE 2026-09-21 — except the commit, which waits on open question ⑥.**
  `PLAN-T114.md` §8 (② built) · T-127's card (stays in *Now* until ⑥ is answered — it could still
  mean code) · T-114's and T-102's cards · `CHECKLIST.md` §3 (a stale line rewritten + 6 walks) ·
  `CLAUDE.md` (counts; the computed-key blind spot; **`shared/`**; **BIGINT as a §5 gotcha** — two
  cards running) · `ARCHITECTURE.md` (Place-matching row, Tests row, the folder map gains `shared/`)
  · JOURNAL.
  🔴 **Closing found two things, and one of them was my own mistake:**
  ① **Step 1's "survivable today" was false** — reading `GeoSheet`'s commit paths (not reasoning
  about them) showed a district with no QFY list has been **unorderable in all four scopes since
  2026-09-03**. The escape already fixed all four; **a test now pins it for `aro`** (15 screen tests;
  mutation ⓛ now **3** red, predicted 3). User Jest **284 → 285**; `tsc` 3, lint 0/208.
  ② **The app is stricter than decision ① on an edit** → open question ⑥ below.

## Files to touch

**API:** `services/PassengerOfferService.ts` (the caller) · `utils/geoMatch.ts` **only if** the
shared fixture needs an export (its rules do not change) · their tests
**User app:** `utils/scopeCompleteness.ts` (new + test) · `screens/CreatePassengerOfferScreen.tsx`
(validate + the strip) · `types/orderScope.ts` (the header's "still not wired" note) ·
`translations/{uz,ru,en}.ts` · `scripts/check-scope-completeness.mjs` (new) + `run-checks.mjs`
**Docs:** PLAN · PLAN-T114 · TODO · JOURNAL · CHECKLIST
**NOT touched:** 🛑 the driver app · the admin panel · migrations · dependencies · `infra/**`.

## Risks / open questions

1. ⚠️ **Orders created 2026-09-13 → today can be `tuman` with no QFY** — decision ① is what keeps
   them editable. Whichever way the owner answers, step 2 must have a test for that exact row.
2. ⚠️ **This makes the form STRICTER, which is a real refusal a passenger will meet.** If the strip's
   wording is not clear, the report will be *"the app won't let me order"*. **The three new sentences
   are the owner's to read** (Risk 2 of T-102i, same shape).
3. ⚠️ **`yaqin` demands different districts but cannot check adjacency** — so it will accept two
   districts at opposite ends of the country until T-102f populates the table. Stated, not hidden.
4. 🔴 **Two readers of one rule, in two languages** — the exact class that bit T-123 and T-116. The
   shared case table is the mitigation; if step 1 finds it cannot be shared, that is worth saying
   out loud rather than quietly duplicating.
5. 🛑 **The device backlog.** This is the fourth unwalked card in the same subsystem. A refusal that
   fires wrongly on a phone will be hard to attribute between T-102e, T-102i and this.
6. ✅ **ANSWERED 2026-09-21: KEEP STRICT** — the owner said *"commit"* to the message proposed for
   the strict path. The app keeps asking for the QFY on any save of an incomplete order; the server
   stays lenient on untouched routes. Pinned by the edit-path test.
   ~~❓ **OPEN, FOUND IN STEP 5 — THE APP IS STRICTER THAN DECISION ① ON AN EDIT.**~~ Decision ① was
   put as *"a passenger changing only the price is not held hostage"*, and the **server** honours
   it (`scopeVerdict` skips an update that did not move the route or scope). **The app does not:**
   `validateForm` applies the rule on every save, so editing an old *Tuman ichi* order with no QFY
   and changing only the seats **asks for the QFY first**. That matches this plan's written Goal 1
   (*"the form demands what the scope matches at"*) — which the owner approved — but NOT the plain-
   language summary I gave (*"strict on new orders, lenient on old ones"*). I should have said it.
   - **Keep the app strict (my recommendation).** Nobody can be stuck: a `tuman` sheet opens AT the
     QFY (one tap per end), and a district with no list has the escape. It also cleans up the week
     of orders that asked for QFY precision and could never get it. A client stricter than its
     server is the ordinary shape.
   - **Or mirror the server** — skip the rule in edit mode when the loaded route and scope are
     unchanged (`sameGeo` already exists in the screen). ~10 lines + a test.
   **Needs the owner's answer before commit.** The edit-path test pins today's (strict) behaviour.

## Session notes

### 2026-09-21 — planned, approved, steps 0-3 built

- **The write side of T-102i.** `geoMatch.validateScope` had held the whole rule, tested, with
  **zero callers** since 2026-09-12 — the third rule module in this subsystem found written and
  unapplied. It now has two readers, held together by one case table both suites execute.
- 🔴 **The BIGINT trap, a second time — and worse than the first.** T-102i's version mislabelled
  results; this one would have **refused correct orders**, telling a passenger editing a valid
  *Tuman ichi* order that its endpoints are in different districts. Same root cause (pg returns
  BIGINT as a string, the model's types say `number`), same fix shape (a pure function fed strings
  exactly as pg sends them).
- 🔴 **A test that asserted the right outcome and never built the condition.** The BIGINT mutation
  came back GREEN. The patch in the test carried the whole form, so both sides were numbers and
  the mixed comparison never happened. *Only the mutation could show that* — this is the entire
  argument for the prove-red rule.
- 🔴 **`tsc` caught what the green suite hid**, exactly as `ubexgo-verification-habits` says: the
  API's `ORDER_SCOPES` is strings, the app's is objects. `s.key` was `undefined`, every computed
  key came out `adm2`, and the adm3 half of a whole message family went unchecked.
- 🔴 **I opened a hole in T-116's guard and had to close it:** its key checker scans for
  `messageKey: '<literal>'`, and this card's key is **computed** — the first one in the codebase.
- **Two owner decisions, both taken before code:** ① the server refuses on create and on update
  only when the route or scope actually moved (nothing becomes uneditable); ② the picker offers a
  way out when a district has no QFY list — chosen without checking the data *because it is
  correct either way*.
- ⚠️ **Self-inflicted and repaired:** a PowerShell `Set-Content -Encoding utf8` restore added a BOM
  and rewrote every line ending in `ru.ts`. `ubexgo-verification-habits` already warns about this
  class; it applies to PowerShell restores too, not just the Bash tool.
- **Step 4:** 15 predictions across three projects, 15 exact. Re-reading my own checker found it
  leaving three bundles in the cache where every sibling cleans up — fixed to the house idiom and
  re-proven red.
- **Step 5:** writing the phone checklist forced two corrections — step 1's "survivable" claim
  (false: the dead end predates this card and hit every scope) and an unstated gap between the
  app and decision ① (open question ⑥). *A checklist written for a person is a stricter reader
  than a plan written for myself.*

## Resume point

> **Updated 2026-09-21. T-127 IS COMPLETE — steps 0-5, ⑥ answered (keep strict), COMMITTED** as
> *"T-127: each ride type demands the depth it searches on"* (`git log --grep T-127` — the hash is
> not written here because this line is part of that commit). **T-127 → *Parked*.**
> 🛑 **Nothing is left for Claude on this card.** The owner: deploy the API, rebuild the user app,
> walk `CHECKLIST.md` §3 (six T-127 walks).
> **▶️ NEXT: the owner's pick.** Natural follow-ons: **T-128** (drivers find orders by ids, not typed
> text — the same rules with the roles swapped) · **T-102f** (the neighbours admin screen, which is
> what would let *Yaqin* check that districts actually ADJOIN) · **T-126** (driver app hardcoded
> Uzbek). `/new-task` moves this file to `docs/PLAN-T127.md` first.
> 🟢 **API `tsc` 281 · lint 0/230 · 442** (391 + 51) · **user `tsc` 3 · lint 0/208 · 285 + 13
> checkers** · **driver app untouched.** No migration, no dependency, `infra/**` untouched.
> **What works now:** an order must reach the depth its ride type matches at — a QFY on both ends
> for *Tuman ichi* / *Yaqin hududlar*, one province for *Viloyat ichi*, two different districts for
> *Yaqin*; the form says which level it will be searched on and marks the offending field; a
> district with **no QFY list** offers a way out and then says it is matched at the district; the
> server refuses the same order in the passenger's language, and on an edit only when the route or
> the ride type actually moved.
> ⚠️ **Also fixed, and worth saying to anyone walking it:** a district with **no QFY list** has
> been unorderable in ALL four ride types since 2026-09-03; the picker's new escape fixes that too.
> 🛑 **Still device-unwalked, and this card adds to the queue** — `CHECKLIST.md` §3 (six T-127
> walks) and §5. **Needs the API deploy + a user-app rebuild.**
>
> **--- history below, still true ---**
> ✅ **0a** T-101 → *Next*, T-127 → *Now* (P1), `check-board` ✓. **0b** plan approved ("ok").
> ✅ **① answered: A** — refuse on create; on update only when the row would still be incomplete.
> ✅ **1 (measure) done** — the case table is read out of `validateScope`; the shared fixture works
> as repo-root JSON (both sides are Node, test-time only, CI-safe); the strip goes between the route
> card and the time card; a keyed 400 leaves the 107 ceiling alone.
> 🛑 **▶️ BLOCKED ON DECISION ② — do not start step 3 without it.** Step 1 found that requiring a QFY
> can make a district **unorderable**: `GeoSheet` opens at `settlement`, and a district with no
> settlement rows renders *"Ro'yxat bo'sh"* with no way forward (Back is pinned by the root card).
> Harmless today because the QFY is optional; a dead end the moment this card lands.
> **The owner's question: do all districts have QFY rows?** Recommended regardless: **A** — the
> sheet offers *"no QFY list here — continue with the district"*, and the strip says that side
> matches at the district.
> **Step 2 (server) is NOT blocked by ②** and can start as soon as the owner answers or defers it.
> 🟢 Baselines to hold: **API `tsc` 281 · lint 0/230 · 391 · user 3 · 0/208 · 278 + 12 · driver
> untouched.** ⚠️ English-4xx ceiling **107**, may only fall.
> **What this card is:** the write side of T-102i. The server matches a `tuman` / `yaqin` order at
> the QFY; nothing requires the passenger to give one. `geoMatch.validateScope` already holds the
> whole rule and **has zero callers** — this card gives it two, and holds them together with one
> shared case table.
> 🟢 Baselines to hold: **API `tsc` 281 · lint 0/230 · 391 · user 3 · 0/208 · 278 + 12 · driver
> untouched.** ⚠️ The API's English-4xx **ceiling is 107 and must not rise** — a new 400 here needs
> a `messageKey`.
