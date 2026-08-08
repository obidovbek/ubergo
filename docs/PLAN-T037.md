# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-036 CLOSED 2026-08-08** (owner approved the modal look on a device; the full walk continues
> in the background). Plan archived intact → `docs/PLAN-T036.md`.
> ⏸️ **T-031** → `docs/PLAN-T031.md`. Steps 1-3 done; step 4 blocked on the owner's salon-option
> answer; steps 5-9 (payment migration + admin waiting fee) are free.
> ⏸️ **T-033** → `docs/PLAN-T033.md`, step 7 = owner device test (**deploy the API FIRST**).
> ⏸️ **T-030** → `docs/PLAN-T030.md`, step 7 blocked on an owner answer.
> ⏸️ **T-027** → `docs/PLAN-T027.md`, step 11 (**migration first**, then API, then both apps).
> ⏸️ **T-018** → `docs/PLAN-T018.md` · **T-026A** → step 8 · **T-025** → step 8.
> ⏸️ **Also parked:** T-011 · T-012 · T-014 · T-015 · T-016 · T-017.

## Task
- **ID / name:** T-037 — Driver app: reach, open and take a passenger order
- **Goal (definition of "done"):**
  1. A driver can **get to** the passenger-order search from the main menu.
  2. Tapping a card opens a **real detail screen** showing the whole order (route, time, seats,
     flags, note, passenger).
  3. From there the driver can **send an offer** (`joinPassengerOffer`) with his vehicle, a real
     `seats_offered`, and his price — and see the request afterwards.
  4. A driver **without a vehicle** gets a clear message, not a 403.
  5. No new `tsc` errors in the driver app (baseline **36**); every new string is in **uz/ru/en**.
- **Why now:** the owner reported it on 2026-08-08 — "user creates offer but in the driver app there
  is no way to search or join". The passenger side of this loop is already live, so today a passenger
  posts an order and **no driver can ever answer it**. This is the missing half of the product.
- **Source:** owner, 2026-08-08. Replaces **T-023**, absorbs **T-021**.

## What is already there (verified in code 2026-08-08 — do NOT re-derive)
✅ **Backend: complete, reviewed, no work needed.**
`routes/public-passenger-offer.routes.ts` → browse + detail. `routes/offer-driver.routes.ts` →
`POST /driver/passenger-offers/:offerId/join`, `GET /driver/join-requests`,
`POST /driver/join-requests/:id/cancel`. `OfferDriverService.joinOffer` validates vehicle ownership,
`status === 'published'`, not-started, self-join, duplicates, `seats_offered` and price.

✅ **API client: complete.** `driver-app-standalone/api/passengerOffers.ts` exports all five calls.
❌ **Four of them have ZERO call sites:** `joinPassengerOffer`, `getPassengerOfferById`,
`getMyJoinRequests`, `cancelJoinRequest`.

✅ **Search screen: built** (`screens/SearchPassengerOffersScreen.tsx`, geo cascade + filters +
`PassengerOfferExtras`, already on `AppModal`/`GeoPickerModal` from T-036). All 9 of its `t()` keys
resolve.
❌ **It is imported by nothing.** `MainNavigator` registers 13 routes; `SearchPassengerOffers` is not
one of them, and no screen navigates to it.
❌ `PassengerOfferDetails` (`SearchPassengerOffersScreen:494`) is unregistered **and does not exist**.
❌ `navigation/types.ts` `MainStackParamList` lists **3** routes for a 13-route navigator — every
screen navigates through `(navigation as any)`. (Same defect as T-028 in the user app.)

## Decisions taken while planning (say so if you want them changed)
1. **Entry point = a new menu row**, right under "Mening e'lonlarim" in `MenuScreen`. The five
   existing rows (`viloyatlar`/`ichi`/`tuman`/`empty`/`xalqaro`) are **trip categories**, not
   actions, and none maps to a filter that exists — hijacking one would be a guess. New key
   `menu.passengerOrders` in uz/ru/en.
