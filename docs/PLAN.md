# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **Parked (implemented, awaiting owner device test):**
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
| `is_urgent` | BOOLEAN NOT NULL DEFAULT false | ⚡ hozioq (srochno) |
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
   2026-07-28): it is the *driver-offer selection* window a passenger sees when picking a seat on
   a driver's offer (Qidiruv/Takliflar tabs, driver + car info, seat/price grid, Orqaga /
   Buyurtma berish). No popup mock for the route/time editor exists in `figma_images/` — decide
   its exact look with the owner before step 4, or fall back to the inline "Qayerdan/Qayerga"
   cards drawn on image 1.
2. **Urgent (⚡ hozioq):** checked → departure window pickers hidden/disabled, `start_at = now`,
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
    pre-existing tsc errors (`../api/geo` missing there) — part of the 41-error baseline,
    don't fix unless it blocks.

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
- [ ] 2. **API** — `PassengerOfferService`/controller: accept + validate + return the new
  fields (create, list, detail). `seats_needed` computed server-side as the sum of
  `seat_counts` when provided (or 4/3 for salon scopes); `max_price_per_seat` validated **only
  when provided**. Old payloads (no new fields) must still work — verify with the current app
  build against the new API.
- [ ] 3. **App: geo settlement level** — add `fetchGeoSettlements(cityDistrictId)` to
  `api/geo.ts` (user app).
- [ ] 4. **App: `RouteTimeModal`** — image 2 popup, wired to the summary card on the main
  screen; stores from/to + windows + urgent in screen state.
- [ ] 5. **App: main form sections** — payment, seat steppers + gender chooser, farqi yo'q,
  salon, class, vehicle types, flags, pitak, note — per image 1, translations (uz/ru/en) for
  every new label.
- [ ] 6. **App: special-order panel** (data-only) + submit payload with all new fields.
- [ ] 7. **Driver app: display** — offer card + detail show urgency, windows, landmarks, seat
  breakdown, class/type, flags, special prices (read-only; no filter changes yet).
- [ ] 8. **Static verification** — `tsc` in user app, driver app, API — all at their baselines
  (user 12 / driver 41 / API 290 as of 2026-07-28).
- [ ] 9. **End-to-end run** — create an offer with every field set via the dev build against
  the local/test API; check it in My offers + driver app.
- [ ] 10. **Owner** — device test on at least two different phones (small + large screen).

## Risks / open questions (READ before coding)
- ⚠️ **Payment row interpretation:** Figma draws Naqd / Click-Payme / Do'stimga as checkboxes;
  modelled here as **single-select** `payment_type` + `payer_phone` for Do'stimga. Confirm with
  the owner at review; the column shape survives either reading (switch to JSONB list only if
  he wants multi).
- ⚠️ **"Ayol kishi bor avto"** read as a *preference*: passenger wants a car that has a woman
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
**Step 1 is DONE and live on test3 (`7e49b5e`, migration applied 2026-07-28). Next: step 2
(API layer) — `PassengerOfferService` + the two controllers accept / validate / return the new
fields.**
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
