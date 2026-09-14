# 📋 PLAN — T-102c sub-step 3: the driver names a QFY

> Split out of `docs/PLAN-T102.md` §6 on **2026-09-14**, because the one-line step there
> (*"add adm3 selection (`endLevel="settlement"`, multi)"*) turned out to rest on two claims
> that measuring contradicted. T-102's resume point stays `PLAN-T102.md` §9.
>
> **Owner decisions taken 2026-09-14** — §3. ✅ **PLAN APPROVED AND BUILT THE SAME DAY.**
> All six steps are done; every baseline came back identical. **Nothing has run on a device** —
> §6's six walks are the honest test, and item 3 is the one no checker can cover.

---

## 1. Why this step exists

`tuman` (*Tuman ichi*) and `yaqin` (*Yaqin*) match at **adm3**. The passenger side already speaks
adm3 end to end — `LocationCard` opens `GeoSheet` with `endLevel="settlement"`, and
`from_settlement_id` / `to_settlement_id` are collected, sent, stored and indexed on
`passenger_offers`. **The driver side cannot name a QFY at all**: the wizard opens the sheet with
`endLevel="district"` and the word *settlement* appears **zero** times in its 1 955 lines.

So every row the wizard has written since T-102c-1 carries `settlement_id` NULL, which
`LOOSE_PARENT_MATCH` reads as *"anywhere in this district"* — district precision wearing an adm3
label. This step is what makes an **exact** adm3 match possible at all.

---

## 2. Measured 2026-09-14, before touching anything

### 🟢 The API is already finished for this — it is a CLIENT-ONLY step

| piece | state |
|---|---|
| `OfferPlaceData` (`DriverOfferService.ts:60`) | ✅ `= GeoPathIds`, which includes `settlement_id` |
| `writeOfferPlaces` | ✅ persists it (`:551`), dedupes on `` `${city}:${settlement}` `` (`:527`) |
| unique index | ✅ `(offer, direction, city, COALESCE(settlement, 0))` — a district tick and a QFY tick overlapping is *expected* and folded, not an error |
| `DriverOfferPlace` model | ✅ column, association, returned on both driver-side reads |
| `CreateOfferPlaceData` (client, `api/driverOffers.ts:41-46`) | ✅ already declares `settlement_id` |

**Nothing on the server changes in this step.** That is worth saying plainly, because §6's
one-liner reads like it might.

### 🔴 The artboard does NOT draw a QFY picker — §4 ③ overstated it

`PLAN-T102.md` §4 ③ says the artboard's `toggleAdm2` / `toggleAdm3` show *"a SET of districts and
a SET of QFYs per direction"*. Measured in `htmlDesign/DriverElon.dc.html`:

- the place sheet has **two steps**: `"1/2 · Viloyat (Adm1) tanlang"` → `"2/2 · … bir nechta tuman
  (Adm2) tanlang"` (`:1207-1208`);
- `sheetItems` is built for `sheetStep === 1` and `=== 2` **only** (`:1082-1095`);
- `sheetNext()` checks the districts and calls `confirmPlace()` immediately (`:1788-1791`) — there
  is no step 3;
- **`toggleAdm3` (`:1783`) has zero callers**, and the sample offer has `adm3s: []`.

What the artboard *does* have, and what is therefore real design input:

1. **the data model** — `tmpAdm3s` is a list of `"<tuman> / <QFY>"` keys, and `toggleAdm2`
   **filters out QFYs whose district was just unticked** (`:1780`). That is a rule, and it is the
   one this step must not forget.
2. **the display** — each endpoint is two lines (`:1070-1074`):
   `line 1 = "<viloyat>, <tuman, tuman>"`, `line 2 = "<QFY · QFY> — <mo'ljal>"`. So the QFYs go
   on the **second** line, beside the landmark note, and never into the primary place line.

⚠️ **So this is not "build what the artboard draws" — it is new UI whose data model and display
the artboard settles, and whose picker it does not.** Treat any further artboard claim about adm3
as unbacked (**T-107** / **T-110** are where those live).

### 🔴 Nothing will read `settlement_id` when this lands

- `getPublicOffers` builds its geo filter from `from_city_id` / `from_province_id` only
  (`DriverOfferService.ts:1021-1058`) — `PlaceLevel` has a `'settlement'` member and **no caller
  ever passes it**.
