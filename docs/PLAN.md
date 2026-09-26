# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 📦 **T-127 → `docs/PLAN-T127.md`** (DONE, `cdded9a`, *Parked*) · **T-102i → `PLAN-T102i.md`** ·
> **T-114 → `PLAN-T114.md`** · **T-102 → `PLAN-T102.md`** (§9 = the parent's resume point) ·
> **T-101 → `PLAN-T101.md`** · **T-116 → `PLAN-T116.md`** · **T-088 → `PLAN-T088-finish.md`** ·
> **T-122 / T-123 / T-121 / T-118** → their own files.

---

## 🔴 BOARD STATE 2026-09-24 — read before starting anything

**`tsc` BASELINES: API 281 · admin 6 (`tsc -b`) · user 3 · driver 19.** Lint 0 errors everywhere;
**warnings API 230 · user 208 · driver 275.** Colour ceilings user 1 · driver 3. **Never raise one.**
**Suites:** **API 442** · **user 285 + 13 checkers** · **driver 295 + 12 checkers** (2026-09-21;
step 1 re-measures). **Ratchets this card can trip:** the API's `i18n/unkeyedErrors.test.ts`
(**CEILING 107** English 4xx `AppError`s — a new English 400 RAISES it and goes red) and the driver
app's `check-raw-error-toasts.mjs` (no toast may show a raw `.message`).
**Board:** `node scripts/check-board.mjs` → ✓; *Now* = **T-129 · T-102**.
🛑 **The device backlog is long and this card adds to it:** T-102c 1-3, T-102e, T-102i, T-114 ①,
T-115, T-116, T-123, T-127, T-088's 401 — **none walked on a phone, and the API is not deployed.**
🔒 **T-131 (one-line delete of the OTP `console.log`) must ride the same API deploy.**

---

## Task

- **ID / name:** T-129 — **driver registration: the server's answers reach the screens, dates
  travel as ISO.**
- **Why now:** owner reported 2026-09-24 — *"Haydovchilik guvohnomasi sahifasida Malumotlarni
  saqlashda hatolik deb beryapti"*. Registration is blocked at step 3 for every driver, and the
  dates it did manage to save may be wrong.
- **What is wrong today, in one line:** **the licence page refuses every save and cannot say why.**

### 🔴 What is true today (measured 2026-09-24, read from the code and one node one-liner)

1. **The screen cannot see the answer.** All **13** wrappers in `driver-app-standalone/api/driver.ts`
   do `throw new Error(result.message || …)` — no status, no body (`:123 :261 :613 :647 :681 :715`
   and the seven geo/vehicle loaders). `getFieldErrors` reads `error.response.data.errors` → `null`;
   `handleBackendError` sees `status === undefined`, treats it as a dropped connection and shows the
   screen's `defaultMessage` — `driverLicense.errorUpdate` = *"Ma'lumotlarni saqlashda xatolik"*.
   **T-061 (2026-08-11) rebuilt the screens to display the server's `errors[]`; nothing has ever
   arrived.** `api/auth.ts` already does it right: `throw new ApiError(response.status, data, …)`.
2. **The licence validator reads the wrong level.** `validateRequest` looks up `data[rule.field]`
   (top level only, `validator.ts:52`); `licenseValidation` (T-063) requires `license_number`
   (`:193`); `DriverLicenseScreen` posts `{ license: { license_number, issue_date, category_* },
   emergencyContacts }` (`:668`). → **422 on every save**, message *"Guvohnoma raqami kiritilishi
   shart"* — which layer 1 then hides. **T-063's card claims a 32-test suite; nothing in the API
   references `licenseValidation` but the validator, the route and `VALIDATOR_EXPORTS_FIX.md`.**
3. **Dates are ambiguous on the wire.** Personal-info (`birth_date`), passport (`birth_date`,
   `issue_date`, `expiry_date`) and licence (`issue_date` + 7 `category_*`) post the display
   format `DD.MM.YYYY` unchanged. The models are `DATEONLY`; Sequelize's `_sanitize` is
   `moment(value).format('YYYY-MM-DD')` with **no format string**. Measured in the API's own
   `node_modules`:
   `15.03.2015 → "Invalid date"` (Postgres rejects → 500 → generic toast) ·
   `01.03.2015 → 2015-01-03` (**day and month swapped, saved without a word**).
   The server's `date` rule is `Date.parse` (`:117`): same behaviour, so it catches nothing the DB
   would not. **13 of the 16 DATEONLY columns on the driver models are fed this way; only
   `DriverTaxiLicenseScreen` converts to ISO** (`convertDateToISO`, `:177`, screen-local).
4. Four screens carry their own copy of `convertDateFormat` (ISO → display); `utils/date.ts` has no
   display → ISO helper. Emergency contacts are fine (only `driver_profile_id` is required).
5. **None of the five registration screens has a test**, and `api/driver.ts` has none.

## Approach

**Fix the class, not the instance** (`ubexgo-fix-the-class-not-the-instance`): 13 wrappers, not
one; all date-bearing screens, not the licence page; every DATEONLY field the driver routes accept,
not `license_number`.

- **Server, dates (strict):** the `date` rule accepts **only `YYYY-MM-DD`** — `01.03.2015` is
  ambiguous and the server cannot know which was meant, so refusing beats guessing. Pure
  `utils/isoDate.ts`, tested with the owner's kind of input. Rule added to **every** DATEONLY field
  on the five driver routes (16 fields; keyed `validation.invalidDate` exists in uz/ru/en).
- **Server, nesting:** `validateRequest` learns a dotted path (`license.license_number`) via a pure
  `readField(data, path)`; the app already strips the `license.` prefix when it maps `errors[]`
  back to its form (`DriverLicenseScreen:700`). ⚠️ `getFieldName` resolves `fields.<key>` — a
  dotted key must resolve `fields.license_number`, or the message loses its subject (T-061's exact
  bug). Step 1 checks this.
- **App, dates:** one pure `utils/formDate.ts` — `toIsoDate('15.03.2015') → '2015-03-15' | null`,
  `fromIsoDate('2015-03-15') → '15.03.2015'` — replaces four screen-local copies and the taxi
  screen's helper; conversion happens **at the POST boundary**, in pure payload builders.
- **App, wrappers:** one module-local `readJsonOrThrow(response, fallback)` in `api/driver.ts`
  that throws `ApiError(response.status, body, fallback)` (the `auth.ts` idiom); all 13 use it. A
  checker (`scripts/check-api-errors.mjs`) so a bare `throw new Error(result…` cannot return.
- **Deploy order:** API first — the old app build is blocked at the licence today anyway, and the
  strict date rule turns its silent swap into a keyed refusal. Then the driver-app rebuild.

## Steps

- [x] **0a** Board: T-129 → *Now* (P1), T-130 (P2) and T-131 (P1) → *Next*; T-127's card repointed
  at `PLAN-T127.md`, its stale "NOT COMMITTED" corrected; T-061 / T-063 carry a dated correction;
  `check-board` ✓.
- [x] **0b** Plan approved by the owner 2026-09-24 ("i confirm" — decisions ①–③ at their defaults).
- [x] **1 Measure, no code — done 2026-09-24.** Baselines re-run, **identical to the board:**
  API `tsc` 281 · lint 0/230 · **442/442**; driver `tsc` 19 · lint 0/275 · **295/295 + 12
  checkers** (44.9 s) · 3 colours.
  **Payloads, read from the code:** personal-info → `/personal` flat, trimmed, empties dropped,
  `birth_date` DD.MM.YYYY raw · passport → `/passport` flat, `birth_date`/`issue_date`/
  `expiry_date` raw · licence → `/license` **nested** `{ license: {…}, emergencyContacts? }`, 8
  dates raw · vehicle → `/vehicle` flat, no dates, `license_plate` top-level ✓ · taxi →
  `/taxi-license` flat, 3 dates **already ISO** (screen-local `convertDateToISO`), `license_number`
  top-level ✓. So the nesting bug is the licence route alone; the date bug is three screens.
  **DATEONLY per route: 1 + 3 + 9 + 3 = 16** (licence: `birth_date` + `issue_date` + 7
  `category_*`; the app never sends `license.birth_date`, the service accepts it — rule it too).
  **Admin: closed (risk ⑤).** It only READS driver dates (`DriverDetailPage`); its writes go to
  `/admin/drivers/:id` and `/status`, and no admin route imports the driver validators.
  **Dotted key: confirmed (risk ⑥).** `getFieldName` → `t('fields.license.license_number')`, and
  `t()` returns the KEY on a miss → *"fields.license.license_number kiritilishi shart"*. Step 3
  resolves the leaf when the full path is not in the dictionary.
  **Ceiling: safe.** `unkeyedErrors.test.ts:111` scans `new AppError(` sites only; `validateRequest`
  throws `ValidationError`, keyed through `validation.*`. Steps 2–3 add no `AppError`.
  **Harness: render is feasible.** `renderScreen` = real navigation + stubbed auth with
  `token: 'test-access-token'`; tests mock `../api/driver` and `../utils/toast` per file (two do
  already); `jest-expo` auto-mocks `expo-image-picker`; the licence screen has no native date
  picker (text inputs); a missing translation key FAILS the test.
  **Reuse, not a sixth regex:** `utils/validation.ts` `isValidDate` and four screen-local
  `parseDate`s already parse DD.MM.YYYY. `formDate.ts` gets one `parseDisplayDate` the others can
  call; `isValidDate` stays (it caps the year at today, wrong for an expiry).
  **Raw-toast checker:** forbids `error.message` in toast args; step 6 passes the server's
  translated `errors[].message` via `getFieldErrors`, never `.message`. Checker house shape: node
  script, `✓`/`✗` verdict line, `exit 1`, a "PROVEN ABLE TO FAIL" footer.
- [x] **2 API — dates. Done 2026-09-24.** `isIsoDate` went into the existing `utils/validation.ts`
  beside its siblings rather than a new `isoDate.ts` (one import site, one test file). The `date`
  rule uses it, and all **16** DATEONLY fields now carry the rule: passport ×3, licence ×9 (dotted),
  taxi ×3, personal-info ×1 (it already had one). **API 442 → 465 tests.**
  🔴 **Two defects the step found that the card had not:** ① **`validation.invalidDate` carried no
  `{field}`** — every date refusal read *"Sana noto'g'ri formatda"*, and the licence page has NINE
  date fields. That is T-061's *"it says the data is wrong but not which row"* in a second place;
  the template now names its subject in all three locales. ② **`fields.license_issue_date` did not
  exist** in any locale, so that field's refusal named the raw column. Added.
- [x] **3 API — nesting. Done 2026-09-24.** `utils/readField.ts` + test (dotted, plain key, missing
  branch, null/string/number branch, array index); `validateRequest` reads through it;
  `licenseValidation` requires `license.license_number`; **`getFieldName` falls back to the LEAF** of
  a dotted key, because `t()` returns the key on a miss and *"fields.license.license_number"* would
  otherwise have gone to a driver. `email`/`phone` now pass `String(value)` — `readField` returns
  `unknown` where the index read returned `any`, and a `typeof` guard would have started ACCEPTING
  `{ email: 12345 }`, which the old code refused.
  ✅ Checked, no code written: every Sequelize `validate:` block in the models is attached to a
  **column**, so `mapSequelizeErrors`' `item.path` is always set and the new `{field}` template
  cannot produce a headless sentence there.
  ✅ **Proven able to fail — 9 mutations, 9 red** (scratch runner, each file restored and
  byte-compared): ⓐ `readField` reads the top level only · ⓑ the `date` rule back to `Date.parse`
  · ⓒ `isIsoDate` drops the calendar check · ⓓ `getFieldName` loses the leaf fallback · ⓔ the
  licence rule back to a top-level `license_number` · ⓕ the uz dictionary loses
  `license_issue_date` · ⓖ the licence date rules dropped · ⓗ the passport date rules dropped ·
  ⓘ `invalidDate` stops naming its field.
  🔴 **ⓕ CAME BACK GREEN THE FIRST TIME** — removing a `fields.*` entry left every assertion happy,
  because the leaf fallback then yields the column name, which is a plausible word and not a
  visible key. The test was rewritten to refuse a snake_case token in any message; it is now red.
  *A mutation is the only thing that finds an assertion this shape.*
- [x] **4 App — dates. Done 2026-09-24.** `utils/formDate.ts` — `parseDisplayDate`,
  `formatDisplayDate`, `toIsoDate`, `fromIsoDate` — with 18 tests. **227 lines deleted from the
  four screens for 61 added:** all four `convertDateFormat` copies (byte-identical, md5-checked)
  and all four `formatDate` copies (likewise) are gone, plus the taxi `convertDateToISO`; 18 call
  sites renamed. **Driver 295 → 313 tests**, `tsc` 19, lint 0/275, 12 checkers — all at baseline.
  ✅ **What the copies disagreed on was the YEAR CEILING** — personal-info refused anything after
  the current year, the other three allowed ten more. That is a *rule*, not parsing, so the shared
  parser has **no ceiling** (documented and pinned by a test) and each screen keeps its own number
  in a 4-line `parseDate` wrapper over the shared parse. Nothing changed behaviour; the rules about
  which dates are allowed stay in `utils/dateLimits.ts` where T-101 put them.
  ✅ **Proven able to fail — 7 mutations, 7 red**, each naming the expected test: ⓐ `toIsoDate`
  swaps day and month (5 red, including *"NOT 2015-01-03"*) · ⓑ the calendar read-back removed ·
  ⓒ padding removed · ⓓ `fromIsoDate` blanks what it cannot read · ⓔ a year ceiling put back in
  the parser · ⓕ a half-typed date returned instead of null · ⓖ a loose ISO accepted as ISO.
  🔴 **The first run reported all seven GREEN — and that was the RUNNER, not the tests.** Jest
  prints `×` (U+00D7) on Windows and my matcher looked for `✕` (U+2715). Caught by mutating by hand
  and reading the raw output instead of trusting the summary. *A green mutation is a claim about my
  own tooling before it is a claim about the tests.*
  ⚠️ **The screens are swapped but still POST the display format** — the conversion goes in at the
  payload boundary in step 5. Nothing a driver does is different yet.
  ⚠️ **PowerShell fixed one self-inflicted problem:** the swap script left a bare LF where each
  deleted block had been, in four pure-CRLF files. Normalised and re-verified at 0.
- [ ] **5 App — payload builders.** `utils/registrationPayload.ts`: `buildPersonalInfoPayload`,
  `buildPassportPayload`, `buildLicensePayload(licenseData, contacts)` — dates → ISO at the boundary,
  empties dropped, `license` nested, contacts filtered. `registrationPayload.test.ts` asserts the
  wire shape (this is the one place the shape lives on the app side; step 3's test is its twin).
  The three screens call the builders. Taxi keeps its shape, uses the shared helper.
- [ ] **6 App — wrappers.** `api/driver.ts`: `readJsonOrThrow`; 13 wrappers use it.
  `api/driver.test.ts` with a mocked `fetch`: a 422 `{ errors: [{ field: 'license.license_number',
  message }] }` → the thrown error is an `ApiError` whose `getFieldErrors()` is that map; a 500 →
  `status` 500; a 200 → `data`. Then `DriverLicenseScreen.test.tsx`: submit → `updateLicense`
  called with ISO dates and nested `license`; a rejected 422 → **that** message under the field
  and in the toast, not `driverLicense.errorUpdate`. If rendering needs more mocks than the harness
  has, say so here and fall back to the builder tests + a thin render.
- [ ] **7 Checker.** `scripts/check-api-errors.mjs`: no `throw new Error(result` in `api/*.ts`
  (13 → 0, may not regrow). Proven red by re-adding one. **Also add** (raised by step 4): no screen
  may define its own date parser or formatter — the four copies this card deleted are exactly the
  thing that grows back, and `tsc` cannot see a re-added local function.
- [ ] **8 Prove red + re-measure.** ≥ 8 mutations, red set predicted before each; `tsc` / lint /
  `npm test` in both projects against the step-1 numbers; `check-raw-error-toasts` still green.
- [ ] **9 Docs.** `CHECKLIST.md` — a T-129 section (passport issue date on the 15th or later;
  licence with category B `25.06.2010`; licence number left empty → the toast **names the field**;
  the admin shows `2010-06-25`). The owner's read-only SQL for already-saved dates (decision ②).
  `TODO.md`, `JOURNAL.md`; `ARCHITECTURE.md` only if it lists utils. Commit proposed, not made.

## Files to touch

- API: `src/utils/isoDate.ts` (+test), `src/utils/readField.ts` (+test), `src/middleware/validator.ts`
  (+ blocks in `validator.test.ts`), `src/i18n/translator.ts` only if `getFieldName` needs the leaf.
- Driver app: `api/driver.ts` (+`api/driver.test.ts`), `utils/formDate.ts` (+test),
  `utils/registrationPayload.ts` (+test), `screens/DriverPersonalInfoScreen.tsx`,
  `DriverPassportScreen.tsx`, `DriverLicenseScreen.tsx` (+`DriverLicenseScreen.test.tsx`),
  `DriverTaxiLicenseScreen.tsx` (helper swap only), `scripts/check-api-errors.mjs`.
- Docs: `docs/CHECKLIST.md`, `docs/TODO.md`, `docs/JOURNAL.md`, this file.
- ❌ No migration · ❌ no dependency · ❌ `infra/**`, `.env`, user app, admin untouched.
- **Touched by steps 2-3 (8 files):** `src/utils/validation.ts` (+`.test.ts`),
  `src/utils/readField.ts` (+`.test.ts`, new), `src/middleware/validator.ts` (+`.test.ts`),
  `src/i18n/translator.ts`, `src/i18n/translations/{uz,ru,en}.ts`. No `isoDate.ts` — see step 2.

## Risks / open questions

- **① Strict ISO on the server** (default) vs accepting `DD.MM.YYYY` too. Default is strict: the
  server cannot disambiguate `01.03.2015`, and the app is the one that produced the display format.
  Consequence: the **old app build** gets a keyed *"Sana noto'g'ri formatda"* instead of a silent
  swap — an improvement even before the rebuild.
- **② Already-saved dates.** A swapped `2015-01-03` is indistinguishable from a real one. Default:
  **report, don't touch** — step 9 gives the owner a read-only SQL listing driver rows whose DATEONLY
  values all have day ≤ 12 (candidates), for a manual check in the admin. No data mutation by this
  card. Rows with day > 12 never saved (500), so nothing is missing silently.
- **③ Deploy order:** API first, then the app rebuild. Both are the owner's; neither is this card.
- **④** The five screens are 1 100–1 400 lines with image and date pickers; a render test may need
  mocks the harness lacks. Fallback in step 6 — the builder tests still hold the wire shape.
- **⑤** If the **admin panel** edits driver dates through the same routes in another format, the
  strict rule would refuse it — step 1 checks before step 2 lands.
- **⑥** Dotted keys vs `getFieldName` / `fields.*` — step 1 checks; step 3 resolves the leaf.
- **⑦ Seen, not changed:** the user app's wrappers also throw bare `Error`s (timeouts, geo); its
  registration posts no dates this way. Board at `/end-day` if the owner wants it.
- **⑧** Which API version is live is unknown; the owner's symptom fits both the 422 (if T-063 is
  deployed) and the 500 (either way). The fix covers both.

## Session notes

### 2026-09-24 — boarded and planned, nothing built

- Start-day arrived with three owner reports; all three grounded before a card was written. The
  licence failure turned out to be three layers, each hiding the one beneath: a wrapper that drops
  the body, a validator reading the wrong level, and a date format the ORM guesses at.
- The date finding was **measured, not read**: one node one-liner against the API's own `moment`
  turned "probably fine" into "swapped and saved".
- Two older cards were corrected on the spot rather than left to mislead: T-061 (its read path
  never received anything) and T-063 (its suite is not in the tree).
- **Steps 2-3 (server side) built and proven:** the licence rule reads the nesting the screen
  posts, a DATEONLY field takes ISO only, and a date refusal finally says WHICH date. API 465
  tests, `tsc` 281 and lint 0/230 both unmoved. Nine mutations, nine red — one of them only after
  the assertion it exposed was rewritten. The two extra defects (a template with no `{field}`, a
  missing dictionary entry) were both found by writing the test, not by reading the code.
- **Step 4 (the app's date helper):** 227 lines of duplicated date code deleted for 61, and the
  duplication turned out to be hiding a disagreement — one screen's parser refused a year the other
  three accepted. The shared parser therefore holds no rule at all, only the format.
- **Twice now a GREEN mutation has been the more useful result** — step 3's exposed an assertion
  that could not see a missing dictionary entry; step 4's exposed a runner that could not see a
  failing test on Windows. Neither was a fact about the code under test.

## Resume point

> **Updated 2026-09-24. Steps 0-4 DONE, NOT COMMITTED. The SERVER side is finished; on the APP side
> the shared date helper is in and the four screens use it, but nothing converts at the POST
> boundary yet — steps 5-7 remain.**
> **What works now, server-side:** a licence save is validated where the screen actually puts its
> fields, so `licenseValidation` no longer refuses every licence; a DATEONLY field accepts
> `YYYY-MM-DD` only, on all 16 fields across the five driver routes, so `01.03.2015` is refused
> instead of stored with its day and month swapped; and a date refusal names WHICH date, in uz, ru
> and en. **API `tsc` 281 · lint 0/230 · 465 tests (442 + 23), all green.** 9 mutations, 9 red.
> ⚠️ **The deployed app still posts DD.MM.YYYY, so until the app side lands and both are shipped,
> an old build gets a NAMED date refusal instead of a silent swap.** That is the intended interim
> state (risk ①), and it is strictly better than today — but it means **the API must not be
> deployed on its own and called finished.**
> **Step 4 landed:** `utils/formDate.ts` (+18 tests) replaced nine duplicated date helpers across
> the four registration screens; **driver 313 tests · `tsc` 19 · lint 0/275 · 12 checkers**, every
> baseline held. The screens still post `DD.MM.YYYY` — step 5 is where that changes.
> **▶️ NEXT: step 5** — `utils/registrationPayload.ts` with `buildPersonalInfoPayload`,
> `buildPassportPayload`, `buildLicensePayload` (dates through `toIsoDate`, empties dropped,
> `license` nested, contacts filtered) + its test, then the three screens call the builders. Its
> test is the twin of step 3's: one asserts the wire shape the app SENDS, the other what the server
> ACCEPTS. **Then step 6** (the 13 wrappers → `ApiError`, the screen test) and **step 7** (two
> checkers — see the step).
> **Driver-app baselines to hold: `tsc` 19 · lint 0/275 · 313 + 12 checkers · 3 colours.**
> Risk ⑤ (admin) closed; ⑥ resolved by the leaf fallback. 🔒 **T-131** still rides the same deploy.
> **T-131** (delete `console.log('code', code)`, `OtpService.ts:364`) is a separate one-line card
> in *Next*; it must land before the next API deploy. **T-130** (name prefill, expired passport)
> follows this card and reuses its helpers.
