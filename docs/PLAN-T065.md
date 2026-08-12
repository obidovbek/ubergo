# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-066 + T-067 moved intact → `docs/PLAN-T066-T067.md`** (steps 1-6 done; the owner's user-app
> rebuild and the commit remain).
> ✅ **T-061** → `docs/PLAN-T061.md`. ✅ **T-059** → `docs/PLAN-T059.md`. ✅ **T-055** →
> `docs/PLAN-T055.md`. ✅ **T-057** → `docs/PLAN-T057.md`. ✅ **T-054** → `docs/PLAN-T054.md`.
> ✅ **T-045** → `docs/PLAN-T045.md`. ✅ **T-024** → `docs/PLAN-T024.md`.
> 🔴 **T-047 PARKED** — killed-app push tap; needs a `logcat` line before more code.
> 🛑 **T-031 PARKED BY THE OWNER 2026-08-11** — its remaining steps **are** the payment work.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own
> `docs/PLAN-T0*.md`; most are waiting on the owner, not on code.
> 📥 **T-064 · T-068 · T-069 · T-070 · T-071 · T-072 · T-073 · T-074** are boarded in
> `docs/TODO.md` → *Later* and **NOT started**. Do not begin one because it looks small.

## Task
- **ID / name:** T-065 — a passenger can rewrite an agreed ride and nobody is told
- **Goal (definition of "done"):**
  1. **Editing a ride request pushes every driver with a live interest in it** — the `confirmed`
     driver and every `pending` bidder (owner decision, 2026-08-12).
  2. **The push names what changed** ("the departure time changed"), not just "something changed"
     (owner decision, 2026-08-12).
  3. **Each driver reads it in their own language**, resolved per person — never the editing
     passenger's.
  4. **Tapping it opens the changed ride**, not a generic list.
  5. **A no-op edit sends nothing.** Saving the form without changing a field must not push.
  6. `tsc` at baselines: API **281** · admin **0** · user **9** · driver **35**.
- **Why now:** the owner's device test 2026-08-12, item ⑥. It is the most damaging card left
  unblocked: a driver can be committed to a trip whose time or route silently changed underneath
  them, and they find out by turning up at the wrong place or hour.

## What is already there (verified 2026-08-12 — do NOT re-derive)

### The defect
🔴 `PassengerOfferService.updateOffer:882-921` validates, patches, audit-logs and returns.
**There is no `notifyDriver` call anywhere in the method** — it tells nobody, ever.
🔴 **And it deliberately permits editing after the deal is struck:** `:897` allows both `published`
**and `driver_found`**, so the ride a driver has already been confirmed for is editable.

### Everything needed already exists — this card is wiring, not building
✅ **The exact pattern to copy is 30 lines below, in the same file.** `cancelOffer:939-1006` loads
the `pending`/`confirmed` `OfferDriver` rows, then pushes each driver **in their own language** via
`getUserLanguage(driverJoin.driver_id)`. That loop is the whole mechanism.
✅ **`notifyDriver` (`:1350`) needs no change.** It already calls `NotificationService.recordPush`
**before** sending and **outside** the try — so T-045's rule (a failed push still leaves a record)
comes for free.
✅ **What changed is already computed.** `updateOffer:915` puts `Object.keys(fields)` into the audit
log, where `fields` comes from `buildOfferFields` (`:353`), which only sets a key when the caller
actually sent it. That list is the basis for naming the changed fields — no diffing to invent.
✅ **The destination exists and takes exactly the right id.** The driver app registers
**`PassengerOfferDetails`** (`MainNavigator:115`) and the screen reads
`route.params.offerId` as a **PassengerOffer id** (`PassengerOfferDetailsScreen:56`) — which is what
this push's `offer_id` means. So the tap can open the *changed ride*, not a list.
⚠️ **`parseOfferId` guards the id** in the driver app's `notificationRouting.ts:40-43`; a malformed
id must fall back rather than push `NaN` into that screen.

### The trap this card must not fall into
🔴 **`buildOfferFields` reports "sent", NOT "changed".** A key is set whenever the client included
it, so the user app re-sending an unchanged `from_text` would make `Object.keys(fields)` claim the
route changed. **T-040's edit screen pre-fills the form and PATCHes it back**, so this is the normal
case, not an edge case. **Comparing sent values against the stored row is mandatory** — otherwise
every save pushes "the route changed" to every driver, which is worse than silence.
⚠️ **The mahalla guard interacts with this** (T-040): `from_text`/`to_text` are omitted from the
PATCH when the geo ids are unchanged, because the mahalla lives only inside that string.

## Approach
Compute a **real** changed-field list inside `updateOffer` (compare against the row as loaded,
before `update()`), then reuse `cancelOffer`'s per-driver, per-language notify loop. New push type,
new i18n keys, and one new case in the driver app's routing table. The user app is **not touched**.

