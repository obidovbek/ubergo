# 🎯 PLAN — T-018 (PARKED mid-task, resume after T-025)

> ⚠️ **Moved out of `docs/PLAN.md` on 2026-08-03**, intact, so the small T-025 card could use it.
> **T-018 is still live at step 9** — everything below is current. Resume from the **Resume point**
> at the bottom once T-025 lands. T-025 step 1 is the geo import that blocks step 9 here.

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **Parked (implemented, awaiting owner device test):**
>
> - T-011 (OR-001 OTP resume) · T-012 (OR-002 deleted-user logout) · T-014 (OR-004) ·
>   T-015 (OR-005) — committed earlier.
> - T-016 (OR-006 resume half-finished registration) — committed as `2a76e12`; needs the API
>   deployed to test3 + device test.
> - T-017 (driver-app infinite profile-check loop) — code complete and **committed by the owner in
>   `a1ecedd`** (4 files: `AuthContext.tsx`, `RootNavigator.tsx`, `DriverTaxiLicenseScreen.tsx`,
>   new `utils/driverProfileEvents.ts`). Only the device test is left.
>   Full write-up: `docs/JOURNAL.md` 2026-07-28 entry.

## Task

- **ID / name:** T-018 (owner request OR-007) — rebuild the **intercity order ("zakaz") screen**
  in the user app to match the Figma design, end-to-end (schema → API → UI → driver-app views).
- **Design refs:** `figma_images/K_buyurtma001Yangi.png` (main screen),
  `figma_images/004Shaharlar aro K3 Tanlov oynasi.png` (route/time popup), Figma `Ubex102025`.
- **Goal (definition of "done"):** A passenger can fill the new order form exactly as in the
  Figma — route + times in a separate popup, gendered seat steppers, payment type, vehicle
  class/type, all flags, landmark texts, optional special-order panel — submit it, see it in
  "My offers", and a driver sees the new fields on the offer. Works identically on different
  screen sizes. Verified on a device by the owner.
- **Why now:** Owner request OR-007 (2026-07-28), listed first with the most detail. Owner chose
  it as the active task (AskUserQuestion, 2026-07-28).

## Owner decisions already taken (2026-07-28 — do NOT re-ask)

0. **The migration is applied on test3 at deploy time, not locally** (owner, 2026-07-28). No
   local Docker/DB run — write the API and app code against the schema on paper.
1. **T-018 first**; T-019 (registration redesign) and T-020 (vehicle usage) wait in Next.
2. **DB migrations approved in principle** — the concrete migration below still lands only with
   this plan's approval (CLAUDE.md rule 4 satisfied).
3. **Special order is data-only**: build the full panel and save the prices, show "pullik",
   charge nothing. Real payment stays with T-006.

## Current state (checked in code 2026-07-28)

- `CreatePassengerOfferScreen.tsx` (1726 lines): inline country→province→city cascade, single
  date+time, seats count, max price/seat, 3 booleans (front_seat, pets, large_baggage), note.
- `passenger_offers` model/table only has those fields — **everything else in the Figma is new**.
- Geo hierarchy has a 4th level server-side: `GET /geo/city-districts/:id/settlements`
  (`geo.routes.ts:18`), backed by `geo_settlements`. The app's `api/geo.ts` never consumes it —
  the popup's third box ("Vodil", "S1/S2 mavzolar") is exactly this level.
- `users.promo_code`/`referral_id` (needed later by T-019) already exist — unrelated here.

## Approach

Additive schema (all new columns nullable / defaulted → old clients keep working), then API,
then the app UI in Figma order, then driver-app display. Discrete columns for anything a driver
will filter on; JSONB for composite structures (seat breakdown, special order). No new
dependency. Country stays auto-selected Uzbekistan and hidden from the UI (OR-004 precedent).

### Data model (the migration — one file, additive only)

