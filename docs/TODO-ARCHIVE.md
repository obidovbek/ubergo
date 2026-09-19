# 🗄️ TODO archive — cards that left the board

> **Read the board, `docs/TODO.md`, for what is true now. This file is history.**
> Every entry is a card that left the board because **another copy of the same card stayed on
> it**, or a note whose subject had moved or gone stale. Each is copied **verbatim**, never
> edited, under a line saying where it stood and which copy stayed.
> Started by **T-122** on 2026-09-19, when the board had two *Now* sections and 22 duplicated
> ids. `node scripts/check-board.mjs` now keeps the board to one copy of each card.

## 2026-09-19 — T-122: the stale copy of every duplicated card

### T-024 — left *Now* · the *Done* entry stays. This is the working copy it was closed from

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

### T-034 — left *Next* · the *Done* entry stays. This is the working copy it was closed from

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

### T-038 — left *Parked* · the *Done* entry stays. *Parked* kept this copy on purpose, folded as history; it is kept here instead

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

### T-041 — left *Parked* · the *Done* entry stays. *Parked* kept this copy on purpose, folded as history; it is kept here instead

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

*The note that stood between these folds in* Parked, *moved with them:*

> 🟢 T-041 closed 2026-08-10. 🟢 T-042 + T-044 closed 2026-08-11.

### T-042 — left *Parked* · the *Done* entry stays. *Parked* kept this copy on purpose, folded as history; it is kept here instead

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

### T-043 — left *Next* · the *Done* entry stays. This is the working copy it was closed from

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

### T-044 — left *Now* · the *Done* entry stays. *Now* kept this copy folded as history; it is kept here instead

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

### T-045 — left *Next* · the *Done* entry stays. This is the working copy it was closed from

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

### T-049 — left *Next* · the *Done* entry stays. This is the working copy it was closed from

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

### T-050 — left *Next* · the *Done* entry stays. This is the working copy it was closed from

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

### T-051 — left *Next* · the *Done* entry stays. This is the working copy it was closed from

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

### T-052 — left *Next* · the *Done* entry stays. This is the working copy it was closed from

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

### T-053 — left *Next* · the *Done* entry stays. This is the working copy it was closed from

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

### T-063 — left *Next* · the card in *Now* stays: the same work, boarded here 2026-08-11 and done 2026-08-13

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

### T-076 — left *Later* · the done copy stays in *Later*. This is the original, already struck and folded as history

<details><summary>Original card (kept for history)</summary>

- [ ] ~~T-076 (P2)~~ 🔴 **The driver app's social sign-in calls three functions that do not exist.**
  Found by T-060's first-ever lint run, 2026-08-13. `AuthContext.tsx:385/406/427` call
  `AuthAPI.googleSignIn` / `appleSignIn` / `facebookSignIn`, but `api/auth.ts` exports only
  `sendOtp`, `verifyOtp`, `getCurrentUser`, `refreshAccessToken`, `logout`. **The three functions
  exist nowhere in the app.**
  ✅ **Not a live crash today:** the three methods are exposed on the auth context but **no screen
  calls them** — grep across `screens/`, `components/` and `navigation/` finds zero consumers. It is
  a **trap**: wiring up a Google button would fail instantly with *"not a function"*.
  🔴 **`tsc` cannot catch this.** `import * as AuthAPI from '../api/auth'` makes it namespace member
  access, which is not checked the way a named import would be — which is exactly why it survived
  this long, and a good argument for the lint run existing.
  ✅ **CHECKED, and the user app is NOT affected** — its `api/auth.ts` genuinely exports
  `googleSignIn` (`:152`), `appleSignIn` (`:185`) and `facebookSignIn` (`:218`) alongside the other
  five. **So this is a driver-app-only gap: the driver's copy was never given the three functions
  its context calls** — the "same file, two apps, one of them swept" shape this project keeps paying
  for (T-042/T-066/T-067, T-065).
  ✅ **That also makes the fix cheap and low-risk:** the user app's three functions are a working
  reference implementation to port, not something to design.
  🛑 **Still needs an owner decision, so NOT started:** is social sign-in **wanted** in the driver
  app (port the three functions from the user app) or **abandoned** (delete the three context
  methods and their interface entries)? Until then the driver app's lint run stays at **3 errors**,
  deliberately.

