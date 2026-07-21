# 📔 JOURNAL — daily diary (newest on top)

> Claude writes ONE entry per `/end-day`. Keep entries short — this is for a
> human to quickly remember what happened, not a full report.

---

## 2026-07-21 (3) — OR-002 / T-012 deleted-user logout
- **Task:** Owner security bug OR-002 — deleted passenger/driver still gets into the app
- **Done:** Full fix (App + API). API `authenticate` middleware now verifies the user still
  exists (401 if deleted). Both apps attach the HTTP status from `/auth/me` and, on 401/403/404,
  clear the cache and return to the login/OTP screen (driver also on foreground). Kept cache
  fallback for network errors (offline). `tsc`: no new errors (backend 290 = same as HEAD).
- **Decisions:** App + API (owner-approved). Blocked/pending_delete stay on BlockedScreen; only
  deleted → login. DB errors pass through (no false-logout on outage).
- **Problems:** Backend has a big pre-existing `tsc` backlog (290 errors) — runs on tsx in dev;
  out of scope. User app has no foreground-refresh handler (reopen path covers it).
- **Next:** Owner device test (login → admin delete → reopen → login); then commit.
- **Commit:** proposed `fix(auth): log out deleted users + reject deleted tokens (OR-002)`

---

## 2026-07-21 (2) — OR-001 / T-011 OTP resume
- **Task:** Owner bug OR-001 — OTP screen jumps to main menu after backgrounding
- **Done:** Root-caused (app killed in background + no nav persistence). Implemented a
  targeted fix in BOTH apps: `utils/pendingOtp.ts` + `AuthNavigator` resume-to-OTP +
  save/clear in the OTP screen + clear on logout. `tsc` clean for all changed files.
- **Decisions:** Both apps, targeted persistence (not full nav-state). Deferred the
  splash/NavigationContainer refactor — not needed for this fix.
- **Problems:** Can't run the RN apps headless here; behavior needs a device test.
  ESLint isn't configured in either app (no flat config) — used `tsc` instead.
- **Next:** Owner rebuilds an app and verifies resume; then commit + mark done.
- **Commit:** proposed `fix(otp): resume OTP screen after app is backgrounded (OR-001)`

---

## 2026-07-21
- **Task:** Adopt the project-control-kit (CLAUDE.md + docs/ + slash commands)
- **Done:** Installed `CLAUDE.md`, `docs/` (ARCHITECTURE, TODO, PLAN, JOURNAL), and
  `.claude/commands/` at the repo root, personalized to the real UbexGo stack
  (Express + Sequelize + PostgreSQL; 2 RN apps; admin panel). Seeded T-001 as the
  current task (verify passenger→offer join flow).
- **Decisions:** Backend is Express, not NestJS (spec was aspirational). Kept the kit's
  simple 4-file memory model rather than a heavier vault.
- **Problems:** ~48 scattered `.md` fix-notes and stale `tmp/` duplicates still need
  consolidating — parked as T-004 (Phase 2), needs approval before moving/deleting.
- **Next:** `/start-day`, then T-001 step 1 (audit the join flow).
- **Commit:** `chore: add CLAUDE.md + docs control system`

---

## Entry template (copy for each new day)

## YYYY-MM-DD
- **Task:**
- **Done:**
- **Decisions:**
- **Problems:**
- **Next:**
- **Commit:**
