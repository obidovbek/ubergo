# 📋 PLAN — T-102: structured geo matching, so the four order scopes actually differ

> Written **2026-09-12**, after the owner reported that the four `UserBuyurtma*` screens behave
> alike and restated the scope rules. Their specification is in `docs/PLAN-T101-SCOPES.md` §0/§1
> and has been correct and unbuilt since 2026-08-30.
>
> ✅ **OWNER APPROVED THE MIGRATIONS 2026-09-12**, and earlier confirmed the scope model with
> *"all decisions logically must be correct"*. §4's three recommendations are taken as accepted;
> ⚠️ **decision ① is a PRODUCT call, not a logical one** — it is one constant
> (`LOOSE_PARENT_MATCH`) and can be flipped after seeing it on a device.

---

## 1. What this is

The owner's model, restated 2026-09-12 and unchanged since 2026-08-30:

| level | Uzbek | model |
|---|---|---|
| adm0 | davlat | `GeoCountry` |
| adm1 | viloyat | `GeoProvince` |
| adm2 | tuman | `GeoCityDistrict` |
| adm3 | QFY | `GeoSettlement` |

| scope | passenger picks | **matches on** |
|---|---|---|
| `aro` — Viloyatlar aro | adm1+adm2 → adm1+adm2 | **adm2 → adm2** |
| `viloyat` — Viloyat ichi | adm1 once, then adm2 → adm2 | **adm2 → adm2**, *"uni ichki qismlari emas"* |
| `tuman` — Tuman ichi | adm1+adm2 once, then adm3 → adm3 | **adm3 → adm3** |
| `yaqin` — Yaqin | adm1+adm2+adm3 → adm1+adm2+adm3 | **adm3 → adm3**, two bordering districts |

🟢 **THE UI DIFFERENCE IS ONLY CONVENIENCE, AND THE OWNER SAYS SO** — *"faqat frontend yengilligi
uchun … ikki marta qidirmasligi uchun."* So the four artboards being near-identical is the design
being right. **What must differ is the SEARCH**, which no drawing can show.

---

## 2. What is true today (measured 2026-09-12)

| piece | state |
|---|---|
| the four scopes + match levels | ✅ `user-app-standalone/types/orderScope.ts` |
| picker pre-locking per scope | ✅ `GeoSheet` `startLevel` / `initialPath` |
| `PassengerOffer` geo ids | ✅ **all 8 columns exist AND are really populated** (verified end to end) — but **no query reads them** |
| the scope reaching the API | ❌ never sent; no `scope`/`match_level` anywhere server-side |
| `DriverOffer` geo ids | ❌ **none at all** |
| `geo_district_neighbors` | ❌ does not exist |

🔴 **AND THE SEARCH IS WORSE THAN "NO IDS" — IT TAKES IDS AND THROWS THEM AWAY.**
`DriverOfferService:812-833` accepts `from_city_id`, looks the row up, and then matches
`from_text ILIKE '%<name>%'`. So:

- **false positives**: `Farg'ona` matches *Farg'ona viloyat*, *Farg'ona shahar* **and**
  *Farg'ona tumani* — three different places;
- **false negatives**: an offer whose text spells the place differently never matches;
- **no depth at all**: adm2 and adm3 are the same substring search, which is exactly why all four
  scopes behave identically.

---

## 3. The matching logic, derived

Write `O` for the passenger's **order** and `F` for a driver's **offer**. Each has, per direction
(`from`, `to`), a path of ids: country → province → city → settlement. `L` is the order's match
level, `adm2` or `adm3`.

**The rule, stated once:**

> An offer matches an order when, **for BOTH directions independently**, the offer's node at
> level `L` equals the order's node at level `L`.

That is the whole of *"match adm2 → adm2"*. Everything else is a consequence:

**① "uni ichki qismlari emas" falls out for free.** Comparing `city_id == city_id` never looks at
settlements. There is nothing to suppress — the rule is a comparison, not an expansion. The doc's
old worry that this was "not representable" was about free text; with ids it is one equality.

