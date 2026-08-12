# ✅ TODO — task board

> **Rules:** max **2** tasks in *Now*. New ideas always land in *Later* — they
> never interrupt the current task. Claude moves cards here during
> `/new-task` and `/end-day`. Humans can edit this file any time.
>
> **Format:** `T-###  (P1|P2|P3)  short name — detail`. P1 = most important.

> 📥 **2026-08-12 — A NEW OWNER BATCH OF 13 FINDINGS IS BOARDED AS T-064…T-074** (bottom of
> *Later*), grounded the same day.
> ✅ **EIGHT OF THE THIRTEEN ARE CODE-COMPLETE 2026-08-12** — T-065 · T-066 · T-067 · T-068 ·
> T-069 · T-070 · T-071 (item ⑪) · T-072. **All ride runs already queued: one API deploy (T-065
> only) and one rebuild of both apps.** No extra deploy, no extra rebuild, no migration anywhere.
> 🛑 **THREE REMAIN, ALL BLOCKED ON THE OWNER, NOT ON CODE:**
> • **T-064** — unblocked in principle (a confirmed driver may withdraw; the offer reopens to
>   `published`) but **not started**, and it still carries one unanswered sub-question: do the
>   auto-rejected drivers reopen? *(recommendation on the card: no)*.
> • **T-073** — **measured and the screen came back CLEAN** (66 keys evaluated, 3 locales, 0
>   unresolved). The reported mechanism cannot happen: a missing key renders the **key**, never
>   English. **Needs a screenshot of the actual English text.**
> • **T-074** — no structural cause found; needs a screen recording, and "slide" may mean a pager
>   that exists nowhere in either app.
> ⚠️ **Two smaller owner questions are open inside finished cards:** **T-071 item ⑫** needs a
> screenshot, and its five *labelled* registration back buttons were deliberately left alone (see
> the card); **T-069** turned out to have a wrong premise — the passenger side already refused past
> departures at submit.
> 🔴 **Three of the thirteen are defects already fixed ONCE in the other app** — T-066 = T-042②,
> T-067 = T-042③, T-065 = the rule `cancelOffer` follows and `updateOffer` does not.
> ⚠️ **This batch does NOT change the state below:** the eleven code-complete cards are still
> waiting on the same two runs (one API deploy, one app rebuild).

> 🛑 **STATE AT END OF 2026-08-11: the board is waiting on the owner's device again. No Claude work
> remains anywhere.**
>
> The owner's device test reopened the board with six findings; five became **T-061 — code-complete
> the same day**. The other two are **T-062** (🛑 blocked: which table owns a driver's email?) and
> **T-063** (four validators still deliberately unmounted).
>
> **ELEVEN code-complete, untested cards, still in exactly two runs:**
> 1. **ONE shared API deploy** → **T-034 · T-043 · T-045 · T-054 · T-055 · T-061** (no migration in any).
> 2. **App rebuild** → **T-024 · T-046 · T-056 · T-057 · T-058 · T-059** (+ the driver rebuild T-061 needs).
> ⚠️ **T-046 additionally needs its migration run.**
>
> 🔴 **Two places the risk is concentrated:** the phone gate (`gatePhones`) exists **twice** (T-054 ·
> T-055) and has never been seen on a device — **walk T-054 first**; and **T-061 mounted a validator
> on a live route**, so if the passport step starts refusing a real driver, that is the first suspect.
>
> 🛑 **Everything else is still waiting on the owner's device, not on code.**
> All 18 plan files were swept — **no Claude coding work remains in any of them.** Every unchecked
> step is the owner's, blocked on an owner answer (**T-030** step 7 · **T-031** steps 4-9 ·
> **T-047**), or needs a running device and API (**T-018** step 9).
>
> **TEN code-complete, untested cards, in exactly two runs:**
> 1. **ONE shared API deploy** → **T-034 · T-043 · T-045 · T-054 · T-055** (no migration in any).
> 2. **App rebuild only** → **T-024 · T-046 · T-056 · T-057 · T-058 · T-059**.
> ⚠️ **T-046 additionally needs its migration run** — it repairs stranded rows and prints the count.
>
> 🔴 **Where the risk is concentrated:** the phone gate (`gatePhones`) now exists **twice**, in
> `OfferDriverService` (T-054) and `OfferPassengerService` (T-055), and neither has been seen on a
> device. If it is wrong it is wrong in both services and both apps — **walk T-054 first.**
>
> ⚠️ Cards below sit in *Now* only because they are awaiting that test; none needs Claude work.

## 🔥 Now (working on it)
> ⚠️ **T-061 is the ONLY card in this section with Claude work left.** Everything below it is
> code-complete and waiting on the owner's device — the file's own *Parked* rule says those do not
> count against the 2-task limit.

- [ ] T-061 (P1) 🔴 **[OWNER device test 2026-08-11, items ② ③ ④ ⑤ ⑥] Driver registration refuses
  the driver without saying why — and two of the refusals cannot be got past at all.**
  Owner: *"pinfl 14talik olish kerak 16ta raqamni ham olyapdi"* · *"viloyatdan keyin shahar/tuman
  qilish kerak"* · *"malumotlarda hatolik bo'ldi deyapdi qaysi qatordaligini ko'rsatmayapdi"* ·
  *"haydovchilik guvohnomasida hatolik deyapdi uyogiga o'tmayapdi"* · *"drivernikida tepasida UbexGo
  driver chiqib tursin"*. **All five grounded in code the same day; none was already fixed.**
  🔴 **The 16-digit PINFL passes all three layers.** The input has **no `maxLength`**; the blur
  handler *does* test `/^\d{14}$/` (`DriverPassportScreen:751`) but `handleContinue` checks only
  "not empty" and then **`setFieldErrors({})` (`:904`) erases the blur error** before posting; the
  API's `passportValidation` — which enforces exactly 14 — is **never mounted** (`driver.routes.ts:23`
  is a bare `router.post`); and the column is **`TEXT`**. ⚠️ **Six validators are dead, not one** —
  the entire driver-registration API has **zero** server-side validation. → **T-063**.
  🔴 **The nameless error is deliberate, one line up from the fix.** `errorHandler.ts:51,65` send
  `t('validation.invalid', { field: '' })` into the template **`"{field} noto'g'ri formatda"`** — a
  sentence with its subject deleted. ✅ **The machinery to name it already exists and already works:**
  `getFieldName` resolves `fields.<key>` and that dictionary is full (`pinfl: 'JSHSHIR'`,
  `address_city_district_id: 'Shahar / Tuman'`). **The per-field `errors[]` array is already sent and
  already correct.**
  🔴 **And all five screens throw that array away.** Each gates it on **`statusCode === 422`**, but a
  Sequelize failure returns **400** and a duplicate **409**. The details arrive and are discarded.
  ⚠️ `SequelizeValidationError` also forwards Sequelize's **English** `e.message` untranslated.
  🔴 **The licence dead end is a missing `<Text>`.** The seven category rows
  (`DriverLicenseScreen:816-845`) render a red border and **no message at all**, while `issue_date`
  and `license_number` on the same screen render theirs — the message is computed and thrown away.
  Those *optional* fields then **block submit for ever** (`:621-643`): typing a bare year `2015`
  auto-formats to `20.15`, which cannot parse. **That is "uyogiga o'tmayapdi" exactly.**
  🔴 **One label, one screen:** `DriverPassportScreen:1299` says `Shahar`; the identical field on the
  personal-info screen already says `Shahar / Tuman`, as does the picker's own title and the API's
  field dictionary. ⚠️ Its neighbours `Mamlakat`/`Viloyat` are **hard-coded Uzbek** (T-057 class).
  🔴 **The wordmark:** the five registration screens already say "UbexGo Driver" (T-050), but the
  **home menu** (`MenuScreen:205` → `auth.appName`) and the **splash** (`splash.appName`) both say
  plain **"UbexGo"** in all three locales. Those are the only two call sites.
  ⚠️ **Owner item ① is NOT in this card** — split as **T-062**, blocked on an owner answer.
  **Approved and STEPS 1-7 DONE 2026-08-11.** All five findings are fixed.
  ✅ **Most of the "nameless error" fix was DELETION, not construction** — `err.errors[0].message` was
  always translated and always named its field; the handler was throwing that away and substituting a
  blank-subject template. The `fields.*` dictionary and `validation.unique` were already there, unused.
  🔴 **The status code was the wrong question all along.** Rather than listing 400/409/422 in five
  screens, one shared **`getFieldErrors(error)`** asks *did the server name any fields?* — so a 400
  with no `errors[]` still falls through to `handleBackendError` and is not swallowed.
  🔴 **Three defects this card did not go looking for:** `SequelizeValidationError` forwarded
  Sequelize's own **English** (*"Validation isEmail on email failed"*) to Uzbek drivers;
  `parseValidationErrors` read only the axios-shaped `.response`, so a correctly-built `ApiError`
  looked like it carried no field errors at all; and the taxi screen had a **second**
  submit-blocking path with the same nameless toast — **found by the suite, not by reading.**
  Plus **two duplicated success toasts** (passport, licence) that fired twice on every save.
  🔴 **The wordmark could not simply become "UbexGo Driver"** — at 38px beside the profile button it
  is ~300px wide, which would re-create the exact overflow **T-050** fixed, ellipsized instead of
  wrapped. "Driver" is its own line under the wordmark; `auth.appName` still reads plain "UbexGo".
  ⚠️ **The splash is deliberately untouched** (140px circle) — open question on the plan.
  ⚠️ **`onLayout` reports y relative to the PARENT**, so the scroll records the form container's
  offset too; without it every jump lands short by the header's height — and a scroll to the wrong
  place still *looks* like it worked.
  **91/91, proven able to fail — 70 red** against pre-change code, driving the **real** middleware
  and error handler with their whole import graph transpiled, so the assertions land on the shipped
  translations. The owner's symptoms are reproduced on the old code: the headless
  **`" noto'g'ri formatda"`**, the English leak, the unmounted PINFL rule.
  🔴 **The suite was wrong twice before the code was:** a `.*\n` strip pattern silently failed on
  **CRLF** and made it **crash instead of report** (third and fourth time this project has hit that
  trap), and a `t\('…'\)` regex matched the tail of `getLabelSty**le('first_name')**`, inventing 42
  missing i18n keys.
  `tsc` API **281** · admin **0** · user **9** · driver **35**, all at baseline, zero errors in any
  touched file. 🟡 Four dead validators remain unmounted **on purpose** → **T-063**.
  🛑 **Only step 8 (owner: deploy the API, rebuild the driver app, walk registration — try a 16-digit
  PINFL, a bad category date, a deliberately wrong field) and step 9 (commit) remain.**
  ❌ No migration. ❌ User app untouched. ⚠️ **Needs an API deploy** — joins the one already queued
  (T-034 · T-043 · T-045 · T-054 · T-055), so it costs no extra run. ⚠️ Plan is **`docs/PLAN.md`**.

- [ ] T-059 (P1) **[OWNER item C]** 🎨 **The driver's home menu shows five rows that do nothing, and
  the labels break mid-phrase.** Owner 2026-08-11: *"both apps remove unnecessary menu items, and
  make text vertical centered (if there is no icon). in home menu items words braked ugly"*.
  **STEPS 1-4 DONE 2026-08-11.** The driver menu goes from **8 rows to 3**, all of which navigate.
  🔴 **Five rows were tappable and dead** — `viloyatlar`, `ichi`, `tuman`, `empty`, `xalqaro` fell
  into an **empty `else`** with a `// TODO`. ✅ **The user app had already solved this** — the
  identical five were commented out there long ago; the driver app never got the same treatment.
  Owner chose **comment out, keep the keys, stay reversible**. The empty `else` went too, so a row
  added later without a destination has nothing to fall through to.
  🔴 **The "ugly break" was in the DATA, not the layout** — labels carried hard-coded `
`
  (`'Yo'lovchi
buyurtmalari'`, `'Taksi
Tuman,
ichi va Yaqin
masofalar'`). **2 of the 6 were on
  LIVE rows**, in all three locales; the user app's labels had none, which is why only the driver
  menu looked wrong.
  ⚠️ **The centring complaint was NOT what it sounded like.** `optionButton` was **already**
  `justifyContent: 'center'` — the icon-less tiles were correct. `myOffers` draws its icon **in
  flow**, so that tile centred *icon + text as a group* and its label sat lower than its neighbour's.
  The icon is now absolutely positioned; **no style was added to the tiles themselves.**
  🔴 **The suite found a defect this card did not go looking for:** `menu.driverOffersTitle` and
  `menu.myBookings` are **uz-only**, so **RU/EN users saw the raw key on two of their four home
  tiles.** Fixed in both locales.
  🔴 **And it exposed a blind spot in T-058's sweep**, which had passed that same app as clean two
  cards earlier: those keys are referenced as **data** (`titleKey: 'menu.foo'`), never as a literal
  `t('…')`. The sweep now follows `titleKey`/`labelKey`/`messageKey`/`placeholderKey` — **+16 keys,
  2685 lookups**; against pre-change code it now finds **7** faults where it used to find 5.
  **54/54, 26 red** against pre-change code. `tsc` user **9** · driver **35**, both at baseline.
  ⚠️ **A visual card: the checks cannot prove it looks good.** They prove the rows have destinations,
  the labels resolve in 3 locales with no forced breaks, and the icon no longer shifts the text.
  🛑 **Only step 5 (owner: rebuild BOTH apps, look at the home menu) and step 6 (commit) remain.**
  ❌ No API change, no migration, no deploy. ⚠️ Plan is **`docs/PLAN.md`**.

