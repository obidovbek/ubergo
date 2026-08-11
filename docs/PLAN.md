# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-059 moved intact → `docs/PLAN-T059.md`** (steps 1-4 done; owner's rebuild + commit remain).
> ✅ **T-055** → `docs/PLAN-T055.md`. ✅ **T-057** → `docs/PLAN-T057.md`. ✅ **T-054** →
> `docs/PLAN-T054.md`. ✅ **T-045** → `docs/PLAN-T045.md`. ✅ **T-024** → `docs/PLAN-T024.md`.
> ✅ **T-056 · T-058 done 2026-08-11** — small enough to live on their cards.
> 🔴 **T-047 PARKED** — killed-app push tap; needs a `logcat` line before more code.
> 🛑 **T-031 PARKED BY THE OWNER 2026-08-11** — its remaining steps **are** the payment work.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own
> `docs/PLAN-T0*.md`; most are waiting on the owner, not on code.

## Task
- **ID / name:** T-061 — driver registration: a form that refuses you without saying why
- **Goal (definition of "done"):**
  1. **A 16-digit PINFL cannot be saved** — the app refuses it, *and* the API refuses it if the app
     is bypassed. Exactly 14 digits.
  2. **Every validation failure names its field.** No headless *" noto'g'ri formatda"*, and no raw
     English Sequelize text ever reaches a driver.
  3. **No field can hold an error the driver cannot see.** Every registration field that can be given
     an error renders that error, and the form scrolls to the first one.
  4. **The licence step can always be completed** — an optional category date is never a permanent
     dead end.
  5. The passport birth-place label reads **"Shahar / Tuman"**, not "Shahar".
  6. The driver app's **home header and splash read "UbexGo Driver"**.
  7. `tsc` at baselines: API **281** · admin **0** · user **9** · driver **35**.
- **Why now:** the owner's device test, 2026-08-11 — five of the six findings are on the driver
  registration flow, and two of them (**⑤ licence, ④ nameless error**) *stop registration outright*.
  Nothing else on the board needs Claude work.

## What is already there (verified 2026-08-11 — do NOT re-derive)

### The PINFL hole is three holes, one per layer (owner item ②)
🔴 **App:** the input has **no `maxLength`** (`DriverPassportScreen.tsx:1229-1238`). `handleFieldBlur`
*does* test `/^\d{14}$/` (`:751`) — but `handleContinue` checks only "not empty" (`:856`) and then
**`setFieldErrors({})` at `:904` wipes the blur error** before posting. So the red text appears, and
tapping *Keyingi* erases it and saves.
🔴 **API:** `passportValidation` enforces exactly 14 (`validator.ts:150-156`) — and is **never
mounted**. `driver.routes.ts:23` is a bare `router.post('/profile/passport', …)`.
🔴 **DB:** `driver_passports.pinfl` is **`TEXT`** (`DriverPassport.ts:135`). Nothing truncates.
⚠️ **This is not one dead validator — it is six.** `driverDetailsValidation`, `personalInfoValidation`,
`passportValidation`, `licenseValidation`, `vehicleValidation`, `taxiLicenseValidation` are exported
and imported by **nothing**. The whole driver-registration API has **zero** server-side validation.

### Why the error never says which line (owner item ④)
🔴 **The API blanks the field on purpose:** `errorHandler.ts:51` and `:65` both send
`t('validation.invalid', language, { field: '' })`, and the template is **`"{field} noto'g'ri
formatda"`** — so the driver reads a sentence with its subject deleted.
✅ **The machinery to name it already exists and is already correct.** `formatValidationErrors` →
`getValidationError` → **`getFieldName`** resolves `fields.<key>`, and that dictionary is populated:
`pinfl: 'JSHSHIR'`, `address_city_district_id: 'Shahar / Tuman'`, … (`i18n/translations/uz.ts:43+`).
The per-field `errors[]` array is **already sent and already right** — only the headline is empty.
🔴 **And the apps throw that array away.** All five driver registration screens gate it on
**`if (statusCode === 422)`** (`DriverPassportScreen:935`, `DriverLicenseScreen:681`,
`DriverPersonalInfoScreen:1134`, `DriverVehicleScreen:1703`, `DriverTaxiLicenseScreen:942`) — but a
**Sequelize** validation failure comes back as **400** (`errorHandler.ts:63-69`) and a duplicate as
**409** (`:70-72`). So the details arrive and are discarded, and `handleBackendError` shows the
headless string instead.
⚠️ **`SequelizeValidationError` leaks English:** `errorHandler.ts:68` forwards Sequelize's own
`e.message` (*"Validation isEmail on email failed"*) untranslated.