**② `aro` and `viloyat` have IDENTICAL matching.** Both are adm2 → adm2. The owner said so
outright. `viloyat` differs only in (a) how the picker opens and (b) a validation rule: both
districts must sit in the same province. **It is not a different query.**

**③ An offer MORE precise than the order matches automatically.** If the driver named a settlement,
their `city_id` is still populated (the whole path is stored), so an adm2 comparison finds it.
No special case.

**④ `yaqin` and `tuman` have identical matching too** (adm3 → adm3). They differ in validation:
`tuman` requires both settlements inside one district; `yaqin` requires the two districts to be
**different and bordering**.

**⑤ Direction matters and must not be collapsed.** `from` matches `from`, `to` matches `to`. A
symmetric or "either direction" match would offer a passenger a ride going the wrong way.

**The one case the rule does NOT settle** is an offer *less* precise than the order — see §4 ①.

---

## 4. 🛑 Three decisions

| # | question | recommendation |
|---|---|---|
| ① | **An adm3 order vs an adm2-only offer.** The passenger wants QFY-A → QFY-B. A driver posted only "district X → district Y", which are the parents of A and B. Match, or not? | **Match, and label it.** Requiring adm3 on both sides means an adm3 order finds almost nothing until every driver fills a settlement, which reads as "the app is broken". So: an offer with a null settlement matches an adm3 order when its **city** equals the order's city. ⚠️ **But the result must be visibly less exact** — the card shows a "district-level" tag — or the passenger believes a precision the driver never promised. *This is the only rule not derivable from the owner's spec; it is a product call.* |
| ② | **What does the neighbours table DRIVE for `yaqin`?** | 🔴 **MY FIRST ANSWER WAS WRONG AND THE OWNER ASKED ME TO CHECK IT (2026-09-12).** I had recommended limiting the picker to bordering districts and REFUSING a non-bordering order. Measured: the Yaqin artboard's destination picker is the standard unfiltered four-step picker, nothing marked or removed. And the logic had a hole — Yaqin is the ONLY scope with QFY precision across a district boundary, so enforcing adjacency would leave a passenger wanting QFY precision between two non-adjacent districts with no scope at all. **Corrected, owner-confirmed: Yaqin = QFY precision on both ends; "chegaradosh" describes the typical case, not a rule.** The neighbours table lists the origin's neighbours FIRST in the picker (`neighborsFirst`, a sort that removes nothing) and never refuses. What Yaqin DOES refuse is the SAME district on both ends — that is `tuman`. |
| ③ | **Does the DRIVER's offer form have to collect geo ids now?** | 🔴 **YES — AND MY FIRST SHAPE FOR IT WAS WRONG, caught by the same check.** I had written "the offer gains the same 8 columns the passenger order has". Measured (`DriverElon.dc.html`, `toggleAdm2` / `toggleAdm3`): a driver picks ONE province and then a **SET of districts and a SET of QFYs per direction** — the artboard's own sample leaves from *Farg'ona t.* OR *Marg'ilon sh.* Eight scalar columns hold one place per direction and cannot represent that. All four passenger boards single-select, so the asymmetry is real: a passenger has one origin, a driver serves a corridor. **Corrected: a child table `driver_offer_places`, one row per selected place; matching becomes MEMBERSHIP** (the order's single node is among the offer's set). The one-sentence rule survives; "equals" became "is one of". |

---

## 5. 🛑 Migrations (rule 4 — these need explicit approval)