- `SearchOffersScreen.tsx:293-294` sends `from_province_id` + `from_city_id`. The passenger's
  **search** screen stops at adm2; only the **order** form goes to adm3.
- `matchesOrder`, `matchLevelFor`, `matchPrecision`, `hasMatchableIds`, `validateScope` and
  `neighborsFirst` — the whole matching half of `utils/geoMatch.ts` — have **zero consumers** in
  the API. Only `validateOfferPlaces` and `isOrderScope` are called.

**`PLAN-T102.md` §6 has no step for the read side.** T-102e rewrote the *search* (adm2); nothing
yet matches an *order* to an offer at its scope's level. Boarded in step 6 below as **T-102i**.

🛑 **Consequence, stated up front: after this step, picking a QFY changes nothing a passenger
sees.** Same position T-102c-1 was in before T-102e. The owner chose this ordering knowingly.

### The shared sheet, as it stands

`components/geo/GeoSheet.tsx` (driver, 470 lines) — `multiSelectAt?: GeoLevel`, **one** level,
and the multi-selection is hardcoded to districts in three places: the `picked` initialiser
(`:113`), the re-arm effect (`:120`) and `confirmPicked` (`:200`, which writes `districts` and
calls `onDone` unconditionally). `load()` fetches settlements from `p.district` — **one** district.

⚠️ **The user app's `GeoSheet` is a different file (319 lines) with no `multiSelectAt` at all** —
a passenger's endpoint is one path, so there is no twin defect to fix here. Checked deliberately:
fixing one app and walking past its twin is this project's most repeated defect.

---

## 3. 🛑 Decisions (owner, 2026-09-14)

| # | question | decision |
|---|---|---|
| ① | How far does QFY selection go? | **Only when the endpoint names exactly ONE district.** The QFY step appears after the district step only when one district is ticked; ticking a second clears the QFYs. A multi-district endpoint keeps meaning *"anywhere in these districts"* and still matches `tuman`/`yaqin` orders through `LOOSE_PARENT_MATCH` at `'district'` precision — **nothing is lost, only extra precision on corridor offers.** Reversible: the rows already carry district **and** settlement, so the grouped variant can be added later with no data change. |
| ② | Build the read side too? | **No — write side now, board the read step.** → **T-102i**, §6 step 6. |

### Assumptions I am making rather than asking (say so if either is wrong)

- **`from_text` / `to_text` do not change.** They keep holding the district-level line. The QFYs
  render as the row's second line, which is exactly what the artboard does. Rewriting the stored
  text would change what every *other* screen displays (`MyRidesScreen`, passenger cards, pushes)
  for a step that is meant to add ids.
- **The QFY is optional.** A city-to-city driver has no QFY to give, and `validateOfferPlaces`
  requires a district per side, never a settlement. The footer therefore confirms at zero QFYs —
  and only at that level; the district level still refuses zero, as it does today.

---

## 4. Steps

- [x] **c3-1. The rules first, pure and executable.** `utils/offerRestore.ts`:
      `buildOfferPlaces` takes the picked settlements and emits **one row per (district, QFY)**,
      or one row with a null settlement when there are none; `canPickSettlements(districts)`
      (exactly one — decision ①).
      🔴 **`keepSettlementsForDistricts` WAS PLANNED AND NOT BUILT, deliberately.** The plan
      wanted the artboard's `toggleAdm2` filter — *drop the QFYs whose district went away*. But
      a settlement `GeoOption` carries **no parent id** (`{id, name, latitude, longitude, type}`);
      the sheet only knows a QFY's district because it fetched it from that district. Under
      decision ① the filter therefore collapses to *"any change to the district set clears the
      QFYs"*, which is one line in the sheet and has nothing to filter. **What replaced it is
      stronger**: `buildOfferPlaces` DROPS the QFYs itself whenever the endpoint names ≠ 1
      district, so the payload cannot lie even if the sheet does. A filter would have guarded
      the UI; this guards the wire.
      🔴 **This is where decision ① lives**, not in the component. A rule inside a component is a
      rule no checker here can execute — the lesson `mergeScopeRoot` cost on T-114.
      ⚠️ `check-offer-restore.mjs` currently asserts *"places: never names a settlement — the
      wizard cannot pick one yet"*. **That assertion is this step's marker: it must be replaced,
      not deleted quietly.** Extend to ~60 assertions and prove red on mutations (QFY row losing
      its district · an orphan QFY surviving its district · two districts still offering QFYs ·
      zero QFYs collapsing to no row at all instead of one null row).
