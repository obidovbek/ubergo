# ✅ TODO — task board

> **Rules:** max **2** tasks in *Now*. New ideas always land in *Later* — they
> never interrupt the current task. Claude moves cards here during
> `/new-task` and `/end-day`. Humans can edit this file any time.
>
> **Format:** `T-###  (P1|P2|P3)  short name — detail`. P1 = most important.

## 🔥 Now (working on it)
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
- [ ] T-045 (P2) **The in-app notifications list is a dead end — and offer events never reach it.**
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
- [ ] T-043 (P2) **Two endpoints under `/public/passenger-offers` return different shapes for the
  same object.** Split out of **T-042** by owner decision 2026-08-10 (app-side fix first so the
  device test was unblocked). **This is the root cause T-042 only worked around.**
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
- [ ] T-034 (P1) 🔒 **Two OTP security holes.** Split out of T-033 by owner decision 2026-08-08 so
  the device-test fix stayed tight. Both verified in code, neither is theoretical.
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
- [ ] T-024 (P1) **User app: "drivers who offered" screen.**
  ✅ **Not to be confused with the driver-side screen (owner asked 2026-08-11, resolved).** The
  driver app's `PassengerOfferDetailsScreen` being **read-only after bidding is CORRECT** — the bid
  is the action, and since T-042 ③ the footer shows the driver's **real status** (sent / confirmed /
  rejected / cancelled) instead of re-offering the button. **Do not add driver actions there.**
  This card is the **passenger** side, which genuinely has nothing to tap. `MyPassengerOffersScreen` shows
  "N drivers interested (M pending)" with **nothing to tap** — the passenger is told drivers
  arrived and cannot answer them. `getOfferDrivers` / `confirmDriver` / `rejectDriver` exist in
  `user-app-standalone/api/passengerOffers.ts` with zero call sites. Accepting sets the offer to
  `driver_found` and auto-rejects + notifies the losing drivers (server side already done).
  Found 2026-08-02.
  🔴 **Now also blocks T-044.** A `driver_join_request` push — the passenger being told a driver
  wants their trip — has **no exact screen to open**, so T-044 must leave it on the
  `MyPassengerOffers` list. ⚠️ **Do not "fix" that by routing it to `OfferDetails`**: its `offer_id`
  is the passenger's **own PassengerOffer**, while `OfferDetails` fetches a **DriverOffer** — it
  would load a wrong row or 404. This card is the real fix.
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