1. **`create-driver-offer-places`** — 🔴 **REPLACES the 8-column `add-geo-ids-to-driver-offers`
   written earlier the same day and never run** (owner: "replace"). A child table, one row per
   selected place: `offer_id` (CASCADE), `direction` ENUM(`from`,`to`), the four geo ids
   (`SET NULL`, mirroring `passenger_offers`). A district chosen with no QFY is one row with
   `settlement_id` NULL — the driver's "anywhere in this district", which the loose rule reads.
   Indexes: `(offer_id, direction)` for reads, `(direction, city_id)` and
   `(direction, settlement_id)` for the matcher's `EXISTS` probes, and a UNIQUE on
   `(offer_id, direction, city_id, COALESCE(settlement_id, 0))` — plain UNIQUE would let two
   NULL-settlement rows for one district coexist, since Postgres treats NULLs as distinct.
   `from_text`/`to_text` on `driver_offers` are KEPT for display, old clients and the fallback.
2. **`add-match-level-to-passenger-offers`** — one column `match_scope`
   (`aro | viloyat | tuman | yaqin`), so an order remembers what it asked for. ⚠️ Store the
   **scope**, not the match level: `aro` and `viloyat` share a level but differ in meaning, and a
   stored level could never be told apart again.
3. **`create-geo-district-neighbors`** — `(city_district_id, neighbor_city_district_id)`, both FK
   to `geo_city_districts`, PK on the pair.
   🔴 **Adjacency is SYMMETRIC and the database will not enforce it.** Decide once and write it on
   the migration: **store both rows on every insert** (simpler to query, and the admin screen can
   do it in one transaction). Plus `CHECK (city_district_id <> neighbor_city_district_id)` — a
   district that is its own neighbour degenerates `yaqin` into `tuman` silently.

---

## 6. Steps

- [x] **T-102a. The rules, pure, before any query. ✅ DONE 2026-09-12.**
      ✅ **`src/utils/geoMatch.ts` (new, pure)** — `matchLevelFor` · `directionMatches` ·
      `matchesOrder` · `matchPrecision` · `validateScope` / `isScopeValid` · `hasMatchableIds` ·
      `LOOSE_PARENT_MATCH`.
      ✅ **`src/utils/geoMatch.test.ts` — 46 cases, and the API suite went 238 → 284, all passing.**
      **RED ON ALL 16 MUTATIONS**, file restored byte-identical. (First version: 36 cases / 13
      mutations against a scalar offer; rewritten the same day when the driver artboard showed
      the offer is a SET — see §4 ③.) The most valuable reds:
      turning the two-direction `AND` into an `OR` (**4 red** — that one would have offered
      passengers rides going the opposite way), swapping the match levels (**12 red**), and
      comparing the settlement where the rule says district (**12 red**).
      🟢 **THE LOGIC COLLAPSED TO ONE SENTENCE, WHICH IS THE REAL RESULT OF THIS STEP:** *an offer
      matches when, for both directions independently, its node at the order's level equals the
      order's.* From it, "uni ichki qismlari emas" needs **no code at all** (comparing city to
      city never looks inside a city), `aro` ≡ `viloyat` and `tuman` ≡ `yaqin` as queries, and a
      more precise offer matches for free. The old doc's fear that this rule was "not
      representable" was about free text; with ids it is one equality.
      ⚠️ **Validation is where the four scopes actually differ**, not matching: same province
      (`viloyat`), same district (`tuman`), different **and** bordering districts (`yaqin`).
      ⚠️ The offer side is a **`PlaceSet`** (`directionHit` = membership, with the loose rule
      applying ONLY to a NULL-settlement place — a driver who named QFY A never said "anywhere").
      `validateOfferPlaces` mirrors the artboard's `sheetNext` (≥ 1 district, one province per
      side). `neighborsFirst` is a SORT that removes nothing; an empty table is a no-op.
