# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **T-031** → `docs/PLAN-T031.md` (moved intact 2026-08-08). Steps 1-3 done; step 4 blocked on
> the owner's salon-option answer; steps 5-9 (payment migration + admin waiting fee) are free.
> ⏸️ **T-030** → `docs/PLAN-T030.md`, step 7 blocked on an owner answer.
> ⏸️ **T-027** → `docs/PLAN-T027.md`, step 11 (**migration first**, then API, then both apps).
> ⏸️ **T-018** → `docs/PLAN-T018.md` · **T-026A** → step 8 · **T-025** → step 8.
> ⏸️ **Also parked:** T-011 · T-012 · T-014 · T-015 · T-016 · T-017.

## Task
- **ID / name:** T-033 — "Resend OTP" shows a generic error; server messages never reach either app
- **Goal (definition of "done"):**
  1. Tapping "resend" inside the 60-second window shows **why** ("wait N seconds"), in the user's
     language, and the server answers **429**, not 500.
  2. The resend link is **disabled with a live countdown**, so the error is unreachable in normal use.
  3. `handleBackendError` understands the `fetch` error shape, so **every** screen in both apps
     starts showing the server's real message instead of its own generic default.
  4. Hitting the hourly express limiter shows a message instead of a `JSON Parse error`.
  5. No new `tsc` errors in any of the four projects; the owner re-tests the resend flow on a device.
- **Why now:** found during the owner's device test 2026-08-08 (the first real device session).
  It blocks OTP login testing, which gates every other parked card.
- **Source:** owner device report + `kubectl logs -n test3` paste, 2026-08-08.

## Diagnosis (verified in code 2026-08-08 — do NOT re-derive)
The owner's report: *"press resend once/several times → «OTP yuborishda xatolik bo'ldi». Going back
to the phone screen and re-entering gives the same error. A different phone number works."*

Four links, three of them defects:

1. ✅ **The rule is correct and is the cause.** `OtpService.checkRateLimit` (`OtpService.ts:239-255`)
   allows **1 OTP per phone per 60 s**, counted in `otp_codes` by `target`. Keyed on the *phone*,
   which is exactly why re-entering the number does not help and another number does.
   The owner's log proves it: the 4 repeat requests print `sendOtp {...}` (controller `:27`) and then
   **nothing** — they die in `checkRateLimit`, before `console.log('sendOtp metadata')`
   (`OtpService.ts:294`).
2. ❌ **A cooldown is reported as a crash.** `checkRateLimit` throws a bare `Error` with a hard-coded
   English string. The controller's catch-all (`AuthController.v2.ts:117-122`) turns any non-`AppError`
   into `AppError(msg, 500)`. So a routine, expected refusal returns **HTTP 500**.
3. ❌ **The app discards the message anyway — everywhere.** `api/auth.ts:72` throws a plain
   `Error(data.message)` with **no `.response`**. But `utils/errorHandler.ts:40`
   (`handleBackendError`) is written for **axios** (`error.response.status`), and **neither app
   imports axios at all** — both use `fetch`. The whole status `switch` (`:53-91`) is dead code;
   `errorMessage` never moves off `defaultMessage`. That is the generic toast the owner sees.
   ⚠️ **Blast radius: 12 screens** — user app 4 (`PhoneRegistration`, `OTPVerification`,
   `UserDetails`, `EditProfile`), driver app 8. No server message has ever reached a user.
4. ❌ **No cooldown in the UI.** The resend link (`OTPVerificationScreen.tsx:326` user,
   `:291` driver) is always tappable — no countdown, no disabled state. The UI invites the request
   the server then refuses.

### Also found in the same path
- ❌ **The 6th send in an hour produces `JSON Parse error`.** `otpSendLimiter` (5/hour/phone,
  `rateLimiter.ts:24-36`) is express-rate-limit **v7**, whose default `message: '<string>'` is sent
  as a **plain-text** body. `api/auth.ts:67` calls `response.json()` unguarded. Same class as the
  T-026 finding about the offer limiter.
- ❌ **The hourly DB check is dead.** `OtpService.ts:258-269` — the comment says "max 5 requests per
  hour", the code says `hourlyCount >= 1000`. It has never fired.
- ⚠️ Cosmetic: `api/auth.ts:50` logs `JSON.stringify(getHeaders())` **without `await`** → always `{}`.
- 🔒 **Out of scope, carded as T-034:** the OTP code and the Eskiz bearer token are printed to the
  server log in plaintext (`OtpService.ts:297`, `:102`) — the owner's own paste contains
  `sendOtp code 3561` and a full Eskiz JWT.
- 🔒 **Out of scope, carded as T-034:** `verifyOtp` looks the row up **by `target + code`**
  (`OtpService.ts:371-380`), so a **wrong** code matches nothing, returns `false`, and never
  increments `attempts`. The `maxAttempts` cap only ever counts *correct* codes — brute-force
  protection on a 4-digit code is effectively absent.

