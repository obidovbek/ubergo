# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-077 moved intact → `docs/PLAN-T077.md`** (steps 1-6 done; the owner's API deploy, user-app
> rebuild and the commit remain).
> ✅ **T-065** → `docs/PLAN-T065.md`. ✅ **T-066 + T-067** → `docs/PLAN-T066-T067.md`.
> ✅ **T-061** → `docs/PLAN-T061.md`. ✅ **T-059** → `docs/PLAN-T059.md`.
> ✅ **T-055** → `docs/PLAN-T055.md`. ✅ **T-057** → `docs/PLAN-T057.md`.
> ✅ **T-054** → `docs/PLAN-T054.md`. ✅ **T-045** → `docs/PLAN-T045.md`. ✅ **T-024** → `PLAN-T024.md`.
> 🔴 **T-047 PARKED** — killed-app push tap; needs a `logcat` line before more code.
> 🟡 **T-031** — items 5-6 done 2026-08-13; **item 4 (the waiting-fee admin setting) is CANCELLED**
> (see below) → `docs/PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own
> `docs/PLAN-T0*.md`; most are waiting on the owner, not on code.

## 🔴 BOARD STATE 2026-08-13 — read before starting anything

**`tsc` BASELINES: API 281 · admin 0 · user 6 · driver 28.** (Were 281/0/9/35 — T-035, T-060 and
T-076 removed real errors.) **Any "user 9 / driver 35" written elsewhere is STALE.**
✅ **Both RN apps now lint, at 0 errors** (T-060 — they could not run at all before).

**Done 2026-08-13, all code-complete and untested:** T-075 · T-035 · T-032/T-060 · T-076 ·
**T-031 items 5-6** · **T-077**.
🔴 **ONE MIGRATION IS WRITTEN AND NOT RUN** —
`20260813000001-split-passenger-offer-payment-flags.cjs`. ⚠️ **T-046's migration is also queued.**
**Order: deploy → migrations → rebuild both apps.**
⚠️ **T-076 removed a native dep + an Expo plugin, so the driver rebuild is mandatory, not JS-only.**

---

## Task
- **ID / name:** T-078 — a driver cannot say what a seat, a salon or a wait actually costs
- **Goal (definition of "done"):**
  1. A driver posting an offer can set **Orqa salon** and **Butun salon** prices, not just the two
     per-seat ones.
  2. A driver can set **kutish** (waiting) — so'm/minute and free minutes — and **joyidan olish**
     (door pickup).
  3. A driver can say **how they take payment** (Naqd · Click/Payme), both selectable.
  4. A driver can state the **vehicle class** (Standart / Comfort / Biznes / Econom / Turistik).
  5. All of it survives a round trip: saved, returned by the API, and re-loaded into the edit form.
  6. `tsc` at baselines: API **281** · admin **0** · user **6** · driver **28**.
- **Why now:** the owner's `D_Elon berish` mockup, 2026-08-13. It is **card 1 of 5** and comes first
  because the passenger's selection window (`004 Tanlov oynasi`) is built entirely out of these
  prices — it cannot start until they exist.

## Owner decisions (2026-08-13 — do NOT re-ask)
1. **The driver enters the waiting fee**, not an admin. 🔴 **This REVERSES the decision of
   2026-08-02** (T-031 item 4: *"the waiting fee becomes an admin setting… not a passenger input"*).
   **T-031 steps 8-9 are cancelled**, not merely parked — say so on that plan.
2. **The work is split into 5 cards**, not one big one, each leaving the app runnable:
   **T-078 prices + payment + class** → T-079 amenities + jo'natma → T-080 time windows + srochno
   → T-081 the passenger's selection window → T-082 driver experience / trip count.
3. 🔴 **The waiting fee is DISPLAYED, NOT CHARGED** (owner, 2026-08-13, confirming the 2026-08-02
   rule *"stored but not counted"*). The passenger sees *"minutiga 1 000 so'm"*; **no code adds it
   to any total.** Metering a real wait needs arrival/boarding timestamps — a separate, much larger
   piece of work. ⚠️ **Store it as a rate, never as an amount owed**, and do not let it reach any
   sum. If a later card starts billing on it, that must be the owner's explicit decision.
4. **Payment methods are informational for now** — the passenger's flags and the driver's are **not
   matched or filtered** against each other. ⚠️ Do not quietly build matching into this card; if the
   two should have to agree, that is its own decision.

## What is already there (verified 2026-08-13 — do NOT re-derive)

🔴 **The driver's offer is a stub next to the passenger's.** `DriverOffer` carries ~20 columns;
**`PassengerOffer` carries 51.** Everything in this mockup exists on the passenger side already —
*the driver half of the product was never built to match.*

✅ **The names and the shape are ALREADY DECIDED — mirror them, do not invent.**
`PassengerOfferSpecialOrder` (`PassengerOffer.ts:42-51`) is literally:
`price_front · price_back · price_back_salon · price_whole_salon · waiting_fee_per_min ·
free_waiting_min`. **Four of this card's columns are named there.** Using different names would make
the two halves of the same concept un-joinable.

✅ **The two per-seat prices already exist and need no work:** `front_price_per_seat` = *Old
o'rindiq*, `price_per_seat` = *Orqa o'rindiq*. Both are already returned by the search endpoint and
rendered by T-077's card.

✅ **The payment flags are a straight mirror of T-031** (`payment_cash` / `payment_card`, done
2026-08-13 on the passenger side) — same names, same booleans, same "at least one" question.

✅ **The class values already exist** as `PassengerOfferVehicleClass`:
`standard | comfort | business | econom | tourist` — exactly the mockup's five radios. ⚠️ On the
passenger side this means *what the passenger wants*; here it means *what the driver drives*. **It is
the column T-077 needed and could not have** (its chips were dropped for exactly this reason).

✅ **The wizard already does multi-city and stops** (`selectedFromCities`, `selectedToCities`,
`stops`) — the mockup's `+` rows are built.

### The gaps this card closes
🔴 `driver_offers` has **no** `price_back_salon`, `price_whole_salon`, `waiting_fee_per_min`,
`free_waiting_min`, `pickup_fee`, `payment_cash`, `payment_card`, `vehicle_class`. **Eight columns.**
🔴 `CreateOfferData` (`driver-app-standalone/api/driverOffers.ts:60`) carries **10 fields total** —
none of the above.
🔴 `OfferWizardScreen` is **3517 lines** and its `formData` initialises **9 keys**.

## Approach
One migration adding the eight columns (all nullable / defaulted, so existing offers stay valid),
then the API accept/return path, then the wizard's price + payment + class blocks. Names mirrored
from `PassengerOfferSpecialOrder` and T-031. **The passenger's selection window is NOT in this card.**

## Steps
- [x] 1. **Migration** — eight columns on `driver_offers`: `price_back_salon`, `price_whole_salon`,
  `waiting_fee_per_min`, `free_waiting_min`, `pickup_fee` (DECIMAL, nullable), `payment_cash`,
  `payment_card` (BOOLEAN default false), `vehicle_class` (STRING(20), nullable).
  ⚠️ **Nullable/defaulted, no backfill guesses** — an existing offer genuinely has no salon price,
  and inventing one would put a number in front of a passenger that the driver never agreed to.
  ⚠️ **Ask before running it.** ⚠️ Mirror `payment_type`'s precedent: **STRING(20), not a PG enum**
  (the 2026-08-13 finding — the passenger side is a plain string and it made T-031 far cheaper).
- [x] 2. **Model + API accept/return.** Add the eight to `DriverOffer`, to the create/update
  whitelist, and to **both** the search mapper and the detail mapper.
  🔴 **DECIMAL comes back from pg as a STRING** (`'150000.00'`) — the 2026-08-02 root cause, hit
  again in T-077. Parse on the way in, and let the app's `priceOf()` guard on the way out.
  ⚠️ **`front_price_per_seat` already has a `>= price_per_seat` rule** (`DriverOfferService:126`) —
  decide whether the salon prices get an ordering rule too, and say so rather than leaving it silent.
- [x] 3. **Wizard: the price block.** *Orqa salon*, *Butun salon*, *Kutish* (so'm/minut + bepul
  minut), *Joyidan olish* — laid out as the mockup's `Narxlar` list.
  ⚠️ The screen is **3517 lines** and is also the EDIT form; every new field must load back into it,
  or a driver editing an offer would silently blank their own prices.
- [x] 4. **Wizard: payment + class.** Naqd / Click,Payme as **independent** checkboxes (T-031's
  lesson: one shared value makes them behave as a radio group), and the five classes as one radio.
- [x] 5. **Verify.** `tsc` in all four projects against the baselines above; a suite that
  **executes** the price parsing and the round trip (DECIMAL-as-string, missing salon price, both
  payment flags, every class value), proven able to fail; i18n **evaluated** in uz/ru/en.
- [ ] 6. **Owner:** run the migration, deploy the API, rebuild the **driver** app, then post an
  offer with a salon price and a waiting fee, re-open it for edit, and confirm nothing was lost.
- [ ] 7. Commit (only after the owner's approval).

## Files to touch
- **NEW** migration in `api,admin,db/apps/api/src/database/migrations/`
- `api,admin,db/apps/api/src/database/models/DriverOffer.ts`
- `api,admin,db/apps/api/src/services/DriverOfferService.ts` — validation + both mappers
- `driver-app-standalone/api/driverOffers.ts` — `CreateOfferData`
- `driver-app-standalone/screens/OfferWizardScreen.tsx` — the price / payment / class blocks
- `driver-app-standalone/translations/{uz,ru,en}.ts`
- ⚠️ `user-app-standalone/api/offers.ts` — the type only, so T-081 can read the prices later.
- ❌ **The passenger's selection window is NOT in this card** (T-081).

## Risks / open questions (READ before coding)
- 🔴 **This is a MIGRATION card and the owner runs migrations.** Two are already queued and unrun
  (T-031's payment split, T-046's repair). **This one makes three** — say so plainly, and keep the
  ordering rule visible: **deploy → migrations → rebuilds.**
- 🔴 **`OfferWizardScreen` is 3517 lines and serves BOTH create and edit.** The commonest way this
  card fails silently is a field that saves but never loads back, so the next edit wipes it.
  Step 5 must prove the round trip, not just the save.
- ⚠️ **Do not rename `front_price_per_seat` / `price_per_seat`** to match the mockup's wording. They
  are live, already returned to the passenger app and rendered by T-077. A rename is a separate,
  riskier card.
- ⚠️ **The class column will make T-077's dropped chips buildable.** That is a *later* card, not a
  reason to widen this one — but note it on T-077 so the connection is not lost.
- ⚠️ **`vehicle_class` means different things on the two models** (wanted vs owned). Comment it, or
  a future join will quietly compare the wrong pair.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` keeps picking up permission-prompt changes — keep it out of commits.

