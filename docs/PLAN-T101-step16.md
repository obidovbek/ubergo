# 📋 PLAN — T-101 step 16: `OfferWizardScreen` → `DriverElon.dc.html`

> Split out of `docs/PLAN.md` on **2026-09-05**, exactly as step 16's card instructed
> ("split it into its own plan file if it does not fit one step"). **It does not fit one step.**
> The parent card in `PLAN.md` stays unchecked and points here.
>
> **Owner decisions, 2026-09-05 — both taken before any code:**
> 1. **Follow the artboard: ONE scrolling form.** Not a repaint of the 4-step wizard.
> 2. **Build only what has a backend.** Same rule as 2026-09-03 and step 15.

---

## 1. What this actually is

| | |
|---|---|
| artboard | `htmlDesign/DriverElon.dc.html` — **1 800 lines**, ~128 KB, **~180 render keys** |
| screen | `driver-app-standalone/screens/OfferWizardScreen.tsx` — **3 883 lines**, **41 `useState`** |
| structure | 🔴 **they disagree** — see below |

🔴 **THE CARD SAID "REPAINT". IT IS A RESTRUCTURE.**
The artboard is **ONE scrolling form** with four bottom sheets. The screen is a **4-step
paginated wizard** (`currentStep` 1-4, `validateStep`, Back/Next). The artboard has **no step
concept anywhere** — no `step` key in its state, no indicator, no next button.
*Measured, not read: grepping the artboard for `step` returns only `sheetStep`, which is a
sheet's internal page.* **This is the same shape of finding as steps 9-12** — every one of those
cards described a repaint and turned out to be a structural change.

⚠️ **The two artboard copies differ** (`htmlDesign/` vs `uploads/Chek_28082026/`). As in step 15,
`htmlDesign/` is canonical.

---

## 2. 🛑 The risk that must not be got wrong

**`handleSave` calls `validateStep(currentStep)` — it validates ONLY the current step.**

In a 4-step wizard that is safe: you cannot reach step 4 without passing 1, 2 and 3 on the way.
**Collapsing to one form destroys that guarantee.** Submit would then check one step's worth of
fields and let everything else through — an offer saved with no destination, or a price of zero.

✅ **Therefore: a `validateAll()` must exist BEFORE the pagination is removed**, not after.
This is step 16a, and it is deliberately first.

🔴 **Second trap, already documented in this screen at line 296:** on EDIT every field must load
back, or *"the next save silently blanks them"*. The restructure moves every field; each one has
to be re-checked against `getDriverOfferById`. **T-078/T-079/T-080 all landed fields here** and
their loading rules (`?? undefined`, never `||`) must survive.

---

## 3. What has a backend, and what does not

**✅ Backed — build these** (`api/driverOffers.ts`, verified 2026-09-05):
`from_text`/`to_text` + lat/lng + stops · `start_at` · `depart_until` · `arrive_from`/`arrive_until` ·
`seats_total`/`seats_free` · `price_per_seat` · `front_price_per_seat` · `price_back_salon` ·
`price_whole_salon` · `waiting_fee_per_min` · `free_waiting_min` · `pickup_fee` ·
`payment_cash`/`payment_card` · `vehicle_class` · `air_conditioner` · `wifi` · `roof_rack_needed` ·
`trailer` · `parcel_accepted`/`parcel_price`/`parcel_max_kg` · `road_pickup`/`road_pickup_note`.

*The offer API is genuinely rich — unlike step 15, MOST of this screen is backed.*

**🛑 NOT backed — leave out and board:**
- **The per-seat GENDER grid.** The artboard's `seatGenders`/`slotArr`/`setSlots` assign m/f to
  each individual seat (long-press to flip). The API has only `seats_total`/`seats_free` — no
  per-seat anything. ⚠️ **`PLAN.md` already records the same gap on the SEARCH side** ("needs
  per-seat gender, `hex_code` and `vehicle_class` on the offer response") — it is one missing
  feature showing up on both sides, so it should be ONE card.
- **"Maxsus buyurtma" (the special-order block)** — `specialPrices`, `specialLines`,
  `specialTotal`, `confirmSpecial`, the 3 000 so'm/unit rule. No column, no endpoint.
- **`dost` / `dostPhone` (dostavka)** — no field on the offer.
- **Multi-vehicle "Yangi mashina qo'shish"** — the artboard adds cars inline; the driver profile
  holds ONE vehicle (step 21's territory, same finding as step 15's drawer).

⚠️ **`arrive_from` is supported by the API but never sent by the user app's form** (recorded in
`PLAN.md`). This screen SHOULD send it — check, do not assume.

