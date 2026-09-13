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
- [ ] **T-102c. The driver wizard collects geo ids.**
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
        1. **persist what is already collected** — write `driver_offer_places` rows from
           `selectedFromCities` / `selectedToCities` instead of into `stops`; keep `from_text`
           for display. This alone deletes the text round trip and the `includes('viloyat')` guess.
        2. **stop faking stops** — a true intermediate stop stays a stop; the fake ones go.
        3. **add adm3 selection** (`endLevel="settlement"`, multi) so `tuman`/`yaqin` can match.
      ⚠️ **`stops` rows written by the old code are indistinguishable from real intermediate
      stops except by comparing their text to the from/to cities** (lines 868-885 already do this
      dance). The backfill (T-102g) must un-pick that, and it is the reason that step is risky.
- [ ] **T-102d. The order sends and stores its scope**, and the passenger app stops relying on
      free text.
- [ ] **T-102e. Rewrite the search** to `WHERE from_<L>_id = :x AND to_<L>_id = :y`, replacing the
      `ILIKE` path. **Keep the text search as an explicit fallback only when an order has no ids**
      (pre-T-102 rows), and say so in the response so the app can label it.
- [ ] **T-102f. Admin: the neighbours screen** — pick a district, tick its neighbours, both rows
      written. ~200 districts to populate; the geo section already has CRUD for all five levels.
- [ ] **T-102g. The backfill.** 🔴 **The riskiest step.** Existing offers have text only. Match it
      to ids where it is unambiguous, leave NULL where it is not, and **report the counts** —
      never guess. An offer left NULL keeps working through the §6e fallback.
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
