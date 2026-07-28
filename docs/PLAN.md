# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **Parked (implemented, awaiting owner device test):**
> - T-011 (OR-001 OTP resume) — both apps · T-012 (OR-002 deleted-user logout) — App + API
> - T-014 (OR-004 country in city text) · T-015 (OR-005 own number as extra phone) — user app
> - T-016 (OR-006 resume half-finished registration) — user app + API. **Steps 1-6 done and
>   committed by the owner as `2a76e12`; only the API deploy + device test remain.** Full write-up
>   in `docs/OWNER_REQUESTS.md` (OR-006) and in this file's git history (`docs/PLAN.md@2a76e12`).
>   Owner actions: deploy API to test3 → verify OTP → kill app → reopen → must land on the
>   registration form with typed fields intact → finish → reopen → must land on Home.

## Task
- **ID / name:** T-017 — **driver app: infinite profile-check loop after OTP login.**
  The app flips between the splash screen and the registration screen many times and hammers
  `/auth/me` + the driver-status endpoint until the server rate-limits it.
- **Goal (definition of "done"):** After entering the OTP, the driver app checks the driver
  profile **exactly once**, shows the registration screen, and stays there. Finishing the last
  registration step still switches to `MainNavigator` immediately.
- **Why now:** Reported from a live device log on 2026-07-28. It is the blind spot T-016 flagged
  ("driver app has its own `RootNavigator` + `checkDriverProfile`, may have the same class of bug").
  It burns battery and API quota and can lock a driver out via rate-limiting.

## Root cause (traced in code — 2026-07-28, confirmed against the device log)
A render-identity feedback loop between `AuthContext` and `RootNavigator`:

