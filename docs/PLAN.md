# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.

## Task
- **ID / name:** T-001 — Verify & finish passenger→offer join flow
- **Goal (definition of "done"):** A passenger can join a published offer from the user
  app; the driver receives a push and sees the request; the driver confirms or rejects;
  seats update; the passenger receives a push with the result — all verified end-to-end.
- **Why now:** Last commit ("user joins to driver offer but not checked") left this
  half-wired and untested; it is the current critical path of the product.

## Approach (short)
First AUDIT what already exists (endpoints, models, push wiring, app screens) before
changing anything — the flow is partly built. Then close the gaps and test the whole
loop on real devices/emulators.

## Steps
- [ ] 1. Audit backend: find the join endpoint(s), booking model, seat logic, and the
  driver confirm/reject endpoints. Write down what exists vs. missing.  ← **NEXT**
- [ ] 2. Audit push wiring on both sides of the join (driver notified on join, passenger
  notified on confirm/reject) — confirm `app` filter is correct.
- [ ] 3. Audit the app screens: user-app "join" action + driver-app "requests" list.
- [ ] 4. List concrete gaps/bugs found; get approval on what to fix.
- [ ] 5. Fix the gaps (smallest working steps).
- [ ] 6. Test end-to-end: passenger joins → driver push → confirm → passenger push → seats update.
- [ ] 7. Update docs (ARCHITECTURE status, TODO, JOURNAL) + propose commit.

## Files to touch
TBD after the audit (step 1). Likely: `api,admin,db/apps/api/src/` (passenger/driver offer
routes + services + booking model), `user-app-standalone/` (join UI), `driver-app-standalone/`
(requests list). **Confirm exact files before editing.**

## Risks / open questions
- What exactly does "not checked" mean — untested, or known-broken? → step 1 clarifies.
- Seat concurrency: two passengers joining the last seat at once — is it guarded?
- Does the booking/join table already exist as a migration, or is it missing?

## Session notes (one line per work session)
- 2026-07-21: Task created while installing the docs/CLAUDE control system. Not started yet.

## Resume point (for the next chat)
Next action = **step 1**: audit the backend join/confirm/reject flow before writing any code.
Nothing changed yet. Start by grepping the API for the offer-join and passenger routes.