2. **`vehicle_id` is not a picker.** The driver has exactly one vehicle (`profile.vehicle`) — the
   same thing `OfferWizardScreen.loadVehicles` reads. Show it read-only; if it is missing, block the
   join with a message pointing at the vehicle screen.
3. **Extend `MainStackParamList` for the two new routes only.** Typing all 13 is T-028's shape of
   work and is not this card's.

## Approach
Four thin layers, each independently runnable: **reach it** → **open it** → **take it** → **see it**.
Nothing is rewritten; the search screen is already built and the API is already done. The work is a
navigator entry, one new detail screen, one join sheet, and one list of the driver's own requests.

⚠️ **Do not "improve" the search screen while wiring it up.** Anything found goes on the board
(that is how T-035 was found during T-033).

## Steps
- [x] 1. **DONE 2026-08-08 (code). Search screen is reachable.** `SearchPassengerOffers` registered
  in `MainNavigator` (route 14); new **`passengerOrders`** row in `MenuScreen` right under "Mening
  e'lonlarim", in blue (`#2563EB`) so the two action rows are not mistaken for each other; the route
  added to `MainStackParamList` **and** to `MenuScreen`'s own local copy of that type, so the call
  is properly typed rather than `(navigation as any)`.
  ⚠️ **Found while wiring it: `menu.myOffers` existed in `uz` ONLY** — a Russian or English driver
  has been seeing the raw key `menu.myOffers` on the home screen. Fixed here (it is the row directly
  above the new one) rather than boarded. Same class as **T-035**.
  `tsc` driver app **36 = baseline**. **57/57** i18n checks — every key the new menu row *and* the
  whole search screen resolve, **evaluated** in uz/ru/en (babel-transpiled + required, not grepped).
  🛑 **Still needs the device run** — the screen has never rendered.
- [ ] 2. **Report what step 1 exposes** before building on it. A 1000-line screen that has never
  rendered will have defects; each one is a decision (fix here vs. board) and the owner should see
  the list, not a silent sweep.
- [x] 3. **DONE 2026-08-08. `PassengerOfferDetailsScreen`** — new screen on `getPassengerOfferById`,
  registered as route 15. Route + landmarks, departure, passenger, `seats_needed`,
  `max_price_per_seat` (or "not specified" — the new form collects no price), `note`.
  ⚠️ **All the T-018 extras are rendered by the existing `PassengerOfferExtras`**, the same
  component the search cards use — windows, gendered seats, salon scope, class, payment, flags,
  pickup note and special-order prices were **already** laid out there, so re-implementing them on
  this screen would have been a second copy to keep in sync.
  The `as any` on the tap in `SearchPassengerOffersScreen` is gone — `useNavigation` is typed with
  `MainStackParamList` now. Its hard-coded English `'Login Required'` toast became a key.
- [x] 4. **DONE 2026-08-08. The join sheet** — `AppModal` on the detail screen: read-only vehicle,
  seats stepper, price per seat, optional message → `joinPassengerOffer`.
  🔴 **BLOCKER FOUND AND FIXED: the join could never have worked.** `joinPassengerOffer`,
  `getMyJoinRequests` and `cancelJoinRequest` took **no token** and called `getHeaders()` bare, which
  sends **no `Authorization` header** — all three routes are `authenticate`d, so every call would
  have returned **401**. Every other API module in the app passes `token`; this one never did, and
  with zero call sites nothing ever caught it. All three now take `token` first, matching
  `offerPassengers.ts`. *(The two `public/*` calls are genuinely unauthenticated and were left alone.)*
  ⚠️ **`seats_offered` defaults to the offer's `seats_needed`, and the stepper cannot go below it** —
  `OfferDriverService:129` refuses less, and a T-018 salon order needs 3–4. The API client's own
  default of 1 would have rejected the driver on every salon order.
  ⚠️ The total shown is price × **`seats_needed`**, not × `seats_offered` — the server's rule, which
  the owner confirmed on 2026-08-02 as intended.
  A driver with **no vehicle** gets a red explanatory box and a disabled Send, instead of the 403
  `checkVehicleOwnership` would return. Backdrop dismissal is off (a stray tap would discard a typed
  price). The server's 400s are already translated, so they surface verbatim via `getErrorMessage`.