- [x] **T-102b. The three migrations — WRITTEN 2026-09-12. 🛑 NOT RUN.**
      `20260912000001-create-driver-offer-places` (🔴 replaced the 8-column draft — §5) ·
      `…0002-add-match-scope-to-passenger-offers` · `…0003-create-geo-district-neighbors`. All three load, export `up` **and** `down`, and
      mirror the existing `passenger_offers` geo migration field for field (BIGINT, `SET NULL`).
      🔴 **The scope column stores the SCOPE, not the level** — `aro`/`viloyat` share adm2 and
      `tuman`/`yaqin` share adm3, so a stored level would be a one-way door that makes two
      different orders permanently indistinguishable. It is a real ENUM, nullable with no
      default: a pre-T-102 order genuinely chose nothing, and inventing `'aro'` would be a lie
      the data could never be cleaned of.
      🔴 **Neighbours: BOTH ROWS ARE WRITTEN on every insert** — decided once, on the migration.
      One row plus a `UNION` on every read pushes the burden onto every future query, where
      forgetting it is silent. Plus `CHECK (city_district_id <> neighbor_city_district_id)`.
      🛑 **I have NOT run them.** They change the owner's database; the approval was to write
      them. Run with `npm run db:migrate` in `api,admin,db/apps/api` — **on a copy of test3
      first** — and `npm run db:migrate:undo` reverses each.
- [x] **T-102c. The driver wizard collects geo ids. ✅ CLOSED 2026-09-14 (1 · 2 · 3).**
      🟢 **MEASURED 2026-09-12 BEFORE STARTING, AND IT IS FAR LESS WORK THAN §4 ③ ASSUMED.**
      The wizard **already multi-selects districts**, exactly as `DriverElon` draws it:
      `selectedFromCities` / `selectedToCities` are `GeoOption[]` (lines 135/141), the sheet
      returns them, and swap exchanges the two arrays. **The UI for the set model exists.**
      🔴 **BUT THE IDS ARE THROWN AWAY AT THE BOUNDARY, AND WORSE — THEY ARE SMUGGLED THROUGH
      `stops`.** On submit (lines 897-915) every district after the FIRST is serialised into a
      `DriverOfferStop` row carrying only `label_text`, because `driver_offers` has one
      `from_text`. So a two-district origin becomes *one* text plus a fake intermediate stop.
      🔴 **AND THE EDIT PATH PARSES IT BACK OUT OF PROSE.** Lines 343-355 split `from_text` on
      commas and guess whether it holds several cities by testing whether any part
      `includes('viloyat')`. `parseLocationText` (line 654) then re-derives country/province/city
      from the words. **A district named "… viloyat …" breaks the guess**, and a renamed district
      silently stops parsing. This is the round trip T-102 deletes.
      ⚠️ **The wizard stops at `endLevel="district"` and the word "settlement" appears ZERO times
      in it.** So the driver cannot name a QFY at all today. The artboard's `toggleAdm3` is not
      built — adm3 offers are genuinely new UI, not a rewiring.
      **So T-102c splits:**
        1. ✅ **DONE 2026-09-13 — persist what is already collected.** `DriverOfferPlace` model +
           association; `from_places` / `to_places` on the create/update payload;
           `writeOfferPlaces` (replace, never merge) validating through `validateOfferPlaces`;
           `places` included on both driver-side reads. The wizard sends ids and the edit path
           reads them back, so `parseLocationText` and the `includes('viloyat')` guess now run
           **only for pre-T-102 offers**, as an explicit fallback.
        2. ✅ **DONE 2026-09-13 — stopped faking stops.** `fromStops`/`toStops` are gone from
           `handleSave`; `stopsData` is the real intermediate stops and nothing else. The load
           path's absorption-by-province dance is skipped whenever the offer has places
           (`placesDroveTheLoad`) — **without that guard, step 1 would have REGRESSED the app**:
           a genuine stop inside the origin's province would be swallowed into the origin set
           and the next save would store it as an origin district.
        3. ✅ **DONE 2026-09-14 → `docs/PLAN-T102c3.md`.** The wizard collects QFYs and sends
           them as `settlement_id`. **A CLIENT-ONLY step — the API was already finished for it**
           (`OfferPlaceData = GeoPathIds`, `writeOfferPlaces` persists it, the UNIQUE index keys
           on `COALESCE(settlement, 0)`). `GeoSheet` gained a second multi-select level and a
           confirm that ADVANCES; the rule *"only an endpoint naming exactly ONE district may
           name a QFY"* is owner decision ① and lives in `canPickSettlements`, injected into the
           sheet rather than known by it. `check-offer-restore.mjs` 49 → **60 assertions, red on
           all 7 mutations**. 🛑 **Not on a device.**
           🔴 **§4 ③ BELOW OVERSTATES THE ARTBOARD AND IS CORRECTED HERE.** `DriverElon` draws
           **no QFY picker**: its place sheet is `1/2 · Viloyat` → `2/2 · tuman`, `sheetNext()`
           calls `confirmPlace()` immediately, and **`toggleAdm3` has zero callers**. What it
           really contributes is the DATA MODEL (`"<tuman> / <QFY>"` keys, cleared when a district
           is unticked) and the DISPLAY (the QFYs are the endpoint's *second* line, beside the
           landmark, never inside the place line). The picker itself was new UI.
      ⚠️ **`stops` rows written by the old code are indistinguishable from real intermediate
      stops except by comparing their text to the from/to cities** (lines 868-885 already do this
      dance). The backfill (T-102g) must un-pick that, and it is the reason that step is risky.
