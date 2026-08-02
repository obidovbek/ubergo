# 📥 OWNER REQUESTS — raw to-do log from the software owner

> The owner reports items one by one (usually in Uzbek). Capture each **verbatim**
> here with a translation, which app it affects, and a status. When a request
> becomes active work, it also gets a `T-###` card on `docs/TODO.md` and a plan
> in `docs/PLAN.md`. **One fact, one home:** this file is the source for the
> owner's exact wording; the board tracks status.
>
> Status: 🆕 new · 📋 planned · 🔨 in progress · ✅ done · ❌ won't do

| ID | Status | App | Request (short) | Board task |
|----|--------|-----|-----------------|-----------|
| OR-001 | 🔨 in progress | driver + user apps | OTP screen loses its place → jumps to main menu after backgrounding | T-011 |
| OR-002 | 🔨 in progress | driver + user + API | Deleted user still gets into the app (cached token trusted) → must return to login | T-012 |
| OR-003 | ✅ done | user app | Auto-read the OTP SMS so the code fills itself | T-013 |
| OR-004 | ✅ done | user app | When picking cities, drop the country from the location text | T-014 |
| OR-005 | ✅ done | user app | Additional-phones field accepts the user's OWN primary number | T-015 |
| OR-006 | 🔨 in progress | user app + API | Half-finished registration → app opens the main menu instead of resuming the registration form | T-016 |
| OR-007 | 🆕 new | user app + API (+driver app views) | Rebuild the intercity order ("zakaz") screen to the Figma design | T-018 |
| OR-008 | 🆕 new | user app | Registration screen → Figma layout; referral/promo block moves to the NEXT screen | T-019 |
| OR-009 | 🆕 new | driver app + API | Vehicle usage: add "faqat shafyorman" option; "O'zimniki" disables "Ijara" | T-020 |
| OR-012 | 🔨 in progress | user app (+ API/admin for payment & waiting fee) | Create-ride-request screen: seat gender/position, keyboard covers the lower fields, waiting fee must be admin-set, payment allow both, "for my friend" is not a payment type, no location icon | T-031 |
| OR-011 | 📋 planned | driver app (+ audit of the photo path) | Licence date limits (issue ≤ today, valid-until ≥ today), photos audit, wire the geo levels the admin panel already holds, offer-note placeholder | T-030 |
| OR-010 | 📋 planned | user app + API (+driver app for the push tap) | Batch of 7 from the software owner: referral block one-of-three + grey placeholder, birth-date keyboard jump, unread-message badge, push tap must open the message, hamburger menu icon, settlement/mahalla cascade | T-027 |

---

## OR-012 — Seven fixes on the passenger's "create ride request" screen

**Reported:** 2026-08-02 · **App:** user app (items 4-6 also API/admin) · **Board:** T-031

**Original (Uzbek, verbatim):**
> UserApp
> user o'rindiqlar joyini siljitish imkoni yoki orindiqni tanlaganda ayol yoki erkakani tnlashi
> mumkin bo'lsin.
> pitak chiqib turamannni pastiga qoshimha malumot kiritaman desa klavyatura chiqqanda pastga
> tushib ketyapdi.
>  qo'shimcha malumotni ham tepaga chiqarib bo'lmayapdi.
> o'zgarmas narx kutish vaqtini kiritishda pastga tuishib ketyapdi  lekin bu kiritilmaydi sistma
> tomonidan kiritiladi. kutish narxi sistema yani admin tomonidan kiritiladi yo'lovchi
> kiritolmaydi. kutish vaqtini sistema hisob oladigan ham olmaydigan ham qilish kerak. hozircha
> hisobga olmaydi shunchaki yo'lovchi punktualniy bo'lishi uchun.
> To'lov turida ikklasini ham tanlash imkoni bo'lish kerak.
> do'stimga degan ptichkani to'lov turiga aloqasi yo'q.
> lokatisiya kiritish belgisi yo'q.

**Translation (7 items):**
> 1. Let the user shift seat positions, or choose male/female when picking a seat.
> 2. Under "I'll come out to the road", typing additional info drops below the keyboard.
> 3. The additional-info field cannot be scrolled up either.
> 4. Fixed price / waiting time also drop down — **but the passenger must not enter the waiting
>    fee at all; the system (admin) sets it.** Waiting time should be switchable between counted
>    and not counted; for now it is **not** counted, it only exists to keep passengers punctual.
> 5. Payment type must allow selecting **both**.
> 6. The "for my friend" tick has nothing to do with payment type.
> 7. There is no location-input icon.