- [ ] T-055 (P1) 🔴 **The MIRROR flow has no contact details either — same defect, other direction.**
  Split out of **T-054** 2026-08-11 (owner decision: log it, do not absorb — keep T-054 small).
  T-054 fixed *passenger posts a request → driver bids → passenger accepts*. The other half of the
  product — **driver posts an offer → passenger books → driver confirms** — is served by
  `OfferPassengerService`, which contains **zero occurrences of `phone`**. So a confirmed booking
  there still leaves the two people unable to reach each other.
  ✅ **The pattern to copy already exists and is tested:** `OfferDriverService.gatePhones` + the
  `contactPhone` util in both apps. This card is that pattern applied to
  `OfferPassengerService`'s includes and to `OfferPassengersScreen` (driver) / `MyBookingsScreen`
  (user). ⚠️ Check the status vocabulary first — bookings may not use the literal `'confirmed'`.
  ❌ No migration expected: `users.phone_e164` is a plain column.
  **PLAN WRITTEN AND AWAITING APPROVAL 2026-08-11 → `docs/PLAN.md`.**
  ✅ **The card's own open question is ANSWERED:** `OfferPassengerStatus` is
  `'pending' | 'confirmed' | 'rejected' | 'cancelled'` — **identical** to `OfferDriverStatus`, so
  T-054's gate transfers unchanged. The two endpoints are `getOfferPassengers:589` (driver's view)
  and `getPassengerBookings:618` (passenger's view).
  🔴 **A THIRD defect found while grounding, not in the original card:**
  **`GET /passenger/bookings?status=junk` returns 500.** `OfferPassengerController:87-91` passes
  `req.query.status` through `as any` and the service assigns it straight to `where.status` with no
  allow-list; `status` is a Postgres **enum**, so an unknown value raises *"invalid input value for
  enum"*. ✅ The sibling `getDriverJoinRequests:566` already guards exactly this, with a comment
  explaining why — the fix is to mirror it. Folded into this card.
  ⚠️ Also: `getPassengerBookings` puts **no `attributes` filter** on the `DriverOffer` include, so
  moderation columns (`rejection_reason`, `reviewed_by`, `reviewed_at`) ship to the passenger.
  ⚠️ **A FIFTH card would share the same API deploy** (T-034, T-043, T-045, T-054, this).
  **Approved and STEPS 1-7 DONE 2026-08-11.** The contact fix now covers **both** halves of the
  product. `gatePhones` is a deliberate **twin** of T-054's — mirrored, not shared, because the two
  services own different models; the comment on each names the other.
  🔴 **A FOURTH defect surfaced while wiring the user app:** its type declared only the mapped
  `driver` shape, but `GET /passenger/bookings` returns the **raw model**, where the driver is
  `user` — the **T-042 two-shapes trap** again. Now modelled with both, and read through a new
  `driverPhoneOf()` helper instead of a bare field access.
  ✅ Moderation columns (`rejection_reason`, `reviewed_by`, `reviewed_at`) no longer ship to the
  passenger.
  **49/49** over the **real transpiled service** — the actual endpoints, not just the helper — with
  the **rejected** passenger's number proven absent from the JSON and ownership still 403ing.
  🔴 **The 500 is covered both ways:** 6 junk values proven never to reach `where`, and all 4 real
  values proven still to filter — a guard that refused everything would have passed a weaker test.
  **25 red against pre-change code.** **253/253** i18n keys evaluated; the insertion point was
  checked per block, since a naive append would have landed them in T-054's `myJoinRequests`.
  `tsc` API **281** · admin **0** · user **9** · driver **35**, all at baseline, **zero errors in any
  touched file**.
  🛑 **Only step 8 (owner: deploy the API, rebuild BOTH apps, walk confirm → both sides dial) and
  step 9 (commit) remain.** ⚠️ Plan is **`docs/PLAN.md`**.

- [ ] T-057 (P1) **[OWNER items B + A]** 🎨 **The app drops out of its own design in two places: the
  OS alert box and the OS date picker.** Owner 2026-08-11: *"all alert/info change to good design,
  for example when passenger create offer alert shows simple"* and *"passenger offer create change
  datetime picker for better design"*. **Grounded the same day — and the good news is that nothing
  has to be invented.**
  ✅ **All three replacements already exist in BOTH apps and are already in use:** `showToast`
  (`utils/toast.tsx`), `showConfirmDialog` → `components/ConfirmDialog.tsx`, and **`DateWheelModal`**
  (`components/DateWheelModal.tsx`, built in T-036, an `AppModal`-based day/month/year wheel).
  ✅ **`ConfirmDialogProvider` IS mounted in both apps** (user `App.tsx:112`, driver `:120`) —
  checked first, because if it were missing every dialog would already be silently degrading to
  `Alert` and that would have been the whole bug.
  🔴 **35 raw `Alert.alert` call sites across 13 files** — user **12**, driver **23**. The owner's
  own example, `CreatePassengerOfferScreen`, holds **5** of them.
  🔴 **The `Alert.alert` inside `utils/confirmDialog.tsx` MUST STAY** (1 per app). It is the
  "provider not mounted" fallback — deleting it would turn a visible ugliness into a silent failure.
  ⚠️ **6 call sites pass an `onPress` callback** and therefore need a **dialog, not a toast** — a
  toast has no button, so the navigation would be silently dropped. `CreatePassengerOfferScreen:321`
  goes **back** on OK; `:539` is the create/update success.
  🔴 **The picker is the bare OS one:** `TimeWindowCard.tsx:199` renders
  `@react-native-community/datetimepicker` with `display="default"` — the stock Android dialog,
  opened three separate times (date / from / until).
  ⚠️ **`DateWheelModal` is date-only** (`EARLIEST_YEAR = 1900` — it was written for birth dates), so
  a **`TimeWheelModal`** is the one genuinely new piece. Pass explicit years for a trip date; do
  **not** change the 1900 default, which `UserDetailsScreen`/`EditProfileScreen` depend on.
  ⚠️ Touches `CreatePassengerOfferScreen`, which **T-031** and **T-040** also own — additive changes
  only, but re-read T-031 before resuming it.
  **Approved and STEPS 1-7 DONE 2026-08-11.** All **35** alert boxes are gone and the create-offer
  screen picks date and times with the app's own wheels.
  🔴 **The five registration screens were NOT a toast swap:** their photo alert offers **three**
  choices and `ConfirmDialog` cannot express that, so a shared **`PhotoSourceModal`** now wraps the
  existing `ModalList`. One component, five call sites.
  🔴 **Three of those screens had the strings HARD-CODED IN UZBEK** — a Russian or English driver was
  shown Uzbek on every photo upload. Fixed here as a side effect.
  🔴 **The OS time picker could not be cancelled on iOS** (it committed each spin); the new wheels
  commit only on Confirm. Plus **9 dead `Alert` imports** removed.
  **58/58** with the wheel maths **executed** — all 60 minute values proven to highlight a bucket,
  the caller's `Date` proven not mutated, 5 hostile `minuteStep` values proven safe. **31 red against
  pre-change code.** ⚠️ The suite was **wrong twice before the code was** — it measured an
  uninvoked stub, then **crashed** instead of reporting red. Both fixed.
  `tsc` API **281** · admin **0** · user **9** · driver **35**, all at baseline.
  🟡 Surfaced **3 pre-existing missing i18n keys** → logged as **T-058**, not absorbed.
  🛑 **Only step 8 (owner: rebuild BOTH apps, walk create-offer + one alert per app) and step 9
  (commit) remain.**
  ❌ No API change, no migration, no deploy. ⚠️ Plan is **`docs/PLAN.md`**.

- [ ] T-054 (P1) 🔴 **[OWNER, item E] A confirmed ride has NO way for the two people to reach each
  other.** Owner 2026-08-11: *"passenger creates offer → driver sends request → passenger accepts →
  driver does not see passenger details to contact, and passenger does not see driver contact
  details"*. **Grounded in code the same day: the phone number is never sent by the API at all.**
  🔴 **The cause is one repeated `attributes` list.** Every `User` include in `OfferDriverService`
  is `['id', 'first_name', 'last_name', 'display_name']` — `getOfferDrivers:640` (passenger's view of
  the drivers), `getDriverJoinRequests:581` (driver's view of the passenger), and the same four in
  `joinOffer`, `confirmDriver`, `rejectDriver`. **`phone_e164` is in none of them.** So this is not a
  UI gap the apps could paper over — the data never leaves the server.
  ✅ **The number itself is easy:** `users.phone_e164` is a plain column on `User` (the `phones`
  table exists but is not what these flows read). **No migration.**
  🔴 **The whole difficulty is WHO may see it, and the codebase already has an opinion.**
  `PassengerOfferService.getOfferById:746` excludes `payer_phone` for non-owners with a comment
  spelling out why — *"a third party who never used the app"*. So phone numbers here are deliberately
  gated, and this card must gate the new ones the same way: **only a `confirmed` pairing**, never a
  pending bid. Adding the field to the shared `attributes` list unguarded would hand the passenger
  the phone number of **every driver who ever bid**, and hand every bidding driver the passenger's.
  🔴 **A REAL LEAK FOUND WHILE SCOPING — same subject, opposite direction.**
  `getDriverJoinRequests:575` includes the whole `PassengerOffer` model with **no `attributes`
  filter**, so **`payer_phone` ships to any driver holding a `pending` request** — exactly the person
  `getOfferById` refuses it to. The guard exists on one endpoint and not the other.
  ⚠️ **The mirror flow is equally broken and is NOT in this card:** `OfferPassengerService` (driver
  posts an offer → passenger books → driver confirms) contains **zero** occurrences of `phone`. Same
  defect, different flow → log as its own card, do not absorb.
  ✅ **Precedent to reuse, not invent:** `BlockedScreen:161` in **both** apps already does
  `tel:` + `Linking.canOpenURL` + `openURL` with a fallback alert.
  **Approved 2026-08-11 with all three recommendations** (`phone_e164` only · gate on the join row's
  `confirmed` status · mirror flow split out as **T-055**). **STEPS 1-7 DONE 2026-08-11.**
  One helper `gatePhones` serves both endpoints: the include requests the column, the helper deletes
  it from every row that is not `confirmed`. ⚠️ It edits the **plain object** from
  `get({ plain: true })` — assigning to the model instance would have changed nothing, which is the
  one place this "fix" could have silently done nothing.
  🔴 **A second defect was found and fixed on the driver's details screen:** the number had to be read
  from `myJoin.offer`, **not** the screen's own `offer` — that one comes from the PUBLIC detail
  endpoint and carries no phone for anybody.
  🔴 **The precedent this card was going to copy is itself broken** — `BlockedScreen`'s
  `canOpenURL('tel:…')` gate fails on Android 11+ for want of a `<queries>` entry. The new
  `contactPhone` util calls `openURL` directly; **`BlockedScreen` is still broken → T-056.**
  **340/340** across three suites, **all proven able to fail** (20 red · 4 red · a missing key red):
  38/38 over the **real transpiled service** incl. `JSON.stringify` leak checks and an unknown status
  **failing closed**, 268/268 i18n keys **evaluated**, 34/34 over both apps' real util.
  `tsc` API **281** · admin **0** · user **9** · driver **35**, all at baseline (the 5 in the touched
  API file proven pre-existing via `git stash`); **zero** errors in any touched app file.
  🛑 **Only step 8 (owner: deploy the API, rebuild BOTH apps, walk accept → both sides dial) and
  step 9 (commit) remain.**
  ⚠️ Plan is **`docs/PLAN.md`**. ⚠️ **Needs an API deploy** — the fourth card now queued behind one
  (T-034, T-043, T-045 are the others; still no migration in any).

- [ ] T-024 (P1) **User app: the passenger's "drivers who offered" screen.** ⚠️ Plan is
  **`docs/PLAN.md`**. **APPROVED and STEPS 1-6 DONE 2026-08-11 — only the owner's rebuild + walk
  (step 7) and the commit (step 8) remain.**
  **The passenger↔driver loop is now closed end to end:** push → **`OfferDrivers`** (the actual
  screen, not a list) → name, vehicle, seats, price, message → **Choose** / **Decline**.
  ✅ **T-044's deliberate compromise is closed with it** — `driver_join_request` now routes exactly.
  The header comment was corrected too: the rule is not "never pass `offer_id`" but **"the id and the
  screen must agree about which entity they mean"**.
  🔴 **`driverNameOf()` was added rather than reading the name inline** — `driver` is optional and
  has no `name` field. That exact read crashed the driver app to the launcher in T-042, so the helper
  exists to make the mistake impossible.
  ⚠️ **A single `busyId` disables every action while one is in flight** — a double tap would fire two
  confirms and the second 400s "already processed", surfacing as an error *after* a success.
  🔴 **`tsc` caught a bug the suite could not:** I copied `getErrorMessage(error, t('key'))` from
  `MyPassengerOffersScreen`, but the second parameter is the **`t` function**, not a fallback string.
  That screen has been calling it wrong all along (2 of the 9 baseline errors) and I reproduced the
  bug by imitation. **Copying a neighbouring line copies its bugs.**
  **136/136** checks over the real transpiled modules — `driverNameOf` against 12 shapes including
  every T-042 crash shape, the push mapper with destinations **asserted against route names parsed
  from `MainNavigator`**, 7 malformed ids degrading with no params, the booking notifications proven
  undisturbed, and 22 keys **evaluated** in uz/ru/en with placeholders intact.
  **Proven able to fail: 104 red.** `tsc` user **9 = baseline**, nothing new in any touched file.
  🛑 **Retest carefully with TWO+ drivers waiting** — the dialog's count must match the cascade.
  **The last hole in the passenger↔driver loop.** `MyPassengerOffersScreen:489` says *"N drivers
  interested (M pending)"* **with nothing to tap** — the passenger is told drivers arrived and
  cannot answer them. It also **blocks T-044**: `driver_join_request` has no exact destination.
  ✅ **Grounded 2026-08-11 — the API is COMPLETE, guarded, and needs no work:**
  `GET /passenger/offers/:offerId/drivers`, `POST /passenger/drivers/:id/confirm`, `.../reject`,
  with 404 unknown / 403 not-owner / 400 not-pending / 400 offer-not-published.
  🔴 **Confirm already cascades server-side:** the offer becomes `driver_found` and
  `rejectRemainingDrivers` closes out **every other pending driver**, notifying each in their own
  language. **Accepting is irreversible and affects other people** — hence the dialog.
  ✅ The three client functions exist with **zero call sites**; the payload aliases (`driver`,
  `vehicle`) were verified **against the service**, not trusted from the type (the T-042 lesson).
  **Owner decisions 2026-08-11:** entry point = **the existing driver-count row becomes tappable**
  (fixing the dead end at its own site); accept shows a **confirm dialog naming the consequence**.
  🔴 **The trap: `OfferDriver.driver` is OPTIONAL and has no `name` field** (`display_name` /
  `first_name` / `last_name`). A bare `.driver.name` is exactly what crashed the driver app to the
  launcher in T-042 — use a helper with a fallback.
  ❌ No API change, no migration, no deploy. ❌ Driver app untouched.

- [ ] T-046 (P1) 🔴 **A cancelled passenger offer leaves every driver's bid at "waiting" forever —
  and a foreground push is silently dropped.** Found by the owner's device walk 2026-08-11:
  *"if passenger cancels own offer push notification comes to driver but on click did not open
  exactly page. and on driver send offers page request still shows waiting after passenger cancel
  offer"*. **Two symptoms, THREE defects, all grounded the same day.**
  ① 🔴 **The server abandons the bids.** `PassengerOfferService.cancelOffer:939-953` loads the
  `pending`/`confirmed` `OfferDriver` rows, cancels the **offer**, pushes every driver — and
  **never updates one of those rows**. They stay `pending` **forever**, because the offer is now
  `cancelled` and nothing will ever move them. **The driver app is telling the truth; the DB is
  wrong.** ✅ The precedent is already in the codebase: `OfferDriverService.confirmDriver:377-382`
  correctly walks the losing bids on the *other* path. **Cancelling is the one path that forgets.**
  ② 🔴 **Foreground pushes never navigate, in EITHER app.** Three delivery paths exist and only two
  are wired — `getInitialNotification` (killed) ✅, `onNotificationOpenedApp` (background) ✅, and
  **`onMessage` (foreground) ❌ logs the payload and drops it** (`PushService.ts:173`), its only `if`
  being a dead `passenger_join_request` branch commented *"Could trigger auto-refresh"*. The owner's
  app was **open**, so nothing navigated — *"it opened the home menu"* is the app **never moving**.
  ③ 🟡 **Rows already stranded in the DB** — owner decided 2026-08-11 to **repair** them.
  🔴 **Why T-044's "72/72" passed this:** it drove `handleNotificationTap` with 72 payloads and
  **never asked who calls it**. In the foreground nobody does. **The suite verified a mapper that
  real events never reach** — the same shape as T-042's stale comment. Step 5 must drive the OS's
  actual path, not the mapper.
  **Owner decisions 2026-08-11:** stranded rows → **`cancelled`** (not `rejected` — the driver was
  never judged, and `rejected` renders red with a reason); **repair existing rows: yes**; foreground
  → **a tappable toast that navigates on tap**, never on its own (it must not steal the screen
  mid-form). ⚠️ `showToast` takes no `onPress` today — needs extending in **both** apps.
  **Approved and STEPS 1-5 DONE 2026-08-11.** ✅ **No schema change was needed** — `cancelled` and
  `cancelled_at` already existed on `OfferDriver`; only the service forgot to use them.
  🔴 **Both `App.tsx` call sites passed NO arguments to the foreground handler**, so even a perfect
  handler would have done nothing — **the same trap as T-044** (a correct function nobody calls), and
  the suite now asserts the wiring itself.
  **27/27** runtime checks driving **both apps' real transpiled `PushService`** — the actual
  `onMessage` callback FCM invokes, never the mapper — asserting that an **untapped toast does not
  navigate**, that a tap forwards the original payload once, that 7 hostile payloads never throw, and
  that both `App.tsx` files pass the handler. **Proven able to fail: 16 red against pre-change code**,
  including the owner's exact symptom.
  `tsc` API **282** · user **11** · driver **35**, all at baseline (the one error in a touched file
  proven pre-existing via `git stash`). No new strings, so no i18n work — the toast reuses the
  server's already-translated title/body.
  🛑 **Only step 6 (owner) and step 7 (commit) remain. ORDER MATTERS: deploy the API → run the
  migration → rebuild BOTH apps → retest.** The migration only repairs history; without the deploy,
  new cancellations keep stranding rows. ⚠️ It **prints the repaired row count** as it runs (the
  count could not be gathered in advance — test3's DB is unreachable from the dev machine), and its
  `down` is an intentional no-op because the prior per-row status is recorded nowhere.
  ⚠️ Plan is **`docs/PLAN.md`**. ❌ `notificationRouting.ts` untouched: the destination table is
  correct and device-confirmed.

> 🟢 **T-044 and T-042 both CLOSED 2026-08-11** (owner device test, committed `55718f6`) — moved to
> *Done*. Only T-031 is left in *Now*, and it is **blocked on an owner answer** (see its 🛑 below),
> so there is effectively **no active task**: pick one from *Next*, or unblock T-031.

<details><summary>✅ T-044 — CLOSED 2026-08-11, moved to Done (full history kept here)</summary>

- [x] ~~T-044 (P1)~~ **A tapped push must open the EXACT screen, in both apps.** Owner, 2026-08-10:
  *"any notification on click should open that exactly page or screen in both apps"*.
  **Approved and STEPS 1-4 DONE 2026-08-10.** Every push type with a real destination now opens it
  in both apps. Driver: the 4 outcome types → **`MyJoinRequests`** (the screen T-037 built, which a
  stale comment had been hiding); `passenger_join_request`/`passenger_cancelled` were already exact.
  User: the 5 booking types → **`OfferDetails({offerId})`**, the actual ride.
  🔴 **Two things the plan underestimated:** **both `navigate()` call sites** passed only the screen
  name, so params would have been dropped on the parked cold-start path even with a correct mapper;
  and the user module's header comment **asserted "every destination is a param-less route"** —
  falsified by this change and corrected on the spot, because a stale comment is exactly what caused
  T-042's crash.
  **72/72** runtime matrix over **both apps' real transpiled modules** via the exported
  `handleNotificationTap` — all 13 API types, 6 hostile payloads each, 7 malformed-id forms — with
  **every destination asserted against route names parsed from the real `MainNavigator` source**, so
  a renamed route fails instead of passing. **Proven able to fail: 11 red against pre-change code.**
  `tsc` user **11** · driver **35**, both at baseline, touched files clean.
  🛑 **Only step 5 (owner: rebuild BOTH apps, tap a real push of each kind) and step 6 (commit)
  remain. No API deploy.** ⚠️ Plan is **`docs/PLAN.md`**.
  ✅ **The tap plumbing is already complete and correct in BOTH apps** — handler, cold-start
  parking, flush on navigator-ready and on auth change. **Not the problem; do not rebuild it.**
  🔴 **The gap is the destination table.** Driver app: 4 types (`driver_request_confirmed`,
  `driver_request_rejected`, `driver_not_chosen`, `offer_cancelled_by_passenger`) dump to the
  generic list because of a **stale comment** — *"no screen for these yet (T-023/T-024)"* — but
  **T-037 built `MyJoinRequests` and `PassengerOfferDetails`** and both are registered.
  User app: `NotificationTarget` has **no params at all**, so everything lands on one of two list
  screens even though `OfferDetails` exists and takes `{offerId}`.
  🔴 **The trap that defines this card: `offer_id` means TWO DIFFERENT ENTITIES.** For
  `join_confirmed`/`join_rejected`/`driver_arrived`/`driver_10min_away`/`offer_cancelled_by_driver`
  it is a **driver** offer (safe for `OfferDetails`). For `driver_join_request`/
  `driver_request_cancelled` it is the passenger's **own PassengerOffer** — feeding that to
  `OfferDetails` would fetch a driver offer by a passenger-offer id: a wrong row or a 404 shown as
  the user's own trip. Those two stay on `MyPassengerOffers` until **T-024** exists.
  **Scope (owner, 2026-08-10): push taps only, app-side — no API change, no deploy.** The two
  blockers found while scoping are split out as **T-045** and **T-024**, not done here.
  ⚠️ Every push except `otp` carries `offer_id` + a join id, so exact routing is possible.
  ⚠️ **`driver_10min_away` IS live** (`OfferPassengerService:771`); an early grep missed it because
  `[a-z_]` skips the digits in `10min`.

</details>

- [ ] T-031 (P1) **[OWNER OR-012]** Seven fixes on the passenger's "create ride request" screen.
  ✅ **ITEM 1 CLOSED 2026-08-11 — WORKING AS DESIGNED, no change made. Do not reopen or re-diagnose.**
  Reported twice (2026-08-02, 2026-08-11) as *"there is no possibility to select any wanted seat"*.
  **The owner confirmed a salon option WAS ticked.** `seatsLocked = salonScope !== null`
  (`CreatePassengerOfferScreen:157`) deliberately disables all three `SeatStepper`s (`:778`, `:785`,
  `:793`) when "butun salon" / "orqa salon" is selected — booking the whole car makes a per-seat
  count meaningless. **The steppers were not broken; they switched off on purpose.**
  ⚠️ **The latent usability issue is REAL but the owner declined a fix 2026-08-11** (*"i do not see
  any issue with this right now, works fine"*): the lock has **no on-screen explanation**, and the
  checkbox that causes it is drawn **BELOW** the steppers (`:800`, `:806`) — so the cause is
  off-screen when the user meets the dead controls. It cost two rounds of investigation here, so if
  a *third* report of "can't select seats" ever arrives, **this is the answer** — the fix would be
  reordering (checkboxes above the steppers) plus a one-line explanation, not a logic change.
  Reported 2026-08-02. **Items 2, 3 and 7 DONE + committed (`9ab9b2c`)** — items 2, 3 and half of 4
  were all **one** missing `KeyboardAvoidingView` on `CreatePassengerOfferScreen`, and item 7's
  landmark row genuinely had no icon.
  **Item 1 diagnosed, no defect found** in `SeatStepper`/`GenderPickSheet` (all 8 i18n keys resolve,
  capacities are 1/3). ⚠️ Strong suspect: `seatsLocked = salonScope !== null` (`:118`) disables both
  steppers with **no on-screen reason**, and the salon checkboxes that set it are drawn *below* them.
  🛑 **Needs the owner to confirm the repro** — was a salon option ticked?
  **Owner decisions 2026-08-02:** payment → `payment_cash` + `payment_card` booleans plus a
  **separate** `paid_by_friend` (migration; keep `payment_type` one release so old installs survive);
  the waiting fee becomes an **admin setting**, not a passenger input; waiting time stays **stored
  but uncounted**. Steps 4-12 remain. ⚠️ Its plan is **`docs/PLAN-T031.md`** (moved intact
  2026-08-08). → `docs/OWNER_REQUESTS.md` OR-012

## ⏸️ Parked — implemented, awaiting owner device test
> These are **not** counted against the 2-task *Now* limit: no Claude work is left on them, they
> only need the owner to confirm on a phone. Move a card back to *Now* only if a device test
> **fails**.

> 📌 **EIGHT CARDS JOINED THIS SECTION 2026-08-12 — T-065 · T-066 · T-067 · T-068 · T-069 · T-070 ·
> T-071(⑪) · T-072.** Their full write-ups stay **in place at the bottom of *Later***, where they
> were boarded, rather than being copied here — one home per card, so the detail cannot drift.
> ⚠️ **They are deliberately NOT in *Done*.** On this board *Done* means **owner device-confirmed**
> (that is how T-041, T-042 and T-044 got there). These are **code-complete and untested**, which is
> a different and weaker claim — and the whole point of this section.
> **They clear in the runs already queued:** one API deploy (**T-065** only) and one rebuild of both
> apps. ❌ No migration in any of the eight. ⚠️ **T-046 still needs its own migration**, between the
> deploy and the rebuilds.
<details><summary>✅ T-042 — CLOSED 2026-08-11 (owner device test, committed `55718f6`); history kept</summary>

- [x] ~~T-042 (P1)~~ 🔴 **Three defects found by the owner's T-037 device test, 2026-08-10 — all fixed
  the same day. ✅ Device-confirmed 2026-08-11:** *"opening a passenger order detail's crash also
  solved"*. ⚠️ The owner explicitly confirmed **defect ①** (the crash); ② (the merged list) and
  ③ (the re-offered join button) shipped in the same build and were not separately reported — treat
  them as fixed-but-unconfirmed if either resurfaces.

  **① Driver app CRASHES TO THE PHONE'S HOME SCREEN when opening a passenger order's details.**
  Search finds the orders, but tapping *"Details"* or the card itself kills the app.
  **Root cause found and fixed the same day — a one-line read, `offer.passenger.name`.**
  🔴 **Two endpoints under the SAME `/public/passenger-offers` prefix return DIFFERENT shapes.**
  The **browse list** (`PassengerOfferService.getPublicOffers:1265`) hand-builds a mapped object
  ending in `passenger: { id, name }`. The **detail** (`getOfferById:840`) does `return offer` — the
  **raw Sequelize model**, whose include is aliased **`as: 'user'`**. So `offer.passenger` is
  `undefined` on the detail screen, and `.name` threw **during render**. React Native has no error
  boundary above the screen, so the process died to the launcher — exactly what the owner saw.
  ⚠️ **This is the SAME defect class T-037 already found and fixed once**, for
  `GET /driver/join-requests` (journal 2026-08-08). The helper written for it —
  `passengerNameOf` (`api/passengerOffers.ts`) — was applied only to the screen observed failing.
  **The sweep was incomplete, and the detail screen kept the bare read.**
  🔴 **A comment in the type actively caused the bug:** it claimed the `public/*` browse **and
  detail** endpoints both build the mapped shape. Only the browse does. Corrected.
  **Fixed app-side (owner decision 2026-08-10):** use the existing helper; **no API deploy**, driver
  rebuild only. `passenger` is now **optional** on the type (it always was, in truth) with `user`
  alongside — which is what makes a bare `.passenger.name` fail to compile from now on.
  Also fixed the same latent read in `SearchPassengerOffersScreen:560` (works today only because the
  list happens to carry the mapped shape) and added `passengerUnknown` ×3 locales.
  `tsc` driver **35 = baseline** (proven via `git stash`), zero errors in the 6 touched files;
  **12/12** runtime checks driving the real module — including the crash **reproduced** against the
  old expression — and **18/18** i18n keys evaluated across uz/ru/en.
  🛑 **Only the owner's rebuild + retest remains, then the commit.**
  ⚠️ **The API shape mismatch is NOT fixed** — deliberately, per the owner. Logged as **T-043**.
  → this card's work is done in place; no separate plan file.

  **② The search results merged into the route picker (owner, 2026-08-10).** Same screen, separate
  defect, fixed in the same pass. 🔴 **The screen had TWO independent scroll surfaces:** a
  `ScrollView` with **`maxHeight: 270`** holding the country/city picker, sitting as a **sibling** of
  the `FlatList`. So the card could never scroll away — it ate ~270px permanently — and since the
  picker and the offer cards share the **same white / radius-20 / shadow** styling, the two read as
  one continuous sheet exactly at the boundary. That is the "merging".
  ⚠️ The `FlatList` also had **no `flex: 1`**, so the two fought over the leftover space.
  **Fix (owner chose "scrolls away with the list"):** the picker is now the list's
  **`ListHeaderComponent`** — **one** scroll surface, so it slides up out of the way and the results
  get the whole screen. Plus a **labelled seam** (`resultsCount` + rule, ×3 locales) so the two
  surfaces can never read as one, a **stronger shadow** on the picker so it sits visually *above* the
  results, and the card's `marginHorizontal` dropped so it shares the list's exact left/right edge.
  ⚠️ `emptyContainer` had `flex: 1` + `paddingTop: 80` from when it filled a bare container; it now
  sits under the header inside the list, so it is `flexGrow` + balanced padding — the old values
  pushed the empty state off the bottom of small phones.
  `tsc` driver **35 = baseline**; **27/27** i18n keys evaluated across uz/ru/en and **21/21**
  `{count}` placeholder checks.

  **③ Re-entering an offer the driver already applied to re-offered the "take this order" button
  (owner, 2026-08-10).** ✅ **The server was never at risk** — `OfferDriverService.joinOffer:109-129`
  refuses a duplicate with a translated 400, so no bad row could be written. **The defect was that
  the app invited an action that could not succeed:** the footer keyed off a local `joinSent`
  boolean initialised to `false` on **every mount**, set only by a successful submit *in that screen
  session*. Leaving and returning reset it, so the driver re-entered seats and a price before being
  refused.
  🔴 **Worse for two statuses:** `rejected` and `cancelled` are **permanent** refusals
  (`cannotJoinAfterRejected` / `cannotJoinAfterCancelled`), so the button was a **dead end**, not
  merely a wasted trip.
  ⚠️ **The detail payload cannot answer "did I already apply?"** — the offer's `drivers` list is
  deliberately **owner-only** (rival bids: name, plate, price are none of a driver's business), and
  that gate is correct and was left alone. The screen now asks
  **`GET /driver/join-requests`**, which returns only the driver's **own** rows — already built,
  already authenticated, leaks nothing. **No API change, no deploy.**
  The footer now shows the **real** status with its own wording and colour (sent / confirmed /
  rejected / cancelled) instead of one green "sent" banner — a rejected driver seeing green would
  believe their offer was still live. Pull-to-refresh re-checks it, so a passenger's decision taken
  while the screen is open lands on the next pull.
  ⚠️ The lookup is **deliberately non-fatal**: if it fails the order stays readable and the driver
  may still try — the server remains the real guard. 3 new keys ×3 locales.
  **31/31** runtime checks (incl. string/number `offer_id` matching, all four statuses distinct in
  every locale, and the **old boolean proven to re-offer the button**); `tsc` **35 = baseline**.

</details>

> 🟢 T-041 closed 2026-08-10. 🟢 T-042 + T-044 closed 2026-08-11.

<details><summary>✅ T-041 — CLOSED 2026-08-10, moved to Done (full history kept here)</summary>

- [x] ~~T-041 (P1)~~ 🔴 **T-038 shipped and the owner is STILL logged out.** Reported 2026-08-08 after
  the owner deployed the API and rebuilt both apps; **re-confirmed 2026-08-09 with two screenshots**
  ("Ruxsat berilmagan" on *Mening safar so'rovlarim*, "Sessiya muddati tugagan" on *Mening
  bronlarim*, both **inside** the app). ⚠️ **Plan written 2026-08-09 → `docs/PLAN.md`, awaiting
  approval.** 🔴 **Hypothesis B is now GROUNDED and is the lead cause:** `authLimiter` is
  **20 req / 15 min keyed by IP** and guards **three** routes at once — `/auth/refresh`,
  `/auth/logout` and **`GET /auth/me`, which fires on every app launch** — with both apps on one
  phone sharing that IP. `performTokenRefresh` then treats the resulting **429 as a fatal session
  end**. ✅ **Ruled out 2026-08-09:** the endpoint (probed live — 400/401, correct field names and
  response shape), the app plumbing (every call goes through `getHeaders`; nothing writes the token
  keys behind `AuthContext`), and a single global limiter bucket (`app.set('trust proxy', 1)`).
  **Steps 1-6 ALL DONE 2026-08-09.** Two independent defects, and the card needed both:
  the **apps over-reacted** (any non-`ok` ended the session — now only **401/403**), and the
  **server made that fire constantly** (`/auth/refresh` shared a 20/15min per-IP budget with
  `/auth/logout` and `/auth/me`).
  🔴 **Per-IP keying was the deeper bug and would have outlived the test session:** a mobile carrier
  NAT puts thousands of real users behind one IP. The new `refreshLimiter` (30/15min) and
  `sessionReadLimiter` (120/15min) key on the **user in the token**, not the IP.
  ⚠️ **The `!access` branch had the same bug** — a 200 the app could not parse used to log the user
  out; it now keeps the session and lets the next attempt's 401 make that call properly.
  ⚠️ **Limiter numbers were chosen by Claude, not the owner** — two literals in `rateLimiter.ts`.
  **98/98** runtime matrix over **both apps' real modules**, **proven able to fail (32 red against
  pre-fix code)**; **8/8** limiter check proving user B on the same IP is unaffected; the live 429
  reproduced on request #21. `tsc` API **282** · admin **0** · user **11** · driver **35**.
  🛑 **Only step 7 (owner: deploy the API, rebuild both apps, **LOG OUT AND LOG IN ONCE**) and
  step 8 (commit) remain.** ⚠️ The re-login is mandatory — a pre-T-038 install holds no refresh
  token and rebuilding does not clear AsyncStorage. ⚠️ Plan is **`docs/PLAN.md`**.
  ✅ **Confirmed working:** the API deploy is live (the 401 now reads **"Sessiya muddati tugagan"**,
  T-038's translated `auth.tokenExpired`, so the error plumbing and the translations both work), the
  server **does** return `refresh` on OTP verify (`AuthController.v2:255`), and `AuthContext` **does**
  persist it via `persistSession(user, access, refresh)` at all four sign-in sites.
  **Hypothesis A — most likely, not yet confirmed: this is the expected ONE-TIME transition.**
  T-038 warned about it. A session created *before* the new build has **no refresh token on disk**,
  so `performTokenRefresh` returns null, the stale access token 401s, and the screen's own handler
  logs the user out. ⚠️ **Rebuilding the app does not clear AsyncStorage** — the owner must log out
  and log in again **once** to get a refresh token stored. **Ask before doing anything else.**
  🔴 **Hypothesis B — a real defect found in T-038's own code, worth fixing regardless.**
  `performTokenRefresh` treats **any** non-`ok` response as "the session is over": it clears both
  tokens and fires `notifyAuthLost()`. But `POST /auth/refresh` sits behind **`authLimiter`
  (20 requests / 15 min)**, so a **429 destroys the session** — and so would a transient **5xx**.
  Only **401/403** should end it; everything else should be treated like the network-error path,
  which already (correctly) keeps the session. The runtime suite did not catch this because it only
  ever simulated a 401.
  ⚠️ Both apps carry the identical code, so the fix is made twice.
  → `docs/PLAN.md`

</details>

- [ ] T-040 (P1) **A passenger cannot edit an order at all — the endpoint exists, nothing calls it.**
  Reported by the owner 2026-08-08. **Grounded in code the same day; same shape as T-037.**
  ✅ **The backend is complete and safe.** `PATCH /passenger-offers/:id` is routed
  (`passenger-offer.routes.ts:43`) → `PassengerOfferService.updateOffer:881`, which whitelists the
  writable fields through `buildOfferFields` (no mass-assignment: `user_id`/`status` are excluded by
  the type) and validates the patch **against the stored row**. Ownership is enforced —
  `getOfferById(offerId, userId)` throws **403** for anyone else's order. **No API work needed.**
  ❌ **The app never uses it.** `updatePassengerOffer` in `user-app-standalone/api/passengerOffers.ts:281`
  has **zero call sites**; `CreatePassengerOfferScreen` has **no `useRoute`, no `route.params`, no
  `offerId`** — it can only create; and `MyPassengerOffersScreen` offers only *"So'rovni bekor
  qilish"*. So the only way to change anything is cancel and re-create.
  ⚠️ **This is what made T-039 bite so hard:** an order whose departure time has passed cannot be
  nudged forward, so the passenger's only option is to throw it away and start again.
  ⚠️ **`updateOffer` has NO status guard** — a `cancelled` or `completed` order can still be patched.
  Harmless while nothing calls it; must be closed as part of this card.
  ⚠️ **Conflicts with T-031**, which is mid-flight in `CreatePassengerOfferScreen` (757 lines).
  **Owner decisions 2026-08-08:** **full edit**, by reusing `CreatePassengerOfferScreen` with an
  `offerId`; and when drivers have already offered, **warn but keep their offers**.
  ⚠️ **Ordering:** this collides with **T-031** in the same 757-line file. T-031 step 4 is blocked on
  an owner answer, so T-040 goes first and T-031's remaining steps build on the edit-mode version.
  **Steps 1-6 ALL DONE 2026-08-08.** Edit button → the same form pre-filled → PATCH.
  🔴 **The blocker was not the feature:** the user app's `PassengerOffer` type was **17 fields behind
  the server**, so the passenger app could not see most of its own order. Fixed first.
  ⚠️ **The mahalla guard:** `from_text`/`to_text` are omitted from the PATCH when the geo ids are
  unchanged — the mahalla has no id column (T-029) and lives only inside that string, so rebuilding
  it would delete it silently on every edit.
  ✅ An **expired** order stays editable on purpose — moving the time forward is the repair for T-039.
  **125/125** checks: for all **40** sendable fields, the payload writes it *and* the pre-fill reads
  it. `tsc` API **282** · admin **0** · user **11** · driver **35**.
  **Committed by the owner as `6b84aaf` 2026-08-08** (⚠️ swept in `.claude/settings.json` again).
  🛑 **Only step 7 remains — owner: deploy the API, rebuild the user app, test.**
  ⚠️ Plan is **`docs/PLAN-T040.md`**.

- [ ] T-039 (P1) 🔴 **A passenger order the passenger still sees as "Faol" is invisible to every
  driver once its departure time passes — and an "urgent" one is invisible from birth.**
  Found 2026-08-08 from the owner's device.

  **CONFIRMED CAUSE (owner screenshots, 2026-08-08).** The order existed and was `published`
  ("Faol" in *Mening safar so'rovlarim*), departing **8 Aug 13:23**, while the phone clock read
  **15:58**. `getPublicOffers` filters `start_at >= new Date()`, so it had dropped out of the driver
  browse 2.5 h earlier — **while the passenger's own screen still called it active.** The two sides
  disagree about what "active" means; that is the defect.
  ⚠️ **My first hypothesis (urgent) was wrong and is recorded here so it is not re-run:** the
  minute-precise 13:23 looked like a creation timestamp, but `departDate`/`departFrom` both **default
  to `now + 1 hour`** (`CreatePassengerOfferScreen.tsx:87-92`), so a default-accepted order created
  at ~12:23 lands on exactly 13:23. It was an ordinary non-urgent order that simply expired.

  **The urgent bug is real but SEPARATE — still unfixed, still worth fixing:**
  `CreatePassengerOfferScreen.getStartAtDate()` returns **`new Date()`** — the exact creation moment —
  when `isUrgent` is ticked. `PassengerOfferService.getPublicOffers` then filters
  `start_at >= new Date()` **at query time**, which is always later. So the offer is excluded from
  the browse list from the instant it is saved. Non-urgent offers are safe: create-time validation
  forces them **≥ 30 min** in the future (`MIN_ADVANCE_MINUTES`), and urgent ones deliberately skip
  that check — the same exemption that makes them unfindable.
  ⚠️ Also excluded: any offer whose departure time has simply **passed** — correct in general, but
  it means an offer for "today at 14:00" vanishes at 14:01 even while the passenger still waits.
  **Verified against the live API 2026-08-08:** `GET /public/passenger-offers?limit=20` with **no
  filters** returns `{"items":[],"total":0}` — so the driver app, `SearchPassengerOffersScreen` and
  its search parameters are **not at fault**. T-037 is exonerated.
  **Owner decisions 2026-08-08:** 3-hour grace window after departure; **urgent uses the same
  window** (no special case); and the passenger's list must show expired orders as expired.
  **Steps 1-3 ALL DONE 2026-08-08.** New shared `PASSENGER_OFFER_BROWSE_GRACE_MS` (3 h): an order
  stays browsable for 3 hours past its departure, and the passenger's list shows **"Muddati o'tgan"**
  instead of "Faol" once it drops out. Urgent orders need no special case — the window covers them.
  🔴 **Changing the browse alone would have swapped one lie for another:** `OfferDriverService.
  joinOffer:93` carried the same `start_at < now` guard, so a driver would have been offered a card
  and then refused it with "this trip already started". Both now share the constant.
  ⚠️ **No migration, no scheduled job** — the label is derived; the row stays `published` and
  cancellable. **32/32** checks, aimed at drift (the same 3 h now lives in 3 places).
  🛑 **Only step 4 (owner: deploy the API, rebuild the user app, retest) and step 5 (commit) remain.**
  ⚠️ Plan is **`docs/PLAN-T039.md`**.

<details><summary>✅ T-038 — CLOSED 2026-08-10 (device-confirmed via T-041), moved to Done; history kept</summary>

- [x] ~~T-038 (P1)~~ 🔴 **Every user of BOTH apps is silently logged out ~15 minutes after login — the
  refresh token is thrown away.** Reported by the owner 2026-08-08 from a device: the user app's
  "Mening bronlarim" showed a toast **"Xato / Invalid or expired token"**, and "before last logged
  out maybe for this issue". **Fully traced in code the same day; the owner's guess was right.**
  1. **The refresh token is received and discarded.** `AuthContext` destructures
  `const { user, access, refresh } = response.data` at **4 places in each app** and never references
  `refresh` again. `STORAGE_KEYS` holds only `TOKEN` and `USER` — **there is no refresh-token key in
  either app.**
  2. **`refreshAccessToken()` has ZERO call sites.** It exists in both `api/auth.ts` and the server
  route is live (`POST /auth/refresh`, `auth.routes.v2.ts:28`). Nothing has ever called it.
  3. **The access token lives 15 minutes** (`config/index.ts:31`, `JWT_EXPIRES_IN || '15m'`); the
  refresh token would have lasted **7 days**.
  ⇒ 15 minutes after login every authenticated request 401s with `Invalid or expired token`
  (`middleware/auth.ts:28`) — that is the screenshot.
  ⇒ On the **next app start**, `AuthContext` init calls `/auth/me`, gets the same 401, and takes the
  **OR-002 branch** (`AuthContext.tsx:113-125`) which clears `TOKEN` + `USER` → **logged out**. The
  OR-002 logic is not wrong; it simply cannot tell "account deleted" from "access token expired",
  because nothing ever refreshes. This is the "before last logged out".
  4. **The language issue is real and separate.** `middleware/auth.ts` throws **hard-coded English**
  — `'Invalid or expired token'` (:28), `'No token provided'` (:20), `'Account no longer exists'`
  (:36), `'Not authenticated'` (:54), `'Insufficient permissions'` (:58) — and never calls `t()`.
  Same in `adminAuth.ts:39`. So **every 401 is English regardless of `Accept-Language`**, in both
  apps and the admin panel. (T-033 fixed the app-side plumbing; this is the server side of it.)
  **Owner decisions 2026-08-08:** fix it **properly** — store the refresh token and refresh-and-retry
  — **not** by raising `JWT_EXPIRES_IN`; and the untranslated 401s are **included in this card**.
  ⚠️ Both apps carry the **same** code, so every app-side change is made twice, per this project's
  duplicate-by-convention rule.
  **Steps 1-6 ALL DONE 2026-08-08.** Both apps persist the refresh token; `getHeaders` — which every
  authenticated call already awaits — swaps a spent access token for a fresh pair behind **one
  in-flight promise** (mandatory: `rotateTokens` revokes the old refresh token on use); only a refresh
  the **server rejected** ends the session, a network failure never does; and the API's 401s are
  translated. `tsc` API **282** · admin **0** · user **11** · driver **35** — both apps **one below
  baseline**, because the never-awaited `getHeaders` in `logout` *was* a baseline error.
  **28/28 + 28/28 runtime checks** against the apps' real modules; **18/18** API auth messages.
  🔴 **Three defects found beyond the original diagnosis:** a stale caller token would have
  re-rotated on **every** request (screens keep the token they were handed at sign-in, so
  `ensureFreshAccessToken` re-reads storage first); `logout` never revoked anything in **either** app
  (un-awaited `getHeaders` → no `Authorization`, and the refresh token was never sent); and
  `adminAuth`'s catch rewrote every failure as "Invalid or expired token".
  ⚠️ **Everyone gets logged out ONE more time** — existing installs hold no refresh token, so their
  current session still ends at its next expiry. Warn the testers.
  ✅ **Steps 7-8 done: deployed, rebuilt and device-confirmed 2026-08-10 together with T-041**,
  which fixed the remaining hole in this same mechanism. Plan: **`docs/PLAN-T038.md`**.

</details>

- [ ] T-037 (P1) **Driver app: passenger orders are unreachable — no route, no detail screen, no
  join.** Raised by the owner 2026-08-08 ("user creates offer but in the driver app there is no way
  to search or join"). **Confirmed in code the same day, and it is worse than T-023 described.**
  T-023 claimed "the driver can browse passenger orders but has no way to offer on one" — ❌ **wrong**.
  `SearchPassengerOffersScreen.tsx` (1000+ lines, fully built, already migrated to `AppModal` in
  T-036) is **referenced by nothing**: `MainNavigator` registers **13 routes and none of them is it**,
  and no screen navigates to it. The driver cannot reach the search screen at all.
  Downstream, the tap target `PassengerOfferDetails` (`SearchPassengerOffersScreen:494`, cast to
  `any` so it compiles) is **also unregistered and the screen does not exist** (that was T-021), and
  **4 of the 5 API client functions have zero call sites** — `joinPassengerOffer`,
  `getPassengerOfferById`, `getMyJoinRequests`, `cancelJoinRequest`. Only `searchPassengerOffers` is
  called, from the unreachable screen.
  ✅ **The backend is finished and reviewed** — `offer-driver.routes.ts` + `public-passenger-offer.
  routes.ts` cover browse / detail / join / my-requests / cancel; `OfferDriverService.joinOffer`
  validates vehicle ownership, status, self-join, duplicates, seats and price. **No API work.**
  ⚠️ **`seats_offered` must be real, not the default 1** — `OfferDriverService:129` refuses anything
  below `seats_needed`, and since T-018 a salon booking needs **3–4**. The service carries a comment
  addressed to exactly this card.
  ⚠️ The driver has **one** vehicle (`profile.vehicle`, as `OfferWizardScreen.loadVehicles` reads
  it) — so `vehicle_id` is not a picker, but a driver with **no vehicle yet must be told**, not 403'd.
  **Absorbs T-021 and replaces T-023** (both struck out below).
  **Steps 1, 3, 4, 5, 6 ALL DONE 2026-08-08** — search screen registered + two menu rows
  (`passengerOrders`, `myJoinRequests`), `PassengerOfferDetailsScreen` (reusing the existing
  `PassengerOfferExtras` rather than re-laying-out the T-018 fields), the join sheet, and
  `MyJoinRequestsScreen` with cancel. `tsc` driver **36 = baseline**, zero errors in the 9 touched
  files; **291/291** i18n checks over **97 keys discovered from source** and evaluated in uz/ru/en.
  🔴 **Three defects found in code nobody had ever executed:** (1) `joinPassengerOffer`,
  `getMyJoinRequests`, `cancelJoinRequest` called `getHeaders()` with **no token** → guaranteed 401;
  (2) `offer.passenger` **does not exist** on `GET /driver/join-requests` (raw model → `offer.user`;
  only `public/*` builds the mapped shape) → guaranteed crash on every row; (3) `menu.myOffers`,
  `common.all`, `common.viewAll` existed in **uz only** (same class as T-035).
  🟡 **DEVICE TEST 2026-08-10 — PARTIAL FAIL, blocker cleared 2026-08-11.** ✅ The search screen is
  reachable and **finds orders**. ❌ Opening an order's **details crashed the app to the phone's home
  screen** → **T-042**, fixed and **device-confirmed 2026-08-11** (`55718f6`). The browse → details
  path now works end-to-end.
  🛑 **Step 7 is only HALF walked.** The **join sheet** and **`MyJoinRequestsScreen`** have still
  never been opened on a device — T-037 found **three** defects in never-executed code, so the code
  behind those two screens carries exactly that risk and is still unproven. Step 8 (commit) after.
  👉 **This is the cheapest card on the board to finish:** no code is believed missing, it needs the
  owner to tap through *"I'll take this order"* → *My join requests* → cancel, on the build already
  installed.
  ⚠️ The loop cannot be fully demoed — the passenger's "drivers who
  offered" screen is **T-024** and does not exist, so confirm the offer landed via the DB or admin.
  ⚠️ **Still unwalked past the details screen:** the join sheet and `MyJoinRequestsScreen` were
  never reached, so their own never-executed-code defects (T-037 found three) are still unproven.
  ⚠️ Its plan is **`docs/PLAN-T037.md`** (moved intact 2026-08-08 so T-038 could use `docs/PLAN.md`).

> T-014/T-015 committed in `5b315a6`, T-016 in
> `2a76e12`, T-017 in `a1ecedd`. Move a card back to *Now* only if a device test **fails**.
- [ ] T-033 (P1) **Resend OTP shows a generic error; server messages never reach either app.**
  Found by the owner on a **device**, 2026-08-08 — the first real device session. Fully traced in
  code the same day, **before any fix**. The 60 s per-phone cooldown
  (`OtpService.checkRateLimit:239`) is *correct* and is the cause — but it throws a bare English
  `Error`, so the controller's catch-all returns **HTTP 500** for a routine refusal. Worse, the app
  discards the message regardless: `handleBackendError` (`utils/errorHandler.ts:40`) is written for
  **axios** (`error.response.status`) and **neither app imports axios** — both use `fetch`, which
  never sets `.response`. The whole status switch is dead code, so **12 screens** (4 user, 8 driver)
  have never shown a server message. Plus: the resend link has **no cooldown UI** at all, and the
  6th send in an hour hits the express limiter's **plain-text** body → `JSON Parse error`.
  **Owner decision 2026-08-08:** scope = the fix **plus** the error plumbing; the two security
  findings split out as **T-034**.
  **Steps 1-6 ALL DONE 2026-08-08.** The cooldown is now a translated **429** carrying
  `retryAfterSec`; all five express limiters answer **JSON** instead of bare text; `ApiError` carries
  `status`/`data`/`response` so the 12 existing `error?.response?.status` readers keep working
  untouched; every `response.json()` in both `api/auth.ts` is guarded; and the resend link is
  disabled with a live countdown held as a **wall-clock deadline** (a counter would come back stale
  after backgrounding). `tsc` all four **exactly at baseline** (282 · 0 · 12 · 36), in-file errors
  proven pre-existing via `git stash`; **42/42** i18n + **17/17** runtime checks.
  **Committed as `6b691ab` 2026-08-08** (also swept in `.claude/settings.json`).
  🛑 **Only step 7 remains — owner: deploy the API **FIRST**, then rebuild both apps, then 5 smoke
  tests. Nothing has run on a device or a live API.** ⚠️ Order matters: the apps read `cooldownSec`
  and `retryAfterSec` from the API, so an app-first rollout keeps showing the old generic toast.
  ✅ **Owner decided 2026-08-08: leave `otpSendLimiter` at 5 sends/phone/hour.** It is legible now
  instead of a parse crash, and that is enough — do not revisit.
  Also found here: **T-035** (duplicate `errors:` blocks in the app translation files).
  ⚠️ Its plan is **`docs/PLAN-T033.md`** (moved intact 2026-08-08 so T-036 could use `docs/PLAN.md`).
- [ ] T-018 (P1) **[OWNER OR-007]** Rebuild the intercity order ("zakaz") screen to the Figma
  (`K_buyurtma001Yangi.png` + popup `004…Tanlov oynasi.png`): route/time popup, gendered seat
  steppers, payment type, vehicle class/type, new flags, special-order panel (data-only).
  Schema + API + user app + driver-app views. **Plan APPROVED 2026-07-28. Steps 1–8 DONE
  2026-07-29. Step 9 UNDERWAY: committed as `1117481` and DEPLOYED to test3 2026-08-02 (migration
  `20260802000001` applied, `migrated (0.014s)`, all pods Running). 11 defects fixed 2026-08-02
  across two review rounds + 6 owner decisions implemented — see `docs/JOURNAL.md` 2026-08-02 (2).
  🛑 Still blocked on the geo import (now **T-025 step 1**) before the driver side can be verified.
  Step 10 is the owner's: walk `docs/CHECKLIST.md` on two phones.**
  ⚠️ **Its plan now lives in `docs/PLAN-T018.md`** (moved intact 2026-08-02 (3) so T-025 could use
  `docs/PLAN.md`). Resume T-018 from there once T-025 lands.
  → `docs/OWNER_REQUESTS.md` OR-007, `docs/PLAN-T018.md` step 9, `docs/CHECKLIST.md`

- [ ] T-030 (P1) **[OWNER OR-011]** Four driver-app fixes from the software owner.
  Reported 2026-08-02, all grounded in code the same day.
  **Steps 1-6 + 8 DONE + committed (`9ab9b2c`).** The photo audit proved the owner right — uploads
  work; the break was a host-less `/uploads/...` path handed to `<Image>`, **18 fields across 5
  screens**. Dates: `maximumDate` was the wrong tool (these screens hand-roll their pickers), so the
  limits went into the generators via a new `utils/dateLimits.ts`, incl. the **typed-input** paths.
  18 hard-coded strings removed. `tsc` all four at baseline; 29/29 runtime checks.
  🛑 **Step 7 BLOCKED on the owner** (deferred 2026-08-02): the driver's address cascade is *already*
  complete, so OR-011 item 3 is either the offer-wizard route picker or **empty dropdowns = a data
  problem in the admin upload**. Steps 9-10 (rebuild + smoke test, commit) also owner's.
  ⚠️ Plan is **`docs/PLAN-T030.md`**. → `docs/OWNER_REQUESTS.md` OR-011
  The four items (dates · photos · geo levels · note placeholder) are written up in full, with line
  numbers, in `docs/OWNER_REQUESTS.md` OR-011 — not repeated here.
- [ ] T-027 (P1) **[OWNER OR-010]** Seven fixes from the software owner (user app; the push-tap one
  also driver app). Reported 2026-08-02, all grounded in code the same day.
  1–2. Referral ("bonus") block: only **one** of phone / ID / promo may be filled, and the field
  must stop showing the user's **own** number — grey `+998901234567` placeholder instead.
  ⚠️ Needs a new `referral_phone` column (**migration — owner approved**); today the backend stores
  only `promo_code` + `referral_id`.
  3. Birth date jumps too far up when the keyboard opens (`onFocus={scrollToEnd}`).
  4. Unread-message badge (envelope icon) — **API already returns `unread`, no backend work**.
  5. Tapping a push must open **that message**; today it opens the main menu. ⚠️ **No push-tap
  handler exists in either app** — so this is new work in the user app *and* the driver app.
  6. Hamburger icon on the left to open the menu (`MenuScreen` is a plain stack screen today).
  7. Settlement + mahalla not linked to the district — **the API already has both endpoints**; the
  app's `api/geo.ts` has no neighborhoods function and its cascade stops at city/district.
  **Owner decisions 2026-08-02:** real `referral_phone` column; item 7 = the **trip location
  picker** (`GeoSelectModal`/`LocationCard`), not the profile address; T-019's Figma re-layout
  stays a separate card.
  **Steps 1–10 ALL DONE 2026-08-02** — all seven items implemented; `tsc` API **282** · admin **0**
  · user **12** · driver **36**, zero new errors; 30/30 i18n runtime checks. Two follow-ups logged
  rather than absorbed (**T-028**, **T-029**).
  **🛑 Only step 11 (owner: run the migration, deploy, rebuild BOTH apps, smoke test) and step 12
  (commit) remain.** ⚠️ **Migration FIRST, then API, then the apps** — the app already sends
  `referral_phone` and the API drops unknown fields, so a user would watch their input vanish.
  Nothing has run on a device. ⚠️ Its plan is **`docs/PLAN-T027.md`** (moved intact 2026-08-02).
  → `docs/OWNER_REQUESTS.md` OR-010, `docs/PLAN-T027.md` step 11
- [ ] T-026A (P1) **Offer concurrency: the confirmPassenger overbooking race + the single front seat.**
  **Committed + deployed to test3 by the owner 2026-08-02.** Parked for T-027 — nothing left is
  Claude's; the 5 smoke tests in `docs/PLAN-T026A.md` step 8 have **not** been run, and the race has
  no other coverage of any kind. Repro script is written but never executed.
  Fixed via one mechanism (`sequelize.transaction()` + `lock: tx.LOCK.UPDATE` on the offer row),
  plus the new `offers.frontSeatTaken` key in three locales. ⚠️ The lock had to be taken on the
  offer row **alone**: Postgres refuses `FOR UPDATE` on the nullable side of an outer join, which
  is what Sequelize emits when `lock` meets `include` — the obvious version would have 500'd in
  production. `tsc` API **282 → 282**, the two in-file errors **proven pre-existing** via
  `git stash`; 21/21 i18n runtime checks. API-only — neither app needed a rebuild.
  ⚠️ Its plan is **`docs/PLAN-T026A.md`** (moved intact 2026-08-02). The four defects it closed:
  1. **Lost-update race.** `confirmPassenger` (`OfferPassengerService.ts:263-276`) read
     `offer.seats_free`, checks it, then writes `seats_free - n` with nothing in between. Two
     concurrent confirms both pass the check and **4 seats sell on a 2-seat offer**. `cancelJoin`
     (:429-431) restores seats the same unsafe way, so both must move together or the race relocates.
  2. **Nothing enforces one front seat.** Neither `joinOffer` nor `confirmPassenger` checks whether
     another passenger already holds it — N passengers each book the front seat and all get
     confirmed. Two people are sold the same physical seat.
  3. Rides along, same lines: no transaction spans the join update and the offer update in either
     function, and `confirmPassenger` never re-checks that the offer is still `published` and not
     yet started — so a driver can confirm passengers onto a **cancelled** offer.
- [ ] T-025 (P1) **Driver offer create/edit: unblock the geo import + two create-offer hotfixes.**
  Parked 2026-08-02 to make room for T-026A — **not finished**, but nothing left is Claude's.
  Absorbs **T-022** (the missing `api/geo.ts`) as step 1 — and it was *not* a port: the driver app's
  own `api/driver.ts` already exports all four symbols, so a 3-line re-export shim did it. Plus the
  create-offer defects that bite in normal use: editing any offer with a front-seat price 400s
  on a **string** comparison (`"12000.00" < "5000.00"` is true), every edit reset `seats_free`
  to `seats_total` (re-selling booked seats), the passenger was **charged a front-seat premium that
  was never displayed**, a cancelled offer gave a **blank screen with no way back**
  (`successResponse`'s 404 landed in the *message* slot → HTTP 200 + `offer:null`), and every price
  rendered as `60 000.00`.
  **Steps 1–7 + 9 ALL DONE 2026-08-02**, committed as `0371cbd` (steps 1–3) and `178a452` (steps 5–7).
  `tsc` API **285 → 282** (the 3 removed errors *are* 3 of the bugs — they were hiding in the
  baseline), user **12 → 12**, driver **40 → 36**, admin **0**; 27/27 + 20/20 runtime checks;
  two bugs reproduced against pre-fix code.
  **🛑 Only step 8 remains — owner: deploy the API + rebuild BOTH apps, then 7 smoke tests.**
  Nothing has run on a device or a DB. ⚠️ Its plan is **`docs/PLAN-T025.md`** (moved intact
  2026-08-02, same as T-018's). → `docs/PLAN-T025.md` step 8, `docs/CHECKLIST.md`

> **T-022 is absorbed into T-025 step 1** — code-complete and committed in `0371cbd`, but the
> driver search screen has **not been opened on a device yet**, so it is not "done" until smoke
> test 8(a) passes. Do not start it as a separate card.
- [ ] T-017 (P1) Driver app: infinite profile-check loop after OTP login — `AuthContext` identity
  churn + a wrong `profile_complete` watcher made `RootNavigator` re-check forever until the API
  rate-limited the app. **Fix implemented (4 files) and committed (`a1ecedd`); tsc at baseline.
  Awaiting owner device test.** → see `docs/JOURNAL.md` 2026-07-28
- [ ] T-016 (P1) **[OWNER OR-006]** Half-finished registration → the app opens the main menu
  instead of resuming the registration form (user app + API). Root cause: `/auth/me` omitted
  `profile_complete`. **Fix implemented (API + app) incl. draft pre-fill and committed (`2a76e12`);
  tsc at baseline. Needs the API deployed to test3, then an owner device test.**
  → see `docs/OWNER_REQUESTS.md`
- [ ] T-011 (P1) **[OWNER OR-001]** OTP screen resets to main menu after the app is
  backgrounded/killed — should resume the OTP screen. Affects driver + user apps.
  **Fix implemented in both apps (tsc clean); awaiting owner device test.**
  → see `docs/OWNER_REQUESTS.md`
- [ ] T-012 (P1) **[OWNER OR-002]** Deleted user still gets into the app (cached token
  trusted) — app must log out to the login/OTP screen; API must reject deleted tokens.
  Affects driver + user apps + backend. **Fix implemented (App + API), tsc clean;
  awaiting owner device test.** → see `docs/OWNER_REQUESTS.md`
- [ ] T-014 (P2) **[OWNER OR-004]** Remove the country from the city/location text on
  "Safar so'rov yaratish" (user app). **Done — `buildLocationText` drops country;
  label + saved text now `city, province`. Awaiting owner device test.** → `docs/OWNER_REQUESTS.md`
- [ ] T-015 (P2) **[OWNER OR-005]** Additional-phones field accepts the user's own primary
  number (user app, registration + edit profile). **Done — `addPhoneNumber` now rejects the
  primary number and duplicates, with toasts. Awaiting owner device test.** → `docs/OWNER_REQUESTS.md`

## 📋 Next (ready to start)
- [ ] T-062 (P1) 🛑 **BLOCKED ON AN OWNER ANSWER — [OWNER device test 2026-08-11, item ①] the two
  apps write the email to two different tables.** Owner: *"on both app registrations email not
  correctly entered works?"*
  ✅ **The format check is fine and was never the problem** — both apps reject a malformed address
  client-side (`DriverPersonalInfoScreen:1058-1067`, `UserDetailsScreen:417`), and both target
  columns carry Sequelize's `isEmail`.
  🔴 **The real defect is where it lands.** The driver's email is written to
  **`driver_profiles.email`** (`DriverService.upsertDriverProfile`), the passenger's to
  **`users.email`** (`UserController.updateProfile:139`). One person filling in the driver app
  therefore has **no** email on their `users` row, and vice versa — so "did it save?" has two
  different answers depending on which app asked.
  ⚠️ **`users.email` is `unique`; `driver_profiles.email` is not.** A second account reusing an
  address gets a bare **409 "conflict"** naming no field (T-061 fixes the *naming*, not this).
  🛑 **The question for the owner: should a driver's email live on `users.email` (one address per
  person, unique, and the passenger side already there) or stay on `driver_profiles.email`?**
  The first is the tidier model but **needs a migration** to move existing rows and would start
  rejecting a driver whose address is already taken. **Do not start until answered.**
  ⚠️ Separately: `UserController.ts:120` `console.log`s name, birth date, email and phone numbers —
  the PII-in-logs class **T-034** was meant to close. Fold in here or log its own card.

- [ ] T-063 (P2) 🔴 **Five more validators are dead code — the driver-registration API validates
  nothing.** Found while grounding T-061, 2026-08-11.
  `driverDetailsValidation`, `personalInfoValidation`, `licenseValidation`, `vehicleValidation` and
  `taxiLicenseValidation` (`middleware/validator.ts:134-170`) are **exported and imported by
  nothing** — `driver.routes.ts` mounts `authenticate` and no validator at all. **T-061 mounts only
  `passportValidation`**, deliberately, because a validator switched on over a live route can start
  rejecting payloads that work today.
  ⚠️ **Each one needs its real payload proved against it before mounting** — `personalInfoValidation`
  demands `father_name`, which the app treats as optional. **Do them one at a time, not as a batch.**
  ❌ No migration. ⚠️ Needs an API deploy.

- [ ] T-060 (P2) 🔴 **`npm run lint` is BROKEN in BOTH React Native apps — it has not run in a long
  time and nobody noticed.** Found during `/end-day`, 2026-08-11.
  Both `package.json`s call `eslint . --ext .ts,.tsx`, but **neither app has an `eslint.config.js`**
  and the installed **ESLint 9.39** dropped support for `.eslintrc.*`. Both fail identically with
  *"ESLint couldn't find an eslint.config.(js|mjs|cjs) file"* — **zero files are ever checked.**
  ⚠️ So every "lint" line in this journal for the apps has been vacuous, and `CLAUDE.md`'s run table
  advertises a command that cannot work. **This is a tooling gap, not app breakage** — `tsc` has been
  carrying the whole static-analysis load for both apps.
  ✅ The API's lint *does* run (T-032 documents its 24,473 CRLF findings), so the fix is a config for
  the two apps, not a repo-wide migration.
  ⚠️ Expect a large first run: two apps that have never been linted under a working config. Agree a
  baseline the way `tsc` has one, rather than trying to reach zero.
  ❌ No API change, no migration, no deploy.

- [ ] T-058 (P2) 🟡 **Three i18n keys are missing, and two of them render raw to every non-Uzbek
  driver.** Found by T-057's i18n check, 2026-08-11 — **all three pre-date that card**, proven
  against `HEAD`, so they were not introduced by it.
  🔴 **`profile.title` and `profile.myOffers` exist in `uz` ONLY** (driver app). `useTranslation`
  falls back to the default language and, failing that, **returns the key itself** — so a Russian or
  English driver sees the literal text `profile.title` at the top of their own profile screen.
  ⚠️ **This is the same class as T-035 and T-037's defect (3)** — "the key was only ever added to
  uz". It keeps recurring because nothing checks the three locales against each other.
  🟡 `notifications.noNotificationsDescription` is missing from **all three** locales of the user
  app, so the empty-notifications state shows the raw key to everyone.
  ✅ **The check that found them already exists** — T-057's suite discovers every `t('…')` in a file
  and *evaluates* it in uz/ru/en rather than grepping. Worth generalising to the whole app: pointed
  at 9 files it found 3 holes, so the real count is probably higher.
  ❌ No API change, no migration. Pure translation data + ideally a repo-wide sweep.
  **DONE 2026-08-11. The repo-wide sweep was built and it found MORE than this card recorded — 5
  faults, not 3.** It discovers every literal `t('…')` in every source file of both apps and
  **evaluates** it in uz/ru/en: **879 distinct keys, 2637 key×locale lookups.**
  Fixed: `profile.title` + `profile.myOffers` (uz-only → RU/EN drivers saw the raw key at the top of
  their own profile), `notifications.noNotificationsDescription` (missing in **all** locales of
  **both** apps — the card only knew about the user app), and **`common.info`** (missing in all three
  driver locales — not previously known about at all).
  **Both apps now report `clean`.** The sweep re-run against pre-change code reproduces exactly the
  5 faults, so it is proven able to fail.
  ⚠️ **It is a LOWER BOUND, not a proof:** only literal keys can be checked — `t(`a.${x}`)` and
  `t(variable)` are skipped by design, since flagging them would be noise.
  ⚠️ My first insertion escaped an apostrophe wrongly and produced `info: 'Ma'lumot'`, which broke
  the module; the sweep itself caught it by failing to load. ❌ No API change, no deploy.

- [ ] T-056 (P2) 🟡 **`BlockedScreen`'s "call support" button is dead on Android 11+, in BOTH apps.**
  Found while building T-054, 2026-08-11 — not reported by a user, so no urgency, but it is a real
  break. `BlockedScreen.tsx:161` (user) / `:147` (driver) gates the dial on
  `Linking.canOpenURL('tel:…')`. Since Android 11, that call is subject to **package visibility**:
  it returns **false** unless the manifest declares a `tel` intent in `<queries>`. Both manifests
  declare **only `https` VIEW**, and Expo 54 targets **SDK 35** — so a blocked user is told *"Phone
  dialer is not available on this device"* by a phone that plainly has one.
  ✅ **The fix is already written and tested** — `utils/contactPhone.ts` (T-054) calls `openURL`
  directly, which package visibility does **not** restrict. Point `BlockedScreen` at it.
  ⚠️ The same email button (`mailto:`) two functions up has the identical gate — check it too.
  ⚠️ Editing `AndroidManifest.xml` is the *other* possible fix; prefer the util, since the manifest
  is Expo-generated and touching it needs the owner's sign-off.
  **DONE 2026-08-11 (steps 1-2 of 2 code steps).** Both `BlockedScreen`s now call the util; the two
  handlers collapsed from ~20 lines each to two one-liners.
  ✅ **The email gate was real too** and is fixed in the same pass — `openEmail()` added to
  `contactPhone.ts` in both apps, with `contact.noEmail` / `contact.emailFailed` ×3 locales.
  ⚠️ **A THIRD `canOpenURL` gate exists and was deliberately LEFT ALONE:**
  `driver…/screens/RegisterFirstScreen.tsx:47` opens an app-store URL. The manifests **do** declare
  `https` VIEW, so that one works — but if an admin ever configures a `market://` URL it fails
  **silently** (a bare `console.error`, no user feedback at all). Different defect, not this card.
  **54/54** over both apps' real transpiled util, **10 red** against a copy with the gate
  reintroduced. ⚠️ The suite **crashed instead of reporting red** on the first attempt — it indexed
  `opened[0]` when the bug under test is "nothing was opened". Guarded.
  🔴 **I broke both files mid-edit**: Python escaping turned `
` into real newlines inside the email
  body, giving 6 unterminated-string errors. Caught by `tsc`, repaired, both apps back at baseline.
  `tsc` user **9** · driver **35**. ❌ No API change, no deploy — app rebuild only.

- [ ] T-047 (P1) 🔴 **A push tapped from a KILLED app lands on the main menu, not the destination.**
  Owner device test 2026-08-11, immediately after T-046 was deployed: *"if app closed on click to
  push opens main menu"* (open/background both route correctly).
  🔴 **ROOT CAUSE FOUND — a race in `flushPendingNotification`, in code T-044 declared correct.**
  `RootNavigator:196` flushes on `NavigationContainer`'s **`onReady`**. But `onReady` fires when
  **ANY** navigator mounts — on a cold start that is the **splash/auth** stack, *not* `MainNavigator`.
  So: `isReady()` is **true** → `flushPendingNotification` **clears `pendingTarget` FIRST**
  (`notificationRouting.ts:105`) → `navigate('MyJoinRequests')` **throws** (the route does not exist
  in the current tree) → the `catch` logs *"dropping it"* — **and the target is already gone.**
  The retry on `RootNavigator:38` then finds `null` and does nothing. The app stays wherever it
  started: the main menu.
  ⚠️ **`goOrPark` gets this right** (:82-88) — it catches, then **re-parks**. `flushPendingNotification`
  discards instead. **The two halves of the same mechanism disagree.**
  ⚠️ **T-044's 72/72 could not have caught it:** its recording navigation ref always succeeded, so
  `navigate` never threw and the discard path never ran. **Second time this card's suites have tested
  a happy path the real app does not take** (T-046 was the first).
  🔴 **STILL BROKEN AFTER THE FIRST FIX — owner retested 2026-08-11 and the symptom is unchanged:**
  *"if app closed on click to push opens main menu"*, while open and background both work.
  ⚠️ **The re-park fix below is correct and verified, but it was NOT the (whole) cause.** Keep it —
  the discard-on-failure bug was real and is proven by 14 red — but **a second cause remains
  undiagnosed.**
  🔴 **Do NOT re-diagnose from the source alone — that has now failed twice on this exact path.**
  ✅ **What T-048 ruled out:** delivery. Pushes **do** arrive when the app is killed, so this is
  purely navigation. ✅ Also ruled out: the destination table (device-confirmed), and `PushService`'s
  `getInitialNotification` wiring (reads correctly).
  **Next step is EVIDENCE, not code.** The one thing that separates the remaining hypotheses is
  whether `getInitialNotification` fires at all on a cold start: run the driver app via
  `npx react-native log-android` (or `adb logcat`), force-close it, tap a real push, and look for
  **`Notification tapped (app was closed)`**. If that line is **absent**, the handler never sees the
  tap (registration timing / a `useEffect` cleanup racing the launch). If it is **present**, the tap
  is parked and something later **navigates over it** — a reset/replace by `RootNavigator` after the
  flush, which the current suite does not model.
  ⚠️ A suite that models the navigator will keep passing until it models **whatever happens after**
  the flush. That is the gap to close next.

  **Fix #1 (2026-08-11, verified, retained but insufficient):** `flushPendingNotification` now
  **re-parks** on failure,
  mirroring `goOrPark`, with a **bounded retry** (`MAX_FLUSH_ATTEMPTS = 10`) so the original concern
  the clear-first was guarding — an unsatisfiable target retried forever by an effect that reruns on
  every auth/profile change — cannot come back. `clearPendingNotification` resets the budget too, so
  one doomed notification cannot spend the next one's retries.
  ✅ **The retry chain was verified, not assumed:** both apps flush on `onReady` **and** on an effect
  keyed to auth/profile state, and `MainNavigator` renders when `driverProfileComplete` flips — which
  is in that dependency array, so the flush fires right after it mounts.
  **28/28** runtime checks over **both apps' real transpiled modules**, driven by a fake navigator
  that **throws for unmounted routes exactly as React Navigation does** — modelling the true cold
  start: tap before any navigator → `onReady` for the **auth** stack (isReady true, route absent) →
  auth completes → `MainNavigator` mounts → the tap must land. Also covers 5 repeated failed flushes,
  a doomed target being abandoned, no double-navigation, logout clearing, and a fresh budget per
  notification. **Proven able to fail: 14 red against the committed code**, including the owner's
  exact symptom in both apps. `tsc` driver **35** · user **11**, both at baseline.
  ⚠️ **Both apps carry the identical code.** App-side only — no API, no migration.
- [ ] T-049 (P2) **Driver search card + geo pickers rendered hard-coded English.** Owner,
  2026-08-11: *"passenger offers found 'passenger needed so many' not translated"*.
  **✅ FIXED 2026-08-11 (app-side, driver only).** The card at
  `SearchPassengerOffersScreen:570` rendered `{n} seat/seats needed` **inline in English**, never
  through `t()` — so it read the same in all three languages.
  🔴 **The sweep found 8 MORE** hard-coded English toasts on the same screen (`'Error'/'Failed to
  load provinces'`, `'Select Country'/'Please select a country first'`, ×2 each for from/to). They
  only fire on a **load error or an out-of-order tap**, which is why nobody had seen them — the
  screen's happy path was fully translated, so it looked done.
  ⚠️ **Fixed the class, not just the reported instance** (the T-042 lesson): 5 new keys × uz/ru/en.
  ⚠️ The screen interpolates with `.replace('{count}', …)`, matching its own `resultsCount`
  convention rather than introducing a second style.
  `tsc` driver **35 = baseline** (the 2 in-file errors are T-035's known duplicate `errors:` blocks,
  shifted 363→372 by the added lines). **21/21** i18n checks — every new key **evaluated** in
  uz/ru/en, `{count}` verified present, `common.error` confirmed.
  🛑 Owner: rebuild the driver app and confirm the card + a forced geo error read correctly.
- [ ] T-050 (P2) **The "UbexGo" wordmark wraps mid-word — the "o" drops to the next line.**
  Owner, 2026-08-11: *"loading Ubexgo word letter 'o' drops to next line, the same word breaks ugly
  in main menus."*
  **✅ FIXED 2026-08-11 in BOTH apps — and the cause was arithmetic, not the font scale.**
  🔴 **The splash wordmark could never fit.** "UbexGo" at `fontSize: 36` bold **plus
  `letterSpacing: 2`** needs ~150-160px; `logoCircle` is **`width: 140`** — and the text sits inside
  that, so the usable width is less again. **It overflowed at the default font size already**; the
  owner's larger system font only made an existing overflow visible. ⚠️ **`letterSpacing` was the
  hidden cost** — 6 characters carry 6 extra points of width, and it is easy to read past.
  **Fix:** `numberOfLines={1}` + `adjustsFontSizeToFit` + `minimumFontScale={0.7}` at **every** site,
  so the wordmark shrinks instead of wrapping; splash `letterSpacing` 2→1; and the splash text got
  `width: '100%'` + `paddingHorizontal` so `adjustsFontSizeToFit` has a defined box to shrink into
  (without it the prop has nothing to measure against).
  ⚠️ **Fixed all 10 sites, not the 2 reported** — both `SplashScreen`s, both `MenuScreen`s, and the
  6 driver screens rendering **"UbexGo Driver"**, which is *two words in a tight header* and the most
  likely of all to wrap. Same class, one pass (the T-042 lesson).
  ⚠️ **A shared `<Wordmark>` component was considered and rejected** for now: the 10 sites use 4
  different styles (36px circle, 38px header, 18px brand), so one component would need as many props
  as it saves. Revisit if a 5th style appears.
  **34/34** checks over the real sources — every site asserted to carry both props, plus the splash
  geometry. **Proven able to fail: 12 red** against the pre-fix files. `tsc` driver **35** · user
  **11**, both at baseline (the one error in a touched file, `DriverDetailsScreen:73`, **proven
  pre-existing via `git stash`** — my edit is at :132).
  🛑 Owner: rebuild both apps and confirm the splash + menus.
  ⚠️ **Found while working, NOT fixed** (out of scope, boarded as **T-052**): both apps'
  `LoginScreen:74` renders **hard-coded English** `"Welcome to UbexGo"` — never passed through
  `t()`, so it reads the same in all three languages.
- [x] ~~T-052 (P3)~~ ✅ **DELETED 2026-08-11 (owner approved option (a)).** Both `LoginScreen.tsx`
  files, both route registrations + imports, both barrel exports, the commented-out entry link in
  `PhoneRegistrationScreen`, and `login()`/`LoginCredentials` from **both** `AuthContext`s (the
  screen was their only consumer — verified before removal).
  ✅ **The deletion PROVED the code was dead: `tsc` user went 11 → 10.** The error that disappeared
  was inside the `login` function itself. Driver stayed at **35 = baseline**, its 6 in-file errors
  unchanged and pre-existing. Zero dangling references remain (`LoginScreen`, `navigate('Login')`,
  `LoginCredentials` all return no matches).
  ⚠️ **`register()`/`RegisterData` are dead by the identical test** — no external callers,
  `/auth/register` absent from the mounted `auth.routes.v2`, and registration is phone-OTP. **Left
  in place deliberately:** the owner approved deleting the *login screen*, not a wider AuthContext
  sweep. A comment in both files records this. → **T-053**.
  <details><summary>original investigation</summary>

  🔴 **`LoginScreen` was DEAD CODE in both apps.** Boarded as "hard-coded English on the login
  screen"; investigating it showed **the premise was wrong** and the real finding was bigger.
  **The screen cannot be reached, and would not work if it were:**
  1. **User app** — its only entry point, the "already have an account / login" link in
     `PhoneRegistrationScreen:390-397`, is **commented out**.
  2. **Driver app** — **nothing navigates to it at all** (registered in `AuthNavigator:96`, called
     from nowhere). Same registered-but-unreachable pattern as **T-037**.
  3. 🔴 **Its `handleLogin` would 404.** It posts to `/auth/login` (`config/api.ts:48`), but
     `routes/index.ts:51` mounts **only `auth.routes.v2`**, which has no `/login`. The v1
     `auth.routes.ts` that does define it is **imported nowhere**.
  4. **The product authenticates by phone OTP**, not email/password — the screen collects an email
     and a password, which no live endpoint accepts.
  ⇒ Its ~9 hard-coded English strings per app are **not** a user-facing i18n bug: no user can see
  them. Translating them would polish a screen that cannot open and would fail if it did.
  **The real decision (owner's):** (a) **delete** both `LoginScreen`s + the dead route registration
  + the commented-out link — ⚠️ deleting files needs owner approval per project rule 4; (b) keep them
  as a stub for a future email/password login and leave them untranslated; or (c) revive the feature,
  which needs an **API endpoint** and is a real card, not a cleanup.
  ⚠️ **Do NOT "fix" this by adding translations** — that would make dead code look maintained and is
  exactly how it survived this long.
  ⚠️ Also worth a look while deciding: `AuthContext.login()` and `LoginCredentials` exist only to
  serve this screen.
  </details>
- [x] ~~T-053 (P3)~~ ✅ **DONE 2026-08-11 (owner approved).** `register()` / `RegisterData` removed
  from **both** `AuthContext`s, along with the now-obsolete T-052 comment. Split out of T-052 rather
  than absorbed, because that approval covered the *login screen*, not a wider AuthContext sweep.
  **All three dead-code tests re-verified before touching anything** (not taken on trust from T-052):
  no external callers, **`/auth/register` absent from the mounted `auth.routes.v2`**, and the product
  registers by **phone OTP** — the function posted name + email + password, which no live endpoint
  accepts.
  ✅ **The removal proved itself again: `tsc` user went 10 → 9.** Second consecutive deletion to
  *reduce* the error count — the dead function was carrying a real type error nobody could reach.
  Driver stayed **35 = baseline** (its 4 in-file errors are pre-existing, merely renumbered).
  **Also removed: 3 dead endpoint constants per app** — `auth.login` (its consumer went in T-052),
  `auth.register`, and `auth.verifyToken`, all with **zero** references.
  ⚠️ **`devices/register` was deliberately KEPT** — it shares the word "register" but is the **live
  push-token endpoint**. Asserted explicitly so a future cleanup cannot take it by name-matching.
  ⚠️ **The driver's `useMemo` value and dep array were checked to stay in lockstep** (8 each). A
  mismatch there churns the context identity on every render — the exact mechanism behind **T-017**'s
  infinite profile-check loop.
  **46/46** checks: removal complete, **every live path asserted present** (`logout`, `updateUser`,
  `googleSignIn`, `appleSignIn`, `facebookSignIn`, `sendOtp`, `verifyOtp`, both OTP endpoints,
  `auth.logout`, `auth.refresh`), and a walk of `screens/components/hooks/navigation` in both apps
  confirming nothing destructures `register` from `useAuth`. **Proven able to fail: 19 red.**
  ⚠️ **The first version of this suite was WRONG** — 14 "still present" checks failed on correct
  code because `\b` was mangled by shell escaping, so the pattern never matched. Fixed to a plain
  `includes()`. **A check that fails on correct code is as dangerous as one that passes on broken
  code**; it was caught only because the failures were implausible.
  🛑 Owner: rebuild both apps — a typecheck cannot prove the auth provider still mounts.
- [ ] T-051 (P2) **Passenger orders list: switching tabs by swipe reloaded the whole page, and the
  order was wrong.** Owner, 2026-08-11: *"passenger orders list last created on top... if tab changes
  (with thumb left/right) whole page refreshes instead only tab slide."*
  **✅ FIXED 2026-08-11 (user app, `MyPassengerOffersScreen`). Both halves were real.**
  🔴 **The refetch:** `useFocusEffect` was keyed on **`selectedFilter`** (`:160`), so every tab change
  — including a thumb-swipe — fired a **new request**, and `loadOffers` sets `isLoading`, which hits
  an **early return that replaces the entire screen** (header and tabs included) with a spinner
  (`:551`). Sliding across four tabs = four round-trips and four blank screens. **The "refresh" the
  owner saw was the whole page unmounting.**
  **Fix:** fetch **once per visit** (empty deps, no `status` param) and filter in memory via a
  memoised `visibleOffers`. The tabs are a status filter over one small list, so switching is now
  instant and works offline; pull-to-refresh still fetches on demand.
  🔴 **The ordering was a SECOND, independent defect** — the screen never sorted at all, so it
  inherited the server's **`start_at DESC`** (`PassengerOfferService:722`) — *departure* time. An
  order created today for a trip next month outranked one created a minute ago for tomorrow.
  **Now sorted `created_at DESC` client-side**, with **`id` as the tie-breaker** so two orders
  created in the same second still order sensibly. ⚠️ Sorts a **copy** (`[...rows]`) — `Array.sort`
  mutates, and sorting React state in place is a stale-render bug waiting to happen.
  ✅ **Two latent bugs fixed for free:** `publishedCount`/`completedCount` (`:548`) count from the
  full list, which was **wrong on every non-"all" tab** before (the fetch only held one status).
  ⚠️ **Found, deliberately not changed:** `status` includes **`driver_found`**, which **none of the
  four tabs matches** — such an offer shows under "all" and nowhere else. Pre-existing, and adding a
  fifth tab is a design decision, not a bug fix. Raise with the owner if it matters.
  **20/20** checks — wiring asserted against the real source *plus* the filter/sort logic replicated
  and driven with 6 rows (including equal timestamps and a `driver_found` row). **Proven able to
  fail: 10 red** against the pre-fix file. `tsc` user **11 = baseline**; the 2 errors in the touched
  file **proven pre-existing via `git stash`** (shifted 115→141, 240→279 by the added lines).
  🛑 Owner: rebuild the user app, swipe between tabs, confirm no flash and newest-first order.
- [x] ~~T-048 (P1)~~ ✅ **CLOSED 2026-08-11 — NOT A DEFECT.** The owner retested and confirmed:
  *"when driver sends request to passenger offer push comes and all issues solved"* and *"if apps are
  in background there is no any issues with push notification all works fine"*.
  **Delivery works.** The original report (*"if app fully closed push does not come"*) was a
  first-impression guess the owner themself corrected on the next run — worth keeping as a record
  that **the push transport is sound**, so future notification bugs should be diagnosed as
  **routing**, not delivery. ⚠️ **This matters for T-047:** pushes DO arrive when killed, so a
  killed-app tap landing on the main menu is purely a navigation bug.
  <details><summary>original report</summary>
  Owner, 2026-08-11: *"before when driver sends request to passenger offer push came now this not
  works (i think if app open or in background push comes if app fully closed push does not come)"*.
  ⚠️ **NOT root-caused — do not guess at a fix.** ✅ **The server payload is already correct**:
  `PushService.sendFCM` sends a `notification` block + `data`, `android.priority: 'high'`,
  `apns-priority: 10` — which is exactly what a killed app needs to be woken. So this is **not**
  a data-only-message problem, and T-046 did not change the server's send path.
  **Likely candidates, in order:** (1) **Android battery optimisation / "restricted" app state**,
  which silently drops FCM for force-stopped apps — note a **force-stop** disables FCM entirely until
  the app is next opened by hand; (2) a **stale/invalid token** after the rebuild
  (`notifyDriver` deactivates tokens on `not-registered`); (3) OEM aggressive power management.
  **First diagnostic step is evidence, not code:** check the API logs for
  `✅ Push sent to driver <id>` vs `No active push tokens found` at the moment of the test — that
  single line separates "server never sent" from "device never showed".
  ⚠️ **Do not conflate with T-047**, which is about a push that DOES arrive and is tapped.
  </details>
- [ ] T-045 (P2) **The in-app notifications list is a dead end — and offer events never reach it.**
  ⚠️ Plan is **`docs/PLAN.md`**. **APPROVED and STEPS 1-5 DONE 2026-08-11 — only the owner's deploy
  + rebuild (step 6) and the commit (step 7) remain.**
  🔴 **The bigger half was the silence:** `createNotification` had **one caller in the entire API**
  (the signup welcome message), so every ride event was fire-and-forget FCM and **a missed push left
  no trace anywhere**. Now all **13 call sites** record — reached by touching just the **6 notify
  functions** they share, which also covers any call site added later.
  ⚠️ **Written BEFORE the push and OUTSIDE its try/catch** (owner decision): a stale token or an FCM
  outage can no longer swallow the record. And `recordPush` **never throws** — a notification must
  not fail a confirmed booking.
  🔒 **`otp` is refused outright** — a login code in a re-readable list defeats single-use, the same
  reasoning as T-034's log purge and T-046's toast exclusion.
  🔴 **The `type` trap, handled:** a row's `type` is a **severity** (`info|success|…`, drives the
  icon); a push's `type` is an **event name** (`driver_join_request`, drives the tap). Same key,
  different meanings — the event name goes into `data`, spread-first so a stray payload `type` cannot
  shadow it.
  🔴 **The driver app's routing had to sit OUTSIDE `handleMarkAsRead`,** which returns early for an
  already-read row — a naive fix inside it would have worked **exactly once per row**. Its handler
  was also moved below the function it calls (a `const` arrow is in the temporal dead zone until
  declared — a runtime crash `tsc` does not flag).
  ⚠️ **`routeForNotification` was deliberately NOT exported**, and the user app **keeps its detail
  modal** (the only way to read a long message). Widening a device-confirmed module for one caller
  invites a second, divergent destination table — the exact class of bug behind T-042 and T-044.
  **54/54** checks, the helper **executed** not grepped — the type trap both ways, `otp` refused, and
  a **thrown DB error proven not to propagate**. **Proven able to fail: 44 red.**
  `tsc` API **281** · user **9** · driver **35**, all at baseline (the driver file's 3 errors proven
  pre-existing via `git stash`).
  ⚠️ **Two of my own checks were wrong before the code was** — a regex that ran past the Set literal
  into the stylesheet, and a suite that crashed instead of reporting red. **A suite that cannot fail
  cleanly proves nothing.**
  🛑 **THREE cards now share one API deploy: T-034, T-043 and this.** No migration in any of them.
  Split out of **T-044** by owner decision 2026-08-10 (that card is push-taps-only).
  Two separate problems, found while scoping:
  1. **Tapping a row navigates nowhere.** The user app opens a **detail modal**
     (`NotificationsScreen.handleNotificationPress`); the driver app only **marks it read**
     (`handleMarkAsRead`) — there is no `navigate` in either screen. Once T-044 lands, the same
     `routeForNotification` mapper can be reused here, so this is small **on the app side**.
  2. 🔴 **The far bigger half: those events are not in the list at all.** `notifyDriver` /
     `notifyPassenger` in `OfferPassengerService`, `OfferDriverService`, `DriverOfferService` and
     `PassengerOfferService` only look up `PushToken` and send **fire-and-forget FCM** — they never
     call `NotificationService.createNotification`. The **only** writer in the whole API is
     `AuthController.v2:90`. So a passenger who misses the push has **no record of it anywhere**.
  ✅ **No migration needed** — the `notifications` table exists with a **JSONB `data` column**
  (`20250131000001-create-notifications.cjs`), which is exactly what the routing mapper reads.
  ⚠️ Needs an **API deploy**. ⚠️ Decide whether persistence goes inside `notifyDriver`/
  `notifyPassenger` (one place each, catches every caller) rather than at the ~13 call sites.
- [ ] T-043 (P2) **Two endpoints under `/public/passenger-offers` returned different shapes for the
  same object.** Split out of **T-042** (app-side fix first, to unblock a device test).
  **✅ FIXED 2026-08-11 — this closes the ROOT CAUSE T-042 only worked around. API-only, needs a
  DEPLOY, no migration.**
  **The inline mapper inside the browse list was extracted to `toPublicOffer()`, and the public
  detail controller now calls a new `getPublicOfferById()` that runs the same mapper.** One
  definition, both endpoints — so they cannot drift apart again. The old detail did `return offer`,
  the **raw Sequelize model**, whose include is aliased **`user`**, which is exactly why
  `offer.passenger.name` threw during render and killed the driver app to the phone's launcher.
  ✅ **`getOfferById` is deliberately UNTOUCHED**, as the card required — it is shared with the
  passenger's own order view and T-040's edit flow and is the return value of
  `createOffer`/`updateOffer`. The wrapper gives the *public* route its own shape without moving any
  of that. `payer_phone` stays absent from the public shape.
  ✅ **`tsc` API 282 → 281** — one *below* baseline: extracting the mapper removed a pre-existing
  error. ⚠️ A second one surfaced and was fixed properly: the controller passed `req.params.id`
  (`string | undefined`) into a `string` parameter — previously hidden because the old call site was
  equally loose.
  ⚠️ **My first extraction invented a paginated return** (`page`/`limit`/`totalPages`) this function
  never had, briefly pushing `tsc` to 287. Caught immediately by the typecheck — a reminder that
  "extract a method" is still a rewrite of its boundaries.
  **25/25** checks — one shared mapper proven used by both paths, `getOfferById` proven unchanged,
  the field set verified, and both endpoints simulated over one raw row to confirm identical keys and
  a readable `passenger.name`. **Proven able to fail: 18 red.**
  🛑 **Owner: deploy the API, then re-open a passenger order's details in the driver app.** It should
  behave exactly as it does now — the app-side guard from T-042 stays as belt-and-braces.
  <details><summary>original report</summary>
  `GET /public/passenger-offers` (list) returns a hand-mapped object with `passenger: {id, name}`;
  `GET /public/passenger-offers/:id` (detail) returns the **raw Sequelize model** with `user`.
  Same prefix, same logical object, two shapes — which crashed the driver app to the launcher once
  already and will keep producing that class of bug.
  ⚠️ **Why it was not fixed at the API:** `getOfferById` is **shared** — the passenger app's own
  order view and T-040's edit flow both call it, and it is the return value of `createOffer` and
  `updateOffer`. Changing what it returns risks all of those, so it needs its own testing pass.
  **Suggested shape:** leave `getOfferById` alone and give the *public* controller its own mapper
  (`getPublicOfferById`), so the two public endpoints agree and nothing else moves.
  ⚠️ Check the **user app** for the same bare `.passenger` reads before closing.
  </details>
- [ ] T-034 (P1) 🔒 **Two OTP security holes.** Split out of T-033 by owner decision 2026-08-08.
  **✅ BOTH FIXED 2026-08-11 (owner approved: delete the logs; fix the cap only, no code-length
  change). API-only — needs a DEPLOY, no migration.**
  **① Secrets out of the logs.** Removed every line that printed the **OTP code** (`sendOtp code`,
  `Sending SMS to … with code:`), the **Eskiz bearer token** (logged as the whole auth
  `response.data`), the **full user row**, and the **device push token**. Two Eskiz response bodies
  also went — they can echo the message text, which contains the code.
  ⚠️ **Phone numbers are now masked** (`+99890***4567`) in logs *and* in all four audit payloads. A
  phone is personal data and the identifier half of a credential pair.
  ⚠️ **My own check caught two I had missed** on the first pass — `console.warn('SMS send status:',
  response.data)` and one unmasked audit payload. Worth noting: the sweep found more than the card
  had listed.
  **② The brute-force cap fires for the first time.** `verifyOtp` looked the row up by
  **`{ target, code }`**, so a WRONG code matched nothing, returned at the `!otpRecord` branch, and
  never reached the `attempts` increment — `maxAttempts` (5) had never once fired, on a **4-digit**
  code. The comparison `otpRecord.code === code` was tautological and its `else` branch unreachable.
  Now: newest live code found **by target alone** → attempt counted **before** comparing → compared
  with **`timingSafeEqual`** (length-checked first, since that throws on unequal buffers).
  🔴 **Tightening the read forced a matching change to the WRITE, and missing it would have traded a
  security hole for a usability one:** a resend used to leave the old code live, and lookup-by-code
  meant *either* worked. Looking up by target alone would have silently rejected a user who typed the
  **first** SMS after requesting a second. `sendOtp` now **retires live codes before issuing a new
  one**, so exactly one is valid at a time.
  **30/30** checks, **running the real `verifyOtp`** against a fake model — five wrong guesses
  counted one by one, then the **correct** code refused because the cap had bitten; the happy path
  still verifies and consumes the row; one phone's failures never touch another's; expired codes
  refused; 6 hostile inputs never throw. **Proven able to fail: 15 red**, naming each leaking line,
  including *"a wrong code COUNTS as an attempt"*. `tsc` API **282 = baseline**.
  🛑 **Owner: DEPLOY THE API, then re-check `kubectl logs` for a live code** (the original evidence).
  ⚠️ **`OTP_CODE_LENGTH` stays 4 by owner decision** — raising it changes the SMS text and would need
  the OR-003 SMS-Retriever hash flow re-checked. The real defences now are the working cap plus
  `otpVerifyLimiter`.
  <details><summary>original report</summary>
  1. **Secrets in the server log.** `OtpService.ts:297` prints `sendOtp code <code>` and `:102`
  prints the **full Eskiz bearer token** in the auth response. The owner's own `kubectl logs` paste
  on 2026-08-08 contained a live OTP and a live JWT. Anyone with log access can log in as any user.
  The whole `sendOtp` block (`:294-300`) is debug spew that should be gated or deleted.
  2. **The brute-force cap never fires.** `verifyOtp` (`OtpService.ts:371-380`) looks the row up
  **by `target + code`** — so a **wrong** code matches nothing, returns `false`, and never reaches
  the `attempts` increment at `:406`. `attempts` therefore only ever counts *correct* codes, and
  `config.otp.maxAttempts` (5) is dead. The code is **4 digits** (`OTP_CODE_LENGTH` default 4) and
  the only real defence left is `otpVerifyLimiter` (10 per 5 min, keyed on phone).
  ⚠️ The fix is a restructure: find the newest live code by `target` **alone**, then compare —
  which also makes `maxAttempts` and the existing audit reasons meaningful.
  </details>
- [ ] T-026 (P1) **Offer backend + app hardening** — everything the two 2026-08-02 (3) audits found
  that T-025 deliberately left alone. **Both audits produced the same defect classes in two
  different services**, so fix them as one sweep, not twice.

  **A. Passenger↔driver-offer connection leg** (audit 2, findings 4–17). ⚠️ Unlike the OfferDriver
  leg, this one **is fully wired in both apps** (`OfferDetailsScreen` → join; `OffersListScreen` →
  `OfferPassengers` → confirm/reject) — so these fire in real use, not hypothetically.
  ⚠️ *Overbooking:* **carved out into T-026A** (2026-08-02) — the race, the missing transactions,
  the single-front-seat rule and the confirm-onto-a-cancelled-offer hole are all that card's, not
  this one's. Do not re-plan them here.
  *500s:* `seats_requested` is type-unchecked **and** checked in the wrong order — the availability
  test (:121) runs before the range test (:126), so `"abc"` passes both and dies as `NaN` in
  Postgres (journal defect #2, never applied here); `2.5` passes and Postgres rounds it to 3 seats;
  `parseInt(offerId)` → `NaN` → 500 (`OfferPassengerController:30`, `:110`); `?status=<garbage>` →
  ENUM error → 500 (`:86`, journal #5); `?date=<garbage>` → RangeError → 500
  (`PublicOfferController:45`, journal #6); non-UUID `:id` → 500 on confirm/reject/cancel/location.
  *Smaller:* `if (!lat || !lng)` (`:189`) rejects **0** as missing, and `"abc"` slips through to
  `NaN`; `min_rating` filters **after** pagination and `total` is the filtered page length, not the
  real count (latent — `SearchOffersScreen` does not paginate yet); **no rate limiter on any route**
  in `offer-passenger.routes.ts` and no cap on `limit` in the public browse; the `language`
  parameter of `notifyDriver`/`notifyPassenger` is **dead** (declared, defaulted, never referenced);
  3 unguarded `response.json()` in `driver-app-standalone/api/offerPassengers.ts` (:56, :93, :131).

  **B. Driver-offer create/edit** (audit 1) — ⚠️ **T-025 already fixed 3 of these; what is left:**
  Backend: `DriverOfferService.updateOffer` still spreads `req.body` into the model — `user_id`,
  `status`, `currency`, `rejection_reason`, `reviewed_by` and `reviewed_at` are client-writable (the
  same mass-assignment hole already fixed in `PassengerOfferService`). *`seats_free` and `start_at`
  are NOT — the explicit keys sit after the spread and win; T-025 verified this.*
  `validateOfferData` still checks no **presence** and no types outside the two price fields T-025
  covered, so a missing `vehicle_id`, a non-numeric `seats_total` or a garbage `start_at` are still
  **500s**; non-numeric `:id` → 500 instead of 404 on 6 endpoints;
  stops are inserted outside a transaction with no cap and can collide on the unique
  `(offer_id, order_no)` index; `front_price ≥ price` is not checked against the stored row on
  PATCH; `archiveOffer` has no status check and strands confirmed passengers silently.
  Driver app: 8 unguarded `response.json()` calls in `api/driverOffers.ts` (+ all of `api/driver.ts`)
  — the offer limiter returns a **plain-text** body, so the 21st create in 15 min throws
  `JSON Parse error`; `parseLocationText` fans out country×province city fetches when opening an
  offer for edit; hard-coded Uzbek strings in `OfferWizardScreen`. Found 2026-08-02 (3).
- [x] ~~T-023 (P1) Driver app: "I'll take this order" screen.~~ **REPLACED by T-037 on 2026-08-08.**
  ⚠️ Its premise was **wrong**: it said "the driver can browse passenger orders but has no way to
  offer on one". The browse screen is registered in **no** navigator, so the driver cannot browse
  either. Do not work this card — see T-037 in *Now*.
> ✅ **T-024 is IMPLEMENTED** (steps 1-6, 2026-08-11, committed `e411ec4`) — its live card is in
> **Now**, above. The stale original that sat here has been removed rather than left to contradict
> it. One note from it is worth keeping:
> ⚠️ **Do not confuse this with the driver-side screen.** The driver app's
> `PassengerOfferDetailsScreen` being **read-only after bidding is CORRECT** — the bid *is* the
> action, and since T-042 ③ the footer shows the driver's real status instead of re-offering the
> button. **Do not add driver actions there.**

- [ ] T-019 (P1) **[OWNER OR-008]** User registration → Figma layout (`K_Reg001.png`); move the
  referral block (Tel/ID/PROMO) to a second screen. App-only; backend fields already exist.
  → `docs/OWNER_REQUESTS.md` OR-008
- [ ] T-020 (P2) **[OWNER OR-009]** Driver vehicle usage: add "Firmaga/Shaxsga ishlayman — faqat
  shafyorman" option (`D_Vehicle.png`); selecting "O'zimniki" disables "Ijara". **Needs a DB enum
  migration** + `DriverPersonalInfoScreen` logic. → `docs/OWNER_REQUESTS.md` OR-009
- [ ] T-001 (P1) Verify & finish passenger→offer join flow — passenger joins, driver
  gets notified, driver confirms/rejects, passenger gets notified. Last commit says
  "user joins to driver offer but **not checked**".
- [ ] T-002 (P1) Driver offer wizard screen (mobile, 4 steps) — create/edit offer UI
  (`driver-app-standalone/screens/OfferWizardScreen.tsx`, currently missing)
- [ ] T-003 (P2) Admin passengers page shows empty — registered passengers not listed
  at `/passengers` (`PASSENGERS_NOT_SHOWING_DEBUG.md`)

## 💡 Later / ideas (parking lot)

> 📥 **OWNER DEVICE-TEST BATCH 2026-08-12 — 13 findings, boarded as T-064…T-074.**
> Grounded in code the same day (all except ④ and ① confirmed by reading; see each card).
> ⚠️ **Nothing here is started.** The owner picks; `/new-task` writes the plan.
> 🔴 **The pattern of this batch: FOUR of the thirteen are defects this project has already fixed
> ONCE, in the other app or the other direction** — T-066 is T-042② in the user app, T-067 is
> T-042③ in the user app, T-065 is the notify-everyone rule `cancelOffer` follows and `updateOffer`
> does not. **A fix applied to the observed instance instead of the class is a half-fix** (journal
> 2026-08-10). Whichever card is started, sweep the sibling.

- [ ] T-064 (P1) 🔴 **[OWNER ⑤] An accepted driver can never back out.** Owner 2026-08-12:
  *"passenger created offer → driver send request → passenger accepted → if driver wants to cancel
  there is no chance"*. **Grounded 2026-08-12 — this is deliberate, at both layers, and undoing it
  is a product decision, not a bug fix.**
  🔴 `OfferDriverService.cancelJoin:515-517` throws **400 `offers.cannotCancelConfirmed`** for a
  `confirmed` row, and `MyJoinRequestsScreen:232-234` hides the button with a comment naming that
  rule (*"The server refuses to cancel a confirmed request, so only pending ones offer the button"*).
  So the app is telling the truth — the **rule itself** is what the owner is disputing.
  ⚠️ **The passenger side is NOT symmetric:** `PassengerOfferService.cancelOffer:929` explicitly
  accepts `driver_found` and its comment says *"A passenger who already picked a driver must still be
  able to call it off"*. **One party can walk away from an agreed ride and the other cannot.**
  ✅ **UNBLOCKED — owner decided 2026-08-12: YES, a confirmed driver may withdraw, and the offer
  REOPENS.** The passenger's offer goes back to **`published`** so other drivers can bid again, and
  the passenger is pushed.
  ⚠️ **The reopen is the hard half, not the withdrawal.** `confirmDriver:377-382` auto-rejects every
  losing bid (`rejection_reason: 'another_driver_chosen'`) and moves the offer to `driver_found`.
  Reversing that raises questions the decision does not answer on its own: **do those auto-rejected
  drivers get reopened to `pending`, or stay rejected and have to bid again?** Recommendation:
  **leave them rejected** — they were told they lost and may have taken other work; silently
  re-enlisting them would let a driver be "confirmed" for a ride they stopped tracking. **Say so if
  you want the other behaviour.**
  ⚠️ The passenger must be pushed — `notifyPassenger` is already in `cancelJoin` for the pending
  case, so the call exists; it needs a **new type** (`driver_withdrew`) plus a destination in the
  **user** app's `notificationRouting` table, or the tap dead-ends (T-044's rule).
  ⚠️ `offers.cannotCancelConfirmed` becomes dead — check for other callers before deleting it.
  ⚠️ **`start_at` may already have passed** by the time a driver withdraws; reopening a stale offer
  puts it straight back into T-039's expired-but-"Faol" hole. Decide what `published` means there.
  ❌ Migration only if a distinct "withdrawn" status is wanted over reusing `cancelled`.
  ⚠️ **Needs an API deploy** + a user-app rebuild.

- [ ] T-065 (P1) 🔴 **[OWNER ⑥] The passenger can rewrite an agreed ride and the confirmed driver is
  never told.** Owner 2026-08-12: *"passenger accepted → if passenger edits own offer push not comes
  to dealed driver"*. **Grounded 2026-08-12 — confirmed, and the precedent sits 30 lines below it.**
  🔴 `PassengerOfferService.updateOffer:882-921` validates, patches, audit-logs and returns. **It
  sends nothing to anybody** — there is no `notifyDriver` call in the whole method.
  🔴 **And it deliberately allows editing after the deal:** `:897` permits both `published` **and
  `driver_found`**, so the time, the route or the seat count of a ride a driver has already committed
  to can change silently under them.
  ✅ **The pattern to copy is immediately below:** `cancelOffer:986-1006` loads the interested
  drivers, resolves **each driver's own language** via `getUserLanguage`, and pushes
  `offer_cancelled_by_passenger`. The same loop with a new type is the whole fix.
  ⚠️ **`updateOffer` returns `Object.keys(fields)` into the audit log already** — so *what changed*
  is available for free; a push saying only "your ride changed" is worth less than one naming the
  field. ⚠️ Needs a **new push type** + its destination in **both** apps' `notificationRouting`
  (T-044's table), or the tap dead-ends. ⚠️ New `push.*` keys ×3 locales.
  ❌ No migration. ⚠️ **Needs an API deploy.**
  **Approved and STEPS 1-6 DONE 2026-08-12.** Owner decisions: notify **the confirmed driver AND
  every pending bidder**, and **name the changed fields** rather than sending a generic "it changed".
  🔴 **The hazard was real and bigger than the card said.** `buildOfferFields` reports what was
  **sent**, not what **changed**, and `CreatePassengerOfferScreen:531-542` re-sends the **whole
  ~40-field form** on every edit — so the obvious implementation would have announced "the route,
  the time, the seats, the payment changed" every time a passenger fixed a typo. **That would have
  turned a missing-notification bug into a spam bug.** New `changedFields` does a normalised
  value-diff: DECIMAL-as-string (the 2026-08-02 root cause), Date-vs-ISO, JSONB key order, and
  null/undefined/`''` all meaning unset.
  ⚠️ **`Promise.allSettled`, not `all`** — the edit is already committed when the pushes fire, so
  one driver's failure must not cancel the rest or surface as a failed save. (`cancelOffer` uses
  `all`; that is correct *there* and wrong here.)
  🔴 **Reuse of the existing `fields.*` dictionary was checked and REJECTED on evidence** — it is
  entirely driver-registration and shares **not one key** with the offer columns; merging would make
  `category`/`year` ambiguous between a licence and a ride request. New `offerFields.*` ×3 locales
  covering all **41** writable columns, taken from `PassengerOfferAttributes` rather than guessed.
  ✅ The audit log now records the real diff too, instead of ~40 fields per save.
  **51/51 with `changedFields` EXECUTED, 39 red** against pre-change code — the red reproduces the
  bug from the other side, showing the old behaviour would have reported ~40 changed fields.
  Destination asserted against route names **parsed from the real `MainNavigator`**.
  `tsc` API **281** · driver **35**, both at baseline, zero errors in any touched file.
  🛑 **Only step 7 (owner: deploy the API, rebuild the DRIVER app, confirm a driver then edit the
  time) and step 8 (commit) remain.** ❌ **User app untouched.** ⚠️ Plan is **`docs/PLAN.md`**.

- [ ] T-066 (P1) 🔴 **[OWNER ⑦] The user app's search picker merges with the results — T-042 ② again,
  in the other app.** Owner 2026-08-12: *"driver creates offer → passenger searches and finds list of
  offers → search blog and found offer list merges?"* **Grounded 2026-08-12: byte-for-byte the same
  structure T-042 diagnosed and fixed in the driver app on 2026-08-10.**
  🔴 `SearchOffersScreen.tsx:663` is a `ScrollView` with **`maxHeight: 270`** (`:1077-1078`) sitting
  as a **sibling** of the `FlatList` at `:832` — two independent scroll surfaces, so the picker can
  never scroll away and permanently eats ~270px; and because both use the same white/radius/shadow
  card styling they read as one continuous sheet at the seam. **That is the "merging".**
  ✅ **The fix is already written and device-confirmed** — driver `SearchPassengerOffersScreen`: make
  the picker the list's **`ListHeaderComponent`** (one scroll surface), add the labelled
  `resultsCount` seam, strengthen the picker's shadow, drop the card's `marginHorizontal`.
  ⚠️ **Check `emptyContainer` too** — in the driver app its `flex: 1` + `paddingTop: 80` pushed the
  empty state off small phones once it moved inside the list. Same trap here.
  🔴 **Worth naming: T-042 fixed one app and the sweep stopped there.** ❌ No API change, no
  migration, no deploy. ❌ Driver app untouched.
  **Approved and STEPS 1-6 DONE 2026-08-12** (planned and built jointly with **T-067** — same app,
  same rebuild, and splitting them would have repeated the very half-fix that caused both).
  ✅ **The predicted trap was REAL:** `emptyContainer` was still `flex: 1` + `paddingTop: 80`, so
  without checking it the empty state would have been pushed off the bottom of small phones —
  invisible on a big screen, which is how it survived in the driver app the first time.
  ⚠️ Two deviations from the recipe, both checked rather than copied: the offer card had **no**
  `marginHorizontal` to drop, and `ScrollView` **must stay imported** because the filter modal uses
  it. `searchContainer` lost its own `marginHorizontal` instead, since `listContainer` already pads.
  **56/56 with T-067, 51 red** against pre-change code. `tsc` user **9 = baseline**, zero errors in
  either touched screen. ⚠️ **A visual card — the checks prove structure, not looks:** one scroll
  surface, the `maxHeight` cap and the orphaned copy gone, the empty state reachable, the picker's
  shadow outranking the cards'. Whether it *reads* right is the owner's rebuild.
  🛑 **Only step 7 (owner: rebuild the USER app, search a route, scroll) and step 8 (commit)
  remain.** ⚠️ Plan is **`docs/PLAN.md`**.

- [ ] T-067 (P1) 🔴 **[OWNER ⑧] The user app offers "join" for a ride the passenger has already
  joined — T-042 ③ again, in the other app.** Owner 2026-08-12: *"driver creates offer → passenger
  joined that offer → passenger still can send another request to that offer?"*
  **Grounded 2026-08-12.** ✅ **The server was never at risk:** `OfferPassengerService:100-120`
  refuses every existing row with a translated 400 — `alreadyJoined` for `pending`/`confirmed`,
  **`cannotJoinAfterRejected`** and **`cannotJoinAfterCancelled`** for the other two.
  🔴 **The app is worse than the driver app was.** The driver at least had a `joinSent` boolean that
  reset on mount; `OfferDetailsScreen` has **no join state at all** — grepped: one `joinOffer` call
  (`:143`) and **zero** occurrences of `joinSent`/`hasJoined`. The CTA is offered unconditionally,
  every time, for ever.
  🔴 **`rejected` and `cancelled` are PERMANENT refusals**, so for those two the button is a **dead
  end**, not a wasted trip — the passenger picks seats, confirms a price in a dialog, and is refused.
  ✅ **Precedent to copy:** the driver app asks `GET /driver/join-requests` for its own rows and
  renders the real status with its own wording and colour. The passenger's equivalent is
  **`GET /passenger/bookings`** (`getPassengerBookings:618`) — already built, already authenticated,
  and **T-055 just touched it**, so re-read that card first.
  ⚠️ The offer's `passengers` list is owner-only by design; do **not** widen it to answer this.
  ❌ No API change, no migration, no deploy.
  **Approved and STEPS 1-6 DONE 2026-08-12** (built jointly with **T-066**).
  ✅ **The privacy gate shaped the fix rather than being weakened by it** — the answer comes from
  `GET /passenger/bookings`, which returns only the caller's own rows. The owner-only `passengers`
  list was **not** widened. **No API change.**
  🔴 **The three-state distinction is the whole card:** `null` = no request, a row = has one,
  **`undefined` = unknown / lookup failed**. Collapsing "failed" into "none" would re-offer the
  button exactly as today and this fix would have *appeared* done while changing nothing. A failed
  lookup deliberately falls through to the button — the server is still the real guard.
  🔴 **Each status gets its own colour and wording.** One green "sent" banner for all four would
  tell a **rejected** passenger their request was still live — the exact mistake T-042 ③ found on
  the driver side of this same flow. The two permanent refusals also say *why* they are final.
  ⚠️ **Deviation:** the plan said pull-to-refresh; this screen **has none**, so it re-checks on
  **focus** — which matches the owner's actual symptom (*join → leave → come back → button is back*)
  and also catches a driver's decision taken while the screen was backgrounded.
  ✅ Step 1 checked the two things this codebase has been bitten by and both came out clean:
  `offer_passengers.offer_id` is an **INTEGER** (not the DECIMAL-as-string class) and both entry
  points deliver a number; the four client statuses match the four the server branches on. It also
  turned up a **unique index on `(offer_id, passenger_id)`** — which is *why* the server can refuse
  so confidently, and why the lookup is a `find` rather than "newest of several".
  **56/56 with T-066, 51 red.** `tsc` user **9 = baseline**, zero errors in either touched screen.
  🛑 **Only step 7 (owner: rebuild the USER app, join an offer, re-enter it) and step 8 (commit)
  remain.** ⚠️ Plan is **`docs/PLAN.md`**.

- [ ] T-068 (P1) 🔴 **[OWNER ⑨] A push arrives, the app is open, and the screen keeps showing stale
  data — both apps.** Owner 2026-08-12: *"if push notification comes and app is open the page not
  refreshes still shows before push notification come data, in both apps"*.
  **Grounded 2026-08-12 — confirmed, and it is one argument in each app.**
  🔴 `setupForegroundNotificationHandler(onNotificationReceived?, onTap?)` (`PushService.ts:189`)
  has an observer slot for exactly this, and **both** call sites pass **`undefined`** for it —
  user `App.tsx:70-73`, driver `App.tsx:69-72`. So T-046 made the foreground push *visible and
  tappable* but nothing ever tells the screen underneath that its data is out of date.
  ⚠️ **The existing comment states the constraint the fix must respect:** *"A push must never yank
  someone off the screen they are using."* Refreshing in place is fine; navigating is not.
  ⚠️ **Do not simply refetch on every push** — an `otp` push must not reload a list, and a refetch
  while the user is mid-form must not discard input. The push `type` is in `data` and is the
  natural filter. ⚠️ Needs an app-level subscription (context or emitter) that screens opt into;
  T-046's lesson was that a correct handler nobody calls does nothing, so the check must drive the
  **real** `onMessage` callback and assert a subscribed screen was told.
  ❌ No API change, no migration, no deploy.
  **STEPS DONE 2026-08-12 — code-complete.** New `utils/pushEvents.ts`, **byte-identical in both
  apps** (the T-036 convention), modelled on the existing `driverProfileEvents.ts` (T-017) rather
  than inventing a second event convention — including its rule that one throwing listener must not
  take the others down.
  🔴 **The fix at `App.tsx` is one argument per app:** the observer slot was being passed
  **`undefined`** in both. Nothing else about the plumbing was wrong.
  🔴 **Filtering happens in ONE place, not per screen.** `otp` is deliberately absent from
  `RIDE_DATA_PUSH_TYPES`, so a code arriving while someone types it can never reload the list
  underneath them — and a future `otp`-like type cannot accidentally start doing so either.
  ✅ **Seven screens subscribe**, each to only the types it cares about: user — `MyBookings`,
  `MyPassengerOffers`, `OfferDrivers`, **`OfferDetails`** (whose T-067 lookup goes stale the same
  way); driver — `MyJoinRequests`, `OfferPassengers`, `OffersList`.
  ⚠️ **The two offer-scoped screens filter on `offer_id`** so a push about a *different* ride cannot
  reload the one being read — compared coerced, since push `data` values are strings.
  ⚠️ **Refreshes are silent by design:** screens that showed a full-screen spinner gained a
  `silent`/`isRefresh` path. Replacing the list someone is reading with a spinner because a push
  arrived would be worse than the stale data. **Navigation still happens only on a TAP.**
  **60/60 driving both apps' REAL transpiled module, 34 red** against the unwired code — and the red
  is precisely the T-044/T-046 failure mode: the 26 module checks stayed **green** while every
  *wiring* check failed, i.e. a correct emitter nobody calls.
  `tsc` user **9** · driver **35**, both at baseline; the 2 errors in a touched file **proven
  pre-existing via `git stash`** (the `getErrorMessage(error, t('key'))` bug from T-024).
  🛑 **Only the owner's rebuild of BOTH apps and the commit remain.** ❌ No API change, no deploy.

- [ ] T-069 (P2) 🔴 **[OWNER ② + ③] Create-offer time: the passenger can depart in the past, and both
  apps offer 60 minutes where the owner wants 4.** Owner 2026-08-12: *"passenger/driver create offer
  time cannot create offer before time creating offer"* · *"round time munites to quarter only
  0/15/30/45"*. **Grounded 2026-08-12 — and the two apps are in opposite states.**
  🔴 **Past departure — PASSENGER side only.** `TimeWindowCard.tsx` passes `DateWheelModal`
  `earliestYear={new Date().getFullYear()}` (`:216`) — so **1 January of the current year is
  selectable** — and gives `TimeWheelModal` **no minimum at all**. ✅ The **driver** side does guard:
  `OfferWizardScreen:590` rejects anything under `now + 30 min`, and its `generateHours`/
  `generateMinutes` (`:743`, `:762`) hide past values when the date is today.
  ⚠️ **This is the exact risk the 2026-08-08 journal flagged and T-057 then walked into:** moving a
  picker onto the shared wheels *"would have dropped the past-date guard silently — no compile error,
  no visible symptom"*. T-057 swapped the passenger screen onto the wheels. **Confirm whether the
  submit handler validates the time before assuming the wheel is the only gap.**
  🔴 **Quarter-hour minutes — BOTH apps, two different mechanisms.** User: `TimeWheelModal` already
  takes a **`minuteStep` prop, default 5** (`:38,48`) — a one-argument change. Driver:
  `generateMinutes:786` loops `minute++`, i.e. **all 60**, and the driver app **has no
  `TimeWheelModal`** (it has `DateWheelModal` only — checked the components folder).
  ⚠️ **`selectedMinuteBucket` (`:79-86`) already snaps a stored 07 to the 05 bucket**, so an existing
  offer being edited will not render an unselectable value — but the value it *saves* still needs
  rounding, or an edit silently moves the departure time.
  🛑 **Ask the owner:** does the 30-minute minimum advance apply to passengers too, or only "not in
  the past"? ❌ No migration. ❌ No API change unless the server should validate it too.
  **DONE 2026-08-12 — code-complete. ⚠️ AND THE CARD'S OWN DIAGNOSIS OF ITEM ② WAS WRONG.**
  🔴 **Correction: the passenger side was NEVER able to save a past departure.**
  `CreatePassengerOfferScreen:377` already rejects anything under **31 minutes** away, with a clear
  message (*"Vaqt kamida 30 daqiqadan keyin bo'lishi kerak"*). The 30-minute question above is
  therefore **already answered by the shipped code** — it applies to passengers today.
  **The real defect is narrower and still real:** the wheel *offered* past dates, so the refusal
  only arrived after the whole form was filled. The wheels now stop at today, matching what the
  driver wizard has always done. **Submit remains the real guard; this only stops the user choosing
  something destined to be rejected.**
  🔴 **`minimumDate` is deliberately OPT-IN on `DateWheelModal`.** Its other callers are the
  **birth-date** pickers (`UserDetailsScreen`, `EditProfileScreen`) which must keep offering
  1900→today. Defaulting it on would be the 2026-08-08 trap mirrored — *"no compile error, no
  visible symptom until a driver posted a trip in the past"*.
  ✅ **Quarter-hours in both apps** (item ③). User: `minuteStep={15}` — the prop already existed.
  Driver: `generateMinutes` walked **all 60**; it now rounds the "30 minutes' notice" floor **UP** to
  the next quarter via a new `MINUTE_STEP` constant.
  ⚠️ **A floor past :45 legitimately yields an EMPTY minute list** — correct, because
  `generateHours` has already dropped unusable hours, and the driver moves the hour column instead.
  **Asserted deliberately** so it is a decision, not a device surprise.
  **49/49 with the wheel maths EXECUTED, 10 red** against pre-change code. Proven: **today stays
  selectable** (a `>` instead of `>=` would have silently removed it), no column can ever render
  empty, next month/year are unfiltered, leap-year February still has 29 days, all 9 off-grid minute
  values still highlight a bucket, and **with no `minimumDate` nothing changes at all**.
  ⚠️ **Honest limit:** the wheel logic is **transcribed, not imported** (TSX + RN imports will not
  load in bare node), so 11 assertions tie the transcription to the shipped source — all 10 relevant
  ones go red on the old code, which is what makes the other 38 meaningful.
  `tsc` user **9** · driver **35**, both at baseline, zero errors in any touched file.
  🛑 **Only the owner's rebuild of BOTH apps and the commit remain.** ❌ No API change, no deploy.

- [ ] T-070 (P2) 🔴 **[OWNER ⑩] A driver cannot tell their own offers apart without opening each
  one.** Owner 2026-08-12: *"driver my offers page shows too little data, on first read it was not
  possible to recognize which own offer, driver must click to own offer to see what exactly"*.
  **Grounded 2026-08-12 — confirmed by reading the card component end to end.**
  🔴 `components/offers/OfferCard.tsx` renders exactly three things: the **status badge**, an
  **`ID: <n>`** in monospace grey, and the **route** (from / stops / to). There is **no departure
  date or time, no price, and no seat count** anywhere in the file.
  🔴 **Which makes the common case unusable:** a driver who runs the same route repeatedly sees N
  identical cards distinguished only by a database id.
  ✅ **The data is already on the object** — `DriverOffer` carries `start_at`, `price_per_seat`,
  `front_price_per_seat`, `currency`, `seats_total`, `seats_free`; the card simply never reads them.
  **No API change, no new endpoint.**
  ⚠️ `price_per_seat` is a **DECIMAL that pg returns as a STRING** — the 2026-08-02 root cause behind
  three separate bugs. Format via `formatNumberWithSpaces(Math.round(Number(x)))` as
  `MyJoinRequestsScreen:185` does; **never compare two of them with `<`/`>`**.
  ⚠️ Adding rows to a card that already has `minHeight: 48` route items risks the T-050 overflow
  class on large system fonts. ⚠️ Any new label needs ×3 locales.
  **DONE 2026-08-12 — code-complete.** The card now carries a facts row under the route: **departure
  date/time, `seats_free`/`seats_total`, and the price**, separated by a hairline rule.
  ✅ **No new i18n keys were needed** — the row is icon + value, so it reads identically in all three
  locales and there is nothing to translate or to leave uz-only (the T-059 trap).
  ⚠️ **`price_per_seat` is a DECIMAL that pg returns as a STRING** — formatted via
  `formatNumberWithSpaces(Math.round(Number(x)))`, the same guard `MyJoinRequestsScreen` uses. Not
  compared with `<`/`>` anywhere, which was the 2026-08-02 root cause behind three bugs.
  ⚠️ **The T-050 overflow risk was designed for, not ignored:** the row is `flexWrap` with
  `flexShrink` on each fact, so at a large system font size it wraps instead of pushing the price
  off the card. `tsc` driver **35 = baseline**, zero errors in `OfferCard`.
  🛑 **Only the owner's driver-app rebuild and the commit remain.** ⚠️ **A visual card — a check
  cannot prove it reads well.** ❌ No API change, no migration, no deploy.

- [ ] T-071 (P2) 🎨 **[OWNER ⑪ + ⑫] Two different back buttons ship in both apps, and neither app has
  a shared component for it.** Owner 2026-08-12: *"both apps back buttons not identical, make
  identical back button like in passenger app search ride page back button everywhere"* · *"remove
  icons where titles and back buttons close in both apps"*. **Grounded 2026-08-12 — counted.**
  ✅ **The owner's reference is `SearchOffersScreen.tsx:642-646`** (user app): a `TouchableOpacity`
  wrapping `<Ionicons name="arrow-back" size={24} color="#111827" />`.
  🔴 **24 back buttons, two families, and 14 of them are the wrong one:**
  **user app** — 6 × `Ionicons arrow-back` (CreatePassengerOffer, MyBookings, MyPassengerOffers,
  OfferDetails, OfferDrivers, SearchOffers) vs **4 × a text `←`** (EditProfile ×2, Notifications,
  Profile); **driver app** — 4 × `Ionicons` (MyJoinRequests, OfferPassengers,
  PassengerOfferDetails, SearchPassengerOffers) vs **10 × a text `←`** (the five registration
  screens' `backButtonArrow`, EditProfile, Notifications, OfferWizard, OffersList, Profile).
  ⚠️ **The text arrows are not merely a different glyph** — driver `NotificationsScreen:327` renders
  it at **24px green `#10B981`**, against the reference's dark `#111827` icon. They also scale with
  the user's system font (the **T-050** class); an `Ionicons` at `size={24}` does not.
  ✅ **Neither app has a `BackButton` component** (checked both `components/` trees) — so this is
  "extract one, then 14 call sites", the same shape as T-036's `AppModal`.
  🛑 **Item ⑫ needs the owner to point at a screen** — *"remove icons where titles and back buttons
  close"* has no unambiguous referent in the code; several headers place an icon beside the title.
  **Ask for one screenshot before touching it.** ❌ No API change, no migration, no deploy.
  **ITEM ⑪ DONE 2026-08-12 — code-complete. ITEM ⑫ STILL BLOCKED (needs a screenshot).**
  New shared **`components/BackButton.tsx`**, byte-identical in both apps (the T-036 convention),
  built to the owner's named reference — the passenger search screen's 40×40 white rounded tile with
  a soft shadow and a dark `arrow-back` glyph. **9 of the 14 wrong sites converted; 17 call sites now
  use it.**
  ✅ **This was not only cosmetic:** the text `←` **scales with the user's system font size** (the
  T-050 overflow class) while `Ionicons size={24}` does not, several copies rendered **green
  `#10B981`** against the reference's dark `#111827`, and tap targets ranged from `padding: 8` to a
  40×40 box. The component adds `hitSlop` and an `accessibilityLabel`, which none of the 14 had.
  🔴 **FIVE SITES WERE DELIBERATELY NOT CONVERTED, and this is a scope decision to confirm.** The
  five driver-registration screens do **not** render a bare arrow — they render **`← Orqaga`**, a
  *labelled* button that is also `disabled` while a save is in flight. Converting them would silently
  **delete a visible text label** and change a mid-form control, which is more than "make the back
  buttons identical". `BackButton` now supports `disabled` so they *can* be converted the moment the
  owner says the label should go. **Say the word and it is a 5-line change.**
  🟡 **A T-057-class defect found while looking, NOT fixed here:** three of those five hard-code the
  Uzbek **`Orqaga`** (`DriverPassport`, `DriverPersonalInfo`, `DriverTaxiLicense` uses a key,
  `DriverLicense` uses `t('common.back')`) — so a Russian or English driver reads Uzbek on those
  registration screens. Logged rather than absorbed.
  ⚠️ **`OfferWizardScreen`'s button calls `handleBack`, not `goBack`** — it steps the wizard back and
  only leaves from step 1. Preserved exactly; a blind swap would have broken the wizard.
  `tsc` user **9** · driver **35**, both at baseline, zero errors in any touched file.
  🛑 **Only the owner's rebuild of BOTH apps and the commit remain.** ⚠️ **A visual card.**

- [ ] T-072 (P2) 🎨 **[OWNER ⑬] The "mark all as read" button squeezes the notifications title — in
  both apps.** Owner 2026-08-12: *"in notification page 'Barcha habarlarni oqilgan deb belgilash'
  button makes page ugly because do not fit horizontally with other words"*.
  **Grounded 2026-08-12 — same header, same styles, both apps.**
  🔴 A `flexDirection: 'row'` header holds a **`flex: 1`, 24px, weight-800** title beside a button
  whose label is a whole sentence: uz **"Barchasini o'qilgan deb belgilash"** (33 chars), ru
  **"Отметить все как прочитанные"** (28). At 13px plus 32px of horizontal padding the button claims
  ~230px, so on a 360dp screen the title is left ~100px and wraps.
  Driver `NotificationsScreen.tsx:248-258` + styles `:332-361`; user `NotificationsScreen.tsx:253`
  — the same block, and the same three translation keys in each app.
  ⚠️ **Two honest options, and it is a design call:** shrink the button to an **icon** (checkmark)
  with the sentence moved to the confirm dialog that already exists
  (`notifications.markAllReadConfirm`), or move it to **its own row** under the header. **Ask which.**
  ⚠️ The button already only renders when `unreadCount > 0`, so an empty list is not affected.
  ❌ No API change, no migration, no deploy.
  **DONE 2026-08-12 — code-complete. Owner chose the ICON option.** A 40×40 `checkmark-done` button
  replaces the ~230px sentence, in **both** apps.
  ✅ **The sentence is not lost, and this was verified rather than assumed:** `handleMarkAllAsRead`
  already opens a confirm dialog whose **title is `notifications.markAllRead`** — the exact words —
  so they appear the moment the icon is tapped. ❌ **No translation keys were touched or orphaned;
  all four `notifications.markAll*` keys are still used.**
  ⚠️ `accessibilityLabel` carries the sentence for screen readers, so replacing text with an icon
  does not make the action unreachable.
  ⚠️ `headerSpacer` was narrowed 60 → 40 to match, so the title sits in the same place whether or
  not there are unread notifications. The orphaned `markAllText` style was removed from both apps.
  ⚠️ **The user app's header is the more crowded of the two** — it also carries `MenuButton`.
  `tsc` user **9** · driver **35**, both at baseline; the driver file's 9 errors **proven
  pre-existing via `git stash`** (`showToast` call-signature, untouched lines).
  🛑 **Only the owner's rebuild of BOTH apps and the commit remain.**

- [ ] T-073 (P2) 🔴 **[OWNER ④] The driver's passenger-offer search shows English inside the Uzbek
  app.** Owner 2026-08-12: *"driver search passenger offer translation have lacks like now in uzbek
  shows english texts"*. **PARTIALLY GROUNDED 2026-08-12 — NOT yet measured.**
  ⚠️ **The screen's keys were listed but the three locales were NOT evaluated** (the probe was not
  run). **Do not start this card by reading translation files — that is exactly how T-058 passed an
  app as clean that was not.** Step 1 must *evaluate* the shipped objects.
  ✅ **~56 `t()` keys** were collected from `SearchPassengerOffersScreen.tsx`, in the
  `searchPassengerOffers.*`, `common.*`, `offerWizard.select{Country,Province,City}` and
  `passengerOfferExtras.priceNegotiable` namespaces. ⚠️ `offerWizard.select*` is the exact trio that
  **had never existed** and was found missing once already (journal 2026-08-08) — check it first.
  🔴 **Two known traps in this app's translation files:** **T-035** — driver `ru`/`en` declare
  `errors:` **twice**, so the second block silently overrides the first and five keys resolve in
  Uzbek only; and the **`t('…')` regex must be word-anchored** or it matches the tail of
  `getLabelStyle('first_name')` and invents dozens of phantom misses (T-061).
  ⚠️ The owner reports *English* text, not raw keys — so the suspects are hard-coded English
  literals and `t(key) || 'English fallback'` patterns, **not only missing keys**. Sweep for both.
  ❌ No API change, no migration, no deploy.
  🛑 **MEASURED 2026-08-12 — AND THE SCREEN CAME BACK CLEAN. NO CODE CHANGED.**
  **66 keys evaluated** against the shipped translation objects (not grepped), in **all three
  locales**: **0 unresolved**, **0 hard-coded `|| 'fallback'`** patterns, **0 English string
  literals** in the screen or in `PassengerOfferExtras`.
  🔴 **The first pass measured only 39 of those 66 and would have reported "clean" wrongly.**
  `PassengerOfferExtras` builds every key dynamically — ``tx(k) => t(`passengerOfferExtras.${k}`)``
  — which a static `t('literal')` regex cannot see. **This is T-058's blind spot in a new shape: a
  sweep only ever measures the call forms it knows about.** The second pass extracts `tx('…')` and
  prefixes it; all **27** resolve, the namespace holds **28 keys in each locale**, **zero drift**.
  🔴 **And the reported mechanism cannot happen here:** `useTranslation` returns **the key itself**
  on a miss (`hooks/useTranslation.ts:22-23`), never an English fallback. So a missing key surfaces
  as `searchPassengerOffers.foo`, **not** as English text.
  ⚠️ **Therefore the English the owner saw comes from somewhere this card did not look**, and the
  likely candidates are **server data rendered verbatim** — `from_text`/`to_text` (built from
  admin-uploaded geo names), `note`, `currency` — or a *different* screen than the one named.
  🛑 **BLOCKED: needs a screenshot of the exact English text.** Do **not** start editing translation
  files on this card — the measurement says there is nothing there to fix, and guessing would mean
  changing correct code. ⚠️ **T-035 was confirmed present** while measuring (duplicate `errors:`
  block in driver ru/en, so five keys resolve in Uzbek only) — that is a real defect, already
  boarded, and is the best standing candidate if the English text turns out to be an error message.

- [ ] T-074 (P3) 🟡 **[OWNER ①] The driver's "sent requests" filter chips do not slide.** Owner
  2026-08-12: *"driver send reqests tab slide not works"*.
  🛑 **NOT GROUNDED — no structural cause found, and this card should not be started on a guess.**
  `MyJoinRequestsScreen:271-291` is a `<View>` wrapping a horizontal `ScrollView` with
  `showsHorizontalScrollIndicator={false}` and five chips — **structurally identical** to
  `components/offers/StatusFilterTabs.tsx:32-87`, which serves the driver's own *My offers* screen
  and is not reported as broken. The only difference found is `gap: 8` in this one's
  `contentContainerStyle` (the other uses `marginHorizontal: 6` on the chip).
  ⚠️ **The five Uzbek labels do overflow** (~556px of chips on a ~360dp screen), so sliding is
  genuinely required here and merely *unnecessary* on the 4-chip screen — which is consistent with
  only this screen being reported.
  ⚠️ **"Slide" may not mean the chip strip at all** — it may mean swiping left/right between the
  filtered lists, which **is not implemented anywhere** (the chips are tap-only; there is no pager in
  either app). **Those are two different cards.** 🛑 **Ask the owner which, and get a screen
  recording** — this project has burned two sessions on T-047 by diagnosing a device symptom from the
  source instead of from evidence.

- [ ] T-035 (P2) **Duplicate `errors:` block in 5 of 6 app translation files.** Found 2026-08-08
  during T-033. Both apps declare `errors: { ... }` **twice** in the same object literal, so the
  **second silently overrides the first** — user `uz`/`ru`/`en` (lines ~21 and ~223) and driver
  `ru`/`en` (~40 and ~250). ⚠️ **Driver `uz` has only ONE block**, so the effective key set differs
  *between languages in the same app*: `errors.loadFailed` / `saveFailed` / `deleteFailed` /
  `updateFailed` / `createFailed` resolve in driver Uzbek and are **missing in driver ru/en**, where
  `t()` logs a warning and renders the raw key. Fix = merge each pair into one block and keep the
  union, then re-run the T-033 i18n check script. T-033 worked around it by writing its new key into
  **every** block.
- [ ] T-032 (P2) **`npm run lint` cannot run in either RN app.** Both have eslint **9** but **no
  `eslint.config.js` and no `.eslintrc`** — the documented command in `CLAUDE.md` fails instantly,
  so nothing has been linted in the apps for as long as that has been true. The API's *does* run:
  **26,273 problems, almost all `␍` prettier/CRLF noise** on Windows, which drowns the ~300 real
  findings (`no-explicit-any`, unused imports). Needs a flat config per app + a line-ending
  decision (`.gitattributes` / `endOfLine: 'auto'`). Found 2026-08-02 during `/end-day`.
- [ ] T-029 (P3) `PassengerOffer` has `from_settlement_id` / `to_settlement_id` but **no
  neighborhood (mahalla) id columns**, so the mahalla T-027 added to the trip location picker is
  stored as **text only** inside `from_text` / `to_text` — selectable and visible, but not
  filterable. Needs two nullable columns + a migration if mahalla-level matching is ever wanted.
  Also worth deciding then: `CreatePassengerOfferScreen:239` picks the geo point as
  `settlement ?? cityDistrict`, ignoring the mahalla, which may have finer coordinates.
  Found 2026-08-02 during T-027 step 4.
- [ ] T-028 (P3) User app: `MainStackParamList` (`navigation/types.ts:17-21`) lists only **3 of the
  navigator's 9 routes**, so screens navigate through `(navigation as any)` and lose all route/param
  checking — `navigate('Typo')` compiles fine. Bring the type in line with `MainNavigator` and drop
  the casts. Found 2026-08-02 during T-027 step 3; the convention was matched rather than fixed so
  the card stayed tight.
- [x] ~~T-021 (P2) Driver app: the passenger-offer detail screen does not exist.~~
  **ABSORBED into T-037 on 2026-08-08** — it is step 3 there. Do not start it separately.
- [ ] T-004 (P2) Consolidate the ~48 scattered `.md` fix-notes into `docs/` + delete
  the stale `api,admin,db/tmp/` duplicates (Phase 2 of the doc cleanup)
- [ ] T-005 (P2) Booking / seat-reservation system hardening (payment hooks)
- [ ] T-006 (P3) Payments integration (cash / card)
- [ ] T-007 (P3) Ratings after trip (driver ↔ passenger)
- [ ] T-008 (P3) Map + geocoding for offer route selection
- [ ] T-009 (P3) Real-time updates (WebSocket) for offer/booking status
- [ ] T-010 (P3) Add a real test suite (none exists today)

## ✅ Done (newest on top)

> ⚠️ **2026-08-11: the nine cards below are CODE-COMPLETE but NOT device-tested.** The owner batched
> testing deliberately. They stay listed here so the board is honest about what is built; if a device
> test **fails**, move that card back to *Now*.
> 🛑 **T-034 · T-043 · T-045 share ONE API deploy** (no migration in any). Everything else is
> app-side and needs **both apps rebuilt**.

- [x] T-045 **Ride notifications are recorded, and the list navigates** — 2026-08-11.
  `createNotification` had **one caller in the entire API**; now all **13** ride events persist, via
  the **6** notify functions they share. Written **before the push and outside its try/catch**, so a
  stale token cannot swallow the record; `recordPush` never throws. 🔒 `otp` never persisted.
  Both apps' lists now navigate via the T-044 mapper. **54/54, 44 red.** → `docs/PLAN.md`
- [x] T-043 **The two `/public/passenger-offers` endpoints agree at last** — 2026-08-11.
  One shared `toPublicOffer()` mapper instead of a hand-built list shape and a raw model on detail.
  **This is the root cause T-042 only worked around.** `getOfferById` deliberately untouched.
  `tsc` 282 → **281**. **25/25, 18 red.**
- [x] T-034 🔒 **Two OTP security holes closed** — 2026-08-11. Codes, the Eskiz bearer token, user
  rows and push tokens out of the logs; phones masked. **The brute-force cap fires for the first
  time** — the old lookup by `{target, code}` meant a wrong guess was never even counted.
  ⚠️ Tightening the read forced a matching change to the write (one live code per phone), or a
  resend would have silently rejected the first SMS. **30/30, 15 red.**
- [x] T-024 **The passenger can answer the drivers who offered** — 2026-08-11, committed `e411ec4`.
  Closes the last hole in the loop **and T-044's deliberate compromise**. Accept is irreversible and
  rejects everyone else, so the dialog names the count. **136/136, 104 red.** → `docs/PLAN-T024.md`
- [x] T-053 **`register()`/`RegisterData` removed from both AuthContexts** — 2026-08-11.
  Dead by the same three tests as `login()`. `tsc` user 10 → **9**.  **46/46, 19 red.**
- [x] T-052 **`LoginScreen` deleted from both apps** — 2026-08-11. Unreachable (its only link was
  commented out), pointing at an endpoint the mounted router does not define, collecting
  email+password for a phone-OTP product. `tsc` user 11 → **10**. **31/31, 17 red.**
- [x] T-051 **Passenger orders: no more full-page reload on tab swipe, and newest-first** —
  2026-08-11. Two independent defects; the "refresh" was the whole screen unmounting behind a
  spinner. Also fixed two latent wrong header counts. **20/20, 10 red.**
- [x] T-050 **The "UbexGo" wordmark no longer wraps mid-word** — 2026-08-11. Cause was arithmetic,
  not the font scale: 36px + `letterSpacing: 2` never fit a 140px circle. Fixed at **all 10 sites**.
  **34/34, 12 red.**
- [x] T-049 **Driver search card + geo pickers no longer render English** — 2026-08-11. The reported
  string was **one of nine**; the other 8 only fire on an error, which is why the screen looked done.
  **21/21** i18n keys evaluated.

- [x] T-044 **A tapped push opens the exact screen, in both apps** — **device-confirmed by the owner
  2026-08-11** (*"push opens exactly page thats solved"*), committed `55718f6`.
  ✅ **The tap plumbing was never the problem** — handler, cold-start parking and flush-on-ready were
  already complete in both apps. **The bug was one function: the destination table.**
  🔴 **The driver app was one stale comment away from working:** four types fell through to the
  generic list under *"there is no screen for these yet (T-023/T-024)"* — but **T-037 had built and
  registered `MyJoinRequests`**. Second time in one week a stale comment was the proximate cause of a
  defect (T-042's crash was the other). **Comments assert facts about other files and nothing checks
  them.**
  🔴 **The trap that justified planning first: `offer_id` means TWO different entities.** For the
  passenger's booking pushes it is a **DriverOffer** (safe for `OfferDetails`); for
  `driver_join_request`/`driver_request_cancelled` it is the passenger's **own PassengerOffer**, so
  routing it to `OfferDetails` would have fetched a wrong row or 404 **and presented it as the user's
  own trip**. Those two deliberately stay on `MyPassengerOffers` until **T-024** builds the real
  screen.
  ⚠️ **Two things bigger than the plan assumed:** **both `navigate()` call sites** passed only
  `target.screen`, so params would have been dropped on the parked cold-start path — the tap-while-
  dead case that matters most — even with a perfect mapper; and the user module's header comment
  asserted *"every destination is a param-less route"*, falsified by the change and corrected on the
  spot.
  **72/72** runtime matrix over **both apps' real transpiled modules**, with every destination
  asserted against route names **parsed from each app's real `MainNavigator` source** (a renamed
  route fails instead of passing silently). **Proven able to fail: 11 red against pre-change code.**
  Split out rather than absorbed: **T-045** (in-app list) and **T-024**. Plan: `docs/PLAN.md`.
- [x] T-042 **The driver app crashed to the phone's home screen on a passenger order's details** —
  **device-confirmed 2026-08-11**, committed `55718f6` (together with T-044).
  **Cause: one line, `offer.passenger.name`.** Two endpoints under the **same**
  `/public/passenger-offers` prefix return **different shapes** — the browse list is hand-mapped to
  `passenger: {id, name}`, the detail returns the **raw Sequelize model** aliased **`as: 'user'`**.
  `passenger` was `undefined` and `.name` threw **during render**, where RN has no error boundary —
  hence a hard process death rather than an error screen.
  🔴 **T-037 had already found and fixed this exact bug two days earlier and a screen was missed.**
  The helper (`passengerNameOf`) was applied to the one screen observed failing, not to the class.
  **A fix applied to the observed instance instead of the class is a half-fix.**
  🔴 **A comment caused the bug** — the type asserted both public endpoints built the mapped shape.
  Fix made structural: `passenger` is now **optional**, so a bare `.passenger.name` no longer
  compiles. Also fixed the same latent read in `SearchPassengerOffersScreen`.
  Plus two more in the same pass: the search results **merged into the route picker** (two sibling
  scroll surfaces, a `maxHeight: 270` `ScrollView` that could never scroll away → picker became the
  list's `ListHeaderComponent`, one surface), and **re-entering an offer re-offered the join button**
  (a local `joinSent` boolean reset on every mount → now reads the real status from
  `GET /driver/join-requests`; the server was never at risk).
  ⚠️ Root cause deliberately **not** fixed at the API — logged as **T-043**.
- [x] T-041 **Only a rejected refresh ends the session; the auth rate limits are split and keyed by
  user** — **device-confirmed by the owner 2026-08-10**, committed `0ccde30`.
  Two independent defects, and the card needed both. **The apps over-reacted:**
  `performTokenRefresh` treated **any** non-`ok` as "session over" — a 429, a 5xx, even a **200 it
  could not parse** — clearing both tokens; now only **401/403** does, and every other outcome is
  survivable like the offline path. **The server made that fire constantly:** `/auth/refresh`,
  `/auth/logout` and **`GET /auth/me` (every app launch)** shared one **20-per-15-min** budget.
  🔴 **Per-IP keying was the deeper bug** and would have outlived the test session — a carrier NAT
  puts thousands of real users behind one IP. New `refreshLimiter` (30/15min) and
  `sessionReadLimiter` (120/15min) key on the **user in the token** (`tokenSubjectKey`), not the IP.
  ✅ **Owner decided 2026-08-10: keep 30 and 120 as they are** — per-user budgets make a real user
  tripping them unlikely, so they will not break in production. **Do not revisit.** If a 429 ever
  turns up in a user report, they are two literals in `rateLimiter.ts`.
  The refresh endpoint's messages are now translated too.
  **98/98** runtime matrix over both apps' real modules, **proven able to fail (32 red against
  pre-fix code)**; **8/8** limiter check proving user B on the same IP is unaffected.
  Plan: `docs/PLAN.md` (closed in place).
- [x] T-038 **Refresh tokens: every user of both apps was silently logged out ~15 min after login** —
  implemented 2026-08-08, **device-confirmed 2026-08-10 as part of T-041**, which repaired the
  remaining hole in the same mechanism. The refresh token was received and **thrown away** (no
  storage key existed) and `refreshAccessToken()` had **zero call sites**; now both apps persist it
  and `getHeaders` swaps a spent access token behind **one in-flight promise** (mandatory —
  `rotateTokens` revokes the old refresh token on use). The API's 401s are translated.
  🔴 Three defects found beyond the diagnosis: a stale caller token would have re-rotated on every
  request; `logout` never revoked anything in **either** app (un-awaited `getHeaders`); and
  `adminAuth`'s catch rewrote every failure as "Invalid or expired token".
  Committed in `c940940` + `0ccde30`. Plan: `docs/PLAN-T038.md`.
- [x] T-036 **All 33 modals in both apps onto one `AppModal` shell** — 2026-08-08.
  **Owner spot-checked on a device and approved the look** ("that's ok"); ⚠️ **the walk of every
  modal is NOT finished** and continues alongside other work — if one fails, re-open this card.
  One `AppModal` + `ModalList` (+ optional multi-select) + `DateWheelModal`, **byte-identical across
  both apps**; adapters `CountryPickerModal` (user), `GeoPickerModal` (driver). Duplication collapsed
  rather than migrated: 3 country pickers → 1, 2 date wheels **and their generators** → 1, 7 driver
  geo pickers → 1. **The whole look lives in the `modal` token object in each app's `themes/index.ts`
  — restyling is 2 files, not 33.**
  ⚠️ **Driver date/time pickers deliberately kept their own bodies** — `DateWheelModal` runs
  1900→today (birth dates) while the driver's generators enforce **future-only**; swapping would have
  dropped the past-date guard silently. Chrome only.
  `tsc` all four exactly at baseline (282 · 0 · 12 · 36); **129/129** i18n checks, which caught **15
  keys that had never existed**, three hidden behind `|| 'hard-coded Uzbek'` fallbacks.
  Committed `34988cc` — ⚠️ that commit also swept in unrelated in-progress work
  (`PassengerOfferService.ts`, `CreatePassengerOfferScreen.tsx`, `TimeWindowCard.tsx`,
  `CHECKLIST.md`, `PLAN-T018.md`) plus `.claude/settings.json`. Plan: `docs/PLAN-T036.md`.
- [x] T-013 (OR-003) Zero-tap OTP SMS auto-read via SMS Retriever (user app + API) —
  **device-verified 2026-07-26.** Real app hash = `asNtyBnPVzB` (not the earlier `JtArsQcEBm9`);
  `ESKIZ_OTP_APP_HASH=asNtyBnPVzB` set in test3. ⚠️ hash changes with a real release keystore.
- [x] Push notifications: per-app FCM tokens + driver app registration fixed — 2026
- [x] Driver offers: backend API + status machine + admin moderation UI — 2026
- [x] Driver app: offers list screen (filters, status badges) — 2026
- [x] Auth: phone OTP (Eskiz) + Google SSO + JWT — 2026
