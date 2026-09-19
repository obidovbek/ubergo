# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 📦 **T-088's last code (2026-09-19) → `docs/PLAN-T088-finish.md`** — DONE, committed `db8e17d`;
> T-088 is in *Parked*, waiting on the owner (tell Paynet · T-100 · credentials · deploy).
> Its 2026-08-16 plan is `docs/PLAN-T088.md`.
> 📦 **T-122 → `PLAN-T122.md`** (DONE, `636ba45`) · **T-123 → `PLAN-T123.md`** (DONE, `fed25f9`; one
> device check owed) · **T-121 → `PLAN-T121.md`** · **T-118 → `PLAN-T118.md`** (CI run unconfirmed).
> 📦 **T-101 → `PLAN-T101.md`** (steps 2b, 19-26 open) · **T-102 → `PLAN-T102.md`** · **T-114 →
> `PLAN-T114.md`**.
> 🔴 **T-047 PARKED** (needs a `logcat` line) · 🛑 **T-031 item 1 CLOSED, do NOT reopen**.

---

## 🔴 BOARD STATE 2026-09-19 — read before starting anything

**`tsc` BASELINES: API 281 · admin 6 (via `tsc -b`) · user 3 · driver 19** — ⬇️ **LOWERED by T-116
step 4 (user 5 → 3, driver 28 → 19): 11 of those "accepted" errors were live defects**, see step 4.
Lint **0 errors** in all four; **warnings: API 230 · user 208 · driver 275.** Colour ceilings user
1 · driver 3. **Never rebaseline upward.**
**Suites (all `npm test`):** **API 357** · **user 255 + 11 checkers** · **driver 281 + 11**.
**Board:** `node scripts/check-board.mjs` → ✓; *Now* = **T-116 · T-101**.

---

## Task

- **ID / name:** T-116 — the server still answers in English: finish the long tail, and stop it
  growing back.
- **Owner's words (2026-09-13):** *"correct everywhere info/error/warning language responses
  frontend/backend"*.
- **Why now:** top of *Next* once T-115 turned out to be code-complete (its status line was stale;
  now in *Parked*). Owner said *"commit and next"*.

### 🔴 What the re-measurement found (2026-09-19 — the card undercounts)

A scanner read every `new AppError(...)` in the API (multi-line calls included) and classified it:

| | count |
|---|---|
| **all `AppError`s** | **222** |
| keyed (`messageKey`, translated by `errorHandler`) | 18 |
| translated where thrown (`t(…)`) | 73 |
| **still English** (97 literal · 24 template · 10 computed) | **131** |

**The card's "what is left, precisely: ~29 field-validation literals … plus 4 … plus 4" counted
only the two offer services.** It missed the controllers, auth, uploads, wallet and devices. By
where they go:

1. **42 × `'Unauthorized'` (401)** in eight controllers — **unreachable**: every route file they
   serve mounts `authenticate` (checked: driver-offer, passenger-offer, offer-driver,
   offer-passenger, user, device, driver, upload), which refuses first with its own translated message.
2. **≈10 × 5xx / computed** (`error.message || 'Failed to send OTP'`, wallet internals, SSO) — **the
   apps never show a 5xx's text**: `handleBackendError` answers every 5xx with its own translated
   *"server error, try again"*. *(The SSO ones are dead since T-076 removed social sign-in.)*
3. **7 × admin** — the admin panel is not localised at all. Different audience.
4. **≈45 × field-format checks** (`seat_counts must be an object`, `${field} must be a number`) —
   only a client bug sends such a payload; they name raw columns (`seat_counts.front`).
5. 🔴 **≈25 × messages a REAL USER CAN HIT**, and **every 4xx text reaches the phone verbatim** —
   both apps' `handleBackendError` shows the server's sentence for 400/401/403/404/409/422/429.
   Examples: *"Please register in the passenger app first"* (driver login, `AuthController.v2`
   ×2) · *"Cancel the offer instead — a driver is already confirmed"* · *"Cannot reduce seats_total
   to N: M seat(s) are already booked"* · *"Offer not found"* · *"start_at must be at least N
   minutes in the future"* · the price minimums (*"… must be at least N UZS"*) · *"Image size exceeds
   maximum allowed size of N MB"* · *"Can only update location for confirmed bookings"*.
   **These are the owner's complaint, and the card did not list one of them.**