**Grounded in code 2026-08-02:**
- Items 2-4 (the scrolling half): **`CreatePassengerOfferScreen` had no `KeyboardAvoidingView` at
  all** — a bare `ScrollView` at `:349`. One omission, three complaints. **FIXED.**
- Item 7: `LocationCard`'s landmark row had no icon — only a 12px square accent marker. **FIXED.**
- Item 1: seat **gender already exists** (`GenderPickSheet.tsx`, built for T-018). So this is either
  seat *position* shifting (new UI) or the existing picker not behaving. **Needs the owner.**
- Item 4 (the rule): `waitingFeePerMin` is a passenger **text input** in `SpecialOrderPanel:25`.
  Making it admin-set needs somewhere for the admin to set it — no such setting exists.
- Items 5-6: `payment_type` is a **single enum column** (`PassengerOffer.ts:81`) whose values
  include `friend_pays`. Selecting *both* cash and card, and separating "for my friend" from
  payment type, cannot be done without changing that shape — a migration.

**Owner decisions 2026-08-02:** OR-011 item 3 deferred ("decide later"); this batch takes priority.

---

## OR-011 — Four driver-app fixes from the software owner (batch)

**Reported:** 2026-08-02 · **App:** driver app (item 2 also audits the API) · **Board:** T-030

**Original (Uzbek, verbatim):**
> Driverapp
> letsenziya boshqaladan berilgan sanalarda shu kundan shu kungacha degan joylarda bugungu
> chislodan ot'ib ketmasin. berishda gacha amala qilish muddatiga kechagi yoki olndingi chislolarni
> kirita olmaasligi kerak.
> rasmlarni ham ishlaydigan qilish kerak.
> tuman shahar aholi puntkt mammuriyga man begran bazani torting.
> driver appda elon yaratishda kulrangda qoshimcha malumotga bagajim to'la, yo'lda to'xtolmaymiz
> aeroportga ulgirishimiz kerak

**Translation (4 items):**
> 1. On the licence/document "from this date — to this date" fields: an **issue** date must never
>    go past today, and a **valid-until** date must not accept yesterday or any earlier day.
> 2. Make the **photos** work too.
> 3. Pull in the database I gave you for **district / city / settlement / administrative area**.
> 4. In the driver app's offer creation, the **additional-info** field should show grey example
>    text: "bagajim to'la, yo'lda to'xtamaymiz, aeroportga ulgirishimiz kerak".

**Grounded in code 2026-08-02:**
- Item 1: **no `maximumDate` / `minimumDate` anywhere in the driver app.**
  `DriverLicenseScreen` *does* hand-roll a future check for `issue_date` (:343, :651-661, with a
  hard-coded Uzbek message at :661), but `DriverPassportScreen` (`issue_date`, `expiry_date`) and
  `DriverTaxiLicenseScreen` (`license_issue_date`, `license_sheet_valid_from`,
  `license_sheet_valid_until`) have **no such limits at all**.
- Item 2: uploads are base64 data URLs; API body limit is 10 MB, so size is not the issue.
  ⚠️ **Confirmed bug in 4 screens** (`DriverLicenseScreen:535`, `DriverPassportScreen:338`,
  `DriverPersonalInfoScreen:892`, `DriverTaxiLicenseScreen:695`): `const mimeType = asset.type ||
  'image/jpeg'`. In the installed expo-image-picker `asset.type` is
  `'image' | 'video' | 'livePhoto' | 'pairedVideo'` — **not** a MIME type; the real one is
  `asset.mimeType`. So every pick builds `data:image;base64,…`, a malformed data URL, and the
  `'image/jpeg'` fallback is unreachable.
- Item 3: **the data is already reachable** — all six geo levels have Excel upload in the admin
  panel, and the API serves `/city-districts/:id/administrative-areas`, `/settlements` and
  `/neighborhoods`. `driver-app-standalone/api/driver.ts` already defines
  `fetchGeoAdministrativeAreas` (:312) and `fetchGeoSettlements` (:320) — but the `api/geo.ts`
  shim re-exports **only** countries/provinces/city-districts, and no driver screen asks for the
  deeper levels. Same shape as OR-010 item 7 in the user app.