- [ ] **T-102d. The order sends and stores its scope**, and the passenger app stops relying on
      free text. 🟢 **THE SCOPE HALF IS DONE 2026-09-13** — driven by an owner device report on
      T-114 (*"on edit it should open based on how created"*), which needed exactly this.
      ✅ `match_scope` on the `PassengerOffer` MODEL (the column was migrated on 2026-09-12 and
      the model never knew about it, so nothing could read or write it) · accepted on create and
      update · **validated through `isOrderScope` from the rules module, not a second copy of the
      four values** · returned by the serialiser · sent by the order form on create AND edit.
      🔴 **A BAD VALUE IS A 400, NOT A NULL.** NULL already means "pre-T-102d order, fall back to
      the text search", so coercing a typo onto it would hide a broken client behind behaviour
      that looks deliberate.
      ⚠️ **Still open in this step:** "the passenger app stops relying on free text" — that is the
      read side and belongs with **T-102e**, which is the query rewrite.
- [x] **T-102e. Rewrite the search. ✅ DONE 2026-09-13 — the places table finally has a reader.**
      ✅ `utils/offerGeoQuery.ts` (pure) + **27 tests, red on all 8 mutations**; API suite
      305 → **332**. `getPublicOffers` now asks `driver_offer_places` instead of running
      `from_text ILIKE '%name%'` against free prose.
      🔴 **THE FALLBACK IS PER-OFFER, NOT PER-REQUEST, AND THAT IS THE DESIGN.** Places have only
      been written since T-102c shipped the same day, so nearly every published offer still has
      none. An offer WITH places matches on ids and its text is ignored; an offer WITHOUT places
      matches exactly as it does today. A request-level switch would have returned an empty list
      for most of the database. **This is also what makes T-102g low-risk instead of urgent** —
      an un-backfilled offer keeps working.
      ⚠️ **Raw SQL, because Sequelize cannot express it**: a correlated `EXISTS` against a child
      table beside a `NOT EXISTS` on the same table. Everything interpolated is escaped in that
      module — ids must be positive integers or it throws (`Number('1 OR 1=1')` is NaN and is
      refused, not coerced), and place names have their quotes doubled, which is an everyday
      path in Uzbek (*Qo'qon*, *G'uzor*, *To'rtko'l*), not a hardening afterthought.
      🛑 **SQL-VERIFIED, NOT DB-VERIFIED.** No test in this project touches Postgres. That a
      passenger's search still returns the offers it used to **must be checked on a device**.
      ⚠️ **Not done in this step:** labelling the response with WHICH path matched, so the app
      can show "district-level" for a `LOOSE_PARENT_MATCH`. That belongs with the adm3 work
      (T-102c-3), which is what makes loose matches possible at all.
- [ ] **T-102f. Admin: the neighbours screen** — pick a district, tick its neighbours, both rows
      written. ~200 districts to populate; the geo section already has CRUD for all five levels.