**Frontend half:** no hardcoded English toast text in either app (every `showToast` text goes
through `t()`), but **the driver app's `NotificationsScreen` shows the raw `error.message` as a
toast's second line in 4 places** — a server sentence or a JS error (*"Network request failed"*)
straight to the screen, bypassing the translated error handler. The user app's twin shows none on
one line; multi-line calls are step 1's to count.

### Goal (definition of "done")

1. **Every English message a real user can see is translated** (uz · ru · en) through
   `messageKey` / `messageParams` at the throw site — the mechanism T-116 already built.
2. **What stays English does so by a written rule, not by drift** — one comment in
   `errorHandler.ts` naming the four deliberate classes (unreachable 401s · 5xx · admin ·
   client-bug field checks).
3. **A ratchet stops the class regrowing:** a test counts unkeyed 4xx `AppError`s in app-facing
   files and fails if the count rises — the ceiling only moves **down** (the colour-ceiling idiom).
4. **The driver app's raw `error.message` toasts** go through the translated error text; the user
   app's twin is checked, not assumed.
5. **Every new key resolves in all three locales** (`messageKeys.test.ts`), each new test proven
   red, and **all baselines held**: API 281 / 0·230 / 357+ · user 5 / 0·208 · driver 28 / 0·275 ·
   both suites green.

### Explicitly OUT of scope

- 🛑 **Rewording the English originals** — the key's English copy may be clearer, the throw's
  literal stays as the fallback.
- 🛑 **The admin panel's language** (not localised anywhere) and **5xx texts** (never shown).
- 🛑 **Refactoring the 42 `if (!req.user) throw 'Unauthorized'`** into a helper — unreachable, and a
  refactor across eight controllers is its own card if wanted.
- 🛑 **Deploying** — the owner's.

## Approach

- **Reachability decides, not file or status.** Step 1 names, for every message in class 5, **the
  screen and action that triggers it** — or moves it to class 4 if nothing can. A message is
  "reachable" only with a named trigger.
- **Key at the throw site** (`{ messageKey, messageParams }`), exactly as the 18 already keyed do.
  Numbers go in `messageParams` so the translation interpolates them.
- **Uzbek and Russian wording is mine and needs the owner's eye.** Where the apps already say the
  same thing (`errors.codes.*`, screen strings), **reuse their wording** rather than inventing a
  second phrasing. The close lists every new Uzbek string for review.
- 🔴 **Before changing any message, grep both apps for code that MATCHES on server text** (e.g.
  `message.includes('already')`). Translating a message an app pattern-matches would break that
  app silently — only in uz/ru, which is exactly where nobody tests.
- **Prove red on every change**, predictions first; revert from a scratchpad golden copy.

## Steps

- [x] **0. Owner approval (rule 3) and decision ①.** ✅ *"ok"*, 2026-09-19 — **option A**: translate
  every message a user can see; the rest stays English by a written rule, guarded by a ratchet.