- Item 4: the field exists — `OfferWizardScreen:2498`, `placeholder={t('offerWizard.notePlaceholder')}`.
  Current text is "Masalan: Chekmayman, 1 ta kichik sumka" (uz/ru/en all present). A string change.

**Owner decisions 2026-08-02:** (1) the geo base is loaded **through the admin dashboard**, so
item 3 is a wiring job in the app, not a data import; (2) photo **uploads work** as far as the
owner can tell — item 2 is an **audit**: find whether anything in that path is broken, and report.

---

## OR-010 — Seven fixes from the software owner (batch)

**Reported:** 2026-08-02 · **App:** user app + API (item 5 also driver app) · **Board:** T-027

**Original (Uzbek, verbatim):**
> UserApp
> Bonus olish uchun
> tel raqam
> id raqam kod kiritilishida faqat bittasini kiritish imkoni bo'lsin
> ushbu oinada bonus olish uchun ozini tel raqami turmasligi kerak +998901234567  raqami tursin
> kulrang bo'lib.
>  Tugilgan sanani kirtishda klavyatura ochilsa tepaga chiqib ketib qolyapdi sal pastroqda turish
> kerak .
>  user appda yangi sobsheniya kesa uvedemleniya belgisi chiqadigan qilish kerak menyudan
> ochmaslik uchun. kooonvertimi yoki xatxhanimi iconkasi paydo bolishi kerak
> sistemni uvidemleniya bolib korinnganda bo'ssa srazu osha xatti prilojeniya ochish kerak
> tevadagi uvedemleniyani hozir glavniy menyu ochilib qolyapdi.
> chap tomonga gamburger qilib menyuga iconka qilish kerak
> tuman shaharlarni aholi punti va mahalla tumanga birikmapdi.
>
> agar bu ishlarni  qaysidur qismi driver app ham tegishli bolsa driver app ga ham bir yola qilish
> kerak.

**Translation (7 items):**
> 1. In the "get a bonus" block, only **one** of phone / ID / promo code may be filled in.
> 2. In that block the user's **own** phone number must not be shown — show `+998901234567` in
>    grey as a placeholder instead.
> 3. Entering the birth date: when the keyboard opens the field jumps too far up. It should sit
>    a bit lower.
> 4. When a new message arrives, show a notification badge (envelope / mailbox icon) so the user
>    does not have to open the menu to find out.
> 5. Tapping a system push notification must open **that message**. Right now it opens the main menu.
> 6. Put a hamburger icon on the left to open the menu.
> 7. Settlements (aholi punkti) and mahallas are not linked to the district.
>
> And: wherever any of this also applies to the **driver app**, do it there at the same time.

**Grounded in code 2026-08-02 (see `docs/PLAN.md` "Current state" for line numbers):**
- Items 1–2: `UserDetailsScreen.tsx:663-700`. The phone field currently holds the user's **own**
  number and is `editable={false}`; the backend stores only `promo_code` + `referral_id` and has
  **no referrer-phone column**.
- Item 3: `UserDetailsScreen.tsx:717` — `onFocus={scrollToEnd}` scrolls the form to its very bottom.
- Item 4: the API already returns an `unread` count (`NotificationController.ts:50`) — **no backend
  work needed**.
- Item 5: **no push-tap handler exists in either app** (`onNotificationOpenedApp` /
  `getInitialNotification` appear only in `node_modules`). So this applies to the driver app too.
- Item 6: no menu button anywhere; `MenuScreen` is a plain stack screen in `MainNavigator`.
- Item 7: the API already exposes **both** `/city-districts/:id/settlements` and
  `/city-districts/:id/neighborhoods`; the app's `api/geo.ts` has no neighborhoods function and its
  cascade stops at city/district.

**Owner decisions 2026-08-02:** (1) add a real `referral_phone` column — migration approved;
(2) item 7 means the **trip location picker** (`GeoSelectModal` / `LocationCard`), not the profile
address; (3) keep T-019's Figma re-layout separate — fix the referral block in place.

---

## OR-007 — Intercity order screen must match the Figma design

**Reported:** 2026-07-28 · **App:** user (passenger) + API; driver app shows these offers · **Board:** T-018