## Session notes (one line per work session)
- **2026-08-13 (2) — MEANING REVIEW at the owner's request** (*"hammasi mano jihatdan joyidami"*),
  and it found three things a code review would not have:
  ① **T-077's grey price means the wrong thing** — "no price set" instead of "seat taken" → **T-083**,
  to be fixed *before* the owner walks that screen.
  ② **`is_urgent` was one step from being mirrored into a lie** — the driver's *"to'lishi bilan
  yuraman"* means *when the car fills*, not *now* → T-080 gets `departs_when_full` instead.
  ③ **The waiting fee is a rate to display, not money to charge** — confirmed, and written into the
  decisions above so no later card quietly sums it.
  🟡 Also corrected my own earlier claim that the seat squares "have no backing data": the *count*
  is derivable, only the exact position is not.
- **2026-08-13** — card created from the owner's `D_Elon berish` mockup and grounded the same day.
  **The driver's offer turned out to be a stub next to the passenger's** (20 columns vs 51), and
  **four of the eight new column names are already written down** in
  `PassengerOfferSpecialOrder` — so this is mirroring, not designing. **A contradiction was found
  and settled rather than guessed:** the waiting fee was decided as an *admin* setting on
  2026-08-02, but this mockup has the *driver* enter it; the owner reversed the old decision, so
  **T-031 steps 8-9 are cancelled.**

