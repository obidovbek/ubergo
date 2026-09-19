# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 📦 **T-116 → `docs/PLAN-T116.md`** (DONE, `cba0be1`; needs the API deploy + both rebuilds).
> 📦 **T-088 → `PLAN-T088-finish.md`** (DONE, `db8e17d`, *Parked*: the owner's four actions) ·
> **T-122 → `PLAN-T122.md`** · **T-123 → `PLAN-T123.md`** · **T-121 / T-118** → their files.
> 📦 **T-102 → `docs/PLAN-T102.md`** — the parent of this step; its §9 is the whole card's resume
> point. **This file is T-102i only.** · **T-114 → `PLAN-T114.md`** (① done, *Parked*; ② = T-127).
> 📦 **T-101 → `PLAN-T101.md`** (steps 2b, 19-26 open).

---

## 🔴 BOARD STATE 2026-09-19 — read before starting anything

**`tsc` BASELINES: API 281 · admin 6 (`tsc -b`) · user 3 · driver 19.** Lint 0 errors everywhere;
**warnings API 230 · user 208 · driver 275.** Colour ceilings user 1 · driver 3. **Never raise one.**
**Suites:** **API 363** · **user 273 + 12 checkers** · **driver 295 + 12 checkers**.
**Board:** `node scripts/check-board.mjs` → ✓; *Now* = **T-102 · T-101**.
🛑 **The device backlog is long:** T-102c 1-3, T-102e (the passenger's main search, SQL-verified
only), T-114 ①, T-115, T-116, T-123, T-088's 401 — none walked on a phone. This step adds to it.

---

## Task

- **ID / name:** T-102i — **the read side: make a passenger's QFY (village) count.**
- **Why now:** owner said *"next"*; T-114 turned out to be code-complete (→ *Parked*), so T-102 is the
  top of the queue, and T-102i is the step its own resume point calls *"the one that matters"*.
- **What is wrong today, in one line:** a passenger ordering *Tuman ichi* or *Yaqin* picks a QFY, a
  driver since T-102c-3 can name QFYs too — and **nothing anywhere compares them.**

### 🔴 What is true today (measured 2026-09-19)

1. **The matching half of `utils/geoMatch.ts` has zero callers.** `matchesOrder`, `matchPrecision`,
   `directionHit`, `matchLevelFor`, `validateScope`, `hasMatchableIds`, `neighborsFirst` are tested
   and unused; the API imports only `validateOfferPlaces` and `isOrderScope`. The rules exist; nothing
   applies them.
2. **`DriverOfferService.getPublicOffers` matches at province/district** through `driver_offer_places`
   (T-102e), per-offer text fallback for offers with no place rows. **`utils/offerGeoQuery.ts` already
   knows the `settlement` column** — but no caller sends a settlement, and the loose rule
   (`LOOSE_PARENT_MATCH`: a driver who named only the district matches a village-level order in it)
   is not expressed in SQL.
3. **The only client is the passenger's search tab**, and it picks **province + district only — no
   QFY, no scope.** After creating an order, the passenger lands there with the order's route handed
   over through `utils/lastSearch.ts` — **province and district only: the QFY and the scope are
   dropped at that handoff.**
4. **Most offers have no place rows yet** — T-102g's backfill is written, not run. Until it runs,
   village-level matching can only find offers created since T-102c (2026-09-13/14).
5. **Drivers browsing passenger orders** (`PassengerOfferService.getPublicOffers`) match by **typed
   text only** — no ids at all. A different surface → boarded as **T-128**, not this step.

### ❓ Decision ① — where should the village count?

- **A — "offers for MY order" (recommended).** When the passenger arrives from an order (right after
  creating it, as today), the search shows the offers that match **that order at its scope's
  level**: village for *Tuman ichi* / *Yaqin*, district for *Viloyat ichi* / *Viloyatlar aro* — with
  a small label on an offer that matched only because its driver named the district, not the village
  (the promise `LOOSE_PARENT_MATCH` makes). A chip names the order being matched and clears back to
  plain browsing. **The plain search stays as it is.** *Why:* it is exactly what the four scopes
  promise (an order matches at its own level), it reuses the handoff that already exists, and the
  rules module becomes the one source for both the SQL and the label.
- **B — a village level in the search tab for everyone.** A third level in the search's picker. More
  UI, and it has no idea of a scope — *Viloyat ichi* and *Tuman ichi* would search the same way.
- **C — both.** A, then B later if browsing by village is wanted.

### Goal (definition of "done", for A)

1. **The server matches an order at its scope's level**: `getPublicOffers` accepts
   `from_/to_settlement_id` and `scope`; at adm3 it takes an offer whose place names **that QFY**, or
   (loose rule) **names that district and no QFY**; at adm2 behaviour is unchanged. The old per-offer
   text fallback stays for offers with no place rows.
2. **Each returned offer says how it matched** — `match_precision: 'exact' | 'district'` — and the
   card shows the `district` case in words.
3. **One rule, two readers, pinned together:** the SQL builder and `geoMatch.directionHit` must agree —
   a parity test runs the same fixtures through both.
4. **The handoff keeps the QFY and the scope**, and the search screen sends them when it is matching
   an order; clearing the chip returns to today's search exactly.
5. **Every new test proven red; all baselines held** (API 281 / 0·230 · user 3 / 0·208 · driver
   untouched); uz · ru · en for every new string.

### Explicitly OUT of scope

- 🛑 **T-128** (drivers finding orders by ids, not text) · **T-127** (forms demanding the QFY a scope
  needs) · **T-102f** (the neighbours admin screen) · **running T-102g's backfill** (the owner's).
