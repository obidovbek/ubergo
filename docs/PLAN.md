# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **T-033** → `docs/PLAN-T033.md` (moved intact 2026-08-08). Steps 1-6 done; **step 7 is the
> owner's device test**, step 8 the commit. Its code is in the working tree, uncommitted.
> ⏸️ **T-031** → `docs/PLAN-T031.md`. Steps 1-3 done; step 4 blocked on the owner's salon-option
> answer; steps 5-9 (payment migration + admin waiting fee) are free.
> ⏸️ **T-030** → `docs/PLAN-T030.md`, step 7 blocked on an owner answer.
> ⏸️ **T-027** → `docs/PLAN-T027.md`, step 11 (**migration first**, then API, then both apps).
> ⏸️ **T-018** → `docs/PLAN-T018.md` · **T-026A** → step 8 · **T-025** → step 8.
> ⏸️ **Also parked:** T-011 · T-012 · T-014 · T-015 · T-016 · T-017.

## Task
- **ID / name:** T-036 — Modals must match the Figma design, in both apps
- **Goal (definition of "done"):**
  1. One shared modal shell per app, styled from the Figma overlay language.
  2. **All 33 modals** in both apps use it — no screen keeps its own backdrop, radius or palette.
  3. The create-offer pickers (the ones the owner hit on the device) look like the design.
  4. No behaviour changes: every modal opens, selects, cancels and closes exactly as it does today.
  5. No new `tsc` errors; both apps rebuilt and walked on a device.
- **Why now:** the owner reported it during the 2026-08-08 device test — the create-offer modals do
  not match the design, "and all modals should match the design".
- **Source:** owner, device test 2026-08-08. Design: `figma_images/` (see Design tokens below).

## Owner decisions taken 2026-08-08 (do NOT re-ask)
1. **Scope = both apps, every modal.** Not just the create-offer flow.
2. **Derive the shell from the Shablon/Tanlov overlay style.** There is **no Figma for the picker
   popups themselves** — only screen designs and the offer-detail overlays. Deriving is approved.

## Inventory (counted in code 2026-08-08 — 33 instances, 22 files)
⚠️ **Corrected from the "24" quoted when scoping**: the driver app has **20** modal instances across
12 files, not 11. The work is ~40% larger than first stated, which is why it is decomposed by
**pattern** below rather than file by file.

**User app — 13 in 10 files**
`components/ConfirmDialog.tsx:56` · `components/LanguageSelector.tsx:32` ·
`components/passengerOffer/GenderPickSheet.tsx:33` · `components/passengerOffer/GeoSelectModal.tsx:61` ·
`screens/EditProfileScreen.tsx:821,1046` · `screens/MyBookingsScreen.tsx:439` ·
`screens/NotificationsScreen.tsx:242` · `screens/PhoneRegistrationScreen.tsx:280` ·
`screens/SearchOffersScreen.tsx:874,1019` · `screens/UserDetailsScreen.tsx:798,1025`

**Driver app — 20 in 12 files**
`components/ConfirmDialog.tsx:56` · `components/offers/OfferDetailModal.tsx:169` ·
`screens/DriverLicenseScreen.tsx:953,1129` · `screens/DriverPassportScreen.tsx:1385,1500` ·
`screens/DriverPersonalInfoScreen.tsx:1359,1847` · `screens/DriverTaxiLicenseScreen.tsx:1322` ·
`screens/DriverVehicleScreen.tsx:2581,2687` · `screens/OfferPassengersScreen.tsx:412` ·
`screens/OfferWizardScreen.tsx:2090,2245,2662,2829,2996` · `screens/PhoneRegistrationScreen.tsx:263` ·
`screens/SearchPassengerOffersScreen.tsx:838,951`

**They collapse into three patterns — this is the whole reason the card is tractable:**
| Pattern | Count | What it is |
|---|---|---|
| **List picker** | 17 | geo cascade (7), country (3), vehicle, language, gender, filters (2), … |
| **Date / time picker** | 8 | hand-rolled day/month/year (and time) wheels |
| **Dialog / detail overlay** | 8 | confirm (2), offer detail, reject, rating, notification detail, … |

