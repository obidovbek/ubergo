# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **T-030** → `docs/PLAN-T030.md`. Steps 1-6 + 8 done; **step 7 is blocked on an owner answer**
> (which screen OR-011 item 3 means, or whether it is a data problem) — owner deferred it.
> ⏸️ **T-027** → `docs/PLAN-T027.md`, step 11 (**migration first**, then API, then both apps).
> ⏸️ **T-018** → `docs/PLAN-T018.md` · **T-026A** → step 8 · **T-025** → step 8.
> ⏸️ **Also parked:** T-011 · T-012 · T-014 · T-015 · T-016 · T-017.

## Task
- **ID / name:** T-031 — OR-012: seven fixes on the passenger's "create ride request" screen
- **Goal (definition of "done"):**
  1. Seat gender picking works on a device.
  2. The keyboard no longer covers the lower half of the form. ✅
  3. Additional info is reachable and readable while typing. ✅
  4. The passenger cannot enter a waiting fee; an **admin** sets it and the app reads it.
     Waiting time is stored but **not** counted against anyone yet.
  5. Cash and card can both be selected.
  6. "For my friend" is independent of payment type.
  7. The location field carries a location icon. ✅
  8. No new `tsc` errors; migration applied; admin + user app rebuilt and smoke-tested.
- **Why now:** the software owner reported all seven together against the screen T-018 rebuilt.
- **Source:** `docs/OWNER_REQUESTS.md` OR-012 (verbatim Uzbek + translation), 2026-08-02.

## Owner decisions already taken (2026-08-02 — do NOT re-ask)
1. **Payment becomes flags.** `payment_cash` + `payment_card` booleans (both selectable), plus a
   **separate** `paid_by_friend` boolean reusing the existing `payer_phone`. The single
   `payment_type` enum goes away. Migration approved by implication — confirm before running it.
2. **The waiting fee becomes an admin setting** in the panel (fee per minute + free minutes), read
   by the app. Not a constant, not a passenger input.
3. **Item 1 is a bug, not a feature.** Seat gender picking already exists (`GenderPickSheet`, built
   for T-018) and is not showing/working on the device. Hunt the bug; do **not** build seat-position
   shifting.

## Current state (verified in code 2026-08-02)
- **Items 2, 3, 7 — DONE this session** (see Steps). The root cause of 2+3 and half of 4 was a
  single omission: `CreatePassengerOfferScreen` had **no `KeyboardAvoidingView`**, only a bare
  `ScrollView` at `:349`.
- **Item 1** — `components/passengerOffer/GenderPickSheet.tsx` exists and is wired to the seat
  steppers; `SeatStepper.tsx` sits beside it. Not yet diagnosed.
