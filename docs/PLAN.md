# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **T-018 is parked mid-task, not finished** — its full plan is in `docs/PLAN-T018.md`
> and is still current. T-025 step 1 is exactly the blocker that stops T-018 step 9.
> ⏸️ **Also parked (implemented, awaiting owner device test):** T-011 · T-012 · T-014 ·
> T-015 · T-016 (`2a76e12`) · T-017 (`a1ecedd`).

## Task
- **ID / name:** T-025 — driver offer create/edit: unblock the geo import + two create-offer hotfixes
- **Goal (definition of "done"):**
  1. The driver's passenger-order search screen **bundles and opens** (it never has).
  2. A driver can **edit an offer that has a front-seat price** without getting a 400.
  3. Editing an offer **no longer re-sells seats that are already booked**.
  4. No new `tsc` errors anywhere; API deployed to test3; driver app rebuilt; smoke-tested.
- **Why now:** (1) unblocks T-018 step 9 and sections 6–7 of `docs/CHECKLIST.md`, which have been
  untestable since 2026-08-02; (2) the two hotfixes are one-liners in code already read, and both
  would otherwise be hit *during* the checklist walk and cost debugging time; (3) the API needs a
  redeploy before that walk anyway, so these ride along for free.
- **Source:** end-to-end audit of the driver create-offer flow, 2026-08-03 (16 findings; this card
  takes 3 of them, the rest are **T-026**).

## Owner decisions already taken (2026-08-03 — do NOT re-ask)
1. **T-022 is absorbed** into this card as step 1. It is not a port: the driver app's own
   `api/driver.ts` already exports `GeoOption`, `fetchGeoCountries`, `fetchGeoProvinces`,
   `fetchGeoCityDistricts`, so a re-export shim beats copying a second geo client that would drift.
2. **Scope is deliberately narrow.** The mass-assignment hole, the 500-instead-of-4xx sweep, the
   JSON-parse guards and the `parseLocationText` fan-out are **T-026**, not this card — they only
   fire on malicious/broken input or under a rate limiter, and taking them now would stall T-018
   for days. Owner chose this split (2026-08-03).
3. **T-018's plan is preserved** in `docs/PLAN-T018.md`, not overwritten.

## Current state (verified in code 2026-08-03)
- `driver-app-standalone/api/geo.ts` **does not exist**; `SearchPassengerOffersScreen.tsx:27-28`
  does `import * as GeoAPI from '../api/geo'` + `import type { GeoOption }` → Metro cannot resolve
  it → that screen has never opened.
- `driver-app-standalone/api/driver.ts` already exports `GeoOption` (:14), `fetchGeoCountries`
  (:300), `fetchGeoProvinces` (:304), `fetchGeoCityDistricts` (:308).
- `price_per_seat` / `front_price_per_seat` are `DECIMAL(10,2)`. pg returns numeric as a **string**
  and there is **no `setTypeParser` override** in the project — so the API sends `"12000.00"`,
  `OfferWizardScreen.tsx:261-262` loads it raw into `formData`, and it is sent back as a string.