## Owner decisions taken 2026-08-08 (do NOT re-ask)
1. Scope = **the fix plus the error plumbing** (429 + translation, JSON limiter body, fetch-aware
   `handleBackendError`, resend countdown in both apps). The two security findings go to their own
   card (**T-034**) rather than stretching this one.
2. This card starts **now**; T-031's plan moved intact to `docs/PLAN-T031.md`.

## Approach
Fix the message at the source (a typed 429 carrying `retryAfterSec`), fix the pipe that was
swallowing it (`handleBackendError`), then make the error unreachable in the first place (the
countdown). The middle fix is the valuable one — it is one file per app and it unblocks 12 screens.

⚠️ **Keep the axios branch in `handleBackendError`.** Nothing uses axios today, but deleting the
branch turns a dormant path into a breaking change for any future axios call. Add the fetch shape
beside it; do not swap it.

## Steps
- [x] 1. **DONE 2026-08-08. API — typed cooldown error.** Add `TOO_MANY_REQUESTS = 429` to `HttpStatus`. Add
  `otp.tooSoon` (with a `{seconds}` placeholder) and `otp.tooManyRequests` to the **three** i18n
  files (`uz`/`ru`/`en`). Have `checkRateLimit` compute the real remaining seconds from the newest
  `otp_codes.created_at` and throw `AppError(message, 429, { retryAfterSec })` from
  `errors/AppError.js` — that class already carries `data`, and `errorHandler.ts:90` already
  forwards it. Plumb `language` into `OtpService.sendOtp` (the controller already resolves it at
  `:25`). Fix the dead `>= 1000` hourly check to a named constant that matches its comment.
  **Done:** `HttpStatus.TOO_MANY_REQUESTS = 429`; `otp.tooSoon` + `otp.tooManyRequests` in all three
  locales; `checkRateLimit` now fetches the newest code (instead of counting) so it can report the
  **real** remaining seconds, and throws `AppError(msg, 429, { retryAfterSec })`. `sendOtp` also
  returns `cooldownSec`, so the interval lives on the server rather than being hard-coded on three
  clients. ⚠️ **The `>= 1000` value was KEPT and the lying comment fixed instead** — the real 5/hour
  ceiling is the express limiter's, and tightening the DB check to 5 mid-device-test would have
  locked the owner out. Named `OTP_MAX_PER_HOUR`, documented as a runaway guard.
- [x] 2. **DONE 2026-08-08. API — the express limiters answer JSON.**
  **All five limiters** in the file used the plain-string `message`, so one shared
  `jsonLimitHandler(translationKey, fallback)` replaced them all — it emits the same
  `{ success, message, data }` envelope as `errorHandler`, translated via `Accept-Language`, and
  carries `retryAfterSec` derived from `req.rateLimit.resetTime`. This also fixes the plain-text
  offer-limiter body that **T-026** logged separately.
