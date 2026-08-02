# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **T-018 is parked mid-task, not finished** — plan in `docs/PLAN-T018.md`, live at step 9/10
> (owner: walk `docs/CHECKLIST.md` on two phones). This is the last thing standing before the
> nine-card backlog of untested work can start clearing.
> ⏸️ **T-025** → `docs/PLAN-T025.md`, live at step 8. ⏸️ **T-026A** → `docs/PLAN-T026A.md`,
> live at step 8 (committed + deployed, smoke tests never run).
> ⏸️ **Also parked:** T-011 · T-012 · T-014 · T-015 · T-016 · T-017.

## Task
- **ID / name:** T-027 — OR-010: seven fixes from the software owner
- **Goal (definition of "done"):**
  1. In the referral block only **one** of phone / ID / promo can hold a value.
  2. That block shows a grey `+998901234567` placeholder, never the user's own number, and the
     phone typed there is actually **saved**.
  3. Opening the keyboard on the birth-date field no longer throws the field off the top.
  4. A new message shows a badge on an envelope icon without opening the menu.
  5. Tapping a push notification opens **that message**, in **both** apps.
  6. A hamburger icon on the left opens the menu.
  7. Picking a district offers its settlements and mahallas in the trip location picker.
  8. No new `tsc` errors anywhere; migration applied; both apps rebuilt and smoke-tested.
- **Why now:** the software owner is blocked on these before signing off the checklist walk, and
  three of the seven (4, 5, 7) need **no backend work at all** because the API already has what
  they need — they were simply never wired up in the app.
- **Source:** `docs/OWNER_REQUESTS.md` OR-010 (verbatim Uzbek + translation), reported 2026-08-02,
  every item grounded in code the same day.

## Owner decisions already taken (2026-08-02 — do NOT re-ask)
1. **A real `referral_phone` column** — migration **approved**. Not reusing `referral_id` for a
   phone number: whoever writes the bonus payout logic later would have no way to tell them apart.
2. **Item 7 means the trip location picker** (`GeoSelectModal` / `LocationCard`), not the profile
   address. The profile address fields exist in the DB but no user-app screen references them —
   that would be building a new cascade, not fixing one, and is out of scope.
3. **T-019's Figma re-layout stays separate.** Fix the referral block where it is.
4. **Item 5 is done in both apps** — the owner asked for driver-app parity wherever it applies, and
   this is the one item that genuinely applies.
5. **Item 6 = a hamburger in the left slot of the *secondary* screens**, navigating to `Home`
   (which *is* `MenuScreen`). **No drawer library** — that would be a new dependency and a
   navigator restructure. Owner chose this over a real slide-out drawer 2026-08-02.
6. **Item 4 = envelope + unread badge in the *Home* header, beside the profile avatar**, tapping
   through to `Notifications`. Owner explicitly declined extracting a shared header component
   first, so the badge lives in one place rather than all eight.

