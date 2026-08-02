# 📔 JOURNAL — daily diary (newest on top)

> Claude writes ONE entry per `/end-day`. Keep entries short — this is for a
> human to quickly remember what happened, not a full report.

---

## 2026-08-02 — T-018 step 9: first real run — two crashes + the rate-limiter proxy bug
- **Task:** Owner pasted a test3 API log and a Metro log. Not a planned step — three defects
  read straight out of the logs.
- **Proof the deploy happened:** the app crash below can only fire on an offer whose
  `max_price_per_seat` is NULL, and NULL can only be written by the new API + the new order
  form. So the API image **is** deployed on test3 and step 9 has actually begun.
- **Bug 1 — API `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`.** The ingress sets `X-Forwarded-For` but
  Express never trusted it, so `express-rate-limit` keyed every request on the **ingress pod's
  IP** — a single shared bucket, meaning one noisy client could lock every user out of the OTP
  and auth limiters. Fixed: `app.set('trust proxy', 1)` in `app.ts:35`. **One** hop, not `true`:
  with `true` anyone could spoof the header and walk past the OTP limiter entirely.
- **Bug 2 — user app `TypeError: Cannot read property 'toString' of null`.** T-018 fallout we
  missed. Step 7 taught the *driver* app that an offer can have no price, but nobody taught the
  *user* app: `MyPassengerOffersScreen` still called `formatNumberWithSpaces(item.max_price_per_seat)`
  and `format.ts:31` does `num.toString()`. It compiled because `api/passengerOffers.ts` typed the
  field as `number` — the type was lying. Fixed the type (`number | null`, so tsc now polices the
  call sites) and the card now shows "Narx kelishiladi", same as the driver app. +1 key × uz/ru/en.
- **Bug 3 — driver app imported a function that was never exported.** `SearchPassengerOffersScreen`
  imports `formatNumberWithSpaces` from `utils/format`, which only the **user** app defines —
  `undefined is not a function` on any priced offer. It was sitting in the 41-error tsc baseline
  unnoticed. Added the function to `driver-app-standalone/utils/format.ts`.
- **Lesson:** the 41/12/289 tsc baselines are not just noise to keep flat — bug 3 was a real
  runtime crash hiding inside the driver baseline, and bug 2 got through *because* a hand-written
  API type disagreed with the schema. When a migration makes a column nullable, grep the app
  types for that column in the same step.