- [ ] **T-102g. The backfill.** 🟢 **WRITTEN AND TESTED 2026-09-13 — NOT RUN.** Still the
      riskiest step, so it reports by default and writes only when told.
      `npm run backfill:places` reports · `npm run backfill:places -- --apply` writes.
      ✅ `utils/backfillPlaces.ts` (pure) + **25 tests, red on all 7 mutations**; suite 332 → **357**.
      🔴 **IT REFUSES RATHER THAN GUESSES, because the failure is asymmetric.** An offer left
      alone KEEPS WORKING (T-102e falls back to its text); an offer given the WRONG district is
      confidently matched to passengers going elsewhere and is indistinguishable from a correct
      one afterwards. So: names compare EXACTLY — never `includes()`, which is what made the old
      loader match a district against its own province — a name matching two districts makes the
      whole side `ambiguous` and is skipped, and **both directions must match or neither is
      written** (a half-backfilled offer has places, so the text fallback stops applying, and it
      would then match on one end only).
      ⚠️ **Uzbek apostrophes are folded** (`Qo'qon` / `Qo‘qon` / `Qoʻqon` are one place).
      Without it thousands of rows would look unmatchable rather than unmatched.
      ⚠️ Offers that ALREADY have places are skipped — never second-guessed from prose.
      ⚠️ `--apply` runs in ONE transaction: a half-finished backfill is not corruption, but it
      makes the next report's numbers a lie and nobody would know where it stopped.
      🛑 **Run the REPORT first and read it.** The counts (writable / ambiguous / no-match) are
      the evidence for whether `--apply` is safe on this data — I cannot see the database.
- [ ] 🔴 **T-102i. THE READ SIDE — the step this plan never had.** Boarded 2026-09-14, on measuring
      that **nothing reads the ids at adm3**: `getPublicOffers` builds its geo filter from
      `from_city_id` / `from_province_id` only, `SearchOffersScreen` sends nothing deeper, and
      `matchesOrder` · `matchLevelFor` · `matchPrecision` · `hasMatchableIds` · `validateScope` ·
      `neighborsFirst` — **the entire matching half of `utils/geoMatch.ts` — have zero consumers.**
      Only `validateOfferPlaces` and `isOrderScope` are called from anywhere.
      So T-102e rewrote the **search** (adm2) and nothing yet matches an **order** at its own
      scope's level, which is what §1's table promises. This step is: `getPublicOffers` accepting
      `from_/to_settlement_id`, `LOOSE_PARENT_MATCH` expressed in SQL beside the existing
      per-offer text fallback, and **the response saying WHICH path matched** so the card can
      show "district-level" — the label T-102e explicitly deferred to "the adm3 work".
      ⚠️ **An open design question comes with it:** the scope lives on the ORDER (`match_scope`),
      but the passenger's SEARCH screen has no scope and stops at adm2. Whether adm3 matching
      belongs to the search, to order↔offer matching, or to both, is a decision — not a detail.
      🛑 **Until this lands, a QFY a driver picks changes nothing a passenger sees.**
- [ ] **T-102h. Checkers, baselines, board**; `docs/PLAN-T101-SCOPES.md` §6 questions closed.

---

## 7. Risks, recorded up front

- 🔴 **The backfill is where silent damage happens.** A wrong id is worse than no id: it makes an
  offer match the wrong place confidently. NULL is the safe failure.
- 🔴 **`yaqin` returns nothing until the neighbours table has rows.** With decision ② that shows
  up as an empty picker at creation time, which is honest, rather than an empty result list.
- ⚠️ **Two apps read this search.** The driver app's passenger-order search has the same
  free-text problem and the same fix; do not fix one and leave the twin
  (`ubexgo-fix-the-class-not-the-instance`).
