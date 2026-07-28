# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **Parked (implemented, awaiting owner device test):**
> - T-011 (OR-001 OTP resume) — both apps · T-012 (OR-002 deleted-user logout) — App + API
> - T-014 (OR-004 country in city text) · T-015 (OR-005 own number as extra phone) — user app
> - ✅ Their code **is committed** (`5b315a6`) — the older "uncommitted" note was stale.

## Task
- **ID / name:** T-016 (owner request OR-006) — a half-finished registration must **resume on the
  registration screen**, not drop the passenger into the main menu. (user app + API)
- **Goal (definition of "done"):** Passenger verifies the OTP, does **not** submit the profile form,
  then kills / restarts the app. On relaunch the app opens **UserDetails (registration)**, not the
  main menu — verified on a device. Fully-registered users are unaffected (still land on Home).
- **Why now:** Owner request OR-006, reported 2026-07-27. A half-registered passenger currently
  gets into the app with no name/gender at all, which also pollutes offers and the admin panel.

## Root cause (already traced in code — 2026-07-27)
1. `POST /auth/verify-otp` **does** return `profile_complete` → straight after the code is entered
   `RootNavigator` correctly shows `ProfileCompletionNavigator`. So the bug is not there.
2. **`GET /auth/me` never returns `profile_complete`** — neither in its Sequelize `attributes`
   nor in the JSON body ([AuthController.v2.ts:536-558](api,admin,db/apps/api/src/controllers/AuthController.v2.ts#L536-L558)).
3. On every cold start `initializeAuth()` **replaces** the cached user with that reply
   ([AuthContext.tsx:101](user-app-standalone/contexts/AuthContext.tsx#L101)) → the flag is gone.
4. `RootNavigator` routes on `profile_complete !== false`
   ([RootNavigator.tsx:43](user-app-standalone/navigation/RootNavigator.tsx#L43)) →
   `undefined !== false` = **true** → `MainNavigator` = the main menu. 💥

So it is an **API omission** amplified by two app-side defaults ("unknown ⇒ complete", and a
destructive cache overwrite). Fix the API; harden the app so a missing field can never re-route.

## Approach
Server-side truth first, app-side defence second — smallest change that removes the whole class of
bug, no new dependency, no schema change, no migration.
- API: make `/auth/me` return the same profile shape the rest of the app already relies on.
- App: **merge** the server user over the cached one instead of overwriting it, so any field the
  server omits keeps its known value instead of silently becoming `undefined`.
- App: stop `UserDetailsScreen` from forcing `profile_complete: true` locally — trust the server,
  otherwise the app can strand a user inside the app with an incomplete profile (same bug class).

## Steps
- [x] 1. **API** — ✅ `getCurrentUser` (`/auth/me`) now selects and returns `profile_complete`
  (defaulted to `false`) plus `first_name`, `last_name`, `father_name`, `gender`, `birth_date`,
  `additional_phones`. Purely additive; no route/DB change.
  **Also fixed `UserController.updateProfile`:** it set `profile_complete` from
  `email && … && birth_date`, fields the sign-up form treats as OPTIONAL, then silently corrected
  itself two lines later. Now one honest check — `first_name && last_name && gender`, computed from
  the saved record so a partial PUT can't undo it. Behaviour is equivalent; the meaning is now
  single. This mattered once the app started trusting the flag (step 4).
- [x] 2. **App** — ✅ `AuthContext.initializeAuth()` merges `{ ...storedUser, ...serverUser }`
  instead of replacing. The blocked and active branches were byte-identical, so they collapsed into
  one path. A field the API omits can no longer erase a known value.
- [x] 3. **App** — ✅ `RootNavigator` routes on an explicit boolean: `profile_complete` when it is
  a real boolean, otherwise a fallback to `first_name || display_name`. **`display_name` is in the
  fallback deliberately** — the *old* `/auth/me` sends it but not `first_name`, so without it a
  new app build hitting a not-yet-deployed API would have thrown *registered* users onto the
  sign-up form. Fully-registered users are unaffected either way.
- [x] 4. **App** — ✅ `UserDetailsScreen.handleSubmit()` uses the server's returned
  `profile_complete` instead of hard-coding `true`. If the server says `false`, the user stays on
  the form with a warning (`userDetails.errorIncompleteSaved`, added to uz/en/ru) and the draft is
  kept. Only a real `true` clears the draft and lets `RootNavigator` move on.
- [x] 5. **App** — ✅ new `utils/registrationDraft.ts` (mirrors `utils/pendingOtp.ts`): saves the
  typed fields debounced 400 ms, restores them on mount, 7-day TTL. Cleared on successful submit,
  on logout, and on the OR-002 deleted-account path. **Tagged with the phone number** and dropped
  if a *different* phone is registering, so one person's draft can never appear in another's form.
- [x] 6. **Static verification** — ✅ `npx tsc --noEmit`: user app **12 errors = baseline**, API
  **290 = baseline**, none in any touched file. `npm run lint` is broken repo-wide (ESLint 9 with no
  flat config) — pre-existing, unrelated, not caused by this task.
- [ ] 7. **Owner** — deploy the API to test3, then device-test: verify OTP → close the app from
  recents → reopen → must land on the registration form, **with the typed fields still there**.
  Then finish registration → reopen → must land on Home.

## Files actually touched (all uncommitted)
- `api,admin,db/apps/api/src/controllers/AuthController.v2.ts` — `getCurrentUser` only
- `api,admin,db/apps/api/src/controllers/UserController.ts` — `updateProfile` completeness rule
- `user-app-standalone/contexts/AuthContext.tsx` — `initializeAuth` merge + draft cleared on
  logout and on the deleted-account path
- `user-app-standalone/navigation/RootNavigator.tsx` — profile-complete decision
- `user-app-standalone/screens/UserDetailsScreen.tsx` — draft load/save + trust the server
- `user-app-standalone/utils/registrationDraft.ts` — **NEW**
- `user-app-standalone/translations/{uz,en,ru}.ts` — `userDetails.errorIncompleteSaved`

## Risks / open questions (READ before coding)
- ✅ **ANSWERED 2026-07-27:** "resume from the registration point" means **both** — open the
  registration screen *and* keep the fields already typed. Step 5 is therefore in scope.
- ⚠️ **Deploy order.** The API fix must reach test3 **before** the app build is tested, otherwise
  step 3 is doing all the work alone. Steps 2+3 are written so an old API still behaves correctly.
- ⚠️ **Merge instead of replace (step 2)** has a cost: a field the server *deliberately* clears
  (e.g. email removed by an admin) would keep the stale cached value until the next login. Accepted
  — the alternative is today's bug. Status/blocked handling is unaffected (`status` is always sent).
- ⚠️ **Don't over-tighten step 3.** Flipping the default to "unknown ⇒ incomplete" would trap
  *existing, fully-registered* users on the registration form if any endpoint omits the flag. The
  check must key off data that is present.
- **Driver app is out of scope** (owner said "yolovchi" = passenger). Its `RootNavigator` uses a
  different `checkDriverProfile` path — worth a separate look later, not now.
- No DB schema change, no migration, no new dependency → CLAUDE.md rule 4 is not triggered.
- Environment: Avast still breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"` for npm,
  `GRADLE_OPTS` truststore for Gradle, `git -c http.sslCAInfo=...` for push).

## Session notes (one line per work session)
- 2026-07-27: Task created; root cause traced end-to-end in code before writing the plan.
- 2026-07-27 (2): **Steps 1-6 DONE** — API `/auth/me` now returns `profile_complete`; app merges
  instead of overwriting the cached user; `RootNavigator` decides from present data; submit trusts
  the server; registration draft persisted + phone-tagged. tsc at baseline in both projects.
  Not run on a device; API not deployed. Uncommitted.

## Resume point (for the next chat)
**All Claude-side work (steps 1-6) is implemented; only step 7 — owner deploy + device test —
remains.** Verification so far is **static only**: `tsc` at baseline (12 app / 290 API) and code
reading. Nothing has been run on a device, and the API fix is **not deployed to test3**, so the
old `/auth/me` is still live and the bug still reproduces until it is.

**Owner's next actions:** (1) deploy the API to test3, (2) build the user app, (3) verify OTP →
kill the app from recents → reopen → must land on the registration form with the typed fields
still filled, (4) finish registration → reopen → must land on Home.

⚠️ **Uncommitted on disk:** only this task's changes (T-014/T-015 landed in `5b315a6`).
Commit still needs owner approval (CLAUDE.md rule).
⚠️ Environment: Avast still breaks npm/Gradle/git TLS — `$env:NODE_OPTIONS="--use-system-ca"` for
npm, `GRADLE_OPTS` truststore for Gradle, `git -c http.sslCAInfo=<bundle>` for push.

## 📌 For the NEXT CHAT — read this first
**State (2026-07-27):** T-016 / OR-006 — **code complete, unverified, uncommitted, undeployed.**
Steps 1-6 done; **step 7 (owner deploy + device test) is the only thing left.**

**First three things to do in the new chat:**
1. **Ask whether the API was deployed to test3 and whether the device test passed.**
   - Passed → tick step 7, mark T-016 done on the board, OR-006 ✅, then `/end-day` or `/new-task`.
   - Failed → the debug order is: (a) `adb logcat` for `RootNavigator: Auth state:` and the
     `Profile incomplete` / `Profile complete` line — it prints which navigator was chosen;
     (b) curl `/auth/me` with a real token and check `profile_complete` is in the JSON;
     (c) only then look at the app.
2. **Offer the commit** (still needs approval — 13 files):
   `fix(auth): resume half-finished registration instead of the main menu (OR-006)`
3. If the owner wants new work instead, the board's remaining cards are the four parked
   device-test confirmations (T-011/T-012/T-014/T-015) or fresh work **T-001** (passenger→offer
   join flow) / **T-002** (driver offer wizard).

**Do NOT re-investigate the root cause** — it is fully written up in the "Root cause" section
above and in `docs/OWNER_REQUESTS.md` (OR-006). **Do not repeat the static verification** unless
files changed: `tsc` was at baseline (user app 12 / API 290) after the last edit.

**Two things that look like bugs but are deliberate** (don't "fix" them):
- `RootNavigator`'s fallback accepts `display_name`, not only `first_name` — see step 3.
- `AuthContext` merges rather than replaces the cached user — see the Risks section.

**Known blind spot:** the driver app was left out of scope, but it consumes the same `/auth/me`
and has its own `RootNavigator` + `checkDriverProfile`. It may have the same class of bug. Worth a
card if the owner reports it.