- **Still open (not fixed — owner's call):** the driver app has **no** `api/geo.ts`, but
  `SearchPassengerOffersScreen:27` imports it. PLAN.md logged this as baseline noise; it is not —
  Metro cannot resolve the module, so that screen has never opened. The user app's `api/geo.ts`
  already exports the four symbols it needs, so it is a straight port.
- **tsc:** user **12 → 12**, driver **41 → 40** (bug 3 removed one), API **289 → 289**.
- **Next:** port `api/geo.ts` into the driver app, then resume step 9 — create an offer with
  every field set and walk it through My offers + the driver search screen.
- **Commit:** not committed yet.

---

## 2026-07-28 (2) — T-018 / OR-007 step 1: passenger_offers schema for the new order screen
- **Task:** First implementation step of the approved T-018 plan — the DB migration + model for
  the ~20 new fields of the Figma order screen.
- **Done:** New migration `20260728000001-extend-passenger-offers-figma.cjs` (departure/arrival
  windows, settlement level + landmarks, payment type + payer phone, `seat_counts` JSONB,
  `seat_position_any`, `salon_scope`, `vehicle_class`, `vehicle_types`, 5 flags, pitak text,
  `special_order` JSONB, 2 FK indexes) and `PassengerOffer.ts` (new exported types, attributes,
  creation-optionals, `init` fields). Committed + pushed as `7e49b5e`, then **applied on test3**
  by the owner — `migrated (0.040s)`, 12/12 spot-checked columns verified in `information_schema`.
- **Decisions:** (1) Everything additive/nullable, plus a single `max_price_per_seat DROP NOT
  NULL` — the new form has no price field at all, prices live only inside the special order.
  (2) VARCHAR + app-level validation instead of PG enums, so a new payment method or vehicle
  class never needs a migration. (3) Owner chose to skip a local DB run and migrate straight on
  test3 — so steps 2–7 are written without a local database to test against.
- **Two Figma corrections** (the PNG beat the plan text): vehicle class is **one radio group of
  five** — Standart/Comfort/Biznes/**Econom**/**Turistik**, not 3 classes plus a vehicle-type
  checkbox row (`vehicle_types` stays in the schema, unused by the UI). And
  `004…Tanlov oynasi.png` is **not** the route/time popup — it is the driver-offer selection
  window (Qidiruv/Takliflar, driver + car info, seat/price grid). No mock exists for the
  route/time editor, which has to be settled with the owner before step 4.
- **Migration recipe learned (worth reusing):** the API image is built with
  `npm install --omit=dev`, so the migration file is not in it and `sequelize-cli` may be missing.
  `kubectl cp` the `.cjs` into the running pod, then `npm run db:migrate` inside it — the pod's
  `NODE_ENV=production` + configMap `DB_*` make sequelize-cli pick the right config by itself.
  Written down in `docs/PLAN.md` step 1b.
- **Problems:** none in the migration. `\d passenger_offers | grep …` looked like a failure
  ("exit code 1") — that was only psql's pager getting SIGPIPE'd; `information_schema` confirmed
  everything. Also corrected the stale note claiming T-017 was uncommitted — it is in `a1ecedd`.
- **Next:** step 2 — `PassengerOfferService` + `PassengerOfferController` /
  `PublicPassengerOfferController` accept, validate and return the new fields; `seats_needed`
  computed server-side; `max_price_per_seat` validated only when provided.
- **Commit:** `7e49b5e` (schema + model). Docs updated separately.

---

## 2026-07-28 — T-017 driver app: infinite profile-check loop after OTP login (fix implemented)
- **Task:** Owner reported from a live Metro log: after entering the OTP the driver app "refreshed
  loading and registration many times". New card T-017 (P1).
- **Root cause (the interesting part):** a render-identity feedback loop, not a navigation bug.
  `RootNavigator.checkDriverProfile()` calls `updateUser(serverUser)` with a freshly parsed object,
  so state always changes → `AuthProvider` re-renders → `logout`/`updateUser`/`value` are plain
  inline definitions, so every consumer gets **new function identities** → `checkDriverProfile`
  (a `useCallback` depending on them) gets a new identity → the effect that lists it in its deps
  re-fires → back to the start. Two API calls and one splash flash per iteration. **It only stopped
  because the API rate-limited the app** — the tell-tale `JSON Parse error: Unexpected character:
  T` at the end of the log is a non-JSON error page, which skipped `updateUser` and broke the cycle.
- **Second bug found on the way:** that effect watched `user.profile_complete`, which lives on the
  **user** record (`first_name && last_name && gender`). The **driver** profile is a separate
  record, so a driver can legitimately have `profile_complete: true` and an empty driver profile —
  exactly the logged account (id 13). So it was both looping *and* watching the wrong signal.
- **Done:** `AuthContext` — all nine methods `useCallback`ed with no state deps, `value` `useMemo`ed,
  `logout` moved to the top and reading a new `stateRef`. `RootNavigator` — two effects collapsed
  into one keyed on auth identity only, `profile_complete` watcher removed, `checkInFlightRef`
  guard, dead `refreshTrigger` deleted. New `utils/driverProfileEvents.ts` (module pub/sub) carries
  the explicit "a registration step was saved" signal; `DriverTaxiLicenseScreen` emits it.
- **Decisions:** (1) Replace the `profile_complete` side-channel with an **explicit event** rather
  than tightening the deps — the taxi-license screen used to switch navigators purely as a
  side-effect of the loop, so without it a driver who finished registration would have been stuck
  on the registration stack. That regression was the main risk of this fix. (2) Also fixed the
  `AppState` effect, whose deps included the whole `state` object (it re-registered the OS listener
  on every state change); reading `stateRef.current` gives the handler *fresher* state than the old
  closure did. (3) Left `updateUser({ profile_complete: true })` in place — it writes a real flag
  other code reads; it is just no longer the navigation trigger.
- **Problems / honest status:** **Nothing has run on a device.** Verification is static only: driver
  app `tsc` — **41 errors before, 41 after, identical set** (line numbers normalised, measured
  against a `git stash` of exactly these files). All 41 are pre-existing and unrelated. `npm run
  lint` still fails repo-wide (ESLint 9, no flat config) — pre-existing.
- **Note:** this is the blind spot T-016 flagged in writing ("the driver app has its own
  `RootNavigator` + `checkDriverProfile`, may have the same class of bug"). It turned out to be a
  *different* bug in the same place. Also noticed T-016 was committed by the owner as `2a76e12`;
  PLAN/TODO notes calling it "uncommitted" were corrected.
- **Next:** Owner: rebuild the driver app, enter the OTP, and confirm the Metro log shows
  `Checking driver profile status...` **once** with no splash flicker; then finish registration
  through the taxi-license step and confirm it lands on the main menu.
- **Commit:** ⚠️ **NOT committed** — 4 files awaiting approval. Proposed message:
  `fix(driver): stop the infinite driver-profile check loop after OTP login (T-017)`

---

## 2026-07-27 — OR-006 / T-016 half-finished registration → main menu (fix implemented)
- **Task:** New owner request OR-006 (T-016): "chala registratsiya qilsa registratsiya joyidan
  boshlab ketmasakan. GLavniy menyuga borib qolarkan yolovchi" — a half-finished registration must
  resume on the registration form instead of dropping the passenger into the main menu (user app).
- **Done:** Root cause traced, plan approved, **steps 1-6 implemented** (step 7 = owner deploy +
  device test).
  - **API:** `GET /auth/me` now returns `profile_complete` + the profile fields (it returned
    neither). Also rewrote `UserController.updateProfile`'s completeness rule — it required `email`
    and `birth_date`, which the sign-up form treats as **optional**, then silently corrected itself
    two lines later.
  - **User app:** `AuthContext.initializeAuth()` now **merges** the server user over the cached one
    instead of replacing it; `RootNavigator` decides completeness from data that is actually
    present; `UserDetailsScreen` trusts the server's `profile_complete` instead of forcing `true`;
    new `utils/registrationDraft.ts` keeps the typed fields so the resumed form is pre-filled.
- **Root cause (the interesting part):** not a navigation bug at all. `/auth/me` never sent
  `profile_complete`, and the app **overwrote** its cached user with that reply on every cold start,
  so the flag became `undefined` — and `RootNavigator` read `undefined !== false` as **complete**
  → `MainNavigator`. One API omission, amplified by two unsafe app defaults ("unknown ⇒ complete"
  and a destructive cache overwrite). Fixed all three so the class of bug is gone, not just this
  instance.
- **Decisions:** (1) Owner confirmed "resume from the registration point" means **both** — open the
  form *and* keep what was typed — so the draft is in scope. (2) The draft is **tagged with the
  phone number** and dropped if a different phone registers, so one person's half-typed name can
  never appear in someone else's form. (3) `RootNavigator`'s fallback deliberately accepts
  `display_name`, not just `first_name`: the *old* `/auth/me` sends `display_name` but not
  `first_name`, so a stricter check would have thrown **registered** users onto the sign-up form
  during the window where a new app build meets a not-yet-deployed API.
- **Problems / honest status:** **Nothing has run on a device and the API is NOT deployed** — on
  test3 the old `/auth/me` is still live, so the bug still reproduces until the owner deploys.
  Verification is static only: `tsc` at baseline (user app 12, API 290 pre-existing errors, none in
  any touched file). `npm run lint` fails repo-wide (ESLint 9 with no flat config) — pre-existing,
  unrelated. Also corrected a **stale note** carried in PLAN.md: T-014/T-015 were described as
  uncommitted, but they landed in `5b315a6`.
- **Board hygiene:** *Now* held 4 cards, all implemented and only awaiting device tests, so they
  moved to a new **⏸️ Parked — awaiting owner device test** section and *Now* holds only T-016.
- **Next:** Owner: (1) deploy the API to test3 **first**, (2) build the user app, (3) verify OTP →
  kill from recents → reopen → must land on the registration form **with the typed fields still
  there**, (4) finish registration → reopen → must land on Home.
- **Commit:** ⚠️ **NOT committed** — 13 files on disk awaiting approval. Proposed message:
  `fix(auth): resume half-finished registration instead of the main menu (OR-006)`.
  `.claude/settings.json` (permission entries) is also still modified, unrelated.

---

## 2026-07-26 — OR-003 / T-013 ✅ zero-tap OTP auto-read VERIFIED on device
- **Task:** OR-003 — finish + verify zero-tap OTP SMS auto-read (user app + API)
- **Done:** **Zero-tap works on a real device** (user app, test3 env) — request OTP → code
  auto-fills and auto-submits, no dialog, no tap. First real end-to-end test; everything before
  was static only. Owner set `ESKIZ_OTP_APP_HASH` in the test3 `.env` (picked up by the
  `ubexgo-test3-env` configMapGenerator on redeploy), registered/approved the Eskiz template,
  and confirmed delivery + auto-read. T-013 marked done on the board; OR-003 → ✅.
- **Decisions / big catch:** **The real app hash is `asNtyBnPVzB`, not `JtArsQcEBm9`.** The running
  build logged `[OR-003] SMS Retriever app hash: ["asNtyBnPVzB"]` via `getHash()` — the authoritative
  value SMS Retriever actually matches. The earlier `JtArsQcEBm9` was a wrong static keystore
  computation from a past session (an Eskiz template had even been approved with it). Corrected the
  env, the docs, and the `or003-sms-app-hash` memory. **Lesson: trust `getHash()` on a real build
  over any hand-computed keystore hash.**
- **Problems / carry-forward:** `android/app/debug.keystore` is **not committed to git** and signs
  both debug+release (`build.gradle:118`), so `asNtyBnPVzB` only holds for builds from this machine's
  current keystore — a real production release `.jks` (or a clean prebuild elsewhere) changes it →
  must redo the Eskiz template + env then. Also: register a production-grade Eskiz template for the
  `asNtyBnPVzB` wording before real users (test send delivered on a test number).
- **Next:** Owner continues in a new chat. Board's remaining items are device-test confirmations for
  T-011/T-012/T-014/T-015 (all implemented) or fresh work T-001 (join flow) / T-002 (offer wizard).
- **Commit:** ⚠️ **NOT committed** — T-014/T-015 app changes + today's doc updates are on disk,
  awaiting approval. `.claude/settings.json` also modified (permission entries).

---

## 2026-07-22 — OR-003 / T-013 SMS Retriever implemented + pushed
- **Task:** OR-003 — zero-tap OTP SMS auto-read (user app + API)
- **Done:** All CLAUDE steps of the plan (1, 2, 4, and the code half of 3).
  Committed `9b36014` (Option A backlog + docs) and `d963cfb` (Option B), **pushed to
  `origin/main`** so the server can deploy from the last commit.
  - User app: `react-native-otp-verify@1.2.0` + new `utils/smsRetriever.ts` (lazy Android-only
    require, extracts the code from the full SMS body, ignores the timeout sentinel);
    `OTPVerificationScreen` starts/stops the listener, auto-submits, guards double-submit.
  - API: `config.eskiz.otpAppHash` + `OtpService.buildOtpMessage()` behind `ESKIZ_OTP_APP_HASH`,
    with the 140-byte cap enforced in code.
- **Decisions:** (1) Did **not** use the library's `useOtpVerify` hook — it builds a
  `NativeEventEmitter` from a *throwing Proxy at import time*, which can crash on iOS; wrapped it
  defensively instead. (2) Put the byte check in code, not just in the docs, so a wrong hash
  degrades to a working SMS + warning instead of silently killing autofill.
- **Wins:** ✅ **140-byte risk resolved by measurement** — 105 B now, 117 B with the hash, so the
  Cyrillic wording stays and the owner does NOT need a reworded template.
  ✅ With the env unset the SMS is **byte-identical to today's**, so deploying is safe before the
  new Eskiz template is approved.
- **Problems / honest status:** **Nothing has run on a device.** Verification so far is static
  only: `tsc` (user app 12 / API 290 errors, both = pre-existing baseline, none mine), a Gradle
  compile of the native module (BUILD SUCCESSFUL), and Node unit-tests of the code-extraction (8/8)
  and message-building (3/3). Zero-tap is unproven until a real SMS on a real phone.
  Also corrected a mistake from the previous session: I had conflated same-named npm packages —
  the installed lib is an **old-style bridge module**, not a TurboModule (works via New-Arch
  interop; most likely thing to break on a future RN upgrade).
  **Environment:** Avast Web/Mail Shield re-signs HTTPS, which breaks npm, Gradle **and git push**
  (Node/Java/git each have their own truststore). Worked around per-command without disabling
  TLS checks; a permanent fix is still owner's call.
- **Next:** Owner: (1) release build → read `[OR-003] SMS Retriever app hash:`, (2) new Eskiz
  template with that hash, (3) only after approval set `ESKIZ_OTP_APP_HASH`, (4) zero-tap test.
  Still also pending: device tests for OR-001 (T-011) and OR-002 (T-012).
- **Commit:** `d963cfb` (pushed). Uncommitted leftover: `.claude/settings.json` (permission
  entries only, unrelated to the feature).

---

## 2026-07-21 (5) — OR-003 / T-013 decision + HANDOFF
- **Task:** OR-003 — decide the OTP auto-read approach; hand off to next session
- **Done:** Shipped Option A (JS autofill). Device-tested on Samsung S24 → **Android did NOT
  auto-fill** (expected JS limitation; iOS still benefits). Explained the native options.
- **Decisions:** Owner chose the **SMS Retriever (hash)** path — zero-tap, no read dialog, no SMS
  permission (over User Consent, which pops a dialog each time). Plan of record written in PLAN.md.
- **Problems / watch-outs for next session:** (1) RN 0.81 **New Architecture** compat of the SMS
  lib — verify before wiring. (2) SMS Retriever needs the message **≤140 bytes** — current Cyrillic
  text is byte-heavy; measure with the hash. (3) **release** hash (not debug) is what prod SMS needs.
- **Next (new chat / /start-day):** PLAN.md Step 1 — add the SMS Retriever module to the user app
  (ask before finalizing the dep), then wire listener + hash + backend env; owner does the Eskiz
  template + env + release test.
- **Commit:** ⚠️ still UNCOMMITTED: OR-003 Option A (`OTPVerificationScreen.tsx`) + docs. Proposed
  `feat(otp): one-tap SMS autofill on the user app OTP screen (OR-003)`. Also still pending: device
  tests for OR-001 (T-011) and OR-002 (T-012), and the k3s deploy 401 (kubectl/k3s certs) on `fstu`.

## 2026-07-21 (4) — OR-003 / T-013 OTP SMS autofill
- **Task:** Owner request OR-003 — auto-read the OTP SMS (user app)
- **Done:** Option A: added `textContentType="oneTimeCode"` + `autoComplete="sms-otp"` +
  `importantForAutofill` to the user-app OTP inputs; box 0 takes the full code and
  `handleOtpChange` spreads an autofill dump across the 4 boxes + auto-submits. tsc clean.
- **Decisions:** superseded by entry (5) — moved from A/Consent to SMS Retriever (hash).
- **Next:** see entry (5).
- **Commit:** proposed `feat(otp): one-tap SMS autofill on the user app OTP screen (OR-003)`

---

## 2026-07-21 (3) — OR-002 / T-012 deleted-user logout
- **Task:** Owner security bug OR-002 — deleted passenger/driver still gets into the app
- **Done:** Full fix (App + API). API `authenticate` middleware now verifies the user still
  exists (401 if deleted). Both apps attach the HTTP status from `/auth/me` and, on 401/403/404,
  clear the cache and return to the login/OTP screen (driver also on foreground). Kept cache
  fallback for network errors (offline). `tsc`: no new errors (backend 290 = same as HEAD).
- **Decisions:** App + API (owner-approved). Blocked/pending_delete stay on BlockedScreen; only
  deleted → login. DB errors pass through (no false-logout on outage).
- **Problems:** Backend has a big pre-existing `tsc` backlog (290 errors) — runs on tsx in dev;
  out of scope. User app has no foreground-refresh handler (reopen path covers it).
- **Next:** Owner device test (login → admin delete → reopen → login); then commit.
- **Commit:** proposed `fix(auth): log out deleted users + reject deleted tokens (OR-002)`

---

## 2026-07-21 (2) — OR-001 / T-011 OTP resume
- **Task:** Owner bug OR-001 — OTP screen jumps to main menu after backgrounding
- **Done:** Root-caused (app killed in background + no nav persistence). Implemented a
  targeted fix in BOTH apps: `utils/pendingOtp.ts` + `AuthNavigator` resume-to-OTP +
  save/clear in the OTP screen + clear on logout. `tsc` clean for all changed files.
- **Decisions:** Both apps, targeted persistence (not full nav-state). Deferred the
  splash/NavigationContainer refactor — not needed for this fix.
- **Problems:** Can't run the RN apps headless here; behavior needs a device test.
  ESLint isn't configured in either app (no flat config) — used `tsc` instead.
- **Next:** Owner rebuilds an app and verifies resume; then commit + mark done.
- **Commit:** proposed `fix(otp): resume OTP screen after app is backgrounded (OR-001)`

---

## 2026-07-21
- **Task:** Adopt the project-control-kit (CLAUDE.md + docs/ + slash commands)
- **Done:** Installed `CLAUDE.md`, `docs/` (ARCHITECTURE, TODO, PLAN, JOURNAL), and
  `.claude/commands/` at the repo root, personalized to the real UbexGo stack
  (Express + Sequelize + PostgreSQL; 2 RN apps; admin panel). Seeded T-001 as the
  current task (verify passenger→offer join flow).
- **Decisions:** Backend is Express, not NestJS (spec was aspirational). Kept the kit's
  simple 4-file memory model rather than a heavier vault.
- **Problems:** ~48 scattered `.md` fix-notes and stale `tmp/` duplicates still need
  consolidating — parked as T-004 (Phase 2), needs approval before moving/deleting.
- **Next:** `/start-day`, then T-001 step 1 (audit the join flow).
- **Commit:** `chore: add CLAUDE.md + docs control system`

---

## Entry template (copy for each new day)

## YYYY-MM-DD
- **Task:**
- **Done:**
- **Decisions:**
- **Problems:**
- **Next:**
- **Commit:**
