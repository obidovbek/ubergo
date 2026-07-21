# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **Parked:** T-011 (OR-001 OTP resume) — code done in both apps, awaiting the owner's
> device test. Tracked in `docs/TODO.md` + `docs/OWNER_REQUESTS.md`.

## Task
- **ID / name:** T-012 (owner request OR-002) — deleted user must be logged out to the login screen
- **Goal (definition of "done"):** After an admin deletes a passenger/driver, that person's
  app (on next open or when brought to foreground) detects the account is gone and returns to
  the **login/OTP ("SMS") screen**. And the deleted token stops working on the API immediately.
- **Why now:** Owner-reported security issue; a deleted account keeps full access via cache.
- **Approved:** App + API (full fix).

## Steps
- [x] 1. Owner approval → App + API (full fix). (approved 2026-07-21)
- [x] 2. App `api/auth.ts getCurrentUser` (both apps): attach HTTP status to the thrown error.
- [x] 3. App `AuthContext.initializeAuth` (both apps): on 401/403/404 → clear storage, don't
  log in (→ login/OTP); keep cached-user fallback only for network errors.
- [x] 4. Driver app foreground refresh: on 401/403/404 → `logout()`. (User app has no foreground
  refresh handler; its init path covers the reopen case — noted as possible follow-up.)
- [x] 5. API `middleware/auth.ts`: after `verifyToken`, load the user by id; if missing → 401.
  DB errors pass through as 500 (won't false-logout on an outage). Blocked/pending_delete still
  pass (app shows BlockedScreen). Admin routes use a separate middleware — unaffected.
- [ ] 6. **Owner: test end-to-end** — log in on device → delete that user in the admin panel →
  reopen/foreground the app → it returns to the login/OTP screen. ← **NEXT (owner action)**
- [ ] 7. After test passes: OR-002 → done, move T-012 to Done, journal + commit.

## Files touched
- API: `api,admin,db/apps/api/src/middleware/auth.ts`.
- App (× both apps): `api/auth.ts` (getCurrentUser status), `contexts/AuthContext.tsx`
  (init 401→logout; driver also foreground 401→logout).

## Verification so far
- `tsc`: no NEW errors anywhere. Backend total 290 = identical to HEAD (project has a large
  pre-existing tsc backlog; dev runs on `tsx`, which ignores it). Apps: 41 (driver) / 12 (user),
  unchanged from before. Behaviour still needs the device test (step 6).

## Risks / open questions
- Latency: one DB lookup per authenticated request (owner accepted the trade-off; cache later).
- Offline: init/foreground keep the cached session on network/5xx errors — only 401/403/404 logs out.
- User app has no foreground-refresh handler, so a warm foreground won't re-check until the next
  cold start. Reopen (the common path, esp. given OR-001 kills) is covered. Follow-up if needed.

## Session notes (one line per work session)
- 2026-07-21: Root-caused, documented OR-002/T-012, plan approved (App + API).
- 2026-07-21: Implemented — middleware DB check + both apps drop the cache & go to login on a
  401 (init + driver foreground). tsc clean (no new errors). Awaiting device test.

## Resume point (for the next chat)
Code complete across backend + both apps; typechecks add nothing new. Next action = **step 6**:
owner tests (log in → admin deletes the user → reopen app → lands on login). If it works →
step 7 (commit + mark done). Key files: `middleware/auth.ts`, both apps' `contexts/AuthContext.tsx`
and `api/auth.ts`.
