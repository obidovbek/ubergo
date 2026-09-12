# 📋 PLAN — T-102: structured geo matching, so the four order scopes actually differ

> Written **2026-09-12**, after the owner reported that the four `UserBuyurtma*` screens behave
> alike and restated the scope rules. Their specification is in `docs/PLAN-T101-SCOPES.md` §0/§1
> and has been correct and unbuilt since 2026-08-30.
>
> 🛑 **NO CODE UNTIL §4 IS ANSWERED.** Three questions decide the matching semantics, and one of
> them cannot be derived from the rules — guessing it would put the wrong behaviour in front of
> every passenger. **This card also changes the DB schema (rule 4).**

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
| ② | **What does the neighbours table DRIVE for `yaqin`** — the picker, or the search? | **The picker, and validation — not the search filter.** In `yaqin` the destination district list is limited to neighbours of the origin, and an order whose two districts do not border is refused at creation. The SEARCH stays a plain adm3 → adm3 equality. **Reason: a match filter that depends on a 200-row table nobody has populated yet returns nothing and looks broken**, whereas a picker that is empty tells the truth immediately. It also keeps `yaqin` and `tuman` one query. |
| ③ | **Does the DRIVER's offer form have to collect geo ids now?** Today it collects free text. Without ids on the offer side, nothing above works. | **Yes, and it is the bulk of the work.** The wizard already uses `GeoSheet`, so it can return a full path; the offer gains the same 8 columns the passenger order already has. ⚠️ **Existing offers have no ids** — see §6 ⑤ for the backfill, which is the riskiest part of this card. |

---

## 5. 🛑 Migrations (rule 4 — these need explicit approval)

1. **`add-geo-ids-to-driver-offers`** — 8 nullable integer columns on `driver_offers`
   (`from_/to_` × `country_id`, `province_id`, `city_id`, `settlement_id`), FK to the geo tables,
   plus indexes on `(from_city_id, to_city_id)` and `(from_settlement_id, to_settlement_id)`.
   **Nullable on purpose**: every existing row has none, and a NOT NULL would fail the migration.
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

- [ ] **T-102a. The rules, pure, before any query.** `utils/geoMatch.ts` in the API —
      `matchLevelFor(scope)`, `matchesOrder(order, offer, scope)`, `validateScope(order)` (same
      province / same district / bordering districts), `precisionOf(offer, level)` for the ① tag.
      A `*.test.ts` beside it (the API HAS a test runner), **proven able to fail by mutation**.
- [ ] **T-102b. The three migrations** (§5), each reversible, run on a copy of test3 first.
- [ ] **T-102c. The driver wizard collects geo ids** — `GeoSheet` path → the 8 new columns,
      with `from_text`/`to_text` still written for display and for old clients.
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

### 2026-09-12 — planned; no code

Owner re-confirmed the scope model and approved proceeding. The matching logic was derived rather
than assumed: it reduces to **one equality per direction at the order's level**, from which
"not its inner parts", `aro`≡`viloyat`, and "a more precise offer still matches" all follow.
**One case is not derivable** — an offer less precise than the order — and it is decision ①.