## Steps
- [x] 1. **DONE 2026-08-12. The edit screen sends the WHOLE form, so the trap is not an edge case —
  it is the only case.** `CreatePassengerOfferScreen:531-542` builds the same ~40-field
  `offerData` used for create, strips only `from_text`/`to_text` when the location was not
  re-picked (the mahalla guard), and PATCHes **everything else unconditionally** — including
  `is_urgent`, `payment_type`, all four `seat_counts`, six booleans and `special_order`.
  🔴 **So `Object.keys(fields)` would name ~40 changed fields on every single save**, and the push
  would read "the route, the time, the seats, the payment… changed" every time the passenger fixed
  a typo in the note. A real value-diff is therefore **mandatory**, not a refinement.
  ⚠️ `undefined` is used liberally for "not set" (`|| undefined`), and `buildOfferFields` skips
  keys whose value is `undefined` — so an absent optional field and a *cleared* one look identical
  on the wire. The diff must not report a change when both sides are empty.
- [x] 2. **DONE 2026-08-12. A real value-diff.** New `changedFields(fields, current)` compares each
  patched value against the stored row and returns only what genuinely differs. Normalised for the
  four ways this codebase produces false differences: **DECIMAL-as-string** from pg (`'50000.00'` vs
  `50000` — the 2026-08-02 root cause), **Date vs ISO string**, **JSONB key order**, and
  **null/undefined/`''` all meaning "unset"**. Ids compare numerically too (string vs number).
  ⚠️ Called with `offer` **before** `offer.update()`; taking it after would compare the row with
  itself and always return empty — a fix that silently does nothing.
- [x] 3. **DONE 2026-08-12. Both groups notified, each in their own language.**
  `notifyDriversOfUpdate` loads the `pending` **and** `confirmed` `OfferDriver` rows and pushes
  `passenger_offer_updated`, resolving language per driver via `getUserLanguage`.
  ⚠️ **`Promise.allSettled`, not `all`** (which is what `cancelOffer` uses): the edit is already
  committed by this point, so one driver's push failing must not cancel the others or surface as a
  failed save. The whole loop is additionally wrapped in try/catch for the same reason.
  ✅ The audit log now records the **real** diff instead of `Object.keys(fields)`, which logged ~40
  fields on every save and told you nothing.
- [x] 4. **DONE 2026-08-12. A separate `offerFields.*` dictionary ×3 locales, covering all 41
  writable columns.** 🔴 **Reuse was checked and REJECTED on evidence:** the existing `fields.*`
  dictionary is entirely driver-registration (`pinfl`, `license_plate`, `category_be`) and shares
  **not one key** with the offer columns. Merging them would make `category` and `year` ambiguous
  between a licence and a ride request. The comment in `uz.ts` says so, so nobody merges them later.
  ⚠️ The list came from `PassengerOfferAttributes`, not from guesswork — a missing name would render
  to the driver as a raw key like `roof_rack_needed`.
- [x] 5. **DONE 2026-08-12. The tap opens the changed ride.** `passenger_offer_updated` →
  **`PassengerOfferDetails({ offerId })`**, guarded by `parseOfferId` with `MyJoinRequests` as the
  fallback. Unlike the four bid-outcome types, the *point* of this push is the new terms, so it
  opens the ride itself rather than a list of bids.
  ⚠️ `offer_id` here is the passenger's own **PassengerOffer** — which is exactly what that screen
  takes. Routing it anywhere expecting a *DriverOffer* id is the documented trap.
- [x] 6. **DONE 2026-08-12. 51/51, proven able to fail — 39 red against pre-change code.**
  🔴 **`changedFields` is EXECUTED, not read** — extracted from the real source and compiled by
  `tsc`, then driven with 15 cases: six proving a re-sent unchanged form is **silent** (including
  DECIMAL-as-string, Date-vs-ISO, JSONB key order and null/undefined/`''`), and nine proving real
  edits are reported precisely, ending with **the realistic case**: the whole ~40-field form
  re-sent with one edit reports **exactly one field**.
  ✅ **The red reproduces the owner's bug from the other side:** modelling the old
  `Object.keys(fields)` behaviour makes all six no-op checks fail — i.e. the pre-change code would
  have announced ~40 changed fields on every save.
  ✅ The destination is asserted against route names **parsed from the real `MainNavigator`**, so
  renaming the screen fails the suite instead of passing while the app navigates nowhere.
  ✅ i18n **evaluated**: both push keys, all three placeholders (`{from}`/`{to}`/`{changed}`), and
  **all 41 writable columns** present in uz/ru/en.
  🔴 **The suite was wrong once before the code was, and the guard is what caught it.** Hand-rolled
  regex type-stripping produced a file that would not parse; because the loader hard-fails rather
  than skipping, it said so instead of silently dropping 15 behavioural checks and reporting a
  confident green on the one function this card depends on. Now `tsc` does the stripping.
  `tsc` API **281** · driver **35**, both at baseline, **zero errors in any touched file**.