## Design tokens (derived from `figma_images/`, approved 2026-08-08)
Sources: `004Shaharlar aro K3 Tanlov oynasi.png`, `K_RegShablon-3.png`, `K_RegShablon.png`,
`K_buyurtma001Yangi.png`.
- **Backdrop** — `rgba(0,0,0,0.5)` (already the de-facto value everywhere; keep it).
- **Body** — cream `#FDF6E3`, **2px solid black** border, radius **20**.
- **Heading** — bold, **red** (`#E53935`), centred.
- **Rows / inputs** — white or very light green pill, 2px black border, radius 12.
- **Selected row** — green fill (`#8FE3A6` / `#4CAF50` text), matching the seat/price chips.
- **Actions, bottom, full width, stacked** — `Orqaga` = red outline on pink fill (`#FFEBEE`);
  primary = green fill (`#4CAF50`) white text.
- ⚠️ **Replace the emoji glyphs** (`🔍` `✕` `✓` `×`) with real icons — the app already depends on
  `@expo/vector-icons`, used elsewhere in both apps.

## Approach
Build **one `AppModal` shell + three body variants** (`ModalList`, `ModalDateWheel`,
`ModalDialog`) per app, then migrate the 33 call sites onto them. The shell owns the backdrop,
the card, the header, the actions and the animation; a call site supplies only its content.

⚠️ **This is a re-skin, not a rewrite.** Selection logic, state, validation and callbacks stay
exactly as they are. If a migration tempts a behaviour change, stop and log it instead.

⚠️ **The two apps stay separate copies.** `ConfirmDialog.tsx`, `errorHandler.ts` etc. are already
duplicated across the two standalone apps — that is this project's convention. Do **not** invent a
shared package for this card.

## Steps
- [x] 1. **DONE 2026-08-08. Shell + tokens, user app.** `modal` token object added to
  `themes/index.ts` **mode-independently**, beside `borderRadius`/`shadows` — the Figma is a single
  light treatment with no dark variant to honour. New `components/AppModal.tsx` (backdrop, card,
  centred red heading, real `Ionicons` close, stacked action row, `KeyboardAvoidingView` because
  pickers contain text inputs) and `components/ModalList.tsx`.
  ⚠️ **The whole look lives in that one token object** — a veto on cream-on-black costs one file
  edit, not 33 re-migrations. That is why the migration did not need to wait for a device check.
- [x] 2. **DONE 2026-08-08. Create-offer pickers migrated.** `GeoSelectModal` is now a thin adapter
  over `ModalList` and `GenderPickSheet` a two-button body on `AppModal`. ⚠️ **Both public prop
  shapes are unchanged**, so `LocationCard` and `SeatStepper` did not move at all.
  ⚠️ `GeoSelectModal` hands back the **original** `GeoOption`, not the mapped row — callers read
  `latitude`/`longitude`/`type` off it and the mapping drops them.
- [x] 3. **DONE 2026-08-08. Remaining user-app list pickers.** Language, country ×3, search geo,
  filters — **8 of the 13 user-app modals now use the shell.**
  ⚠️ **The three country pickers were byte-identical copies**, so they collapsed into one new
  `components/CountryPickerModal.tsx` rather than being migrated three times.
  ⚠️ **The filter modal was mis-classified in the Inventory** — it is a multi-section panel (sort,
  rating, price range), not a list, so it took `AppModal` directly and kept its body. Revised
  pattern counts: **list picker 16, dialog/panel 9**, date/time 8.
  Removed on the way: the hard-coded English `'From: '`/`'To: '`/`"Search..."` in `SearchOffersScreen`
  and `"Select Language"` in `LanguageSelector` (new key `common.selectLanguage` ×3 locales), plus
  the now-dead `geoSearch` state — `ModalList` owns search, so the screen's filter never fired.