- [x] **1. Measure, read-only.** ✅ **DONE 2026-09-19 — and it cut my own estimate from ≈25 to 7.**
  Every candidate was traced to an app action or ruled out with a reason. **Baselines:** API 281 /
  0·230 / 357 · user 5 / 0·208 / suite green · driver 28 / 0·275 / suite green.

  **The reachable set — 7 throw sites, 5 messages:**

  | # | Message (today, English) | Throw site | Who hits it, how | Key |
  |---|---|---|---|---|
  | 1-2 | *"Please register in the passenger app first"* | `AuthController.v2` `sendOtp` :57 · `verifyOtp` :160 | ⚠️ **CORRECTED IN STEP 2: NOT reachable as text.** It carries `code: 'USER_NOT_REGISTERED'`, and the driver app's `PhoneRegistrationScreen` catches that code and opens its own translated RegisterFirst screen. `verifyOtp`'s copy is a race only. **Keyed anyway — defensively**: the key costs one line per site. *Step 1 traced the display path and missed the `code` path.* | **new** |
  | 3 | *"start_at must be at least 30 minutes in the future"* | `PassengerOfferService` :775 | **user app, create order** — app floor is 31 min, server 30: a phone clock running fast, or a slow submit | reuse `startAtTooSoon` `{minutes}` |
  | 4-5 | *"Offer not found"* (404) | `PassengerOfferService.getOfferById` :941 · :1030 | **user app** — opening an order deleted or gone (push tap, stale list) | reuse `offers.offerNotFound` |
  | 6 | *"price_whole_salon must be greater than or equal to price_back_salon"* | `DriverOfferService` :215 | **driver app, offer wizard** — whole-salon typed below back-salon; the wizard neither clamps nor validates it | **new** |
  | 7 | *"Cannot reduce seats_total to N: M seat(s) are already booked"* | `DriverOfferService` :735 | **driver app, editing a ride** with bookings, seats lowered below the booked count | **new** `{newTotal, booked}` |

  **Ruled out, each for a named reason:**
  - **Client-enforced backstops** (the app refuses first): seat range and the 5 000 minimum (the
    driver wizard mirrors both, `utils/offerWizardValidation.ts`); the front price (input clamped to
    the seat price); payment method, payer phone (app ≥ 7 digits = server regex), start/arrival
    windows (picker floors), from/to required — all in the passenger form; the passenger form
    **sends no price at all**; and every `${field} must be …` format check.
  - **No app calls it:** `archiveOffer` (*"Cancel the offer instead…"*), `updateDriverLocation` ×2,
    the whole wallet, and `WalletController`'s 2 direct `res.status(401)` answers.
  - **Never shown:** push-registration errors (logged only); `getCurrentUser` / *"User not found"*
    (the `authenticate` middleware refuses a deleted account first, translated); 5xx (the apps show
    their own); the SSO ×6 (removed, T-076); `SupportContactService` (validates stored data, not input).
  - **42 × `'Unauthorized'`** — every route file they serve mounts `authenticate` (all 8 checked).
  - **Admin ×7.** **Notification `NOT_FOUND`** — a race only (and an Uzbek constant — see T-126).
  - 🔴 **Upload ×4 → T-126, deliberately NOT here.** The driver app's upload path **matches on the
    English text**: `api/driver.ts:227` and `DriverPersonalInfoScreen.tsx:970` look for `'size'` and
    swap in a hardcoded Uzbek sentence. Translating the server text breaks that match — a Russian
    driver would get *"Rasmni yuklashda xatolik: Размер…"*. It must move with the matcher's fix.

  **Apps matching on server text** — the other hits are safe: `MyPassengerOffersScreen:279` checks
  `isAuthError` (the status) before its text fallback; `PhoneRegistrationScreen:225` matches local
  SMS/Google errors, not server text.
  **Raw `.message` toasts — 9, not 4:** driver `NotificationsScreen` ×4 **and the user app's twin,
  `contexts/NotificationContext.tsx` ×4, plus `CreatePassengerOfferScreen.tsx:881`.** *My first
  count said the user app had none — its regex matched `showToast(` and missed `showToast.error(`.
  Recounted with a paren-depth scanner, multi-line calls included.*
  **Found and boarded as T-126:** the driver app **hardcodes Uzbek** in 40 toast calls (registration
  screens mostly) — a Russian or English driver reads Uzbek. My first sweep looked only for Latin
  letters and could not see it.
- [x] **2. Translate the reachable set.** ✅ **DONE 2026-09-19.** 7 throw sites keyed: 3 **new** keys
  in uz · ru · en (`auth.registerInPassengerAppFirst`, `offers.wholeSalonBelowBackSalon`,
  `offers.cannotReduceSeatsBelowBooked` `{newTotal, booked}`) and 2 **reused**
  (`offers.startAtTooSoon` `{minutes}`, `offers.offerNotFound`). Wording borrows the driver app's
  own terms (*Orqa/Butun salon narxi* · *Цена за задний/весь салон* · *приложение пассажира*).
  `messageKeys.test.ts` already walked all of `src/` (controllers included); **it gained 3 tests**:
  every locale carries English's `{placeholders}` (it checked one key before; now all) · **every
  throw of a parameterised key passes each parameter its template needs** (the gap: a key thrown
  without `messageParams` shows a literal *"{minutes}"* while every other test stays green) · the
  two-parameter key fills both numbers in all three locales.
  ⚠️ **My first params-scan borrowed from neighbours:** it looked for the next `}` + `)` anywhere
  in the file, so a one-line throw could inherit the params of a later one. Rewritten as a
  brace-depth scan that stops at the throw's own object. Caught by re-reading, before any run.
  **Prove red — 3 mutations, all predicted exactly:** ⓐ typo'd key at its throw → **4** red
  (resolves ×3 · locales agree) · ⓑ `{booked}` dropped from the Uzbek → **2** (parity · render) ·
  ⓒ the start-time throw without its params → **1** (the new params test).
  **After:** `tsc` 281 · lint 0 / 230 · `npm test` **360/360** (+3).
