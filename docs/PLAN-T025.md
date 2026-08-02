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
  4. A passenger **sees the front-seat premium before being charged it**.
  5. Tapping a cancelled offer shows an error instead of a **blank screen**.
  6. Prices read `60 000`, not `60 000.00`.
  7. No new `tsc` errors anywhere; API deployed to test3; **both** apps rebuilt; smoke-tested.
- **Why now:** (1) unblocks T-018 step 9 and sections 6–7 of `docs/CHECKLIST.md`, which have been
  untestable since 2026-08-02; (2) the two hotfixes are one-liners in code already read, and both
  would otherwise be hit *during* the checklist walk and cost debugging time; (3) the API needs a
  redeploy before that walk anyway, so these ride along for free.
- **Source:** end-to-end audit of the driver create-offer flow, 2026-08-02 (3) (16 findings; this card
  takes 3 of them, the rest are **T-026**).

## Owner decisions already taken (2026-08-02 (3) — do NOT re-ask)
1. **T-022 is absorbed** into this card as step 1. It is not a port: the driver app's own
   `api/driver.ts` already exports `GeoOption`, `fetchGeoCountries`, `fetchGeoProvinces`,
   `fetchGeoCityDistricts`, so a re-export shim beats copying a second geo client that would drift.
2. **Scope is deliberately narrow.** The mass-assignment hole, the 500-instead-of-4xx sweep, the
   JSON-parse guards and the `parseLocationText` fan-out are **T-026**, not this card — they only
   fire on malicious/broken input or under a rate limiter, and taking them now would stall T-018
   for days. Owner chose this split (2026-08-02 (3)).
3. **T-018's plan is preserved** in `docs/PLAN-T018.md`, not overwritten.

## Current state (verified in code 2026-08-02 (3))
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
- [x] 1. **Driver app: `api/geo.ts` re-export shim — DONE 2026-08-02 (3).** New `api/geo.ts` re-exports
  `GeoOption`, `fetchGeoCountries`, `fetchGeoProvinces`, `fetchGeoCityDistricts` from `./driver`.
  `SearchPassengerOffersScreen.tsx` untouched; it is the **only** importer of `../api/geo` and uses
  exactly those symbols (checked). Driver app `tsc` **40 → 36**: both `Cannot find module
  '../api/geo'` errors plus two downstream `implicitly has an 'any' type` errors gone, **zero added**.
- [x] 2. **API: front-price comparison — DONE 2026-08-02 (3).** New private `parsePrice(value, field)`
  coerces with `Number()` and rejects non-finite input with a **400** ("must be a number") instead of
  letting it reach Postgres as a 500. Both price checks now compare numbers. Original check order and
  messages preserved, so numeric input behaves exactly as before.
- [x] 3. **API: `seats_free` on update — DONE 2026-08-02 (3).** `updateOffer` computes
  `booked = offer.seats_total - offer.seats_free` and sets `seats_free = newSeatsTotal - booked`;
  shrinking `seats_total` below `booked` is a 400 naming the booked count. The explicit `seats_free`
  key sits **after** the `...data` spread, so a client-sent `seats_free` cannot override the guard
  (`start_at` likewise). The remaining mass-assignment surface is recorded in a code comment → T-026.
- [x] 4. **Static verification — DONE 2026-08-02 (3).** `tsc`: API **285 → 285 (identical set,
  measured against a `git stash` of exactly this file)**, driver app **40 → 36**, user app **12**,
  admin **0**. **No new error anywhere.**
  27/27 runtime checks green via `<scratchpad>/check-driver-offer-prices.mts`
  (`npx tsx`, no DB — `validateOfferData` is pure). **The bug was proven, not assumed:** the same
  script run against a `git stash` of the pre-fix file **fails 3 of its 5 repro cases** with the
  false 400, and passes all 5 after. (The `mixed number + string` case passed before too — one
  numeric side forces coercion, which is exactly why this hid for so long.)
  ⚠️ Step 3's arithmetic is **not** covered by a runtime check — it is inline in `updateOffer`,
  which needs a DB. It is verified by reading only, so step 5(d) is the real test.