---

## 4. Steps

> Each leaves the app runnable (rule 2). **Do them in order** — 16a exists to make 16d safe.

- [x] **16a. `validateAll()` + submit safety, with the wizard still in place. ✅ DONE 2026-09-05.**
      ✅ **`utils/offerWizardValidation.ts` (new)** — the three `case` bodies became
      `validateRoute` · `validateSchedule` · `validateVehicleAndPrice`, plus `validateAll`.
      **Pure: no React, no react-native, no `t()`** — the rules return translation KEYS and the
      screen translates them. That purity is what makes them executable in isolation.
      ✅ **`handleSave` now calls `validateEverything()`**, not `validateStep(currentStep)`.
      **Nothing visual changed**; Back/Next still validate one step. Net **-41 lines** in the screen.
      ✅ **`validateAll` is a superset BY CONSTRUCTION, not by memory** — it iterates
      `SECTION_VALIDATORS`, the same list `validateStepNumber` indexes into, so the two cannot
      drift apart when step 16b starts moving sections around.
      ✅ **`validationInput()` gathers the state ONCE** and hands the same snapshot to both entry
      points, so a rule cannot see different data depending on who called it.
      🔴 **FOUND AND FIXED A REAL HOLE WHILE EXTRACTING:** the original compared
      `new Date(start_at) < minDate`, and **every comparison against an Invalid Date is `false`** —
      so a malformed date string passed validation and went to the API. A `Number.isNaN` guard
      now catches it, and there is an assertion for it.
      ✅ **`scripts/check-offer-validation.mjs` (new)** — bundles the module with esbuild and
      executes **~30 assertions** (route · schedule · vehicle · submit · a structural
      superset check over 7 broken forms × every step).
      **PROVEN ABLE TO FAIL on 5 mutations**, each reverted: `validateAll`→route-only (**16 red**,
      the exact defect this card prevents), `minAdvanceMs`→0, `maxSeats`→99, `minPricePerSeat`→0,
      and the NaN guard deleted.
      ⚠️ **NOT a `*.test.ts`, and that is a deviation from the DoD worth knowing about:** neither
      RN app has a test runner (CLAUDE.md — only the API does), and adding one is a **new
      dependency → rule 4, owner's call**. This uses the `scripts/check-*.mjs` pattern steps 14
      and 15 established. **These cases port to a real runner as-is if one is ever approved.**
      ✅ Baselines held: **`tsc` 28 · lint 0 errors / 280 warnings · tokens 3.** ⚠️ The new file
      first added a **281st** warning (`Array<T>`); **fixed, not rebaselined.**