- [x] 3. **DONE 2026-08-08. Both apps — fetch-aware `handleBackendError`.**
  ⚠️ **The diagnosis sharpened here:** attaching an axios-shaped `.response` is *already* this
  codebase's convention — `passengerOffers.ts` (×5), `driver.ts` and parts of both `auth.ts`
  hand-build it, and **12 screens read `error?.response?.status || error?.status`**. So the new
  `ApiError` carries `status`, `data` **and** `response`, and every existing reader (including the
  driver's USER_NOT_REGISTERED lookup) keeps working untouched. `handleBackendError` now resolves
  `status = error?.response?.status ?? error?.status` and reads the body from either shape; added an
  explicit **429** case. Both apps changed in step.
- [x] 4. **DONE 2026-08-08. Both apps — guarded the JSON parse.** A shared `parseResponseBody` reads
  the body as text and only then tries `JSON.parse`, falling back to `{ message: <text> }`. Applied to
  **every** call in both `api/auth.ts` (8 user, 6 driver), not just the OTP ones — same defect, same
  file. Removed the driver's now-dead `contentType`/`JSON Parse` branches, which threw the status and
  message away. `getHeaders()` is now awaited before the debug log.
- [x] 5. **DONE 2026-08-08. Both apps — resend countdown.** The link is disabled and shows
  `Qayta yuborish (43 s)` while the cooldown runs. ⚠️ Held as a **wall-clock deadline**, not a
  decrementing counter, and recomputed on every tick — JS timers are throttled in the background, so
  a counter would come back stale. Seeded from the server's `cooldownSec`, re-armed from
  `retryAfterSec` on a 429. `AuthContext.sendOtp` now returns the response in both apps so the value
  can reach the screen. The driver's hard-coded Uzbek push error became
  `otpVerification.errorResendPush`.
- [x] 6. **DONE 2026-08-08. Static verification — all four projects exactly at baseline.**
  `tsc`: API **282/282** · admin **0/0** · user **12/12** · driver **36/36**. The in-file errors are
  **proven pre-existing via `git stash`** (the `rateLimiter.ts` `createRateLimiter` one and the three
  `AuthContext.tsx` overloads reappear unchanged, just at shifted line numbers).
  **42/42 i18n checks** — every new key *evaluated*, not grepped, in all three locales of all three
  projects, placeholders included. **17/17 runtime checks** on the real error path: `ApiError`,
  `getRetryAfterSec` and `parseResponseBody` lifted verbatim from source and run against the exact
  envelope the API emits, plus JSON/text/empty bodies, the network-error branch, the
  USER_NOT_REGISTERED payload, and both the server and client countdown maths at their boundaries.
- [ ] 7. **Owner: deploy the API, rebuild both apps, smoke test.** (a) resend inside 60 s → the link
  is disabled with a countdown, not an error; (b) force it via a fresh install → the toast names the
  wait in Uzbek; (c) 6 sends in an hour → a readable message, no `JSON Parse error`; (d) a wrong OTP
  code → the server's message, not a generic one; (e) a different phone still works immediately.
- [ ] 8. **Commit** with a clear message, owner-approved.

## Files to touch (verified against the repo 2026-08-08)
- `api,admin,db/apps/api/src/services/OtpService.ts` — steps 1
- `api,admin,db/apps/api/src/controllers/AuthController.v2.ts` — step 1 (pass `language`)
- `api,admin,db/apps/api/src/constants/index.ts` — step 1 (`HttpStatus.TOO_MANY_REQUESTS`)
- `api,admin,db/apps/api/src/i18n/translations/{uz,ru,en}.ts` — step 1
- `api,admin,db/apps/api/src/middleware/rateLimiter.ts` — step 2
- `{user,driver}-app-standalone/utils/errorHandler.ts` — step 3 (**both**)
- `{user,driver}-app-standalone/api/auth.ts` — steps 3, 4 (**both**)
- `{user,driver}-app-standalone/screens/OTPVerificationScreen.tsx` — step 5 (**both**)
- `{user,driver}-app-standalone/translations/{uz,ru,en}.ts` — step 5 (**both**)

## Risks / open questions (READ before coding)
- ⚠️ **No migration, no schema change.** If one appears, stop and ask.
- ⚠️ **Step 3 changes error text on 12 screens at once.** That is the point, but it means a screen
  that used to show a friendly Uzbek default may now show a blunter server string. Server messages
  are already translated (`Accept-Language` **is** sent — `config/api.ts:116`), so this should be an
  improvement; watch for endpoints that return raw English.
- ⚠️ **Do not lower the 60 s cooldown to make testing easier.** It is an SMS-cost control. If device
  testing needs faster retries, that is an env value, and the owner decides.
- ⚠️ **The 5-per-hour express limiter will bite during a testing session** (5 sends per phone per
  hour). Once step 2 makes it legible, the owner may want the number raised for test3 — ask, do not
  assume.
- ⚠️ **`retryAfterSec` is advisory.** The countdown must still be driven by the app's own clock; a
  user who backgrounds the app must not come back to a stale timer.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` keeps picking up permission-prompt changes — keep it out of commits.

## Session notes (one line per work session)
- **2026-08-08** — card created from the owner's first device-test report, then **steps 1-6 all
  done**. Root cause found and fully traced before any code: the 60 s cooldown is correct, but it
  returned **500** with an English string, and `handleBackendError` is **axios-shaped in two
  fetch-only apps**, so the message was discarded on all 12 screens that use it. Two security
  findings split out as T-034; a duplicate-`errors`-block i18n defect found and logged as T-035.
  All four projects at `tsc` baseline; 42/42 i18n + 17/17 runtime checks. **Nothing on a device yet.**

## Resume point (for the next chat)
**Steps 1-6 are DONE. Nothing has run against a device or a live API — only `tsc` and the two
check scripts.** Working tree has uncommitted changes across 20 files.

🛑 **Step 7 is the owner's: deploy the API, rebuild BOTH apps, then the 5 smoke tests.**
⚠️ **Deploy order matters: API FIRST, then the apps.** The apps read `cooldownSec` from the send
response and `retryAfterSec` from a 429 — against an un-deployed API both are simply absent, and the
countdown falls back to its 60 s default, so an app-first rollout degrades gracefully but shows the
old generic toast until the API lands.

**One decision is still open for the owner** (see Risks): `otpSendLimiter` allows **5 sends per phone
per hour**. It is now legible instead of a parse crash, but it will still stop a long testing session
at the 6th code. Raising it is a one-line change — do not change it without the owner saying so.

**Then step 8: commit.** ⚠️ `.claude/settings.json` is modified in the working tree — keep it out.

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12**, driver app **36**.