- 🟢 **RESOLVED BEFORE IT COULD BITE: `PassengerOffer`'s 8 columns ARE genuinely populated.**
  Verified end to end 2026-09-12 rather than assumed — `CreatePassengerOfferScreen:625-627` sends
  the ids from the picked `GeoSheet` path and `PassengerOfferService:461-463` persists them. So
  **half the data this card needs already exists in production**; only the DRIVER side is empty.
  *Worth checking, because "written but never read" and "never written" look identical from a
  query that reads nothing.*

---

## 8. Session notes

### 2026-09-13 — T-102c 1+2: the ids are persisted, and the prose path is now a fallback

**API.** `DriverOfferPlace` (table already migrated by the owner in `a522a8d`) + the
`DriverOffer.hasMany(… as: 'places')` association; `from_places` / `to_places` on
`CreateOfferData`; `writeOfferPlaces` on the service, called by both `createOffer` and
`updateOffer`. It **replaces, never merges** — an edit is a fresh statement of where the driver
goes — dedupes before insert (the table's UNIQUE index folds NULL settlements to 0 and would
throw, not ignore), and validates through `validateOfferPlaces`, so T-102a's 46 tested cases are
what guard the write. `undefined` on both sides means "an old client said nothing" and leaves
stored rows alone; `[]` is a validation error, so neither path can silently empty an offer.

**Driver app.** `handleSave` sends ids; `fromStops`/`toStops` are deleted. The load path reads
`offer.places` first and falls back to `parseLocationText` **only for an offer with no places**.

🔴 **THE GUARD THAT STOPPED THIS BEING A REGRESSION.** Removing the fake stops was not enough on
its own: the load path also *absorbs* stops that share the origin's province back into the origin
set, because that is how the fakes were recovered. Left running on an offer that now has ids, it
would swallow a **real** intermediate stop in that province — and the next save would store it as
an origin district. Hence `placesDroveTheLoad`. Sub-steps 1 and 2 are not separable; doing 1
alone would have shipped the bug.

⚠️ **`buildOfferPlaces` was pulled OUT of the screen into `utils/offerRestore.ts`** — beside
`resolveEndpointRestore`, which is the function that creates the trap it has to avoid: a one-city
endpoint keeps its city in `city` and an **empty** `cities`, so a sender reading only the array
emits nothing for the commonest offer there is, and the offer saves with no ids at all, silently
falling back to the text search this card exists to replace. Nothing errors when that happens.
`check-offer-restore.mjs` **41 → 49 assertions**, and **RED on all 6 mutations** (dropped
fallback · inverted precedence · no dedupe · swapped country/province · invented settlement ·
0-for-null), file restored byte-identical.

**Verification.** API `tsc` **281** (identical error set, proved by stashing) · **284 tests** ·
lint **0 errors**. Driver `tsc` **28** · lint **0 / 275** · **10 checkers green**. Every figure at
its baseline; none raised.

🛑 **NOT RUN ON A DEVICE, AND NOT VERIFIED AGAINST A REAL DATABASE.** No query reads
`driver_offer_places` yet — that is T-102e — so the rows are written and nothing consumes them.
The honest test is: save an offer with two origin districts, reopen it for edit, and check both
come back **and** that no fake stop appears in the stops list.

### 2026-09-12 (4) — T-102c measured: the UI is already right, the persistence is not

Measured the wizard before touching it, and the balance of work inverted. **`DriverElon`'s
multi-select is already built** — `selectedFromCities` / `selectedToCities` are arrays and the
sheet fills them. What is missing is underneath: `driver_offers` holds ONE `from_text`, so every
district after the first is written as a fake `DriverOfferStop`, and the edit path recovers them
by splitting prose on commas and testing whether a part `includes('viloyat')`.

**That guess is a live defect, not just debt**: a district whose name contains "viloyat" is
mis-parsed, and a renamed district stops loading. `driver_offer_places` deletes the whole round
trip.

⚠️ **The wizard never reaches adm3** (`endLevel="district"`; the word "settlement" appears zero
times), so `tuman` and `yaqin` need genuinely new UI, not rewiring — worth knowing before
promising the four scopes work.