- [x] 5. **DONE 2026-08-02 (3). User app: the front-seat premium the passenger is never shown** (audit finding 1 —
  the same DECIMAL-as-string root cause as step 2, opposite symptom). `OfferDetailsScreen.tsx:192`
  compares `offer.front_price_per_seat > offer.price_per_seat` — two strings, lexicographic, so
  `"12000.00" > "5000.00"` is **false**. `hasFrontSeatPricing` gates the price banner (:269), the
  premium amount (:420) and the breakdown (:483) but **not the front-seat toggle**, and
  `OfferPassengerService.ts:136` charges on plain truthiness — so the passenger ticks "front seat"
  with no price shown anywhere and is charged the premium anyway. `Number()` both sides.
- [x] 6. **DONE 2026-08-02 (3). API + user app: the blank screen on a cancelled offer** (audit finding 2). Three steps,
  fixed the first two:
  - `PublicOfferController.ts:109` — `successResponse(res, data, message?, statusCode?)`, so the
    `404` lands in the **message** slot and the reply is HTTP **200 / success:true / offer:null**.
    Replace with a real `AppError(…, 404)` so the app's existing error path (toast + `goBack`) fires
    with no app change needed. Fix the same arg-order slip at `OfferPassengerController.ts:38-41`
    and `DriverOfferController.ts:80` (both 201→200; harmless today, identical mistake).
  - `OfferDetailsScreen.tsx:175` — `if (!offer) return null` renders a blank screen with no way
    back. Make it toast + `goBack()`, so a null offer can never strand the passenger again even if
    some other endpoint regresses.
- [x] 7. **DONE 2026-08-02 (3). Both apps: prices render with `.00`** (audit finding 3). `formatNumberWithSpaces` did
  `num.toString()`, so the DECIMAL string `"5000.00"` became **`"5 000.00"`**. Parameter widened
  to `number | string`, `Math.round(Number(num))` before formatting, non-finite → `''`, in **both**
  `user-app-standalone/utils/format.ts` and `driver-app-standalone/utils/format.ts`. Not made
  `null`-tolerant — the 2026-08-02 decision to let `tsc` police null call sites still stands.
  ⚠️ **Known edge:** `Number('')` is `0`, so an empty string now renders `"0"` where it used to
  render `""`. No call site can pass `''` (the API sends `null` or `"5000.00"`), so this is left
  unguarded rather than adding a branch for an unreachable input — but it is a real behaviour change.

- [x] **Verification of steps 5–7 — DONE 2026-08-02 (3).** `tsc`: API **285 → 282**, user app
  **12 → 12**, driver app **36 → 36**. **Zero new errors anywhere.** The three API errors that
  disappeared are **the three bugs themselves** — TypeScript had already flagged every
  `successResponse` arg-order slip as `Argument of type 'number' is not assignable to parameter of
  type 'string'`, and all three were buried in the 285-error backlog. (Same lesson as the
  2026-08-02 journal entry: the baselines hide real bugs.) None of the user app's remaining 12
  errors are in a touched file. 20/20 runtime checks green via `<scratchpad>/fmt.mts`, including a
  case that records the old lexicographic result (`'12000.00' > '5000.00'` → `false`) as proof the
  defect was real.
  ⚠️ Only one caller of `/public/driver-offers/:id` exists (`OfferDetailsScreen` via
  `getOfferDetails`), and it already branches on `!response.ok` — the 200→404 change was checked
  before landing, as the risk note required.