- [x] **16b. Section components, still inside the 4 steps. ✅ DONE 2026-09-06.**
      ✅ **`components/offerWizard/` (new, 9 files, 809 lines)** — `SectionCard` · `ToggleChip` +
      `ToggleChipRow` · `FormField` + `SelectField` · `NumberField` · `ChipSelectSection` ·
      `ToggleSection` · `CarSection` · `RouteEndpointSection`. **Screen 3 864 → 3 495 lines
      (−369)**, and the deleted JSX is larger than that: 740 lines out, 390 in.
      🔴 **THE FROM- AND TO-BLOCKS WERE BYTE-IDENTICAL — MEASURED, NOT EYEBALLED.** 116 lines
      each; a normalising diff (`from`→X, `to`→X) came back with **zero** differences. One
      `RouteEndpointSection` now renders both. *The "fix the class, not the instance" pattern at
      code scale — every fix to one endpoint had to be remembered for the other.*
      🔴 **AND THE TWO COPIES HAD ALREADY DRIFTED FROM A THIRD PLACE.** The city-remove path left
      `lat`/`lng` **untouched** when 2+ cities remained, while `confirmMultipleFromCities` sets them
      from the **first** city ("use first city as primary from location"). So removing a city could
      leave an offer pointing at a city no longer in its own list. Both paths now derive from one
      pure `resolveEndpointSelection`, which follows the **confirm** path's convention.
      ✅ **Restyled to the tokens as cut**, which is a real repaint, not a rename: the artboard's
      eyebrow (`typography.eyebrow`, 10px mono) replaces the old 15px bold sans label, and the
      selected chip is now a **solid `action` fill with white ink** instead of the old
      `successTint`/`brand` tint — `light.ts` names `action` "selected chip" outright.
      ✅ **Step 3 now runs in the artboard's order** (car · to'lov · avto turi · o'rindiqlar ·
      shartlar · ma'lumot · narxlar), with the seven prices under ONE `Narxlar` eyebrow as drawn.
      ⚠️ The artboard puts the car above the ROUTE; that crosses a step boundary, so it waits for
      16d — a field rendered on step 1 would not be validated until step 3.
      ✅ **Five more pure rules moved where they can be executed** (`utils/offerWizardValidation.ts`,
      +150 lines): `parseAmount` · `formatAmount` · `normalizeAmount` (T-078's "0 is a real answer")
      · `clampSeats` · `resolveEndpointSelection`. **~40 new assertions**, incl. a cross-check that
      `clampSeats`'s output always survives `validateVehicleAndPrice` — the control cannot leave a
      value its own validator would refuse.
      ✅ **PROVEN ABLE TO FAIL on 6 more mutations**, each reverted: `normalizeAmount` ignoring
      `allowZero` (1 red), returning a negative unchanged (2), `clampSeats` not capping (3),
      `resolveEndpointSelection` dropping the multi-city coords (2), `formatAmount` blanking a real
      `0` (1), `parseAmount` turning empty into `0` (2).
      🔴 **ONE DELIBERATE BEHAVIOUR CHANGE, DOCUMENTED ON THE FUNCTION:** a **negative** amount used
      to be clamped to `0` and stored — i.e. a corrupt value advertised as a **free** back salon.
      It now reads as "not set", except where `0` is itself a legitimate answer. Unreachable by
      typing (the input strips non-digits); reachable only from the API.
      ✅ **`check-font-weights.mjs` caught the new files immediately** — they are NOT exempt, unlike
      the screen. It flagged a *comment* of mine quoting a 300 weight; **the comment was reworded,
      the ratchet was not weakened.**
      ✅ **i18n EVALUATED, not grepped** — the 40 keys step 3 renders were bundled and read back out
      of all three locales: 40 × 3 all resolve to non-empty strings. ⚠️ **The probe's own first
      regex was wrong** (`[A-Za-z_]+` truncated `step3Title` to `step`, reporting 3 phantom misses);
      fixed before trusting it — the same trap the step-9 i18n checker fell into twice.
      ✅ **No field lost**: all 23 fields the old step 3 rendered are still there, and no
      translation key was dropped (one added, `pricesSectionTitle`, in uz/en/ru).
      ✅ **Baselines: `tsc` 28 · lint 0 errors / 279 warnings · tokens 3 · fonts, drawer, validation
      all green.** ⚠️ **279 is one BELOW the 280 baseline and was NOT rebaselined** — the cut
      removed an unused import.
      ✅ **`npx expo export --platform android` bundles clean** (5.08 MB Hermes). That proves the
      module graph resolves; it does **not** prove the screen renders — only a device does.
      🛑 **STILL UNRUN ON A DEVICE**, and the queue is now ~9 steps deep.
      ⚠️ **Left for 16c/16d, deliberately:** the **stops** block is a THIRD copy of the same
      endpoint pattern and was NOT collapsed — it carries extra per-stop state and its own
      `stopGeoModal`, and 16c rewrites those pickers anyway. `renderStep2` (date/time) is
      likewise untouched: it is the time sheet, which is 16c's whole subject.
- [x] **16c-1. The `from` · `to` · stop sheets. ✅ DONE 2026-09-06.**
      🔴 **THE SHEET ALREADY EXISTED IN THIS APP AND THIS SCREEN NEVER ADOPTED IT.**
      `components/geo/GeoSheet.tsx` was built during T-101 and its own header names
      **`OfferWizardScreen` as one of the SEVEN places that re-implemented the cascade by hand**.
      `SearchPassengerOffersScreen` adopted it; the wizard kept **three more copies**
      (from · to · every stop) behind `GeoPickerModal`. *The step was not "build a sheet" — it was
      "stop rebuilding the one we have".*
      ✅ **`GeoSheet` gained `multiSelectAt`** (+1 optional prop, default off, so the search screen
      is untouched). **Without it the adoption would have DELETED a feature** — drivers have always
      been able to name several tumans for one endpoint, and the sheet was single-select.
      The artboard multi-selects at adm2 too (`toggleAdm2`/`tmpAdm2s`/"tanlangan ✓"), so this is
      the artboard's own behaviour, not an invention.
      ✅ **The "clear the descendants" rule now covers the multi-selection as well** — districts
      picked under the old province are dropped when the province changes. That rule is exactly what
      `GeoSheet`'s header says every hand-rolled copy had to remember.
      ✅ **`RouteEndpointSection` rebuilt to the artboard's row:** a route dot (hollow origin /
      filled destination / a quieter ring for a stop), the eyebrow, the resolved place, a chevron.
      It replaces **three stacked dropdowns** — the cascade drawn as a form.
      ✅ **The swap (`⇅`) is built** — new, from the artboard. It swaps the geo selections AND the
      persisted text/coordinates together; swapping only `from_text`/`to_text` would leave the
      pickers on the old order and the next edit would silently restore it.
      ✅ **Stops folded in** — each stop is now the same row and the same sheet, not a third copy.
      🟢 **NET: −634 lines from the screen (3 495 → 2 861)**, +33 in `GeoSheet`. Twelve dead picker
      functions (468 lines), seven more dead helpers, 16 dead state hooks and 4 dead imports
      removed — **each verified unreferenced before deletion**, not assumed.
      ✅ **Baselines: `tsc` 28 · lint 0 errors / 276 warnings · tokens 3 · fonts, drawer, validation
      green.** 🟢 **276 is FOUR below the card's 280 baseline** and was not rebaselined.
      ✅ **i18n evaluated** (not grepped): step 1's 10 keys × 3 locales all resolve.
      🔴 **THE LINT RATCHET CAUGHT WHAT I HAD DECIDED TO DEFER.** I intended to leave the dead state
      alone; lint went **279 → 299** and named all 20, including two loaders I had not spotted.
      *Cleaned, not rebaselined — and the deferral would have been wrong.*
      🔴 **A `tsc` count that FALLS can mean the file got worse:** a bad apostrophe escape in
      `uz.ts` made the count read **12**, because a parse error stops analysis. Only the error text
      showed it. **Never read a falling count as progress.**
      ⚠️ **Left standing deliberately:** `loadExistingOffer` still calls `parseLocationText` and the
      remaining `load*Provinces` loaders to rehydrate an edited offer. That path is **16e's
      subject**, and it is the one place where breakage is silent (line 296).
