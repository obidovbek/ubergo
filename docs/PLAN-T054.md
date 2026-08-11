# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-045 moved intact → `docs/PLAN-T045.md`** (steps 1-5 done; only the owner's deploy + the
> commit remain). ✅ **T-024** → `docs/PLAN-T024.md`. ✅ **T-046** → `docs/PLAN-T046.md`.
> ✅ **T-044** → `docs/PLAN-T044.md`. ✅ **T-034 · T-043 · T-042 · T-041 · T-038 · T-048 · T-052 ·
> T-053 done** (several awaiting the owner's device test).
> 🔴 **T-047 PARKED BY THE OWNER** — killed-app push tap opens the main menu; needs a `logcat` line
> before more code.
> ⏸️ **T-040 · T-039 · T-037 · T-031 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own
> `docs/PLAN-T0*.md`; most are waiting on the owner, not on code.

## Task
- **ID / name:** T-054 — a confirmed ride must let the two people contact each other
- **Goal (definition of "done"):**
  1. After the passenger confirms a driver, the **passenger sees that driver's phone number** and can
     tap to call.
  2. The **driver sees the passenger's phone number** for the request that was confirmed, and can tap
     to call.
  3. **Nobody else sees anything new.** A `pending` / `rejected` / `cancelled` bid exposes no phone
     number in either direction — verified against the response, not just the screen.
  4. The **existing `payer_phone` leak is closed** (see below) — a driver with a pending request no
     longer receives it.
  5. `tsc` at baselines: API **281** · admin **0** · user **9** · driver **35**.
- **Why now:** the owner walked the flow end-to-end and it **dead-ends at the moment it should
  succeed**. T-024 closed the loop up to "accepted"; without a phone number the accepted ride cannot
  actually happen, so the whole passenger-offer feature stops one step short of working.

## What is already there (verified 2026-08-11 — do NOT re-derive)
✅ **The number is one plain column:** `users.phone_e164` (`database/models/User.ts:42`). The
`phones` table exists but **none of these flows read it** — do not involve it.
✅ **No migration. No new endpoint.** Three existing endpoints already carry the right rows:
`GET /passenger/offers/:offerId/drivers` (passenger view) and `GET /driver/join-requests` (driver
view), plus `POST /passenger/drivers/:id/confirm` which returns the updated row.
🔴 **`phone_e164` is in ZERO of the `User` includes.** All six are the identical four-field list
`['id', 'first_name', 'last_name', 'display_name']` — `OfferDriverService` lines **80, 178, 224,
231, 282, 431, 581, 640**. The apps cannot show what the API never sends.
🔴 **The codebase already gates phone numbers, and the gate is the model to copy:**
`PassengerOfferService.getOfferById:746` — `attributes: { exclude: isOwnerView ? [] : ['payer_phone'] }`
— with a comment naming the reason (*"a third party who never used the app"*).
🔴 **Pre-existing leak, found while scoping:** `getDriverJoinRequests:575` includes the whole
`PassengerOffer` with **no `attributes` filter**, so **`payer_phone` reaches every driver holding a
`pending` request** — the exact person `getOfferById` refuses it to.
✅ **App-side type to extend:** `user-app-standalone/api/passengerOffers.ts:86` `OfferDriver.driver`
(and the driver app's mirror). ⚠️ `driver` is **optional** — the T-042/T-024 trap; use the same
defensive read (`driverNameOf` / `passengerNameOf` are the precedent).
✅ **`tel:` precedent in BOTH apps:** `BlockedScreen.tsx:161` — `Linking.canOpenURL` → `openURL`,
with an alert fallback when no dialer exists.
❌ **Out of scope, log separately:** `OfferPassengerService` (driver's own offer → passenger books →
driver confirms) has **zero** `phone` occurrences — the same defect on the mirror flow.

## Approach
**Server first, gated at the source.** The rule *"a phone number is visible only inside a confirmed
pairing"* is enforced **in the service**, never in the app — an app-side `if` still ships the number
over the wire, and both apps would have to agree forever.

- **Passenger → driver's phone** (`getOfferDrivers`): include `phone_e164` on the `driver`, then
  **strip it from every row whose `status !== 'confirmed'`** before returning. The passenger sees one
  phone number at most, and only after they chose.
- **Driver → passenger's phone** (`getDriverJoinRequests`): include `phone_e164` on `offer.user`,
  strip it from every row whose own `status !== 'confirmed'`, **and** add the missing `attributes`
  filter so `payer_phone` stops shipping (goal 4).
- **Apps:** one small "contact" block on the confirmed row in each app, reusing the `BlockedScreen`
  dial pattern. No new screens.

## Steps
- [x] 1. **DONE 2026-08-11. `OfferDriverService.gatePhones()`** — one private helper, so the two
  endpoints cannot drift. Takes the rows and a `contactOf` picker (the two callers nest the number
  differently: `row.driver` vs `row.offer.user`) and deletes `phone_e164` from anything not
  `confirmed`. ⚠️ It edits the **plain object** from `get({ plain: true })`, never the model
  instance — the risk the plan flagged, and the suite asserts the original instance is untouched
  while the returned object carries nothing.
- [x] 2. **DONE 2026-08-11. `getOfferDrivers`** — `phone_e164` added to the `driver` include and the
  result passed through the helper. 🔴 This endpoint returns **every** bid, so the suite's defining
  check is 4 rows in / exactly 1 phone out.
- [x] 3. **DONE 2026-08-11. `getDriverJoinRequests`** — same treatment on `offer.user`, **plus the
  `payer_phone` leak closed**: the `PassengerOffer` include now carries
  `attributes: { exclude: ['payer_phone'] }`. It had none at all, so a merely `pending` driver was
  receiving the number `getOfferById` deliberately withholds.
- [x] 4. **DONE 2026-08-11. User app** — `OfferDriversScreen`'s confirmed row gains a green contact
  block with a tap-to-call button; the "no number on file" case renders a sentence instead of a dead
  button.
- [x] 5. **DONE 2026-08-11. Driver app** — the same block on a `confirmed` row of
  `MyJoinRequestsScreen`, **and** under the confirmed banner of `PassengerOfferDetailsScreen`, which
  does get it for free from its existing `/driver/join-requests` lookup.
  🔴 **The number had to come from `myJoin.offer`, NOT the screen's own `offer`** — that one is
  fetched from the PUBLIC detail endpoint, which carries no phone for anybody. Reading the obvious
  variable would have shown "no number on file" forever.
  ⚠️ New `passengerPhoneOf()` helper rather than a bare `offer.user.phone_e164`: both hops are
  optional and the mapped `passenger` shape has no phone field — the T-042 crash expression exactly.
- [x] 6. **DONE 2026-08-11. i18n** — a shared `contact` block (`noPhone`, `dialFailed`) plus
  `offerDrivers.contactTitle`/`noPhone` and `myJoinRequests.contactTitle`/`noPhone`, in uz/ru/en of
  both apps. **268/268 evaluated** (not grepped), including every `t()` key the touched files call
  and a check that the three locales are not the same string.
- [x] 7. **DONE 2026-08-11. 340/340 across three suites, all proven able to fail.**
  `tsc` API **281** · admin **0** · user **9** · driver **35** — all at baseline; the 5 errors in the
  touched API file **proven pre-existing via `git stash`** (identical lines 164/291/440/453/525) and
  **zero** errors in any touched app file.
  **38/38** over the **real transpiled `OfferDriverService`** (esbuild bundle, dependencies stubbed
  through `Module._load`) — the actual `getOfferDrivers` and `getDriverJoinRequests`, not the helper
  alone — asserting the include really requests the column, that ownership still 403s, that an
  unknown status **fails closed**, and that `JSON.stringify` of each response contains no
  unconfirmed number. **Proven able to fail: 20 red against pre-change code**, incl. the
  `payer_phone` leak. ⚠️ The suite carries a stand-in for the missing helper so the pre-change run
  **reports red instead of crashing** — the 2026-08-11 lesson written into the harness.
  **34/34** over both apps' real `contactPhone` util. **4 red** against a variant that reinstates
  the `canOpenURL` gate.
- [ ] 8. **Owner:** deploy the API, rebuild both apps, walk accept → both sides see + can dial.
- [ ] 9. Commit (only after the owner's approval).

## Files to touch
- `api,admin,db/apps/api/src/services/OfferDriverService.ts` — the gate helper + 2 endpoints
- `user-app-standalone/api/passengerOffers.ts` · `driver-app-standalone/api/passengerOffers.ts` — types
- `user-app-standalone/screens/OfferDriversScreen.tsx` — passenger's contact block
- `driver-app-standalone/screens/MyJoinRequestsScreen.tsx` (+ maybe `PassengerOfferDetailsScreen.tsx`)
- `{user,driver}-app-standalone/i18n/locales/{uz,ru,en}.*` — new keys ×3 locales ×2 apps
- ❌ **No migration.** ❌ No new route. ❌ `routeForNotification` untouched.

## Risks / open questions (READ before coding)
- 🔴 **This card ADDS personal data to an API response — the one thing that must not be got wrong.**
  Every new field is gated on `status === 'confirmed'` **server-side**. An app-side hide is not a fix.
- 🔴 **`getOfferDrivers` returns EVERY bid, not just the winner** (`where: { offer_id }`, no status
  filter). An ungated include hands the passenger the phone number of every driver who ever bid.
- 🔴 **The rows are raw Sequelize models**, so blanking a field must survive serialisation — set it
  on the plain object (`.toJSON()` / `get({ plain: true })`), not on a model instance whose getter
  still returns the column. **This is exactly where a "fix" silently does nothing.**
- ⚠️ **`phone_e164` can be `null`** (Google SSO signup). Both screens need the empty case.
- ⚠️ **`OfferDriver.driver` and `offer.user` are OPTIONAL** — a bare `.driver.phone_e164` is the
  T-042 launcher crash. Read defensively.
- ⚠️ **Both apps carry near-identical screens** — every app change is made twice.
- ⚠️ **A FOURTH card now needs the same API deploy** (T-034, T-043, T-045, this one). Still no
  migration in any, so they deploy together safely.
- ❓ **Open question 1 — which number?** `phone_e164` only, or also `additional_phones`?
  **Recommendation: `phone_e164` only.** The extra numbers were added for the user's own contacts
  (T-015), not for publishing to a counterparty.
- ❓ **Open question 2 — does the passenger keep seeing the number after the ride, or should a
  `cancelled` offer revoke it?** **Recommendation: gate on the join row's `confirmed` status only**
  (simplest, and matches "we introduced you, now it's your business").
- ❓ **Open question 3 — the mirror flow** (`OfferPassengerService`) has no phone anywhere either.
  **Recommendation: log it as T-055 and do it separately**, so this card stays small and testable.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).

## Session notes (one line per work session)
- **2026-08-11** — card opened from the owner's item E. Grounded: **no migration, no new endpoint** —
  `phone_e164` is simply missing from all six `User` includes in `OfferDriverService`. Found a
  **pre-existing `payer_phone` leak** to pending drivers in `getDriverJoinRequests` and folded it in.
- **2026-08-11 (2)** — approved with all three recommendations. **Steps 1-7 done.** The open
  questions resolved as: `phone_e164` only · gate on the join row's `confirmed` status · the mirror
  flow logged separately as **T-055**.

## Resume point (for the next chat)
**Steps 1-7 DONE 2026-08-11. Only step 8 (owner: deploy + rebuild + walk) and step 9 (commit)
remain.**

**What changed:** the two endpoints now send `phone_e164`, and `gatePhones` deletes it from every row
that is not `confirmed` — so the passenger gets exactly one number (the driver they chose) and a
driver gets one only for the request that was accepted. Both apps show it as a tap-to-call button on
the confirmed row.

🔴 **Two defects were found while building, neither of them the reported symptom:**
1. **`getDriverJoinRequests` was leaking `payer_phone`** to any driver with a `pending` request — the
   include had no `attributes` filter at all. Closed here.
2. **The `BlockedScreen` dial pattern this card was going to copy is broken on Android 11+.** It
   gates on `Linking.canOpenURL('tel:…')`, which needs a `tel` entry in the manifest's `<queries>`;
   both manifests declare only `https`, and Expo 54 targets SDK 35. `contactPhone.ts` therefore calls
   `openURL` directly. **`BlockedScreen` itself is still uncorrected — logged as T-056.**

🛑 **A FOURTH card now shares one API deploy: T-034, T-043, T-045, T-054.** No migration in any.
**What to check after deploying:** accept a driver, then confirm the passenger sees that driver's
number *and* that the other drivers' rows show none.

**Baselines:** API **281** · admin **0** · user **9** · driver **35**.
