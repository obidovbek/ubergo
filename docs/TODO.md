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
  Schema + API + user app + driver-app views. **Plan APPROVED 2026-07-28. Step 1 DONE —
  migration + model committed (`7e49b5e`) and applied on test3. Next: step 2, the API layer.**
  → `docs/OWNER_REQUESTS.md` OR-007

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