- [x] **16c-2. The `time` and `arrive` sheets. ✅ DONE 2026-09-06.**
      🔴 **THIS STEP GAVE THE DRIVER A CAPABILITY THEY NEVER HAD.** `driver_offers` has carried
      `depart_until` / `arrive_from` / `arrive_until` since **T-080**, and `loadExistingOffer` +
      `handleSave`'s `...formData` already round-tripped them — **but no control had ever SET
      them.** A driver could say *"I leave at 08:00"* and never *"between 08:00 and 11:00"*, which
      is what the artboard draws and what the passenger app already reads.
      ⚠️ **Verified against `handleSave`, not assumed** — I expected a data-losing edit path and
      there wasn't one. It was a hole in the form, not a bug in the save.
      ✅ **`utils/offerSchedule.ts` (new, ~300 lines, pure)** — slots · window normalisation · drag
      anchoring · `latestDeparture` · `arrivalIsReachable` · the payload · and `restoreSchedule`
      for the edit path. **Written BEFORE any drag gesture existed to hide the rules in.**
      ✅ **`scripts/check-offer-schedule.mjs` (new) — ~70 assertions, PROVEN RED ON 15 MUTATIONS**,
      each reverted. The headline: **`latestDeparture` using the window START → 6 red** — that is
      step 8f's defect ③, *"leave 08:00–11:00, arrive by 09:00"*, which shipped accepted on the
      passenger side. The driver side never got the chance to.
      🔴 **ONE MUTATION CAME BACK GREEN AND THAT WAS THE MOST USEFUL RESULT.** Deleting
      `restoreSchedule`'s `Number.isNaN` guard broke nothing — an Invalid Date also fails
      `dayIndexOf` and returns `-1`, so my "refuses an unparseable start" assertion had been
      **passing for the wrong reason**. The shadowing is now pinned by explicit `dayIndexOf` cases
      and the redundancy is documented on the guard rather than assumed away.
      *(Same Invalid-Date blindness as 16a — third appearance in this task.)*
      ✅ **A save→load ROUND TRIP is asserted over four windows** including an overnight
      22:00→02:00. That is the assertion that would have caught every historical "saves but never
      loads" defect on this screen (line 296).
      ✅ **`components/offerWizard/TimeRuler.tsx`** — 192 blocks, `PanResponder` (not `Pressable`:
      the drag crosses many children, so the track must claim the touch). **It owns pixels and
      gestures only; every rule is imported.**
      ✅ **`components/offerWizard/ScheduleSheet.tsx`** — one sheet serving both modes, with the
      day strip, "Hoziroq", and the live rule breach shown *inside* the sheet.
      ✅ **`MIN_ADVANCE_MS` named once.** It was hardcoded `30 * 60 * 1000` in **four** places in
      the screen beside a fifth copy in `RULES.minAdvanceMs`.
      ⚠️ **The user app uses 31 minutes and the driver 30. NOT reconciled** — an order and an offer
      are different objects, and changing either without the owner is a behaviour change dressed as
      a cleanup. Asserted as 30, and the reason is on the constant. **This is the "check
      `check-ride-time.mjs` still holds" item: the two apps agree on the SHAPE (arrival is judged
      against the latest departure); they differ on the floor, deliberately.**
      🟢 **NET: −202 lines (2 832 → 2 630).** The two wheel modals, 12 generator/handler functions
      and 6 state hooks are gone.
      ✅ **Baselines: `tsc` 28 · lint 0 errors / 275 warnings · tokens 3 · fonts, drawer, both
      validation checkers green.** 🟢 **275 is one below 16c-1's 276.**
      ✅ **i18n evaluated:** step 2 + the sheet = 9 keys × 3 locales, plus both schedule error keys.
      ✅ **`expo export` bundles clean.**
      🔴 **MY OWN MUTATION SCRIPT LEFT RESIDUE IN THE REPO.** Its first run crashed on printing an
      emoji *after* writing a mutation, and my "is it restored?" check looked at **one line**
      instead of the whole file. `git diff` was blind because the file was untracked. **Lint found
      it** (an orphan `// eslint-disable-line`). *A revert is not verified until the whole file is.*