- [ ] 7. **Owner:** deploy the API, rebuild the **driver** app, then: confirm a driver on a request,
  edit its departure time as the passenger, and check the driver gets a push naming the time and
  landing on that ride. Repeat with a second driver still `pending`.
- [ ] 8. Commit (only after the owner's approval).

## Files to touch
- `api,admin,db/apps/api/src/services/PassengerOfferService.ts` — the diff + the notify loop
- `api,admin,db/apps/api/src/i18n/translations/{uz,ru,en}.ts` — `push.passengerOfferUpdated*` + any
  missing field names
- `driver-app-standalone/utils/notificationRouting.ts` — one new case
- ❌ **No migration.** ❌ **User app untouched.** ⚠️ **Needs an API deploy** — it joins the one
  already queued (T-034 · T-043 · T-045 · T-054 · T-055 · T-061), so it costs no extra run.
- ⚠️ **The driver app rebuild** joins the one already queued (T-024 · T-046 · T-056 · T-057 ·
  T-058 · T-059 · T-061).

## Risks / open questions (READ before coding)
- 🔴 **The "sent ≠ changed" trap above is where this card fails silently.** Getting it wrong turns a
  missing notification into a spamming one, and the owner would report the opposite bug next week.
  Step 6 must prove a no-op edit is silent.
- 🔴 **Do not let a notification failure fail the edit.** `notifyDriver` swallows its own errors, but
  the new loop must not `throw` on `getUserLanguage` either — the passenger's save must succeed even
  if every push fails. (`cancelOffer` uses `Promise.all`; a rejection there *would* propagate.)
- ⚠️ **`getOfferById` is called twice in `updateOffer`** (`:888` before, `:908` after). The diff must
  read the **pre-update** copy; reading the reloaded one would compare a row against itself and
  always find nothing changed — a fix that silently does nothing, the T-054 lesson.
- ⚠️ **Adding a case to the routing table is not enough on its own** — T-044 found both `navigate()`
  call sites dropping params. That is fixed, but assert the destination rather than assuming.
- ⚠️ **The user app also shows these offers**; it is deliberately untouched, so a passenger editing
  their own ride sees no change. Say so plainly rather than implying both apps were swept.
- 🛑 **OPEN — should an edit to a `driver_found` offer be allowed at all?** This card assumes yes
  (it is today's behaviour and the owner asked only for the notification). If a confirmed ride
  should instead be *frozen*, that is a different and larger card — **say so and this one stops.**
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).

## Session notes (one line per work session)
- **2026-08-12** — plan written after grounding: `updateOffer` notifies nobody while `cancelOffer`
  30 lines below does it correctly; the destination screen and the per-language notify helper both
  already exist. Owner chose **confirmed + pending** and **name the changed fields**.

## Resume point (for the next chat)
**STEPS 1-6 DONE 2026-08-12. Only step 7 (owner: deploy the API, rebuild the DRIVER app, walk it)
and step 8 (commit) remain.** ❌ No migration. ❌ **User app untouched** — a passenger editing their
own ride sees no change from this card. ⚠️ **Needs an API deploy** (joins the queued one) **and a
driver-app rebuild** (joins the queued one), so it costs no extra run.

**What changed:** `updateOffer` used to tell nobody, while `cancelOffer` 30 lines below notified
everyone correctly. It now pushes every driver with a live interest — the `confirmed` one **and**
every `pending` bidder — in **each driver's own language**, naming the fields that actually changed,
and the tap opens the changed ride itself.

🔴 **The hazard the plan predicted was real and bigger than stated:** the edit screen re-sends the
**whole ~40-field form** every time, so `Object.keys(fields)` would have announced "the route, the
time, the seats, the payment changed" on every save. `changedFields` does a normalised value-diff
instead — and the suite proves a no-op edit is silent.

**Verification:** 51/51 with `changedFields` **executed**, **39 red** against pre-change code.
`tsc` API **281** · driver **35**, both at baseline, zero errors in any touched file.

⚠️ **Two cards are code-complete and waiting on the owner's device from today alone:** T-066 + T-067
(user-app rebuild, **no deploy**). The older batch is unchanged: one API deploy (T-034 · T-043 ·
T-045 · T-054 · T-055 · T-061) and one app rebuild (T-024 · T-046 · T-056 · T-057 · T-058 · T-059);
**T-046 also needs its migration**. **Baselines:** API **281** · admin **0** · user **9** ·
driver **35**.
