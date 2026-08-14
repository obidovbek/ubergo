# 🎯 PLAN — T-081 (moved out of PLAN.md on 2026-08-14, intact)

> Moved when **T-087** took the active slot. Steps 1-4 were done on 2026-08-13; their boxes had
> never been ticked, which would have made `/next` re-run step 1 and write the migration a second
> time. **They are ticked here against verified code** — the migration file
> `20260813000003-add-salon-scope-to-offer-passengers.cjs` exists, and `salon_scope` is present in
> the controller, the service, the model, all three API locales and the user app.

## Task
- **ID / name:** T-081 — the driver's salon prices are write-only; no passenger can book one
- **Goal (definition of "done"):**
  1. A passenger choosing a ride picks **one of four things**: *Old o'rindiq*, *Orqa o'rindiq*,
     *Orqa salon*, *Butun salon* — as the `004 Tanlov oynasi` mockup draws it.
  2. Booking a **salon** is expressible, priced from the driver's own salon price, and takes the
     right number of seats out of the offer.
  3. A price the driver did not set is **not offered** — no tile appears for a salon that has no
     price.
  4. `tsc` at baselines: API **281** · admin **0** · user **6** · driver **28**.
- **Why now:** **T-078 shipped the salon prices and nothing can read them.** A driver can enter
  *Butun salon 450 000* today and no passenger can ever see or book it — a half-built feature is the
  worst state to leave the schema in.

## Decisions taken (2026-08-13 — Claude's call, owner delegated: *"ozing tanlab davom et"*)
1. **Adapt `OfferDetailsScreen`, do not build a second screen.** It already holds the whole booking
   flow (seat count, front-seat toggle, price preview, `joinOffer`). This is the owner's own T-077
   precedent — *one screen, reached from everywhere* — and this project already pays for duplicated
   screens (T-042/T-066/T-067).
2. **`salon_scope` is ONE new column on `offer_passengers`**, reusing the existing vocabulary
   `'whole_salon' | 'back_salon_full'` from `PassengerOfferSalonScope`.
   ✅ **The seat arithmetic needs no new columns:** a salon booking is expressed through the columns
   that already exist — `back_salon_full` → `seats_requested` = the back seats, `is_front_seat`
   false; `whole_salon` → `seats_requested` = `seats_total`, `is_front_seat` true. So
   `seats_free` accounting, the "only one front seat" rule and the cancel/restore path all keep
   working untouched. The new column only records **what was bought**, for price provenance and
   display.
3. **The driver info header (photo, age, experience, trip count) is NOT in this card.** Experience
   and trip count do not exist anywhere (**T-082**), and the screen already shows name, rating,
   vehicle, plate. Building half a header on invented data is what T-077 was corrected for.

## What is already there (verified 2026-08-13 — do NOT re-derive)
✅ **The prices exist and are already returned** — T-078 added `price_back_salon` /
`price_whole_salon` to the model and to the search mapper.
✅ **`OfferDetailsScreen` already books** — seats, front-seat toggle, a price preview and
`joinOffer`.
✅ **The vocabulary exists** — `'whole_salon' | 'back_salon_full'`.
🔴 **`OfferPassenger` cannot express a salon** — it has `seats_requested` and `is_front_seat` and
nothing else. That is the one real gap.
🔴 **The price is computed TWICE** — `OfferPassengerService:132-148` (authoritative) and
`OfferDetailsScreen:206,293` (the preview the passenger is shown). **Both must learn salon pricing
or they will disagree**, and the passenger would confirm one number and be charged another.

## Steps
- [x] 1. **DONE 2026-08-13. Migration** — `salon_scope` STRING(20) nullable on `offer_passengers`.
  No backfill: every existing booking genuinely is a per-seat one.
  ✅ **RAN CLEAN on test3 2026-08-13** (`20260813000003-add-salon-scope-to-offer-passengers.cjs`).
