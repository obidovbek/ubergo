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
- [ ] 1. **Item 4 — the offer-note placeholder** (one string, three locales). Smallest possible
  change; leaves the app runnable and gives the owner something visible immediately.
- [ ] 2. **Item 2 — audit the photo path end-to-end** and write the findings into this plan before
  changing anything: picker options → base64 assembly → request → API validation/storage → what the
  admin panel and the app render. Confirm whether the `asset.type` defect actually reaches the
  server (it may be that the API never inspects the prefix, in which case it is latent, not live).
  **Report before fixing** — the owner asked for a check, not a blind fix.
- [ ] 3. **Item 2 — fix what the audit found.** At minimum `asset.mimeType` in the 4 screens, with
  `asset.type`'s image/video distinction preserved where it is genuinely wanted.
- [ ] 4. **Item 1 — passport + taxi-licence date limits.** `maximumDate={today}` on issue/from
  dates, `minimumDate={today}` on valid-until/expiry, plus the matching validation so a typed date
  (these screens accept keyboard input too) is rejected the same way as a picked one.
- [ ] 5. **Item 1 — reconcile `DriverLicenseScreen`.** Give it the same `maximumDate` treatment and
  replace the hard-coded Uzbek string at :661 with an i18n key in all three locales.
- [ ] 6. **Item 3 — export the missing geo levels.** Add `fetchGeoNeighborhoods` to
  `api/driver.ts` (the endpoint exists) and widen the `api/geo.ts` shim to re-export
  administrative-areas, settlements and neighborhoods too.
- [ ] 7. **Item 3 — wire the cascade** in the driver screen(s) that pick a location, mirroring what
  T-027 step 4 did in the user app's `LocationCard`. ⚠️ Identify the target screen(s) first —
  `OfferWizardScreen` and `SearchPassengerOffersScreen` both handle geo and they do **not** share a
  component the way the user app does.
- [ ] 8. **Static verification.** `tsc` in all four projects against baselines (API **282**,
  admin **0**, user **12**, driver **36**). Sweep every touched screen for hard-coded strings; run
  an i18n key check like T-027's for any new keys.
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
- _(empty — nothing worked yet; plan awaiting approval 2026-08-02)_

## Resume point (for the next chat)
**Nothing has been done. The plan above is awaiting owner approval — no code has been written.**
Start at step 1.

All four items are grounded with line numbers in **Current state** above and quoted verbatim in
`docs/OWNER_REQUESTS.md` OR-011 — a cold-start chat does not need to re-investigate them.

⚠️ **T-027 is uncommitted on disk** (25 modified + 5 new files) and still needs its migration run.
Do not confuse its changes with this card's when committing.

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12**, driver app **36**.