- [x] 5. **DONE 2026-08-08. `MyJoinRequestsScreen`** — `getMyJoinRequests` + `cancelJoinRequest`,
  registered as route 16 and reached from a second new menu row ("Yuborilgan takliflarim"). Status
  filter (server-side, via the `status` param), route, departure, passenger, seats, price, total,
  the driver's message and the passenger's rejection reason.
  🔴 **Second real defect found: `offer.passenger` does not exist on this endpoint.**
  `getDriverJoinRequests` returns the **raw Sequelize model**, so the nested offer carries `user` —
  the mapped `passenger` shape is built only by `PassengerOfferService` for the `public/*` routes.
  The app's type claimed `passenger` was always there, so `offer.passenger.name` would have been a
  **crash on every row**. Type corrected (`JoinRequestOffer`) and a `passengerNameOf()` helper reads
  whichever shape arrives.
  ⚠️ **Cancel is offered on `pending` rows only** — the server refuses to cancel a `confirmed`
  request (400), and after `cancelled` *or* `rejected` a re-join is impossible (owner, 2026-08-02).
  The confirm dialog says that in all three languages rather than implying it is undoable.
  ⚠️ `useFocusEffect` alone drives loading — it covers mount, filter change and returning to the
  screen; a `useEffect` beside it just double-fetched on mount.