**Original (Uzbek):**
> "Zakazni oynasi biz shunaqa bo'lish keregi. Qidiruvga bossa alohida kichikroq oyna chiqib
> borib kelish malumotlarini vaqtlarini kiritishi kerak. Odam qoshishda +ni bossa erkak yoki
> ayolni tanlab qo'shadi. Maxsus buyurtmani bossa yo'lovchi keyin pastidagi menyu chiqadi."
> · "Tumanlarni tanlashda alohida chiqadigan oyna."
> · General: "Ozi hohlagan figmaga yaqinlashtirib o'zgartirish kerak, va mantiqiy ishlashi ham.
> Har hil telefonlarda bir hil muammosiz ishlashi kerak."

**Translation:**
> The order window must look like this [Figma `K_buyurtma001Yangi.png`]. Tapping the search
> [route] field opens a separate, smaller window to enter the trip locations and times
> [`004Shaharlar aro K3 Tanlov oynasi.png`] — district selection happens in that popup.
> When adding a passenger, tapping **+** picks male or female. Tapping **Maxsus buyurtma**
> reveals the paid special-order panel below (per-seat prices, fixed price, waiting fee).
> Get as close to the Figma as possible, make it work logically, identically on all phones.

**Design refs:** `figma_images/K_buyurtma001Yangi.png` (+ `K_buyurtma001.png`, `-1`),
`figma_images/004Shaharlar aro K3 Tanlov oynasi.png`, Figma project `Ubex102025`.

**Known gap (checked 2026-07-28):** the `passenger_offers` table/model only stores
from/to + `start_at` + `seats_needed` + `max_price_per_seat` + 3 booleans + note. The Figma adds
urgency, departure/arrival time windows, payment type, gendered seat counts by position, salon
options, vehicle class, several new flags, landmark texts and the whole special-order block —
**needs a schema extension + API + user-app UI + driver-app offer views.** Biggest of the three.

## OR-008 — Registration screen → Figma layout; referral block to the next screen

**Reported:** 2026-07-28 · **App:** user (passenger) · **Board:** T-019

**Original (Uzbek):**
> "Registratsiyani imkon bo'lsa shu ko'rinishga qilish kerak. Promo kodni keyingi oynaga olish
> kerak." · [on the Tel/ID/PROMO block] "Shuni keyingi oynaga olish kerak."

**Translation:**
> If possible, make registration look like this [`K_Reg001.png`]. The promo code — and the whole
> referral block (Tel / ID / PROMO) — must move to the **next** screen.

**Design refs:** `figma_images/K_Reg001.png` (+ `-1`, `K_Reg002*`, `K_Reg003*`,
`K_RegShablon*`).

**Note (checked 2026-07-28):** `users.promo_code` / `users.referral_id` already exist and
`PUT /users/profile` accepts them — this is app-side only (split `UserDetailsScreen` into two
steps, keep the T-016 draft persistence working across both).

## OR-009 — Vehicle usage: "faqat shafyorman" option; "O'zimniki" disables "Ijara"

**Reported:** 2026-07-28 · **App:** driver + API · **Board:** T-020

**Original (Uzbek):**
> "O'zimniki deb tanlasa ijara o'chib qolish kerak." · "O'zgargan joyi bor — faqat shafyorman
> degani qo'shilgan."

**Translation:**
> If the driver selects "O'zimniki" (my own car), the "Ijara" (rented) usage option must become
> disabled. The Figma's change: a new usage option **"Firmaga/Shaxsga ishlayman — faqat
> shafyorman"** (I work for a firm/person, I'm only the driver) was added.

**Design refs:** `figma_images/D_Vehicle.png`. Current UI:
`DriverPersonalInfoScreen.tsx` (ownership `own | other_person | company`, usage
`rent | free_use`).

