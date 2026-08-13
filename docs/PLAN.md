# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-065 moved intact → `docs/PLAN-T065.md`** (steps 1-6 done; the owner's API deploy, driver
> rebuild and the commit remain).
> ✅ **T-066 + T-067** → `docs/PLAN-T066-T067.md`. ✅ **T-061** → `docs/PLAN-T061.md`.
> ✅ **T-059** → `docs/PLAN-T059.md`. ✅ **T-055** → `docs/PLAN-T055.md`.
> ✅ **T-057** → `docs/PLAN-T057.md`. ✅ **T-054** → `docs/PLAN-T054.md`.
> ✅ **T-045** → `docs/PLAN-T045.md`. ✅ **T-024** → `docs/PLAN-T024.md`.
> 🔴 **T-047 PARKED** — killed-app push tap; needs a `logcat` line before more code.
> 🟡 **T-031 — items 5-6 (the payment split) DONE 2026-08-13**, the rest (the waiting-fee **admin**
> setting, steps 8-9) stays parked → `docs/PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own
> `docs/PLAN-T0*.md`; most are waiting on the owner, not on code.

## 🔴 BOARD STATE 2026-08-13 — read before starting anything

**`tsc` BASELINES CHANGED: API 281 · admin 0 · user 9 → 6 · driver 35 → 28.** T-035 removed three
TS1117 duplicate-key errors, T-060 a duplicate export, T-076 three broken social-sign-in calls.
**Every "user 9 / driver 35" written elsewhere is STALE** — compare against **6 / 28**.
✅ **Both RN apps now lint, at 0 errors** (T-060 — they could not run at all before).

**Done 2026-08-13 (all code-complete, none device-tested):** **T-075** (departure *and* arrival
wheels can no longer offer a time the form refuses) · **T-035** · **T-032/T-060** (the lint config) ·
**T-076** (driver social sign-in deleted, owner's call) · **T-031 items 5-6** (payment split).
🔴 **T-031 WROTE A MIGRATION THAT IS NOT RUN** —
`20260813000001-split-passenger-offer-payment-flags.cjs`. **The owner runs it, BEFORE the app
rebuilds.** ⚠️ **T-046's migration is also still queued.**
⚠️ **T-076 removed a native dep + an Expo plugin, so the driver rebuild is mandatory, not JS-only.**

---

## Task
- **ID / name:** T-077 — after sending a ride request, the passenger is shown nothing
- **Goal (definition of "done"):**
  1. **Sending a ride request lands the passenger on the matching driver offers**, filtered to the
     route they just asked for — not `goBack()` to the menu (owner, 2026-08-13, with the
     `K_RegShablon` mockup).
  2. **Each offer card reads like the mockup**: car + fuel, "22:00 da yuramiz", the date with its
     weekday, free seats, and **two separate prices — `Oldi` / `Orqa`** — where a price that does
     not exist is visibly dead rather than missing.
  3. **The route being searched is on screen** (Farg'ona → Toshkent), as in the mockup.
  4. **No class chips** (owner decision — see below). The strip shows the **result count** instead.
  5. `tsc` at baselines: API **281** · admin **0** · user **6** · driver **28**.
- **Why now:** the owner asked for it directly with a mockup. Today the passenger posts a request
  and is returned to the menu with no idea whether anyone is already driving that route — the
  product's whole value is invisible at the one moment it matters most.

## Owner decisions (2026-08-13 — do NOT re-ask)
1. **No vehicle-class chips.** The mockup draws `Hammasi 20+ · Standart 10+ · Comfort 5+ ·
   Biznes 1 · Econom 2`, but **the driver's vehicle has no class field at all** — those five values
   (`standard/comfort/business/econom/tourist`) exist only on **`PassengerOffer.vehicle_class`**,
   i.e. *what the passenger wants*, never *what the driver drives*. There is nothing to filter or
   count. Owner chose to **ship without the chips** and show a result count; the class becomes its
   own later card (migration + driver registration UI + backfilling existing vehicles).
2. **Adapt the existing `SearchOffersScreen`, do not build a second screen.** One list screen,
   reached both from the menu and from the post-request hand-off. (This project already pays for
   duplicated screens — T-042/T-066/T-067.)
3. **Filter by the requested route**, not route + date. Showing other days is better than showing
   nothing.
4. **The ⚡ urgent flash is DROPPED from the design.** `DriverOffer` has no `is_urgent` column and
   the owner declined both adding one and deriving it from the departure time — *"1 soat ichida
   jo'naydi"* would silently mean something the driver never said. Its own card if ever wanted.
5. **The seat-position squares are DROPPED.** The free-seat count (`seats_free`, already built) is
   what the card shows; a per-seat map is a separate, much larger piece of work.

## What is already there (verified 2026-08-13 — do NOT re-derive)

✅ **The screen exists:** `SearchOffersScreen.tsx` (**1709 lines**) — route pickers, a filter modal
(sort / min rating / price range), empty + loading states, pull-to-refresh.
✅ **Both prices already reach the app.** `DriverOffer.price_per_seat` **and
`front_price_per_seat`** are on the model, returned by the search endpoint (`:829`) and already
declared in the app type (`api/offers.ts:14-15`). **`Oldi`/`Orqa` needs NO API work.**
✅ **Route filtering needs NO new API.** `searchOffers()` already accepts `from_province_id`,
`from_city_id`, `to_province_id`, `to_city_id` and `date`.
✅ **Free seats exist** (`seats_free`) — the mockup's `[1] [2] [3]` badge.
✅ **The fuel data exists in the DB**: `DriverVehicle.fuel_types`
(`benzine | metan | propan | electric | diesel`) — exactly the mockup's *Propan / Benzin / Metan /
Electro*.

### The gaps
🔴 **`CreatePassengerOfferScreen:613` calls `navigation.goBack()`** on success. That single line is
the whole of defect ①.
🔴 **Fuel is NOT returned by the search endpoint.** The mapped `vehicle` is
`{ make, model, color, type, license_plate, year }` — no fuel. **This is the only API change in the
card.**
🛑 **The ⚡ urgent flash CANNOT be built: `DriverOffer` has no `is_urgent` column.** `PassengerOffer`
has one; the driver's offer does not. → **open question below, do not invent it.**
🛑 **The little seat-position squares** on two mockup cards have no backing data either → same.

## Approach
Reshape the existing card's footer and header to the mockup, add fuel to the API's vehicle mapping,
and replace the post-create `goBack()` with a hand-off that carries the route. No migration, no new
screen, no class chips.

## Steps
- [x] 1. **DONE 2026-08-13. API returns the fuel type.** `fuel_types` added to the vehicle include's
  `attributes` **and** to the mapper — ⚠️ *both were needed; adding it to the mapper alone would
  have shipped `undefined` for ever, since the column was never selected.*
  🔴 **The whole ARRAY is returned, not a chosen one.** A car here commonly runs on two fuels
  (benzine + propan is the normal Uzbek conversion); picking `[0]` server-side would quietly assert
  something the driver never said. The app joins them (`Benzin · Propan`).
  ✅ **The driver app needed no change** — it does not consume this endpoint's vehicle shape.
- [x] 2. **DONE 2026-08-13. `Oldi` / `Orqa` as two price blocks.** Green when the price exists,
  **grey and visibly dead** when it does not — never `undefined so'm`, and never simply missing,
  which would leave the two prices silently misaligned. `priceOf()` normalises **DECIMAL-as-string**
  (`'150000.00'` — the 2026-08-02 root cause), rejects `0`/negative/garbage and **never returns
  `NaN`**.