### Why the licence screen is a dead end (owner item ⑤)
🔴 **The seven category rows render NO error text at all** (`DriverLicenseScreen.tsx:816-845`). They
get a red border and nothing else — while `issue_date` (`:791`) and `license_number` (`:810`) both
render theirs. **The message is computed and thrown away.**
🔴 **And those optional fields block the form.** `handleContinue:621-637` puts an error on any
category date that fails `parseDate`, then shows the generic `formValidation.fixErrors` toast and
**returns** (`:639-643`). Typing a bare year — `2015` → auto-formatted to `20.15` by
`handleDateInputChange` — is unparseable, so *Keyingi* dies silently, for ever, with the cause
possibly scrolled off-screen. **This is the owner's "u yog'iga o'tmayapdi" exactly.**
⚠️ **Suspected same class elsewhere, unmeasured:** `errorText` renders vs `fieldErrors` reads are
13/24 (personal), 13/33 (passport), **2/8 (licence)**, 23/57 (vehicle), 7/20 (taxi). Those ratios are
a smell, not a count — step 5 must produce the real list.

### The two cosmetics (owner items ③ and ⑥)
🔴 **One label, one screen:** `DriverPassportScreen.tsx:1299` says **`Shahar`**. The same field on
`DriverPersonalInfoScreen.tsx:1517` already says **`Shahar / Tuman`**, the picker's own title says
*"Shahar yoki tumanni tanlang"* (`:260`), and the API's field dictionary says `'Shahar / Tuman'`.
⚠️ Its neighbours `Mamlakat` (`:1249`) and `Viloyat` (`:1274`) are **hard-coded Uzbek** — the T-057
class, on the same three lines.
🔴 **The wordmark:** the five registration screens already say **"UbexGo Driver"** (hard-coded, T-050).
The **home menu** renders `t('auth.appName')` (`MenuScreen.tsx:205`) and the **splash** renders
`t('splash.appName')` (`SplashScreen.tsx:135`) — both are **`'UbexGo'`** in all three locales.
✅ Those are the **only two** call sites of either key in the driver app (grepped).

## Approach
Server first, then the apps, then the sweeps — because the app-side change for item ④ is
*"trust what the server sends"*, and that is only worth doing once the server sends something useful.
Cosmetics last: they are one-liners and must not be what breaks the build.

## Steps
- [x] 1. **DONE 2026-08-11. `passportValidation` is mounted on `POST /driver/profile/passport`** —
  and only there. The app's real payload was checked first: `handleContinue` already requires both
  `id_card_number` and `pinfl` to be non-empty, so the `required` rules cannot fire on a real
  submission and only the length rules can — which is the point. The route carries a comment naming
  **T-063** so the other four are not switched on by imitation.
- [x] 2. **DONE 2026-08-11. Every error has a subject again.** `{ field: '' }` is gone from both
  sites. ✅ **Nothing had to be built:** `err.errors[0].message` is already translated and already
  names its field, so the first entry simply *becomes* the headline.
  🔴 **`SequelizeValidationError` was worse than the card said** — it forwarded Sequelize's own
  English (*"Validation isEmail on email failed"*) straight to an Uzbek driver. It is now rebuilt
  from `fields.*` + a validation template, with an unknown validator degrading to a **named**
  "{field} noto'g'ri formatda" rather than leaking English.
  ✅ **409 duplicates now name their field too** (`validation.unique` already existed, unused).
  ⚠️ An **empty** `errors: []` is no longer attached — it is truthy, so it used to send the apps down
  their "field errors arrived" branch with nothing to show.
