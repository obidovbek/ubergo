# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-057 moved intact → `docs/PLAN-T057.md`** (steps 1-7 done; owner's rebuild + commit remain).
> ✅ **T-054** → `docs/PLAN-T054.md`. ✅ **T-045** → `docs/PLAN-T045.md`.
> ✅ **T-024** → `docs/PLAN-T024.md`. ✅ **T-046** → `docs/PLAN-T046.md`.
> 🔴 **T-047 PARKED BY THE OWNER** — killed-app push tap; needs a `logcat` line before more code.
> ⏸️ **T-040 · T-039 · T-037 · T-031 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own
> `docs/PLAN-T0*.md`; most are waiting on the owner, not on code.

## Task
- **ID / name:** T-055 — the driver-offer flow must let a confirmed pair contact each other
- **Goal (definition of "done"):**
  1. When a driver confirms a passenger onto their offer, the **driver sees that passenger's phone**
     and can tap to call.
  2. The **passenger sees the driver's phone** for the booking that was confirmed.
  3. **Nobody else sees anything new** — `pending` / `rejected` / `cancelled` exposes no number in
     either direction, asserted against the response rather than the screen.
  4. `GET /passenger/bookings?status=<junk>` stops returning **500** (see below).
  5. `tsc` at baselines: API **281** · admin **0** · user **9** · driver **35**.
- **Why now:** T-054 fixed exactly half the product. The owner's complaint — *"driver does not see
  passenger details to contact, and passenger does not see driver contact details"* — is just as true
  on this flow, which is the **main** one (a driver posting a ride and passengers booking seats).

## What is already there (verified 2026-08-11 — do NOT re-derive)
✅ **This is a near-perfect mirror of T-054, so the pattern is already written and tested:**
`OfferDriverService.gatePhones` + `utils/contactPhone.ts` (`dialPhone` / `formatContactPhone`) exist
in **both** apps.
✅ **The status vocabulary is IDENTICAL** — `OfferPassengerStatus` is
`'pending' | 'confirmed' | 'rejected' | 'cancelled'` (`models/OfferPassenger.ts:9`), the same four
values as `OfferDriverStatus`. The plan's open question is answered: **the gate transfers unchanged.**
🔴 **`phone_e164` is in ZERO of the `User` includes**, exactly as before — the same four-field list
at `OfferPassengerService` lines **53, 165, 211, 218, 243, 405, 606, 635, 696, 703**.
✅ **The two endpoints that need it** mirror T-054's pair:
- `getOfferPassengers(driverId, offerId)` **:589** — the driver's view. Ownership already enforced
  (403 via `DriverOffer.findOne({ id, user_id })`).
- `getPassengerBookings(passengerId, status?)` **:618** — the passenger's view; the driver arrives as
  `offer.user`.
🔴 **A THIRD defect, found while grounding — `GET /passenger/bookings?status=junk` is a 500.**
`OfferPassengerController:87-91` passes `req.query.status` through `as any` and the service assigns it
straight to `where.status` (**:621-623**) with **no allow-list**. `status` is a Postgres **enum**, so
an unknown value raises *"invalid input value for enum"* — a 500 for a typo in a query string.
✅ **The sibling function already solves this**, with a comment saying why:
`OfferDriverService.getDriverJoinRequests:566` filters against an explicit `allowed` array.
⚠️ **`getPassengerBookings` puts NO `attributes` filter on the `DriverOffer` include** (:629), so
moderation columns — `rejection_reason`, `reviewed_by`, `reviewed_at` — ship to the passenger. Less
serious than T-054's `payer_phone` (no third party's data), but it is admin metadata about the
driver's offer with no reason to be there.
✅ **Both screens already branch on `confirmed`:** `OfferPassengersScreen:161` (`isConfirmed`) and
`MyBookingsScreen:210`. There is a place to put the block in each.

## Approach
Identical to T-054, deliberately — the point is one pattern, not two.
- A private `gatePhones` in `OfferPassengerService`, taking the rows and a `contactOf` picker
  (`row.passenger` vs `row.offer.user`), blanking `phone_e164` on anything not `confirmed`, editing
  the **plain object** from `get({ plain: true })`.
- ⚠️ **Do NOT export T-054's helper across services.** They are separate models with separate
  includes; sharing would couple two services to keep one function DRY. Mirror it, and say so in the
  comment so the pair stays in step.
- Apps: reuse `contactPhone.ts` unchanged. No new components.

## Steps
- [x] 1. **DONE 2026-08-11. `OfferPassengerService.gatePhones()`** — a deliberate **twin** of
  T-054's, with a comment saying so: the two services own different models and includes, so they are
  mirrored rather than shared. Edits the **plain object** from `get({ plain: true })`.
- [x] 2. **DONE 2026-08-11. `getOfferPassengers`** — `phone_e164` on the `passenger` include, gated.
  🔴 This endpoint returns **every** request on the offer, so the suite's defining check is 4 rows in
  / exactly 1 phone out, with the **rejected** passenger's number proven absent from the JSON.
- [x] 3. **DONE 2026-08-11. `getPassengerBookings`** — gated on `offer.user`, **plus** the two
  defects found while grounding: the `status` **allow-list** (the 500) and an `attributes` exclude
  for `rejection_reason` / `reviewed_by` / `reviewed_at`.
- [x] 4. **DONE 2026-08-11. Driver app** — `OfferPassengersScreen`'s confirmed row gains the contact
  block; `contactPhone.ts` reused unchanged.
