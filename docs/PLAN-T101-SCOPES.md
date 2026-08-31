# 📍 T-101 — the four order scopes, and what the API can actually do

> Written 2026-08-30 during T-101 step 1a, after the owner explained that the four
> `UserBuyurtma*` artboards are **not duplicates** but four **search scopes**.
> Everything here was read from the code, not inferred.

## 1. What the owner said (2026-08-30)

The hierarchy is:

| level | Uzbek | API model |
|---|---|---|
| adm0 | davlat | `GeoCountry` |
| adm1 | viloyat | `GeoProvince` |
| adm2 | tuman | `GeoCityDistrict` |
| adm3 | QFY / mahalla | `GeoSettlement` |

And the four screens are four scopes:

| screen | user picks | **matches on** | meaning |
|---|---|---|---|
| `UserBuyurtma` | adm1 + adm2 → adm1 + adm2 | **adm2 → adm2** | Viloyatlar aro (between regions) |
| `UserBuyurtmaViloyat` | adm1 once, then adm2 | **adm2 → adm2**, *not inside it* | Viloyat ichi (within one region) |
| `UserBuyurtmaTuman` | adm1 + adm2 once, then adm3 | **adm3 → adm3** | Tuman ichi (backend searches deeper) |
| `UserBuyurtmaYaqin` | adm1 + adm2 + adm3 both sides | **adm3 → adm3** | two bordering districts, **across different regions** |

**The UI difference exists to save the passenger re-picking what is already known** — not because
the forms differ. Owner: *"frontend yengilligi uchun … ikki marta qidirmasligi uchun."*

## 2. ✅ CONFIRMED IN THE ARTBOARDS

`sheetStep` is the level the address picker opens at — it encodes the pre-locking exactly:

| artboard | `openFrom` |
|---|---|
| `UserBuyurtma` | `sheetStep: 1` |
| `UserBuyurtmaViloyat` | `sheetStep: 2, tmpAdm1: st.viloyat` |
| `UserBuyurtmaTuman` | `sheetStep: 3, tmpAdm1: st.viloyat, tmpAdm2: st.tuman` |
| `UserBuyurtmaYaqin` | `sheetStep: 1` |

`Yaqin` opens at step 1 like `UserBuyurtma` — its difference is **validation and match depth**, not
the picker. Its diff against `UserBuyurtma` is mechanical and consistent: every
`adm1 && adm2` test becomes `adm1 && adm2 && adm3`.

**Two artboards declare the match level outright:**

```
UserBuyurtma       orderType: "Shaharlar aro"                matchLevel: "adm2"
UserBuyurtmaYaqin  orderType: "Tumandagi yaqin hududlar"     matchLevel: "adm3"
```

🔴 **`UserBuyurtmaViloyat` and `UserBuyurtmaTuman` declare NO `matchLevel` at all.** They are
visually complete but never say what the backend should match on. The owner's message supplies the
answer (**adm2→adm2** and **adm3→adm3**); it is recorded here because **it exists nowhere in the
artboards** and would otherwise be lost.

## 3. 🛑 WHAT THE API CAN DO TODAY — the blocking finding

### 3.1 ✅ RESOLVED 2026-08-30 — it is FOUR levels, not six. The owner asked me to settle this.

I first reported "six levels". **That was wrong, and reading the foreign keys disproves it.**
The parent column of each model:

| model | parent FK | ⇒ depth |
|---|---|---|
| `GeoCountry` | — | adm0 |
| `GeoProvince` | `country_id` | adm1 |
| `GeoCityDistrict` | `province_id` | adm2 |
| `GeoAdministrativeArea` | **`city_district_id`** | adm3 |
| `GeoSettlement` | **`city_district_id`** | adm3 |
| `GeoNeighborhood` | **`city_district_id`** | adm3 |

**The last three are SIBLINGS, not descendants** — all three hang off `city_district_id`. So the
schema is exactly the owner's four levels, with **three different kinds of adm3**.

The admin panel's own Uzbek labels (`apps/admin/src/utils/translations.ts:160-183`) name them:

| model | admin label | meaning |
|---|---|---|
| `GeoAdministrativeArea` | **Ma'muriy hududlar** | administrative areas |
| `GeoSettlement` | **Aholi punktlari** (+ a `type` column, "Turi") | populated places — shahar / qishloq / **QFY** |
| `GeoNeighborhood` | **Mahallalar** | mahallas |

🟢 **DECISION (mine, as the owner delegated): `adm3 = GeoSettlement`.** Three reasons, in order of
weight:
1. **The owner's own words were "adm3 qfy ap"** — QFY (qishloq fuqarolar yig'ini). `GeoSettlement`
   is the only one of the three carrying a **`type`** discriminator, which is exactly where a QFY /
   shahar / qishloq distinction lives. The other two have no type column.
2. **`PassengerOffer` already chose it.** Its structured columns are
   `from_settlement_id` / `to_settlement_id` — **not** area or neighborhood. Whoever built the
   passenger side made this same call, and matching it keeps both sides consistent.
3. **`GeoNeighborhood` (mahalla) is finer than a QFY** and would over-constrain matching; a
   passenger asking for a district-level ride should not be matched at mahalla precision.

⚠️ **`GeoAdministrativeArea` and `GeoNeighborhood` stay in the schema and the admin panel**, unused
by ride matching. They are not dead — they are simply not the matching level. **Do not delete them.**

### 3.2 🔴 `DriverOffer` HAS NO GEO COLUMNS AT ALL

Every field on `src/database/models/DriverOffer.ts` was listed. The location fields are:

