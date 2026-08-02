# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **T-018** → `docs/PLAN-T018.md`, live at step 9/10 (owner: walk `docs/CHECKLIST.md`).
> ⏸️ **T-027** → `docs/PLAN-T027.md`, live at step 11 (owner: **migration first**, deploy, rebuild
> both apps, smoke test). ⏸️ **T-026A** → `docs/PLAN-T026A.md`, step 8. ⏸️ **T-025** →
> `docs/PLAN-T025.md`, step 8. ⏸️ **Also parked:** T-011 · T-012 · T-014 · T-015 · T-016 · T-017.

## Task
- **ID / name:** T-030 — OR-011: four driver-app fixes from the software owner
- **Goal (definition of "done"):**
  1. No document **issue** date can be set in the future, and no **valid-until** date in the past —
     on every date field in the driver app, not just the one that already checks.
  2. The photo path is **audited end-to-end** and whatever is broken in it is fixed or reported.
  3. The driver app offers **district → settlement / administrative area** from the data the admin
     panel already holds.
  4. The offer-note field shows the owner's example text in grey.
  5. No new `tsc` errors anywhere; driver app rebuilt and smoke-tested.
- **Why now:** the software owner is blocked on these, and item 2 may be a live defect affecting
  every driver who uploads a document photo.
- **Source:** `docs/OWNER_REQUESTS.md` OR-011 (verbatim Uzbek + translation), reported 2026-08-02.

## Owner decisions already taken (2026-08-02 — do NOT re-ask)
1. **The geo base is loaded through the admin dashboard**, so item 3 is **not** a data import —
   all six levels already have Excel upload in admin and the API already serves them. It is a
   wiring job in the driver app.
2. **Photo uploads work as far as the owner can tell.** Item 2 is an **audit** — find whether
   anything in that path is broken and report it — not a fix for a known symptom.

## Current state (verified in code 2026-08-02)
- **Item 1** — **no `maximumDate` / `minimumDate` anywhere in the driver app.**
  - `DriverLicenseScreen` hand-rolls a future check for `issue_date` and the `category_*` dates
    (:343-344, :382-435, :651-661) — with a **hard-coded Uzbek message** at :661.
  - `DriverPassportScreen` has `issue_date` + `expiry_date` (:50-54, :84-85) — **no limits**.
  - `DriverTaxiLicenseScreen` has `license_issue_date`, `license_sheet_valid_from`,
    `license_sheet_valid_until` (:54-58, :72-78) — **no limits**.
  So five unguarded date fields, plus one screen whose logic should be reused rather than
  re-invented.
- **Item 2** — base64 data URLs, API body limit 10 MB (`app.ts:77`), so size is not the problem.
  ⚠️ **Confirmed defect in 4 screens** — `DriverLicenseScreen:535`, `DriverPassportScreen:338`,
  `DriverPersonalInfoScreen:892`, `DriverTaxiLicenseScreen:695` all do
  `const mimeType = asset.type || 'image/jpeg'`. In the **installed** expo-image-picker
  (`ImagePicker.types.d.ts:262`) `asset.type` is `'image' | 'video' | 'livePhoto' | 'pairedVideo'`;
  the MIME type is `asset.mimeType` (:302). So every successful pick yields
  **`data:image;base64,…`** — malformed — and the `'image/jpeg'` fallback can never run.
- **Item 3** — the data is already reachable end to end **except** in the driver app:
  admin has Excel upload for all six levels (`ExcelUploadButton` on countries, provinces,
  city-districts, administrative-areas, settlements, neighborhoods); the API serves
  `/city-districts/:id/administrative-areas`, `/settlements`, `/neighborhoods`
  (`geo.routes.ts:14-19`); `driver-app-standalone/api/driver.ts` already defines
  `fetchGeoAdministrativeAreas` (:312) and `fetchGeoSettlements` (:320) — but `api/geo.ts`
  **re-exports only countries/provinces/city-districts**, there is **no neighborhoods function**,
  and no driver screen asks for the deeper levels.