**Note (checked 2026-07-28):** `enum_driver_profiles_vehicle_usage_type` is a Postgres enum
(`rent`,`free_use`) — the new option **needs a DB enum migration** + model/service/app updates.
Interpretation to confirm: "ijara o'chib qolish" read as *disable* Ijara when the car is your own
(you can't rent your own car); if "O'zimniki" + an already-selected "Ijara", the selection resets.

---

## OR-006 — Half-finished registration jumps to the main menu

**Reported:** 2026-07-27 · **App:** user (passenger) · **Board:** T-016

**Original (Uzbek):**
> "chala registratsiya qilsa registratsiya joyidan boshlab ketmasakan. GLavniy menyuga
> borib qolarkan yolovchi (mobileAppda)"

**Translation:**
> If someone registers only halfway, it should carry on from the registration point.
> [Instead] it ends up going to the main menu — passenger (in the mobile app).

**Root cause (found in code, 2026-07-27 — not yet device-confirmed):**
The OTP verify response *does* carry `profile_complete` (`AuthController.v2.ts:262`), so right
after verifying the code the app correctly shows `UserDetailsScreen`. But **`GET /auth/me` does
not return `profile_complete` at all** — its `attributes` list and JSON body omit it
(`AuthController.v2.ts:536-558`). On the next cold start `AuthProvider.initializeAuth()` calls
`/auth/me` and **overwrites the cached user with that reply**
(`contexts/AuthContext.tsx:101`), so the flag becomes `undefined`. `RootNavigator` then does
`profile_complete !== false` (`navigation/RootNavigator.tsx:43`) → `undefined !== false` → **true**
→ `MainNavigator` = the main menu. The half-registered passenger is dropped into the app with no
profile instead of back on the registration form.

Two independent defects, both need fixing:
1. **API:** `/auth/me` drops `profile_complete` (and the profile fields) from its response.
2. **App:** the "unknown ⇒ complete" default plus a destructive cache overwrite turn a missing
   field into a wrong route.

**Fix (2026-07-27):** `/auth/me` now returns `profile_complete` + the profile fields;
`AuthContext` **merges** the server user over the cached one instead of replacing it;
`RootNavigator` decides from data that is present; `UserDetailsScreen` trusts the server's
`profile_complete` instead of forcing `true`; and a new `utils/registrationDraft.ts` keeps the
typed fields so the resumed form is pre-filled (owner confirmed both readings were meant).
Also cleaned up `UserController.updateProfile`, which computed `profile_complete` from fields the
form treats as optional. tsc at baseline in both projects.
⏳ **Needs the API deployed to test3, then an owner device test** — nothing has run on a device.

## OR-005 — Additional phone accepts the user's own primary number

**Reported:** 2026-07-23 · **App:** user · **Board:** T-015

**Original (Uzbek):**
> "registratsiya paytida pastdagi qoshimcha raqamda yana ozinikii kiritsa qabul qilyapdi"

**Translation:**
> During registration, in the additional-number field at the bottom, if you enter your
> own [primary] number again, it accepts it.

**Root cause (found in code):** `addPhoneNumber()` only checked
`!additionalPhones.includes(fullPhone)` — a duplicate check *among the additional numbers*.
It never compared against the primary `phoneNumber`, so the main number could be re-added.
The duplicate case also failed **silently** (no toast).

**Fix (2026-07-23):** in both `UserDetailsScreen.tsx` (registration) and
`EditProfileScreen.tsx` (edit profile), `addPhoneNumber()` now (a) rejects the primary
number (digits-only compare, warns via new `userDetails.errorPhoneOwnNumber`) and
(b) rejects a duplicate additional number with feedback (`userDetails.errorPhoneDuplicate`).
New keys added to uz/en/ru. tsc unchanged (12 pre-existing errors, none new). ⏳ awaiting device test.

---

## OR-004 — Remove the country when selecting cities

**Reported:** 2026-07-23 · **App:** user · **Board:** T-014

**Original (Uzbek):**
> "Shaharlarni tanlashda mamlakatni olib tashlash kerak"

**Translation:**
> When selecting cities, the country must be removed.

**Context:** On "Safar so'rov yaratish" the chosen route showed
`Farg'ona shahri, Farg'ona viloyati, O'zbekiston`. Every ride is inside Uzbekistan,
so the country is noise.

**Fix (2026-07-23):** `buildLocationText()` in
`user-app-standalone/screens/CreatePassengerOfferScreen.tsx` no longer appends the
country — the label + saved text are now `city, province` (both from/to sides).
The country selector step is unchanged. tsc unaffected. ⏳ awaiting owner device test.

---

## OR-001 — OTP screen resets to main menu after app is backgrounded

**Reported:** 2026-07-21 · **App:** driver + user (both) · **Board:** T-011

**Original (Uzbek):**
> "sms ni kiritgandan keyin dasturga boshqa dasturga o'tib qaytsa yoki pastga
> yig'ilib qolsa glavniy menyuga chiqib qolyapdi buni orniga oldingi joyida
> davom etishi kerak"

**Translation:**
> After entering the SMS code, if you switch to another app and come back — or the
> app gets minimized — it jumps back to the main menu. Instead it should resume
> where it left off (the OTP screen).

**Root cause (found in code):**
On low-RAM Android phones (Xiaomi/Samsung battery optimizers) the OS **kills the app
process** while it's in the background. On relaunch, `AuthProvider.initializeAuth()`
finds no token (OTP not verified yet) → `RootNavigator` renders `AuthNavigator`, which
starts at its `initialRouteName="PhoneRegistration"` (= the "main menu"). There is **no
navigation-state persistence**, so the fact that the user was on `OTPVerification`
(and the phone number) is lost.
- `driver-app-standalone/navigation/RootNavigator.tsx` + `AuthNavigator.tsx`
- `user-app-standalone/navigation/RootNavigator.tsx` + `AuthNavigator.tsx`

Secondary: `RootNavigator` returns `<SplashScreen/>` (fully unmounting
`<NavigationContainer>`) whenever `isLoading || checkingProfile` — so any such toggle
also resets the stack.

**Fix (implemented 2026-07-21, both apps — awaiting device test):** New `utils/pendingOtp.ts`
persists `{ phone, userId?, at }` while on the OTP screen (30-min TTL). `AuthNavigator` reads
it at startup and starts on `OTPVerification` with the phone prefilled when present. Cleared
on successful verify, on logout, on "out of attempts", and when the user edits the phone.
Files: `navigation/AuthNavigator.tsx`, `screens/OTPVerificationScreen.tsx`,
`contexts/AuthContext.tsx`, `utils/pendingOtp.ts` (× both apps). See `docs/PLAN.md` (T-011).
Owner still needs to confirm on a real device (kill app on OTP → reopen → resumes OTP).

---

## OR-002 — Deleted user still gets into the app (must return to login)

**Reported:** 2026-07-21 · **App:** driver + user + API · **Board:** T-012

**Original (Uzbek):**
> "admin tizimdan yolovchi yoki haydovchini ochirib yuborgandan keyin yana sms
> soraydigan oknaga qaytadigan qilish kerek hozir passenger/diver app localstorage
> saqlayotgani uchun bu bor deb hali yam ochyapti shekilli bu tezlik uchun yaxshi
> ammo havsizlik uchun yomon adashmayotgan bolsam"

**Translation:**
> After the admin deletes a passenger or driver from the system, the app should
> return to the SMS (login) screen. Right now, because the passenger/driver app
> stores auth in local storage, it still opens as if the account exists. Good for
> speed but bad for security, if I'm not mistaken.

**Root cause (found in code):**
Admin delete is a **hard delete** (`user.destroy()` in `AdminPassengerService.delete` /
`AdminDriverService.delete`). `GET /auth/me` already returns **401** for a deleted user
(`AuthService.getCurrentUser` throws `UnauthorizedError`). But:
1. The app's `api/auth.ts getCurrentUser` throws a **plain Error without the HTTP status**,
   so callers can't tell "deleted (401)" from "offline".
2. `AuthContext.initializeAuth` (both apps) **catches any error and logs in with the
   cached user** → deleted users keep getting in.
3. Bigger hole: `middleware/auth.ts authenticate` only verifies the JWT signature — **no
   DB check** — so a deleted user's token still works on **every other endpoint** until
   it expires.

**Proposed fix (two layers) — see `docs/PLAN.md` (T-012):**
- **App:** surface the HTTP status from `getCurrentUser`; on 401/"user not found" during
  init/foreground, **log out → login/OTP screen** (keep cached user only for network errors).
- **API (real security fix):** `authenticate` loads the user from DB and rejects (401) if the
  user no longer exists, so deletion takes effect immediately everywhere.
- Note: **blocked / pending_delete** users keep the current BlockedScreen behavior (not sent
  to login) — only truly **deleted** users go to the login screen.

**Fix (implemented 2026-07-21, App + API — awaiting device test):**
- API `middleware/auth.ts`: after verifying the JWT, loads the user by id; if missing → 401
  (DB errors pass through as 500, so an outage won't false-logout). Deletion now takes effect
  on every endpoint.
- App `api/auth.ts getCurrentUser` (both): attaches the HTTP status to the error.
- App `contexts/AuthContext.tsx` (both): on 401/403/404 during init → clears the cache and drops
  to the login/OTP screen (keeps the cache only on network errors); driver also handles it on
  foreground. Owner still needs to confirm on device (log in → delete in admin → reopen → login).

---

## OR-003 — Auto-read the OTP SMS (code fills itself)

**Reported:** 2026-07-21 · **App:** user app (+ API/Eskiz if full) · **Board:** T-013

**Original (Uzbek):**
> "Bu yerda smsni òzi oqidigan qikish kerak pasida qanaqadir aji buji xarfli kod
> kesa òzi oqiyverarkanu shunaqa"

**Translation:**
> Here we should make it auto-read the SMS. If the code comes with some kind of
> gibberish lettered string at the end, [Android] reads it by itself — like that.

**Findings (from code):**
- The OTP SMS text is **hardcoded** in `OtpService.sendSms`:
  `Код верификации для входа к мобильному приложению UbexGo: ${code}` (from `4546`, via Eskiz).
  This exactly matches the **approved Eskiz template** (screenshot) — changing it needs a NEW
  approved template.
- Applies to the **user app** (it receives the SMS). The **driver app** gets its code via a
  **push to the user app**, so SMS auto-read doesn't apply to the driver app the same way.
- The "gibberish lettered code" the owner means = the **11-char app hash** that Android's
  **SMS Retriever API** requires at the end of the SMS to auto-deliver it to the app.

**Two options (owner to choose) — see `docs/PLAN.md` (T-013):**
- **A — one-tap autofill (lightweight):** add `autoComplete="sms-otp"` (Android) +
  `textContentType="oneTimeCode"` (iOS) to the user-app OTP input, and accept the full code
  when the OS dumps it in. No Eskiz change, no native module. Usually one tap, not guaranteed
  zero-tap.
- **B — full auto-read (SMS Retriever, zero taps):** native module in the user app + append the
  app hash to the SMS. Requires: backend appends the hash (env), a **new Eskiz template approved**
  with the hash, and the hash must match the release signing key. Bigger job + external dependency.
- Recommendation: ship **A** now; do **B** if the owner wants fully automatic (owner handles the
  Eskiz template re-approval; hash provided after the module is added).

**Decision (2026-07-21):** Owner chose **Option A** (one-tap autofill now). B deferred.

**Option A (implemented 2026-07-21):** `user-app-standalone/screens/OTPVerificationScreen.tsx` —
added `textContentType="oneTimeCode"` + `importantForAutofill="yes"` to the OTP inputs,
`autoComplete="sms-otp"` + `maxLength={4}` on the first box, and `handleOtpChange` spreads a
multi-digit autofill dump across the 4 boxes and auto-submits. tsc clean. **Keep this — it helps
iOS.**

**Device test result (2026-07-21, Samsung S24 / SM_S928U1): Android did NOT auto-fill.** Expected —
`autoComplete="sms-otp"` is reliable on iOS but not on Android (needs Gboard + Google autofill;
Samsung Keyboard won't). There is **no pure-JS Android auto-read**; Android needs a native Google
API. Next-step options (both need a native dependency + rebuild):
- **A.5 — SMS User Consent API:** one-tap "allow read" dialog → auto-fills. **No Eskiz change,
  no hash.** Reliable on Android. ← recommended.
- **B — SMS Retriever API:** zero-tap, but needs the 11-char app hash → a NEW approved Eskiz
  template.

**Decision (2026-07-21, final):** Owner chose **B — SMS Retriever (hash)** — zero-tap, no read
dialog, no SMS permission (the seamless, standard approach). Not yet implemented. Plan of record
in `docs/PLAN.md` (T-013):
- **Claude:** add the SMS Retriever native module to the user app (verify RN 0.81 New-Arch compat
  first), wire the listener in `OTPVerificationScreen`, print the app hash (debug + release), and
  append the hash to the OTP SMS behind a new `ESKIZ_OTP_APP_HASH` env in `OtpService.sendSms`.
- **Owner:** register + get approved a new Eskiz template that includes the hash line; set the env.
- ⚠️ Watch the **140-byte SMS limit** (current Cyrillic text is byte-heavy) and that the **release**
  hash is what production SMS must contain. Keep the shipped Option A props (they help iOS).

### Option B implemented — 2026-07-22 (commit `d963cfb`, pushed to `origin/main`)

**All the code is written and on `main`. Nothing has been tested on a phone yet.**

- User app: `react-native-otp-verify@1.2.0` + new `utils/smsRetriever.ts`; the OTP screen listens
  for the SMS, extracts the 4 digits and submits with zero taps. iOS Option A props kept.
- API: `OtpService.buildOtpMessage()` appends the hash **only when `ESKIZ_OTP_APP_HASH` is set**.

⚠️ **CORRECTION (2026-07-22, after the owner's first Eskiz submission).** I first said the wording
could stay, based on the 140-**byte** retriever cap (117 ≤ 140 ✅). That measured the wrong limit.
Cyrillic SMS is **UCS-2 → 70 CHARACTERS per segment**; the old text (62) + `\n` + an 11-char hash
= **74 chars → 2 SMS**, exactly as Eskiz reported («74 символов, всего SMS - 2 шт»). A split SMS
costs double **and SMS Retriever won't fire on it**. → **The Russian text must be SHORTENED**
(staying in Cyrillic is fine): `Код верификации UbexGo: 0000` + hash line = **40 chars → 1 SMS**.
Backend updated to send exactly that when the hash is set (commit below).

**Also caught in that first submission:** the hash was appended on the SAME line after the code
(`...UbexGo: 1234 FA+9qCX9VSu`) — it must be on its **own last line**. And `FA+9qCX9VSu` was a
**placeholder Claude invented for illustration**, not a real hash; the real one comes from a
release build (step 1).

✅ **Safe to deploy right now.** With the env var unset the SMS is **byte-identical** to today's,
so the currently-approved Eskiz template keeps working. Nothing changes until the var is set.

**What the owner still has to do (in this order):**
1. **Get the RELEASE app hash.** Someone runs a **release** build of the user app, opens the OTP
   screen, and reads the log line `[OR-003] SMS Retriever app hash:`. ⚠️ A *debug* build prints a
   *different* hash — production needs the **release** one (it is tied to the signing key).
2. **Register a new Eskiz template** — the SHORT text, with the hash on its OWN LAST LINE:
   ```
   Код верификации UbexGo: 0000
   <11-char release hash>
   ```
   Get it approved (moderation every 3h, weekdays 10:00–16:00).
3. **Only after approval**, set `ESKIZ_OTP_APP_HASH=<release hash>` in the backend env
   (`infra/compose/docker-compose.yml` next to `ESKIZ_EMAIL` + `infra/compose/.env`; and the k8s
   test3 secret). Setting it before the template is approved would make Eskiz **reject the SMS**.
4. Test on a release build: request a code → it should fill and submit with **zero taps**.

⚠️ **Known weakness (not a blocker):** the chosen library is an old-style bridge module (it works
on RN 0.81 via the New-Arch interop layer, verified by compiling it). It is the most likely thing
to break on a future React Native upgrade. Alternative if it ever does: `react-native-otp-auto-verify`.

### ✅ VERIFIED DONE on device — 2026-07-26

**Zero-tap works.** On the user app (test3 env), requesting an OTP now auto-fills and auto-submits
the code with **no dialog and no tap**. End-to-end confirmed on a real device — the first non-static
verification of the whole feature.

⚠️ **The real app hash is `asNtyBnPVzB`, NOT `JtArsQcEBm9`.** The running build logged
`[OR-003] SMS Retriever app hash: ["asNtyBnPVzB"]` via `getHash()` (the exact algorithm SMS
Retriever matches against, so it is authoritative). The earlier `JtArsQcEBm9` was a **static
keystore computation from a past session that was simply wrong** — the owner even got an Eskiz
template approved with it before we caught this. **Lesson: trust `getHash()` on a real build over
any hand-computed keystore hash.**

**Working configuration:**
- Backend env `ESKIZ_OTP_APP_HASH=asNtyBnPVzB` (test3: `infra/k8s/overlays/test3/.env`, picked up
  by the `ubexgo-test3-env` configMapGenerator on redeploy).
- Eskiz message delivered = `Код верификации для входа в приложение UbexGo: <code>\nasNtyBnPVzB`
  (single Cyrillic segment, satisfies Eskiz Пункт 2). Owner confirmed this text delivers via Eskiz.

⚠️ **Two carry-forward caveats (not blockers for test-production):**
1. **`android/app/debug.keystore` is NOT committed to git.** `build.gradle:118` signs both debug and
   release with it, so `asNtyBnPVzB` holds only for builds from this machine's current keystore. A
   clean prebuild / different machine / real release `.jks` regenerates the key → **different hash →
   zero-tap breaks**. Before shipping a real production release: create a permanent release keystore,
   read *its* `getHash()`, then redo the Eskiz template + `ESKIZ_OTP_APP_HASH` once.
2. **Register a production Eskiz template for the `asNtyBnPVzB` wording.** The owner's test send
   delivered (test number), but before real users, an *approved* template matching that exact text
   must exist or production API sends could be rejected.