`passenger_offers` new columns:
| Column | Type | Meaning (Figma element) |
|---|---|---|
| `is_urgent` | BOOLEAN NOT NULL DEFAULT false | ⚡ hoziroq (srochno) |
| `depart_until` | TIMESTAMPTZ NULL | end of departure window (`start_at` = its start) |
| `arrive_from`, `arrive_until` | TIMESTAMPTZ NULL | arrival window "yetib borish vaqti" |
| `from_settlement_id`, `to_settlement_id` | INTEGER NULL → `geo_settlements` | 3rd cascade level |
| `from_landmark`, `to_landmark` | VARCHAR(255) NULL | mo'ljal fields |
| `payment_type` | VARCHAR(20) NULL | 'cash' \| 'click_payme' \| 'friend_pays' |
| `payer_phone` | VARCHAR(20) NULL | friend's (possibly foreign) number |
| `seat_counts` | JSONB NULL | `{front_male, front_female, back_male, back_female}` |
| `seat_position_any` | BOOLEAN NOT NULL DEFAULT false | "farqi yo'q (orqa/oldi)" |
| `salon_scope` | VARCHAR(20) NULL | 'whole_salon' \| 'back_salon_full' |
| `vehicle_class` | VARCHAR(20) NULL | 'standard' \| 'comfort' \| 'business' \| 'econom' \| 'tourist' |
| `vehicle_types` | JSONB NULL | subset of `["minivan","damas","microbus"]` (unused by the new UI) |
| `woman_in_car` | BOOLEAN NOT NULL DEFAULT false | "Ayol kishi bor avto" |
| `roof_rack_needed` | BOOLEAN NOT NULL DEFAULT false | "Tom bagajnik kerak" |
| `trailer` | BOOLEAN NOT NULL DEFAULT false | "Pritsept/yukxona" |
| `road_pickup` | BOOLEAN NOT NULL DEFAULT false | "pitakka/yo'lga chiqib turaman" |
| `road_pickup_note` | TEXT NULL | its free text |
| `special_order` | JSONB NULL | `{price_front, price_back, price_back_salon, price_whole_salon, review_driver_offers, fixed_price, waiting_fee_per_min, free_waiting_min}` |

Plus **one relaxation**: `ALTER COLUMN max_price_per_seat DROP NOT NULL`. The Figma's regular
flow has **no price field at all** — prices exist only inside the special order — so new-app
submissions carry no `max_price_per_seat`. Old clients still send it; the service validates it
**only when provided** (`PassengerOfferService.validateOfferData`, currently throws on ≤ 0).

Existing fields keep their meaning: `front_seat`→superseded by `seat_counts` but left in place;
`pets` = kuchuk/mushuk; `large_baggage` = bagaj bor; `note` = qo'shimcha ma'lumot;
`seats_needed` = total (sum of `seat_counts`, kept for old list screens/filters).
VARCHAR + app-level validation instead of Postgres enums — cheap to extend, no enum migrations
later (the `vehicle_usage_type` enum pain in T-020 is the cautionary tale).

### UI structure (user app)

- **`RouteTimeModal`** (new, image 2): From block (province → city/district → settlement
  cascade, settlement optional; landmark text + pin), urgent toggle, departure date + time
  window; To block (same); arrival date + window. Opens from the route summary card. Reuses the
  existing dropdown-modal pattern.
- **Main screen** (image 1, top→bottom): route summary card (tap → modal) · payment row (Naqd /
  Click-Payme / Do'stimga + phone with country code) · seat steppers (old/orqa o'rindiq, "+"
  opens a small Erkak/Ayol chooser, green total badge = sum) · farqi yo'q · salon radios ·
  class radios · vehicle-type checkboxes · flag checkboxes · pitak section (checkbox + text +
  pin) · qo'shimcha ma'lumot · **Buyurtma berish** · **Maxsus buyurtma berish** expanding the
  special panel (prices per position, "xaydovchilar taklifini ko'rib chiqaman", o'zgarmas narx,
  kutish so'm/min, free-10-min note, its own submit).
- New small components in `user-app-standalone/components/passengerOffer/` (RouteTimeModal,
  SeatStepper, GenderPickSheet, CheckRow/RadioRow) — the screen file is already 1726 lines.
- **Responsiveness rule (owner: "har hil telefonlarda bir hil")**: flex/percent only, no fixed
  widths, minimum touch target 44px, test with small (720p) and large screens + font scaling.

### UI behaviour spec (small details — decided, do NOT re-derive)

1. **First action in a fresh session:** open `figma_images/K_buyurtma001Yangi.png` with the Read
   tool — the plan text compresses it; the image is the authority for layout/colour/wording.
   ⚠️ **`004Shaharlar aro K3 Tanlov oynasi.png` is NOT the route/time popup** (checked
   2026-07-28): it is the _driver-offer selection_ window a passenger sees when picking a seat on
   a driver's offer (Qidiruv/Takliflar tabs, driver + car info, seat/price grid, Orqaga /
   Buyurtma berish). No popup mock for the route/time editor exists in `figma_images/` — decide
   its exact look with the owner before step 4, or fall back to the inline "Qayerdan/Qayerga"
   cards drawn on image 1.
2. **Urgent (⚡ hoziroq):** checked → departure window pickers hidden/disabled, `start_at = now`,
   `depart_until = null`, `is_urgent = true`. Unchecked → date picker + two time pickers
   (window start/end); `start_at` = date+start, `depart_until` = date+end.
