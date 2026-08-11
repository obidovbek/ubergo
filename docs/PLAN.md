# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-044 CLOSED** 2026-08-11 → `docs/PLAN-T044.md`. ✅ **T-042 CLOSED** 2026-08-11.
> ✅ **T-041 CLOSED** → `docs/PLAN-T041.md`. ✅ **T-038 CLOSED** → `docs/PLAN-T038.md`.
> ⏸️ **T-040** → `docs/PLAN-T040.md`. ⏸️ **T-039** → `docs/PLAN-T039.md`.
> ⏸️ **T-037** → `docs/PLAN-T037.md`. Crash fixed; the join sheet and `MyJoinRequests`
> have still **never been opened on a device**.
> ⏸️ **T-031/T-033/T-030/T-027/T-018/T-026A/T-025** → their own `docs/PLAN-T0*.md`.

## Task
- **ID / name:** T-046 — a cancelled passenger offer must cancel the drivers' bids, and a
  foreground push must be actionable
- **Goal (definition of "done"):**
  1. Cancelling a passenger offer sets every `pending`/`confirmed` `OfferDriver` row on it to
     **`cancelled`** (+ `cancelled_at`). No bid is left at "waiting" against a dead offer.
  2. Rows already stranded in the DB are repaired by a migration.
  3. A push arriving while the app is **in the foreground** shows a **tappable toast** that
     navigates to the same destination `routeForNotification` already computes — in **both** apps.
  4. Ignoring a foreground toast never navigates. It must not steal the screen.
  5. `tsc` at baselines: API **282** · admin **0** · user **11** · driver **35**.
- **Why now:** owner device test, 2026-08-11 — *"if passenger cancels own offer push notification
  comes to driver but on click did not open exactly page. and on driver send offers page request
  still shows waiting after passenger cancel offer"*.
