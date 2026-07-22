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
| OR-003 | 🔨 in progress | user app | Auto-read the OTP SMS so the code fills itself | T-013 |

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