- [x] **3. The ratchet.** ✅ **DONE 2026-09-19.** `src/i18n/unkeyedErrors.test.ts`: it parses every
  `new AppError(...)` (arguments split by depth, strings skipped; status from a literal or an
  `HttpStatus.NAME`, else AppError's default 500) and holds **unkeyed 4xx outside admin at
  `CEILING = 107`** — measured, and it agrees with step 1's arithmetic (131 − 7 admin − ~10 5xx −
  7 keyed). It fails both ways: **rose** (lists the sites; give the throw a key) and **fell**
  (lower the ceiling to lock it in). A guard test stops a broken scan passing on nothing.
  🔴 **A second class the step-1 scan could not see:** ~60 **subclass** throws (`NotFoundError`,
  `ConflictError` …) pass `ERROR_MESSAGES.*` — **Uzbek constants**, 11 of 13 files `Admin*` — and a
  subclass takes a message only, so it **cannot carry a key**. The ratchet holds literal-message
  subclass throws outside admin at **`SUBCLASS_CEILING = 2`** (both `WalletService`, no app caller).
  I first set that ceiling to 0 and the test showed the 2. The Uzbek constants are on T-126.
  The four deliberate classes are written once, in `errorHandler.ts`.
  **Prove red — 4 mutations, all predicted:** ⓓ un-key the whole-salon throw → **1** ("rose") ·
  ⓔ key an unkeyed one → **1** ("fell") · ⓕ a third literal subclass throw → **1** · ⓖ an unkeyed
  `400` rewritten `HttpStatus.BAD_REQUEST` → **0** — the named status parses, the count holds.
  **After:** `tsc` 281 · lint 0 / 230 · `npm test` **363/363** (+3).
- [x] **4. The frontend half — 9 call sites, both apps.** ✅ **DONE 2026-09-19 — and it went
  deeper than the plan, three times, each for a measured reason:**
  🔴 **① `getErrorMessage` itself leaked** — the fix the plan named was not a fix. With no response
  it fell through to `error.message` ("Network request failed", "Aborted"), and it showed a **5xx
  body** verbatim — so the rule the API's `errorHandler.ts` now writes down (*"5xx never reaches a
  phone"*) was true of `handleBackendError` only. **The T-123 defect again: two readers of one rule,
  drifted apart.** Now one `connectionFailureKey` and one `SERVER_FAILURE_STATUSES` per app, read by
  `handleBackendError`, `getErrorMessage` AND `isNetworkError`. Tests +11 per app (user 53 → 64,
  driver 60 → 71), including **a parity test that runs every status 400-599 through both readers**.
  **4 mutations per app, predicted and matched in BOTH apps:** ⓗ connection branch out → 4 ·
  ⓘ 5xx branch out → 5 · ⓙ `handleBackendError` drifts to [500,502,503] → 2 (its 504 row + parity)
  · ⓚ the network rule swallows everything → 6.
  🔴 **② The driver's `NotificationsScreen` toasts had NEVER shown.** `showToast` is an **object** in
  that app; the screen called it as a function, so every toast threw a TypeError inside its own
  catch. **It was 6 of the driver app's 28 baseline `tsc` errors ("This expression is not
  callable"), accepted for months.** A baseline that hides a crash is not a neutral number.
  🔴 **③ The same file's timestamps read "{count} daqiqa oldin"** — this app's `t` takes a key only,
  and three calls passed `{ count }` (3 more of the 28). Filled the app's way (`MyRidesScreen`).
  *The user app's twin already did it right; checked, not assumed.*
  🔴 **④ A crash path MY change created, caught by the step-5 re-measure.** `MyPassengerOffersScreen`
  called `getErrorMessage(error, t('…'))` — a STRING where the translator goes (2 of the user app's 5
  baseline errors; T-024 noticed it in August). Harmless while `getErrorMessage` rarely called its
  `t`; **after ① it calls `t` on every connection failure and 5xx, so a dropped connection would have
  thrown inside that screen's catch.** Both calls fixed (translator, then key) — the only two in
  either app. New `MyPassengerOffersScreen.test.tsx` (2 tests), **both red** with the string restored.
  *Reading the baseline errors by name, not just counting them, is what found it.*
  **The 9 sites** now use `getErrorMessage(error, t, fallbackKey)`; the create screen's comment,
  which claimed the ≥30-minute rule was translated before it was, corrected.
  **Tests:** driver `NotificationsScreen.test.tsx` **new, 3** (Uzbek network toast shown · 5xx
  hidden · "5 daqiqa oldin") — red on ⓛ raw message → 2 · ⓜ uncallable call restored → 2 ·
  ⓝ placeholder unfilled → 1. User `NotificationContext.test.tsx` **new, 3** (refresh / mark-read /
  delete) — each red on its own site restored raw → 1 · 1 · 1. `CreatePassengerOfferScreen.test.tsx`
  **+2** (network named; a 4xx still shown as the server worded it) — red on the old raw behaviour → 1.
  **The guard: `scripts/check-raw-error-toasts.mjs`, a 12th checker per app** — it parses every
  toast/alert call (comments skipped, strings blanked) and fails on a raw `.message`; a fixture and a
  call-count floor stop it passing on nothing. Clean: user 70 calls, driver 160. **Red on** the
  untested mark-all-read site restored (named `NotificationContext.tsx:144`), on its own matcher
  broken (the fixture), and in the driver copy (named `NotificationsScreen.tsx:86`).
  ⚠️ **Two misses of my own on the way:** my first raw-message count matched `showToast(` and missed
  `showToast.error(` (user app "0", really 5); and my own new comment inside a call tripped the
  scan — which is why the checker strips comments. **And PowerShell 5.1 strips embedded double
  quotes from native arguments** — one mutation was refused (the tool refuses a no-op) and re-run
  through Bash.
  📌 **Seen, not changed:** `NotificationContext`'s FIRST load never toasts on failure — its
  callback reads a stale `loading` (not in the deps). Pre-existing, not a language defect.