</details>

### T-078 — left *Now* · the current T-078 card stays. This is card 1 of 5 as first written, already struck and folded as history

<details><summary>Original card (kept for history)</summary>

- [ ] ~~T-078~~ **Card 1 of 5. PLAN WRITTEN AND AWAITING APPROVAL → `docs/PLAN.md`.**
  Eight columns on `driver_offers`: `price_back_salon`, `price_whole_salon`, `waiting_fee_per_min`,
  `free_waiting_min`, `pickup_fee`, `payment_cash`, `payment_card`, `vehicle_class`.
  ✅ **Four of the eight names come straight from `PassengerOfferSpecialOrder`**; the payment pair is
  a straight mirror of **T-031** (done the same day); the class values already exist as
  `PassengerOfferVehicleClass`.
  ✅ **The two per-seat prices already work** — `front_price_per_seat` = *Old o'rindiq*,
  `price_per_seat` = *Orqa o'rindiq*, both already rendered by T-077's card. ⚠️ **Do NOT rename
  them** to match the mockup's wording; they are live and read by the passenger app.
  ✅ **`vehicle_class` will make T-077's dropped chips buildable** — a later card, not a reason to
  widen this one.
  🔴 **Needs a THIRD unrun migration** (T-031's and T-046's are already waiting).
  🔴 **`OfferWizardScreen` is 3517 lines and serves BOTH create and edit** — the commonest silent
  failure here is a field that saves but never loads back, so the next edit wipes it.
  ❌ The passenger's selection window is **not** in this card (T-081).

</details>

### T-080 — left *Now* · the built **T-079 + T-080** card stays (done 2026-08-13, and it carries the `departs_when_full` decision). This is the unbuilt original

- [ ] T-080 (P2) **[mockup `D_Elon berish`] Driver offer: departure/arrival windows + srochno.**
  *21:00-23:00 da yurish vaqti*, *07:00-09:00 yetib borish vaqti* with its own date, and
  *hozioq (to'lishi bilan yuraman)*. **NOT STARTED.** ⚠️ `PassengerOffer` already has
  `depart_until`, `arrive_from`, `arrive_until` — mirror those three.
  🔴 **BUT DO NOT MIRROR `is_urgent` — it would be a LIE.** Owner confirmed 2026-08-13 that the
  driver's *"hozioq (to'lishi bilan yuraman)"* means **"I leave when the car fills up"**, which is
  **not** the passenger's `is_urgent` (*"I want to leave now"*, and on that side it literally sets
  `start_at = now`). **Give it its own name — `departs_when_full`** — and note that the two are
  different concepts, or a future join will silently equate them. *Found in the 2026-08-13 meaning
  review; the mirror was one step from being wrong.*
  ⚠️ **This therefore does NOT give T-077 its ⚡ flash** — the flash meant "urgent", and this column
  means "when full". They are separate questions. Card 3 of 5.

### T-087 — left *Later* · the working card in *Now* stays. This is the boarding copy from the 2026-08-14 owner batch