- **Item 4** — `OfferWizardScreen:2498` already renders
  `placeholder={t('offerWizard.notePlaceholder')}` on the `note` field. Current value
  "Masalan: Chekmayman, 1 ta kichik sumka"; the key exists in `uz`/`ru`/`en`.

## Approach
Cheapest first again, and the audit early — if item 2 turns out to be a live defect, the owner
should know before the rebuild rather than after.

Item 1 uses the platform's own `maximumDate`/`minimumDate` on the pickers rather than more
hand-rolled arithmetic; the existing `DriverLicenseScreen` logic is the reference for what
"today" means here, and its hard-coded Uzbek string gets an i18n key on the way past.

## Steps
- [x] 1. **DONE 2026-08-02. Item 4 — the offer-note placeholder.** `offerWizard.notePlaceholder`
  updated in `uz`/`ru`/`en`, keeping each locale's existing "for example" prefix
  (`Masalan:` / `Например:` / `e.g.,`) so it still reads as a sample rather than a real note.
  Field is a 4-line `textArea`, so the longer text wraps.
- [x] 2. **DONE 2026-08-02. Item 2 — photo path audited end-to-end. THE OWNER WAS RIGHT: uploads
  work. The break is on the way BACK.**
  **① LIVE BUG — a stored photo never displays again.** The upload returns a host-less
  `/uploads/driver-photos/<uuid>.jpg`. Each screen loads that straight into `<Image source={{uri}}>`
  (`DriverLicenseScreen:905, :923` and the equivalents elsewhere). React Native needs an **absolute**
  URL, so a bare `/uploads/...` renders blank. It looks fine immediately after picking, because the
  screen shows `asset.uri` — the **local file** — and only shows the server value after a reload.
  That is exactly "upload works, photo doesn't".
  **~10 fields across 4 screens:** license front/back; passport front/back; taxi-licence ×5
  (`:365-377`); personal-info face/body (`:504-513`).
  ⚠️ **The naive fix is wrong.** `API_BASE_URL` is `https://test3.fstu.uz/api`, but `/uploads` is
  served at the **root**, so `${API_BASE_URL}${url}` yields `/api/uploads/...` → 404. The **admin
  panel already solved this** (`DriverDetailPage.tsx:20-45`): normalise to a path, then
  `API_BASE_URL.replace(/\/api\/?$/, '')`. Copy that, do not re-invent it.
  **② LATENT — malformed data URL.** The 4 screens build `data:image;base64,…` because
  `asset.type` is `'image'`, not a MIME type. Harmless **only by luck**: `UploadController:32`
  splits on the first comma and keeps `[1]`, so the bad prefix is discarded. Its own regex branch
  at `:34` is therefore dead code.
  **③ LATENT — every upload is stored as `.jpg`.** Same root cause: `asset.type.split('/')` can
  never have length > 1, so the extension block never runs, and the `else if (asset.uri)` fallback
  is unreachable because `asset.type` is always truthy. A PNG is written with a `.jpg` name.
  **④ Infrastructure is fine** — `api-deployment.yaml` mounts `uploads-pvc-test3` at `/app/uploads`
  and sets `UPLOAD_PATH=/app/uploads`, with `replicas: 1`. Photos are not being lost on restart.
  ⚠️ Two caveats for later: `overlays/test3/.env` disagrees (`UPLOAD_PATH=./uploads`) — harmless
  today because an explicit `env:` beats `envFrom`, but it is a trap; and the PVC almost certainly
  being ReadWriteOnce means **the scale-to-3 command in `DEPLOYMENT_SUMMARY.md:174` would break
  uploads**.
- [x] 3. **DONE 2026-08-02. Item 2 — fixed.** New `utils/imageUrl.ts` (`resolveImageUrl`) modelled
  on the admin panel's `getImageUrl`, incl. the `/api`-suffix strip that the naive fix gets wrong.
  Applied at every load-from-API site, **not** at render, so the payload keeps the relative value
  the server expects back — display and persistence stay separate.
  ⚠️ **The audit undercounted: it is ~18 fields across 5 screens, not 10 across 4.**
  `DriverVehicleScreen` has 8 more (`:353-376`) and was missed because the first sweep grepped for
  the `data:${mimeType}` string rather than the display sites.
  `asset.type` → `asset.mimeType` in all **5** screens (15 occurrences), fixing both latent defects
  at once: the malformed prefix **and** the always-`jpg` extension, whose `else if (asset.uri)`
  fallback becomes reachable again.
