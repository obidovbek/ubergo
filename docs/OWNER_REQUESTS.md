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
