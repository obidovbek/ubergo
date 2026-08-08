# ✅ TODO — task board

> **Rules:** max **2** tasks in *Now*. New ideas always land in *Later* — they
> never interrupt the current task. Claude moves cards here during
> `/new-task` and `/end-day`. Humans can edit this file any time.
>
> **Format:** `T-###  (P1|P2|P3)  short name — detail`. P1 = most important.

## 🔥 Now (working on it)
- [ ] T-036 (P1) **Modals must match the Figma design — both apps, all 33 of them.**
  Reported by the owner during the 2026-08-08 device test: the create-offer modal does not match the
  design, "and all modals should match the design".
  Counted in code the same day: **33 `<Modal>` instances across 22 files** (user **13**/10,
  driver **20**/12) — ⚠️ *more than the 24 first quoted while scoping.* **No shared modal component
  exists**: every site re-declares its own `rgba(0,0,0,0.5)` backdrop, its own radius (16 / 18 /
  `theme.borderRadius.md`), and they split across two animation conventions. Today's modals are
  generic white Material sheets with grey hairlines and **emoji glyphs** (`🔍` `✕` `✓`); the Figma
  overlay language is a **cream card, 2px black border, red heading, green filled actions**.
  The 33 collapse into **three patterns** — list picker (17), date/time wheel (8), dialog/detail (8)
  — which is what makes the card tractable: one shell + three variants, then migrate.
  **Owner decisions 2026-08-08:** scope = **both apps, every modal**; and **derive** the shell from
  the Shablon/Tanlov overlays, since **no Figma exists for the pickers themselves**.
  **Steps 1-9 ALL DONE 2026-08-08 — all 33 modals in both apps migrated.** One `AppModal` shell +
  `ModalList` (with optional multi-select) + `DateWheelModal`, **byte-identical across both apps**;
  adapters `CountryPickerModal` (user) and `GeoPickerModal` (driver). Duplication collapsed on the
  way: 3 identical country pickers → 1, 2 identical date wheels + their generators → 1, 7 driver geo
  pickers → 1. `tsc` all four **exactly at baseline** (282 · 0 · 12 · 36), in-file errors proven
  pre-existing via `git stash`; **129/129** i18n checks — which **caught 15 keys that never
  existed**, three of them hidden behind `|| 'hard-coded Uzbek'` fallbacks.
  ⚠️ **Driver date/time pickers were deliberately NOT moved to `DateWheelModal`** — it runs
  1900→today for birth dates, while the driver's generators enforce **future-only**; swapping would
  have dropped the past-date guard silently. They got the chrome only.
  🛑 **Only step 10 (owner: rebuild BOTH apps, walk all 33) and step 11 (commit) remain. Nothing
  has run on a device.** → `docs/PLAN.md`

- [ ] T-031 (P1) **[OWNER OR-012]** Seven fixes on the passenger's "create ride request" screen.
  Reported 2026-08-02. **Items 2, 3 and 7 DONE + committed (`9ab9b2c`)** — items 2, 3 and half of 4
  were all **one** missing `KeyboardAvoidingView` on `CreatePassengerOfferScreen`, and item 7's
  landmark row genuinely had no icon.
  **Item 1 diagnosed, no defect found** in `SeatStepper`/`GenderPickSheet` (all 8 i18n keys resolve,
  capacities are 1/3). ⚠️ Strong suspect: `seatsLocked = salonScope !== null` (`:118`) disables both
  steppers with **no on-screen reason**, and the salon checkboxes that set it are drawn *below* them.
  🛑 **Needs the owner to confirm the repro** — was a salon option ticked?
  **Owner decisions 2026-08-02:** payment → `payment_cash` + `payment_card` booleans plus a
  **separate** `paid_by_friend` (migration; keep `payment_type` one release so old installs survive);
  the waiting fee becomes an **admin setting**, not a passenger input; waiting time stays **stored
  but uncounted**. Steps 4-12 remain. ⚠️ Its plan is **`docs/PLAN-T031.md`** (moved intact
  2026-08-08). → `docs/OWNER_REQUESTS.md` OR-012