- [x] 2. **DONE 2026-08-13. API** — `joinOffer` accepts `salon_scope`, derives `seats_requested` /
  `is_front_seat` from it, and prices it from the offer's salon column.
  ✅ **Refuses a salon the driver never priced** (`salonNotOffered`, 400) rather than falling through
  to per-seat maths and inventing a total.
  ✅ **The client is not trusted for seats** — they are derived server-side from `seats_total` and
  whatever the app sent is discarded, so a passenger cannot buy a whole salon at one seat's price.
  ✅ The controller allow-lists the two known scopes, so an unknown string cannot reach the
  STRING(20) column.
- [x] 3. **DONE 2026-08-13. User app** — the tiles, and the preview price matched to the server's
  rule. ✅ A tile only appears when its price exists (goal 3).
- [x] 4. **DONE 2026-08-13. Verified.** **49/49** with the app's price lookup **executed**, **20 red**
  against pre-change behaviour. `tsc` API **281** · admin **0** · user **6** · driver **28**, all at
  baseline. Lint user **235 = baseline, 0 errors**. i18n evaluated ×3 locales.
- [ ] 5. **Owner:** run the migrations, deploy, rebuild the **user** app, book a salon, confirm the
  seat count drops correctly and the driver sees it.
- [ ] 6. Commit (only after the owner's approval).

## Risks / open questions (READ before coding)
- 🔴 **Two price calculators must agree.** The app previews, the server decides. They already
  duplicate the front-seat premium formula; adding salon pricing to only one is the obvious failure.
- 🔴 **A whole-salon booking takes EVERY seat**, including the front one. If `is_front_seat` is not
  set for it, the front seat stays "available" and could be sold twice.
- ⚠️ **`back_salon_full` needs the back-seat count**, which is `seats_total - 1` only when the driver
  offers a front seat — the same rule T-083 established. Reuse it; do not re-derive it differently.
- ⚠️ **Do not touch `seats_free` accounting.** Confirm/cancel already maintain it correctly; the
  whole point of decision 2 is that this card does not go near it.
- Environment: Avast breaks npm/Gradle/git TLS. `.claude/settings.json` stays out of commits.

## Session notes
- **2026-08-13** — chosen over T-079 because **T-078's prices are currently write-only**. Grounded
  first, and the grounding changed the shape: the salon booking needs **one** column, not a table,
  because the seat arithmetic maps onto columns that already exist.
- **2026-08-14** — moved out of `PLAN.md` intact when T-087 took the active slot. Steps 1-4 ticked
  after verifying the code is really there.

## Resume point (for the next chat)
**STEPS 1-4 DONE 2026-08-13. Only step 5 (owner: run the migrations, deploy, rebuild the USER app,
book a salon) and step 6 (commit) remain.**

**What changed:** T-078's salon prices were **write-only** — a driver could enter *Butun salon
450 000* and nobody could buy it. A passenger now picks *O'rin bo'yicha* / *Orqa salon* /
*Butun salon*, and the booking is priced from the driver's own number.

🔴 **The two dangers this card carried, and how each is closed:**
① **Two price calculators.** The app previews, the server decides, and they already duplicated the
front-seat formula. Both now take the salon total from the **same column, whole**, with no per-seat
arithmetic — asserted by a check that compares them directly. *Pre-change, the app would have shown
120 000 × 3 = 360 000 for a salon the driver priced at 320 000.*
② **Buying a salon at one seat's price.** The server **derives** `seats_requested` and
`is_front_seat` from the offer and discards whatever the client sent.
⚠️ **`whole_salon` claims the front seat too** — without that it stays "available" and could be sold
on top of a booking that already includes it.
⚠️ **A salon the driver never priced is not offered and is refused server-side**
(`salonNotOffered`), rather than silently falling through to per-seat maths.
⚠️ **`seats_free` accounting was not touched** — the whole point of the one-column design.

**Verification:** **49/49** with the app's price lookup **executed**, **20 red** against pre-change
behaviour. `tsc` API **281** · admin **0** · user **6** · driver **28**, all at baseline. Lint user
**235 = baseline, 0 errors**.

✅ **Its migration RAN CLEAN on test3, 2026-08-13** (`…0003`), along with the other three.
🛑 **Only the USER app rebuild and the device walk remain.**