- **Owner decisions (2026-08-11):**
  - Stranded rows → status **`cancelled`**, not `rejected` (Claude's call, owner delegated).
  - **Repair existing rows: YES.**
  - Foreground push → **option (a): a tappable toast that navigates on tap.**

## 🔴 Why the "72/72" in T-044 did not catch this — read before trusting any check here
T-044's suite drove **`handleNotificationTap`** with 72 payloads and all 72 routed correctly.
**It never asked who calls that function.** In the foreground, **nobody does**:
`setupForegroundNotificationHandler` (`PushService.ts:173`) receives the message via `onMessage`,
`console.log`s it, and drops it — its only `if` is a dead branch for `passenger_join_request` whose
body is the comment *"Could trigger auto-refresh"*.
⇒ **The suite verified a mapper that real foreground events never reach.** Same shape as T-042's
stale comment: it confirmed what I already believed instead of what the app does.
**Any check written for this card must drive the path the OS actually takes, not the mapper.**

## The three defects (all grounded 2026-08-11)

### ① 🔴 Server: `cancelOffer` abandons the bids — this is the "still waiting"
`PassengerOfferService.cancelOffer:928-997`. It loads `interestedDrivers` (`pending` + `confirmed`)
at **:939**, does `await offer.update({ status: 'cancelled' })` at **:953**, pushes each driver at
**:962**, and **never updates a single `OfferDriver` row.**
⇒ Those rows stay `pending` **forever** — the offer is `cancelled`, so nothing will ever move them.
**The driver app is telling the truth; the database is wrong.**
✅ **The precedent to copy is in this codebase already:** `OfferDriverService.confirmDriver:377-382`
walks the losing bids and sets each to `rejected` + `rejection_reason` + `rejected_at`. And
`OfferPassengerService:530-536` cancels a passenger join as `cancelled` + `cancelled_at`.
**Cancelling the offer is the only path that forgets.**

### ② 🔴 Both apps: a foreground push is dropped (the "did not open exactly page")
Three delivery paths exist; **two** are wired:

| App state | Handler | Navigates? |
|---|---|---|
| Killed → tapped | `getInitialNotification` (`PushService.ts:219`) | ✅ |
| Background → tapped | `onNotificationOpenedApp` (`:210`) | ✅ |
| **Foreground** | `onMessage` (**`:173`**) | ❌ **logs and drops** |

The owner's app was **open**, so FCM delivered via `onMessage`. No system notification is posted and
nothing navigates — **the app never moved**. "It opened the home menu" is the app *staying* on the
home menu, not routing there.
⚠️ **`showToast` cannot do this yet** — the four helpers in each app's `utils/toast.tsx` take only
`(title, message)` and pass **no `onPress`** to `Toast.show`. Needs a small extension, in both apps.

### ③ 🟡 Rows already stranded
Every driver who bid on an already-cancelled offer still sees "waiting". Owner: repair them.

## Steps
- [x] 1. **DONE 2026-08-11. Server: the bids are cancelled with the offer.**
  ✅ **Blocker cleared first:** `OfferDriver` already has `cancelled` in its ENUM
  (`database/models/OfferDriver.ts:136`) and a nullable `cancelled_at` (:156) — **no schema change,
  no extra approval needed.** ⚠️ The table is **`offer_drivers`** (plural), which the migration uses.
  A single `OfferDriver.update({status:'cancelled', cancelled_at})` over the same `where` clause,
  placed **before** the pushes so a driver opening the app on the notification cannot read a row this
  call is about to change.
- [x] 2. **DONE 2026-08-11 (written, NOT run). Migration to repair the stranded rows.**
  `src/database/migrations/20260811000001-cancel-stranded-driver-bids.cjs`. Sets `offer_drivers` to
  `cancelled` where the row is `pending`/`confirmed` **and** its parent `passenger_offers.status =
  'cancelled'`; `RETURNING id` so it **prints the repaired count** when it runs.
  ⚠️ **`cancelled_at` is set to the OFFER's `updated_at`, not `NOW()`** — stamping today's date on a
  bid that died weeks ago would invent history.
  ⚠️ **`down` is a deliberate NO-OP.** The prior per-row status is recorded nowhere, so reverting
  everything to `pending` would resurrect bids on long-dead offers, including legitimately
  `confirmed` ones. A no-op is honest; a plausible-looking rollback would corrupt data.
  🛑 **I could not report the row count in advance — the live DB is in test3 and unreachable from
  here.** The migration prints it as it runs.
- [x] 3. **DONE 2026-08-11. `showToast.tappable` in BOTH apps.** Added rather than changing the four
  existing helpers, so every current call site is untouched. 6 s (vs 3-4 s) because it asks for an
  action, not just acknowledgement, and it hides itself on tap so the tap does not look ignored.
  The two files remain identical.
- [x] 4. **DONE 2026-08-11. The foreground path is wired in BOTH apps.**
  `setupForegroundNotificationHandler` takes a second `onTap` argument and shows a tappable toast
  built from the FCM `notification` block; the tap calls the **same** `handleNotificationTap`, so
  there is exactly one destination table. Both dead branches deleted (`passenger_join_request` in the
  driver app, `otp` in the user app).
  ⚠️ **No title ⇒ no toast** — an empty bar the user cannot interpret is worse than silence.
  ⚠️ **`otp` is skipped in the user app**: the code arrives on the OTP screen the user is already
  looking at, and the mapper has no destination for it.
  🔴 **Both `App.tsx` call sites had to change too** — `setupForegroundNotificationHandler()` was
  called with **no arguments**, so a perfect handler would still have done nothing. **This is exactly
  the T-044 trap** (a correct function nobody calls), so the suite asserts the wiring itself.
- [x] 5. **DONE 2026-08-11. 27/27, and proven able to fail — 16 red.**
  The suite drives the **real transpiled `PushService` of both apps**: it registers the actual
  handler, captures the `onMessage` callback FCM would invoke, and fires FCM-shaped messages at it.
  **It never calls the mapper directly — that is precisely what T-044 got wrong.**
  Asserts: a foreground push shows a toast carrying the FCM title/body; **an untapped toast never
  navigates**; a tap forwards the *original* `data` payload exactly once; no title ⇒ no toast; 7
  hostile payloads never throw and never navigate; two pushes give two independently-tappable
  toasts; the user app stays silent for `otp`; and **both `App.tsx` files actually pass the handler**.
  🔴 **16 red against the pre-change code**, including *"foreground push shows a toast"* — the
  owner's exact symptom reproduced.
  `tsc`: API **282** · user **11** · driver **35**, all at baseline. The one error in a touched file
  (`PushService.ts` `token` implicitly `any`) **proven pre-existing via `git stash`** — line 146
  before, 147 after, shifted only by my import.
  ✅ **No new user-visible strings**, so no i18n work: the toast reuses the title/body the server
  already translated per-driver (`getUserLanguage`).
  Script: `scratchpad/t046-foreground-check.js`.
- [ ] 6. Owner: deploy the API, **run the migration**, rebuild both apps, retest the exact repro.
- [ ] 7. Commit (only after the owner's approval). ⚠️ **Keep `.claude/settings.json` out** — it has
  been swept into 4 commits now.

## Files to touch
- `api,admin,db/apps/api/src/services/PassengerOfferService.ts` — step 1
- **NEW** `api,admin,db/apps/api/src/database/migrations/20260811000001-*.cjs` — step 2
- `driver-app-standalone/utils/toast.tsx` + `user-app-standalone/utils/toast.tsx` — step 3
- `driver-app-standalone/services/PushService.ts` + `user-app-standalone/services/PushService.ts` — step 4
- Both apps' `translations/{uz,ru,en}.ts` if any new string is needed
- ❌ **Do not touch** `notificationRouting.ts` in either app — the destination table is correct and
  device-confirmed (T-044). This card only changes **who calls it**.

## Risks / open questions (READ before coding)
- 🔴 **Verify `OfferDriver` supports `cancelled` + `cancelled_at` before step 1.** If the ENUM or the
  column is missing, that is a schema change → **stop and ask** (project rule 4).
- 🔴 **The migration is a data write.** Owner approval required, row count reported first, and `down`
  honestly documented as irreversible.
- ⚠️ **A foreground toast can appear at a bad moment** (mid-form in the join sheet). It must never
  navigate on its own — tap only. That is the whole point of option (a).
- ⚠️ **Both apps carry near-identical code** — every app-side change is made twice.
- ⚠️ **Do not re-verify the mapper and call it done.** T-044 already proved the table is right; this
  card is about the path that never reaches it.
- ⚠️ **T-045 overlaps deliberately**: it will persist notifications server-side. This card does not
  touch `NotificationService` — if both land, re-check that a foreground push does not double-report.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).

## Session notes (one line per work session)
- **2026-08-11** — card opened from the owner's T-037 device walk. Two symptoms turned out to be
  **three** defects: the server never cancels the bids (the "waiting" is real data, not a display
  bug), the **foreground** delivery path drops the payload entirely, and rows are already stranded.
  🔴 **T-044's 72/72 passed because it tested the mapper, not its callers** — recorded above so the
  same mistake is not repeated in step 5. **Awaiting approval.**

## Resume point (for the next chat)
**Steps 1-5 DONE 2026-08-11. Only step 6 (owner: deploy + migrate + rebuild + retest) and step 7
(commit) remain.**

**Three defects fixed:**
1. **Server** — `cancelOffer` now cancels the drivers' bids instead of abandoning them at `pending`.
   ✅ No schema change was needed: `cancelled` and `cancelled_at` already existed on `OfferDriver`.
2. **Both apps** — a **foreground** push (`onMessage`) used to be logged and dropped; it now shows a
   **tappable toast** routed through the same `handleNotificationTap` as the other two paths.
   🔴 Both `App.tsx` call sites passed **no arguments**, so the wiring is asserted by the suite.
3. **Migration written** for the already-stranded rows — **not yet run**.

🛑 **Step 6 is the owner's, and the ORDER MATTERS:**
**(a) deploy the API → (b) `npm run db:migrate` → (c) rebuild BOTH apps → (d) retest.**
The migration only repairs history; without the deploy, new cancellations keep stranding rows.
⚠️ **The migration prints the number of rows it repaired** — the count could not be gathered in
advance because test3's DB is unreachable from the dev machine. Its `down` is an intentional no-op.

**The exact repro to retest:** driver bids on a passenger order → passenger cancels it →
(i) the driver's push, tapped **with the app open**, must land on **`MyJoinRequests`**, and
(ii) that row must read **cancelled**, not "waiting".

**Baselines:** API **282** · admin **0** · user **11** · driver **35**.
