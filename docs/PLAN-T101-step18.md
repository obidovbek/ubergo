# 📋 PLAN — T-101 step 18: `DriverMyOrder.dc.html` → the driver's rides screen

> Split out of `docs/PLAN.md` on **2026-09-12**, the way steps 16 and 17 were: the artboard was
> measured before the card was believed, and the card described a different screen.
> The parent card in `PLAN.md` stays unchecked and points here.
>
> ✅ **OWNER APPROVED ALL SEVEN DECISIONS (§3) ON 2026-09-12 ("ok"). STEP 18 IS CLOSED** —
> 18a-18f all done the same day. 🛑 **Nothing in it has run on a device.**

---

## 1. What this actually is

| | |
|---|---|
| artboard | `htmlDesign/DriverMyOrder.dc.html` — **1 036 lines**. The copy in `uploads/Chek_28082026/` is OLDER (no visibility note, no per-route actions, no route-cancel sheet, no price formula). **The root copy wins.** |
| card said | `DriverMyOrder` = "the driver's ACCEPTED RIDES" from `OfferPassengersScreen` + the confirmed join requests; first question: the third tab |
| the artboard IS | **the driver's OWN OFFERS (`ROUTES`, one per e'lon), each an expandable card with ITS passengers nested inside**, in three modes: **Jarayonda** (still collecting) · **Faol buyurtmalar** (full, confirmed) · **Buyurtmalar tarixi** (done or cancelled) |
| in the app today | **`OffersListScreen`** (472 lines, the TAB, `getDriverOffers`) **+ `OfferPassengersScreen`** (872 lines, a pushed detail, `getOfferPassengers` / confirm / reject) — two screens, one journey |

🔴 **THE CARD WAS WRONG, AND SO WAS STEP 17h — only the data model showed it.** The artboard's
`ROUTES[]` carry `seatsTotal`, `state: Yig'ilmoqda / Rejalashtirilgan / Yakunlangan` and a `pax[]`
list; the phase is computed **per route**, not per passenger. That is an OFFER with its
passengers, not a list of accepted join requests. Two consequences:

1. **The third-tab question dissolves.** The artboard's third tab ("Mening buyurtmalarim") and the
   app's third tab (`OffersList`, "Buyurtmalarim") are **the same screen**: the driver's own e'lons.
   Nothing moves in the tab bar; the tab's screen gets rebuilt.
2. **Step 17h's premise was wrong.** It converted `OffersListScreen` "values only" because "no
   artboard draws it". **`DriverMyOrder` draws it** — as a merge with the passengers screen. The
   17h work is not lost (the chrome and `PanelTabs` carry over) but the screen is rebuilt here, and
   the 17h note in `PLAN.md` / `PLAN-T101-step17.md` is corrected by this file.

**The shape is step 9 (user) and step 17 (driver) again:** two screens that sliced one journey by
SOURCE become one list sliced by *"where is this ride in its life?"*. It is the third merge of
this card.

⚠️ **The artboard's phases are DERIVED, and the app can derive them too.** `phaseOf(r)` is
`cancelled → tarix · done → tarix · confirmed → aktiv · else jarayon`. The server has no
"confirmed" or "done" offer status (`published · archived · cancelled` only), **but it has
`seats_free`**, decremented at passenger confirm (`OfferPassengerService.ts:388`). So:
**Jarayonda = published with seats free · Faol = published with 0 free · Tarix = archived or
cancelled.** No new state, nothing fabricated — see decision ②.

---

## 2. What has a backend, and what does not

**✅ Backed — build these** (driver app `api/driverOffers.ts`, `api/offerPassengers.ts`, verified 2026-09-12):

