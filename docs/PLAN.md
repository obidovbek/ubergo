# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 📦 **T-101 (the design system) → `docs/PLAN-T101.md`, moved 2026-09-14 when T-118 took this
> file.** It is still in *Now*; steps 2b and 19-26 are open; its sub-plans are
> `PLAN-T101-step14b/16/17/18/19.md` and `PLAN-T101-SCOPES.md`. Resume it from that file.
> 📦 **T-102 → `PLAN-T102.md`** (T-102i next, the read side) · **T-102c-3 → `PLAN-T102c3.md`**.
> 📦 **T-088 (Paynet) → `docs/PLAN-T088.md`.** Still in *Now*; one code step (`ChangePassword`
> persistence), the rest is T-100 and Paynet's credentials.
> 📦 **T-114 → `PLAN-T114.md`**, sub-step ① planned, not started.
> ✅ **T-092** → `PLAN-T092.md`. ✅ **T-091** → `PLAN-T091.md`. ✅ **T-087** → `PLAN-T087.md`.
> ✅ **T-081** → `PLAN-T081.md`. ✅ **T-078** → `PLAN-T078.md`. ✅ **T-077** → `PLAN-T077.md`.
> ✅ **T-065** → `PLAN-T065.md`. ✅ **T-066+T-067** → `PLAN-T066-T067.md`. ✅ **T-061** → `PLAN-T061.md`.
> 🔴 **T-047 PARKED.** 🛑 **T-031 — item 1 CLOSED by the owner, do NOT reopen** → `PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own files.

> 🤝 **`docs/HANDOFF-2026-09-12.md`** still describes the board state for the T-101 / T-102 work.

## 🔴 BOARD STATE 2026-09-14 — read before starting anything

**`tsc` BASELINES: API 281 · admin 6 (via `tsc -b`) · user 6 · driver 28.** All four lint at
**0 errors**. **Lint WARNING baselines: user 208 · driver 275.** **Raw-colour ceilings: user 1 ·
driver 3**, enforced by `scripts/check-design-tokens.mjs` in each app.
🔴 **USER LINT CORRECTED 216 → 208 on 2026-09-14.** This file was written from the 09-11 resume
point; the journal had recorded **0/208** four times since 09-12 (the T-102 / T-115 work removed
unused imports). Proven not to be this card's doing: `git stash` of every T-118 file still read
208. *The stale number would have read a real 8-warning regression as "at baseline".*
🔴 **Never rebaseline upward.** A test file that adds a `tsc` error or a lint warning is a defect
in the test file, not a new baseline.

**Checkers that must stay green** (all `node scripts/check-*.mjs`, esbuild-bundled, no runner):
user app **12** · driver app **11**. Every one has been proven able to go red. They are NOT being
ported — see Approach.

---

## Task

- **ID / name:** T-118 — automated tests for both RN apps (a Jest runner, a render harness, and
  behaviour tests for the screens that keep needing a phone)
- **Why now:** the owner, 2026-09-14: *"after any change whole device test is crazy, I think we
  need automatic test."* The journal agrees — **seven unverified changes are stacked on the driver
  app**, steps 14b-18 of T-101 have never been on a phone, and the last three cards each carried
  a "🛑 NOT ON A DEVICE" line. The apps have **23 checker scripts and no test runner**; the only
  suite in the repo is the API's `node:test` over `utils/` (T-010). Every rendered screen, every
  interaction and every "did the rewrite silently drop the ✕ button" question still costs a phone.

### Goal (definition of "done")

1. **`npm test` exists in both apps and is ONE command:** Jest, then every existing
   `scripts/check-*.mjs`. Green on `main`. Red when any of them is red.
2. **A render harness** (`test/render.tsx` + `test/setup.ts` per app, duplicated on purpose like
   the components) so a screen is rendered in a test in a few lines: providers, navigation, a
   stubbed signed-in user, the real translations, and the native modules mocked once.
   **A screen that renders a missing translation key FAILS the test** (the hook's warning is
   trapped) — the i18n checkers grep; this evaluates.
3. **Behaviour tests exist for the risk points the CHECKLIST and the journal name** — §3 the order
   form, §7 both halves of the driver↔passenger connection, §2 login, §4/§8 the two merged lists,
   `GeoSheet`'s QFY rule (the walk item no checker covers), and the wizard's 34-field edit round
   trip. Each is **proven able to fail** (one mutation, caught by exactly that test, reverted).
4. **No snapshot tests.** T-101 is repainting every screen; a snapshot goes red on every repaint
   and gets regenerated blind. Tests assert behaviour: what renders, what a press calls, what
   payload leaves.
5. **All six app baselines unchanged** (user 6 / 216 / 1 · driver 28 / 275 / 3), measured after
   every step. No runtime change: nothing in `App.tsx` or any screen changes for the sake of a test.
6. **The docs say what is automated and what still needs a phone:** CLAUDE.md §1 and §6,
   `CHECKLIST.md` §0 and its "Later" section, T-010 re-scoped to the API half.
7. *(owner's call, step 12)* **CI runs all three `npm test`s on every push** so "after any change"
   is literally automatic.

### Explicitly OUT of scope

- 🛑 **Server flow tests against a database** (CHECKLIST "Later" items 1-2). They need a test DB
  and the service extraction T-010 already describes. **T-010 keeps the API half.**
- 🛑 **End-to-end on an emulator (Maestro / Detox).** Login is a real SMS OTP with no test bypass,
  so an E2E run cannot get past the first screen without a backend change. Board it when the
  bypass is designed; not here.
- 🛑 **Refactoring a screen to make it testable.** If a screen will not render under the harness,
  the step logs why in Session notes, boards a card, and moves on (rule 1: one task at a time).
- 🛑 **Porting the 23 checkers into Jest.** They work, they are proven, and porting is busywork.
  `npm test` wraps them. New PURE-logic tests go into Jest from now on; the esbuild pattern stops
  growing.
- 🛑 **A tsc / lint baseline ratchet script.** Wanted (the colour ratchet already exists), but a
  separate small card → *Later*.

### What stays phone-only, stated up front

Fonts and weights (a wrong weight renders *nearly* right) · layout against the artboard · SMS
autofill (OR-003) · push delivery and routing from a real notification · the native build (2b) ·
anything Google SSO. The CHECKLIST keeps those; this card shrinks the walk to them.

## Approach

- **Runner: `jest-expo`** — Expo's own preset, already knows Expo modules, fonts, assets and the
  RN transform. **`@testing-library/react-native` 13.x** for rendering and queries (14 switched to
  a new `test-renderer` package that jest-expo 54 does not ship; 13 uses the `react-test-renderer`
  19.1.0 jest-expo already depends on). **Jest 29.7** — jest-expo 54 pins `babel-jest` and
  `jest-snapshot` at ^29; Jest 30 is not it.
- **Explicit imports, no globals:** `import { describe, it, expect, jest } from '@jest/globals'`,
  mirroring the API's `import { describe, it } from 'node:test'`. Both apps' `tsconfig.json` have
  `"types": []`, which is why ambient `@types/jest` would silently NOT apply. ⚠️ **Step 1 is the
  decision point:** if RNTL's matcher types do not attach to `@jest/globals`' `expect`, switch to
  `@types/jest` + `"types": ["jest"]` — a one-line tsconfig change, measured for `tsc` drift.
- **Dependencies (rule 4 — owner approves in step 0), devDependencies only, both apps:**
  `jest@~29.7.0` · `jest-expo@~54.0.18` · `@testing-library/react-native@^13` ·
  `@jest/globals@~29.7.0` (or `@types/jest`). **No runtime change, no native change — no rebuild
  is caused by this card.** `expo install` picks the jest / jest-expo versions.
- **No `babel.config.js` unless step 1 proves jest-expo needs one.** Metro injects
  `babel-preset-expo` when the file is absent; if Jest does not, the file is the documented
  three lines and changes nothing Metro does.
- **Tests live beside the code as `*.test.ts(x)`** — the API's convention (CLAUDE.md §1).
  Harness and fixtures in `test/` at each app's root. Fixtures are typed against `api/*.ts`, so
  a payload shape drift is a `tsc` error, not a stale fixture.
- **The API layer is what gets mocked** (`api/passengerOffers.ts` etc. — screens do not call
  `fetch`; 3 + 1 screens import `config/api` directly and those get `config/api` mocked). Native
  modules (`@react-native-firebase/*`, `react-native-otp-verify`, `google-signin`, async-storage's
  official jest mock, `expo-font`'s `useFonts` → loaded) are mocked ONCE in `test/setup.ts`.
- **Prove red, every time.** The rule this project has used since T-010: one deliberate mutation
  per test file, caught by exactly the test that should catch it, then reverted. Written into each
  step below; a step is not `[x]` until its mutation line is filled in.
- **Order: harness first, then by risk, driver and user alternating.** The CHECKLIST's own order
  is §3 → §7 → §2; the journal's loudest gap is `GeoSheet`. Owner may reorder in step 0.

## Steps

- [ ] **0. Owner decisions (this message).** (a) approve the 4 dev dependencies in both apps;
  (b) name the card that leaves *Now* — recommendation **T-114** (planned, not started, its plan
  file loses nothing); (c) CI on GitHub Actions, yes or no (step 12); (d) accept or reorder the
  screen order in steps 4-11; (e) confirm `@jest/globals` explicit imports over `@types/jest`
  globals (step 1 falls back if the types refuse).
- [x] **1. User app — the runner, proven red.** ✅ **DONE 2026-09-14.** `jest ~29.7.0` ·
  `jest-expo ~54.0.18` · `@testing-library/react-native ^13.3.3` · `@jest/globals ~29.7.0` —
  **plus `react-test-renderer` pinned EXACTLY at `19.1.0`** (a fifth devDependency, flagged to
  the owner): RNTL 13's peer on it made npm reach for 19.3.0, which wants React 19.3, and the app
  is on 19.1.0; the pin is the version jest-expo already ships. **No `babel.config.js` needed** —
  jest-expo transformed TS without one. **Typing route: `@jest/globals`, no tsconfig change.**
  `utils/rideTime.test.ts` 12 tests · **proved red by mutating the CODE** (`latestDeparture`
  made to prefer the window's start → exactly the defect-③ test failed, 11 passed; reverted with
  `git checkout`). **`npm test` = 12 tests + 11 checkers green in 54 s.** **Measured: `tsc` 6 ·
  lint 0 / 208 · tokens 1** — the 208 is the true baseline, see the board-state correction.
  *Original step text:* `npx expo install jest-expo jest --dev`, then
  `@testing-library/react-native@13` and `@jest/globals`. `"jest"` block in `package.json`
  (`preset: jest-expo`, `setupFilesAfterEnv: ['<rootDir>/test/setup.ts']`, ignore `android/`,
  `.expo/`, `tmp/`). `test/setup.ts`: async-storage mock, firebase / google-signin / otp-verify /
  `useFonts` mocks, **and the `console.warn` trap for "Translation key not found"**.
  First test: `utils/rideTime.test.ts` — one rule `check-ride-time.mjs` already pins, so the two
  runners are shown to agree. `scripts/run-checks.mjs` runs every `check-*.mjs` in order, stops
  on the first red; `"test": "jest && node scripts/run-checks.mjs"`.
  **Prove red:** flip one assertion → `npm test` exits non-zero → revert.
  **Measure:** `tsc` 6 · lint 0 / 216 · tokens 1. Note the typing route chosen (Approach).
- [x] **2. Driver app — the same, copied not re-derived.** ✅ **DONE 2026-09-14.** Same five
  devDependencies, `react-test-renderer` pinned exactly from the start (no conflict this time).
  `test/setup.ts` differs from the user copy only by LACKING the Google sign-in and OTP mocks —
  neither package is a driver dependency, and `jest.mock` of an absent module throws.
  `utils/activeOffers.test.ts` 19 tests · **proved red by mutating the CODE** (`>=` → `>` in
  `isActiveOffer` → exactly the "leaving exactly now" test failed, 18 passed; reverted).
  **`npm test` = 19 tests + 11 checkers green in 44 s. Measured: `tsc` 28 · lint 0 / 275 ·
  tokens 3 — all at baseline, none of the three new files adds an error or a warning.**
  *Original step text:* smoke test `utils/activeOffers.test.ts` (the T-115 counter rules; the
  API has the twin test). Prove red. **Measure:** 28 · 0 / 275 · 3.
- [x] **3. The render harness, both apps.** ✅ **DONE 2026-09-14.** `test/render.tsx` →
  `await renderScreen(ui, { auth?, routeName?, params? })`. **Three things measured differently
  from the step text:** ① **it is `async`** — the user app's real `LanguageProvider` sets state
  after an AsyncStorage read resolves, which React reports as an update outside `act`; the
  harness lets one round of mount-time promises settle, which real screens need anyway. ② **No
  `test/api.ts` / `mockApi` helper** — `jest.mock` is hoisted per FILE, so each test mocks its
  own `api/*` module at the top; a helper cannot do it. ③ **`AuthContext.Provider` is fed a
  stub, not the real `AuthProvider`** (which validates the token and registers a push token on
  mount) — `buildAuth()` returns a signed-in user and `jest.fn()` methods. The driver copy
  has no `LanguageProvider` (its hook keeps local state) and types the stub as `DriverProfile`:
  **the driver app has NO `User` type — `AuthContext.tsx` imports one that `api/users.ts` does
  not export, one of its 28 baseline errors.** `SegmentedModes.test.tsx` × 2 (identical): 5
  tests — tabs by accessible name (count folded in, zero still drawn, none = bare label),
  selected state, press → `onChange('history')` once, radius 12, pill = `full`. **Prove red:**
  `SEGMENT_RADIUS = 24` → exactly the radius test failed in each app; reverted. **Measured:
  user 6 / 0 · 208 / 1 · driver 28 / 0 · 275 / 3** (the driver stub first read 29 — the
  profile's two timestamp fields — fixed in the test file, not the baseline).
  *Original step text:* `SafeAreaProvider` with `initialMetrics`, `LanguageProvider`,
  `AuthProvider` with a stubbed signed-in user, `ConfirmDialogProvider`, and a
  `NavigationContainer` holding a one-screen stack so `useNavigation` / `useRoute` are real.
  Proof on `SegmentedModes` in BOTH apps: a press calls `onChange` with the mode, and the pill
  draws `borderRadius: 12` — the defect 17b measured at 24 in both apps.
- [x] **4. Driver: `GeoSheet` — the rule no checker covers.** ✅ **DONE 2026-09-14.**
  `components/geo/GeoSheet.test.tsx`, 7 tests, `api/geo` automocked (it re-exports `./driver`;
  the automock follows). Mounted the way the wizard mounts it (`multiSelectAt` adm2 + adm3,
  `canAdvance={canPickSettlements}`): ① one district → *Tayyor* → the QFY level opens, the
  fetch is for that district's id, the chosen QFY comes back; ② two districts → done at adm2
  with NO `settlements` / `settlement` key and no settlement fetch; ③ **walk item 3** — a QFY
  ticked, back, a second district ticked → *Tayyor (2)* → no `settlements`; ④ a stop row
  (`endLevel='district'`) never offers QFYs; ⑤ *Butun tuman* returns `settlements: []` (the
  empty answer, not a missing one); ⑥ zero districts → the footer is disabled and `onDone`
  never fires; ⑦ the full cascade from the country. **Measured, not assumed: the wizard
  REOPENS the sheet at the country level** (`geoSheetInitialPath()` carries `settlements`, but
  the first country tap deletes every deeper key), so a stale QFY cannot survive a reopen —
  the rule only has to hold within one open session, which ③ pins. **Prove red:** the rule
  inverted in `utils/offerRestore.ts` (`=== 1` → `!== 1`) → exactly the 5 QFY-dependent tests
  failed, the 2 that do not consult it passed; reverted. **Found and fixed on the way:**
  `clearMocks: true` added to BOTH apps' Jest config — without it a mock's call history leaks
  between tests and a `not.toHaveBeenCalled()` reads an earlier test's call (two false reds).
  **Measured: driver 28 / 0 · 275 / 3; user suite re-run under the new config, 17 green.**
  *Original step text:* mock the geo loader with a fixture: 2 districts, 3 QFYs. (a)
  `endLevel='settlement'`, one district ticked → *Tayyor* → the QFY level opens; (b) two
  districts ticked → *Tayyor* → `onDone` fires at district level and the path carries no
  `settlements`; (c) `endLevel='district'` (a stop row) never shows QFYs.
- [x] **5. User: `CreatePassengerOfferScreen` (CHECKLIST §3).** ✅ **DONE 2026-09-14.**
  `screens/CreatePassengerOfferScreen.test.tsx`, 5 tests; `api/geo`, `api/passengerOffers` and
  `utils/toast` mocked at the module boundary; a frozen `Date.now` so the default departure is
  exactly computable. 🔴 **The step text was STALE and was measured before writing:** 8c rebuilt
  `LocationCard` onto `GeoSheet`, so the "two ✕ clear buttons" no longer exist, the 255 cap is
  on the LANDMARK field (shown only once a district is chosen), and the screen has a NAMED
  export (the navigator imports it by name — no `export default` to lose). Pinned instead:
  ① mounts, fetches countries once, both endpoints empty; ② empty submit → the from/to errors
  render, the toast fires, nothing reaches the API; ③ province → district → QFY through the
  sheet, the row reads QFY over ancestors, the landmark field appears capped at 255; ④ the
  minimal order (route + *Butun salon* + *Naqd*) leaves ONCE with texts, all six geo ids,
  `start_at` = now + 60 min, `is_urgent: false`, `match_scope: 'aro'`, the payment flags,
  `salon_scope`, `front_seat: true`, `currency`, and `seat_counts` / windows / note absent —
  then the success dialog, not a toast; ⑤ the clock moved 45 min → the default departure is
  inside the 31-minute floor → `errorTime`, no API call.
  🔴 **A REAL DEFECT, FOUND BY ④ AND FIXED (one character, runtime code):** `CheckRow.tsx`
  rendered `-{label}` — a literal hyphen before EVERY check-row label on the order form
  ("-Butun salon", "-Naqd"…), since the owner's commit `49c0c5b` of **2026-08-02**, surviving
  the 8c and step-15 rewrites; `UserBuyurtma.dc.html` draws no dash. Only occurrence in either
  app. *This is the class of thing the walk was for, and the test found it on first render.*
  **Prove red:** `from_settlement_id` blanked in the payload builder → exactly ④ failed;
  reverted. **Measured: 6 / 0 · 208 / 1.**
  *Original step text:* default export renders under the harness; both ✕ clear buttons exist
  and clear; the comment field has `maxLength` 255; a past departure is refused at submit
  (T-069's real premise); the minimal valid order calls create once with the expected payload.
- [x] **6. Driver: `PassengerOrdersScreen` (§7, driver side).** ✅ **DONE 2026-09-14.**
  `screens/PassengerOrdersScreen.test.tsx`, 4 tests. **Mock shape that matters:**
  `api/passengerOffers` is mocked with a `jest.requireActual` spread so the PURE helpers
  (`passengerNameOf`, `passengerPhoneOf`) stay real — an automock blanks every name and phone
  and the assertions go silent; `api/driver` (the vehicle) and `utils/toast` are automocked.
  ① incoming = search results MINUS the orders already bid on, with the count line and title;
  ② card → sheet → *Qabul qilish* → the confirm dialog → join called ONCE with
  `{ vehicle_id, seats_offered: 2, offered_price_per_seat: 50000 }` (the listed price) → the
  accept result dialog; ③ *Taklif yuborish* → the per-seat field is SEEDED from the listed
  50 → typed 45 → join called with `offered_price_per_seat: 45000` (per seat, thousands ×
  1000), `seats_offered: 2`, `message: undefined` → the sent result → *Yopish* → the list is
  in sent mode; ④ sent mode: a pending request shows *Bekor qilish* and the T-054
  "opens once confirmed" line, cancel → dialog → confirm → cancel called with THAT request's
  id; a confirmed request shows neither the hidden line nor "no phone" nor cancel.
  **Two harness lessons:** the sheet's *Taklif yuborish* shares its text with a list label, so
  the sheet's copy is the LAST match; a mount-time API promise needs one `act` flush after
  `waitFor` sees the call, or the state it sets is not there yet. **Prove red:** the
  counter-offer sent as `thousands × 1000 × seatsNeeded` → exactly ③ failed; reverted.
  **Measured: driver 28 / 0 · 275 / 3.**
  *Original step text:* incoming fixture → a card → the sheet: accept at the listed price calls
  the join API with that price; a per-seat counter-offer sends the per-seat price; the phone
  row is absent until the T-054 gate allows it; cancel while pending calls cancel.
- [x] **7. User: `OfferDriversScreen` (§7, passenger side).** ✅ **DONE 2026-09-14.**
  `screens/OfferDriversScreen.test.tsx`, 5 tests; `api/passengerOffers` mocked with the pure
  `driverNameOf` left real (same lesson as step 6). ① three bids render with name, car line,
  terms, status pill, and NO contact box; ② accept → the dialog names the driver AND "2"
  rivals → confirm → `confirmDriver('bid-1')` once, no reject, the list reloads; ③ with no
  rival pending the plain message (no count) is used; ④ reject → the dialog names the driver →
  `rejectDriver('bid-2')` once, no reason, no confirm; ⑤ two confirmed bids → two contact
  boxes, one with the phone and one with the T-054 "no phone" line, and no accept/reject
  anywhere. **Prove red:** the rival filter's `d.id !== join.id` clause removed → ② (count 3)
  and ③ (a count where none is due) both failed; reverted. **Measured: user 6 / 0 · 208 / 1.**
  *Original step text:* fixture with three bids → accept one → the confirm dialog names the
  rival count (2) → accept API called with that bid; reject → reject API.
- [x] **8. Driver: `OfferWizardScreen` edit round trip (§8, the silent-blanking guard at UI
  level).** ✅ **DONE 2026-09-14 — and it rendered first time; the "will not render" exit was
  not needed.** `screens/OfferWizardScreen.test.tsx`, 2 tests; `api/driver`, `api/driverOffers`
  and `utils/toast` automocked. 🔴 **The step text's "34-field fixture in the checker" did not
  exist** — `check-offer-restore.mjs` carries city lists, not an offer; the fixture was written
  here in the awkward shape pg sends: DECIMALs as STRINGS (`'150000.00'`), a legitimate **0**
  (`pickup_fee: '0.00'`, `free_waiting_min: 0`) and a legitimate **false** (`payment_card`) —
  the values a careless `||` erases (T-078) — plus a `from` place WITH a QFY and a `to` place
  without, so both `buildOfferPlaces` branches run. ① the load walks countries → provinces →
  districts → QFYs (fetched ONCE, for the one-district side only) → the vehicle, and the two
  districts and the QFY are on screen; ② *E'lonni yangilash* without touching anything →
  `updateDriverOffer(token, id, payload)` ONCE with all 34 scalar fields back as sent (strings
  → numbers, 0 → 0, false → false), `from_places` with the QFY id, `to_places` with
  `settlement_id: null`, `stops` and `arrive_from` absent. **Measured, not assumed: the schedule
  is NOT re-derived on a plain save** — `start_at` / `depart_until` / `arrive_until` only change
  through `commitSchedule`, so the ISO strings round-trip byte-for-byte. **Prove red:**
  `parcel_max_kg` blanked in the restore → exactly ② failed; reverted. **Harness fix on the
  way:** `onUnhandledAction` silenced on the one-screen navigator (a save ends in `goBack()`,
  which has nowhere to go in a test) — both apps. **Measured: driver 28 / 0 · 275 / 3.**
  *Original step text:* mock `api/driverOffers` get with the 34-field fixture the checker
  carries; open in edit mode; press save without touching anything; the update payload equals
  the fixture field-for-field. ⚠️ 1 895 lines, four sheets, geo effects on mount — the step most
  likely to hit the "will not render" exit.
- [x] **9. User: `MyOrdersScreen` (§4).** ✅ **DONE 2026-09-14.** `screens/MyOrdersScreen.test.tsx`,
  4 tests; both `api/*` modules mocked with their pure helpers (`driverPhoneOf`) left real. A
  7-row fixture across both sources: ① ONE fetch per source (T-051), pills *Jarayonda 2 · Faol
  2 · Tarix 3*, the open request and pending booking in Jarayonda with their cancel buttons and
  no rate button; ② mode switches fire NO request — Faol shows the matched request and the
  confirmed booking's call button (T-054), Tarix shows two requests and the finished booking's
  rate button; ③ cancel request → dialog → *Ha* → `cancelPassengerOffer(11)` once, then a
  reload; ④ cancel booking → dialog → *Ha* → `cancelJoin(token, 'b-21')` once.
  ❓ **MEASURED AND LEFT AS IS — an owner question, not a fix:** the cancel buttons key off the
  RAW status, not the phase. An open request that has EXPIRED (still `published` on the server)
  keeps *So'rovni bekor qilish* in history, and a FINISHED booking (still `confirmed`) keeps
  *Bronni bekor qilish*. My first assertion assumed history rows cannot be cancelled and went
  red; the test now pins the real rule with a comment. → boarded as a question on T-118's card.
  **Prove red:** `offerMode` made to bucket `cancelled` as active → ① and ② failed; reverted.
  **Measured: user 6 / 0 · 208 / 1.**
  *Original step text:* one fixture → the three modes hold the right rows and the count pills
  the right numbers; cancel calls the API with the right id. Prove red: put an archived row in
  the active mode.
- [x] **10. Driver: `MyRidesScreen` (§8).** ✅ **DONE 2026-09-14 — passed on the first run.**
  `screens/MyRidesScreen.test.tsx`, 4 tests; `api/driverOffers`, `api/offerPassengers` and
  `utils/toast` automocked, with the offers mock keyed on a "confirmed on the server" flag so a
  reload returns the ride FULL. ① phases derived from the rows (*Jarayonda 1 · Faol buyurtmalar
  1 · Buyurtmalar tarixi 2*), the first ride expands by itself and its passengers load (the
  count line reads 2), the pending passenger has confirm + reject, the confirmed one the call
  button and the number (T-054), the seat labels are right; switching phase expands THAT
  phase's first ride and fetches its passengers; ② confirm → the dialog names the passenger
  and the seats → `confirmPassenger(token, 'j-1')` once → the reload returns the ride full →
  *Jarayonda 0 · Faol 2* and the empty line — **the phase move is real, not asserted on
  state**; ③ reject → the nine-reason sheet → a listed reason → `rejectPassenger(token,
  'j-1', <that reason's text>)`; ④ *Boshqa* → the sheet's button is DISABLED until text is
  typed, a press does nothing, then the trimmed text is sent. ⚠️ Ride ids are numeric strings
  on the wire — the screen calls the passengers API with `Number(id)`; a UUID fixture would
  have sent `NaN` and hidden that. **Prove red:** the reason dropped from the reject call → ③
  and ④ failed; reverted. **Measured: driver 28 / 0 · 275 / 3.**
  *Original step text:* one fixture → the three DERIVED phases; confirming a passenger moves
  the ride to the next phase; reject with a reason sends that reason.
- [x] **11. Auth (§2), both apps.** ✅ **CODE DONE 2026-09-14, all green — TWO PROOFS STILL OWED
  (see 🛑 below).** `screens/PhoneRegistrationScreen.test.tsx` in each app — a FLOW test: the OTP
  screen is registered in the harness (the new `screens` option), so the phone screen's
  `navigate('OTPVerification', …)` is a REAL screen change the test keeps working on.
  🔴 **Measured before writing: BOTH apps' continue buttons are `disabled` until the input is
  complete** (phone: the country's local length; driver: or a user id; OTP: 4 digits), **so the
  screens' "incomplete" warnings are UNREACHABLE from the UI** — the tests pin the disabled state,
  not the toast. **User (3 tests):** ① continue disabled below 9 digits, enabled at 9, a press does
  nothing; ② `sendOtp('+998901234567', 'sms')` once → the OTP screen; ③ the OTP continue is
  disabled below 4 digits; a pasted 4-digit code (the autofill path) verifies at once with THAT
  phone and THAT code; a wrong code → `errorIncorrect` + "2" remaining, boxes cleared, still on the
  OTP screen; the right code typed digit by digit verifies on the fourth. **Driver (5 tests):**
  ① disabled until a full phone OR an id; ② `sendOtp(E.164, 'push', { userId: undefined })` →
  the OTP screen; ③ an id alone → `sendOtp(undefined, 'push', { userId })`, then
  `verifyOtp('', code, { userId })`; ④ `USER_NOT_REGISTERED` from the API → the RegisterFirst
  hand-off carrying the store URLs (asserted through a stub screen that echoes its params);
  ⑤ wrong code → remaining 2 + cleared; right code → `verifyOtp(phone, code, { userId:
  undefined })`. SMS autofill itself stays on the checklist.
  **Prove red — DRIVER DONE:** phone and code swapped in the driver `verifyOtp` call → ③ and ⑤
  failed; reverted. 🛑 **NOT DONE — the next session starts here:** (a) the same mutation in the
  USER app (`screens/OTPVerificationScreen.tsx`: `await verifyOtp(phoneNumber, otpCode);` →
  swap the two → expect test ③ red → `git checkout -- screens/OTPVerificationScreen.tsx`);
  (b) the post-step `tsc` / lint re-measure in BOTH apps — the driver one was interrupted when
  the owner stopped the session. Expected: user **6 / 0 · 208 / 1**, driver **28 / 0 · 275 / 3**.
  *Original step text:* phone screen → submit → the OTP screen; entering a code calls verify
  with that code; a wrong code shows the error and stays. Prove red: verify called with the
  phone instead of the code.
- [ ] **12. CI — only if the owner said yes in 0(c).** `.github/workflows/test.yml`: on push and
  PR, three jobs — API `npm test`, user `npm test`, driver `npm test` — `npm ci`, Node 22, no
  secrets, no device. **Prove it runs on a real push before ticking.**
- [ ] **13. Docs and close.** CLAUDE.md §1 (the tests paragraph) and §6 (DoD line);
  `CHECKLIST.md` §0 "run `npm test` in all three projects before walking" and the Later section →
  this card; `ARCHITECTURE.md` a tests row; T-010 card re-scoped to the API half; TODO / JOURNAL;
  commit proposal.

**Every step from 4 to 11:** write → prove red → revert → all six baselines unchanged → `[x]`.

## Files to touch

**Both apps (mirrored):**
- `package.json` — 4 devDependencies, `"jest"` block, `test` script
- `test/setup.ts` (new) — mocks + the translation-warning trap
- `test/render.tsx` (new) — the harness · `test/api.ts` (new) — the API mock helper
- `test/fixtures/*.ts` (new) — typed against `api/*.ts`
- `scripts/run-checks.mjs` (new) — runs every `check-*.mjs`
- `components/chrome/SegmentedModes.test.tsx` (new)

**User app:** `utils/rideTime.test.ts` · `screens/CreatePassengerOfferScreen.test.tsx` ·
`screens/OfferDriversScreen.test.tsx` · `screens/MyOrdersScreen.test.tsx` · auth screen tests.
**Driver app:** `utils/activeOffers.test.ts` · `components/geo/GeoSheet.test.tsx` ·
`screens/PassengerOrdersScreen.test.tsx` · `screens/OfferWizardScreen.test.tsx` ·
`screens/MyRidesScreen.test.tsx` · auth screen tests.
**Maybe:** `babel.config.js` (both, only if step 1 proves it needed) · `tsconfig.json` `types`
(only if the `@jest/globals` route fails).
**Repo:** `.github/workflows/test.yml` (step 12, owner's call) · `CLAUDE.md` · `docs/CHECKLIST.md`
· `docs/ARCHITECTURE.md` · `docs/TODO.md` · `docs/JOURNAL.md`.
**Never:** `App.tsx`, any screen's runtime code, `android/`, any `.env`, `api,admin,db/infra/**`.

## Risks / open questions

1. **jest-expo without `babel.config.js`.** Both apps have none (Metro injects the preset).
   Step 1 proves whether Jest does the same; the fallback is the documented three-line file and
   costs nothing.
2. **Typing route.** `"types": []` blocks ambient globals, so `@jest/globals` is the plan; RNTL's
   matcher augmentation may only attach to the global `jest` namespace. Step 1 decides, measured.
3. **A screen that will not render.** Mount effects that fetch geo, locate the device, or start
   timers can make a render hang or throw. The exit is fixed: log, board, move on — **never
   refactor a screen inside this card.** Step 8 is the likely case.
4. **Reanimated / gesture-handler.** Only `App.tsx` and two template components import them;
   navigation libraries pull them in transitively. If a screen test trips on them, the standard
   mocks go into `test/setup.ts` — not into the screen.
5. **Fixtures drifting from the API.** Mitigated by typing them against `api/*.ts`; a server-side
   shape change that the client types do not follow is invisible to these tests by design — that is
   T-010's half.
6. **Run time.** The checkers each shell out to `npx esbuild`; 23 of them plus Jest might reach a
   couple of minutes. Acceptable; if it is not, `run-checks.mjs` can bundle once — later.
7. **Windows.** Jest needs no watchman; the apps live outside the comma-named folder; the shell
   halves backslashes in heredocs and choked on a quoted heredoc while this very plan was being
   written — **write every test file with the editor tool** (memory).
8. ❓ **Which card leaves *Now*?** It holds T-101, T-088, T-116, T-115, T-114. Recommendation:
   **T-114 → *Next*** (not started). Owner decides.
9. ❓ **CI on GitHub Actions?** The repo is on GitHub, the API tests need no DB, the app tests need
   no device: the workflow is ~30 lines and no secrets. It is the step that makes "after any
   change" automatic rather than "when someone remembers to run it".
10. ❓ **Fold T-010's server half in?** Recommendation **no** — it needs a test DB and the service
    extraction; separate card, kept at P3 until this one lands.

## Session notes

### 2026-09-14 — approved; step 1 done, step 2 started

- **Owner: "approved".** Step-0 answers taken as the recommendations: **T-114 moved *Now* →
  *Next*** (dated note on the card); **CI (step 12) stays undecided** — not asked again until
  step 11 is done; `@jest/globals` chosen.
- **Step 1 findings worth keeping:** ① `expo install` resolves jest / jest-expo, but the RNTL
  install needs `react-test-renderer` pinned at the app's React version FIRST or npm resolves
  the peer to a newer React and refuses. ② npm saved the pin with a caret (`^19.1.0`) — a fresh
  install would drift back into the conflict; re-saved with `--save-exact`. ③ jest-expo needs
  no `babel.config.js` on this stack. ④ `utils/smsRetriever.ts` reads the OTP functions straight
  off the `require`d module, so its mock exposes them at the top level AND under `default`.
- **The lint baseline in this file was stale** (216 vs the journal's 208) — corrected above.
  The habit that caught it: never accept a downward move without proving it pre-existed.
- ⚠️ **The full `npm test` is 54 s, 49 of them the 11 checkers** (each spawns `npx esbuild`).
  Acceptable for now; noted against risk 6.

### 2026-09-14 (later) — steps 3-11 done in one sitting; session stopped by the owner at 11

- **The harness grew four things, all recorded in `test/render.tsx` of BOTH apps:** `async`
  (one `act` flush of mount-time promises); `onUnhandledAction` silenced (one-screen navigator,
  `goBack()` has nowhere to go); **`screens?: Record<string, ComponentType>`** — extra routes the
  screen under test may `navigate()` to, so phone → OTP is a real screen change; **`AuthValue`
  exported** so a test can type its own `sendOtp` / `verifyOtp` stubs. Plus `clearMocks: true`
  in both Jest configs (step 4's two false reds).
- **The pattern every screen test now follows:** `jest.mock('../api/<module>')` at the top —
  **with a `jest.requireActual` spread whenever the module also exports PURE helpers**
  (`passengerNameOf`, `driverNameOf`, `driverPhoneOf`): an automock blanks them and the
  assertions go silent; `jest.mock('../utils/toast')` and assert on `showToast.error/success`;
  `await renderScreen(<Screen />, { params })`; `waitFor` the mount fetch; query by accessible
  name or visible `uz` string (`import uz from '../translations/uz'` — typed, so a wrong key is
  a `tsc` error); a dialog's button shares its text with the card's, so press the LAST match.
- 🔴 **REAL DEFECT FOUND AND FIXED (one character, runtime):** `user-app-standalone/components/
  passengerOffer/CheckRow.tsx` rendered `-{label}` — a hyphen before every check-row label on the
  order form since `49c0c5b` (2026-08-02). The artboard draws none. Step 5's test found it on
  first render.
- ❓ **OWNER QUESTIONS SURFACED BY MEASURING (left as is, pinned with comments):** in the user
  `MyOrdersScreen`, the cancel buttons key off the RAW status — an EXPIRED open request keeps
  *So'rovni bekor qilish* in history and a FINISHED confirmed booking keeps *Bronni bekor qilish*.
  And in both apps the "incomplete input" toasts on the auth screens are dead code (the buttons
  are disabled first).
- **Card text that was stale, corrected by measuring:** step 5 (no ✕ buttons, no default export,
  255 is on the landmark), step 8 (no 34-field fixture existed in the checker), step 6/7 (pure
  helpers must stay real), step 10 (ride ids are numeric strings — `Number(id)` on the wire).
- **Every test file was proven red by a CODE mutation, reverted with `git checkout` — except the
  user app's step 11, still owed.** Runtime code changed in this card: `CheckRow.tsx` only.
- **NOTHING IS COMMITTED.** The owner stopped the session to continue in a new one.

## Resume point

> **Updated 2026-09-14 at the END of the session (the owner stopped it to continue in a new
> one). Steps 1-11 are DONE in code; steps 12-13 are not started; NOTHING IS COMMITTED.**
> A new session needs only this file. Read the Task, the Approach, the step lines above (each
> `[x]` line records what was measured and what changed) and the Session notes.

**STATE, exactly:** both apps have Jest (`jest-expo`, RNTL 13.3.3, Jest 29.7, `@jest/globals`,
`react-test-renderer` pinned exactly at 19.1.0), `npm test` = `jest && node
scripts/run-checks.mjs`, a harness in `test/render.tsx` + `test/setup.ts`, and these test files:
**user** — `utils/rideTime`, `components/chrome/SegmentedModes`, `screens/CreatePassengerOffer`,
`screens/OfferDrivers`, `screens/MyOrders`, `screens/PhoneRegistration` (the phone → OTP flow);
**driver** — `utils/activeOffers`, `components/chrome/SegmentedModes`, `components/geo/GeoSheet`,
`screens/PassengerOrders`, `screens/OfferWizard`, `screens/MyRides`, `screens/PhoneRegistration`.
Last measured baselines: user `tsc` 6 · lint 0 / 208 · tokens 1; driver 28 · 0 / 275 · 3.

**▶️ DO THIS FIRST, IN ORDER:**
1. `cd user-app-standalone && npm test` and `cd driver-app-standalone && npm test` — both must be
   green (≈1 min each; the checkers are most of it). If either is red, that is the first job.
2. Finish step 11's owed proofs (its 🛑 line): the user-app `verifyOtp` swap → red → revert; then
   `npx tsc --noEmit --pretty false | grep -c "error TS"` and `npm run lint` in BOTH apps against
   the baselines above. **Never rebaseline upward; a downward move must be explained.**
3. Step 12 (CI) — **the owner never answered 0(c)**. Ask once, plainly: "CI on GitHub Actions,
   yes or no?" Build `.github/workflows/test.yml` only on a yes; prove it on a real push.
4. Step 13 (docs + close): CLAUDE.md §1 tests paragraph and §6 DoD; `docs/CHECKLIST.md` §0 and
   its "Later" section; `docs/ARCHITECTURE.md` tests row; T-010 already re-scoped; then TODO /
   JOURNAL via `/end-day` and the commit proposal. Also board the two owner questions from the
   Session notes (history cancel buttons; dead "incomplete" toasts) as small cards in *Later*.

**Rules that cost something to learn (do not relearn them):** write every test file with the
editor tool, never a shell heredoc (the shell mangles backslashes and long heredocs); prove
every new test red by mutating the CODE, then `git checkout` the file; `jest.mock` a module with
a `requireActual` spread when it exports pure helpers; press the LAST match when a dialog repeats
a button's text; a mount-time promise needs one `act` flush after `waitFor` sees the call.

- T-101's plan is preserved verbatim in `docs/PLAN-T101.md`.
- The board card is **T-118**, top of *Now* in `docs/TODO.md`; T-010 in *Later* points at it;
  T-114 sits at the top of *Next*.

- T-101's plan is preserved verbatim in `docs/PLAN-T101.md`.
- The board card is **T-118**, top of *Now* in `docs/TODO.md`; T-010 in *Later* points at it;
  T-114 sits at the top of *Next*.
- Copy the user app's `package.json` `jest` block verbatim into the driver app; then step 3.
