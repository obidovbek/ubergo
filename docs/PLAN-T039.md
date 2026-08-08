# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **T-038** → `docs/PLAN-T038.md`. Steps 1-6 done; **step 7 = owner (deploy API FIRST, then both
> apps)**, step 8 the commit. Code is in the working tree, **uncommitted**.
> ⏸️ **T-037** → `docs/PLAN-T037.md`. Steps 1, 3-6 done; step 2/7 = owner device test, step 8 commit.
> ✅ **T-036 CLOSED** → `docs/PLAN-T036.md`.
> ⏸️ **T-031** → `docs/PLAN-T031.md`, step 4 blocked on the owner's salon-option answer.
> ⏸️ **T-033/T-030/T-027/T-018/T-026A/T-025** → their own `docs/PLAN-T0*.md`.
> ⏸️ **Also parked:** T-011 · T-012 · T-014 · T-015 · T-016 · T-017.

## Task
- **ID / name:** T-039 — "Faol" must mean the same thing to the passenger and to the driver
- **Goal (definition of "done"):**
  1. A passenger order stays browsable by drivers for **3 hours after its departure time**.
  2. **Urgent orders use the same rule** — no special case anywhere in the code.
  3. The passenger's own list stops calling an order **"Faol"** once drivers can no longer see it.
  4. No migration, no scheduled job — the state is **derived**, not stored.
  5. `tsc` at baselines (API **282** · admin **0** · user **12** · driver **36/35**); i18n evaluated.
- **Why now:** the owner created an order, saw it as **Faol**, and no driver could find it. It is the
  single thing blocking the whole passenger→driver loop from being testable.
- **Source:** owner device screenshots, 2026-08-08.

## What is actually wrong (confirmed 2026-08-08 — do NOT re-derive)
The owner's order: `published`, shown as **"Faol"**, departing **8 Aug 13:23**, phone clock **15:58**.
`PassengerOfferService.getPublicOffers` filters `start_at >= new Date()`, so it left the driver
browse **2.5 h earlier** while the passenger's screen still called it active.
**Live API confirms the driver side is innocent:** `GET /public/passenger-offers?limit=20` with no
filters returns `{"items":[],"total":0}`.

⚠️ **A wrong first hypothesis, recorded so nobody re-runs it:** the minute-precise 13:23 looked like
an urgent order's creation stamp. It was not — `departDate`/`departFrom` both default to
**`now + 1 hour`** (`CreatePassengerOfferScreen.tsx:87-92`), so a default-accepted order created at
~12:23 lands on exactly 13:23. An ordinary order that simply expired.

✅ **The urgent bug is still real, and this card's grace window fixes it too:** urgent stamps
`start_at = new Date()` (`getStartAtDate:177`) and skips the ≥30 min check, so today an urgent order
is invisible from the moment it is saved.

## Owner decisions taken 2026-08-08 (do NOT re-ask)
1. **3-hour grace window** after departure for the driver browse.
2. **Urgent orders use the same window** — one rule, no special case.
3. **The passenger's list must show expired orders as expired**, not "Faol".

## Approach
One constant on the server and one derived label in the app. The passenger's status column is **not**
touched — an order that has merely expired is still `published`, may still be revived by editing its
time, and inventing an `expired` DB state would need a migration *and* something to write it.

⚠️ **The window lives in ONE place** (`PassengerOfferService`), and the app derives its label from
the same number. If they drift, the passenger is lied to again — which is this whole card.

## Steps
- [x] 1. **DONE 2026-08-08. API: the grace window.** New
  `PASSENGER_OFFER_BROWSE_GRACE_MS` (3 h) in `src/constants/index.ts` — shared, not duplicated.
  🔴 **The sweep for other `start_at >= now` guards paid off immediately.**
  `OfferDriverService.joinOffer:93` had the same comparison, so with only the browse changed a driver
  would have tapped an order the list had just offered him and been told **"this trip already
  started"**. Both now use the one constant. `getOfferById` has no date gate, so the detail fetch
  cannot 404 an order the browse shows. `OfferPassengerService`'s two guards are the *driver-offer*
  leg — a different entity, deliberately untouched.