### 2026-09-12 (3) — the owner asked me to check ② and ③, and both were wrong

**② did not match the design and had a logical hole.** The Yaqin picker is unfiltered in the
artboard, and enforcing "chegaradosh" would leave QFY-precision-across-non-adjacent-districts with
no scope. Corrected with the owner: adjacency is a picker SORT, never a refusal.

**③ was incomplete in a way that changed the schema.** The driver artboard multi-selects
districts and QFYs; eight scalar columns cannot hold that. The 8-column migration — written that
morning, never run — was **replaced** by a `driver_offer_places` child table. The matching rule
generalised from equality to membership without changing its one-sentence statement.

Tests rewritten for the set model: **46 cases, red on all 16 mutations** (new reds: membership
collapsing to first-element equality, the loose rule accepting a NAMED QFY as "anywhere",
neighbours becoming a filter instead of a sort).

*The lesson is the same one this project keeps paying for: I derived the semantics correctly
and then modelled the DATA from an assumption instead of from the artboard. Both errors were
one measurement away.*

**Migrations still NOT run — owner: "i do not run migrations yet".**

### 2026-09-12 (2) — T-102a/b: the rules, and three migrations written

The scope logic reduced to **one sentence** and everything else fell out of it — including the
rule the old notes called "not representable", which with ids is a single equality. **36 tests,
red on all 13 mutations.** The `AND`→`OR` mutation is the one worth remembering: 4 tests caught
it, and without them the app would have offered passengers rides going the opposite way.

Three migrations written and **not run** — they change the owner's database and the approval was
to write them. Each is reversible and mirrors the passenger geo migration field for field.

**Next: T-102c**, the driver wizard collecting geo ids — the bulk of the card, and the thing
without which none of this matters, since driver offers have no locations to match on.

### 2026-09-12 — planned; no code

Owner re-confirmed the scope model and approved proceeding. The matching logic was derived rather
than assumed: it reduces to **one equality per direction at the order's level**, from which
"not its inner parts", `aro`≡`viloyat`, and "a more precise offer still matches" all follow.
**One case is not derivable** — an offer less precise than the order — and it is decision ①.

---

## 9. Resume point — 2026-09-14

> ⚠️ **The 2026-09-13 resume point that stood here was already stale when this session read it** —
> it listed T-102d and T-102e as "next" hours after both had been built. Rewritten, not patched.

**Migrations: RUN.** The owner migrated in `a522a8d`; §5's "NOT RUN" is history.

**Done:** T-102a (rules, 46 tests) · T-102b (three migrations) · **T-102c, all three sub-steps**
(persisted places · no more fake stops · **QFY selection, 2026-09-14**) · T-102d (the scope half) ·
T-102e (the search reads the table) · T-102g (**written and tested, NOT RUN**).

**Left:** **T-102i** (the read side — new, and the one that matters) · T-102f (admin neighbours) ·
T-102g's actual run · T-102h.

### The next step, in order of what unblocks what

1. 🛑 **DEVICE-WALK WHAT IS STACKED UP.** Seven changes are on the device unverified: T-114 ①'s
   re-pin, T-102c 1+2, **T-102c-3 (`docs/PLAN-T102c3.md` §6 — six walks, item 3 is the one no
   checker covers)**, T-102e's search rewrite (**SQL-verified, not DB-verified — it changed the
   passenger's main screen**), T-115's counters, T-116.
2. **Run `npm run backfill:places`** — the REPORT, which writes nothing. Its counts are the
   evidence for whether `--apply` is safe, and reading them is the owner's call.
3. 🔴 **T-102i** — the read side. **Nothing reads a QFY today**, so T-102c-3's data is inert until
   this lands, exactly as T-102c-1's was before T-102e. It carries an open design question about
   where adm3 matching belongs (see the step).
4. **T-102f** — the admin neighbours screen. `yaqin` orders the picker by it and matches nothing
   through it, so this is convenience, not correctness.