- [ ] T-087 (P1) 🏦 **[OWNER 2026-08-14, items 1-3] The three accounts and the ledger under them.**
  **THE FOUNDATION CARD — everything else in this batch depends on it.**
  **Scope:** `wallet_accounts` (one row per user per kind: `real` / `token` / `bonus`) and an
  **append-only** `wallet_transactions` ledger — amount, kind, direction, reason, actor, source,
  external reference, resulting balance, timestamp.
  🔴 **APPEND-ONLY IS THE WHOLE DESIGN, and it is what the owner actually asked for.** *"qayta hisob
  kitob yoki qaytarish"* — recalculation and refund — is **impossible on a mutable balance column**.
  A correction must be a **new reversing entry** that cites the row it reverses; the balance is the
  sum. Never `UPDATE balance SET …`. ⚠️ A cached `balance` column is fine as an optimisation **only**
  if a reconciliation query can prove it equals the sum of the entries.
  🔴 **Every entry must name WHO and THROUGH WHAT** — the owner said so twice
  (*"kim orqali o'zgartirilgani"*). Admin id / system / provider callback, and the reason.
  ⚠️ **Money moves need a DB transaction with row locking**, or two concurrent spends both pass the
  balance check. This project has **no precedent for `transaction()` + `LOCK`** — it will be the
  first, so it needs to be right rather than copied from a service that never needed it.
  ⚠️ **`AuditLog` is complementary, not a substitute** — it records the admin's *action*, the ledger
  records the *money*. Both, not either.
  ⚠️ **Idempotency from day one:** a provider that retries a callback must not credit twice. A unique
  constraint on `(provider, external_id)` is the cheap, boring fix — retrofitting it after a double
  credit means reconciling real balances by hand.
  🛑 **BLOCKED on questions ①, ⑤ and ⑥ above.** ❌ Needs a migration (owner approval — rule 4).

### T-088 — left *Later* · the working card in *Now* stays. This is the boarding copy from the 2026-08-14 owner batch

