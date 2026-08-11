# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 🔴 **T-042 — three defects from the owner's 2026-08-10 device test, all fixed the same day.**
> ① The driver app **crashed to the launcher** on the passenger-order details screen
> (`offer.passenger.name` — the detail endpoint returns `user`, not the list's mapped `passenger`).
> ② The results list **merged into the route picker**: the picker was a `maxHeight: 270` `ScrollView`
> sibling of the `FlatList` — two scroll surfaces, identical card styling, no seam. It is now the
> list's `ListHeaderComponent`, so it scrolls away, with a labelled divider between.
> ③ Re-entering an offer the driver had already applied to **re-offered the CTA** — the footer used
> a local `joinSent` boolean that reset on every mount. The server always refused the duplicate
> (no bad data), but `rejected`/`cancelled` are permanent, so it was a dead end. The screen now
> loads the real status from `GET /driver/join-requests` (own rows only — the offer's `drivers`
> list is correctly owner-only). **No API change.**
> `tsc` driver **35 = baseline**; 12/12 crash checks (crash reproduced) · 31/31 re-join checks
> (old boolean proven to re-offer the button) · 27/27 i18n + 21/21 placeholder checks.
> 🛑 **Remaining: owner rebuilds the driver app and retests, then commit.** Full write-up in
> `docs/TODO.md` T-042 — the fix was small enough that it needed no step-by-step plan file.
> ⚠️ The API shape mismatch behind it is deliberately **not** fixed → **T-043** in *Next*.
>
> ✅ **T-041 closed 2026-08-10.**
>
> ⏸️ **T-040** → `docs/PLAN-T040.md`. Steps 1-6 + 8 done; step 7 = owner device test.
> ⏸️ **T-039** → `docs/PLAN-T039.md`. Steps 1-3 done; step 4 = owner (**deploy the API**), step 5 commit.
> ✅ **T-038 CLOSED** → `docs/PLAN-T038.md`. Device-confirmed via T-041 on 2026-08-10.
> ⏸️ **T-037** → `docs/PLAN-T037.md`. Steps 1, 3-6 done; step 2/7 = owner device test, step 8 commit.
> ✅ **T-041 CLOSED** (this file) · ✅ **T-036 CLOSED** → `docs/PLAN-T036.md`.
> ⏸️ **T-031/T-033/T-030/T-027/T-018/T-026A/T-025** → their own `docs/PLAN-T0*.md`.
> ⏸️ **Also parked:** T-011 · T-012 · T-014 · T-015 · T-016 · T-017.

## Task — ✅ CLOSED 2026-08-10
- **ID / name:** T-041 — T-038 shipped and the owner is **still** logged out
- **Goal (definition of "done"):**
  1. A refresh the server **rejected** (401/403) is the **only** thing that ends a session.
     A **429**, any **5xx**, a timeout or a malformed body must leave the session intact.
  2. `/auth/me` — called on **every app launch** — stops eating the refresh budget.
  3. The refresh endpoint's own failures are **translated**, like every other auth message.
  4. When a session does end, the **reason** is visible in the log, so the next report is
     diagnosable in one line instead of another day of tracing.
  5. Both apps changed identically; `tsc` at baselines.
- **Why now:** the owner deployed T-038, rebuilt both apps, and is still being logged out.
- **Source:** owner, 2026-08-08, re-confirmed 2026-08-09 with two screenshots.

## Evidence from the owner's device (2026-08-09)
Two screenshots, both at 4:50, both **inside** the app (not bounced to the login screen):
- *Mening safar so'rovlarim* → dialog **"Ruxsat berilmagan / Sizning sessiyangiz tugagan yoki
  noto'g'ri. Iltimos, qayta kirish qiling."** — the app's own `errors.unauthorized`
  (`translations/uz.ts:252` + `:578`), i.e. a **401 handled by the screen**.
- *Mening bronlarim* → toast **"Xato / Sessiya muddati tugagan"** — the **server's** translated
  `auth.tokenExpired` (`i18n/translations/uz.ts:134`).

⇒ The app sent an **expired access token** and `ensureFreshAccessToken` did **not** replace it.
Both counters read 0 because both list calls 401'd.

## What was checked and RULED OUT 2026-08-09 (do NOT re-derive)
✅ **`POST /auth/refresh` is deployed and behaves correctly.** Probed live:
`{}` → **400**; `{"refresh":"not.a.jwt"}` → **401 `{"success":false,"message":"Invalid refresh
token"}`**. The field name the app sends (`refresh`) matches `AuthController.v2:446`, and the
response shape the app reads (`data.access` / `data.refresh`) matches `:461-466`.
✅ **Every authenticated call goes through the refresh choke point.** `getHeaders` is the only
place that sets `Authorization`; the single hand-rolled header (avatar upload,
`api/users.ts:132`) calls `ensureFreshAccessToken` first.
✅ **Nothing writes or deletes the token keys behind `AuthContext`'s back** — the only touchers of
`@auth_token` / `@auth_refresh_token` are `utils/tokenStore.ts` and `AuthContext`'s
`persistSession` / `clearSession`.
✅ **All four sign-in paths persist the refresh token** (`AuthContext:339/360/381/402`).
✅ **`app.set('trust proxy', 1)`** (`app.ts:35`) — so the limiter keys on the **real client IP**,
not one global bucket. The blast radius is per-IP, not the whole deployment.

## 🔴 The cause — Hypothesis B, now grounded, not theoretical
`authLimiter` is **20 requests / 15 minutes, keyed by IP** (`middleware/rateLimiter.ts:97-106` —
no `keyGenerator`, so express-rate-limit defaults to `req.ip`). It guards **three** routes that
share that one budget (`auth.routes.v2.ts:28,29,32`):

| route | when it fires |
|---|---|
| `POST /auth/refresh` | every ~15 min per app |
| `POST /auth/logout` | every sign-out |
| `GET /auth/me` | **every single app launch** (`AuthContext.initializeAuth`) |

The **user app and the driver app on the same phone share one IP**, and so does every tester on
the same Wi-Fi. During an active test session — relaunching, logging out, logging back in, two
apps — 20 in 15 minutes is genuinely reachable.

And then `performTokenRefresh` (`config/api.ts:153-157`, **identical** in
`driver-app-standalone/config/api.ts:147-151`) treats **any** non-`ok` as "the session is over":

```ts
if (!response.ok) {
  await clearTokens();      // ← throws the refresh token away
  notifyAuthLost();         // ← AuthContext logs the user out
  return null;
}
```

So a **429 permanently destroys the session** — and the user must log in again, which costs more
auth requests, which makes the next 429 more likely. A transient **5xx** does the same. Only
**401/403** should. The T-038 runtime suite missed it because it only ever simulated a 401.

⚠️ **Hypothesis A is still live too and the fix cannot clear it.** A session created *before* the
T-038 build has **no refresh token on disk**; rebuilding does **not** clear AsyncStorage. Whatever
we ship, the owner must **log out and log in once** on the new build — see step 7.

## Also found (fix in this card, they are one-liners)
- 🔴 **`GET /auth/me` behind a 20/15min limiter is simply wrong** — it is an authenticated read
  called on every launch, and it is starving the refresh it shares the budget with.
- ⚠️ **The refresh endpoint's failures are untranslated English** — `AuthController.v2:473`
  (`'Failed to refresh token'`) and `utils/jwt.ts:107-125` (`'Invalid refresh token'`,
  `'Refresh token expired'`). The live probe returned English with `Accept-Language: uz-UZ`.
  T-038 translated `middleware/auth.ts`; this endpoint was missed.

## Steps
- [x] 1. **DONE 2026-08-09. The 429 is real, and it fires exactly where predicted.** 23 rapid
  `POST /auth/refresh` against test3 from one IP: requests **1-20 → 401**, **21-23 → 429** with
  `{"success":false,"message":"Juda ko'p so'rov yuborildi…","data":{"retryAfterSec":895}}`.
  So T-033's JSON limiter handler works, the 429 **is** translated — and the pre-fix app would have
  read that as "your session is over" and wiped a perfectly valid refresh token for 15 minutes.
  ⚠️ It also exposed step 5's target in the same output: the **401 came back in English**
  (`"Invalid refresh token"`) despite `Accept-Language: uz-UZ`, while the 429 was translated.
- [x] 2. **DONE 2026-08-09. Only 401/403 ends the session.** The non-`ok` branch is split in both
  apps; everything else logs and returns `null`, keeping both tokens exactly like the offline path.
  ⚠️ **The `!access` branch had the same bug and is fixed too** — a 200 the app cannot parse used
  to log the user out. It now keeps the session; if the server really did rotate and the new pair
  was lost, the stored refresh token is already revoked and the **next** attempt gets a 401, which
  ends the session through the correct branch. That is the right way to reach that conclusion.
  ✅ The 99-line block is **verified byte-identical** between the two apps.
- [x] 3. **DONE 2026-08-09. Every session-end says why.** A `console.warn` on the fatal branch
  carrying the status, one on each survivable branch, and a distinct line for the pre-T-038 install
  ("no refresh token on disk — sign out and in once"). The next report is now a one-line diagnosis.
- [x] 4. **DONE 2026-08-09. The budgets are split — and keyed by USER, not IP.**
  🔴 **Per-IP was the deeper bug.** One phone runs both apps behind one IP, an office Wi-Fi puts
  every tester behind one, and a **mobile carrier NAT puts thousands of real users behind one** —
  so an IP-keyed refresh budget is a *shared* budget and would have kept firing in production long
  after the testers went home. New `tokenSubjectKey` decodes (never verifies) the token in the
  request and keys on `userId`, falling back to IP — the same shape as `otpSendLimiter`'s
  `phone || req.ip`. Decoding is safe here: it picks a counter and grants nothing.
  New `refreshLimiter` **30 / 15 min / user** (a healthy app needs ~8/hour with both apps installed)
  and `sessionReadLimiter` **120 / 15 min / user** for `/auth/me`. `/auth/logout` stays on
  `authLimiter` — it is rare. ✅ **Owner decided 2026-08-10: keep both numbers as they are** — with
  per-user budgets a real user will not trip them, so they will not break in production.
  **Do not revisit.** They are two literals in `rateLimiter.ts` if a 429 ever appears in a report.
- [x] 5. **DONE 2026-08-09. The refresh endpoint speaks the caller's language.** `refreshToken`
  now resolves `Accept-Language` and returns translated messages; 2 new keys
  (`auth.refreshTokenRequired`, `auth.tokenRefreshed`) ×3 locales, reusing the existing
  `auth.tokenExpired` / `auth.tokenInvalid`.
  ⚠️ **The fragile part, deliberately:** `utils/jwt.ts` is a pure utility with no request context,
  so it throws English `Error`s and the controller picks the key by testing `/expired/i` against
  the message. Drift there degrades to `tokenInvalid` — a safe answer, not a crash — and step 6
  pins the real messages so drift is caught.
- [x] 6. **DONE 2026-08-09. 98/98 + 8/8, and the suite is proven able to fail.**
  `tsc`: API **282 = baseline** · admin **0 = baseline** · user **11** · driver **35** (the apps'
  one-below is T-038's, not this card's). Zero errors in either app's touched file; the 11 in the
  two touched API files were **proven identical to `HEAD`** via `git stash`.
  **98/98 runtime matrix** driving **both apps' real transpiled modules** through
  `ensureFreshAccessToken` with a controlled `fetch`: 401/403 end the session and clear both tokens;
  **429, 500, 502, 503, network, abort, unparseable body and a 200 with no access token all leave
  the session and BOTH tokens intact**; the pre-T-038 install makes **no network call at all**;
  rotation stores the new refresh token; 6 concurrent callers cause **exactly one** refresh; and a
  screen still holding its sign-in token re-reads storage instead of rotating again.
  🔴 **Proven to fail against the pre-fix code: 32 checks red** when the two app files are stashed —
  this reproduces the owner's bug rather than merely asserting the new code does what it says.
  **8/8 limiter check** mounting the **real** `refreshLimiter`/`sessionReadLimiter` on a throwaway
  express app: user A is blocked at exactly #31, and **user B on the same IP is unaffected** — the
  claim the whole fix rests on. The 429 is JSON, translated, and carries `retryAfterSec`.
  Scripts: `scratchpad/t041-check.js`, `scratchpad/t041-limiter-check.js`.
- [x] 7. **DONE 2026-08-10 — owner device test PASSED.** The owner deployed the API, rebuilt both
  apps and confirmed the refresh-token issue is **resolved on a device**. The session survives;
  the silent logout is gone. ✅ This also retro-confirms **T-038**, whose refresh-token mechanism
  this card was repairing — the two were always one story on the device.
- [x] 8. **DONE — committed by the owner as `0ccde30`** ("T-041: only a rejected refresh ends the
  session; split the auth rate limits"). Working tree clean.

## Files to touch
- `user-app-standalone/config/api.ts` — the non-`ok` split + logging
- `driver-app-standalone/config/api.ts` — the same, byte-identical
- `api,admin,db/apps/api/src/middleware/rateLimiter.ts` — a limiter for `/auth/me`, one for refresh
- `api,admin,db/apps/api/src/routes/auth.routes.v2.ts` — wire them up
- `api,admin,db/apps/api/src/controllers/AuthController.v2.ts` + `src/utils/jwt.ts` — i18n
- `api,admin,db/apps/api/src/i18n/translations/{uz,ru,en}.ts`
- ❌ **No migration. No app-storage change** (the keys must stay exactly as they are).

## Risks / open questions (READ before coding)
- ❓ **Open question for the owner:** after installing the new build, did you **log out and log
  back in**? If not, Hypothesis A alone explains the screenshots and step 2 is still worth doing,
  but it will not change what you see until you re-login once.
- ⚠️ **Loosening `authLimiter` is a security trade-off** — `/auth/refresh` is unauthenticated, so
  its limiter is real brute-force protection. Do not simply raise the number; split the routes so
  each gets a budget that fits its actual traffic.
- ⚠️ **Do not "fix" this by keeping the session on a 401.** A rejected refresh token genuinely
  means the session is over; the bug is treating *everything else* the same way.
- ⚠️ **Both apps carry identical code** — every app-side change is made twice (project convention).
- ⚠️ **Four cards are uncommitted/undeployed in this tree** (T-037, T-038, T-039 device tests;
  T-040 deploy). Keep this card's commit separate.
- 🚫 **Do not touch `JWT_EXPIRES_IN`** (owner, 2026-08-08).
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).

## Session notes (one line per work session)
- **2026-08-09** — card opened. Ruled out the endpoint (probed live: deployed and correct), the app
  plumbing (all calls go through `getHeaders`; nothing writes the token keys behind `AuthContext`)
  and a global limiter bucket (`trust proxy` is set). Hypothesis B is now **grounded**: `/auth/me`
  shares a **20/15min per-IP** budget with `/auth/refresh`, and a 429 is treated as a fatal session
  end. Plan written; **awaiting approval**.
- **2026-08-09 (approved, steps 1-6 done)** — the 429 was reproduced against the live API on the
  21st request, and the pre-fix apps fail 32 of the new checks. Two things turned out to be bigger
  than the plan assumed: the **`!access` branch** carried the same "any failure = logout" bug, and
  the limiter being **keyed by IP** would have kept firing in production behind carrier NAT long
  after the test session ended — so the new budgets key on the **user** in the token, not the IP.

## Resume point (for the next chat)
✅ **T-041 is CLOSED — 2026-08-10.** All 8 steps done: device-tested by the owner (the refresh-token
issue is **resolved**) and committed as `0ccde30`. There is **no active task** in this file.
The owner's remaining device tests (T-037 · T-039 · T-040, and T-033 · T-030 · T-027 · T-025 further
back) continue in the *Parked* section of `docs/TODO.md`. Pick the next card with `/new-task`.

<details><summary>History of the closed card</summary>

**Steps 1-8 DONE.**

Two independent defects were fixed, and the card needed both:
1. **The apps over-reacted.** `performTokenRefresh` ended the session on **any** non-`ok` — a 429,
   a 5xx, even a 200 it could not parse. Now only **401/403** does.
2. **The server made that fire constantly.** `/auth/refresh` shared a **20-per-15-min per-IP**
   budget with `/auth/logout` and `GET /auth/me` — and `/auth/me` runs on every app launch, with
   both apps on one phone counting against the same IP. Now: `refreshLimiter` 30/15min and
   `sessionReadLimiter` 120/15min, both **keyed on the user in the token, not the IP**.

🛑 **API deploy required** (limiters + the translated refresh messages), then rebuild both apps.
⚠️ **The owner must LOG OUT AND LOG IN ONCE.** A pre-T-038 session holds no refresh token and
rebuilding does not clear AsyncStorage — no code change can repair that install. The app now says
so in the log: *"no refresh token on disk (pre-T-038 session — sign out and in once)"*.

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12** (currently **11**),
driver app **36** (currently **35**) — both one below, from T-038's logout fix.

</details>
