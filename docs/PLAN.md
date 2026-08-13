# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-078 moved intact → `docs/PLAN-T078.md`** (steps 1-5 done; the owner's migration, deploy,
> driver rebuild and the commit remain). ✅ **T-077** → `docs/PLAN-T077.md`.
> ✅ **T-065** → `PLAN-T065.md`. ✅ **T-066+T-067** → `PLAN-T066-T067.md`. ✅ **T-061** →
> `PLAN-T061.md`. ✅ **T-059 · T-055 · T-057 · T-054 · T-045 · T-024** → their own files.
> 🔴 **T-047 PARKED.** 🟡 **T-031** — items 5-6 done, item 4 **cancelled** → `PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own files.

## 🔴 BOARD STATE 2026-08-13 — read before starting anything

**`tsc` BASELINES: API 281 · admin 0 · user 6 · driver 28.** Both RN apps lint at **0 errors**.

🔴 **THREE MIGRATIONS ARE WRITTEN AND UNRUN** — T-046's repair,
`20260813000001` (passenger payment split), `20260813000002` (driver prices/payment/class).
**This card adds a FOURTH.** ⚠️ **None can be tested from the dev machine**, so the risk compounds:
say so plainly, and keep the ordering rule visible — **deploy → migrations → rebuilds.**

**Done 2026-08-13, all code-complete and untested:** T-075 · T-035 · T-032/T-060 · T-076 ·
T-031 items 5-6 · T-077 · **T-083** · **T-078**.

---

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
- [ ] 1. **Migration** — `salon_scope` STRING(20) nullable on `offer_passengers`. No backfill: every
  existing booking genuinely is a per-seat one. ⚠️ **The FOURTH unrun migration.**
- [ ] 2. **API** — `joinOffer` accepts `salon_scope`, derives `seats_requested` / `is_front_seat`
  from it, and prices it from the offer's salon column.
  🔴 **Refuse a salon the driver never priced** — booking *Butun salon* on an offer with no
  `price_whole_salon` must 400, not fall through to per-seat maths and invent a total.
  ⚠️ **The client must not be trusted for seats**: derive them server-side from `seats_total`,
  ignoring whatever `seats_requested` the app sent, or a passenger could buy a whole salon at
  one seat's price.
- [ ] 3. **User app** — the four tiles, and the preview price matched to the server's rule.
  ⚠️ **A tile only appears when its price exists** (goal 3).
- [ ] 4. **Verify.** `tsc` ×4 against the baselines; a suite that **executes** the salon seat/price
  derivation (including "salon not priced", whole-salon-takes-every-seat, and preview-vs-server
  agreement), proven able to fail; i18n **evaluated** ×3 locales.
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

🔴 **This is the FOURTH unrun migration** (T-046 · `…0001` · `…0002` · `…0003`) — none can be tested
from the dev machine. **Order: deploy → migrations → rebuilds.**