| artboard element | backing |
|---|---|
| the routes list, route text, date/time, seats, price | `getDriverOffers` → `DriverOffer` (`from_text · to_text · start_at · seats_total · seats_free · price_per_seat · status · stops`) |
| `band o'rindiq` `3/4` | `seats_total - seats_free` — **confirmed seats only**; pending requests do not hold a seat |
| the passengers under a route, their status | `getOfferPassengers(offerId)` → `pending · confirmed · rejected · cancelled`, `seats_requested`, `is_front_seat`, `agreed_price_per_seat`, `total_agreed_price`, `message` |
| `Qo'ng'iroq` | `passenger.phone_e164` — **present ONLY on a confirmed row** (T-055, server-stripped) |
| the price formula `130 000 × 2 kishi` | `agreed_price_per_seat × seats_requested = total_agreed_price` |
| confirm a passenger | `confirmPassenger(id)` |
| **`Buyurtmani bekor qilish` with the 9 reasons** | **`rejectPassenger(id, reason?)` — the reason column EXISTS.** The artboard's `CANCEL_REASONS` are a reject sheet for a pending request. Real match. |
| `Reysni bekor qilish` | `cancelDriverOffer(id)` — published only; **notifies every confirmed passenger** |
| edit / archive / delete | `updateDriverOffer` (via the wizard, T-078) · `archiveDriverOffer` (any status) · `deleteDriverOffer` (archived/cancelled only) |
| `kutilayotgan daromad` / `olingan daromad` | Σ `total_agreed_price` over **confirmed** passengers — derivable once the passengers are loaded |
| refresh when a request lands | `subscribePushReceived(['passenger_join_request','passenger_cancelled'])` (T-068) |
| `To'lov turi` | `payment_cash` / `payment_card` on the offer |
| `Jo'natma` tag on a route | `parcel_accepted` flag — the flag only, no parcel orders |

**🛑 Not backed — NOT built; boarded as T-110** (rule of 2026-09-01: no fabricated state):

| artboard element | why not |
|---|---|
| per-passenger delivery steps `Kutilmoqda → Mashinada → Yetkazildi` with `Oldim / Yetkazdim` | no column; `OfferPassenger.status` is the booking's state, not the ride's |
| the `PARCELS` list per route with its own 3 steps | no parcel-order model anywhere; the parcel kind is an out-of-scope role (owner 2026-08-30) |
| `Xabar` — in-app message, quick replies, sent/delivered/read ticks | no chat, no message endpoint |
| `Budilnik` ping | no endpoint, no push type |
| `Reysni bekor qilish` **with a reason** | `POST /:id/cancel` reads no body; the reason would be typed and dropped |
| a "confirm the trip is full" action that hides the e'lon | no offer state for it — the phase is derived instead (② below) |
| `Faol e'lon: 2 / 2` limit chip | **no server limit exists** (`DriverOfferService` grep: nothing) — a limit the server does not enforce is decoration |
| passenger `★ 4,8`, pickup / drop-off addresses | no rating model (T-109 ②); the join carries a free-text `message`, not addresses |
| `Yakunlangan` as a stored state | no `completed`; archive is the nearest thing (③ below) |

⚠️ **`api/rides.ts` (`startRide · completeRide · cancelRide(reason)`) is DEAD** — the server's
`/rides` router is commented out (`routes/index.ts:149`). It looks like the missing backing for
"Yakunlash" and "cancel with reason"; it is not. Do not wire it.

---

## 3. ✅ Owner decisions — ALL SEVEN RECOMMENDATIONS ACCEPTED 2026-09-12 ("ok")

