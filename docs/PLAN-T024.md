# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-046 CLOSED** → `docs/PLAN-T046.md`. ✅ **T-044 CLOSED** → `docs/PLAN-T044.md`.
> ✅ **T-042 · T-041 · T-038 · T-048 · T-052 · T-053 CLOSED.**
> 🔴 **T-047 PARKED BY THE OWNER** — killed-app push tap still opens the main menu. Fix #1 is
> committed and verified but was **not the whole cause**; needs a `logcat` line before more code.
> ⏸️ **T-040** → `docs/PLAN-T040.md`. ⏸️ **T-039** → `docs/PLAN-T039.md`.
> ⏸️ **T-037** → `docs/PLAN-T037.md`. Join sheet + `MyJoinRequests` still never opened on a device.
> ⏸️ **T-031/T-033/T-030/T-027/T-018/T-026A/T-025** → their own `docs/PLAN-T0*.md`.

## Task
- **ID / name:** T-024 — the passenger's "drivers who offered" screen
- **Goal (definition of "done"):**
  1. A passenger can see every driver who offered on their ride request — name, vehicle, price,
     seats, and the driver's message.
  2. They can **accept** one or **reject** any, from that screen.
  3. Accepting warns first that it **permanently declines everyone else**.
  4. A `driver_join_request` push opens **this** screen, closing the compromise T-044 had to make.
  5. `tsc` at baselines: API **282** · admin **0** · user **9** · driver **35**.
- **Why now:** the last hole in the passenger↔driver loop. `MyPassengerOffersScreen:489` tells the
  passenger *"N drivers interested"* **with nothing to tap** — they are told drivers arrived and
  cannot answer them. It also blocks **T-044**: `driver_join_request` has no exact destination, so
  it deliberately lands on the list instead.

## What already exists — do NOT rebuild it (all verified 2026-08-11)
✅ **The API is complete, guarded and reviewed. No server work, no migration, no deploy.**
- `GET /passenger/offers/:offerId/drivers` → `OfferDriverService.getOfferDrivers`
- `POST /passenger/drivers/:id/confirm` → `confirmDriver`
- `POST /passenger/drivers/:id/reject` → `rejectDriver`
- Guards confirmed in code: **404** unknown join · **403** not the offer owner · **400** if the join
  is not `pending` · **400** if the offer is not `published`.
- ✅ **Confirm has real side effects, already implemented server-side:** the offer moves to
  `driver_found`, and `rejectRemainingDrivers` closes out **every other pending driver** with
  `rejection_reason: 'another_driver_chosen'` and pushes each of them **in their own language**.
✅ **The app's API client is complete** — `getOfferDrivers`, `confirmDriver`, `rejectDriver` in
`user-app-standalone/api/passengerOffers.ts` (:445, :482, :517). ❌ **All three have zero call sites.**
✅ **The payload shape was verified against the service, not trusted from the type** (the T-042
lesson): the includes really are aliased **`driver`** and **`vehicle`**, matching `OfferDriver`.
So `driver.display_name` and `vehicle.make/model/color/license_plate` are safe to read.

## Owner decisions (2026-08-11)
1. **Entry point = the existing driver-count row** on the offer card (`MyPassengerOffersScreen:489`)
   becomes tappable. That text is exactly what is a dead end today, so this fixes the reported gap
   at its site rather than adding a competing button.
2. **Accepting shows a confirm dialog naming the consequence** — it declines the other N drivers and
   **cannot be undone**. Matches how edit/cancel already warn on this screen.

## Steps
- [x] 1. **DONE 2026-08-11. `OfferDriversScreen`** — registered as a route in `MainNavigator` and
  typed in `MainStackParamList` as `{ offerId: number }`. Renders name, vehicle
  (make/model/colour/plate), seats, price per seat + total, the driver's message and a status badge,
  with loading / empty / error states.
  🔴 **`driverNameOf()` added to `api/passengerOffers.ts`** rather than reading the name inline —
  `driver` is optional and carries `display_name`/`first_name`/`last_name`, **never `name`**. This is
  the exact read that crashed the driver app to the launcher in T-042, so the helper exists to make
  the mistake impossible, not to be tidy. It takes a **translated** fallback.
- [x] 2. **DONE 2026-08-11. The driver-count row is now the entry point.** The `driverCount > 0`
  guard was already there, so the row only becomes tappable when there is someone to show. Added a
  chevron (and `flex: 1` on the label so it pins right) to signal it. `stopPropagation` kept — the
  card underneath has its own `onPress`.
- [x] 3. **DONE 2026-08-11. Accept / reject.** Reject on any `pending` row; accept behind a dialog
  that **names how many other drivers will be declined** and says it cannot be undone.
  ⚠️ **A single `busyId` disables every action while one is in flight** — a double tap would fire two
  confirms, and the second returns 400 "already processed", surfacing as an error *after* a success.
  ⚠️ **Both failure paths reload the list**: a 400/404 usually means the offer moved on while the
  screen was open, so showing the truth beats leaving a stale row.