- [ ] 8. **Owner: deploy + smoke test.** Deploy the API to test3, rebuild **both** apps. Then:
  (a) open the driver's passenger-order search screen — it must render at all;
  (b) create an offer with a front-seat price of 60000 against a 5000 base;
  (c) reopen it for edit and save **without changing the price fields** — must succeed
  *(exact repro of defect 1, step 2)*;
  (d) with one confirmed passenger, edit the offer — `seats_free` must **not** jump back up
  *(only test of step 3)*;
  (e) as a passenger, open that offer — the front-seat price and premium must be **visible**
  *(step 5)*;
  (f) cancel the offer as the driver, then tap it as the passenger — must show an error and go
  back, **not** a blank screen *(step 6)*;
  (g) confirm prices read `60 000`, not `60 000.00`, in both apps *(step 7)*.
- [x] 9. **Commit — DONE 2026-08-02.** Owner committed steps 5–7 as `178a452` ("show the front-seat
  premium, kill the blank offer screen, round prices"); steps 1–3 were already in `0371cbd`.
  All seven code files are in. ⚠️ `.claude/settings.json` rode along in both commits.
  **Step 8 is now the only thing left on this card.**

## Files to touch (verified against the repo 2026-08-02 (3))
Steps 1–4 (done):
- **NEW** `driver-app-standalone/api/geo.ts` (3 lines, re-export only)
- `api,admin,db/apps/api/src/services/DriverOfferService.ts` (two edits: `validateOfferData`
  ~L109-120, `updateOffer` ~L394-398)

Steps 5–7 (added 2026-08-02 (3) after the passenger-connection audit):
- `user-app-standalone/screens/OfferDetailsScreen.tsx` (:192 comparison, :175 null-offer guard)
- `api,admin,db/apps/api/src/controllers/PublicOfferController.ts` (:109 → real 404)
- `api,admin,db/apps/api/src/controllers/OfferPassengerController.ts` (:38-41 arg order)
- `api,admin,db/apps/api/src/controllers/DriverOfferController.ts` (:80 arg order)
- `user-app-standalone/utils/format.ts` + `driver-app-standalone/utils/format.ts`

That is the whole list. Nothing else is touched. Everything else from the two audits is **T-026**.

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
- ⚠️ **Step 5 fixes the display, not the charging rule.** `OfferPassengerService.ts:136` decides to
  charge the premium by **truthiness** of `front_price_per_seat`, which is a non-empty string and
  therefore always true. After step 5 the UI and the server agree, because the API refuses
  `front < price` at creation — but the two still use different tests. Unifying them is T-026.
- ⚠️ **Step 6 changes a status code the app already depends on.** `/public/driver-offers/:id` on a
  non-published offer goes from HTTP **200** to **404**. `user-app-standalone/api/offers.ts:163`
  already branches on `!response.ok`, so this is the path it was always meant to take — but grep
  for any other caller before landing it.
- ⚠️ **Step 7 widens a shared helper's signature.** `formatNumberWithSpaces` is called from many
  screens in both apps; widening `number` → `number | string` is source-compatible, but the
  rounding changes what every one of those screens renders. Re-check the `tsc` baselines after.
- ⚠️ Step 8 is **owner-only** (needs a device + `kubectl`). Steps 1–7 are static; nothing about
  this card can be truly verified from this machine.
- Deploy order: API first, then **both** apps. Steps 5 and 7 changed the user app, so it is no
  longer enough to rebuild only the driver app.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`,
  `GRADLE_OPTS` truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` + `.gitignore` are modified for unrelated reasons — keep them out of
  this commit.

## Session notes (one line per work session)
- **2026-08-02 (3)** — the whole card, in one session: **two audits + steps 1–7 DONE.**
  - *Audit 1* (driver create-offer, 16 findings) produced this card; owner approved it and steps
    1–4 landed. T-022 turned out to be a **3-line re-export shim, not a port** (`api/driver.ts`
    already exported all four symbols) — driver `tsc` 40 → 36. The front-price bug was
    **reproduced against the pre-fix code** (3 of 5 repro cases threw the false 400) and 27/27
    checks pass after. API `tsc` 285 → 285, identical set.
  - *Audit 2* (passenger↔driver-offer leg, 17 findings) found that leg is **fully wired in both
    apps** — unlike the OfferDriver leg — so its bugs are live, not theoretical. Owner approved
    folding the three user-visible ones in as **steps 5–7** and the other 14 into **T-026**.
  - Steps 5–7 landed the same session. API `tsc` **285 → 282**, and **the three errors that
    vanished are the three bugs themselves** — TypeScript had flagged every `successResponse`
    arg-order slip as `number is not assignable to string`, and all three sat unread inside the
    baseline backlog. User 12 → 12, driver 36 → 36, zero new anywhere, 20/20 runtime checks.
  - Owner committed three times (`5a57781` docs, `0371cbd` steps 1–3, `178a452` steps 5–7).

## Resume point (for the next chat)
**Steps 1–7 and 9 are DONE. Only step 8 — the owner's deploy + seven smoke tests — remains.**
There is **no Claude work left on this card**; do not re-open the code. All seven files are
committed (`0371cbd` steps 1–3, `178a452` steps 5–7), working tree clean:
- **NEW** `driver-app-standalone/api/geo.ts`
- `api,admin,db/apps/api/src/services/DriverOfferService.ts`
- `api,admin,db/apps/api/src/controllers/PublicOfferController.ts`
- `api,admin,db/apps/api/src/controllers/OfferPassengerController.ts`
- `api,admin,db/apps/api/src/controllers/DriverOfferController.ts`
- `user-app-standalone/screens/OfferDetailsScreen.tsx`
- `user-app-standalone/utils/format.ts` + `driver-app-standalone/utils/format.ts`

⚠️ **Deploy the API and rebuild BOTH apps** — the user app now carries fixes too (steps 5–7), which
earlier T-025 sessions did not. `.claude/settings.json` is modified for unrelated reasons; keep it
out of the commit.

**Step 8 is the only thing that can actually prove any of this.** Everything so far is `tsc` plus
pure-function checks; no device, no DB, no deploy from this machine. Run its seven smoke tests in
order — **8(c) is the exact repro** of the front-price defect and **8(d) is the only test of
step 3's arithmetic**, which has no runtime coverage at all.

The three defects and their exact evidence are written up in the **Current state** section above —
a cold-start chat does not need to re-derive them, and should not re-audit the flow. The full
16-finding audit that produced this card is summarised in the **T-026** entry in `docs/TODO.md`.

Commit message used for step 9 (`178a452` carried the steps 5–7 half of it):
```
fix(offers): unblock the geo import and stop five price/seat defects (T-025)

pg returns DECIMAL as a string and no setTypeParser overrides it, so every
relational comparison between two price values was lexicographic. Three of the
five bugs below are that one root cause wearing different clothes.

- driver app: add api/geo.ts re-exporting the geo client from api/driver.ts, so
  SearchPassengerOffersScreen can finally bundle (absorbs T-022)
- api: compare prices numerically in DriverOfferService — "12000.00" < "5000.00"
  was true, and rejected every edit of an offer whose front price had more
  digits than the base price
- api: keep booked seats when seats_total changes, instead of resetting
  seats_free and re-selling seats that were already confirmed
- user app: compare prices numerically in OfferDetailsScreen — the front-seat
  premium was hidden from the passenger while still being charged
- api: return a real 404 for an unavailable public offer. successResponse takes
  (res, data, message, status), so the 404 was landing in the message slot and
  the passenger got HTTP 200 + offer:null, i.e. a blank screen
- both apps: round in formatNumberWithSpaces so prices read 60 000, not 60 000.00
```

**When this card is done:** T-018 unparks. Its plan is `docs/PLAN-T018.md`, still live at step 9;
resume by walking `docs/CHECKLIST.md`. Move T-018's plan back into `docs/PLAN.md` at that point, or
just work from `PLAN-T018.md` directly and delete this card's file.

**Baselines to compare `tsc` against:** API **285**, admin **0**, user app **12**, driver app **40**.