- 🛑 A village level in the plain search (option B) unless chosen.
- 🛑 Any migration — the columns exist (`driver_offer_places.settlement_id`, `PassengerOffer`'s 8 geo
  ids, `match_scope`).

## Approach

- **The rule stays in `geoMatch.ts`; SQL is derived from it, not re-decided.** The adm3 condition is
  built in `offerGeoQuery.ts` from `matchLevelFor` and `LOOSE_PARENT_MATCH`, and a **parity test**
  feeds fixture place-sets to both the SQL builder's logic and `directionHit` — the T-123 / T-116
  lesson (two readers of one rule drift) applied up front.
- **Precision in SQL, per offer:** `CASE WHEN EXISTS (exact place) … THEN 'exact' ELSE 'district'`,
  per direction, combined as `matchPrecision` does. No second query.
- **App: the handoff grows two optional fields** (settlement ids, scope) in `lastSearch.ts`, with the
  revision mechanism T-114 built so an old stored route still reads. `check-last-search.mjs` extended.
- **Prove red on every change**, predictions first; revert from a scratchpad golden copy.
- ⚠️ **No test here touches Postgres** (CLAUDE.md). The SQL is shape- and injection-tested; whether a
  real search returns the right rows is a **device check against test3**, and it is listed as such.

## Steps

- [x] **0. Owner approval (rule 3) and decision ①.** ✅ *"ok"*, 2026-09-19 — **option A**: "offers for
  MY order", matched at the order's scope level, a `district` match labelled; the plain search unchanged.
- [x] **1. Measure, read-only.** ✅ **DONE 2026-09-19.** Baselines unchanged since T-116's close
  (API 281 / 0·230 / 363 · user 3 / 0·208 / 273 + 12). What the reading settled:
  - **The only entry is the create hand-off** (`CreatePassengerOfferScreen:811` + `:863`); "my
    orders" never opens the search. **It travels by TWO channels, and both are needed:** navigation
    params (a fresh mount reads them once, in `initialize()`) and the stored route + revision
    (`bumpLastSearchRoute` — the ONLY way to reach the tab when it is already mounted, since
    `initialize()` is mount-only). So the order travels both ways: `SearchOffersParams.order` and an
    **optional `order` field on the stored route — additive, no key renamed** (`lastSearch.ts` warns a
    rename orphans every save). The screen's own saves keep writing the 2026-08 shape, so the "for
    my order" mode is transient by design: it arrives with an order, not with an app restart.
  - **The label is decided by the rule module itself, not by SQL:** `getPublicOffers` already runs
    one grouped query per concern (ratings, seats taken); one more for the returned offers' place
    rows lets `geoMatch`'s own `directionHit` label each offer. **The SQL filter is built from
    structured clauses derived from the same rule, and a parity test runs fixture rows through both.**
  - **Per direction, not per order:** until T-127 makes the forms demand it, an order can carry a
    QFY on one end only — that side matches at adm3, the other at adm2 exactly as today.
  - **Old offers (no place rows) keep the text fallback, on the DISTRICT's name** — a QFY name is
    rarely in free text — and are labelled `district`: they never named a village.
  - The offer card is `components/search/OfferResultCard.tsx`; no test exists for the search screen.
  - Backfill counts: the owner's to run (`npm run backfill:places` writes nothing).