- [x] 4. **DONE 2026-08-11. The push now opens this screen** — `driver_join_request` /
  `driver_request_cancelled` → `OfferDrivers({ offerId })`, closing the compromise T-044 documented.
  ✅ The module's header comment was updated too: the rule is **not** "never pass `offer_id`" but
  "the id and the screen must agree about which entity they mean". A malformed id still falls back to
  `MyPassengerOffers` with no params.
- [x] 5. **DONE 2026-08-11. i18n** — 22 keys × uz/ru/en, including the 4 dynamic `status_*` keys.
  ⚠️ **My first insertion produced a broken `uz.ts`** (unescaped apostrophes in `bo'lmadi`/`yo'q`
  terminated the strings), which showed up as 20 syntax errors. Fixed by switching those five to
  double quotes, matching the file's existing style.
- [x] 6. **DONE 2026-08-11. 136/136, proven able to fail — 104 red.**
  `tsc` user **9 = baseline**, zero errors in any new or touched file.
  🔴 **A real bug was caught here, not by the suite but by `tsc`:** I had copied
  `getErrorMessage(error, t('key'))` from `MyPassengerOffersScreen` — but the second parameter is the
  **`t` function**, not a fallback string. The existing screen has been calling it wrong all along
  (that is 2 of the 9 baseline errors); I reproduced the bug by imitation and then fixed mine to
  `getErrorMessage(error, t, t('key'))`. **Copying a neighbouring line copies its bugs.**
  The suite drives the **real transpiled modules**: `driverNameOf` against 12 payload shapes
  including every T-042 crash shape; the push mapper via the exported `handleNotificationTap` with
  the destination asserted against route names **parsed from `MainNavigator`** (so a renamed route
  fails); 7 malformed ids degrading to the list with **no params**; the booking notifications proven
  undisturbed; and all 22 keys **evaluated** in three locales with their `{name}`/`{count}`
  placeholders verified intact.
- [ ] 7. Owner: rebuild the user app, walk passenger→driver→accept end to end.
- [ ] 8. Commit (only after the owner's approval).

## Files to touch
- **NEW** `user-app-standalone/screens/OfferDriversScreen.tsx`
- `user-app-standalone/navigation/MainNavigator.tsx` — 1 route
- `user-app-standalone/navigation/types.ts` — `MainStackParamList` entry
- `user-app-standalone/screens/MyPassengerOffersScreen.tsx` — tappable count
- `user-app-standalone/utils/notificationRouting.ts` — 2 push types
- `user-app-standalone/translations/{uz,ru,en}.ts` — all three, always
- ❌ **No API change, no migration, no deploy.** ❌ **Driver app untouched.**

## Risks / open questions (READ before coding)
- 🔴 **Accept is irreversible and affects other people.** It rejects every other pending driver and
  pushes them. The dialog is not politeness — it is the only warning before an unrecoverable action.
- 🔴 **Do not read `.driver.name` bare.** `OfferDriver.driver` is **optional** and carries
  `display_name`/`first_name`/`last_name`, not `name`. A bare read is precisely what crashed the
  driver app to the launcher in **T-042**. Use a helper with a fallback string.
- ⚠️ **`MainStackParamList` lists only 3 of 9 routes** (T-028), so screens navigate via
  `(navigation as any)`. Add the new route properly; do **not** fix the other 6 here.
- ⚠️ **A stale list is likely** — the passenger may sit on this screen while a driver cancels.
  Pull-to-refresh, and treat a 400/404 on accept as "this offer moved on", not a crash.
- ⚠️ **This screen shows rival drivers' names, plates and prices to the passenger.** That is correct
  (they are bidding *for* this passenger) and is the mirror of the **driver-side** rule that a driver
  may not see rival bids. Do not "reuse" this screen for drivers.
- ⚠️ **T-051 just changed `MyPassengerOffersScreen`** (fetch-once + client-side filter). Build on
  that, do not revert it.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).

## Session notes (one line per work session)
- **2026-08-11** — card opened after T-053. Grounded first: the API is **complete and guarded**, the
  client functions exist with **zero call sites**, and the payload aliases (`driver`/`vehicle`) were
  checked **against the service** rather than trusted from the type. Owner chose the tappable count
  and the warning dialog. **Awaiting approval.**

## Resume point (for the next chat)
**Steps 1-6 DONE 2026-08-11. Only step 7 (owner: rebuild the user app and walk the loop) and step 8
(commit) remain.**

**The loop is now closed end to end:** a driver offers on a passenger's request → the passenger gets
a push → tapping it opens **`OfferDrivers`** (not a list) → they see name, vehicle, seats, price and
message → **Choose** or **Decline**.
🔴 **Choosing is irreversible and rejects every other pending driver**, so the dialog names the
count. That cascade is the server's, already built; the app only warns about it.

**The one thing to retest carefully:** accept with **two or more** drivers waiting, and confirm the
losers really are closed out (the dialog's count must match what happens).

🛑 **No API deploy, no migration.** User app rebuild only; the driver app was not touched.
**Baselines:** API **282** · admin **0** · user **9** · driver **35**.