- [x] 6. **DONE 2026-08-08. Static verification.** `tsc` driver app **36 = baseline**, with **zero**
  errors in any of the 9 touched files (nothing to prove pre-existing via `git stash` — none of them
  contributes an error). **291/291** i18n checks in uz/ru/en over **97 keys discovered from the
  source**, then **evaluated** against babel-transpiled locale modules.
  ⚠️ **The check earned its keep again: `common.all` existed in `uz` only**, so the new filter bar
  would have rendered the raw key in Russian and English. Added, with `viewAll` for parity. That is
  the **third** uz-only key found on this card (see step 1's `menu.myOffers`) — all the same class
  as **T-035**.
  No hard-coded user-visible strings in either new screen (grep over JSX text and placeholders).
- [ ] 7. **Owner: rebuild the driver app and run the loop end to end** — passenger posts an order in
  the user app → driver finds it, opens it, sends an offer → passenger sees the driver
  (⚠️ **that screen is T-024 and does not exist yet**, so confirm via the DB or the admin panel).
- [ ] 8. Commit (only after the owner's approval).

## Files to touch
- `driver-app-standalone/navigation/MainNavigator.tsx` — 2 new routes
- `driver-app-standalone/navigation/types.ts` — `MainStackParamList`
- `driver-app-standalone/screens/MenuScreen.tsx` — entry point(s)
- **NEW** `driver-app-standalone/screens/PassengerOfferDetailsScreen.tsx`
- **NEW** `driver-app-standalone/screens/MyJoinRequestsScreen.tsx` (step 5)
- `driver-app-standalone/api/passengerOffers.ts` — the missing `token` on all three authenticated
  calls, plus the `JoinRequestOffer` type and `passengerNameOf()` (not foreseen when planning)
- `driver-app-standalone/screens/SearchPassengerOffersScreen.tsx` — drop the `as any` on the tap
- `driver-app-standalone/translations/{uz,ru,en}.ts` — all three, always
- ❌ **No API changes. No migration.**

## Risks / open questions (READ before coding)
- ⚠️ **The search screen has never rendered.** 1000+ lines written blind. Step 1 exists to find out
  what breaks *before* three more screens are built on top of it.
- ⚠️ **`seats_offered` is the trap on this card.** Defaulting to 1 makes every salon order (T-018)
  refuse the driver with a confusing message. The service carries a comment written for this card.
- ⚠️ **A driver with no vehicle** hits `checkVehicleOwnership` → **403 "vehicle not found"**, which
  reads like a bug. Catch it in the app before sending.
- ⚠️ **Cancel and reject are one-way.** A driver who withdraws can never re-offer on that order
  (unique `(offer_id, driver_id)` index + explicit service checks). Owner's decision 2026-08-02 —
  do not soften it, just make the UI honest about it.
- ⚠️ **The loop cannot be fully demoed yet** — the passenger's "drivers who offered" screen is
  **T-024** and does not exist. Step 7 stops at the DB/admin panel.
- ⚠️ **T-026 part A lists real 500s on the neighbouring passenger↔driver routes.** Different leg,
  but if a garbage param 500s while testing, that is T-026, not a new bug.
- ⚠️ `OfferWizardScreen` and `MenuScreen` are touched by T-002/T-026 — expect conflicts if those move.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` keeps picking up permission-prompt changes — **keep it out of commits**
  (it was wrongly committed in both `6b691ab` and `34988cc`).

## Session notes (one line per work session)
- **2026-08-08** — card created from the owner's report. Grounded in code: the search screen is
  registered in **no** navigator, 4 of 5 API functions have zero call sites, and the backend is
  already complete. T-023's premise was wrong and the card was replaced; T-021 absorbed as step 3.
  **Steps 1, 3, 4, 5, 6 all done the same session** — screen registered, two menu entry points,
  detail screen, join sheet, sent-offers list, static verification. Step 2 (device run) deferred by
  the owner, so everything after it was built on an unrendered screen.
  **Three defects surfaced, all in code nobody had ever executed:** the three authenticated calls in
  `api/passengerOffers.ts` sent **no `Authorization` header** (guaranteed 401); `offer.passenger`
  does not exist on the join-requests endpoint (guaranteed crash); and three keys —
  `menu.myOffers`, `common.all`, `common.viewAll` — existed in **uz only**.

## Resume point (for the next chat)
**All of Claude's steps are DONE (1, 3, 4, 5, 6). Only step 7 (owner device test) and step 8
(commit) remain.** Step 2 was **deferred by the owner, not skipped** — steps 3-6 were therefore
built on top of a search screen that has still never rendered.

**The whole loop now exists in the driver app:**
home menu → **"Yo'lovchi buyurtmalari"** → `SearchPassengerOffers` → tap a card →
`PassengerOfferDetails` → **"Bu buyurtmani olaman"** → join sheet → `joinPassengerOffer`;
and home menu → **"Yuborilgan takliflarim"** → `MyJoinRequests` → cancel a pending one.

**Two defects found in code nobody had ever executed — both would have broken the flow outright:**
1. **A 401 baked into every authenticated call.** `joinPassengerOffer`, `getMyJoinRequests` and
   `cancelJoinRequest` called `getHeaders()` with **no token**, so they sent no `Authorization`
   header. Every other API module in the app passes one. Fixed.
2. **`offer.passenger` does not exist on `GET /driver/join-requests`.** That endpoint returns the
   raw model (`offer.user`); only the `public/*` routes build the mapped `passenger` shape. The app's
   type claimed otherwise, so the requests list would have crashed on every row. Fixed via
   `JoinRequestOffer` + `passengerNameOf()`.

**Verification:** `tsc` driver app **36 = baseline**, **zero** errors in any of the 9 touched files.
**291/291** i18n checks over **97 keys discovered from the source** and evaluated in uz/ru/en
(script: `scratchpad/i18n-check.js`). No hard-coded strings in the new screens.
⚠️ **Three uz-only keys surfaced along the way** — `menu.myOffers`, `common.all`, `common.viewAll` —
all fixed here, all the same class as **T-035**, which is still open.

🛑 **Nothing has run on a device or against the live API.** Step 7 is the real test, and the loop
cannot be fully demoed: the passenger's "drivers who offered" screen is **T-024** and does not
exist, so confirm the driver's offer arrived via the DB or the admin panel.

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12**, driver app **36**.