- [x] 2. **DONE 2026-08-08. The passenger is no longer told "Faol".** `displayStatus()` in
  `MyPassengerOffersScreen` returns `expired` for a `published` order past the window; the badge's
  colour, background, icon and label all read from it. New `passengerOffers.expired` ×3 locales.
  ⚠️ **The stored status is untouched** — the order really is still `published`, still cancellable,
  and still revivable by editing its time. Only the label is derived, so no migration and nothing
  needs to run on a schedule to write an `expired` state.
- [x] 3. **DONE 2026-08-08. Verification — 32/32.** `tsc`: API **282 = baseline** · admin
  **0 = baseline** · user **11** · driver **35** (both apps one below baseline, from T-038's logout
  fix — nothing to do with this card).
  The suite targets **drift**, because that is this card's real risk: it evaluates the API constant,
  asserts **both** server call sites use it rather than a literal, asserts the **old bare-`now`
  comparisons are gone**, and asserts the user app's copy of the window **equals** the server's.
  Then the boundaries with real numbers — 1 min past ✓, the owner's own 13:23 order ✓, 2h59m ✓,
  exactly 3h ✓, 3h01m ✗, yesterday ✗ — including **an urgent order created this instant**, which
  could never be found before. Plus: the browse and the label must **disagree at no boundary**;
  cancelled/completed orders are never relabelled; and `passengerOffers.expired` resolves in all
  three locales and differs from `active`. Script: `scratchpad/t039-check.js`.
- [ ] 4. **Owner: deploy the API, rebuild the user app**, then create an order and confirm the driver
  finds it — including one urgent order, which could never be found before.
- [ ] 5. Commit (only after the owner's approval).

## Files to touch
- `api,admin,db/apps/api/src/services/PassengerOfferService.ts` — the constant + the filter
- `user-app-standalone/screens/MyPassengerOffersScreen.tsx` — the derived label
- `user-app-standalone/translations/{uz,ru,en}.ts`
- ❌ **No migration. No scheduled job. No DB status change.**

## Risks / open questions (READ before coding)
- ⚠️ **Three hours is a product guess, not a law.** Keep it a named constant so changing it is one
  edit, and say so in the comment.
- ⚠️ **The passenger's list and the server must agree.** Two copies of "3 hours" is the bug this card
  exists to fix, one level up. If they cannot share a constant, the app's copy must name the server
  as the source of truth.
- ⚠️ **Do not confuse "expired" with `archived`/`cancelled`** — the order is still `published` and
  still cancellable; only its *label* changes.
- ⚠️ **T-037 and T-038 are both uncommitted in this tree.** Three cards' worth of changes are now
  live in the working copy — keep the commits separate.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).
- 🚫 **Do not touch `JWT_EXPIRES_IN`** (owner, 2026-08-08).

## Session notes (one line per work session)
- **2026-08-08** — card opened straight from two owner screenshots. The driver side was proven
  innocent against the live API before any code was written; my first (urgent) hypothesis was wrong
  and is recorded above so it is not repeated.

## Resume point (for the next chat)
**Steps 1-3 DONE. Only step 4 (owner: deploy + test) and step 5 (commit) remain.**

An order now stays browsable for **3 h after departure**, the join guard honours the same window, and
the passenger's list says **"Muddati o'tgan"** instead of "Faol" once it has dropped out.
The owner's own 13:23 order would be findable again under this rule.

🔴 **The find worth remembering:** changing the browse alone would have swapped one lie for another —
`OfferDriverService.joinOffer` carried the same `start_at < now` guard, so a driver would have been
offered a card and then refused it with "this trip already started".

⚠️ **Three copies of "3 hours" now exist** (browse, join guard, app label). Two share the constant;
the app's is a mirror the check script pins to the server's value. Change them in one commit.
🛑 **API deploy required** — the app change alone does nothing.

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12** (currently **11**,
one below, because T-038 fixed a baseline error), driver app **36** (currently **35**, same reason).