- [x] **5. Measure.** ✅ **DONE 2026-09-19 — every number predicted before it ran:**

  | | `tsc` | lint | `npm test` |
  |---|---|---|---|
  | **API** | 281 = | 0 · 230 = | **363** (357 + 6) |
  | **user app** | **3** ⬇️ (was 5) | 0 · 208 = | **273** Jest (255 + 18) + **12** checkers |
  | **driver app** | **19** ⬇️ (was 28) | 0 · 275 = | **295** Jest (281 + 14) + **12** checkers |

  The two `tsc` drops are the 11 baseline errors that turned out to be live defects (step 4 ② ③ ④).
  **Baselines lowered to 3 and 19** — lowering locks the fixes in; nothing was raised anywhere.
- [x] **6. Close.** ✅ **DONE 2026-09-19.** T-116 → *Done* (moved whole, a closing summary on top);
  *Now* holds **T-101** alone. `CHECKLIST.md` §10: a Russian- and an Uzbek-set phone — the seat
  refusal with both numbers, the salon-price refusal, *"5 daqiqa oldin"* never `{count}`, and
  airplane mode naming the failure in every place this card touched. *(The plan's "unregistered
  driver login" check was dropped: the app shows its own translated screen there — step 2.)*
  `CLAUDE.md` §1 and `ARCHITECTURE.md` test counts brought up to the measured numbers (they had been
  stale since T-123). `check-board.mjs` ✓. **The new strings for the owner to read** are in the
  resume point below. Commit proposed.

**Every code step:** read → change → prove red → revert → `tsc` AND lint AND `npm test` → `[x]`.

### ❓ Decision ① (step 0) — how far to translate

- **A — every message a user can see; the rest stays English by rule, with a ratchet
  (recommended).** ≈25 messages × 3 languages. The four deliberate classes are written down, and
  the ratchet makes a new English user-facing error fail a test instead of waiting for you to
  notice it on a phone. *Field checks stay English because an Uzbek sentence wrapped around
  `seat_counts.front` helps nobody, and only a bug can trigger them.*
- **B — key everything app-facing.** ≈120 messages, including ≈45 field checks that name raw
  columns and 42 `'Unauthorized'`s no phone can reach. About five times the translation work, most
  of which nobody will ever see.

## Files to touch

**API:** the throw sites of the reachable set (≈10 files — `services/PassengerOfferService.ts`,
`services/DriverOfferService.ts`, `controllers/AuthController.v2.ts`, `controllers/UploadController.ts`,
`services/OfferPassengerService.ts`, …; exact list from step 1) · `i18n/translations/{uz,ru,en}.ts` ·
`i18n/messageKeys.test.ts` · a ratchet test · `middleware/errorHandler.ts` (the rule comment)
**Driver app:** `screens/NotificationsScreen.tsx` + its test · **user app:** only if its twin needs it
**Docs:** `PLAN.md` · `TODO.md` · `JOURNAL.md` · `CHECKLIST.md`
**NOT touched:** admin panel, migrations, dependencies, `infra/**`.

## Risks / open questions

1. 🔴 **An app that pattern-matches server text** would break silently in uz/ru only. Step 1 greps
   for it before anything changes.
2. ⚠️ **My Uzbek and Russian.** Reused from the apps where possible; every new Uzbek string is
   listed at the close for the owner.
3. ⚠️ **The English fallback hides a typo** — that is what `messageKeys.test.ts` is for; step 2
   makes sure it reads every file a key is thrown from.
4. ⚠️ **"Reachable" is a judgement.** Each is backed by a named trigger in step 1's table, so the
   owner can move a row.

## Session notes

### 2026-09-19 — planned, approved (option A) and finished, steps 0-6

- **The measurement corrected the card twice and me four times.** The card said ~37 English
  messages were left; there were 131 — but only **7** a user can reach (step 1 traced each to a
  screen). My own "≈25" was a guess; two of my 7 were then wrong (`USER_NOT_REGISTERED` has its own
  screen). The raw-message count said the user app had 0; it had 5 (a regex missed
  `showToast.error(`). And my own comment inside a call fooled my scanner.
- 🔴 **The biggest finding was not in the card at all: 11 of the apps' "accepted" `tsc` errors were
  live defects** — toasts that crashed instead of showing (6), timestamps showing `{count}` (3), a
  string passed as the translator (2). A baseline is a list of things someone decided not to look at;
  **read it by name**. Both baselines lowered (user 5 → 3, driver 28 → 19).
- 🔴 **My fix created a crash path and the step-5 re-measure caught it**: once `getErrorMessage` called
  its translator on every network failure, the screen that passed it a string would have thrown.
- **The class is closed three ways:** one rule per app read by all three error readers (parity test
  over every status 400-599) · the API ratchet (107, may only fall) · a checker per app (no raw
  `.message` on any toast). **~30 mutations, every red set predicted.**

## Resume point

> **Updated 2026-09-19. T-116 IS COMPLETE — steps 0-6. NOT COMMITTED** — the commit is proposed and
> waiting for the owner's yes.
> **What changed:** 7 server throws keyed (3 new keys × uz/ru/en); both apps' error readers share one
> rule (connection failures named, 5xx hidden); 9 raw-message toasts fixed; the driver's notification
> toasts and timestamps work at all; a string-as-translator miscall fixed. Guards: API
> `unkeyedErrors.test.ts` (107) and `check-raw-error-toasts.mjs` in each app.
> 🟢 **API `tsc` 281 · lint 0/230 · 363 · user 3 · 0/208 · 273 + 12 · driver 19 · 0/275 · 295 + 12.**
> 🟢 `check-board.mjs` ✓ — *Now* = **T-101** alone.
> ⚠️ **Needs the API deploy AND both app rebuilds** before a phone sees any of it — `CHECKLIST.md` §10.
> 📝 **New server strings for the owner to read** (`api/src/i18n/translations/{uz,ru}.ts`):
> `auth.registerInPassengerAppFirst` — *Avval foydalanuvchi ilovasida ro'yxatdan o'ting* /
> *Сначала зарегистрируйтесь в приложении пользователя* (both copied from the driver app's own
> screen) · `offers.wholeSalonBelowBackSalon` — *Butun salon narxi orqa salon narxidan past
> bo'lmasligi kerak* / *Цена за весь салон не может быть ниже цены за задний салон* ·
> `offers.cannotReduceSeatsBelowBooked` — *O'rinlar sonini {newTotal} taga kamaytirib bo'lmaydi:
> {booked} ta o'rin allaqachon band qilingan* / *Нельзя уменьшить количество мест до {newTotal}: уже
> забронировано мест — {booked}*.
> **▶️ NEXT: the owner's pick.** Top of *Next* is **T-114** (the four order scopes), then **T-102**.
> **T-126** (driver app hardcoded Uzbek) is the natural follow-on to this card.
