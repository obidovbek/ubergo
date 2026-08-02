# ✅ TODO — task board

> **Rules:** max **2** tasks in *Now*. New ideas always land in *Later* — they
> never interrupt the current task. Claude moves cards here during
> `/new-task` and `/end-day`. Humans can edit this file any time.
>
> **Format:** `T-###  (P1|P2|P3)  short name — detail`. P1 = most important.

## 🔥 Now (working on it)
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

- [ ] T-025 (P1) **Driver offer create/edit: unblock the geo import + two create-offer hotfixes.**
  Absorbs **T-022** (the missing `api/geo.ts`) as step 1 — and it is *not* a port: the driver app's
  own `api/driver.ts` already exports all four symbols, so it is a 3-line re-export shim. Plus the
  two create-offer defects that bite in normal use: editing any offer with a front-seat price 400s
  on a **string** comparison (`"12000.00" < "5000.00"` is true), and every edit resets `seats_free`
  to `seats_total`, re-selling seats that are already booked. Found 2026-08-02 (3) while auditing the
  driver create-offer flow end-to-end.
  **Steps 1–7 ALL DONE 2026-08-02 (3).** Steps 1–3 committed by the owner as `0371cbd`; **steps
  5–7 are uncommitted** (6 files). Steps 5–7 came from a second audit (passenger↔driver-offer leg)
  and are all user-visible: the passenger was **charged a front-seat premium that was never
  displayed** (same string-compare root cause, user app this time); a cancelled offer gave a
  **blank screen with no way back** (`successResponse`'s 404 landed in the *message* slot → HTTP
  200 + `offer:null`); and every price rendered as `60 000.00`.
  `tsc` API **285 → 282** (the 3 removed errors *are* the 3 arg-order bugs — they were hiding in
  the baseline), user **12 → 12**, driver **40 → 36**, admin **0**; 27/27 + 20/20 runtime checks;
  two bugs reproduced against pre-fix code.
  **🛑 Only step 8 (owner: deploy API + rebuild BOTH apps, 7 smoke tests) and step 9 (commit)
  remain.** Nothing has run on a device or a DB. → `docs/PLAN.md`

> **T-022 is absorbed into T-025 step 1** — code-complete and committed in `0371cbd`, but the
> driver search screen has **not been opened on a device yet**, so it is not "done" until smoke
> test 8(a) passes. Do not start it as a separate card.

## ⏸️ Parked — implemented, awaiting owner device test
> These are **not** counted against the 2-task *Now* limit: no Claude work is left on them, they
> only need the owner to confirm on a phone. T-014/T-015 committed in `5b315a6`, T-016 in
> `2a76e12`, T-017 in `a1ecedd`. Move a card back to *Now* only if a device test **fails**.
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
- [ ] T-026 (P1) **Offer backend + app hardening** — everything the two 2026-08-02 (3) audits found
  that T-025 deliberately left alone. **Both audits produced the same defect classes in two
  different services**, so fix them as one sweep, not twice.

  **A. Passenger↔driver-offer connection leg** (audit 2, findings 4–17). ⚠️ Unlike the OfferDriver
  leg, this one **is fully wired in both apps** (`OfferDetailsScreen` → join; `OffersListScreen` →
  `OfferPassengers` → confirm/reject) — so these fire in real use, not hypothetically.
  *Overbooking:* `confirmPassenger` (`OfferPassengerService.ts:263-276`) reads `seats_free`, checks,
  then writes `seats_free - n` — two concurrent confirms both pass and 4 seats sell on a 2-seat
  offer (needs a transaction + row lock or `decrement()`); no transaction spans the join update and
  the offer update in either `confirmPassenger` or `cancelJoin` (:422-432); **nothing enforces that
  there is only one front seat** — N passengers can each book it and all be confirmed;
  `confirmPassenger` never checks the offer is still published and not yet started, so a driver can confirm
  passengers onto a **cancelled** offer and decrement its seats.
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