- [x] 3. **DONE 2026-08-13. Card header: car + fuel, departure time, weekday date, seats badge.**
  Dates/times formatted **by hand**, weekday names from a translation key — the same reason
  `TimeWindowCard` does it: Android/Hermes locale data is not reliable.
  ⚠️ **The per-card route was REMOVED**, as in the mockup: search needs both provinces before it
  runs, so every result shares one route and it belongs in the header once.
- [x] 4. **DONE — already existed.** T-066 built the result-count seam (`resultsCount` + rule); it
  needed no work. ✅ **Checked before building a second one** — and the key was **already defined**,
  so blindly adding it produced a **TS1117 duplicate** (see the session note).
- [x] 5. **DONE 2026-08-13. The hand-off.** A **new** request now navigates to `SearchOffers`
  carrying the whole `GeoOption` objects (the screen keeps `{id, name}` per level and
  `loadLastSearch` already restores exactly that shape — ids alone would force a re-fetch for names
  the caller already had).
  ⚠️ **EDIT mode still calls `goBack()`** — the passenger came from their own orders list.
  🔴 **The hand-off SKIPS `loadLastSearch`**, which would otherwise overwrite the handed-off route
  with the previous search and land the passenger on the wrong pair having done nothing wrong.
  ⚠️ It hangs off the dialog's **OK**, not a toast (T-057: a toast has no button, so the navigation
  would never fire).
- [x] 6. **DONE 2026-08-13. 80/80, proven able to fail — 21 red.** The card helpers are
  **EXECUTED**, extracted from the real source and type-stripped by `tsc`: 10 price cases
  (DECIMAL-as-string, `undefined`, `''`, `0`, negative, garbage → never `NaN`), 11 fuel cases
  (two fuels joined, empty/absent → `null` so the line is omitted, a non-array, an unknown value
  shown rather than vanishing), and the date/time including **the mockup's exact line
  "25.08.2025 Dushanba"** plus all 7 weekdays proven distinct.
  ✅ i18n **evaluated** in uz/ru/en for all 12 new keys, with `weekdays` asserted to hold **exactly
  7** names — an off-by-one there would mislabel every day silently.
  `tsc` API **281** · user **6** · driver **28**, all at baseline; the 3 errors in the touched
  `DriverOfferService.ts` **proven pre-existing via `git stash`** (same lines, same count).
  Lint **235 = baseline, 0 errors**.
