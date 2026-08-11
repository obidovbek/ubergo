# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-024 CLOSED** → `docs/PLAN-T024.md`. ✅ **T-046** → `docs/PLAN-T046.md`.
> ✅ **T-044** → `docs/PLAN-T044.md`. ✅ **T-034 · T-043 · T-042 · T-041 · T-038 · T-048 · T-052 ·
> T-053 done** (several awaiting the owner's device test).
> 🔴 **T-047 PARKED BY THE OWNER** — killed-app push tap opens the main menu. Fix #1 committed and
> verified but **not the whole cause**; needs a `logcat` line before more code.
> ⏸️ **T-040 · T-039 · T-037 · T-031 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own
> `docs/PLAN-T0*.md`; most are waiting on the owner, not on code.

## Task
- **ID / name:** T-045 — notifications must be recorded, and the list must go somewhere
- **Goal (definition of "done"):**
  1. Every ride event that sends a push also **writes a `notifications` row**, so a missed push
     leaves a record instead of nothing.
  2. A row is written **even when the push fails** (bad token, FCM down) — owner decision.
  3. Tapping a row in either app's notifications list **navigates to the same destination the push
     would have opened**, reusing `routeForNotification`.
  4. Nothing regresses: pushes still send, and a persistence failure never breaks the ride flow.
  5. `tsc` at baselines: API **281** · admin **0** · user **9** · driver **35**.
- **Why now:** split out of T-044. Right now **a missed push leaves no trace anywhere** — the user
  is simply never told. Both halves of the in-app list are broken: it is nearly empty, and its rows
  do nothing.

## What is already there (verified 2026-08-11 — do NOT re-derive)
✅ **The table exists and needs no migration.** `notifications` has a **JSONB `data` column**
(`20250131000001-create-notifications.cjs`) — exactly what `routeForNotification` reads.
✅ **`NotificationService.createNotification(userId, { title, message, type?, data? })`** is built
and already stores `data`.
🔴 **It has exactly ONE caller in the entire API** — `AuthController.v2:90`, the signup welcome
message. Every ride event is fire-and-forget FCM.
✅ **6 notify functions across 4 services, driving 13 call sites:**
`OfferPassengerService` (2 fns / 6 sites) · `OfferDriverService` (2 / 5) ·
`DriverOfferService` (1 / 1) · `PassengerOfferService` (1 / 1).
✅ **All six share an identical signature** — `(userId, { type, title, body, data }, language?)`.
⇒ **Persist inside the 6 functions, not at the 13 call sites.** One place each, catches every caller
including any added later.
✅ **`routeForNotification` exists in both apps** (T-044, device-confirmed) and already maps every
type. The list can reuse it rather than inventing a second table.
❌ **Neither list navigates today:** the user app opens a **detail modal**
(`NotificationsScreen:48 handleNotificationPress`); the driver app only **marks read** (`:66`).

## Owner decisions (2026-08-11)
1. **Build both halves** — persistence *and* tappable rows.
2. **Always write the row, even if the push fails.** The row is the durable record; the push is only
   the alert. A user with a stale token would otherwise get neither.

## Steps
- [x] 1. **DONE 2026-08-11. `NotificationService.recordPush()`** — one helper, so six copies cannot
  drift. Maps the push's `body` → the row's `message`, sets the row `type` to the **severity**
  `'info'`, and puts the **event name** into `data.type`, spread-first so a stray `type` in the
  payload cannot shadow it. **Never throws.**
  🔒 **`otp` is refused outright** via a `NEVER_PERSIST` set — a login code in a durable list the
  user can re-read defeats the point of it being single-use (same reasoning as T-034's log purge and
  T-046's toast exclusion).
- [x] 2. **DONE 2026-08-11. All 6 notify functions record**, across all 4 services — so all **13**
  call sites are covered, including any added later.
  ⚠️ The call sits **before the push and OUTSIDE its try/catch**, which is what makes owner decision
  2 real: a stale token or an FCM outage can no longer swallow the record.
- [x] 3. **DONE 2026-08-11. Driver app rows navigate.**
  🔴 **The routing had to sit OUTSIDE `handleMarkAsRead`,** which returns early for an already-read
  row — so tapping a notification you had seen once did nothing **forever**. A naive fix inside that
  function would have worked exactly once per row.
  ⚠️ `handleNotificationPress` was also moved **below** `handleMarkAsRead`: as a `const` arrow it is
  in the temporal dead zone until declared, so the original placement was a runtime crash waiting to
  happen that `tsc` does not flag.
- [x] 4. **DONE 2026-08-11. User app rows navigate — and KEEP the modal.**
  Rows with a routable event type navigate; everything else still opens the detail modal, which is
  the only way to read a message longer than the two lines a row shows.
  ⚠️ **`routeForNotification` was deliberately NOT exported.** Widening a device-confirmed module's
  API for one caller invites a second, divergent copy of the destination table — the exact class of
  bug behind T-042 and T-044. The screen decides only *whether* to route; the mapper still owns
  *where*. The allow-list is asserted against the mapper's real `case` labels.
- [x] 5. **DONE 2026-08-11. 54/54, proven able to fail — 44 red.**
  `tsc` API **281** · user **9** · driver **35**, all at baseline (the 3 errors in the driver's
  touched file **proven pre-existing via `git stash`**, shifted 50/77/96 → 51/78/117).
  The helper is **executed**, not grepped: the type trap verified both ways, `otp` refused, a
  **thrown DB error proven not to propagate** (the ride flow survives), and a missing `data` payload
  handled. Plus all 6 notify functions asserted to record *before* the push and *outside* its try.
  ⚠️ **Two of my own checks were wrong before the code was:** one regex ran past the Set literal into
  the stylesheet and "found" `center`/`700` as event types; and the suite crashed instead of
  reporting red until the missing-`recordPush` and empty-array cases were guarded. **A suite that
  cannot fail cleanly proves nothing.**
- [ ] 6. Owner: deploy the API, rebuild both apps, check the list fills and rows navigate.
- [ ] 7. Commit (only after the owner's approval).

## Files to touch
- `api,admin,db/apps/api/src/services/NotificationService.ts` — the shared helper
- `api,admin,db/apps/api/src/services/{OfferPassenger,OfferDriver,DriverOffer,PassengerOffer}Service.ts`
  — 6 notify functions
- `driver-app-standalone/screens/NotificationsScreen.tsx` · `user-app-standalone/…` — tappable rows
- ❌ **No migration** — the table and its JSONB `data` column already exist.

## Risks / open questions (READ before coding)
- 🔴 **A notification must never break a ride.** Every write is best-effort: swallow and log.
- 🔴 **Two different meanings of `type`** — severity vs event name (see step 1). Getting this wrong
  makes every row render with the wrong icon *and* breaks tap routing.
- ⚠️ **Do not touch `routeForNotification`.** It is device-confirmed; this card only adds a caller.
- ⚠️ **`otp` pushes must NOT be persisted** — a login code in a durable list is a security problem,
  and T-046 already excludes it from the foreground toast for the same reason.
- ⚠️ **Both apps carry near-identical screens** — every app change is made twice.
- ⚠️ Uncommitted/undeployed work is stacking up: **T-034 and T-043 both need an API deploy**, and
  this card adds a third. They deploy together safely (no migration in any of them).
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).

## Session notes (one line per work session)
- **2026-08-11** — card opened after T-043. Grounded: the table needs **no migration**, the service
  method exists, and **6 notify functions with identical signatures cover all 13 call sites** — so
  persistence goes in the functions, not the sites. Owner chose **both halves** and **write the row
  even when the push fails**. **Awaiting approval.**

## Resume point (for the next chat)
**Steps 1-5 DONE 2026-08-11. Only step 6 (owner: deploy + rebuild + check) and step 7 (commit)
remain.**

**What changed:** every ride notification now writes a durable row — **13 call sites covered by
touching 6 functions** — and it is written **before the push, outside its try/catch**, so a stale
token or an FCM outage can no longer mean the user is never told. Tapping a row in either app now
goes where the push would have gone.

🔒 **`otp` is never persisted** — a login code in a re-readable list is a security hole.
🔴 **The record is best-effort by design:** `recordPush` swallows and logs, because a notification
must never fail a confirmed booking.

🛑 **THREE cards now need the SAME API deploy: T-034 (OTP security), T-043 (endpoint shape), and
this one.** None has a migration, so they deploy together safely.
**What to check after deploying:** the notifications list should start filling with real ride events
(it only ever held signup welcome messages before), and tapping a row should open the ride — not
just mark it read.

**Baselines:** API **281** · admin **0** · user **9** · driver **35**.