- [x] **c3-2. `GeoSheet` gains an optional QFY step.** `multiSelectAt?: GeoLevel | readonly
      GeoLevel[]` (normalised internally, so today's string callers are untouched); `picked`
      becomes per level; `GeoPath` gains `settlements?: GeoOption[]`; `confirmPicked` **advances**
      to the next level instead of finishing when `level !== endLevel` **and**
      `canPickSettlements` says so — otherwise it finishes exactly as today.
      The `pick()` descendant-clearing already drops a deeper multi-selection when a shallower
      level changes; it must now clear **every** multi-select level below the one that moved.
      ⚠️ **Back-compat is the risk.** `SearchPassengerOffersScreen` and the wizard's own stop rows
      pass `endLevel="district"` and must behave identically — verified by reading, and by the
      stop-row case in c3-3.
- [x] **c3-3. The wizard holds, swaps and sends them.** `selectedFromSettlements` /
      `selectedToSettlements`; threaded through `applyGeoPath`, `geoSheetInitialPath` and
      `swapEndpoints` (the comment there — *"swaps the geo selections AND the persisted text
      together"* — is precisely the trap: a swap that forgets the QFYs leaves them on the wrong
      end); `handleSave` passes them to `buildOfferPlaces`.
      🔴 **The stop rows share this one sheet.** They write no places, so a QFY collected for a
      stop would be silently dropped — the sheet is opened with
      `endLevel={geoSheet?.endpoint === 'stop' ? 'district' : 'settlement'}`.
- [x] **c3-4. The edit path reads them back.** `loadSideFromPlaces` currently resolves country,
      province and districts and **discards `place.settlement_id`**; it fetches the settlements of
      the single district and returns them.
      🛑 **This is the T-078 failure mode the whole module exists for**: a field that saves but
      never loads back means the next save silently blanks it. c3-3 without c3-4 ships exactly
      that — a driver opens their own offer, presses save, and loses the QFYs they never touched.
      **The two are not separable and will not be split.**
- [x] **c3-5. The row shows them.** `RouteEndpointSection` renders the QFY names as the endpoint's
      second line, to the artboard's shape (`QFY · QFY`), above the existing landmark field.
      New sheet strings follow `GeoSheet`'s own convention — it is not wired to `t()` and its
      strings are inline Uzbek (`'Qidirish'`, `'Tayyor'`); any string that lands in a `t()` file
      gets its three locales and goes into `check-offer-i18n.mjs`'s file list. **Evaluate the
      locale files, never grep them** — `to'ldi` / `e'lon` is how the apostrophe trap bites.
- [x] **c3-6. Verification, board, docs.** Baselines below; `PLAN-T102.md` §6 corrected (§4 ③'s
      artboard claim) and **T-102i boarded** — *the search matches at an order's scope level*:
      `getPublicOffers` accepting `from_/to_settlement_id`, `LOOSE_PARENT_MATCH` expressed in SQL,
      and the response saying which path matched so the card can show "district-level"
      (T-102e explicitly deferred that label to here). `docs/TODO.md` + `docs/JOURNAL.md`.

---

## 5. What this step does NOT do

- ❌ **No server change.** See §2.
- ❌ **No QFY across several districts** (decision ①). The grouped picker stays unbuilt; the row
  shape already supports it.
- ❌ **No read side** (decision ②) — → **T-102i**.
- ❌ **No touch to `from_text` / `to_text`**, and no touch to `resolveEndpointSelection`.
- ❌ **Nothing in the user app.** Its `GeoSheet` is a different, single-select file.

---

## 6. Verification

**Baselines measured 2026-09-14, before any edit:** driver `tsc` **28** · lint **0 errors / 275
warnings** · design tokens **3** · `check-offer-restore.mjs` **49 assertions** · **11 checkers**.
API untouched: `tsc` **281** · **357 tests**.

Every one must come back identical except the restore checker, which grows. `tsc` errors are
compared as a **set** (`git stash` to prove a survivor is pre-existing), never as a count.

🛑 **What no checker can cover, and what therefore has to be walked on a device:**

1. One district → the QFY step appears → tick two QFYs → save → reopen: **both come back.**
2. Save with the QFY step **skipped** → reopen: the endpoint is unchanged and still one district.
3. Tick a **second** district after choosing QFYs: **the QFYs must clear.** If they survive, the
   offer claims a precision in a district the driver never picked — and nothing throws.
4. **Swap ⇅** with QFYs on one end only: they must travel with their end.
5. A **stop** row: it must still stop at the district and never offer a QFY.
6. An offer created **before** this step: opens exactly as it does today.

---

## 7. Risks

- 🔴 **c3-3 without c3-4 silently blanks a driver's QFYs on their next save.** Named in c3-4; the
  reason the two ship together.
- 🔴 **`GeoSheet` is shared by three call sites in one render** (from · to · every stop) and by
  `SearchPassengerOffersScreen`. The multi-select generalisation is where a regression would land,
  and it would land on the busiest screen in the app.
- ⚠️ **The sheet's re-arm effect depends on `initialPath`**, which the wizard builds fresh in
  render (`initialPath={geoSheetInitialPath()}`). Any parent re-render while the sheet is open
  resets the in-progress selection. It is unreachable today (the modal covers the form's inputs),
  but this step adds a second level of in-sheet state to lose. **Noted, not fixed** — touching it
  is how T-114's empty-picker class of bug happens.
- ⚠️ **Steps 15-18, 14b, T-114 ①, T-102c 1+2, T-102e and T-115 are all on the device unverified.**
  This adds a seventh.

---

## 8. Session note — 2026-09-14, built

**All six steps done.** Baselines came back identical: driver `tsc` **28** (proved the same SET,
not just the same count, by stashing only the five touched files) · lint **0 errors / 275
warnings** · design tokens **3/3** · **11 checkers green** · `check-offer-restore.mjs` **49 → 60
assertions**, **red on all 7 mutations** (6 by assertion, m5 by crashing at `city.id` — a crash
reached only through the new primary-anchor case). API untouched.

### What the shape of the code turned out to be

- **`GeoSheet` does not know the rule, and that is on purpose.** Whether an endpoint may name a
  QFY is an *offer* rule; this is a geo picker a search screen also uses. So the sheet gained
  `canAdvance?: (picked, level) => boolean` and the wizard injects `canPickSettlements` from
  `utils/offerRestore.ts`, where the checker can execute it. The alternative — importing an
  offer module into a shared component — is how a picker acquires opinions it should not have.
- **`confirmPicked` now CONFIRMS or CONTINUES.** That one change is the whole QFY step: when the
  caller asked for a deeper level and `canAdvance` agrees, the multi-selection is written onto
  the path and the cascade carries on into it. Both other call sites pass no `multiSelectAt` and
  `endLevel="district"`, so they take the identical path they always did.
- **`multiSelectAt` accepts a list now**, and a plain string still means what it meant.

### 🔴 Three things found by reading the diff, which no baseline would have caught

1. **The toggle was derived from the render's `picked`, not from `current`.** Two taps landing in
   one batch would both start from the same snapshot and the second would drop the first — a
   toggle list quietly losing a tick. Fixed inside the updater.
2. **A stop row shares this one sheet.** Stops write no `driver_offer_places`, so a QFY collected
   there would have been gathered, displayed, and then dropped on save with nothing to say it had
   gone. The sheet opens at `endLevel="district"` for stops.
3. **`applyGeoPath` had to read `path.settlements ?? []`, not skip when the key is absent.** The
   sheet omits `settlements` entirely when the endpoint ends up naming two districts; a merge
   would have let a previous edit's QFYs survive into a district the driver has just widened away
   from. Replace, never merge — the same rule `writeOfferPlaces` follows on the API.

### ⚠️ Found and NOT fixed — boarded instead

**`GeoSheet` is not localised at all.** Every string in it is inline Uzbek — `'Qidirish'`,
`'Tayyor'`, `'Topilmadi'`, `"Ro'yxat bo'sh"`, `'Qayta urinish'`, `'Ortga'`, `'Yopish'` — and the
`'Butun tuman'` this step added follows the file rather than fixing it (CLAUDE.md rule 7). The app
ships in three languages and this sheet is on the busiest screen in it. → **T-117**.

---

## 9. Resume point — 2026-09-14

✅ **CODE COMPLETE. 🛑 NOT RUN ON A DEVICE.** The six walks in §6 are the test; **item 3 (ticking a
second district must clear the QFYs) is the one no checker covers** — if it fails, the offer
claims a precision in a district the driver never picked, and nothing throws.

**Next after the walk:** **T-102i** — the read side, without which none of this is visible.
