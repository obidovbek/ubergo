# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 🟢 **NO ACTIVE TASK (2026-08-11).** T-044 closed below; pick the next card from `docs/TODO.md`.
> ✅ **T-042 CLOSED** 2026-08-11 (device) → written up in `docs/TODO.md`.
> ✅ **T-041 CLOSED** → `docs/PLAN-T041.md`. ✅ **T-038 CLOSED** → `docs/PLAN-T038.md`.
> ⏸️ **T-040** → `docs/PLAN-T040.md`. ⏸️ **T-039** → `docs/PLAN-T039.md`.
> ⏸️ **T-037** → `docs/PLAN-T037.md`. Its crash is fixed and confirmed; ⚠️ the **join sheet** and
> **`MyJoinRequestsScreen`** were still never reached on a device — ask the owner before closing.
> ⏸️ **T-031/T-033/T-030/T-027/T-018/T-026A/T-025** → their own `docs/PLAN-T0*.md`.

## Task
- **ID / name:** T-044 — a tapped push must open the **exact** screen, in both apps
- **Goal (definition of "done"):**
  1. Every push type that **has** a real destination opens **that** destination, with params —
     not a generic list, in **both** apps.
  2. A type with no exact destination still lands somewhere honest and never crashes.
  3. A malformed / unknown / hostile payload can never navigate to a route that does not exist.
  4. Both apps' mappers stay structurally identical (project duplicate-by-convention rule).
  5. `tsc` at baselines: API **282** · admin **0** · user **12** · driver **35**.
- **Why now:** owner, 2026-08-10 — *"any notification on click should open that exactly page or
  screen in both apps"*.