- [ ] **16d. Remove the pagination.** One `ScrollView`, sections in the artboard's order, one
      `Elon berish` button. Delete `currentStep`, `renderStepIndicator`, Back/Next.
      🛑 **Only after 16a is green**, or submit silently loses its validation.
      ✅ **Move `CarSection` above the route** — 16b could not, because a field rendered on step 1
      would not have been validated until step 3.
- [ ] **16e. The EDIT path, field by field.** Open a saved offer and confirm **every** field loads
      back — the failure mode line 296 warns about. Re-check T-078/079/080's `?? undefined` rule.
- [ ] **16f. Checkers + baselines.** `check-font-weights.mjs` (drop `OfferWizardScreen.tsx` and
      `DateWheelModal.tsx` from `EXEMPT_FILES` — **their reason expires here**),
      `check-design-tokens.mjs`, `check-drawer.mjs`, `tsc`, lint. A new checker if 16a/16c earn one.
      ⚠️ **16b's i18n probe was a throwaway** — if 16c/16d add keys, make it a real
      `check-offer-i18n.mjs` rather than re-typing it, and prove it red first.
- [ ] **16g. Board the unbacked features** (§3) and update `PLAN.md`, `TODO.md`, `JOURNAL.md`.

---

## 5. Baselines — never rebaseline upward

**driver `tsc` 28 · lint 0 errors / 280 warnings · tokens 3** (measured 2026-09-05, step 15).
🟢 **Lint is now 279 after 16b (2026-09-06) — one below, and NOT rebaselined upward.**
⚠️ Measure lint only after deleting any scratch file written into the app — a stray esbuild
bundle in `driver-app-standalone/tmp/` showed 5 errors on a project whose baseline is 0.

🟢 **Lint is 275 after 16c-2 (2026-09-06) — five below the card's 280, never rebaselined up.**

**Checkers that must stay green** (`node scripts/…` in `driver-app-standalone`):
`check-design-tokens.mjs` · `check-font-weights.mjs` · `check-drawer.mjs` ·
`check-offer-validation.mjs` · `check-offer-schedule.mjs`.

---

## 6. Session notes

### 2026-09-06 (3) — 16c-2: the rules before the ruler

- **16c-2 done.** The departure WINDOW and the arrival deadline are settable for the first time —
  three columns that have existed since T-080 and round-tripped fine with nothing to fill them.