- [x] 4. **DONE 2026-08-08. Date wheels.** ⚠️ **Both screens carried an identical copy of the wheel
  markup AND identical `generateDays`/`generateMonths`/`generateYears` helpers**, so they collapsed
  into one `components/DateWheelModal.tsx` instead of being re-skinned twice; the duplicated
  generators are gone from both screens.
  ⚠️ **Controlled component** — the screens keep owning `tempDate` and their confirm/cancel
  handlers, so the change is presentation-only. Backdrop dismissal is **off** here: a stray tap
  would silently discard the date being picked.
- [x] 5. **DONE 2026-08-08. The remaining user-app overlays** — `ConfirmDialog`, the rating sheet,
  the notification detail. `AppModal` gained a third action variant, **`destructive`** (red fill),
  because `ConfirmDialog` already had `confirmButtonStyle: 'destructive'` and the shell only offered
  green/red-outline. Its public props are unchanged.
  The rating sheet keeps its submit button **inside the body** rather than becoming a shell action —
  it has a spinner and an icon that the plain action row cannot express.
  **✅ The user app is fully migrated: all 13 modals, zero bare `<Modal>` outside `AppModal.tsx`.**
- [x] 6. **DONE 2026-08-08. Shell ported to the driver app; all 9 list pickers migrated.**
  `modal` tokens added to the driver theme; `AppModal`, `ModalList`, `DateWheelModal` copied and
  verified **byte-identical** to the user app's (`diff -q`). New `components/GeoPickerModal.tsx`
  wraps `ModalList` for the driver's **7** country/province/city pickers.
  ⚠️ **`ModalList` gained optional multi-select** (`ModalListMultiSelect`) — the driver's stop/city
  pickers let a driver tick several towns and confirm, which the user app never needed. Rows toggle
  and the search text is **kept** in that mode; clearing it mid-selection would throw away the filter.
  ⚠️ **Shared components were re-pointed at `common.*` keys** (`search`, `noResults`, `selectDate`,
  `day`/`month`/`year`) so the two copies stay identical and depend on no screen's namespace. The
  driver app already keyed these under `common`; the user app got them added.
  **`OfferWizardScreen` — all 5 modals migrated** (from/to/stop geo + date + time). Hard-coded
  Uzbek `'Mamlakatni tanlang'`, `'Soat'`, `'Daqiqa'` etc. replaced with keys.
  **Remaining: 15 modals in 11 files** — see Resume point.
- [x] 7. **DONE 2026-08-08. Driver app date/time — all 6 re-skinned, bodies kept.**
  ⚠️ **Deliberately NOT swapped for `DateWheelModal`.** Its wheel runs 1900→today (birth dates);
  `OfferWizardScreen`'s generators enforce **future-only** dates and hours. Swapping would have
  silently dropped the past-date guard, so every driver date/time picker got `AppModal` chrome with
  its **body and generators untouched**. `DateWheelModal` is therefore ported but unused in the
  driver app — kept so the two component sets stay identical.
- [x] 8. **DONE 2026-08-08. Driver app dialogs/detail** — `ConfirmDialog` (the user app's migrated
  version dropped in unchanged: identical props, incl. `destructive`), `OfferDetailModal`, the
  reject modal, and the filter panel. `OfferDetailModal` and the rating-style bodies keep their own
  action buttons, which carry icons and spinners the plain action row cannot express.