```
from_text: string      from_lat / from_lng    (nullable)
to_text:   string      to_lat   / to_lng      (nullable)
```

**That is all.** No `from_province_id`, no `from_city_id`, no settlement — nothing structured.

### 3.3 🔴 SEARCH IS A SUBSTRING MATCH ON A FREE-TEXT STRING

`DriverOfferService.ts:812-839`:

```ts
whereConditions.push({ from_text: { [Op.iLike]: `%${city.name}%` } });
whereConditions.push({ from_text: { [Op.iLike]: `%${province.name}%` } });
```

Matching is `ILIKE '%name%'` against a human-typed string. **There is no notion of a level**, so
adm2→adm2 and adm3→adm3 cannot be expressed, and "match adm2 but do **not** search inside it" —
the rule that separates *Viloyat ichi* from *Viloyatlar aro* — **is not representable at all.**

### 3.4 ⚠️ `PassengerOffer` is better, but its columns are dead

`PassengerOffer` **does** carry structured geo:

```
from_country_id  from_province_id  from_city_id  from_settlement_id  from_landmark
to_country_id    to_province_id    to_city_id    to_settlement_id    to_landmark
```

🔴 **But no search code reads them.** Grepping `PassengerOfferService` and `OfferPassengerService`
for `province_id` / `city_id` / `settlement_id` in any `where` clause returns **nothing**. The
columns are written and never queried — so the passenger side is *half* built: the storage exists,
the matching does not.

**Note the asymmetry:** the passenger offer has 4 structured levels per endpoint; the driver offer
has none. A passenger↔driver match therefore cannot be done on ids even in principle today.

## 4. ⛔ Conclusion — this is NOT a UI merge

> **The four scopes cannot be delivered by merging four screens.**
> Three of the four match rules have no backend that can execute them.

| scope | UI mergeable? | API ready? |
|---|---|---|
| Viloyatlar aro (adm2→adm2) | ✅ | ⚠️ only as a text `ILIKE`, not a level |
| Viloyat ichi (adm2→adm2, not inside) | ✅ | 🔴 **no** — "not inside" is unrepresentable |
| Tuman ichi (adm3→adm3) | ✅ | 🔴 **no** — no adm3 on `DriverOffer` |
| Yaqin (adm3→adm3, cross-region) | ✅ | 🔴 **no** — same |

**T-101 is a presentation-only card by the owner's own scope rule** (*"No backend/API change"*).
The scope work is therefore **a separate card**, and it is the larger of the two.

## 5. Recommendation

1. **Board a new card — `T-102`: structured geo matching for offers.** Add
   `from_/to_{country,province,city,settlement}_id` to `DriverOffer` (migration), backfill from
   `from_text` where possible, teach search to match at a requested level, and add the "match at
   this level, do not descend" rule. **This is the card that makes the four scopes real.**
2. **T-101 step 8 builds the four modes as UI only**, sending `matchLevel` in the request, and the
   API ignores it until T-102 lands. The screens will look right and behave like today's search.
   **Say this plainly to the owner rather than letting it look finished.**
3. **Ask the owner which Geo model is adm3** — `GeoSettlement` or `GeoAdministrativeArea`. Guessing
   here would put a wrong foreign key in a migration, which is expensive to undo.

## 6. Open questions for the owner

1. ✅ **RESOLVED 2026-08-30 by the owner's delegation — `adm3 = GeoSettlement`.** See §3.1 for the
   evidence and the reasoning. `GeoAdministrativeArea` (Ma'muriy hududlar) and `GeoNeighborhood`
   (Mahallalar) are siblings at the same depth and are **not** used for ride matching.
2. **`PassengerOffer` already has the id columns and nothing reads them.** Was that abandoned work,
   or is something else meant to use them? *(Not blocking — T-102 will use them either way.)*
3. **Confirm T-102 is wanted** before T-101 reaches step 8 — otherwise step 8 ships four screens
   that all behave identically, which will look like a bug.
4. ✅ **RESOLVED 2026-08-30 — the owner chose option (b): a NEIGHBOURS TABLE.**
   *"'Yaqin' means two bordering districts is a neighbours table."*
   Adjacency is **explicit data**, not a computed radius and not "same province". This is the right
   call for Uzbekistan's geography — a centroid-distance rule would call two districts separated by
   a mountain range "near", and "same province" is not bordering at all.

   **Design for T-102** (not built in T-101 — this card is presentation-only):
   - Table **`geo_district_neighbors`**: `(city_district_id, neighbor_city_district_id)`, both FK to
     `geo_city_districts`, `PRIMARY KEY (city_district_id, neighbor_city_district_id)`.
   - 🔴 **Adjacency is SYMMETRIC and the database will not enforce that for you.** Either write both
     rows on every insert, or store one row with `CHECK (city_district_id < neighbor_city_district_id)`
     and query both directions with a `UNION`. **Pick one and write it on the migration** — a
     half-populated symmetric table means A finds B but B does not find A, which presents as
     "sometimes the search works", the worst kind of bug to chase.
   - 🔴 **Add `CHECK (city_district_id <> neighbor_city_district_id)`** — a district must not be its
     own neighbour, or *Yaqin* silently degenerates into *Tuman ichi*.
   - **Admin panel needs a maintenance screen** (~200 districts to populate). The geo section already
     has CRUD pages for all five levels, so this follows the existing pattern.
   ⚠️ **Until the table is populated, `Yaqin` returns nothing** — that is correct behaviour, not a
   bug, but the screen needs a real empty state saying so rather than an empty list.