- [x] 5. **DONE 2026-08-11. User app** — `MyBookingsScreen`'s confirmed booking gains the same.
  🔴 **The type declared only the mapped `driver` shape**, but this endpoint returns the **raw
  model**, where the driver is `user` — the same two-shapes trap as T-042. Added `user?` alongside,
  documented the boundary, and read it through a new **`driverPhoneOf()`** helper.
  ⚠️ `driver` was deliberately left **required**: the three existing readers
  (`OfferDetailsScreen`, `SearchOffersScreen`) use the browse/detail endpoints, which do send it.
- [x] 6. **DONE 2026-08-11. i18n** — `offerPassengers.contactTitle`/`noPhone` (driver) and
  `myBookings.contactTitle`/`noPhone` (user), ×3 locales. **253/253 evaluated**, and the insertion
  point was **verified per block** — a naive append would have landed them in T-054's
  `myJoinRequests`.
- [x] 7. **DONE 2026-08-11. 49/49, proven able to fail — 25 red.**
  `tsc` API **281** · admin **0** · user **9** · driver **35**, all at baseline, **zero errors in any
  touched file**.
  The suite drives the **real transpiled service** — the actual `getOfferPassengers` and
  `getPassengerBookings`, not the helper alone — asserting the include really requests the column,
  that ownership still 403s, that an unknown status **fails closed**, and that `JSON.stringify` of
  each response carries no unconfirmed number.
  🔴 **The 500 is covered both ways:** 6 junk values proven never to reach `where`, and all 4 real
  values proven still to filter — a guard that refused everything would have passed a weaker test.
  ⚠️ The suite carries a stand-in for the missing helper so the pre-change run **reports red instead
  of crashing**.
- [ ] 8. **Owner:** deploy the API, rebuild both apps, walk confirm → both sides see + can dial.
- [ ] 9. Commit (only after the owner's approval).

## Files to touch
- `api,admin,db/apps/api/src/services/OfferPassengerService.ts` — gate + 2 endpoints + status guard
- `driver-app-standalone/screens/OfferPassengersScreen.tsx` (+ its api types)
- `user-app-standalone/screens/MyBookingsScreen.tsx` (+ its api types)
- `{user,driver}-app-standalone/translations/{uz,ru,en}.ts`
- ❌ **No migration.** ❌ No new route. ❌ `utils/contactPhone.ts` is reused **unchanged**.
- ❌ **`OfferDriverService` must not be touched** — T-054 is device-unverified; do not disturb it.

## Risks / open questions (READ before coding)
- 🔴 **This adds personal data to an API response.** Every new field is gated **server-side** on
  `status === 'confirmed'`. An app-side hide still ships the number over the wire.
- 🔴 **`getOfferPassengers` returns EVERY passenger on the offer**, not just confirmed ones — an
  ungated include hands the driver the phone number of everyone who ever requested a seat.
- 🔴 **Blanking must happen on the plain object.** A model instance's getter still returns the
  column; this is where the "fix" silently does nothing. T-054's suite asserts both halves — mirror
  that assertion.
- ⚠️ **`phone_e164` can be `null`** (Google SSO). Both screens need the empty case.
- ⚠️ **T-054 and this card will be deployed together and are UNTESTED on a device.** If the owner's
  walk of T-054 finds the gate wrong, the same bug is here twice.
- ⚠️ Both apps carry near-identical screens — every app change is made twice.
- ⚠️ **A FIFTH card now needs the same API deploy** (T-034, T-043, T-045, T-054, this). Still no
  migration in any, so they remain safe to ship together.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).

## Session notes (one line per work session)
- **2026-08-11** — card opened straight after T-057. Grounded: a **near-exact mirror** of T-054, and
  the open question about status vocabulary is **answered — the four values are identical**. Found a
  **third defect the card did not ask for**: `?status=junk` on the bookings endpoint is a **500**,
  already solved once in the sibling service.
- **2026-08-11 (2)** — approved. **Steps 1-7 done.** A **fourth** defect surfaced while wiring the
  user app: the booking payload carries the driver as `user`, not the mapped `driver` the type
  declared — the T-042 two-shapes trap again.

## Resume point (for the next chat)
**Steps 1-7 DONE 2026-08-11. Only step 8 (owner: deploy + rebuild + walk) and step 9 (commit)
remain.**

**What changed:** the contact-details fix now covers **both** halves of the product. A driver sees the
phone number of a passenger they accepted; a passenger sees the driver's for a booking that was
confirmed. Nobody else sees anything new.

🔴 **Two defects were fixed that this card did not ask for:**
1. **`GET /passenger/bookings?status=junk` was a 500** — an unvalidated query string reaching a
   Postgres enum. The sibling endpoint already guarded it; this one did not.
2. **The user app's type declared only the mapped `driver` shape**, but this endpoint returns the raw
   model with `user` — the T-042 two-shapes trap. Now modelled and read through `driverPhoneOf()`.
⚠️ Also closed: moderation columns (`rejection_reason`, `reviewed_by`, `reviewed_at`) no longer ship
to the passenger.

🛑 **FIVE cards now share ONE API deploy: T-034, T-043, T-045, T-054, T-055.** No migration in any.
**What to check:** confirm a passenger onto your offer — the driver should see their number, the
*rejected* and *pending* ones should show none, and the passenger should see the driver's.

**Baselines:** API **281** · admin **0** · user **9** · driver **35**.