## Current state (verified in code 2026-08-02)
- **Items 1–2** — `user-app-standalone/screens/UserDetailsScreen.tsx:663-700`. Three sibling
  fields: phone (`value={phoneNumber}`, **`editable={false}`** — the user's *own* number),
  `userId`, `promoCode`. Nothing prevents filling two at once. Submit (:428-432) sends
  `promo_code` + `referral_id: userId` only. `User` model has `promo_code` and `referral_id`
  (`User.ts:161-165`); **no referrer-phone column exists.**
- **Item 3** — same file, `:717` `onFocus={scrollToEnd}`; `scrollToEnd` (:365) does
  `scrollToEnd({animated:true})`, i.e. jumps to the bottom of the whole form. The same handler is
  on `userId` (:684) and `promoCode` (:698), so whatever replaces it must suit all three.
- **Item 4** — `NotificationController.ts:50` already returns `unread` alongside the list, and
  `user-app-standalone/api/notifications.ts:32` `getNotifications` already receives it.
  **No backend change needed.** `NotificationsScreen.tsx` exists; no badge anywhere.
- **Item 5** — `onNotificationOpenedApp` / `getInitialNotification` appear **only in
  `node_modules`** in both apps. There is no tap handler at all, in either app, so a tapped push
  just cold-opens the app on its default screen. Push *payloads* already carry routing data
  (`type`, `offer_id`, `passenger_join_id` — see `OfferPassengerService.notifyPassenger`).
- **Item 6** — `MenuScreen` is a plain stack screen in `MainNavigator.tsx:29`; no `headerLeft`,
  no drawer, no menu button anywhere in the app.
- **Item 7** — the API **already** serves `/city-districts/:id/settlements` **and**
  `/city-districts/:id/neighborhoods` (`geo.routes.ts:18-19`). `user-app-standalone/api/geo.ts`
  exports countries/provinces/cityDistricts/settlements but **no neighborhoods function**, and the
  picker (`GeoSelectModal`, `LocationCard`) stops at city/district.

## Approach
Seven independent fixes, ordered **cheapest-and-safest first** so the card is useful even if it is
interrupted. The only DB change (item 2) is deliberately **last among the backend work** so that
everything else can ship without waiting on a migration.

Items 4, 5 and 7 are "wire up what already exists", not new features — the API and the push
payloads are already correct. Item 5 is the only one touching both apps.

## Steps
- [x] 1. **DONE 2026-08-02. Item 3 — birth-date keyboard jump.** It was **five** fields sharing the
  handler, not three: `userId`, `promoCode`, `birthDate`, `email` and the additional-phone input all
  called `scrollToEnd`, which scrolled to the bottom of the whole form. The client noticed it on the
  birth date; all five had it. Replaced with `rememberFieldOffset(key)` on each field's wrapping
  `inputGroup` (captures its `y` via `onLayout`) plus `scrollToField(key)` on focus, scrolling to
  `y - FIELD_SCROLL_MARGIN` (24) so the label stays readable. `scrollToEnd` is gone entirely.
  User app `tsc` **12 → 12**, zero errors in the touched file.
  ⚠️ Not verifiable from here — it is a keyboard/layout behaviour. Smoke test 11(c).
- [x] 2. **DONE 2026-08-02. Item 6 — hamburger icon.** New `components/MenuButton.tsx` — one small
  shared button (not the shared *header* the owner declined), sized to match the `backButton` the
  secondary screens already use so the two sit side by side with no per-screen tweaking. Added to
  the **five top-level screens**: MyBookings, MyPassengerOffers, SearchOffers, Notifications,
  Profile. Colour is a prop because two of them use green `#10B981` arrows and three use
  `#111827`.
  **Deliberately NOT added to `CreatePassengerOffer`, `EditProfile` (forms — navigating away
  would discard what the user typed) or `OfferDetails` (a drill-down where Back is the natural
  move).** Say the word if you want it on those too.
  User app `tsc` **12 → 12**; the two errors now reported in `MyPassengerOffersScreen` are
  **pre-existing** (`t()` typing at :114/:210 pre-fix, shifted to :115/:211 by the added import) —
  proven by `git stash`.
- [x] 3. **DONE 2026-08-02. Item 4 — unread badge.** Even less work than planned: a
  `contexts/NotificationContext.tsx` already exists exposing `unreadCount`, and it already reloads
  on token change **and** whenever a foreground push arrives (:96-113). So **the refresh-rule
  question the risk note raised answers itself** — no polling, no focus listener, no decision
  needed; the badge is live while the app is open and clears when the user reads them.
  Added a `mail-outline` icon + red count badge in the **Home header beside the avatar**, wrapped
  in a new `headerActions` row; `>99` renders as `99+`. Reused the existing `notifications.title`
  string for the accessibility label instead of adding three new translations for a label.
  User app `tsc` **12 → 12**.
  ⚠️ **Debt found, not fixed:** `MainStackParamList` (`navigation/types.ts:17-21`) still lists only
  **3 of the navigator's 9 routes**, so every screen navigates via `(navigation as any)` — MenuScreen
  already did this at :78. I matched that convention rather than widening this card; typing the
  navigator properly belongs in its own cleanup card.
- [x] 4. **DONE 2026-08-02. Item 7 — settlement + mahalla cascade.** The earlier read was wrong on
  one point, corrected here: **`fetchGeoSettlements` is not dead code** — `LocationCard.tsx:155`
  already calls it, so settlements worked in the trip picker. What was missing was **mahallas
  entirely**. Added `fetchGeoNeighborhoods` to `api/geo.ts` and a full mahalla level to
  `LocationCard`: state, loader effect, `PickerType`, `handleSelect` (incl. clearing it when
  province/district changes), picker title/options/selected-id, and the UI block. Shown only where
  the district actually has mahallas, exactly like settlements. New key
  `passengerOffers.selectNeighborhood` in `uz`/`ru`/`en`.
  ⚠️ **Mahalla is a *sibling* of settlement, not a child** — the API keys both off
  `city_district_id` (`GeoController:99, :117`), so the loader mirrors the settlement effect rather
  than chaining off it. Getting this wrong would have produced an always-empty list.
  `LocationValue` + `emptyLocation` + `buildLocationText` all gained the field, so the mahalla shows
  up in the saved `from_text` / `to_text`. User app `tsc` **12 → 12**.
  ⚠️ **Deliberate gap:** `PassengerOffer` has `from_settlement_id` / `to_settlement_id` but **no
  neighborhood id columns**, so the mahalla is saved as **text only**. That satisfies the request
  (it is selectable and it shows in the address) but it cannot be filtered on. Logged as **T-029**
  rather than bolted on — it is a second migration and a different concern from OR-010.
- [x] 5. **DONE 2026-08-02. Item 1 — one-of-three in the referral block.** A single derived
  `referralChoice` decides which field is active; the other two are **disabled and greyed**
  (`inputDisabled`) the moment one has a value, so the rule is *visible* rather than a surprise
  rejection at submit time. Clearing the active field re-enables the other two, so the user can
  switch without restarting the form.
  ⚠️ **Steps 5 and 9 were done together** — they are the same three fields, and building the
  one-of-three rule around only two of them would have meant rewriting it an hour later.
- [x] 6. **DONE 2026-08-02. Item 5 — push tap opens the message (user app).** New
  `services/PushService.setupNotificationTapHandler` covering **both** paths —
  `onNotificationOpenedApp` (backgrounded → resumed) and `getInitialNotification` (app **dead** →
  tap launched it). Missing either is the classic half-fix.
  New `utils/notificationRouting.ts` holds a module-level `navigationRef`, a type→screen map and a
  **parked-intent queue**. `RootNavigator` now passes the ref, flushes `onReady`, **and** re-flushes
  whenever auth/profile state changes — because `MainNavigator` (where every destination lives) does
  not mount until the user is authenticated *and* profile-complete, which can be seconds and an API
  round-trip after the tap.
  Route map from the API's real `notifyPassenger` types: booking events → `MyBookings`; driver
  responses to the passenger's own request → `MyPassengerOffers`; **anything unknown →
  `Notifications`**. Every destination is a param-less route that exists, so a malformed payload
  cannot navigate somewhere that isn't there.
- [x] 7. **DONE 2026-08-02. Item 5b — the same in the driver app.** Same two handlers, same parked
  queue. Its `RootNavigator` had a `useNavigationContainerRef()` that **nothing ever read** —
  replaced with the module-level ref, so the hook is gone rather than duplicated.
  Route map from the real `notifyDriver` types: `passenger_join_request` / `passenger_cancelled` →
  **`OfferPassengers` with the payload's `offer_id`**, which is the exact destination; the id is
  parsed and range-checked first and falls back to `OffersList`, so a garbage `offer_id` cannot
  push `NaN` into a screen that reads `route.params.offerId`. Driver-request outcomes →
  `Notifications`, honestly, because T-023/T-024 have not built their screens yet.
  ⚠️ Two `tsc` errors appeared here and were fixed: `navigate()`'s **two-arg** overload rejects the
  usual `as never` cast, so the call uses `(navigationRef.navigate as any)` — the same convention
  the rest of the app already uses. Caught by the baseline check, not by review.
- [x] 8. **DONE 2026-08-02. Item 2 backend — `referral_phone`.** New migration
  `20260802000002-add-referral-phone-to-users.cjs` (`.cjs` per the ESM gotcha): nullable
  `STRING(20)`, additive, and **re-runnable** — it `describeTable`s first, so a half-applied run on
  test3 does not block a retry. Added to `UserAttributes`, the `declare`s, the
  `UserCreationAttributes` optional list and `User.init`, plus the `UserController` update
  whitelist beside `promo_code` / `referral_id`. API `tsc` **282 → 282**, nothing new at the
  touched lines.
  🛑 **NOT run against any database.** `npm run db:migrate` is the owner's call — step 11.
- [x] 9. **DONE 2026-08-02. Item 2 app — grey placeholder, own number gone.** The phone field was
  `value={phoneNumber} editable={false}` — the user's **own** number. It is now a real input for
  the *referrer's* number: empty by default, `placeholder="+998901234567"` in the existing grey
  `placeholderColor`, `phone-pad`, sent as `referral_phone`.
  Rejects the user's own number using the **exact rule and message T-015 already established**
  (digits-only compare, `userDetails.errorPhoneOwnNumber`) — no new string needed.
  Also added to `registrationDraft` (type, `hasContent`, load and the debounced save), so a
  half-finished registration no longer loses it — the OR-006 behaviour applies to the new field too.
- [x] 10. **DONE 2026-08-02. Static verification.** All four at baseline, measured together:
  **API 282 · admin 0 · user 12 · driver 36 — zero new errors anywhere.** Where a touched file
  still reports errors they were **proven pre-existing by `git stash`** (user app: `t()` typing in
  `MyPassengerOffersScreen` at :114/:210 pre-fix; both apps: `PushService:146`).
  String sweep found **two hard-coded English labels I had just written** (`accessibilityLabel="Menu"`),
  now the new `menu.openMenu` key in all three locales.
  **30/30 runtime checks green** via `<scratchpad>/t027-i18n.mjs` — every key the new code depends
  on resolves to a real string in `uz`/`ru`/`en`, which `tsc` cannot check because `t()` takes an
  untyped `string` and returns the key itself on a miss.
- [ ] 11. **Owner: migrate, deploy, rebuild both apps, smoke test.** (a) only one referral field
  fillable; (b) own number absent, grey placeholder present, typed phone survives a save+reopen;
  (c) birth-date field visible with the keyboard open; (d) badge appears on a new message and
  clears when read; (e) tap a push in **both** apps, from background **and** from cold start;
  (f) hamburger opens the menu; (g) district → settlement → mahalla all populate.
- [ ] 12. **Commit** with a clear message, owner-approved.

## Files to touch (verified against the repo 2026-08-02)
- `user-app-standalone/screens/UserDetailsScreen.tsx` — items 1, 2, 3
- `user-app-standalone/api/geo.ts` — item 7 (new `fetchGeoNeighborhoods`)
- `user-app-standalone/components/passengerOffer/GeoSelectModal.tsx` + `LocationCard.tsx` — item 7
- `user-app-standalone/navigation/MainNavigator.tsx` — items 4, 6
- `user-app-standalone/api/notifications.ts` (read only — `unread` already returned) — item 4
- User app push wiring (locate the existing FCM registration in step 6) — item 5
- Driver app push wiring — item 5b
- **NEW** `api,admin,db/apps/api/src/database/migrations/<ts>-add-referral-phone.cjs` — item 2
- `api,admin,db/apps/api/src/database/models/User.ts` + `controllers/UserController.ts` — item 2
- Translation files in whichever apps gain strings (`uz`/`ru`/`en` each)

## Risks / open questions (READ before coding)
- ⚠️ **Item 2 changes what the phone field *means*.** Today it displays the user's own number as
  read-only confirmation. After this it collects **someone else's** number. If any other screen or
  the backend assumed that field was the user's own, this breaks it — grep before editing.
- ⚠️ **Item 5 is the riskiest.** Cold-start navigation is a classic source of crashes: the push
  arrives before the navigator exists. It must queue the intent, not navigate immediately. It also
  cannot be verified without a real device and a real push — no simulator shortcut.
- ⚠️ **Item 4's refresh rule is a real decision, not a detail.** If the badge only refreshes on
  screen focus, a push arriving while the app is open leaves it stale. Write the choice down.
- ⚠️ **Item 7 may be dead code, not a bug.** `fetchGeoSettlements` exists but nothing seems to call
  it. If the picker was never designed to go below district, this is a small feature, not a fix —
  confirm the intended depth before building three levels of cascade.
- ⚠️ **Migration timing.** The API is already deployed with T-025/T-026A. Adding a column means
  another deploy; the app change (step 9) must not ship before the column exists or saves will 400.
- ⚠️ **Nine cards are already parked awaiting device tests.** This card adds a tenth. Its step 11
  should be folded into the same session as the T-018 checklist walk rather than queued behind it.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`,
  `GRADLE_OPTS` truststore, `git -c http.sslBackend=schannel push origin main`).
- `.claude/settings.json` keeps picking up changes from permission prompts — keep it out of commits.

## Session notes (one line per work session)
- **2026-08-02** — plan approved and **steps 1–10 landed in one session**; all seven client items
  are implemented. Two of them were far cheaper than planned (a `NotificationContext` with a live
  `unreadCount` already existed; settlements were already wired) and two were bigger (the keyboard
  bug was **five** fields, not one; the push tap needed a parked-intent queue in **both** apps).
  Three follow-ups were found and logged rather than absorbed: **T-028** (stale
  `MainStackParamList`), **T-029** (no mahalla id columns). All four `tsc` baselines held.

## Resume point (for the next chat)
**Steps 1–10 are DONE. Only step 11 (owner: migrate, deploy, rebuild both apps, smoke test) and
step 12 (commit) remain — both are the owner's.** Nothing is committed.

⚠️ **Deploy order matters on this card:** run the migration **first**, then the API, then rebuild
both apps. The app already sends `referral_phone`; until the column exists the API's whitelist
simply drops it, so a user would type a referrer's number and watch it vanish silently.

All seven items are grounded with line numbers in **Current state** above and quoted verbatim in
`docs/OWNER_REQUESTS.md` OR-010 — a cold-start chat does not need to re-investigate them.

**Nothing here has run on a device, and item 5 (push tap) cannot be checked any other way** — it
needs a real push, tested twice: once with the app backgrounded and once with it **fully killed**,
which is the path that goes through `getInitialNotification` and the parked-intent queue.

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12**, driver app **36**.
