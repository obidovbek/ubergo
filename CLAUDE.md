# CLAUDE.md — UbexGo Control Center

> Claude Code loads this file automatically at the start of every session.
> Keep it short — the real detail lives in `docs/` and `.claude/commands/`.

## 1. Project

- **Name:** UbexGo
- **What it does:** Passenger–driver ride-sharing platform for Uzbekistan (city & intercity).
  Drivers post ride **offers**; passengers browse and join them; an admin panel moderates.
- **Tech stack:**
  - **Backend API** — Node.js + **Express 4** + TypeScript (ESM), **Sequelize 6** + PostgreSQL,
    JWT auth, Firebase Admin (push), Eskiz (SMS OTP), Google SSO.
  - **Admin panel** — React 19 + Vite + React Router 7 + Zustand.
  - **Driver app** — React Native 0.81 / Expo 54 (`com.obidovbek94.UbexGoDriver`).
  - **User app** — React Native 0.81 / Expo 54.
- **Stage:** MVP in active development.
- **Run commands** (each app has its own folder — see table):

| App | Folder | dev | build | lint |
|---|---|---|---|---|
| API | `api,admin,db/apps/api` | `npm run dev` | `npm run build` | `npm run lint` |
| Admin | `api,admin,db/apps/admin` | `npm run dev` | `npm run build` | `npm run lint` |
| Driver app | `driver-app-standalone` | `npm start` (:8082) | `npm run android` | `npm run lint` |
| User app | `user-app-standalone` | `npm start` (:8081) | `npm run android` | `npm run lint` |

- **DB migrations** (from `api,admin,db/apps/api`): `npm run db:migrate` · undo: `npm run db:migrate:undo` · reset: `npm run db:reset`
- **Tests:** none configured yet. "Working" = the flow runs end-to-end (verify manually).

## 2. Memory files — the real source of truth

The chat is temporary; these files are the permanent memory of the project.
**Read them before working. Update them after working. Never keep important state only in the chat.**

| File | Purpose |
|------|---------|
| `docs/ARCHITECTURE.md` | Visual map (Mermaid) + live status of every component |
| `docs/TODO.md` | Task board: Now / Next / Later / Done |
| `docs/PLAN.md` | Step-by-step plan of the CURRENT task (checkboxes) |
| `docs/JOURNAL.md` | Daily diary: what happened, decisions, problems |

## 3. Commands

Full procedures live in `.claude/commands/` — they appear when typing `/`.
If the developer types the words WITHOUT the slash ("start day", "end day"), follow the same procedure.

| Command | What it does |
|---------|--------------|
| `/start-day` | Read memory files, report where we stopped |
| `/new-task <name>` | Put task on the board → write plan → wait for approval |
| `/next` | Do the next unchecked step in PLAN.md, then stop and report |
| `/overview` | Dashboard: task progress, board, component statuses |
| `/arch` | Sync `docs/ARCHITECTURE.md` (diagrams + statuses) with real code |
| `/end-day` | Update all memory files, write journal entry, propose commit |
| `/check` | Review recent changes for bugs / security / rule violations |

## 4. Working rules

1. **One task at a time.** New ideas go to `docs/TODO.md → Later`, never started immediately.
2. **Small steps.** Every step must leave the project in a working (runnable) state.
3. **Plan first.** No code before the plan in `docs/PLAN.md` is approved by the developer.
4. **Ask before:** deleting files, changing the DB schema / adding a migration, adding a new
   dependency, or touching `api,admin,db/infra/**` or any `.env` / keystore / Firebase key.
5. **Never** write secrets (API keys, passwords, keystores, Firebase JSON) into code or docs. Use env.
6. Prefer simple, boring solutions. Clever tricks need a comment explaining why.
7. Code style: TypeScript, English identifiers, small functions. Match the surrounding file.

## 5. Project gotchas (the ones that actually bite)

- **The backend folder is literally named `api,admin,db`** (with a comma). Quote every path in the
  shell: `cd "api,admin,db/apps/api"`. Globs and tools can choke on the comma.
- **Shell is PowerShell on Windows.** Use PowerShell syntax; forward slashes are fine.
- **API is ESM** (`"type": "module"`) — Sequelize migrations use the **`.cjs`** extension.
- **Two standalone RN apps.** They were split out of the old monorepo (which still lingers, stale,
  under `api,admin,db/tmp/ubergo/`). **Ignore everything under `api,admin,db/tmp/`** — it is dead copies.
- **Push notifications:** Firebase project `ubexgo-ae910`. Tokens are stored **per app**
  (`push_tokens.app = 'user' | 'driver'`) because a driver and passenger share one `user_id`.
  Always query tokens filtered by both `app` and `is_active`.
- **The original full spec (TT, in Uzbek)** lives in `api,admin,db/README.md`. It says "NestJS/monorepo";
  the real build is **Express + standalone apps** — trust the code, not the spec.

## 6. Definition of Done (every task)

- [ ] The flow works end-to-end (run it — no test suite exists yet)
- [ ] All steps in `docs/PLAN.md` checked
- [ ] `docs/TODO.md` and `docs/JOURNAL.md` updated
- [ ] `docs/ARCHITECTURE.md` updated if the structure changed
- [ ] Commit proposed with a clear message (don't commit without approval)