1. OTP verify → `LOGIN` → [RootNavigator.tsx:108-117](driver-app-standalone/navigation/RootNavigator.tsx#L108-L117)
   fires `checkDriverProfile()` → `setCheckingProfile(true)` → **splash**.
2. `checkDriverProfile` fetches `/auth/me` and calls `updateUser(serverUser)`
   ([RootNavigator.tsx:69](driver-app-standalone/navigation/RootNavigator.tsx#L69)). `serverUser` is a
   **freshly parsed object every time**, so `UPDATE_USER` always yields new state even when nothing
   changed.
3. `AuthProvider` re-renders. `logout`, `updateUser` and the whole `value` object are plain inline
   definitions → **new identities on every render**.
4. `checkDriverProfile` is `useCallback(…, [isAuthenticated, token, logout, updateUser])` → its
   identity changes too.
5. The second effect ([RootNavigator.tsx:120-130](driver-app-standalone/navigation/RootNavigator.tsx#L120-L130))
   lists `checkDriverProfile` in its deps and calls it whenever `profile_complete === true` →
   **back to step 2.** Two API calls and one splash flash per iteration.

**Why it did not stop on its own:** it only stopped when the API answered with a non-JSON body
(`JSON Parse error: Unexpected character: T` — a rate-limit page), which skipped `updateUser` and
broke the state change.

**Why `profile_complete === true` while the driver profile is incomplete:** that flag lives on the
**user** record (`first_name && last_name && gender`, T-016 step 1). The **driver** profile is a
separate record. A driver can legitimately have `profile_complete: true` and an empty driver
profile — which is exactly this account (id 13). So effect 5 is not just looping, it is watching
the **wrong signal**.

## Approach
Fix the identity churn at the source, then remove the wrong signal and replace it with an explicit
one. No new dependency, no schema change, no API change — driver app only.
- `AuthContext`: memoize the methods and the context value so consumers stop seeing new function
  identities on every state change. This is standard React context hygiene and is **load-bearing**
  for the fix.
- `RootNavigator`: re-check on **auth identity** (`isAuthenticated`/`token`/`user.id`) only — never
  on anything derived from the user object the check itself writes.
- Replace the `profile_complete` side-channel with an explicit "a registration step was saved"
  event, so finishing registration still switches navigators.
- Add an in-flight guard as a second line of defence.

## Steps
- [x] 1. ✅ **New** `driver-app-standalone/utils/driverProfileEvents.ts` — module-level pub/sub
  (`notifyDriverProfileChanged` / `subscribeDriverProfileChanged`), in the style of
  `utils/pendingOtp.ts`. ~40 lines, no dependency; a throwing listener can't break the emitter.
- [x] 2. ✅ **`contexts/AuthContext.tsx`** — all nine methods wrapped in `useCallback` with **no
  state deps**, `value` wrapped in `useMemo` (so it changes only when `state` does). `logout` moved
  to the top of the component (the `AppState` effect depends on it) and reads the token from the
  new `stateRef` instead of a closure. The `AppState` effect's deps were `[state.isAuthenticated,
  state.token, state]` — the whole `state` object — which re-registered the OS listener on every
  state change; now `[logout]` + `stateRef.current`, which also gives the handler *fresher* state
  than the old closure did. A load-bearing comment sits above `value`.
- [x] 3. ✅ **`navigation/RootNavigator.tsx`** — the two effects are now one, keyed on
  `isAuthenticated`/`token`/`user?.id`; the `profile_complete` watcher is gone; a second effect
  subscribes to the step-1 event; `checkInFlightRef` guards re-entry; dead `refreshTrigger` state
  deleted. The `!isAuthenticated` branch now also resets `driverProfileComplete` (it previously
  kept the last value across a logout).
- [x] 4. ✅ **`screens/DriverTaxiLicenseScreen.tsx`** — the completion path calls
  `notifyDriverProfileChanged()`. `updateUser({ profile_complete: true })` is kept (it is a real
  flag other code reads) but is no longer the navigation trigger.
- [x] 5. ✅ **Static verification** — `npx tsc --noEmit` on the driver app: **41 errors before, 41
  after, identical set** (compared with line numbers normalised, against a `git stash` of exactly
  these files). All 41 are pre-existing and unrelated (missing `User` export, `api/geo`, duplicate
  translation keys, un-awaited `getHeaders`…). `npm run lint` is still broken repo-wide (ESLint 9,
  no flat config) — pre-existing, unrelated.
- [ ] 6. **Owner** — device test: enter OTP → the log must show `Checking driver profile status…`
  **once**, no splash flicker, and the registration screen must stay put. Then finish registration
  through the taxi-license step → must land on the main menu.

## Files to touch
- `driver-app-standalone/utils/driverProfileEvents.ts` — **NEW**
- `driver-app-standalone/contexts/AuthContext.tsx`
- `driver-app-standalone/navigation/RootNavigator.tsx`
- `driver-app-standalone/screens/DriverTaxiLicenseScreen.tsx`

## Risks / open questions (READ before coding)
- ⚠️ **The memoization in step 2 is load-bearing, not cosmetic.** If a later edit un-memoizes
  `logout`/`updateUser`, `checkDriverProfile`'s identity churns again and the loop can return. The
  in-flight guard limits the damage but does not stop a sequential loop. Comment it in the code.
- ⚠️ **Do not keep `profile_complete` in the effect deps "just in case."** It is the user-record
  flag, already `true` for incomplete drivers — that is what made the loop fire forever.
- ⚠️ **Regression to watch:** the taxi-license screen used to switch navigators purely as a
  side-effect of the loop. Step 4 is what preserves that behaviour — if it is skipped, a driver who
  finishes registration stays stuck on the registration stack.
- `DriverPersonalInfoScreen.checkRegistrationStatus` also calls `getDriverProfileStatus` on mount;
  that is a read-only "which step am I on" check, not a completion signal — leave it alone. Its
  repeated log lines in the device trace are a *symptom* (the stack remounted each splash flip),
  not a second cause.
- User app is **out of scope** — its `RootNavigator` uses a different, simpler decision path with
  no `updateUser` call inside it, so it cannot form this loop.
- No DB schema change, no migration, no new dependency → CLAUDE.md rule 4 is not triggered.
- Environment: Avast still breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"` for npm,
  `GRADLE_OPTS` truststore for Gradle, `git -c http.sslCAInfo=...` for push).

## Session notes (one line per work session)
- 2026-07-28: Task created from a device log; root cause traced end-to-end before writing the plan.
- 2026-07-28 (2): **Steps 1-5 DONE.** Identity churn killed at the source (`AuthContext` memoized),
  the `profile_complete` watcher replaced by an explicit event, in-flight guard added. tsc at
  baseline (41 = 41, identical set). Not run on a device. Uncommitted.

## Resume point (for the next chat)
**All Claude-side work (steps 1-5) is implemented; only step 6 — the owner device test — remains.**
Verification is **static only**: `tsc` at baseline (41 = 41, identical error set) plus code
reading. Nothing has been run on a device.

**Owner's next actions:** rebuild the driver app (`npm run android` in `driver-app-standalone`) and
watch the Metro log while entering the OTP.
- ✅ Pass: `RootNavigator: Checking driver profile status...` appears **once**, `Showing splash
  screen` does not flicker, and the registration screen stays put.
- ✅ Also pass: finish registration through the taxi-license step → lands on the main menu.
- ❌ Fail (still looping): check that nothing new was added to `AuthContext` without `useCallback`,
  and that no dep array in `RootNavigator` reads from the `user` object.

⚠️ **Uncommitted on disk:** the four T-017 files (T-016 landed in `2a76e12`). Commit needs owner
approval (CLAUDE.md rule 6). Proposed message:
`fix(driver): stop the infinite driver-profile check loop after OTP login (T-017)`

## 📌 For the NEXT CHAT — read this first
**State (2026-07-28):** T-017 — **code complete, unverified on device, uncommitted.**

**Do NOT re-investigate the root cause** — it is written up in full in the "Root cause" section
above. **Do not repeat the static verification** unless files changed.

**Three things that look like bugs but are deliberate** (don't "fix" them):
- `AuthContext`'s `useMemo`/`useCallback` are load-bearing, not style — see the Risks section.
- `RootNavigator` deliberately does **not** watch `user.profile_complete`. That was the loop.
- `DriverPersonalInfoScreen` still calls `getDriverProfileStatus` on mount — that is a "which step
  am I on" check, unrelated to the navigator decision.