- [x] **2. Server — the adm3 condition and the precision.** ✅ **DONE 2026-09-19.**
  `geoMatch`: **`placeHit`** — the rule for ONE place row; `directionHit` is now "the best
  `placeHit` over the rows" (a pure refactor: the 46 existing tests passed unchanged before anything
  else was added) — and **`offerMatchPrecision`**, the label, never over-promising (an offer with no
  rows is `district`). `offerGeoQuery`: **`adm3Clauses`** (the rule's two branches as DATA),
  `clauseExistsSql` (columns whitelisted, ids checked, an empty clause refused), `settlementMatchSql`
  (text fallback on the DISTRICT's name, guarded by "no place rows", as at adm2), and
  **`groupPlaceRows`**. `getPublicOffers` takes `from/to_settlement_id` + `scope`; a side matches at
  the QFY only when its scope is adm3 AND the order named a QFY; results carry `match_precision`
  only when some side did. Controller parses the three params; the service refuses unsafe ones.
  🔴 **A silent trap caught by reading the model before running anything:** `driver_offer_places`'
  `offer_id` and geo columns are **BIGINT**, which `pg` returns as **strings** in raw rows, while
  `DriverOffer.id` is INTEGER. Unconverted, no offer would find its rows and no QFY would ever be
  `===` — **every result labelled `district`, nothing failing.** Converted in `groupPlaceRows`, pulled
  out of the service so a test can feed it string ids exactly as pg returns them.
  **Tests +28 (API 363 → 391)** — including **the parity test**: 7 fixture rows through both
  `adm3Clauses` and `placeHit`, plus a guard that the fixtures produce both answers.
  **Prove red — 6 mutations:** ⓐ the loose clause's `IS NULL` dropped → **3** ✓ · ⓑ the same guard
  dropped from `placeHit` → **predicted 4, got 5** — an older test (*"compares the level it is given"*)
  also rests on it · ⓒ offer id left a string → **3** ✓ · ⓓ geo ids left strings → **1** ✓ ·
  ⓔ text fallback unguarded → **1** ✓ · ⓕ a row-less offer labelled exact → **1** ✓.
  ⚠️ My first test run was red for my own reason — the new test used `groupPlaceRows` without
  importing it (3 red, `tsc` 284). The `PublicOfferController(123)` error in that run was a
  **pre-existing** baseline error moved 15 lines down by my edit — checked against the golden copy.
  **After:** `tsc` 281 · lint 0 / 230 · `npm test` **391/391**.
- [x] **3. App — carry the order and say how it matched.** ✅ **DONE 2026-09-19.** The order form
  hands over `fromSettlement` / `toSettlement` / `scope` on BOTH channels (navigation params and
  the bumped stored route — additive fields, nothing renamed). The search screen keeps an
  `orderScope`; the QFYs ride on its `GeoPath`s, so `RouteSummary` names them with no new display
  code (`routeText` already printed `settlement`). In that mode it sends `scope` + both QFY ids; a
  chip — *"Buyurtmangiz bo'yicha · Tuman ichi"*, the home carousel's own scope names — clears back
  to the plain search (scope AND QFYs dropped, so the summary claims no village). **Any manual route
  change or swap ends the mode.** The card shows *"Haydovchi faqat tumanni ko'rsatgan, QFYni emas"*
  on a `district` match. 3 strings × uz/ru/en, worded as the app already words QFY (*Mavze / QFY ·
  массив / СГМ · settlement*). `types/orderScope.ts`' header (*"the search still ignores it"*) updated.
  **Tests:** `SearchOffersScreen.test.tsx` **new, 4** (the screen had none); `CreatePassengerOffer`
  **+1** (the stored route carries both QFYs and the scope). **Prove red — 5 mutations, all predicted
  exactly:** ⓖ order fields never sent → 1 · ⓗ hand-off scope ignored → 2 · ⓘ clearing keeps the
  scope → 1 · ⓙ the note on every labelled offer → 1 · ⓚ the stored route stripped → 1.
- [x] **4. Measure.** ✅ **DONE 2026-09-19 — every number predicted:** API `tsc` 281 · lint 0/230 ·
  **391** (363 + 28) · user `tsc` 3 · lint 0/208 · **278** Jest (273 + 5) + **12** checkers · driver app
  **untouched** (no file in `git status`).
- [x] **5. Close.** ✅ **DONE 2026-09-19.** T-102's card and `PLAN-T102.md` §6/§9 (T-102i ✓; the design
  question answered: order↔offer via the search). `ARCHITECTURE.md` gains a **Place matching** row.
  `CHECKLIST.md` §5: two drivers (one naming the QFY, one only the district), a *Tuman ichi* order,
  the chip, the label, clearing, a manual change, and *Viloyatlar aro* unchanged. `CLAUDE.md` and
  `ARCHITECTURE.md` test counts (391 · 278 + 295). Journal written. Commit proposed.
  ⚠️ **Needs the API deploy + a user-app rebuild.**

## Files to touch (A)

**API:** `utils/offerGeoQuery.ts` (+ test) · `services/DriverOfferService.ts` (`getPublicOffers`) ·
`controllers/PublicOfferController.ts` (params) · `utils/geoMatch.ts` only if a helper is needed for
parity (its rules do not change)
**User app:** `utils/lastSearch.ts` · `screens/SearchOffersScreen.tsx` · the offer card component ·
`screens/CreatePassengerOfferScreen.tsx` (the handoff) · `api/offers.ts` (types) · translations ×3 ·
their tests · `scripts/check-last-search.mjs` / `check-offer-search.mjs`
**Docs:** PLAN · PLAN-T102 · TODO · JOURNAL · CHECKLIST
**NOT touched:** the driver app, migrations, dependencies, `infra/**`.

## Risks / open questions

1. ⚠️ **Few offers will match by village at first** — most have no place rows until the backfill
   runs, and QFY-naming drivers only exist since 2026-09-14. The loose rule softens this; an empty
   result for a village order is expected early, and the screen must say "no offers yet" plainly.
2. ⚠️ **The `district` label is a promise to the passenger** — its wording is the owner's to read.
3. ⚠️ **SQL-verified, not DB-verified** — same as T-102e. The device check is not optional.
4. ⚠️ **Old orders** (before 2026-09-13) have no scope → they match at adm2, exactly as today.
5. 🛑 **The device backlog** (see board state). New matching on top of unwalked matching makes a
   wrong result harder to place; walking T-102e first would tell us the base is sound.

## Session notes

### 2026-09-19 — planned, approved (option A) and finished, steps 0-5

- **The rules existed and nothing used them.** `geoMatch`'s whole matching half had been tested and
  idle since 2026-09-12. This step gave it its first readers — the SQL filter (derived from it) and
  the result label (decided by it) — instead of writing the rule a second time in SQL.
- 🔴 **The trap no test in this project could have seen, caught by reading the model:** BIGINT comes
  back from `pg` as a string. Every label would have been `district`, nothing failing. It is now in a
  pure function a test feeds string ids — the only way a DB-free suite can pin it.
- **Two readers held together from the start** (`placeHit` ⇔ `adm3Clauses`, a parity test) — the
  T-123 / T-116 lesson applied up front instead of discovered.
- **Predictions: 16 mutations, 15 exact, 1 under** (ⓑ: an older test also rests on the guard).
- ⚠️ **SQL-verified, not DB-verified**, like T-102e before it. The device check (`CHECKLIST.md` §5) is
  the proof; so is walking T-102e itself, which this sits on.

## Resume point

> **Updated 2026-09-19. T-102i IS COMPLETE — steps 0-5. NOT COMMITTED** — the commit is proposed.
> **What changed:** after a passenger creates or edits an order, the search matches THAT order at
> its scope's level (the QFY for *Tuman ichi* / *Yaqin*); a driver who named only the district is let
> through and labelled; a chip names the order and clears back to the plain search, which is unchanged.
> 🟢 **API `tsc` 281 · lint 0/230 · 391 · user 3 · 0/208 · 278 + 12 · driver untouched.** `check-board` ✓.
> ⚠️ **Needs the API deploy + a user-app rebuild.** Then `CHECKLIST.md` §5.
> **▶️ NEXT: the owner's pick.** In T-102: T-102f (admin neighbours) · T-102h · the backfill RUN (the
> owner's). Or **T-127** (forms demand the QFY a scope needs — pairs with this) · **T-128** (the
> driver side, by ids) · **T-126** (driver app hardcoded Uzbek).