- `DriverOfferService.ts:114-119` compares `front_price_per_seat < price_per_seat`. Two strings →
  **lexicographic** → `"12000.00" < "5000.00"` is `true` → 400 on any offer whose front price has
  more digits than the base price (the UI's own placeholder suggests 60000 against a 5000 base).
- `DriverOfferService.ts:397` sets `seats_free: data.seats_total ?? offer.seats_free` on update.
  The wizard always sends `seats_total`, and `OfferPassengerService.ts:275` decrements `seats_free`
  on confirm → **every edit hands sold seats back**.

## Approach
Three surgical edits in two files. No new dependency, no migration, no schema change, no API
contract change. Each step leaves the project runnable on its own.

For the price comparison: coerce **both sides** with `Number()` before comparing, and reject a
non-numeric price with a 400 instead of letting it reach Postgres as a 500 (two extra lines, in the
function already being edited — this is the only piece of T-026's type-checking taken early,
because leaving `Number("abc") = NaN` un-guarded in a line I am touching would be negligent).

For `seats_free`: preserve booked seats rather than resetting. `booked = offer.seats_total -
offer.seats_free`; new `seats_free = new seats_total - booked`. If the driver shrinks `seats_total`
below `booked`, that is a **400 with a clear message**, not a silent clamp — the model's
`min: 0` validator would otherwise throw a useless generic validation error.

## Steps
- [ ] 1. **Driver app: `api/geo.ts` re-export shim** (was T-022). New 3-line file re-exporting the
  four symbols from `./driver`. Leaves `SearchPassengerOffersScreen.tsx` untouched. Confirm the
  driver app `tsc` count **drops** (the unresolved-module errors go away) and that no other file
  imports `../api/geo` expecting something else.
- [ ] 2. **API: front-price comparison** — `DriverOfferService.validateOfferData`. `Number()` both
  sides; reject non-numeric `price_per_seat` / `front_price_per_seat` with a 400. Existing rules
  (`> 0`, `>= 5000 UZS`, `front >= price`) keep their exact meaning for numeric input.
- [ ] 3. **API: `seats_free` on update** — `DriverOfferService.updateOffer`. Preserve booked seats;
  400 if the new `seats_total` is below what is already confirmed.
- [ ] 4. **Static verification** — `tsc` in all four apps against the recorded baselines
  (API **285**, admin **0**, user app **12**, driver app **40**). Expect: driver app **down**,
  everything else identical. Report the exact before/after sets, no hand-waving.
- [ ] 5. **Owner: deploy + smoke test.** Deploy the API to test3, rebuild the driver app. Then:
  (a) open the passenger-order search screen — it must render at all; (b) create an offer with a
  front-seat price of 60000 against a 5000 base; (c) reopen it for edit and save **without
  changing the price fields** — must succeed (this is the exact repro of defect 1); (d) with one
  confirmed passenger, edit the offer and confirm `seats_free` did not jump back up.
- [ ] 6. **Commit** with a clear message, owner-approved.

## Files to touch (verified against the repo 2026-08-03)
- **NEW** `driver-app-standalone/api/geo.ts` (3 lines, re-export only)
- `api,admin,db/apps/api/src/services/DriverOfferService.ts` (two edits: `validateOfferData`
  ~L109-120, `updateOffer` ~L394-398)

That is the whole list. Nothing else is touched.

## Risks / open questions (READ before coding)
- ⚠️ **The mass-assignment hole stays open on the very line step 3 edits.** `updateOffer` still does
  `offer.update({ ...data, ... })`, so `user_id`, `status`, `seats_free`, `currency`,
  `rejection_reason`, `reviewed_by`, `reviewed_at` remain client-writable. Deliberate (owner
  decision 2 — it is **T-026**), but it means step 3's guard can still be bypassed by a client that
  sends `seats_free` directly. Worth knowing before anyone calls this "fixed".
- ⚠️ **DECIMAL-as-string is systemic, and step 2 fixes exactly one comparison.** Every other `<`,
  `>` or `+` on a price elsewhere in the codebase has the same latent bug. Arithmetic (`*`, `-`)
  coerces and is safe; relational operators between **two** strings are not. A full sweep belongs
  in T-026 (or a `decimalNumbers`/`setTypeParser` decision, which is a bigger call).
- ⚠️ **Step 3 changes behaviour a driver may have come to expect** — raising `seats_total` now adds
  only the difference. That is the correct behaviour, but it is a change.
- ⚠️ Step 5 is **owner-only** (needs a device + `kubectl`). Steps 1–4 are static; nothing about
  this card can be truly verified from this machine.
- Deploy order: API first, then the driver app. Step 1 is app-only and independent of steps 2–3,
  so a partial deploy is safe in either order here.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`,
  `GRADLE_OPTS` truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` + `.gitignore` are modified for unrelated reasons — keep them out of
  this commit.

## Session notes (one line per work session)
- _(empty — first session starts at step 1)_

## Resume point (for the next chat)
**Nothing implemented yet. Plan written 2026-08-03, awaiting owner approval; no code may be
written before that (CLAUDE.md rule 3).** Start at step 1.

The three defects and their exact evidence are written up in the **Current state** section above —
a cold-start chat does not need to re-derive them, and should not re-audit the flow. The full
16-finding audit that produced this card is summarised in the **T-026** entry in `docs/TODO.md`.

**When this card is done:** T-018 unparks. Its plan is `docs/PLAN-T018.md`, still live at step 9;
resume by walking `docs/CHECKLIST.md`. Move T-018's plan back into `docs/PLAN.md` at that point, or
just work from `PLAN-T018.md` directly and delete this card's file.

**Baselines to compare `tsc` against:** API **285**, admin **0**, user app **12**, driver app **40**.