## ⏸️ Parked — implemented, awaiting owner device test
> These are **not** counted against the 2-task *Now* limit: no Claude work is left on them, they
> only need the owner to confirm on a phone. T-014/T-015 committed in `5b315a6`, T-016 in
> `2a76e12`, T-017 in `a1ecedd`. Move a card back to *Now* only if a device test **fails**.
- [ ] T-033 (P1) **Resend OTP shows a generic error; server messages never reach either app.**
  Found by the owner on a **device**, 2026-08-08 — the first real device session. Fully traced in
  code the same day, **before any fix**. The 60 s per-phone cooldown
  (`OtpService.checkRateLimit:239`) is *correct* and is the cause — but it throws a bare English
  `Error`, so the controller's catch-all returns **HTTP 500** for a routine refusal. Worse, the app
  discards the message regardless: `handleBackendError` (`utils/errorHandler.ts:40`) is written for
  **axios** (`error.response.status`) and **neither app imports axios** — both use `fetch`, which
  never sets `.response`. The whole status switch is dead code, so **12 screens** (4 user, 8 driver)
  have never shown a server message. Plus: the resend link has **no cooldown UI** at all, and the
  6th send in an hour hits the express limiter's **plain-text** body → `JSON Parse error`.
  **Owner decision 2026-08-08:** scope = the fix **plus** the error plumbing; the two security
  findings split out as **T-034**.
  **Steps 1-6 ALL DONE 2026-08-08.** The cooldown is now a translated **429** carrying
  `retryAfterSec`; all five express limiters answer **JSON** instead of bare text; `ApiError` carries
  `status`/`data`/`response` so the 12 existing `error?.response?.status` readers keep working
  untouched; every `response.json()` in both `api/auth.ts` is guarded; and the resend link is
  disabled with a live countdown held as a **wall-clock deadline** (a counter would come back stale
  after backgrounding). `tsc` all four **exactly at baseline** (282 · 0 · 12 · 36), in-file errors
  proven pre-existing via `git stash`; **42/42** i18n + **17/17** runtime checks.
  🛑 **Only step 7 (owner: deploy API **first**, then rebuild both apps, then 5 smoke tests) and
  step 8 (commit) remain. Nothing has run on a device or a live API — its code is still
  UNCOMMITTED in the working tree.**
  ✅ **Owner decided 2026-08-08: leave `otpSendLimiter` at 5 sends/phone/hour.** It is legible now
  instead of a parse crash, and that is enough — do not revisit.
  Also found here: **T-035** (duplicate `errors:` blocks in the app translation files).
  ⚠️ Its plan is **`docs/PLAN-T033.md`** (moved intact 2026-08-08 so T-036 could use `docs/PLAN.md`).
- [ ] T-018 (P1) **[OWNER OR-007]** Rebuild the intercity order ("zakaz") screen to the Figma
  (`K_buyurtma001Yangi.png` + popup `004…Tanlov oynasi.png`): route/time popup, gendered seat
  steppers, payment type, vehicle class/type, new flags, special-order panel (data-only).
  Schema + API + user app + driver-app views. **Plan APPROVED 2026-07-28. Steps 1–8 DONE
  2026-07-29. Step 9 UNDERWAY: committed as `1117481` and DEPLOYED to test3 2026-08-02 (migration
  `20260802000001` applied, `migrated (0.014s)`, all pods Running). 11 defects fixed 2026-08-02
  across two review rounds + 6 owner decisions implemented — see `docs/JOURNAL.md` 2026-08-02 (2).
  🛑 Still blocked on the geo import (now **T-025 step 1**) before the driver side can be verified.
  Step 10 is the owner's: walk `docs/CHECKLIST.md` on two phones.**
  ⚠️ **Its plan now lives in `docs/PLAN-T018.md`** (moved intact 2026-08-02 (3) so T-025 could use
  `docs/PLAN.md`). Resume T-018 from there once T-025 lands.
  → `docs/OWNER_REQUESTS.md` OR-007, `docs/PLAN-T018.md` step 9, `docs/CHECKLIST.md`