- [ ] 7. **Owner:** deploy the API, rebuild the **user** app, then create a request and confirm the
  offers list appears, filtered to that route, with both prices readable.
- [ ] 8. Commit (only after the owner's approval).

## Files to touch
- `api,admin,db/apps/api/src/services/DriverOfferService.ts` — fuel in the vehicle mapping (step 1)
- `user-app-standalone/api/offers.ts` — the `vehicle` type
- `user-app-standalone/screens/SearchOffersScreen.tsx` — the card + strip (steps 2-4)
- `user-app-standalone/screens/CreatePassengerOfferScreen.tsx` — the hand-off (step 5)
- `user-app-standalone/translations/{uz,ru,en}.ts` — new labels (`Oldi`, `Orqa`, weekdays, count)
- ❌ **No migration.** ❌ **Driver app untouched** unless step 1 needs its type updated.
- ⚠️ **Needs an API deploy** (step 1 only) — it joins the one already queued, so no extra run.

## Risks / open questions (READ before coding)
- ✅ **CLOSED 2026-08-13 — the ⚡ flash and the seat squares are both DROPPED** (owner). Neither had
  backing data. ⚠️ **The card therefore does NOT match the mockup pixel-for-pixel, on purpose** —
  say so when reporting, rather than letting a device test discover it.
- 🔴 **`SearchOffersScreen` is 1709 lines and is reached from the menu too.** Changing the card
  changes what menu users see — that is intended (one screen, owner's decision), but it means this
  card cannot be tested only through the new hand-off path.
- ⚠️ **`front_price_per_seat` is optional and DECIMAL-as-string.** Both facts have bitten this
  project before; step 2 must prove the missing-price case renders, not crash.
- ⚠️ **The mockup is a `Shaharlar aro` (intercity) screen** with a `Qidiruv / Takliflar` tab pair at
  the top. **Those tabs are NOT in this card** — they imply a second data source and were not part
  of the owner's ask. Say so plainly rather than half-building them.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` keeps picking up permission-prompt changes — keep it out of commits.

## Session notes (one line per work session)
- **2026-08-13** — card created from the owner's `K_RegShablon` mockup and grounded the same day.
  **The screen, both prices and the route filter all already exist**; the real work is the card's
  layout plus one `goBack()`. **The class chips were refused on evidence** — the driver's vehicle
  carries no class at all, so they could not be filtered or counted, and the owner chose to ship
  without them. **Two more mockup elements (⚡ and the seat squares) have no data either** and are
  open questions rather than guesses.
- **2026-08-13 (2)** — approved; **steps 1-6 done**. Step 4 turned out to need **no work at all**
  (T-066 had already built the result-count seam) — ⚠️ **and adding its key blindly produced a
  TS1117 duplicate**, i.e. I re-created the exact defect **T-035 fixed three hours earlier in this
  same session**. Caught by `tsc`, removed. *Check whether a key exists before adding it.*
  Also removed two things my own change orphaned (`formatDate`, `currentLanguage`) — **found by the
  new lint run**, which `tsc` does not flag.

## Resume point (for the next chat)
**APPROVED AND STEPS 1-6 DONE 2026-08-13. Only step 7 (owner: deploy the API, rebuild the USER app,
walk it) and step 8 (commit) remain.**

**What changed:** posting a ride request used to end at `goBack()` — the passenger landed on the
menu with no idea whether anyone was already driving their route. It now hands them straight to the
drivers going that way, and the card reads like the mockup: car + fuel, "22:00 da yuramiz",
"25.08.2025 Dushanba", free seats, and **`Oldi` / `Orqa` as two separate prices**.

⚠️ **Deliberately NOT a pixel match**, and it should not be reported as one: **no class chips**
(the driver's vehicle has no class field — nothing to filter or count), **no ⚡ flash**
(`DriverOffer` has no `is_urgent`) and **no seat-position squares** (no data). All three were owner
decisions on 2026-08-13, not oversights.

⚠️ **The screen is reached from the MENU too**, so this changes what menu users see — intended
(one screen, owner's decision), but it means step 7 cannot be walked only through the new path.

**Verification:** **80/80** with the card helpers **executed**, **21 red** against pre-change
behaviour including the owner's complaint as a check. `tsc` API **281** · user **6** · driver **28**,
all at baseline (the 3 in the touched API file proven pre-existing via `git stash`). Lint **235 = 0
errors**. ❌ No migration. ❌ Driver app untouched. ⚠️ **Needs an API deploy** (fuel only) — it joins
the queued one.