- 🔴 **The rules were written and executed before the drag gesture existed.** On the passenger
  side these same rules lived inline in a form and three of step 8f's four defects were invisible
  until they were pulled out. 15 mutations, all red; the worst — arrival judged against the
  *start* of the window — takes 6 assertions down.
- 🔴 **A mutation that stayed GREEN was the most valuable one.** It showed an assertion of mine
  was passing for the wrong reason (an Invalid Date is caught by the day lookup, not by the NaN
  guard I thought I was testing). *A checker's own coverage needs proving, not just its rules.*
- 🔴 **My mutation script left an `// eslint-disable-line` in the repo** after crashing mid-loop
  on an emoji print. I "verified" the revert by checking a single line; `git diff` couldn't see it
  because the file was untracked. Lint caught it. *Verify a revert against the whole file.*
- ⚠️ **30 vs 31 minutes** — the driver's advance floor and the passenger's differ. Left alone and
  documented; reconciling them is the owner's call, not a tidy-up.
- **Next: 16d (remove the pagination).**

### 2026-09-06 (2) — 16c-1: the sheet was already in the app

- **16c-1 done.** `GeoSheet` adopted for from · to · stops; `GeoSheet` gained `multiSelectAt`;
  the artboard's endpoint row and its `⇅` swap are built. **Screen 3 495 → 2 861 lines.**
- 🔴 **The finding was not in the artboard, it was in our own repo:** the cascade this step was
  meant to build has existed since T-101, and `GeoSheet`'s header **names this screen** as one of
  seven that re-implemented it. Reading the design would never have shown that; looking for what
  the app already had did. *Check for the component before building the component.*
- 🔴 **Adopting it naively would have silently dropped multi-select** — a feature drivers use and
  the artboard also draws. Found by comparing `GeoPath` (one district) against
  `selectedFromCities` (an array) before wiring, not after.
- 🔴 **Lint overruled my judgement, correctly.** I had decided to defer the dead state; the count
  went 279 → 299 and listed 20 items, two of which I had missed entirely. Cleaned to **276**.
- ⚠️ **A falling `tsc` count is not good news.** A broken apostrophe escape read as **12** errors
  because parsing stopped. The number looked like an improvement.
- **Next: 16c-2 (the time + arrive sheets).**

### 2026-09-06 (1) — 16b: the duplication was the finding

- **16b done.** Nine components in `components/offerWizard/`; the screen is 369 lines shorter and
  step 3 is in the artboard's order.
- 🔴 **The headline is not the repaint, it is that `from` and `to` were the SAME 116 lines** — a
  normalising diff returned zero differences. And they had *already* drifted from
  `confirmMultipleFromCities` over which coordinates a multi-city selection carries.
  *One function now feeds all three paths.*
- ✅ **The ratchets earned their keep immediately**: `check-font-weights.mjs` flagged the very
  first file moved out of the exempt screen — it caught a comment, and the comment was reworded
  rather than the checker widened.
- ⚠️ **My own i18n probe was wrong before it was right** — `[A-Za-z_]+` silently truncated
  `step3Title` and reported three phantom missing keys. *The third time a checker in this task has
  been the bug it exists to catch.* Fixed, then trusted.
- 🔴 **I truncated this plan file mid-session** (`open(...,'w')` clears before a failed write) and
  rebuilt it from the copy read at the start of the session. It is untracked, so git could not
  have restored it. **Commit it.**
- **Next: 16c.**

### 2026-09-05 (2) — 16a: the safety net is up

- **16a done.** `utils/offerWizardValidation.ts` + `scripts/check-offer-validation.mjs`;
  `handleSave` now validates **every** section. No visual change, app still runs, screen -41 lines.
- 🔴 **Extracting the rules exposed a real bug**: `new Date(bad) < minDate` is **false** for an
  Invalid Date, so a malformed departure passed validation and reached the API. Guarded + asserted.
  *Moving code somewhere it can be executed is what made a 3-year-old hole visible.*
- ⚠️ **The DoD asks for a `*.test.ts` and this is a `check-*.mjs` instead** — no RN test runner
  exists and adding one needs owner approval (rule 4). Flagged on the card, not papered over.
- **Next: 16b.**

### 2026-09-05 (1) — scoped, split, and not started

- Measured both sides and found the **structural mismatch** (§1) and the
  **`validateStep(currentStep)` submit trap** (§2) before writing any code.
- Owner chose **one scrolling form** and **backend-only**. Plan written; **no code yet** (rule 3).
- **Next: step 16a.**