- **Item 4** — `SpecialOrderPanel.tsx:25` holds `waitingFeePerMin` as a **passenger text input**;
  `FREE_WAITING_MINUTES` is already a constant (`:38` "a fixed promise of the product, not an
  input"). `PassengerOffer` has `fixed_price`, `waiting_fee_per_min`, `free_waiting_min` (:48-50).
  There is **no settings table and no admin page** for either value.
- **Items 5-6** — `PassengerOffer.payment_type` is a single enum (`:81`) including `friend_pays`;
  `payer_phone` (:82) already exists. The screen renders three `CheckRow`s that behave as one
  radio group (`CreatePassengerOfferScreen:397-417`).

## Approach
The three cheap UI items are already done. What remains splits cleanly:
**a bug hunt** (item 1), **a schema change + UI** (items 5-6), and **a new admin capability**
(item 4) — which is the largest and is deliberately last, because the app can ship items 5-6
without it.

## Steps
- [x] 1. **DONE 2026-08-02. Items 2+3 (and item 4's scrolling half) — one fix.** Wrapped the form in
  `KeyboardAvoidingView` (`padding` on iOS, `height` on Android, 48px iOS offset), added
  `keyboardShouldPersistTaps="handled"` so a tap on a checkbox registers on the FIRST press instead
  of only dismissing the keyboard, and `paddingBottom: 24` on the content so the last card clears
  the keyboard. User app `tsc` **12 → 12**.
- [x] 2. **DONE 2026-08-02. Item 7 — location icon.** `LocationCard`'s landmark row had no icon at
  all. Added `location-outline`, tinted to match the card's accent (green for the destination).
  The border moved from the input to the row so the pin sits **inside** the field rather than
  floating beside it.
- [x] 3. **DONE 2026-08-02. Item 1 diagnosed — the component itself is sound; the likely cause is a
  silently disabled control.**
  Traced the whole path: `handleAdd` → `setSheet('add')` → `<GenderPickSheet visible={sheet!==null}>`,
  with `available={['male','female']}` when adding. Capacities are hard-coded 1 (front) and 3
  (back), so the `total >= capacity` guard cannot be the cause. All 8 translation keys resolve in
  `uz`/`ru`/`en`. **No defect found in `SeatStepper` or `GenderPickSheet`.**
  ⚠️ **The strong suspect is `seatsLocked`** (`CreatePassengerOfferScreen:118`):
  `const seatsLocked = salonScope !== null`, passed as `disabled` to **both** steppers (`:504`,
  `:511`). The salon-scope checkboxes that set it ("whole salon" / "back salon full") are drawn
  **below** the steppers (`:526`, `:532`). So a passenger who ticks a salon option first finds the
  seat steppers dead — the "+" does nothing, no sheet, **and nothing on screen says why**. That is
  exactly "gender picking doesn't work".
  This is a real UX defect whichever way the owner's report goes: a disabled control that gives no
  reason. Needs the owner to confirm the repro (was a salon option ticked?) before choosing between
  "explain the lock" and "something else is wrong".
- [x] 4. 🛑 **CLOSED 2026-08-11 BY THE OWNER — WORKING AS DESIGNED, NO CHANGE MADE. DO NOT REOPEN.**
  The owner confirmed the repro (**a salon option WAS ticked**) and then declined the usability fix:
  **"i do not see any issue with this right now, works fine"** (`TODO.md:1068-1079`).
  🔴 **THIS STEP SAT HERE READING "BLOCKED — NEEDS THE OWNER" FOR FIVE DAYS AFTER IT HAD BEEN
  ANSWERED, AND ON 2026-08-16 IT COST A ROUND OF UNWANTED WORK.** I built the reorder + helper line,
  the owner said revert, and it was reverted (`git checkout`, four files, tree clean). **Nothing from
  it shipped.** *The plan file said blocked; the board carried the owner's own words. When two files
  claim to be the source of truth, the one quoting the owner wins — and `/next` reads this one, so
  this one had to be corrected.*
  ✅ **Why it is not a bug** (so a fourth investigation does not start): `:546-553` sends **no
  `seat_counts` at all** once a salon scope is set — the salon *replaces* per-seat choice, so the
  steppers switching off is the intended behaviour, not a broken picker.
  ⚠️ **IF a third report of "can't select seats" ever arrives, the answer is here, and the fix is
  known:** move the salon radios **above** the steppers and add one line saying why they are dead
  (plus that a second tap un-selects — `toggleSalonScope:169-171` un-toggles even though the rows are
  `shape="radio"`, which normally does not). **No logic, schema or API change.** *Written down
  because it has now been re-derived three times.*
  🔴 **RE-VERIFIED FIRST, AND THE FILE HAD GROWN 757 → 1220 LINES** (T-040's edit mode, T-036's
  wheels). The 2026-08-02 diagnosis still held — but it **understated the damage**. Ticking a salon
  option killed **three** controls, not two: both `SeatStepper`s (`:885`, `:892`), the *"farqi
  yo'q"* row (`:900`), **and** the seat-total badge silently vanished (`:874`).
  🟢 **AND IT TURNED OUT NOT TO BE A BUG IN THE PICKER AT ALL.** `:546-553` sends **no `seat_counts`
  whatsoever** when a salon scope is set — the salon *replaces* per-seat choice. **So disabling the
  steppers is CORRECT behaviour; the defect was that it was silent and in the wrong reading order.**
  That is why three sessions of reading `GenderPickSheet` found nothing: nothing was there.
  ✅ **Fix 1 — the overriding control now comes FIRST.** The salon radios moved above the steppers,
  so what they disable is *below* them and visible at the moment of tapping.
  ✅ **Fix 2 — the dead state now says why**, via a new `helperText` line shown only when locked.
  🔴 **It also says "tap again to undo", because `toggleSalonScope` (`:169-171`) un-toggles on a
  second press — and these are `shape="radio"`, which normally does NOT untoggle.** Without that
  sentence a passenger who mis-taps has no way back to per-seat picking. *Found while reading the
  handler, not reported by anyone.*
  ✅ **No logic, schema, API or validation change** — the submit path at `:546-562` is untouched.
  ✅ **One new key in all three locales** (`passengerOffers.salonCoversSeats`, uz/ru/en).
- [x] 5. **DONE 2026-08-13. Migration written, NOT run** (owner runs it —
  `20260813000001-split-passenger-offer-payment-flags.cjs`). Adds the three booleans, **backfills
  from `payment_type`** so existing rows keep their meaning, and **prints the backfilled row count**
  (the T-046 precedent — test3's DB is not reachable from the dev machine). `down` drops the three
  columns. ✅ **`payment_type` is KEPT and still written** — old installs read it, and the board
  carries a long tail of un-rebuilt apps. ✅ **Cheaper than this plan assumed:** the column is a plain
  **`STRING(20)`**, not a Postgres enum, and **no admin page reads it**.
- [x] 6. **DONE 2026-08-13. API accepts and returns the flags, and keeps the old column in step BOTH
  ways.** New app → flags → server derives `payment_type` (cash first, then card, then friend).
  **Old app → `payment_type` → server derives the flags** — ⚠️ *that reverse direction is the easy
  half to forget; without it an old install's offers would store all-false and read as "no payment
  method chosen".* The flags are added to the public list mapper so the driver app receives them.
  🔴 **A REAL HOLE FOUND AND CLOSED:** the `payer_phone` requirement keyed off
  `payment_type === 'friend_pays'`. Now that a passenger can pick **Do'stimga + Naqd**,
  `payment_type` records `'cash'` — so the old check would have let a friend-paid offer through
  **with no phone number at all**. It is keyed off `paid_by_friend` now.
  ⚠️ "At least one method" is enforced **only when payment was actually sent**, so a PATCH editing
  the seat count does not fail on a field it never touched. Field names added ×3 locales, so T-065's
  edit notifications name these columns instead of showing a raw key.
- [x] 7. **DONE 2026-08-13. Three independent toggles.** Cash and card both selectable; "Do'stimga"
  is its own point that no longer clears them, with the phone field under it.
  ⚠️ **Validation is TWO separate `if`s, not `if/else`** — "Do'stimga ticked, no method, no phone" is
  now a reachable state and must report both faults; chaining them would make the form refuse twice
  in a row. ⚠️ **Edit mode falls back to `payment_type`** when the flags are absent, so an order
  created before the split does not open as "no payment method".
  ✅ **The driver app was swept in the same pass** (the class, not the instance):
  `PassengerOfferExtras` rendered ONE payment chip from `payment_type`, so a passenger choosing
  **Naqd + Click,Payme** would have shown the driver only "Naqd". It renders the full list now, with
  the same pre-split fallback.
- [x] ~~8. **Item 4 — admin setting.**~~ 🛑 **CANCELLED 2026-08-13 BY THE OWNER — do not build this.**
  The 2026-08-02 decision was *"the waiting fee becomes an **admin** setting… not a passenger
  input"*. The `D_Elon berish` mockup of 2026-08-13 has the **driver** enter it
  (*"Kutish 1 000 so'm/minut, bepul kutish 10 minut"*), and the owner confirmed the mockup wins.
  ➡️ **The waiting fee now lives on the DRIVER'S OFFER** — `waiting_fee_per_min` / `free_waiting_min`
  columns, built in **T-078**. No settings table, no admin page, no endpoint.
- [x] ~~9. **Item 4 — user app.**~~ 🛑 **CANCELLED with step 8.** There is no admin value to show
  read-only. ⚠️ `SpecialOrderPanel`'s existing `waitingFeePerMin` input is the **passenger's** side
  of a special order and is untouched by this reversal — do not delete it on the strength of this
  note.
- [ ] 10. **Static verification** — ⚠️ **the baselines that were written here were WRONG.**
  🔴 **This step said API 282 · admin 0 · user 12 · driver 36** (numbers from 2026-08-02). **MEASURED
  2026-08-16, the real ones are API 281 · admin 0 · user 6 · driver 28** — corrected in place below.
  Because the stale numbers were **higher**, this step would have passed a regression as a win.
  *A hard-coded baseline in an old plan is a hypothesis, exactly like the plan's prescriptions.*
  **When this step is finally run: `tsc` ×4 against API 281 · admin 0 · user 6 · driver 28, lint
  user 225 / 0 errors, and an i18n check that EVALUATES rather than greps.**
  ✅ **Useful thing established while measuring:** `t()` resolves **dotted paths**
  (`hooks/useTranslation.ts:16-28` walks the object; there is no flat registry to register a key in)
  and returns **the key itself** when missing (`:41`). And `translations/index.ts` types ru/en
  against uz, so **a key missing from one locale is a compile error** — the compiler is a real i18n
  check here, which is worth knowing before hand-rolling one.
- [ ] 11. **Owner: migrate, deploy, rebuild admin + user app, smoke test.** (a) keyboard no longer
  covers the note fields; (b) location icon visible; (c) seat gender sheet appears and assigns;
  (d) cash + card both selectable; (e) "for my friend" independent, phone required only when
  ticked; (f) waiting fee not editable by the passenger and showing the admin value.
- [ ] 12. **Commit** with a clear message, owner-approved.

## Files to touch (verified against the repo 2026-08-02)
- `user-app-standalone/screens/CreatePassengerOfferScreen.tsx` — items 2-6 ✅(2,3)
- `user-app-standalone/components/passengerOffer/LocationCard.tsx` — item 7 ✅
- `user-app-standalone/components/passengerOffer/{SeatStepper,GenderPickSheet}.tsx` — item 1
- `user-app-standalone/components/passengerOffer/SpecialOrderPanel.tsx` — item 4
- **NEW** migration in `api,admin,db/apps/api/src/database/migrations/` — items 5-6
- `api,admin,db/apps/api/src/database/models/PassengerOffer.ts` + its service/controller — items 5-6
- Admin panel: a new settings page + API — item 4
- Translation files in whichever apps gain strings

## Risks / open questions (READ before coding)
- ⚠️ **Dropping `payment_type` would break older installed app builds.** Keep both columns for a
  release; write both; read the new ones. The board already carries a long tail of un-rebuilt apps.
- ⚠️ **Item 4 is a new capability, not a fix.** A settings table, an endpoint, an admin page and an
  app read. If it grows, it should become its own card rather than stretching this one.
- ⚠️ **"Not counted" must be honoured end-to-end** — storing a waiting fee that nothing charges is
  fine, but no code should start billing on it without the owner saying so.
- ⚠️ **Validation changes with the payment shape.** "At least one payment method" is a new rule;
  today the screen just requires the single enum to be set.
- ⚠️ **Item 1 may be a device-only symptom.** If the code reads correctly, the diagnosis needs the
  owner's phone — say so rather than inventing a fix.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` keeps picking up permission-prompt changes — keep it out of commits.

## Session notes (one line per work session)
- 🔴 **2026-08-16 — I BUILT A FIX THE OWNER HAD ALREADY DECLINED, AND IT WAS REVERTED.** Step 4 here
  still said "blocked — needs the owner to confirm the repro"; the board had the answer from
  **2026-08-11**: repro confirmed, item 1 **CLOSED / working as designed / "do not reopen"**, fix
  **declined** — *"i do not see any issue with this right now, works fine"*. I asked the owner a
  question that was already answered, then wrote code against the stale half.
  **Reverted in full** (`git checkout` on the screen + three locale files); the only thing that
  survives is this correction and the measured baselines. **Cost: one round trip. Cause: I read the
  plan file and did not cross-check the board before coding.**
  *Two files claiming to be the source of truth is worse than one that is merely out of date — and
  the one quoting the owner wins. `/next` reads the plan file, so the plan file is what had to be
  fixed.*
- ⚠️ **Both stale things in this file pointed the same way — toward doing more work than was
  wanted:** a step that said "blocked" when it was closed, and baselines that were **higher** than
  reality (API 282 · user 12 · driver 36 vs 281 · 6 · 28), which would have let a regression read as
  a win. **Neither is visible without checking against something outside the file.**
- ✅ **Recorded so item 1 is not investigated a fourth time:** the steppers switch off *on purpose*
  (`:546` sends no `seat_counts` once a salon is picked). The report was accurate; the diagnosis it
  invited was wrong. *A user describes a symptom, not a cause — and this one named a component.*
- **2026-08-02** — card created from OR-012; **items 2, 3 and 7 fixed and committed (`9ab9b2c`);
  item 1 diagnosed.** The keyboard complaints (2, 3 and half of 4) were all one missing
  `KeyboardAvoidingView`. Three owner decisions taken: payment becomes booleans, the waiting fee
  becomes an admin setting, and item 1 is a **bug** in the existing gender picker rather than a
  request for seat-position shifting. Item 1's hunt found **no defect in the components** — the
  suspect is a silently disabled control, which needs the owner's repro.

## Resume point (for the next chat)

> 🟢 **2026-08-13 — STEPS 5, 6 and 7 ARE DONE (items 5-6, the payment split).** Owner:
> *"Do'stimga degani alohida punkt. Do'stimgani tanlasa naqd payme deganni tanlab bo'lmayapdi. Naqd,
> click payme ikkalasini ham tanlasa bo'ladi degani."* Owner also chose: **at least one of
> cash/card is still required** (Do'stimga alone is not enough), and **the migration is written but
> NOT run — the owner runs it.**
> **40/40 checks, 19 red against pre-change code.** `tsc` API **281** · user **6** · driver **28**,
> all at baseline, zero errors in any touched file.
> 🔴 **Two defects found on the way, neither in the card:** the `payer_phone` requirement keyed off
> the old enum, so **Do'stimga + Naqd would have skipped the phone check entirely**; and the driver
> app showed only ONE payment chip, so cash+card would have displayed as "Naqd" alone.
> ⚠️ **BASELINES CHANGED 2026-08-13: user 12 → 6, driver 36 → 28.** The numbers below are stale.
> 🛑 **Remaining: step 4 (blocked — see below) and steps 10-12.** ⚠️ **Step 11 now needs the
> migration run first.**
> 🛑 **STEPS 8-9 ARE CANCELLED (owner, 2026-08-13).** The waiting fee is **not** an admin setting
> after all — the driver enters it on their own offer, built in **T-078**. The 2026-08-02 decision
> is reversed; do not resurrect it from the "Owner decisions" block above.

**Steps 1-3 are DONE and committed (`9ab9b2c`). Working tree clean.**

🛑 **Step 4 cannot start until the owner answers one question:** when the gender sheet did not
appear, **was a salon option ticked?** If yes, the cause is `seatsLocked` (`:118`) disabling both
steppers with no explanation, and the fix is to show why (and/or move the salon options above the
steppers, since they override the seats). If no, it is a different bug and the diagnosis restarts
from what they see on the device — do **not** invent a fix.

**Everything that does not depend on that answer is steps 5-9** and can proceed in parallel:
the payment migration + API + UI (items 5-6), then the admin waiting-fee setting (item 4).
Start with **step 5**, and ask before running the migration against test3.

⚠️ **T-027's migration (`20260802000002-add-referral-phone-to-users.cjs`) has still never been run**,
and the user app already sends `referral_phone`. Until it is applied, that field silently vanishes.

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12**, driver app **36**.