- [x] 3. **DONE 2026-08-11. The PINFL cannot be typed or submitted wrong.** `maxLength={PINFL_LENGTH}`
  on the input, and **one** `validatePinfl` helper now serves *both* the blur and the submit path —
  their disagreement was the whole defect (blur caught the 16 digits; submit's "not empty" check
  passed and `setFieldErrors({})` then erased the blur's error on the way out).
- [x] 4. **DONE 2026-08-11 — and the status code turned out to be the wrong question.** Instead of
  listing 400/409/422 in five screens, one shared **`getFieldErrors(error)`** asks *did the server
  name any fields?* A 400 with no `errors[]` still returns `null` and falls through to
  `handleBackendError`, so ordinary failures are not swallowed.
  🔴 **`parseValidationErrors` only read the axios-shaped `.response`** — a correctly-built `ApiError`
  (which carries `.data`) looked like it had no field errors at all. Now reads both.
- [x] 5. **DONE 2026-08-11. No invisible errors, and the form jumps to the first one.** New shared
  `useFieldScroll` (`utils/formScroll.ts`), modelled on the user app's `UserDetailsScreen`.
  ⚠️ **`onLayout` reports y relative to the PARENT**, and on all five screens the fields sit inside
  `<View style={styles.form}>` under a header — so the container's own offset is recorded too.
  Without it every scroll would land short by the header's height, and a scroll that goes to the
  wrong place still *looks* like it worked.
  ✅ "First" is decided by the recorded offsets, not a hand-kept field order, so reordering a screen
  cannot silently break it.
- [x] 6. **DONE 2026-08-11.** `Shahar` → **`Shahar / Tuman`**, with `Mamlakat`/`Viloyat` moved into a
  new `driverPassport` i18n section ×3 locales (the screen had **no** section at all — it is
  hard-coded Uzbek throughout, so this is a first slice, not a full pass).
  🔴 **The wordmark could NOT simply become "UbexGo Driver".** At `fontSize: 38` beside the profile
  button it is ~300px wide — folding it into the logo would re-create the exact overflow **T-050**
  fixed, only ellipsized instead of wrapped. "Driver" is therefore its **own line** under the
  wordmark (`auth.appNameDriverSuffix`), and `auth.appName` still reads plain "UbexGo".
  ⚠️ **The splash was deliberately left alone** — see the open question below.
- [x] 7. **DONE 2026-08-11. 91/91, proven able to fail — 70 red against pre-change code.**
  The suite drives the **real** modules: the actual `passportValidation` middleware and the actual
  `errorHandler`, with their whole import graph transpiled so the assertions land on the **shipped**
  translations rather than stubs. It reproduces the owner's symptoms on the old code — the headless
  **`" noto'g'ri formatda"`**, Sequelize's English leaking, the unmounted PINFL rule.
  🔴 **The suite was wrong twice before the code was** — a `.*\n` strip pattern silently failed on
  **CRLF** (`.` eats the `\r`), so it loaded the real toast module and **crashed instead of
  reporting**; and a `t\('…'\)` regex matched the tail of `getLabelSty**le('first_name')**`,
  inventing 42 missing i18n keys. Both fixed, and `formScroll` now hard-fails if it fails to load
  rather than letting 7 checks silently vanish. **Third and fourth time this project has hit the
  crash-instead-of-red trap.**
  `tsc` API **281** · admin **0** · user **9** · driver **35** — all at baseline, **zero errors in
  any touched file** (the driver app's 4 translation errors proven pre-existing via `git stash`).
- [ ] 8. **Owner:** deploy the API, rebuild the driver app, walk registration end to end — try a
  16-digit PINFL, a bad category date, and a deliberately wrong field.
- [ ] 9. Commit (only after the owner's approval).

## Files to touch
- `api,admin,db/apps/api/src/routes/driver.routes.ts` — mount one validator
- `api,admin,db/apps/api/src/middleware/errorHandler.ts` — the headless message + Sequelize mapping
- `api,admin,db/apps/api/src/i18n/translations/{uz,ru,en}.ts` — a summary key; `fields.*` gaps
- `driver-app-standalone/screens/DriverPassportScreen.tsx` — PINFL, labels, 400-handling, scroll
- `driver-app-standalone/screens/DriverLicenseScreen.tsx` — the seven category rows, 400-handling
- `driver-app-standalone/screens/{DriverPersonalInfo,DriverVehicle,DriverTaxiLicense}Screen.tsx` —
  400-handling + the invisible-error sweep
- `driver-app-standalone/translations/{uz,ru,en}.ts` — wordmark, `addressCityRequired`, new labels
- ❌ **No migration.** ❌ User app untouched. ⚠️ **Needs an API deploy** — it joins the one already
  queued (T-034 · T-043 · T-045 · T-054 · T-055), so it costs no extra run.

## Risks / open questions (READ before coding)
- 🔴 **Mounting a validator on a live route can break a flow that works today.** `passportValidation`
  also demands `id_card_number` ≥ 5 and `pinfl` **present** — and the edit path posts `cleanData`
  with empty strings stripped. Prove the real payload passes **before** step 1 ships.
- 🔴 **Do not let step 4 swallow ordinary 400s.** Only unpack when the body actually carries
  `errors[]`; a 400 without it must still reach `handleBackendError`.
- ⚠️ **Step 5 is where this card can quietly do nothing.** Rendering `<Text>{fieldErrors[k]}</Text>`
  proves nothing unless something *sets* that key — the suite must drive the real submit handler, not
  the JSX. (T-054's lesson: the fix that edits the wrong object changes nothing.)
- ⚠️ **`auth.appName` may not be driver-only in meaning.** Verified today as a single call site, but
  re-grep before changing the **value** rather than adding a key — a shared key silently renamed is
  how T-059's uz-only labels happened.
- 🔴 **OPEN — owner item ① is NOT in this card.** The driver's email is written to
  `driver_profiles.email`, the passenger's to `users.email` (unique). Filling one leaves the other
  empty. **Which column should hold a driver's email?** → logged as **T-062**, blocked on that answer.
- ⚠️ **OPEN — should an unparseable *optional* category date block *Keyingi* at all?**
  Recommendation: **yes, keep blocking** (it is real data the admin will read) — but visibly, at its
  own row. **Built that way**; say so if you would rather it be dropped with a warning.
- ⚠️ **OPEN — the SPLASH screen still says plain "UbexGo".** Only the home menu got the "Driver"
  line. The splash wordmark lives inside a **140px circle** that T-050 showed could barely hold
  "UbexGo" at 36px; "UbexGo Driver" cannot fit there at any sensible size. If you want it branded
  too, the circle has to grow or the lockup has to change — **tell me and it becomes its own card.**
- ⚠️ These five screens are the ones **T-057 changed and nobody has rebuilt yet.** One rebuild covers
  both cards; if something looks wrong on the device, T-057 is the other suspect.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).

## Session notes (one line per work session)
- **2026-08-11** — plan written from the owner's device-test list; six findings triaged, five land
  here, item ① split out as T-062 for want of an owner decision.
- **2026-08-11** — steps 1-7 done in one pass. Three things the card did not go looking for:
  Sequelize's **English** leaking to Uzbek drivers, `parseValidationErrors` reading only one of the
  two error shapes, and a **second** submit-blocking path on the taxi screen with the same nameless
  toast (found by the suite, not by reading). Two duplicated success toasts removed as well.

## Resume point (for the next chat)
**T-061 steps 1-7 DONE 2026-08-11. Only step 8 (owner: deploy + rebuild + walk) and step 9 (commit)
remain.** ⚠️ **Needs an API deploy** — it joins the queued one (T-034 · T-043 · T-045 · T-054 ·
T-055). ❌ No migration. ❌ User app untouched.

**What changed:** a 16-digit PINFL is now refused by the app *and* the API; every validation failure
names its field instead of *" noto'g'ri formatda"*; all five registration screens read the server's
field errors on **any** status and scroll to the first problem; the licence screen's seven category
rows finally render their message, so an unparseable date is no longer a permanent dead end; the
passport label reads **"Shahar / Tuman"**; and the driver home menu is branded **UbexGo / DRIVER**.

⚠️ The rest of the board is unchanged and still waiting on the owner's device: **ten code-complete,
untested cards** in two runs — one API deploy (T-034 · T-043 · T-045 · T-054 · T-055, and now this
card) and one app rebuild (T-024 · T-046 · T-056 · T-057 · T-058 · T-059); **T-046 also needs its
migration**. **Baselines:** API **281** · admin **0** · user **9** · driver **35**.