3. **Arrival window:** fully optional. Its own date + two time pickers → `arrive_from`,
   `arrive_until`. No validation against departure beyond `arrive_from >= start_at`.
4. **Route popup:** province → city/district → settlement (settlement **optional** — lists can
   be empty), landmark (mo'ljal) free text per side. Country auto-Uzbekistan, hidden (OR-004
   precedent). The popup owns route + times + urgent; the main screen shows a read-only summary
   card (route line: ■ start → ● end, texts + windows) that opens the popup on tap.
5. **Seat steppers:** front 0–2, back 0–4. "+" opens a two-button sheet (Erkak/Ayol) and
   increments that gender's count for that position. "−" decrements: if only one gender has a
   non-zero count, decrement it; if both, open the same sheet to ask which. Green total badge =
   sum of all four counts, auto-updated.
6. **Salon radios** (`Butun salon` / `orqa salon to'liq`): selecting one disables the steppers
   and "farqi yo'q"; tapping the selected radio again deselects it (radios are deselectable).
   While selected: `seats_needed` = 4 (whole) / 3 (back full) — standard-sedan assumption,
   `seat_counts = null`.
7. **"Farqi yo'q (orqa/oldi o'rindiq)"** → `seat_position_any = true`; steppers stay active
   (counts still say how many people + genders; position becomes a wish, not binding).