- [x] 9. **DONE 2026-08-08. Static verification — all four projects exactly at baseline.**
  `tsc`: API **282/282** · admin **0/0** · user **12/12** · driver **36/36**. The two
  `translations/index.ts` errors about a missing `publicOffers` were **proven pre-existing via
  `git stash`** (it exists only in the driver's `uz`).
  **129/129 i18n checks** — every key the shared components resolve, *evaluated* in all three
  locales of both apps. ⚠️ **The check caught 15 real misses**: `phoneRegistration.selectCountry`
  (user app), `driverLicense.selectCountryCode` and `offerWizard.select{Country,Province,City}`
  (driver) were all referenced but had **never existed** — three of them had been hidden behind
  `|| 'hard-coded Uzbek'` fallbacks. All added in uz/ru/en.
  **Zero bare `<Modal>` outside `AppModal.tsx` in either app** (verified by grep).
- [ ] 10. **Owner: rebuild BOTH apps and walk every modal.** Open each of the 33, select something,
  cancel, and confirm nothing changed but the look.
- [ ] 11. **Commit** with a clear message, owner-approved.

## Files to touch
- **NEW** `{user,driver}-app-standalone/components/AppModal.tsx` (+ the three variants)
- `{user,driver}-app-standalone/themes/**` — the modal tokens
- The 22 files listed in the Inventory
- Translation files in both apps if any new strings appear (e.g. a shared "Orqaga"/"Tanlash")

## Risks / open questions (READ before coding)
- ⚠️ **33 call sites is where regressions hide.** Migrate in the step order above and keep each step
  runnable; do not do a single sweeping find-and-replace.
- ⚠️ **`OfferWizardScreen.tsx` alone holds 5 modals** and is the largest file in the driver app.
  It is also mid-flight in T-002/T-026. Expect conflicts if those cards move.
- ⚠️ **No Figma exists for the pickers.** The tokens above are *derived*. If the owner later supplies
  real designs, the shell is one file to change — that is the point of doing it this way.
- ⚠️ **Cream + black border is a big visual jump** from today's white sheets. Step 2 exists so the
  owner can veto the look on a device after 2 modals, not after 33.
- ⚠️ **Do not "fix" behaviour while re-skinning.** Anything found goes to the board (that is how
  T-035 was found during T-033).
- ⚠️ **T-033's code is uncommitted in the same working tree.** Do not mix the two in one commit.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` keeps picking up permission-prompt changes — keep it out of commits.

## Session notes (one line per work session)
- **2026-08-08** — card created from the owner's device-test report. Inventory counted in code:
  **33 modals in 22 files** (corrected up from the 24 quoted while scoping), collapsing into just
  **three patterns**. Design tokens derived from the Shablon/Tanlov overlays; owner approved deriving
  because no Figma exists for the pickers themselves.

## Resume point (for the next chat)
**Steps 1-9 DONE. ALL 33 modals in BOTH apps are migrated.** `tsc` exactly at baseline on all four
projects (API **282** · admin **0** · user **12** · driver **36**); **129/129** i18n checks.
Verify with `grep -rn "<Modal" --include=*.tsx components screens` in either app → the only hit is
`components/AppModal.tsx`.

**Shared components.** `AppModal` · `ModalList` (+ optional multi-select) · `DateWheelModal` are
**byte-identical across both apps** (`diff -q`) — edit them together or the drift starts here.
App-specific adapters: user `CountryPickerModal` + `passengerOffer/GeoSelectModal`, driver
`GeoPickerModal`.
⚠️ **The whole look lives in the `modal` token object in each app's `themes/index.ts`.** Restyling
is two files, not 33.

🛑 **Only step 10 (owner: rebuild BOTH apps, walk every modal) and step 11 (commit) remain.
Nothing has run on a device.** The riskiest spots to check first, because they carry logic the
plain shell cannot express:
- **Multi-select stop/city pickers** in `OfferWizardScreen` — tick several towns, confirm, cancel.
- **Driver date/time pickers** — past dates and past hours must still be unselectable.
- **USER_NOT_REGISTERED** on the driver's phone screen — it reads `error.response.data.data`.
- **The rating sheet** (user) and **`OfferDetailModal`** (driver) — their action buttons stayed in
  the body, so their spinners/icons should look and behave exactly as before.

⚠️ **T-033's code is uncommitted in the same working tree — do not mix the two in one commit.**

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12**, driver app **36**.