- [x] 4. **DONE 2026-08-02. Item 1 — passport + taxi-licence date limits.**
  ⚠️ **The plan's approach was wrong and is corrected here:** these screens do **not** use a native
  `DateTimePicker` — they build their own day/month/year lists, which is *why* `maximumDate` appears
  nowhere in the app. The limits had to go into the generators instead.
  New `utils/dateLimits.ts` — `DateBound` (`notFuture` | `notPast` | `any`), `isDateWithinBound`,
  `selectableDays`, `selectableMonthValues`, `selectableYears`. Everything compares at **day**
  granularity, because a raw `date > new Date()` makes *today* fail its own check.
  Passport: birth/issue → `notFuture`, expiry → `notPast`. Taxi: issue + valid-from → `notFuture`,
  valid-until → `notPast`. Both got a confirm-time check as well, since the wheels are independent.
  Taxi also gained the two **typed-path** rules — without them the wheel limits are cosmetic.
  Passport's `generateMonths` had **12 hard-coded Uzbek month names**; swapped to the `t()` keys the
  licence screen already used, since the function was being rewritten anyway.
- [x] 5. **DONE 2026-08-02. Item 1 — `DriverLicenseScreen` reconciled** onto the shared helper;
  ~60 lines of hand-rolled clamping deleted. Its hard-coded Uzbek message turned out to have
  **6 more copies** across it and the passport screen (the typed-input paths) — all now
  `t('formValidation.dateCannotBeFuture')`. New keys `dateCannotBeFuture` / `dateCannotBePast` in
  `uz`/`ru`/`en`.
- [x] 6. **DONE 2026-08-02. Item 3 — shim widened.** Even smaller than planned: `api/driver.ts`
  **already** had all three deeper calls including `fetchGeoNeighborhoods` (:312, :320, :324).
  Only `api/geo.ts` was narrow — it now re-exports administrative-areas, settlements and
  neighborhoods too. Nothing new had to be written.
- [ ] 7. 🛑 **BLOCKED ON THE OWNER — the target screen cannot be determined from code.** Scoping it
  (as this step required) produced a surprise: **the driver's address cascade is already complete.**
  `DriverPersonalInfoScreen` loads country → province → city-district → administrative area →
  settlement → **neighborhood** (`:37-40, :421-422`), and `DriverVehicleScreen` the same. They
  import from `../api/driver` directly, so the narrow shim never blocked them.
  What *does* stop at city-district: **`OfferWizardScreen`** (`:182, :208, :292…` — the route
  picker) and **`SearchPassengerOffersScreen`** (`:49-62` — a search filter, where a deeper filter
  would mostly return nothing). `DriverPassportScreen` stops at city too, but correctly: its geo is
  a **birth place** stored as free text, not an address.
  So "tuman shahar aholi punkt ma'muriy" is either (a) the offer wizard's route picker needing the
  deeper levels, or (b) those four dropdowns being **empty on the device**, which would be a data
  problem in the admin upload, not app code — and cannot be checked from here without the DB.
  ⚠️ Note (b) is the reading the wording favours: those four levels are exactly what
  `DriverPersonalInfoScreen` already offers, and "man bergan bazani torting" is about **data**.
- [x] 8. **DONE 2026-08-02. Static verification.** All four at baseline together:
  **API 282 · admin 0 · user 12 · driver 36 — zero new errors.**
  **29/29 runtime checks green** via `<scratchpad>/t030-check.mjs`: 21 i18n resolutions (7 keys ×
  3 locales) plus 8 date-bound cases — including the boundary a naive `date > new Date()` gets
  wrong, where **today must satisfy both bounds** whatever the time of day.
  Hard-coded-string sweep of the touched screens removed **18** literals in total (12 month names,
  6 copies of the date message).