8. **Payment (To'lov turi):** SINGLE-select despite checkbox styling — 'cash' | 'click_payme' |
   'friend_pays'. Choosing Do'stimga reveals a phone input with a country-code selector
   (default +998; the Figma example is +33 — foreign numbers are the point). `payer_phone`
   required iff friend_pays. No SMS to the friend — store only.
9. **Vehicle class** — ⚠️ corrected against the PNG (2026-07-28): the Figma has **one radio group
   of five** — Standart · Comfort · Biznes · **Econom (Damas, Mikroavtobus…)** · **Turistik** →
   `vehicle_class` ∈ `standard|comfort|business|econom|tourist`, optional, deselectable.
   There is **no** separate Miniven/Damas/MikroAvtobus checkbox row; `vehicle_types` (JSONB) stays
   in the schema for future driver-side filtering but the new UI does not render it.
10. **Pitak checkbox** ("pitakka yoki yo'lga chiqib turaman") reveals a multiline input →
    `road_pickup_note` (placeholder from the Figma's grey example text).
11. **Special order:** collapsed by default; "Maxsus buyurtma berish >" expands the panel
    in-place (no navigation). Its own submit posts to the SAME create endpoint with
    `special_order` filled; the green "Buyurtma berish" submits with `special_order: null`.
    Panel rules: all four price inputs formatted with thin spaces (reuse `formatNumber`),
    empty by default (Figma prices are placeholders); ≥ 1 price required to submit special;
    `review_driver_offers` + `fixed_price` are independent booleans; waiting fee optional
    (so'm/min); "bepul kutish 10 minut" is a static caption (`free_waiting_min: 10`).
    **Data-only — nothing is charged** (owner decision #3).
12. **Submit validation (regular):** from + to (province & city required, settlement/landmark
    optional), departure (urgent OR date+window start), ≥ 1 seat or a salon radio, payment
    type chosen. Everything else optional. Per-field inline errors like the current screen.
13. **Translations:** every new label in uz + ru + en under the existing flat
    `passengerOffers.*` namespace (uz wording comes from the Figma verbatim). No hard-coded
    strings in JSX.
14. **`api/passengerOffers.ts` (user app)** extends `CreatePassengerOfferData` with the new
    fields; keep old field names untouched so `MyPassengerOffersScreen` compiles unchanged.

### Files to touch (names verified against the repo 2026-07-28)

- **API** (`api,admin,db/apps/api/src/…`):
  - NEW `database/migrations/20260728000001-extend-passenger-offers-figma.cjs` (**.cjs** — ESM
    project gotcha)
  - `database/models/PassengerOffer.ts`
  - `services/PassengerOfferService.ts` (validate + create ~L252 + serializers ~L588)
  - `controllers/PassengerOfferController.ts`, `controllers/PublicPassengerOfferController.ts`
    (pass-through of new fields)
- **User app** (`user-app-standalone/…`):
  - `api/geo.ts` (+`fetchGeoSettlements`), `api/passengerOffers.ts`
  - `screens/CreatePassengerOfferScreen.tsx` (rebuilt)
  - NEW `components/passengerOffer/RouteTimeModal.tsx`, `SeatStepper.tsx`,
    `GenderPickSheet.tsx`, `SpecialOrderPanel.tsx` (+ tiny CheckRow/RadioRow if useful)
  - `screens/MyPassengerOffersScreen.tsx` (minimal: show urgency/windows/landmarks on own cards)
  - `translations/uz.ts`, `ru.ts`, `en.ts`
- **Driver app** (`driver-app-standalone/…`):
  - `api/passengerOffers.ts` (type additions)
  - `screens/SearchPassengerOffersScreen.tsx` (cards + detail: urgency, windows, landmarks,
    seat breakdown, class/types, flags, special prices — read-only). ⚠️ This file already has
    pre-existing tsc errors (`../api/geo` missing there) — part of the 41-error baseline.
    🛑 **Corrected 2026-08-02: it DOES block.** `driver-app-standalone/api/geo.ts` does not
    exist, so Metro cannot resolve the import at line 27 and this screen has never opened. The
    user app's `api/geo.ts` exports exactly the four symbols it uses (`GeoOption`,
    `fetchGeoCountries`, `fetchGeoProvinces`, `fetchGeoCityDistricts`) — port it.

## Steps

- [x] 1a. **Migration + model files** — `20260728000001-extend-passenger-offers-figma.cjs`
      (20 additive columns + 2 FK indexes + `max_price_per_seat DROP NOT NULL`) and
      `PassengerOffer.ts` (attributes, creation-optionals, `init` fields, new exported types).
      API `tsc`: 290 errors before / 290 after, **identical set**.
- [x] 1b. **Migration applied on test3 — 2026-07-28, `migrated (0.040s)`, no errors.**
      Verified in `information_schema`: all 12 spot-checked columns present, `max_price_per_seat`
      now nullable, `is_urgent`/`road_pickup`/`woman_in_car` NOT NULL with defaults.
      Committed + pushed as `7e49b5e`, then run inside the running API pod (the image is built
      without the file, so it was `kubectl cp`-ed in first). **Recipe for the next migration:**
  ```
  POD=$(kubectl get pods -n test3 -l app=ubexgo-api-test3 -o jsonpath='{.items[0].metadata.name}')
  kubectl cp "<migration>.cjs" "test3/$POD:/app/src/database/migrations/<migration>.cjs" -c api
  kubectl exec -it -n test3 $POD -c api -- sh   # then: cd /app && npm run db:migrate
  ```
  The pod has `NODE_ENV=production` + `DB_*` from the configMap, so sequelize-cli picks the
  production config by itself. ⚠️ The image is built with `npm install --omit=dev` and
  `sequelize-cli` is a devDependency — if it is missing, `npm install --no-save sequelize-cli`
  inside the pod first. **Never applied to a local DB** (Docker Desktop is off; the Windows
  PostgreSQL 16 on 5432 is an unrelated instance) — test3 is the only DB with these columns.
- [x] 2. **API — DONE 2026-07-29.** `PassengerOfferService` rewritten around one whitelisting
     builder `buildOfferFields(data, current?)` (create **and** update share it) + parser helpers
     (`parseDate/Text/Number/Id/Enum/SeatCounts/VehicleTypes/SpecialOrder`) and a
     `validateOfferData(fields, current?)` that checks cross-field rules on the **merged** row, so a
     PATCH cannot leave it inconsistent. Controllers needed **no change** (they already forward
     `req.body`); admin routes never touch passenger offers.
     API `tsc`: **290 before → 289 after** — one baseline error removed (the old `create()`
     `exactOptionalPropertyTypes` complaint), **zero new**. 24 runtime checks green via
     `<scratchpad>/check-build-fields.mts` (`npx tsx …` from `apps/api`, no DB needed).
     **Contract the app (steps 3–6) must follow:**
  - `seats_needed` is **derived server-side** — send `seat_counts` and/or `salon_scope` and omit
    it. Precedence: `salon_scope` (4 whole / 3 back) → sum of `seat_counts` → sent
    `seats_needed`. A salon scope forces `seat_counts = null`. Result must land in 1–8.
  - `max_price_per_seat` may be omitted entirely; when sent it still must be > 0 and ≥ 5000 UZS.
  - `is_urgent: true` **skips the 30-minute advance rule** and forces `depart_until = null`.
  - `payment_type` ∈ cash|click_payme|friend_pays; `friend_pays` **requires** `payer_phone`
    (loose regex, foreign numbers OK, ≤ 20 chars).
  - `special_order` requires **≥ 1 of the four seat prices**; booleans default false, empty
    strings become null.
  - Seat caps: front ≤ 2, back ≤ 4; an all-zero `seat_counts` counts as "not sent".
  - Landmarks ≤ 255 chars (400 instead of a DB error); empty strings normalise to `null`.
  - **`payer_phone` is never returned by the public (driver) endpoints** — a third party's
    number. It is present only on the owner's own `/passenger/offers*` responses.
  - Public list `price_asc|price_desc` now sorts `NULLS LAST` so price-less new offers do not
    crowd the top. ⚠️ The `max_price` filter still **excludes** offers without a price — driver
    filters get their own pass in step 7.
  - Security bonus: `updateOffer` no longer spreads `req.body` into the model (it could set
    `user_id`/`status`); everything is whitelisted now.
- [x] 3. **App: geo settlement level — DONE 2026-07-29.** `fetchGeoSettlements(cityDistrictId)`
     added to `user-app-standalone/api/geo.ts` (4th level, empty lists are normal).
- [x] 4. **App: route + times — DONE 2026-07-29.** ⚠️ **Owner decision 2026-07-29: NO popup.**
     The route/time editor is drawn **inline on the main screen**, the way image 1 shows it, so
     `RouteTimeModal` was never built. Three new components in
     `user-app-standalone/components/passengerOffer/`:
  - `GeoSelectModal.tsx` — searchable single-choice list (the old screen had this markup twice).
  - `LocationCard.tsx` — the "Qayerdan:/Qayerga:" card: viloyat → shahar/tuman → mavze/QFY
    cascade + mo'ljal input + the combined summary line. Exports `LocationValue`,
    `emptyLocation`, `buildLocationText`. Loads its own lists; effects are keyed on **plain ids**,
    never on objects (the T-017 loop).
  - `TimeWindowCard.tsx` — departure (⚡ hoziroq toggle + date + from–until window) and arrival
    (date + a single "gacha" time). Exports `combineDateTime`, `formatTime`, `formatDateNumeric`.
  - `CheckRow.tsx` — the Figma checkbox/radio row ("-label"), built here, reused in step 5.
    `CreatePassengerOfferScreen.tsx` rewired (1808 → ~1000 lines): the country cascade, both geo
    modals and the old date/time card are gone; `api/passengerOffers.ts` carries the full new
    `CreatePassengerOfferData`; 19 new uz/ru/en keys. User app `tsc`: **12 before → 12 after,
    identical set.**
    **Figma readings that override the plan text (the PNG is the authority):**
  - Arrival is **one** "…gacha yetib borish kerak" time, not a window → only `arrive_until` is
    sent; `arrive_from` stays null (column kept for later).
  - Location text order is now **`viloyat, tuman/shahar, mavze/ mo'ljal`** (was `city, province`).
    Country still omitted — OR-004's intent is preserved.
  - The seat picker draws **1 front box + 3 back boxes** (sedan) — so step 5 must cap front at 1
    and back at 3 (total 4 = butun salon, 3 = orqa salon). The API's caps (2/4) are deliberately
    looser and need no change.
  - The blue **map pin** in both route cards is **not implemented** — geocoding/map picking is
    T-008 (Later). Rendering a dead pin would be worse than leaving it out.
- [x] 5. **App: main form sections — DONE 2026-07-29.** Sections in the Figma's own order:
     payment → vehicle class → seats → flags/pitak → qo'shimcha ma'lumot → submit. New
     `SeatStepper.tsx` (seat boxes + − count + stepper; "+" always asks Erkak/Ayol, "−" only asks
     when the row holds both) and `GenderPickSheet.tsx`. Front capacity **1**, back **3** (sedan,
     per the PNG). Salon radios lock the steppers and "farqi yo'q"; every radio is deselectable.
     `front_seat` is still written for the old list screens (`whole_salon` → true, `back_salon_full`
     → false, otherwise "a front seat was picked"). +33 uz/ru/en keys. tsc 12 → 12, identical set.
- [x] 6. **App: special-order panel — DONE 2026-07-29.** `SpecialOrderPanel.tsx`: collapsed bar
     → in-place panel with the four price inputs (thin-space formatting), "xaydovchilar taklifini
     ko'rib chiqaman", "o'zgarmas narx", kutish so'm/min and the static "bepul kutish 10 minut"
     (`free_waiting_min: 10`). Its own button calls the **same** `handleSubmit(true)`; the green one
     calls `handleSubmit(false)` and sends no `special_order`. The app blocks a special order with no
     price, matching the API rule. **Data only — nothing is charged** (owner decision #3).
     The submit payload now carries every new field and **deliberately omits `seats_needed` and
     `max_price_per_seat`**. +20 uz/ru/en keys. tsc 12 → 12, identical set.

  **Deliberate deviations from the PNG (all reversible, flag at review):**
  1. Payment: the section label "To'lov turi" comes **first**, then Naqd / Click-Payme /
     Do'stimga. The Figma prints "Do'stimga" _above_ the label, which reads like a bug.
  2. The payer's number is **one free-text field prefilled `+998 `** (phone-pad), not a flag +
     dial-code chip — a real country-code picker needs a country/flag dataset the app has not got.
     Foreign numbers still work: the field accepts any `+…` input.
  3. Both buttons **scroll with the form** (as drawn); the old sticky footer is gone.
  4. A small "Avto sinfi" heading was added — the PNG relies on its "3." numbering instead.

- [x] 7. **Driver app: display — DONE 2026-07-29.** `api/passengerOffers.ts` carries the new
     fields (`max_price_per_seat` is now `number | null`); new
     `components/offers/PassengerOfferExtras.tsx` renders them read-only as compact chip rows on the
     offer card: ⚡ urgency, the departure window, the arrival deadline, the gendered seat breakdown
     (`2♂ 1♀`) or the salon booking, "joyi farqi yo'q", vehicle class, payment type, the six flags,
     the pitak note, and the special-order price list with fixed-price / reviews-offers / waiting
     fee. Landmarks now sit under each route line. Offers from old app builds render nothing extra.
     New `passengerOfferExtras` namespace, 29 keys × uz/ru/en. Driver app `tsc`: **41 before → 41
     after**, identical per-file/per-code distribution.
     ⚠️ **The price badge no longer shows garbage:** offers made by the new form have no
     `max_price_per_seat`, so the card shows "Narx kelishiladi" instead of formatting `null`.
     ⚠️ **There is no detail screen.** `handleViewOffer` navigates to `'PassengerOfferDetails'`,
     which **is not registered anywhere** (hence the `navigation as any` cast) — tapping a card has
     never gone anywhere. Pre-existing, unrelated to T-018, logged as **T-021**. So the card is the
     only place a driver sees these fields, which is why it carries all of them.
     No filter changes (`max_price` still excludes price-less offers) — deliberate, see step 2.
- [x] 8. **Static verification + cleanup — DONE 2026-07-29.**
  - Dead styles pruned from `CreatePassengerOfferScreen.tsx`: **67 of 90** StyleSheet entries were
    orphaned by the rewrite (the geo cascade, both modals, the date/time card, the price inputs and
    the toggle-switch options). File is **1292 → 790 lines**. Done with a brace-counting script
    that refuses to run if the file uses dynamic `styles[...]` access; the seven new
    `passengerOffer/` components and the driver's `PassengerOfferExtras` were checked the same way
    and have **zero** dead styles.
  - Final `tsc`: **user app 12 (identical set), driver app 41 (identical), API 289** — one below
    the 290 baseline because step 2 removed an old `exactOptionalPropertyTypes` error. **No new
    error anywhere across all eight steps.**
  - `npm run lint` is still broken repo-wide (ESLint 9, no flat config) — pre-existing, not touched.
- [ ] 9. **End-to-end run** — create an offer with every field set via the dev build against
     the local/test API; check it in My offers + driver app.
     **Started 2026-08-02** — the API image is deployed on test3 and a price-less offer exists
     (only the new API + new form can write `max_price_per_seat = NULL`). Three defects found from
     the owner's logs and fixed, **not yet committed**:
  - API: `app.set('trust proxy', 1)` (`app.ts:35`) — the ingress's `X-Forwarded-For` was
    untrusted, so `express-rate-limit` keyed everyone on the ingress IP (one shared bucket).
    One hop, not `true` — `true` lets anyone spoof the header past the OTP limiter.
  - User app: `MyPassengerOffersScreen` crashed with `toString of null` on a price-less offer —
    step 7 taught the driver app about null prices, the user app was never updated. Now renders
    `passengerOffers.priceNegotiable` (+1 key × uz/ru/en); `api/passengerOffers.ts`
    `max_price_per_seat` retyped `number | null` so tsc polices the call sites.
  - Driver app: `formatNumberWithSpaces` was imported but never exported from its `utils/format.ts`
    (user-app-only function) — added. Was hiding in the 41-error baseline as a real crash.
    ✅ **BLOCKER CLEARED — verified 2026-08-11.** This said `api/geo.ts` had to be ported into the
    driver app first. **T-025 step 1 did it** (committed `0371cbd`): the file exists and
    `SearchPassengerOffersScreen:29-30` imports it. The note is stale; do not re-do the port.
    🛑 **What actually remains is a device/API run**, not code — create an offer with every field
    set against test3 and check it in *My offers* and the driver app.
- [ ] 10. **Owner** — device test on at least two different phones (small + large screen).

## Risks / open questions (READ before coding)

- ⚠️ **Payment row interpretation:** Figma draws Naqd / Click-Payme / Do'stimga as checkboxes;
  modelled here as **single-select** `payment_type` + `payer_phone` for Do'stimga. Confirm with
  the owner at review; the column shape survives either reading (switch to JSONB list only if
  he wants multi).
- ⚠️ **"Ayol kishi bor avto"** read as a _preference_: passenger wants a car that has a woman
  in it. It is a filter flag on the offer, not a guarantee.
- ⚠️ Migration touches a live table — additive/nullable only, **no** column drops or renames;
  `front_seat` stays even though superseded.
- ⚠️ Keep `seats_needed` correct (sum) — the driver app's existing list UI and the admin panel
  read it today.
- Special order: **no payment**, no charging, no "3000 so'm" billing — display + data only
  (owner decision #3). The Figma's price examples are placeholders, fields start empty.
- Foreign payer number: store E.164 as typed with country code; no SMS to the friend (out of
  scope).
- Admin panel: shows offers via existing fields; new fields visible only via detail JSON —
  a proper admin redesign is **out of scope** (note for a Later card).
- Deploy order: API first, then app build (old app + new API is safe; new app + old API would
  lose the new fields — same discipline as T-016).
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`,
  `GRADLE_OPTS` truststore, `git -c http.sslCAInfo=...`).

## Session notes (one line per work session)

- 2026-08-02 (2): **Driver-connection review + 6 owner decisions + DEPLOYED.** Reviewed the whole
  browse → join → confirm leg; found it has **no UI in either app** (new cards T-023/T-024) and
  fixed 8 backend/app defects (double-confirm, unvalidated price → 500, public leak of rival
  bids, three 500-instead-of-4xx paths, 9 JSON-parse traps). Implemented all six owner decisions:
  price-less orders survive the budget filter · new `driver_found` status + auto-reject and
  notify the losing drivers · `users.language` + recipient-language pushes at all 11 call sites ·
  three rules documented in code. Migration `20260802000001` applied on test3 (`0.014s`), commit
  `1117481` deployed, all pods Running. New `docs/CHECKLIST.md`. tsc 285/0/12/40.
- 2026-08-02: **Step 9 started — the API is live on test3 and the new form has written a real
  price-less offer.** Three defects fixed from the owner's logs (trust-proxy rate limiting,
  user-app `toString of null` on a null price, driver-app missing `formatNumberWithSpaces`
  export). tsc: user 12 → 12, driver **41 → 40**, API 289 → 289. Uncommitted. Corrected the
  step-7 note: the driver app's missing `api/geo.ts` is a **blocker**, not baseline noise.
- 2026-07-29 (5): **Step 8 DONE — all code steps complete.** 67 dead styles pruned (screen
  1292 → 790 lines); final baselines user 12 / driver 41 / API 289, no new errors anywhere.
  Steps 9–10 are the owner's: deploy the API to test3 first, then build the app and test.
- 2026-07-29 (4): **Step 7 DONE.** Driver app shows every new field read-only via
  `PassengerOfferExtras` chips + landmarks under the route; price badge falls back to "Narx
  kelishiladi" when the offer carries no price. tsc 41 → 41, identical. Found that
  `PassengerOfferDetails` is navigated to but never registered → new card **T-021**.
- 2026-07-29 (3): **Steps 5–6 DONE.** Whole passenger-side form rebuilt: payment, vehicle class,
  gendered seat steppers, salon radios, flags, pitak, note, and the special-order panel with its
  own submit. 7 components now live in `components/passengerOffer/`; the screen posts the full new
  payload and no longer sends `seats_needed`/`max_price_per_seat`. tsc 12 → 12, identical set.
  Four deliberate PNG deviations recorded under step 6.
- 2026-07-29 (2): **Steps 3–4 DONE.** Owner settled the open design question — the route/time
  editor is inline on the main screen, no popup. Built `GeoSelectModal`, `LocationCard`,
  `TimeWindowCard`, `CheckRow`; rewired the screen (−800 lines); 19 new uz/ru/en keys.
  tsc 12 → 12, identical set. Four Figma corrections recorded under step 4.
- 2026-07-29: **Step 2 DONE** — API layer accepts/validates/returns all 20 new fields via one
  whitelisting builder shared by create + update; `seats_needed` derived server-side; price
  validated only when sent; `payer_phone` hidden from public endpoints; price sorts `NULLS LAST`.
  tsc 290 → 289 (one baseline error fixed, none added), 24 runtime checks green. Not yet deployed.
- 2026-07-28: OR-007/8/9 logged from owner's Figma message; board updated; owner picked T-018,
  approved migrations-in-plan and data-only special order; plan written.
- 2026-07-28 (3): **Step 1 DONE.** Migration file + `PassengerOffer.ts` written (tsc 290/290,
  identical set), committed + pushed as `7e49b5e`, and **applied on test3** by the owner via
  `kubectl cp` + `npm run db:migrate` inside the API pod — clean, 0.040s. Two Figma corrections
  recorded: vehicle class is a 5-option radio group (Econom/Turistik added) and
  `004…Tanlov oynasi.png` is the driver-offer selection window, not the route/time popup. Also
  corrected the stale note that T-017 was uncommitted — it is in `a1ecedd`.
- 2026-07-28 (2): **Owner APPROVED the plan** (including the migration). Plan hardened for a
  cold start: UI behaviour spec (14 decided details), verified file list, and the
  `max_price_per_seat DROP NOT NULL` relaxation (the Figma regular flow has no price field).
  No code yet — implementation starts at step 1 in the next session.

## Resume point (for the next chat)

**Steps 1–8 are DONE. Step 9 is UNDERWAY — the code is committed (`1117481`), deployed to test3,
and the migration is applied.** What remains is verification, not building. Baselines to compare
against: API **285**, admin **0**, user app **12**, driver app **40**.

⚠️ **Owner decisions of 2026-08-02 are binding — do not re-open them.** Six of them, written up
in `docs/JOURNAL.md` 2026-08-02 (2) and recorded as comments in the code they govern:
price-less orders survive the budget filter · `driver_found` replaces the instant jump to
`completed`, losing drivers are auto-rejected and told · every push is written in the
**recipient's** language (`users.language`) · the seat-count trap is documented not changed ·
`total = price × seats_needed` is the intended rule · a driver who cancels cannot re-offer.

**Everything is committed (`1117481`) and deployed to test3 as of 2026-08-02.** The migration
ran clean inside the pod; `db:migrate` executed only the new file, which proves `SequelizeMeta`
survived the namespace reset, so no data was lost.

**What is left:**

1. 🛑 **T-022 — port `api/geo.ts` into the driver app.** `SearchPassengerOffersScreen:27` imports
   it and the file does not exist, so Metro cannot bundle that screen. Copy the user app's
   version (`GeoOption`, `fetchGeoCountries`, `fetchGeoProvinces`, `fetchGeoCityDistricts`;
   adjust the config import). Nothing driver-facing can be verified until this lands.
2. Finish step 9 by walking **`docs/CHECKLIST.md`** — it is the step-9 script now, written in
   plain language and marked 🔴 (changed today) / ⚪ / 🚫 (screen does not exist). The two lines
   that matter most: the new order's price must read "Narx kelishiladi" in My orders, and the
   API log must no longer print `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`.
3. Step 10 — **owner**: two phones, small + large screen, plus a font-scaling pass.
4. ⚠️ **Everyone must open both apps once** after this update — that first launch is what tells
   the server the person's language. Until then their notifications stay Uzbek.

**Not part of T-018, but exposed by it:** the driver-connection leg has no screens at all
(T-023 driver "I'll take it", T-024 passenger "drivers who offered"). The server side of that
leg is finished and reviewed; only the UI is missing.

**The four deliberate deviations from the PNG (step 6) want an explicit yes/no at that review.**
When the device test passes: `/end-day`, then move T-018 to _Parked_ or _Done_.
Read in this order: (1) `figma_images/K_buyurtma001Yangi.png`, (2) this file fully,
(3) `docs/OWNER_REQUESTS.md` OR-007. Every design decision is already taken — the "Owner
decisions" and "UI behaviour spec" sections are binding; only truly new ambiguities justify a
question to the owner.

**Environment facts a fresh chat must know:**

- **test3 already has the new columns**; **no local DB exists** (Docker Desktop off, the Windows
  PostgreSQL 16 on 5432 is unrelated). So steps 2–7 are written without a local run, and every
  real test happens on test3 after a deploy. Deploy order stays: **API first, then the app**.
- The API pod still runs the **old image** — the new model code goes live only at the next
  `./api,admin,db/infra/k8s/overlays/test3/deploy.sh` run. Harmless: unused columns.
- Baselines to compare against: API `tsc` **290**, user app **12**, driver app **41** errors.
- Git TLS is broken by Avast — push with `git -c http.sslBackend=schannel push origin main`.
- `.claude/settings.json` + `.gitignore` are modified for unrelated reasons — keep them out of
  feature commits.