- [ ] T-030 (P1) **[OWNER OR-011]** Four driver-app fixes from the software owner.
  Reported 2026-08-02, all grounded in code the same day.
  **Steps 1-6 + 8 DONE + committed (`9ab9b2c`).** The photo audit proved the owner right — uploads
  work; the break was a host-less `/uploads/...` path handed to `<Image>`, **18 fields across 5
  screens**. Dates: `maximumDate` was the wrong tool (these screens hand-roll their pickers), so the
  limits went into the generators via a new `utils/dateLimits.ts`, incl. the **typed-input** paths.
  18 hard-coded strings removed. `tsc` all four at baseline; 29/29 runtime checks.
  🛑 **Step 7 BLOCKED on the owner** (deferred 2026-08-02): the driver's address cascade is *already*
  complete, so OR-011 item 3 is either the offer-wizard route picker or **empty dropdowns = a data
  problem in the admin upload**. Steps 9-10 (rebuild + smoke test, commit) also owner's.
  ⚠️ Plan is **`docs/PLAN-T030.md`**. → `docs/OWNER_REQUESTS.md` OR-011
  The four items (dates · photos · geo levels · note placeholder) are written up in full, with line
  numbers, in `docs/OWNER_REQUESTS.md` OR-011 — not repeated here.
- [ ] T-027 (P1) **[OWNER OR-010]** Seven fixes from the software owner (user app; the push-tap one
  also driver app). Reported 2026-08-02, all grounded in code the same day.
  1–2. Referral ("bonus") block: only **one** of phone / ID / promo may be filled, and the field
  must stop showing the user's **own** number — grey `+998901234567` placeholder instead.
  ⚠️ Needs a new `referral_phone` column (**migration — owner approved**); today the backend stores
  only `promo_code` + `referral_id`.
  3. Birth date jumps too far up when the keyboard opens (`onFocus={scrollToEnd}`).
  4. Unread-message badge (envelope icon) — **API already returns `unread`, no backend work**.
  5. Tapping a push must open **that message**; today it opens the main menu. ⚠️ **No push-tap
  handler exists in either app** — so this is new work in the user app *and* the driver app.
  6. Hamburger icon on the left to open the menu (`MenuScreen` is a plain stack screen today).
  7. Settlement + mahalla not linked to the district — **the API already has both endpoints**; the
  app's `api/geo.ts` has no neighborhoods function and its cascade stops at city/district.
  **Owner decisions 2026-08-02:** real `referral_phone` column; item 7 = the **trip location
  picker** (`GeoSelectModal`/`LocationCard`), not the profile address; T-019's Figma re-layout
  stays a separate card.
  **Steps 1–10 ALL DONE 2026-08-02** — all seven items implemented; `tsc` API **282** · admin **0**
  · user **12** · driver **36**, zero new errors; 30/30 i18n runtime checks. Two follow-ups logged
  rather than absorbed (**T-028**, **T-029**).
  **🛑 Only step 11 (owner: run the migration, deploy, rebuild BOTH apps, smoke test) and step 12
  (commit) remain.** ⚠️ **Migration FIRST, then API, then the apps** — the app already sends
  `referral_phone` and the API drops unknown fields, so a user would watch their input vanish.
  Nothing has run on a device. ⚠️ Its plan is **`docs/PLAN-T027.md`** (moved intact 2026-08-02).
  → `docs/OWNER_REQUESTS.md` OR-010, `docs/PLAN-T027.md` step 11