## Resume point (for the next chat)
**APPROVED AND STEPS 1-5 DONE 2026-08-13. Only step 6 (owner: run the migration, deploy, rebuild the
DRIVER app, walk create → edit) and step 7 (commit) remain.**

**What changed:** a driver can now price **Orqa salon** and **Butun salon**, set **kutish**
(so'm/minut + bepul minut) and **joyidan olish**, say whether they take **Naqd** and/or
**Click/Payme** (independently — T-031's lesson), and state the **avto sinfi**.

🔴 **TWO DECISIONS THAT DIFFER FROM THE PLAN AS WRITTEN, both deliberate:**
① **The payment flags are NULLABLE, not `NOT NULL DEFAULT false`.** Three states, not two —
`null` = never asked (every offer predating this card), `false` = the driver refuses it. Defaulting
to `false` would make every existing offer claim it takes neither cash nor card, which no driver ever
said. *This is T-083's lesson from the same day, applied at schema level.*
② **The salon prices are REAL COLUMNS, not a JSONB blob**, even though the passenger side keeps its
copies inside `special_order`. There they are an optional extra; here they are the core product,
filtered and shown to every passenger.

⚠️ **`price_whole_salon >= price_back_salon` is enforced** (the whole car contains the back of it).
**Deliberately NOT enforced:** that a salon must undercut its seats bought singly — usually true, but
a premium for exclusivity is the driver's call, not this service's.
⚠️ **`0` is a real answer** for `pickup_fee` and `free_waiting_min` — hence `numOrUndef` rather than
`|| undefined`, which silently destroys it.
🔴 **The waiting fee is SHOWN, NEVER CHARGED**, and the helper text says so in all three locales.

**Verification:** **88/88** with `numOrUndef` **executed**, **20 red** against pre-change behaviour
(the lost `0` and the lost `false` among them). `tsc` API **281** · admin **0** · user **6** ·
driver **28**, all at baseline. Lint driver **304 = baseline, 0 errors**.

🔴 **THIS IS THE THIRD UNRUN MIGRATION** —
`20260813000002-add-driver-offer-prices-payment-class.cjs`, joining T-031's and T-046's.
**Order: deploy → migrations → rebuilds.**

**This is card 1 of 5**, agreed with the owner: **T-078 prices + payment + class** → T-079 amenities
+ jo'natma → T-080 time windows + srochno → T-081 the passenger's selection window → T-082 driver
experience / trip count. Prices come first because **T-081 is built entirely out of them.**

🔴 **It needs a THIRD unrun migration.** Two are already waiting (T-031's payment split, T-046's
repair). ⚠️ **The driver app rebuild is already mandatory** because T-076 removed a native dep.