- [ ] 9. **Owner: rebuild the driver app + smoke test.** (a) issue date rejects tomorrow, on all
  three document screens; (b) valid-until rejects yesterday; (c) upload a photo on each of the 4
  screens and confirm it is stored **and** displays afterwards; (d) district → settlement /
  administrative area populate from the admin data; (e) the offer-note placeholder reads correctly.
- [ ] 10. **Commit** with a clear message, owner-approved.

## Files to touch (verified against the repo 2026-08-02)
- `driver-app-standalone/translations/{uz,ru,en}.ts` — items 1, 4 (+ any new keys)
- `driver-app-standalone/screens/DriverPassportScreen.tsx` — items 1, 2
- `driver-app-standalone/screens/DriverTaxiLicenseScreen.tsx` — items 1, 2
- `driver-app-standalone/screens/DriverLicenseScreen.tsx` — items 1, 2
- `driver-app-standalone/screens/DriverPersonalInfoScreen.tsx` — item 2
- `driver-app-standalone/api/driver.ts` + `api/geo.ts` — item 3
- Whichever driver screen(s) step 7 identifies — item 3
- **NEW** `<scratchpad>/t030-*.mjs` — verification scripts, not committed

## Risks / open questions (READ before coding)
- ⚠️ **Item 2's fix may not be item 2's problem.** The owner says uploads work, so the `asset.type`
  defect may be latent — a malformed prefix that the API happens to ignore. The audit must
  establish which, and the answer changes whether this is urgent or tidy-up.
- ⚠️ **"Today" is ambiguous at the boundary.** A `maximumDate` of `new Date()` also caps the *time*,
  which can reject today's date on some pickers. Normalise to end-of-day for maxima and
  start-of-day for minima.
- ⚠️ **Timezone.** The device clock decides "today"; the API may disagree. For document dates this
  is acceptable, but do not add a server-side check that could contradict the client by a day.
- ⚠️ **These screens accept typed dates as well as picked ones** (`handleDateInputChange`), so
  picker limits alone are not enough — the validation path needs the same rule or the limit is
  cosmetic.
- ⚠️ **Item 3 has no shared LocationCard in the driver app.** The user-app fix was one component;
  here it may be two screens with different shapes. Scope it in step 7 before writing code.
- ⚠️ **The driver app is already awaiting a rebuild for T-027** (push tap) and T-025. Fold step 9
  into that same session rather than queueing another.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`,
  `GRADLE_OPTS` truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` keeps picking up changes from permission prompts — keep it out of commits.

## Session notes (one line per work session)
- **2026-08-02** — plan approved; **steps 1-6 and 8 done, step 7 blocked on the owner.** The audit
  (step 2) was the valuable part: it proved the owner right (uploads work) and found the real bug
  on the way **back** — a host-less `/uploads/...` handed to `<Image>`. Two of my own earlier
  conclusions had to be corrected mid-task: the photo bug is **18 fields across 5 screens**, not
  10 across 4; and the date fix could not use `maximumDate` because these screens hand-roll their
  pickers. Item 3 turned out to be nearly done already — the driver's address cascade is complete
  and the shim was the only narrow part.

## Resume point (for the next chat)
**Steps 1-6 and 8 are DONE. Step 7 needs an owner answer** (which screen item 3 means — or whether
it is a data problem, see step 7). Then step 9 (owner rebuild + smoke test) and step 10 (commit).

⚠️ **T-027 is also uncommitted** in the same working tree (25 modified + 5 new files) and still
needs its migration run. Do not mix the two when committing.

All four items are grounded with line numbers in **Current state** above and quoted verbatim in
`docs/OWNER_REQUESTS.md` OR-011 — a cold-start chat does not need to re-investigate them.

⚠️ **T-027 is uncommitted on disk** (25 modified + 5 new files) and still needs its migration run.
Do not confuse its changes with this card's when committing.

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12**, driver app **36**.