- **Scope decision (owner, 2026-08-10):** **push taps only, app-side.** No API change, no deploy —
  rebuild both apps. The two blockers found while scoping are logged as their own cards, **not**
  done here: **T-045** (in-app list rows) and **T-024** (the passenger's "drivers who offered").

## What already works — do NOT rebuild it
✅ **The tap plumbing is complete and correct in BOTH apps** and is not the problem:
`App.tsx` → `setupNotificationTapHandler(handleNotificationTap)`, a `pendingTarget` park for taps
that arrive before the navigator exists (cold start / pre-auth), and
`flushPendingNotification()` on `NavigationContainer.onReady` **and** on auth state change
(`RootNavigator`). Cold start, background and pre-login are all already handled.
**This card only changes `routeForNotification()` — the destination table — in each app.**

## The real gaps (grounded 2026-08-10)
**Every push except `otp` carries `offer_id` plus a join id**, so exact routing is possible.

### Driver app — 4 types dumped to the generic list by a STALE comment
`utils/notificationRouting.ts:56-62` sends `driver_request_confirmed`,
`driver_request_rejected`, `driver_not_chosen` and `offer_cancelled_by_passenger` to
`Notifications`, with the comment *"There is no screen for these yet (T-023/T-024)"*.
🔴 **That is out of date — T-037 built `MyJoinRequests` AND `PassengerOfferDetails`**, and both are
registered in `MainNavigator`. All four are outcomes of the driver's own bid, which is exactly what
`MyJoinRequests` lists.
✅ `passenger_join_request` / `passenger_cancelled` → `OfferPassengers({offerId})` **already exact.**

### User app — everything lands on one of two list screens
`utils/notificationRouting.ts` has **no params at all** (`interface NotificationTarget { screen }`).
`OfferDetails` exists and takes `{ offerId }`, so the booking notifications can open the actual ride.

## 🔴 The trap this card must not fall into
**`offer_id` does NOT mean the same thing in every payload.** Two different entities share the name:
- `join_confirmed` · `join_rejected` · `driver_arrived` · `driver_10min_away` ·
  `offer_cancelled_by_driver` → `offer_id` is a **DRIVER offer**. `OfferDetailsScreen` fetches
  `OffersAPI.getOfferDetails` → `DriverOffer`. ✅ Safe to open.
- `driver_join_request` · `driver_request_cancelled` → `offer_id` is the passenger's **OWN
  PassengerOffer**. Feeding that to `OfferDetails` would fetch a **driver** offer by a **passenger**
  offer id — a wrong row or a 404, presented as the user's own trip.
  ⇒ These two stay on `MyPassengerOffers` until **T-024** exists. That is the honest destination.

## Steps
- [x] 1. **DONE 2026-08-10. Driver app — the 4 stale types now open `MyJoinRequests`.**
  The comment claiming those screens did not exist was replaced with one recording that T-037 built
  them. All **6** driver-audience types now resolve exactly: `passenger_join_request` and
  `passenger_cancelled` were already `OfferPassengers({offerId})`.
- [x] 2. **DONE 2026-08-10. User app — params support + the exact ride.**
  Widen `NotificationTarget` to `{ screen, params? }` (mirroring the driver app's shape, which
  already has it), add the same `parseOfferId` guard, and route
  `join_confirmed` · `join_rejected` · `driver_arrived` · `driver_10min_away` ·
  `offer_cancelled_by_driver` → `OfferDetails({ offerId })`, **falling back to `MyBookings` when the
  id is missing or malformed**.
  ⚠️ `driver_join_request` / `driver_request_cancelled` stay on `MyPassengerOffers` — see the trap
  above. Leave a comment saying why, and pointing at T-024.
  ⚠️ **`driver_10min_away` is LIVE** (`OfferPassengerService:771`) — an earlier grep missed it
  because `[a-z_]` does not match the digits in `10min`. It is already routed; keep it.
  ⚠️ **Both `navigate()` call sites had to change too** — `goOrPark` and `flushPendingNotification`
  passed only `target.screen`, so params would have been silently dropped on the parked (cold-start)
  path even after the mapper produced them.
  ⚠️ **The module's header comment said "every destination is a param-less route"** — now false.
  Corrected rather than left: a stale comment is exactly what caused T-042's crash.
- [x] 3. **DONE 2026-08-10. Both mappers are structurally identical.** Verified by diffing the two
  files with comments stripped: the **only** differences are the route tables themselves, which must
  differ (different apps, different audiences). `NotificationTarget`, `parseOfferId`, the
  guarded-id-with-fallback shape, the `default` case and all three exported functions match.
- [x] 4. **DONE 2026-08-10. 72/72, and the suite is proven able to fail.**
  `tsc`: user **11** · driver **35** — both exactly at their current baselines, zero errors in
  either touched file. **72/72 runtime matrix** driving **both apps' real transpiled modules**
  through the exported `handleNotificationTap` with a recording navigation ref (so it exercises the
  real routing + `goOrPark` path, not a copy of the table): all **13** API types land on their exact
  destination; **every destination is asserted against the route names PARSED FROM each app's
  `MainNavigator` source**, so renaming a route fails the check instead of passing silently;
  6 hostile payloads per app (missing/null `data`, unknown type, `type` as a number and as an
  object) never throw and never invent a route; 7 bad `offer_id` forms per id-carrying type degrade
  to the list with **no params at all** rather than NaN; and a good id arrives as a **number**, not
  a string.
  🔴 **Proven to fail against the pre-change code: 11 checks red** when the two files are stashed —
  it reproduces the actual gap rather than merely agreeing with the new table.
  ✅ The trap is pinned explicitly: `driver_join_request` / `driver_request_cancelled` must **not**
  reach `OfferDetails` and must carry **no** `offerId`.
  Script: `scratchpad/t044-routing-check.js` (+ `t044-rn-stub.js`).
- [x] 5. **DONE 2026-08-11 — OWNER DEVICE-CONFIRMED.** Both apps rebuilt; a tapped push opens the
  exact screen. Owner: *"push opens exactly page thats solved"*.
- [x] 6. **DONE 2026-08-11 — committed by the owner as `55718f6` "push navigation".**
  ⚠️ **Not kept separate as the plan asked** — `55718f6` carries **T-044 and T-042 together**, plus
  `.claude/settings.json` swept in for the **4th** time (see T-036/T-040/T-033). Harmless here
  (both were device-confirmed in the same session) but recorded so the history is not misread later.

## 🟢 T-044 CLOSED 2026-08-11 — device-confirmed, committed `55718f6`.

## Files to touch
- `driver-app-standalone/utils/notificationRouting.ts` — the 4 stale destinations
- `user-app-standalone/utils/notificationRouting.ts` — params support + exact ride
- ❌ **No API change, no migration, no deploy** (owner's scope decision).
- ❌ **Do not touch** `App.tsx`, `RootNavigator.tsx` or `PushService.ts` in either app — the
  plumbing already works and is out of scope.

## Risks / open questions (READ before coding)
- 🔴 **The `offer_id` ambiguity above is the whole risk of this card.** Getting it wrong opens a
  stranger's trip, or a 404, in the user's own booking screen. Re-read the trap section.
- ⚠️ **Do not "improve" the parking/flush logic.** It is correct and already handles cold start,
  background and pre-auth. Changing it risks the one part that demonstrably works.
- ⚠️ Unknown types must keep falling through to `Notifications` — a build that has never heard of a
  future type must not crash.
- ⚠️ Both apps carry near-identical code; every change is considered for both.
- ⚠️ **T-042 is uncommitted in this tree** (driver app: crash fix, layout, re-join status).
  Keep this card's commit separate.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).

## Session notes (one line per work session)
- **2026-08-10** — card opened. Plumbing confirmed complete in both apps (not the problem); the gap
  is the destination table. Found the driver app's stale T-023/T-024 comment (those screens now
  exist, built by T-037), the user app's total lack of params, and the **`offer_id` means two
  different entities** trap. Scope set by the owner to push-taps-only. **Awaiting approval.**
- **2026-08-10 (approved, steps 1-4 done)** — both mappers updated and verified 72/72, with 11 red
  proven against the pre-change code. Two things were bigger than the plan assumed: **both
  `navigate()` call sites** dropped params (so the cold-start parked path would have lost them even
  once the mapper was right), and the user module's header comment **asserted "param-less"**, which
  the change falsified — corrected on the spot, since a stale comment is what caused T-042.
- **2026-08-11 (CLOSED)** — owner device-confirmed: a tapped push opens the exact screen in both
  apps, and the T-042 details crash is gone. Committed `55718f6`. ⚠️ T-044 and T-042 went in as
  **one** commit despite the plan asking for two, with `.claude/settings.json` swept in again (4th
  time) — no harm done, both were confirmed together, but recorded so history reads honestly.

## Resume point (for the next chat)
🟢 **T-044 IS CLOSED — 2026-08-11, device-confirmed, committed `55718f6`. Nothing remains here.**
**There is NO active task. Pick the next card from `docs/TODO.md` (Now / Next).**

Closed in the same device test: **T-042** — the owner confirmed the details crash is gone
(*"opening a passenger order detail's crash also solved"*).
⚠️ **T-037 is NOT closed:** its crash is fixed, but the **join sheet** and **`MyJoinRequestsScreen`**
have still never been opened on a device, so their never-executed code remains unproven.

<details><summary>Historical: what steps 1-4 delivered</summary>

Every push type that has a real destination now opens it, in both apps:
- **Driver** — `passenger_join_request`/`passenger_cancelled` → `OfferPassengers({offerId})`
  (already exact); the 4 outcome types → **`MyJoinRequests`**, which T-037 built and a **stale
  comment** had been hiding.
- **User** — the 5 booking types → **`OfferDetails({offerId})`**, the actual ride.
  `driver_join_request`/`driver_request_cancelled` deliberately stay on `MyPassengerOffers`
  (their `offer_id` is a **PassengerOffer**; `OfferDetails` fetches a **DriverOffer**) → **T-024**.

🛑 No API deploy was needed — app-side only.

</details>

**Baselines:** API **282** · admin **0** · user **11** · driver **35**.