| # | question | recommendation |
|---|---|---|
| ① | **The third tab.** Artboard: "Mening buyurtmalarim" → own e'lons with passengers. App: `OffersList`, "Buyurtmalarim" → own e'lons. Same thing. | **Keep the tab where it is; rebuild its screen as the merge.** Label stays "Buyurtmalarim" (the long form does not fit a 5-tab bar; step 3's `BottomTabBar` already truncates). No `MainTabs` change. |
| ② | **The three phases.** Artboard stores "confirmed"; the server has no such state. | **Derive:** Jarayonda = `published && seats_free > 0` · Faol = `published && seats_free === 0` · Tarix = `archived ∪ cancelled`. The artboard's `Buyurtma to'ldi / O'rindiqlar to'lmagan` button becomes a **readout**, not an action. A confirmed passenger cancelling drops the ride back to Jarayonda — which is true. |
| ③ | **A past-dated published ride.** The artboard's `Yakunlangan` needs a "done" the server lacks. | Stays in its phase with an **"o'tgan" hint** and the existing **Archive** action ("Yakunlash" = archive, which is what the old screen already did). No auto-archive on the client — that is a server job if wanted (T-110). |
| ④ | **Passengers per route: N+1.** The artboard shows pax count + money on every collapsed card. | **Lazy:** seats come from the offer (`seats_total - seats_free`, backed on the list call); passengers and money load **when a card is expanded** (and for the card a push names). One route expanded by default, like the artboard. The list call stays one request. |
| ⑤ | **The passenger sheet.** Artboard: detail rows, status stepper, ping, message, cancel-with-reason. | Build **what is backed**: name, seats + front-seat, the price formula, booking status, `message`, phone (confirmed only, T-055), **Tasdiqlash**, and **Rad etish with the artboard's 9 reasons → `rejection_reason`** ("Boshqa" → free text, required). No stepper, ping, or message button (§2). |
| ⑥ | **Merge into ONE new tab screen** `screens/MyRidesScreen.tsx` ("reys" is the artboard's word). Route `OffersList` (the tab) → it; **`OfferPassengers { offerId }` → it, with that ride expanded and its passengers loaded** so pushes (`notificationRouting.ts:47`) keep landing. `OffersListScreen`, `OfferPassengersScreen`, `OfferCard`, `OfferDetailModal`, `StatusFilterTabs` → orphans on **T-105**, not deleted (rule 4). | **Yes** — 17g's pattern. |
| ⑦ | **`OfferDetailModal` (832 lines).** The artboard has no offer-detail sheet — the expanded card IS the detail. | **Drop it**: expanded card shows route, stops, time, seats, prices, payment, flags; a pencil opens the wizard (T-078 edit path, untouched). Cancel / archive / delete live on the expanded card as the artboard draws them (cancel + one more). |

---

## 4. Steps

> Each leaves the app runnable (rule 2). **Rules before rendering, as in 8f / 16a / 17a.**

- [x] **18a. The rules, pure, before any pixel. ✅ DONE 2026-09-12.**
      ✅ **`utils/myRides.ts` (new, ~250 lines, pure)** — everything listed below, plus
      `canPublish` (the server lets an archived/cancelled offer be RE-PUBLISHED — the old locale
      even says so — so Tarix cards get a reactivate action), `groupByPhase`, `sameOfferId`
      (push ids are strings, T-085) and `defaultExpandedId`. **The visibility note was dropped:**
      the artboard claims a full e'lon "is invisible to passengers"; nothing verified that the
      search hides it, so the card shows the fill READOUT only (decision ②) — no copy that
      claims what the server may not do.
      ✅ **`scripts/check-my-rides.mjs` — 64 assertions, PROVEN RED ON 11 MUTATIONS.** 🔴 One
      mutation stayed green at first: flipping ONE of the two NaN branches in `sortRides` made
      the comparator inconsistent and the engine still landed the fixture right. The real
      mutation flips both → red. *Not a weak assertion this time, an invalid mutation — but the
      same lesson: read WHY it stayed green before moving on.*
      ✅ **25 keys × 3 locales under `myRides.*`** (phases, empties, states, fill readout, income
      labels, the 9 reasons); booking statuses and seat labels reuse `offerPassengers.*`.
      `check-offer-i18n.mjs` sweeps the module → **207 keys × 3 = 621 lookups green.**
      ✅ Baselines: **`tsc` 28 · lint 0 / 275** (new files lint clean, full run unchanged).
      Original scope: `ridePhase(offer)` (②) ·
      `phaseLabelKey` · `seatsTaken` · `rideStats(offer, passengers?)` (taken/total, order count =
      pending+confirmed, money = Σ confirmed `total_agreed_price`, coerced — DECIMAL strings) ·
      `isPast(offer, now)` (③) · `canEdit / canCancel / canArchive / canDelete` lifted verbatim from
      `OffersListScreen`'s handlers (edit refuses archived/cancelled; cancel = published; delete =
      archived/cancelled) · `passengerPriceFormula` · `seatLabelKey(is_front_seat, seats)` ·
      `REJECT_REASON_KEYS` (9) + `validateReject(reasonKey, otherText)` · `sortRides(phase)`
      (jarayon/faol: soonest first; tarix: newest `updated_at` first) · `bookingTone(status)`.
      `scripts/check-my-rides.mjs` — assertions **proven red by mutation**, each restored and
      byte-compared. Fixtures must NOT divide evenly (17a's ceil/floor lesson).
- [x] **18b. The gradient ride card. DONE 2026-09-12.**
      **`components/rides/MyRideCard.tsx`** (new) — the artboard's card at radius 24 with the
      158deg gradient via `expo-linear-gradient`, the three stat tiles, the state pill, the fill
      READOUT (decision ②, not a button), the past-departure hint, the cancelled-reason strip and
      the action row gated by 18a.
      **THE PLAN'S CONTRAST WORRY WAS BACKWARDS, AND MEASURING IS WHAT SHOWED IT.** This step
      was written to check "white on `#25A445`". The artboard puts **DARK** ink (`#0C2A14`) on a
      **LIGHT** green gradient; white would measure 2.2:1. **26/26 pairs pass AA** against the
      bundled palette, worst 3.91:1 on a 3:1 icon floor. *The step's own premise was the thing
      that needed checking.*
      **Only THREE new colour tokens, because five candidate inks folded onto existing ones**
      (stat value -> `rideInk`, stat label -> `text.secondary`, state pill -> `actionPressed`,
      open readout -> `rideInk`) and every fold was re-measured, not assumed: `rideGradient`,
      `rideGradientOff`, `rideInk` — then three more after the token checker caught 9 inline
      `rgba()` overlays (`rideTile`, `rideTileSoft`, `rideWell`). Added to **both** palettes.
      `rideTile` deliberately FOLDS the artboard's `.92` and `.93` — 1% apart, indistinguishable,
      an artboard inconsistency rather than two intentions.
      **The token checker did its job:** 3 -> 12 literals, exit 1, then back to 3 at the ceiling.
      **NAMED `MyRideCard`, NOT `RideCard`** — `components/cards/RideCard.tsx` already exists as
      an orphan (T-105). Two files with one basename is the twin trap this project keeps hitting.
      Original scope:
      **18b. `RideCard`** (`components/rides/RideCard.tsx`) — the gradient card, measured from
      artboard lines ~121-200: radius 24, `linear-gradient(158deg, #66D46D, #25A445)` via
      `expo-linear-gradient` (approved; `TopBar` already uses it), the grey gradient for cancelled,
      route 15/800 on light ink, `when` mono, state pill, the three stats, the chevron, the
      visibility note (Jarayonda only, readout per ②), the action row (readout + cancel / archive /
      delete / pencil by phase). **Measure white-on-gradient contrast against the DARK end before
      committing the ink** — `#25A445` is near the 3:1 floor; if it fails, the card body goes on a
      tint with dark ink, recorded as a deviation.
      🔴 New gradient tokens if any go in **both** palettes + `DESIGN-TOKENS.md` §4.5.
- [x] **18c. The passenger row and the two sheets. DONE 2026-09-12.**
      **`BookingRow`** (42px disc, name, status pill, the join `message`, seat label + price,
      and only the actions that exist: call on a confirmed row with a number, reject, confirm),
      **`BookingSheet`** (the inset detail panel with the key/value block and the
      `130 000 x 2` price formula) and **`RejectReasonSheet`** (the artboard's nine reasons
      verbatim, "Boshqa" opening a required free-text field).
      **THE NINE-REASON SHEET IS FULLY BACKED — verified at the source, not assumed.**
      `OfferPassengerService.ts:527` writes `rejection_reason` and `:536` puts it in the
      passenger's push payload. (The `exclude` at `:760` hides the OFFER's moderation column on
      the passenger's own listing — a different column; checked before trusting it.)
      **The artboard attaches these reasons to cancelling an ACCEPTED order, which has no
      endpoint.** They were moved to the reject of a PENDING request — the real action with a
      real reason column. The reasons themselves are unchanged.
      Dropped, each with no backend: the delivery stepper, `Budilnik`, `Xabar`, the pickup /
      drop-off rows (a join carries a free-text message, not addresses) and the rating. -> T-110.
      Original scope:
      **18c. `RidePassengerRow` + `PassengerSheet` + `RejectReasonSheet`.** The row: initials
      disc, name, status pill (tone from 18a), seat label, price mono; tap → the sheet. The sheet
      per ⑤. The reasons sheet: the artboard's radio list (measured lines ~388-419), "Boshqa" →
      `TextInput`, confirm disabled until valid (18a). Nine keys × 3 locales under `myRides.*`.
- [x] **18d. The merged screen. DONE 2026-09-12.**
      **`screens/MyRidesScreen.tsx` (new, ~470 lines)** — `TopBar` (flat, tab variant) +
      `NavDrawer`, `SegmentedModes shape="pill"` over the three derived phases with counts, the
      ride list with passengers loading lazily on expand (decision ④), both sheets, the create
      button, pull-to-refresh.
      **Every handler carried over and grepped for in the diff**: `cancelDriverOffer` ·
      `publishDriverOffer` · `archiveDriverOffer` · `deleteDriverOffer` · `confirmPassenger` ·
      `rejectPassenger`, plus T-028's paramless create and boundary `Number()`, T-055's phone
      gate, T-068's push refresh and T-078's edit route.
      **Two things the merge forced that neither old screen needed:** confirming a passenger can
      move the ride to another phase under the driver's finger, so the offers list is refreshed
      after every booking action; and a push about a ride in Tarix now has to SWITCH the phase,
      or it would open an empty Jarayonda list.
      **One lint warning of mine** (`bookingsBusy` set and never read — the row list keys its
      spinner off `null`) found by the full run, and removed. Back to 275, never rebaselined up.
      Original scope:
      **18d. `MyRidesScreen`.** `TopBar` tab variant + `NavDrawer` (as `OffersListScreen` has
      now), `SegmentedModes` × 3 (measure the artboard's shape — its mode strip is `border-radius:
      99px` → `shape="pill"`), the list of `RideCard`s with lazy passengers (④), empty state per
      mode (`Jarayondagi reys yo'q · Faol reys yo'q · Buyurtmalar tarixi bo'sh`), pull-to-refresh,
      **both push refreshes kept** (offers list per 17h's note; passengers per T-068, scoped by
      `offer_id`), the "+ e'lon" entry to the wizard kept. Every existing handler carried over —
      **grep the diff for `cancelDriverOffer · publishDriverOffer · archiveDriverOffer ·
      deleteDriverOffer · confirmPassenger · rejectPassenger`** before calling it done.
- [x] **18e. Routing. DONE 2026-09-12.**
      `MainTabs`: the `OffersList` tab renders `MyRidesScreen`. `MainNavigator`:
      `OfferPassengers { offerId }` renders it too, opening that ride's card — 17g's pattern,
      the names stay so `notificationRouting.ts` and the wizard keep landing.
      **`check-drawer.mjs` green** (10 routes valid and paramless).
      **The five old files are a CLOSED DEAD CLUSTER, verified rather than assumed:**
      `screens/index.ts` re-exports `OffersListScreen` and **is imported by nothing**;
      `components/offers/index.ts` is imported **only by `OffersListScreen`**. So all five come
      out together -> T-105. Not deleted (rule 4).
      Original scope:
      **18e. Routing.** `MainTabs`: `OffersList` → `MyRidesScreen`. `MainNavigator`:
      `OfferPassengers { offerId }` → `MyRidesScreen` with `expandOfferId` (17g's pattern — the
      names stay, the files change). `check-drawer.mjs` must stay green.
- [x] **18f. Checkers, baselines, board. DONE 2026-09-12.**
      `check-offer-i18n.mjs` extended to the five new files -> **241 keys x 3 = 723 lookups
      across 15 files**, and **PROVEN RED once per locale** (uz `cancelRide`, en `stateDone`,
      ru `incomeEarned`), each restored and byte-compared.
      **The prover's FIRST version silently found nothing** — these locale files are CRLF and the
      anchors ended in a bare newline. It reported "anchor missing" and exited 1 rather than
      passing, which is the only reason it was caught. *Same family as the 16f backslash loss: a
      proof that cannot match its own anchor proves nothing.*
      **`expo export` clean** — 5.09 MB Android bundle, so the new screen really is in it.
      **T-110 boarded** (seven unbacked artboard features); **T-105 extended** with the cluster.
      Original scope:
      **18f. Checkers, baselines, board.** `check-offer-i18n.mjs` gains the four new files
      (`myRides` prefix + `offerPassengers` + `driverOffers` + `common` + `errors`); prove it red.
      Baselines (§5). Orphans → T-105 (five files, each in `check-font-weights.mjs`'s exempt list
      with the card as reason). **T-110 boarded** (§2's unbacked table). PLAN.md step-18 card
      closed; the 17h "no artboard" note corrected in both plan files; journal.

---

## 5. Baselines — never rebaseline upward

Driver `tsc` **28** · lint **0 errors / 275 warnings** · tokens **3** · `check-font-weights` ·
`check-drawer` · `check-offer-i18n` (182 keys) · `check-passenger-orders` (69) · the three wizard
checkers · `expo export`. Measure lint by scoped `git stash` before/after, as in 17h.

---

## 6. Risks and traps, recorded up front

- **`seats_free` counts CONFIRMED seats only.** A ride with four pending requests and no confirm
  reads `0/4 band` and sits in Jarayonda. That is correct, and it is not what the artboard's
  fixture implies (its pending passengers hold seats). Do not "fix" it in the client.
- **Phase flips are live.** Confirming the last seat moves the card from Jarayonda to Faol under
  the driver's finger. Keep the expanded card expanded across the move (key by offer id, not index).
- **DECIMAL strings** (`total_agreed_price`, `price_per_seat`) — one coercion point in 18a.
- **The gradient card's ink.** Every other artboard card is on `surface`; this one is the only
  white-on-green body in the driver app. Measure, do not assume (§4 18b).
- **`OfferPassengers` is a push target.** `notificationRouting.ts:47-48` navigates there with
  `{ offerId }` as a **string** — coerce before matching against `offer.id`.
- ✅ **The reject reason IS stored and delivered** — verified 2026-09-12:
  `OfferPassengerService.ts:527` writes `rejection_reason` and `:536` puts it in the passenger's
  push payload. (The `exclude` at `:760` is the OFFER's admin-moderation column on the passenger's
  listing, not the booking's reason.) So the 9-reason sheet reaches the passenger for real.

---

## 7. Session notes

### 2026-09-12 (3) — 18b-18f: step 18 closed in one day

Six components and one screen: `MyRideCard` (the only gradient card body in either app),
`BookingRow`, `BookingSheet`, `RejectReasonSheet`, `MyRidesScreen`, plus the routing. Six new
colour tokens in both palettes, 31 keys × 3 locales, two checkers extended and both proven red.

**Three things measuring corrected, and each would have shipped wrong:**
① **This step's own contrast premise was backwards** — the plan said "measure white on
`#25A445`"; the artboard's ink is DARK on a LIGHT green. White measures 2.2:1.
② **Five candidate new tokens folded onto existing ones** once re-measured, so the palette grew
by three, not eight — then by three more only because the token checker caught inline `rgba()`.
③ **The i18n prover's first version matched nothing** (CRLF files, anchors ending in a bare
newline). It said so and exited 1 instead of passing green.

**A name collision was avoided on purpose:** `components/cards/RideCard.tsx` already exists as an
orphan, so the new card is `MyRideCard`.

🛑 **NOT SEEN ON A DEVICE — and this screen replaces the driver's most-used tab.** Together
with step 17, the whole driver-app rebuild since 8e is unwalked. That is the gate before step 19.


### 2026-09-12 (2) — 18a: the rules, and a mutation that was wrong rather than the test

Owner accepted all seven recommendations ("ok"). `utils/myRides.ts` + `check-my-rides.mjs`
(64 assertions, 11 mutations red, file restored byte-identical), 25 keys × 3 locales, i18n sweep
at 207 keys. Publish turned out to mean "reactivate from history" on the server — added as a
Tarix action. Baselines `tsc` 28 · lint 275 hold. **Next: 18b, the gradient `RideCard` — measure
white-on-`#25A445` before committing the ink.**

### 2026-09-12 — scoped and split; no code written

Measured `DriverMyOrder.dc.html` before trusting the card. The card said "accepted rides from the
join requests"; the artboard's data model is the driver's own offers with passengers nested, in
three DERIVED phases — `OffersListScreen` + `OfferPassengersScreen` merged. The third-tab
question dissolves (same screen), and step 17h's "no artboard draws OffersList" was wrong.
Backend: no delivery steps, no parcels, no chat, no ping, no cancel reason, no offer limit, no
completed state; `api/rides.ts` is dead (`/rides` router commented out). **Passenger reject WITH a
reason IS backed** — the artboard's 9-reason sheet has a real home. Seven decisions in §3.