- [ ] T-088 (P1) 💳 **[OWNER 2026-08-14, item 1 + the 2:03 PM note] The PAYNET web service.**
  🔴 **REWRITTEN 2026-08-14 after reading the owner's two documents — the original card was built on
  the wrong premise.** Full contract extracted to **`docs/PAYNET.md`** (neither file is readable by
  the normal tools: no `pdftotext`, no `pypdf`, and the PDF's Cyrillic uses a subset font that does
  not survive naive extraction — **that file is the readable record**).
  🔴 **PAYNET CALLS US; WE DO NOT CALL PAYNET.** UbexGo is the *Поставщик* and must **stand up a
  JSON-RPC 2.0 web service** that Paynet's terminals call when a customer hands cash to an agent.
  There is no outbound "charge a card" API in this contract at all. *The card previously assumed the
  opposite, which would have been the whole design backwards.*
  **Six mandatory methods:** `PerformTransaction` · `CheckTransaction` · `CancelTransaction` ·
  `GetStatement` · `GetInformation` · `ChangePassword`.
  ✅ **`GetInformation` IS the owner's masked-phone requirement, and it is now properly grounded.**
  It returns `fio` — what the agent reads back to the customer before taking the cash — so
  **`+99890 ***4585` belongs in that field**, not in some custom endpoint. ⚠️ Mask **server-side**;
  returning the full number and masking it in a UI leaks it in the response body.
  ✅ **The phone-oracle risk I flagged is largely closed by the contract itself:** access is
  restricted to **`213.230.106.112/28` and `213.230.65.80/28`**, and the provider is **obliged to
  refuse other IPs and not accept payments that arrive in violation**. ⚠️ Still rate-limit and audit
  per call — T-092 makes IDs enumerable from a known origin.
  🔴 **`transactionId` (Paynet's) is the idempotency key**, and error **201 «Транзакция уже
  существует»** is the mandated answer to a repeat. `providerTrnId` is **ours**, minted by us and
  quoted back to us — **do not confuse the two.**
  🔴 **Error `77` = refuse a cancellation when the payer already spent the money.** Answerable from
  an append-only ledger; **impossible on a mutable balance column.**
  🔴 **≤ 500 ms or Paynet may disconnect us** (30 s = dropped connection). A hard budget for a
  row-locked write.
  ⚠️ **`ChangePassword` must work on day one** — Paynet is obliged to rotate the password on first
  successful connection, so it cannot live in an image-baked config. **Env only** (rule 5).
  ⚠️ **Daily reconciliation is contractual** — Paynet compares its own register against our
  `GetStatement`. The owner's *"finansiviy analiz"* is therefore a hard requirement, not a wish.
  🛑 **BLOCKED — four things are missing and cannot be guessed:** ① UbexGo's own `serviceId`, URL,
  username and password (**the sample document is filled in for a different company — "TV Turon
  Navoi", `navpay.tn.uz` — do not hard-code any of it**); ② our negotiated `fields` set (the annex
  and the JSON spec disagree, because it is per-provider); ③ the `error.code` **sign convention**
  (the annex lists `301`, the JSON sample shows `-253`); ④ question ⑥ — who may hand-enter a top-up
  and is there a ceiling.
  🛑 **Depends on T-087.** ❌ No app change.

### T-091 — left *Later* · the *Done* entry stays (closed 2026-08-16). This is the boarding copy

- [ ] T-091 (P2) 🆔 **[OWNER 2026-08-14, 2:06 PM + 2:07 PM] The user's OWN promo code (5 chars) and
  username (≥6 chars).** Both digits + latin letters, both chosen by the user.
  🔴 **`users.promo_code` ALREADY EXISTS AND MEANS THE REFERRER'S CODE — THE OPPOSITE OF THIS.**
  Migration `20260802000002`'s own comment spells it out: there are three ways to name whoever
  invited you — phone, user ID, promo code — stored in `referral_phone`, `referral_id` and
  **`promo_code`**. `UserDetailsScreen:455` posts the code the **new user typed in**, i.e. *somebody
  else's*.
  🔴 **So this needs a NEW, UNIQUE column** (`own_promo_code`), never a reuse of `promo_code`.
  **Reusing it would equate "the code I entered" with "the code I own"** — the exact mistake caught
  in the 2026-08-13 meaning review when `departs_when_full` was one step from being mirrored onto
  `is_urgent` (T-080). Here it would be worse than a wrong label: **the referral payout would credit
  the wrong user.**
  ✅ **`CITEXT` is already the house type for case-insensitive uniqueness** (`phone_e164`, `email`) —
  so `ABC12` and `abc12` collide by construction, which is what you want for something people read
  off a screen and re-type.
  ⚠️ **No `username` column exists anywhere** (the only hits are the DB config and Telegram SSO's
  own field). New column, unique, and a **reserved-word list** — `admin`, `support`, `ubexgo` must
  not be claimable, and that is far cheaper to decide now than to take back later.
  ⚠️ **5 alphanumeric chars ≈ 60M combinations** — fine for uniqueness, but **guessable**, so a promo
  code must never be usable as an authentication or lookup key for anything but referral credit.
  ⚠️ **Both need server-side validation** *and* app validation that agrees with it — T-063's rule:
  the server must never refuse what the app accepted.
  ✅ **Independent of the ledger — this card can ship before T-087.** ❌ Needs a migration.
  ✅ **APPROVED, AND STEPS 1-5 DONE (1-2 on 2026-08-14, 3-5 on 2026-08-15) → `docs/PLAN.md`.
  CODE-COMPLETE AND UNTESTED.**
  ✅ **Two new columns, `own_promo_code` and `username`, both CITEXT and both nullable** — and
  `promo_code` **untouched**, with a comment on each saying which is which.
  ✅ **Four outcomes kept apart:** *wrong format* · *already taken* · *cannot be changed* · *taken in
  the race*. The first three are a field-named **422** (the status the apps read field errors from);
  the last is the unique index reporting **409** through the existing handler.
  🔴 **The promo code is PERMANENT once set, the username is not** — owner delegated the decision
  2026-08-15. A code that has been given out cannot be freed without handing the string to whoever
  claims it next, **who would then collect T-089's referral credit from people who meant to name the
  first user.**
  🔴 **`if (x !== undefined)` — the pattern the other nine fields on this endpoint use — would have
  been a real bug here.** It writes `''` into a **UNIQUE** column, so the failure lands on the
  *second* user to save an untouched profile, not on anyone who typed something wrong. Both screens
  PUT the whole profile, so that is the normal path.
  ✅ **The second "owner question" was answerable from the code:** `UserDetailsScreen` is
  registration-only, but **`EditProfileScreen` already posts to the same endpoint**, so the edit
  surface exists and step 4 covers both screens.
  ✅ **A boxed "your identifiers" section on BOTH `EditProfileScreen` and `UserDetailsScreen`**,
  separated from the referral block by distance **and** by wording, with the promo input **locked**
  once a code exists — the server refuses a change, and an input that accepts what is always
  rejected is a trap.
  🔴 **THE APP THREW AWAY EVERY SERVER ERROR ON THIS ENDPOINT, and had to be fixed first.** Both
  screens did `throw new Error(data.message)`, losing the status that `handleBackendError` switches
  on — so every message became the same generic toast. Step 3's four distinct answers would have
  been invisible. Now an `ApiError`, with `parseValidationErrors` (**which already existed and had
  never been called**) putting each error under its field.
  🔴 **`EditProfileScreen` re-populates the form in THREE places** and all three had to load the new
  fields — miss one and a claimed code shows as an empty box the user re-types and the server then
  refuses. T-078's save-but-never-load failure, with a lock on it.
  **128/128 (26 new), PROVEN ABLE TO FAIL — 5 mutations → 2/1/4/1/1 red**, every file restored
  byte-identical. **i18n EVALUATED — 13 keys × 3 locales, 0 problems, the checker itself proven able
  to fail twice** (a renamed key, and uz text pasted into ru). 🔴 Evaluating was **not optional**:
  `translations/index.ts` already carries a TS2322 about locale shape, so a missing ru/en key would
  not have moved the `tsc` count at all.
  `tsc` API **281** · admin **0** · user **6** · driver **28**, all at baseline. Lint API **230** ·
  user **225** vs a `git stash`-measured **221** (+4 = the two screens' own `(user as any)` idiom;
  ⚠️ the card's recorded 235 was stale).
  ❌ **The app copy of the rules has no test** — no RN test runner exists; only the API copy is
  tested, and that is written on both files.
  🛑 **THE MIGRATION HAS NOT BEEN RUN** — the API now reads two columns that do not exist on test3.
  🛑 **Remaining: step 6 (owner: migrate → deploy → rebuild the USER app → claim a code and a
  username → try the same pair from a second account → re-open the profile and check both loaded
  back and the promo input is locked) · step 7 (commit).**

## 2026-09-19 — T-122: notes about *Now* that stopped being true

### Left *Now* · "THE ONE ACTIVE TASK IS T-087" — T-087 is code-complete and now in *Parked*

> 🔥 **THE ONE ACTIVE TASK IS T-087 (below).** Every other card in *Now* is code-complete and
> waiting on the owner's device — the file's own *Parked* rule says those do not count against the
> 2-task limit. Swept 2026-08-14: **26 plan files, 54 unchecked boxes, none of them Claude's.**

### Left *Now* · "T-061 is the ONLY card in this section with Claude work left" — T-061 is code-complete and now in *Parked*

> ⚠️ **T-061 is the ONLY card in this section with Claude work left.** Everything below it is
> code-complete and waiting on the owner's device — the file's own *Parked* rule says those do not
> count against the 2-task limit.

### Left *Now* · "Only T-031 is left in *Now* … no active task" — *Now* holds T-122 and T-101; T-031 is in *Next*

> 🟢 **T-044 and T-042 both CLOSED 2026-08-11** (owner device test, committed `55718f6`) — moved to
> *Done*. Only T-031 is left in *Now*, and it is **blocked on an owner answer** (see its 🛑 below),
> so there is effectively **no active task**: pick one from *Next*, or unblock T-031.

## 2026-09-19 — T-122: the board's old header notes, and T-097

### Left the header · the 2026-08-12 owner-batch note — its counts (eight of thirteen code-complete, three blocked on the owner) describe that day

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

### Left the header · the 2026-08-11 state note — *"No Claude work remains anywhere"* stopped being true on 2026-08-13, and it counted ELEVEN and TEN code-complete cards one screen apart

> 🛑 **STATE AT END OF 2026-08-11: the board is waiting on the owner's device again. No Claude work
> remains anywhere.**
>
> The owner's device test reopened the board with six findings; five became **T-061 — code-complete
> the same day**. The other two are **T-062** (🛑 blocked: which table owns a driver's email?) and
> ✅ **T-063 DONE 2026-08-13** — all four validators reconciled against their real screens and mounted.
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

### Left *Now* · its header note — it pointed at T-101 (whose card says all of it), and at T-088, T-078 · T-083 · T-079/T-080 · T-087 and the duplicated block, all moved or fixed by T-122

> 🎨 **T-101 IS THE ACTIVE CARD: the new design system.** The owner drew **33 artboards** in
> `htmlDesign/` with Claude Design on 2026-08-29. → `docs/PLAN-T101.md`.
> 🟢 **2026-08-31 — ITS COLOUR HALF IS COMPLETE IN BOTH APPS (1 803 literals removed) and committed
> through `c005785`.** 🛑 **Its VISUAL half has not started: tokenized is not rebuilt, and almost
> nothing has run on a device.** Full detail in `docs/JOURNAL.md` 2026-08-31; the handoff a fresh
> session should read is the **Resume point** at the bottom of `docs/PLAN-T101.md`.
> 🔴 **CORRECTION TO THE NOTE THAT STOOD HERE SINCE 2026-08-16: it said "*Now* HOLDS TWO CARDS:
> T-088 and T-100". BOTH HALVES WERE WRONG.** **T-100 was never a card in *Now*** — it has always
> been in *Later* (search `T-100`), so nothing had to be moved to make room for T-101. And *Now* did
> not hold two cards but **five**: T-088, T-078, T-083, T-079+T-080, T-087. *Fourth time a card or
> preamble in these files has disagreed with the board it describes (T-031, T-035, T-083, T-092) —
> the board wins, not the prose.*
> ✅ **T-088's code is complete and verified against the real test3 database.** What is left in it is
> **not application code**: **T-100** (proxy layer, needs whoever administers `192.168.10.119`),
> `ChangePassword` persistence, and Paynet's credentials. It stays in *Now* for that one code step.
> ⚠️ **T-078 · T-083 · T-079/T-080 · T-087 are all code-complete and waiting on the owner's device**,
> not on Claude. That is why the "max 2 in *Now*" rule reads as broken when it is not really.
> 🧹 **AND THIS FILE HAS A PROBLEM OF ITS OWN:** lines 9-63 are **duplicated verbatim** further down
> (the whole 2026-08-11/12 preamble *and* a second `## 🔥 Now` header). Noticed 2026-08-15 while
> boarding T-092; left alone rather than swept mid-card. → **T-097** in *Later*.

### T-097 — left *Later* · the same card as T-122, boarded 2026-08-15 and never started; T-122 did its job. Its warning that the two header copies differ was no longer true by 2026-09-19

- [ ] T-097 (P3) 🧹 **[noticed 2026-08-15 while boarding T-092] `TODO.md` contains a duplicated
  block — including a SECOND `## 🔥 Now` header.**
  🔴 Lines **9-63** (the 2026-08-12 batch note, the 2026-08-11 state note, and the `## 🔥 Now`
  header) reappear **verbatim** further down the file, followed by the same driver-offer preamble.
  ⚠️ **This is not cosmetic:** a card edited "in *Now*" can land in whichever copy the editor
  matched, and the two halves then disagree about what the board says. It already forced this card's
  own edit to be spliced by line number because every text anchor matched twice.
  ✅ Fix: delete the second copy and keep one *Now*. ⚠️ **Diff the two blocks first** — the earlier
  one has *"ELEVEN code-complete"* where the later has *"TEN"*, so they are **not** byte-identical
  and one of them is the stale one. ❌ No code, no migration.