- [ ] T-026A (P1) **Offer concurrency: the confirmPassenger overbooking race + the single front seat.**
  **Committed + deployed to test3 by the owner 2026-08-02.** Parked for T-027 — nothing left is
  Claude's; the 5 smoke tests in `docs/PLAN-T026A.md` step 8 have **not** been run, and the race has
  no other coverage of any kind. Repro script is written but never executed.
  Fixed via one mechanism (`sequelize.transaction()` + `lock: tx.LOCK.UPDATE` on the offer row),
  plus the new `offers.frontSeatTaken` key in three locales. ⚠️ The lock had to be taken on the
  offer row **alone**: Postgres refuses `FOR UPDATE` on the nullable side of an outer join, which
  is what Sequelize emits when `lock` meets `include` — the obvious version would have 500'd in
  production. `tsc` API **282 → 282**, the two in-file errors **proven pre-existing** via
  `git stash`; 21/21 i18n runtime checks. API-only — neither app needed a rebuild.
  ⚠️ Its plan is **`docs/PLAN-T026A.md`** (moved intact 2026-08-02). The four defects it closed:
  1. **Lost-update race.** `confirmPassenger` (`OfferPassengerService.ts:263-276`) read
     `offer.seats_free`, checks it, then writes `seats_free - n` with nothing in between. Two
     concurrent confirms both pass the check and **4 seats sell on a 2-seat offer**. `cancelJoin`
     (:429-431) restores seats the same unsafe way, so both must move together or the race relocates.
  2. **Nothing enforces one front seat.** Neither `joinOffer` nor `confirmPassenger` checks whether
     another passenger already holds it — N passengers each book the front seat and all get
     confirmed. Two people are sold the same physical seat.
  3. Rides along, same lines: no transaction spans the join update and the offer update in either
     function, and `confirmPassenger` never re-checks that the offer is still `published` and not
     yet started — so a driver can confirm passengers onto a **cancelled** offer.
- [ ] T-025 (P1) **Driver offer create/edit: unblock the geo import + two create-offer hotfixes.**
  Parked 2026-08-02 to make room for T-026A — **not finished**, but nothing left is Claude's.
  Absorbs **T-022** (the missing `api/geo.ts`) as step 1 — and it was *not* a port: the driver app's
  own `api/driver.ts` already exports all four symbols, so a 3-line re-export shim did it. Plus the
  create-offer defects that bite in normal use: editing any offer with a front-seat price 400s
  on a **string** comparison (`"12000.00" < "5000.00"` is true), every edit reset `seats_free`
  to `seats_total` (re-selling booked seats), the passenger was **charged a front-seat premium that
  was never displayed**, a cancelled offer gave a **blank screen with no way back**
  (`successResponse`'s 404 landed in the *message* slot → HTTP 200 + `offer:null`), and every price
  rendered as `60 000.00`.
  **Steps 1–7 + 9 ALL DONE 2026-08-02**, committed as `0371cbd` (steps 1–3) and `178a452` (steps 5–7).
  `tsc` API **285 → 282** (the 3 removed errors *are* 3 of the bugs — they were hiding in the
  baseline), user **12 → 12**, driver **40 → 36**, admin **0**; 27/27 + 20/20 runtime checks;
  two bugs reproduced against pre-fix code.
  **🛑 Only step 8 remains — owner: deploy the API + rebuild BOTH apps, then 7 smoke tests.**
  Nothing has run on a device or a DB. ⚠️ Its plan is **`docs/PLAN-T025.md`** (moved intact
  2026-08-02, same as T-018's). → `docs/PLAN-T025.md` step 8, `docs/CHECKLIST.md`

> **T-022 is absorbed into T-025 step 1** — code-complete and committed in `0371cbd`, but the
> driver search screen has **not been opened on a device yet**, so it is not "done" until smoke
> test 8(a) passes. Do not start it as a separate card.
- [ ] T-017 (P1) Driver app: infinite profile-check loop after OTP login — `AuthContext` identity
  churn + a wrong `profile_complete` watcher made `RootNavigator` re-check forever until the API
  rate-limited the app. **Fix implemented (4 files) and committed (`a1ecedd`); tsc at baseline.
  Awaiting owner device test.** → see `docs/JOURNAL.md` 2026-07-28
- [ ] T-016 (P1) **[OWNER OR-006]** Half-finished registration → the app opens the main menu
  instead of resuming the registration form (user app + API). Root cause: `/auth/me` omitted
  `profile_complete`. **Fix implemented (API + app) incl. draft pre-fill and committed (`2a76e12`);
  tsc at baseline. Needs the API deployed to test3, then an owner device test.**
  → see `docs/OWNER_REQUESTS.md`
- [ ] T-011 (P1) **[OWNER OR-001]** OTP screen resets to main menu after the app is
  backgrounded/killed — should resume the OTP screen. Affects driver + user apps.
  **Fix implemented in both apps (tsc clean); awaiting owner device test.**
  → see `docs/OWNER_REQUESTS.md`
- [ ] T-012 (P1) **[OWNER OR-002]** Deleted user still gets into the app (cached token
  trusted) — app must log out to the login/OTP screen; API must reject deleted tokens.
  Affects driver + user apps + backend. **Fix implemented (App + API), tsc clean;
  awaiting owner device test.** → see `docs/OWNER_REQUESTS.md`
- [ ] T-014 (P2) **[OWNER OR-004]** Remove the country from the city/location text on
  "Safar so'rov yaratish" (user app). **Done — `buildLocationText` drops country;
  label + saved text now `city, province`. Awaiting owner device test.** → `docs/OWNER_REQUESTS.md`
- [ ] T-015 (P2) **[OWNER OR-005]** Additional-phones field accepts the user's own primary
  number (user app, registration + edit profile). **Done — `addPhoneNumber` now rejects the
  primary number and duplicates, with toasts. Awaiting owner device test.** → `docs/OWNER_REQUESTS.md`

## 📋 Next (ready to start)
- [ ] T-034 (P1) 🔒 **Two OTP security holes.** Split out of T-033 by owner decision 2026-08-08 so
  the device-test fix stayed tight. Both verified in code, neither is theoretical.
  1. **Secrets in the server log.** `OtpService.ts:297` prints `sendOtp code <code>` and `:102`
  prints the **full Eskiz bearer token** in the auth response. The owner's own `kubectl logs` paste
  on 2026-08-08 contained a live OTP and a live JWT. Anyone with log access can log in as any user.
  The whole `sendOtp` block (`:294-300`) is debug spew that should be gated or deleted.
  2. **The brute-force cap never fires.** `verifyOtp` (`OtpService.ts:371-380`) looks the row up
  **by `target + code`** — so a **wrong** code matches nothing, returns `false`, and never reaches
  the `attempts` increment at `:406`. `attempts` therefore only ever counts *correct* codes, and
  `config.otp.maxAttempts` (5) is dead. The code is **4 digits** (`OTP_CODE_LENGTH` default 4) and
  the only real defence left is `otpVerifyLimiter` (10 per 5 min, keyed on phone).
  ⚠️ The fix is a restructure: find the newest live code by `target` **alone**, then compare —
  which also makes `maxAttempts` and the existing audit reasons meaningful.
- [ ] T-026 (P1) **Offer backend + app hardening** — everything the two 2026-08-02 (3) audits found
  that T-025 deliberately left alone. **Both audits produced the same defect classes in two
  different services**, so fix them as one sweep, not twice.

  **A. Passenger↔driver-offer connection leg** (audit 2, findings 4–17). ⚠️ Unlike the OfferDriver
  leg, this one **is fully wired in both apps** (`OfferDetailsScreen` → join; `OffersListScreen` →
  `OfferPassengers` → confirm/reject) — so these fire in real use, not hypothetically.
  ⚠️ *Overbooking:* **carved out into T-026A** (2026-08-02) — the race, the missing transactions,
  the single-front-seat rule and the confirm-onto-a-cancelled-offer hole are all that card's, not
  this one's. Do not re-plan them here.
  *500s:* `seats_requested` is type-unchecked **and** checked in the wrong order — the availability
  test (:121) runs before the range test (:126), so `"abc"` passes both and dies as `NaN` in
  Postgres (journal defect #2, never applied here); `2.5` passes and Postgres rounds it to 3 seats;
  `parseInt(offerId)` → `NaN` → 500 (`OfferPassengerController:30`, `:110`); `?status=<garbage>` →
  ENUM error → 500 (`:86`, journal #5); `?date=<garbage>` → RangeError → 500
  (`PublicOfferController:45`, journal #6); non-UUID `:id` → 500 on confirm/reject/cancel/location.
  *Smaller:* `if (!lat || !lng)` (`:189`) rejects **0** as missing, and `"abc"` slips through to
  `NaN`; `min_rating` filters **after** pagination and `total` is the filtered page length, not the
  real count (latent — `SearchOffersScreen` does not paginate yet); **no rate limiter on any route**
  in `offer-passenger.routes.ts` and no cap on `limit` in the public browse; the `language`
  parameter of `notifyDriver`/`notifyPassenger` is **dead** (declared, defaulted, never referenced);
  3 unguarded `response.json()` in `driver-app-standalone/api/offerPassengers.ts` (:56, :93, :131).

  **B. Driver-offer create/edit** (audit 1) — ⚠️ **T-025 already fixed 3 of these; what is left:**
  Backend: `DriverOfferService.updateOffer` still spreads `req.body` into the model — `user_id`,
  `status`, `currency`, `rejection_reason`, `reviewed_by` and `reviewed_at` are client-writable (the
  same mass-assignment hole already fixed in `PassengerOfferService`). *`seats_free` and `start_at`
  are NOT — the explicit keys sit after the spread and win; T-025 verified this.*
  `validateOfferData` still checks no **presence** and no types outside the two price fields T-025
  covered, so a missing `vehicle_id`, a non-numeric `seats_total` or a garbage `start_at` are still
  **500s**; non-numeric `:id` → 500 instead of 404 on 6 endpoints;
  stops are inserted outside a transaction with no cap and can collide on the unique
  `(offer_id, order_no)` index; `front_price ≥ price` is not checked against the stored row on
  PATCH; `archiveOffer` has no status check and strands confirmed passengers silently.
  Driver app: 8 unguarded `response.json()` calls in `api/driverOffers.ts` (+ all of `api/driver.ts`)
  — the offer limiter returns a **plain-text** body, so the 21st create in 15 min throws
  `JSON Parse error`; `parseLocationText` fans out country×province city fetches when opening an
  offer for edit; hard-coded Uzbek strings in `OfferWizardScreen`. Found 2026-08-02 (3).
- [ ] T-023 (P1) **Driver app: "I'll take this order" screen.** The driver can browse passenger
  orders but has **no way to offer on one** — `joinPassengerOffer` exists in
  `driver-app-standalone/api/passengerOffers.ts` with zero call sites, and the only navigation
  target (`PassengerOfferDetails`) is unregistered (T-021). The API side is finished and
  reviewed. ⚠️ The screen **must send a real `seats_offered`**: it defaults to 1 while a T-018
  salon booking needs 3–4, and the server refuses anything less than `seats_needed`.
  Needs T-022 first. Found 2026-08-02.
- [ ] T-024 (P1) **User app: "drivers who offered" screen.** `MyPassengerOffersScreen` shows
  "N drivers interested (M pending)" with **nothing to tap** — the passenger is told drivers
  arrived and cannot answer them. `getOfferDrivers` / `confirmDriver` / `rejectDriver` exist in
  `user-app-standalone/api/passengerOffers.ts` with zero call sites. Accepting sets the offer to
  `driver_found` and auto-rejects + notifies the losing drivers (server side already done).
  Found 2026-08-02.
- [ ] T-019 (P1) **[OWNER OR-008]** User registration → Figma layout (`K_Reg001.png`); move the
  referral block (Tel/ID/PROMO) to a second screen. App-only; backend fields already exist.
  → `docs/OWNER_REQUESTS.md` OR-008
- [ ] T-020 (P2) **[OWNER OR-009]** Driver vehicle usage: add "Firmaga/Shaxsga ishlayman — faqat
  shafyorman" option (`D_Vehicle.png`); selecting "O'zimniki" disables "Ijara". **Needs a DB enum
  migration** + `DriverPersonalInfoScreen` logic. → `docs/OWNER_REQUESTS.md` OR-009
- [ ] T-001 (P1) Verify & finish passenger→offer join flow — passenger joins, driver
  gets notified, driver confirms/rejects, passenger gets notified. Last commit says
  "user joins to driver offer but **not checked**".
- [ ] T-002 (P1) Driver offer wizard screen (mobile, 4 steps) — create/edit offer UI
  (`driver-app-standalone/screens/OfferWizardScreen.tsx`, currently missing)
- [ ] T-003 (P2) Admin passengers page shows empty — registered passengers not listed
  at `/passengers` (`PASSENGERS_NOT_SHOWING_DEBUG.md`)

## 💡 Later / ideas (parking lot)
- [ ] T-035 (P2) **Duplicate `errors:` block in 5 of 6 app translation files.** Found 2026-08-08
  during T-033. Both apps declare `errors: { ... }` **twice** in the same object literal, so the
  **second silently overrides the first** — user `uz`/`ru`/`en` (lines ~21 and ~223) and driver
  `ru`/`en` (~40 and ~250). ⚠️ **Driver `uz` has only ONE block**, so the effective key set differs
  *between languages in the same app*: `errors.loadFailed` / `saveFailed` / `deleteFailed` /
  `updateFailed` / `createFailed` resolve in driver Uzbek and are **missing in driver ru/en**, where
  `t()` logs a warning and renders the raw key. Fix = merge each pair into one block and keep the
  union, then re-run the T-033 i18n check script. T-033 worked around it by writing its new key into
  **every** block.
- [ ] T-032 (P2) **`npm run lint` cannot run in either RN app.** Both have eslint **9** but **no
  `eslint.config.js` and no `.eslintrc`** — the documented command in `CLAUDE.md` fails instantly,
  so nothing has been linted in the apps for as long as that has been true. The API's *does* run:
  **26,273 problems, almost all `␍` prettier/CRLF noise** on Windows, which drowns the ~300 real
  findings (`no-explicit-any`, unused imports). Needs a flat config per app + a line-ending
  decision (`.gitattributes` / `endOfLine: 'auto'`). Found 2026-08-02 during `/end-day`.
- [ ] T-029 (P3) `PassengerOffer` has `from_settlement_id` / `to_settlement_id` but **no
  neighborhood (mahalla) id columns**, so the mahalla T-027 added to the trip location picker is
  stored as **text only** inside `from_text` / `to_text` — selectable and visible, but not
  filterable. Needs two nullable columns + a migration if mahalla-level matching is ever wanted.
  Also worth deciding then: `CreatePassengerOfferScreen:239` picks the geo point as
  `settlement ?? cityDistrict`, ignoring the mahalla, which may have finer coordinates.
  Found 2026-08-02 during T-027 step 4.
- [ ] T-028 (P3) User app: `MainStackParamList` (`navigation/types.ts:17-21`) lists only **3 of the
  navigator's 9 routes**, so screens navigate through `(navigation as any)` and lose all route/param
  checking — `navigate('Typo')` compiles fine. Bring the type in line with `MainNavigator` and drop
  the casts. Found 2026-08-02 during T-027 step 3; the convention was matched rather than fixed so
  the card stayed tight.
- [ ] T-021 (P2) Driver app: the passenger-offer **detail screen does not exist**. Tapping a card
  calls `navigate('PassengerOfferDetails')` (`SearchPassengerOffersScreen.tsx:498`, cast to `any`
  so it compiles) but no such route is registered anywhere — the tap goes nowhere. Pre-existing,
  found while doing T-018 step 7. Needs a real detail screen (offer + join flow, see T-001).
- [ ] T-004 (P2) Consolidate the ~48 scattered `.md` fix-notes into `docs/` + delete
  the stale `api,admin,db/tmp/` duplicates (Phase 2 of the doc cleanup)
- [ ] T-005 (P2) Booking / seat-reservation system hardening (payment hooks)
- [ ] T-006 (P3) Payments integration (cash / card)
- [ ] T-007 (P3) Ratings after trip (driver ↔ passenger)
- [ ] T-008 (P3) Map + geocoding for offer route selection
- [ ] T-009 (P3) Real-time updates (WebSocket) for offer/booking status
- [ ] T-010 (P3) Add a real test suite (none exists today)

## ✅ Done (newest on top)
- [x] T-013 (OR-003) Zero-tap OTP SMS auto-read via SMS Retriever (user app + API) —
  **device-verified 2026-07-26.** Real app hash = `asNtyBnPVzB` (not the earlier `JtArsQcEBm9`);
  `ESKIZ_OTP_APP_HASH=asNtyBnPVzB` set in test3. ⚠️ hash changes with a real release keystore.
- [x] Push notifications: per-app FCM tokens + driver app registration fixed — 2026
- [x] Driver offers: backend API + status machine + admin moderation UI — 2026
- [x] Driver app: offers list screen (filters, status badges) — 2026
- [x] Auth: phone OTP (Eskiz) + Google SSO + JWT — 2026
