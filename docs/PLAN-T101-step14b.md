# 📋 PLAN — T-101 step 14b: `UserQidiruv.dc.html` → the passenger's search screen

> Written **2026-09-12**, after the owner reported that the user app's search screen does not
> look like its artboard. **They are right, and this plan file is the step that never existed.**
> The parent card in `PLAN.md` (step 7) has been retitled to say what it really did.
>
> ✅ **OWNER APPROVED ALL FIVE DECISIONS (§3) ON 2026-09-12 ("ok"). STEP 14b IS CLOSED** —
> 14b-1 to 14b-6 all done the same day. 🛑 **Nothing in it has run on a device.**

---

## 1. What this actually is

| | |
|---|---|
| artboard | `htmlDesign/UserQidiruv.dc.html` — **1 202 lines** |
| in the app today | **`SearchOffersScreen.tsx` — 1 634 lines**, geo cascade, saved searches, the join flow |
| what step 7 did | **COLOURS ONLY.** 125 insertions / 124 deletions, every line a colour plus one import. Its own body said so; its title said "`SearchOffersScreen` -> `UserQidiruv`" and it was ticked. |
| why it slipped | The tick and the title read as a rebuild. **Two other places in `PLAN.md` said plainly this screen has NO step and needs one called 14b.** The tick won. *Fifth time a card in these files has disagreed with its own body — the pattern the board-vs-prose warnings keep catching.* |

**Measured state of the screen today:** it uses **none** of the shared chrome — no `TopBar`, no
`NavDrawer`, no `SegmentedModes`, no `Chip`. Its file header still reads *"Redesigned with modern,
clean UI"*, from the design that predates the artboards.

🔴 **AND IT IS A TWO-MODE MERGE, LIKE EVERY OTHER BIG SCREEN ON THIS CARD.** The artboard's
`state.mode` is `qidiruv | takliflar` (lines 722, 880):

- **`Qidiruv`** — *Mos haydovchilar*: driver offers matching the passenger's need. That is
  `SearchOffersScreen`.
- **`Takliflar`** — *Haydovchilardan kelgan takliflar*: drivers who bid on the passenger's own
  order. **That is `OfferDriversScreen`.**

**This is the fourth merge of T-101** (step 9 user, 17 driver, 18 driver, now 14b).

⚠️ **BUT `OfferDriversScreen` WAS ALREADY REBUILT — step 10, 2026-09-03.** Step 10's own card says
*"The artboard specifies neither"* and rebuilt it against the shared chrome rather than a drawing.
**`UserQidiruv` is the artboard it was missing.** → decision ①.

---

## 2. What has a backend, and what does not

**✅ Backed — build these** (verified 2026-09-12 against `api/offers.ts` and `DriverOfferService`):

| artboard element | backing |
|---|---|
| the search itself | `searchOffers({from_text,to_text,date,from/to_province_id,from/to_city_id,min_price,max_price,vehicle_type,vehicle_make,vehicle_color,sort_by,limit,offset})` |
| sort: narx / reyting / sana | `sort_by: price_asc · price_desc · rating_desc · date_asc` — all four live |
| car, class, plate | `vehicle.make/model`, `vehicle_class`, `license_plate` |
| front / back prices, salon prices | `front_price_per_seat` · `price_per_seat` · `price_back_salon` · `price_whole_salon` |
| free seats, front vs back free | `seats_free`, and `back_seats_free` / front availability (`DriverOfferService:1084`) |
| depart & arrive WINDOWS | `depart_until` · `arrive_from` · `arrive_until` (T-080) |
| roof rack, parcel | `roof_rack_needed` · `parcel_accepted` |
| **★ driver rating** | 🟢 **REAL** — see the correction below |
| **`Foydalanuvchilar izohi` (reviews)** | 🔴 **HALF WRONG — corrected 2026-09-12, see below** |
| the `Takliflar` mode | the driver bids on the passenger's order — what `OfferDriversScreen` already loads |

🟢 **CORRECTION TO THE BOARD — T-109 ② IS WRONG, AND SO WAS I ON 2026-09-11.** It says *"no rating
model exists anywhere in the API (`grep -ril rating models/` → nothing)"*. **That grep was run
against the wrong path.** The models live in `database/models/`, and there:

- **`DriverRating`** — table `driver_ratings`: `driver_id · passenger_id · offer_passenger_id ·
  rating · comment`.
- **`driver-rating.routes.ts` mounts five routes**, including a public rating summary.
- **`DriverOfferService` already averages it** (`AVG(rating)`, `COUNT(id)`) and supports
  **`min_rating`** and **`sort_by=rating_desc`** — and the current screen already sends both.

*So the stars in this artboard are the one "social signal" that was real all along.* **T-109 ②
must be split: presence is genuinely missing, rating is not.** Step 17's driver-side decision ⑥
omitted rating on the same wrong premise and can be revisited.

🔴 **FOURTH CORRECTION, AND THE FIRST THAT TAKES SOMETHING AWAY — found at the start of 14b-3.**
The three above all went the same way, so this one is worth naming loudly: **I over-claimed the
review COMMENTS.** The `comment` column is real and the data is real, but **no endpoint exposes
another driver's comments to a passenger**:

- `GET /api/ratings/drivers/:driverId/rating-summary` is public and returns
  **`average_rating` + `total_ratings` + `rating_distribution` {5..1}** — **and no comment text.**
- `GET /api/ratings/driver/ratings` DOES include comments, but it is scoped to `req.user.id`:
  it is a driver reading their OWN reviews. A passenger cannot call it for someone else.

So the artboard's `Foydalanuvchilar izohi` list **cannot be built** and is boarded with T-112.
What replaces it is real and arguably better: the **rating distribution**, which the public
endpoint already returns and nothing in either app has ever used.

*Four measurement corrections in one step, three finding MORE than claimed and one finding less.
The direction was never the point — every one came from opening the file instead of trusting a
sentence, including my own sentences.*

**🛑 Not backed — NOT built; boarded as T-112:**

| artboard element | why not |
|---|---|
| presence: `Online / Ilova fonda / 24 soat ichida` + `hozir onlayn` / `12 daq oldin` | no `last_seen`, no online flag anywhere. **This half of T-109 ② stands.** |
| `7 yil tajriba` · `100+ qatnov` | no experience or completed-trip count → **T-082**, already boarded |
| the per-seat gender map (`frontSeats`/`backSeats` with `m`/`f`) | driver offers have no per-seat gender → **T-106** |
| `femaleOnly` (ayollar uchun) on an offer | no such column on `DriverOffer` |
| driver-side `Hoziroq` / urgent | → **T-103** (`is_urgent` is passenger-side only) |
| the full geo hierarchy in the route line | → **T-102**; today `from_text`/`to_text` are free strings |

⚠️ **THE COLOUR SWATCH IS NEARLY FREE, AND T-106 OVERSTATES IT.** `VehicleColor.hex_code`
**already exists in the database** — it is simply not serialised into the offer response, which
sends `color: string` (the name). That is a one-line server change, not new schema. **Still out of
scope here** (T-101 is presentation-only, goal §"No backend/API change"), but T-106 should be
corrected to say so.

🟢 **THIRD CORRECTION, FOUND WHILE STARTING 14b-1: FUEL TYPE IS REAL TOO, AND THIS SCREEN
ALREADY RENDERS IT.** My own §2 above first listed it as "no fuel column — new schema"; that was a
grep of `Vehicle.ts` / `VehicleModel.ts`, and the column lives on **`DriverVehicle.fuel_types`**
(`string[]`). `DriverOfferService:873` serialises it **specifically for this passenger screen**
(its comment names T-077), and `SearchOffersScreen` already has a `fuelLabel()` helper calling it
at line 393. **The row has been deleted from the "not backed" table. Build the fuel line.**

🔴 **THAT IS THREE CORRECTIONS IN ONE MEASUREMENT PASS, ALL IN THE SAME DIRECTION** — rating,
colour hex, fuel. Each was a card or a note claiming something did not exist, written from a grep
of the wrong file. *The lesson is not "the cards are sloppy"; it is that **a negative claim from a
grep is worth exactly as much as the path it was run against**, and this plan's own first draft
made the same error it was documenting.*

---

## 3. ✅ Owner decisions — ALL FIVE RECOMMENDATIONS ACCEPTED 2026-09-12 ("ok")

| # | question | recommendation |
|---|---|---|
| ① | **Merge `OfferDriversScreen` in as the `Takliflar` mode?** The artboard draws one screen with two modes, but step 10 rebuilt that screen nine days ago against no artboard. | **Yes, merge.** `UserQidiruv` is the artboard step 10 was missing, and its card says so. Step 10's work is **absorbed, not wasted** — its card, avatar, status pill and inset all carry over as the `Takliflak` mode's row. The route name `OfferDrivers` stays so pushes keep landing (17g's pattern). |
| ② | **Build the ★ rating and the reviews section**, now that both are confirmed real? | **Yes.** They are backed end to end, the screen already filters by rating, and leaving them out would repeat the mistake this plan just corrected. |
| ③ | **Presence, trips, experience, seat map, fuel, women-only, urgent.** | **Omitted, not faked** — the rule this card has followed since 2026-09-01. Boarded as **T-112**, with T-082/T-102/T-103/T-106 cross-referenced. |
| ④ | **Rebuild or convert?** 1 634 lines carrying real logic — geo cascade, saved searches, the join flow. Step 7 deliberately did not touch it. | **Rebuild the presentation, keep the logic** — step 16's precedent, where a 3 883-line wizard was restructured safely by pulling its rules into a pure module **first** and grepping the diff for every handler. Same order here: 14b-1 is a rules module with a checker, before any pixel. |
| ⑤ | **The join flow.** Tapping an offer pushes `OfferDetailsScreen` (1 456 lines, converted values-only in step 10) where the seat picking and price confirmation live. The artboard absorbs a *seat picker* into this screen (`Old/Orqa o'rindiq`, `Siz tanlagan o'rindiqlar`, `Tasdiqlash`). | **Keep the push for now.** Absorbing a 1 456-line booking form is a second merge on top of the first, and `OfferDetails` has its own unwalked T-031/T-040 history. Board it as **14c** and do it after 14b is walked on a device. |

---

## 4. Steps (only after §3 is approved)

- [x] **14b-1. The rules, pure, before any pixel. ✅ DONE 2026-09-12.**
      ✅ **`utils/offerSearch.ts` (new, ~330 lines, pure)** — `money` (the one coercion point),
      `neededSeats` (the artboard's 4 / 3 / front+back rule), `seatAvailability`, `leadPrice`,
      `priceRows`, `ratingOf` / `formatRating`, `fuelChips`, `classCounts` / `filterByClass`,
      `sortOffers` (4 sorts), `nextSortState`, `serverSortFor`, the two modes and the bid states.
      ✅ **`scripts/check-offer-search.mjs` — 77 assertions, RED ON ALL 16 MUTATIONS**, file
      restored byte-identical each time.
      🔴 **IT FOUND A REAL BUG ON ITS FIRST RUN, BEFORE A SINGLE PIXEL WAS DRAWN.** "Eng tez"
      sorted by **time of day** — the artboard's own key, which works only because every one of
      its fixtures shares one date. Real offers span days, so a 22:00 departure became 00:00
      local and sorted **ahead** of an 06:00 one: across midnight the chip meant its opposite.
      Now absolute departure time, with two regression assertions naming the case.
      🔴 **TWO MUTATIONS STAYED GREEN AND BOTH WERE MY FAULT, NOT THE MUTATION'S:**
      ① every bad-price case was being caught by an early guard, so the null-not-zero rule at
      the end was never pinned (`'1.2.3'` and `'--5'` now do it);
      ② no case had two drivers with equal ratings and different free seats, so the seat key in
      `match` could be zeroed with no effect.
      🔴 **AND ONE MUTATION PROVED A RULE COMPONENT DEAD.** `matchRank` led with an
      "is rated" key; since `ratingOf` is null unless the value exceeds zero, the rating key
      already separates rated from unrated. Flipping it changed no ordering, so it was removed.
      *A rule with a component that cannot affect the result is worse than one without.*
      ✅ **Four new locale keys only** (`modeSearch` · `modeBids` · `listMatching` · `listBids`);
      the salon price labels reuse the existing `passengerOffers.*` entries rather than
      duplicating them, and the bid states reuse `myJoinRequests.status_*`.
      ✅ Baselines: **`tsc` 6 · lint 0 / 216 · tokens 1 · six checkers green.**
- [x] **14b-2. The result card. ✅ DONE 2026-09-12.**
      ✅ **`components/search/OfferResultCard.tsx` (new)** — one component for BOTH modes: a
      search result, and a driver's bid on the passenger's own order (which swaps the price block
      and adds a status pill). Car, colour name, class pill, fuel chips, free-seat badge, the
      seat grid, the two prices, and the depart/date footer.
      🔴 **THE ARTBOARD'S SEAT-CELL COLOURS FAILED AND WERE NOT COPIED.** Measured against the
      real palette: its free-cell border (`brand`) is **2.56:1** on surface and its taken-cell
      border (a .16 ink wash) **1.41:1** — both under the 3:1 non-text floor, **on the one
      control that tells a passenger whether a seat is free.** Replaced with `action` (5.29:1)
      and `text.tertiary` (5.16:1) after measuring four alternatives. **25/25 pairs pass.**
      🔴 **AND THE CARD'S FIRST VERSION COLLAPSED THREE SEAT STATES INTO TWO.** `api/offers.ts`
      documents the T-083 rule in as many words: `front_offered === false` means the seat was
      **never for sale**, which is not "taken" — rendering them alike tells a passenger a seat is
      gone when it never existed. `seatAvailability` now returns
      `free | taken | notOffered | unknown` and the not-offered cell is a dashed empty outline.
      **I had invented a field name (`front_seat_free`) that does not exist**; reading the real
      type is what surfaced it. Four assertions added.
      🔴 **`bidLabelKey` WAS POINTING AT THE DRIVER APP'S NAMESPACE.** It returned
      `myJoinRequests.status_*`, which does not exist in this app at all — every bid pill would
      have rendered the raw key, in every locale. `tsc` cannot see a translation key; reading the
      locale file is what caught it. Now `offerDrivers.status_*`.
      ✅ **`vehicle_class` added to the app's `DriverOffer` type** — **the server has always sent
      it** (`getPublicOffers` maps it); only the type was missing, so the class pill could not be
      read. Type-only, no API change.
      ✅ **Every key the card can emit verified to resolve: 22 keys × 3 locales, 0 missing.**
      ✅ Baselines: **`tsc` 6 · lint 0 / 216 · tokens 1 · fonts · 80 assertions.**
- [x] **14b-3. The driver block + rating breakdown. ✅ DONE 2026-09-12.**
      ✅ **`api/ratings.ts` (new)** — `getDriverRatingSummary`, the FIRST call anywhere in either
      app to an endpoint that has been live all along.
      ✅ **`components/search/DriverBlock.tsx` (new)** — the identity block (avatar, name,
      vehicle, plate) with the ★ pill, plus `RatingBreakdownSheet`: the 5..1 distribution bars.
      The average and count ride on the search response, so **only the breakdown fetches, and
      only on tap.**
      🔴 **NOT THE ARTBOARD'S REVIEWS LIST, AND THAT WAS MY ERROR TO FIND.** §2 first claimed
      the comments were backed. The column is real; **no endpoint gives another driver's
      comments to a passenger** — the one that includes them is scoped to `req.user.id`. The
      distribution is what the public summary actually returns, and nothing had ever used it.
      ⚠️ **An unrated driver is a 200 with zeros, not a 404** — so it renders "hali baholanmagan",
      never `0,0`. A zero score says "terrible driver"; the server means "nobody has said".
      ✅ Three new keys × 3 locales; **27 keys × 3 = 81 lookups, 0 missing.**
      🔴 **One lint warning of mine** (an `any` cast on the axios-shaped error) — replaced with a
      real intersection type, back to 216.
      ✅ Baselines: **`tsc` 6 · lint 0 / 216 · tokens 1 · fonts · 80 assertions.**
- [x] **14b-4. The screen. ✅ DONE 2026-09-12.**
      ✅ **`screens/SearchOffersScreen.tsx` REBUILT** — `TopBar` (flat, with the drawer) +
      `NavDrawer` + `SegmentedModes` over the two modes with counts, the from/to row on the
      shared `GeoSheet` with the swap, class chips with counts, four sort chips, the result
      card, the driver block, and both empty states. **1 634 → ~560 lines.**
      ✅ **Every carried behaviour grepped for in the result**: `LAST_SEARCH_KEY` and its exact
      2026-08 JSON shape · `saveLastSearch` / `loadLastSearch` · the T-077 hand-off winning over
      the remembered search (and `loadLastSearch` NOT also running) · `swapLocations` · the
      `searchOffers` params · the `OfferDetails` join push · `GeoSheet` · pull-to-refresh.
      🔴 **DECISION ① WAS NARROWED, AND DELIBERATELY.** The approved merge was of the whole
      `OfferDriversScreen`. **Only its LIST is merged.** Accepting a driver is not a list
      action: `confirmDriver` also rejects **every other pending driver and pushes each of
      them**, so one tap permanently declines several strangers. That flow keeps its own screen
      and its count-naming confirm dialog, and a row here navigates to it. **The artboard
      agrees** — its `Tasdiqlash` is in the detail sheet, not on the list row.
      🔴 **AND THE MERGE ONLY WORKS BECAUSE ONE CALL CARRIES THE BIDS.** The search screen has
      no order context (`SearchOffersParams` is geo only), so "the passenger's bids" needed a
      source. `getUserOffers` embeds `drivers` (`PassengerOfferService:848`), so the mode is one
      request flattened — no per-order fan-out.
      🔴 **THREE KEYS EXISTED ONLY IN THE DRIVER APP** — `common.all`, `searchOffers.fromLabel`
      and `searchOffers.toLabel`. They would have rendered as raw keys on screen in all three
      locales, and **`tsc` cannot see a translation key**. Caught by the key probe. Added here.
      ✅ **51 keys × 3 = 153 lookups, 0 missing** · `expo export` clean at 4.91 MB.
      🟢 **LINT FELL 216 → 208** — the rewrite dropped eight warnings the old file carried
      (dead imports and casts). **New baseline 208; it is never to go back up.**
      ✅ Baselines: **`tsc` 6 · lint 0 / 208 · tokens 1 · fonts · 91 assertions · six checkers.**
- [x] **14b-5. Routing. ✅ DONE 2026-09-12 — and it needed NO change, which is the finding.**
      `SearchOffers` is a **TAB** (`MainTabs`), so the rebuilt screen is already wired; and
      because 14b-4 narrowed the merge, `OfferDrivers` still renders `OfferDriversScreen` and
      is **not orphaned**. Nothing goes to T-105 from this step.
      ✅ **The T-077 hand-off sender is ALIVE and was verified, not assumed** —
      `CreatePassengerOfferScreen:733` passes `fromProvince`, so the hand-off branch this
      rewrite carried is live code, not dead weight.
      ✅ `MenuButton` is still imported by four other screens; removing it here orphaned nothing.
      🔴 **A REAL BUG OF MINE, CAUGHT HERE:** the rebuilt screen passed BOTH `onBackPress` and
      `onMenuPress` to `TopBar`, which renders the back arrow **instead of** the hamburger
      (`TopBar.tsx:75`) — so the drawer would have been unreachable from the search tab.
      `ProfileScreen` is the pattern: a tab passes only the menu. Back arrow removed.
- [x] **14b-6. Checkers, baselines, board. ✅ DONE 2026-09-12.**
      ✅ **`scripts/check-search-i18n.mjs` (new)** — evaluates the real translations rather than
      grepping them, and matches every `prefix.*` literal rather than only `t('…')` calls (the
      rules module returns keys and never calls `t()`). **51 keys × 3 = 153 lookups across 4
      files**, and **PROVEN RED four times**, once per locale plus `common.all`, each restored
      and byte-compared.
      🔴 **Its first run failed on a template it cannot resolve** (`offerDrivers.status_${x}`).
      Rather than loosen the match, the four values that template can produce are listed
      explicitly, so the coverage is kept instead of quietly dropped.
      ✅ **T-112 boarded** (six unbacked `UserQidiruv` features). **T-109 ② corrected** — its
      rating half was wrong and its presence half stands. **T-106 corrected** — the colour
      swatch is a one-line serialisation, not schema.
      ✅ Final baselines: **`tsc` 6 · lint 0 / 208 · tokens 1 · fonts · 91 rule assertions ·
      seven checkers green · `expo export` clean.**

- [x] **14b-7. The route block and the class strip — CORRECTING 14b-4. ✅ DONE 2026-09-12.**
      🔴 **THE OWNER REPORTED THE FROM/TO STILL LOOKED WRONG, AND THEY WERE RIGHT AGAIN.**
      14b-4 built a two-cell form with a swap button between them. **The artboard draws no form
      there at all** (lines 110-127): a vertical route with a dot, a connector and a second dot,
      two bold 13.5/800 lines of full place text, then a mono depart line and an optional pill.
      *I had reproduced the screen's FUNCTION and invented its appearance — the same class of
      error as the cards this card keeps correcting, committed by me two steps earlier.*
      ✅ **`components/search/RouteSummary.tsx` (new)** — the block as drawn. The two lines stay
      TAPPABLE and the swap is kept: in the artboard this screen always follows a placed order,
      so its route can be read-only; here it is also a TAB opened cold, and a read-only route
      would leave the passenger no way to say where they are going. Recorded in the header.
      ✅ **`components/search/ClassStrip.tsx` (new)** — also wrong in 14b-4, which used wrapped
      rounded pills. The artboard has a **horizontally scrolling strip of WELDED tabs**
      (radius 11 11 0 0, flat bottom), count pills, a 38px fade at each edge and 26px arrow
      buttons. An empty class is drawn dimmed **and is inert**, exactly as the artboard's own
      `pick: () => { if (n) … }` says.
      🔴 **FOUR CONTRAST FAILURES, AND TWO ARE THE SAME BUG THIS CARD HAS NOW HIT THREE TIMES.**
      The artboard's `brand` green is **2.29:1 on `ground`** — used for the route connector, its
      end dot and the selected tab's border, i.e. the elements carrying the whole block's
      meaning. `action` measures 4.72:1 and replaces it. And the empty tab's label was
      `text.tertiary` at **3.91:1 on `surfaceTrack`** → `text.muted`, 5.45:1 — **that is step
      17b's finding, on the same control, in the other app.** **16/16 pairs now pass.**
      ✅ **One new token in BOTH palettes: `groundClear`.** 🔴 The edge fades must end on an
      explicit rgba of the ground at alpha 0, **not `'transparent'`** — on Android a gradient to
      `transparent` interpolates through BLACK, so the fade would grey out instead of dissolving.
      ⚠️ The artboard's connector is a repeating-gradient dashed line. React Native cannot draw
      it and its own dashed borders are unreliable on Android at 2px, so the line is solid — the
      same call steps 9 and 17c made and recorded.
      ⚠️ The artboard blinks an arrow when a matching offer is scrolled out of view. Omitted, as
      in step 17b: nothing else in either app blinks, and that is a bigger call than a repaint.
      ✅ **51 keys × 3 = 153 lookups across SIX files, 0 missing** · `expo export` clean.
      ✅ Baselines: **`tsc` 6 · lint 0 / 208 · tokens 1 · fonts · 91 assertions · seven checkers.**
      Driver app unaffected: `tsc` 28, tokens 3.

---

## 5. Baselines — never rebaseline upward

User `tsc` **6** · lint **0 errors / 208 warnings** · tokens **1** · its **six** checkers ·
`expo export`. Measure lint by scoped `git stash` before/after, as in 17h.

🟢 **LINT REBASELINED DOWNWARD 216 → 208 on 2026-09-12** (14b-4): the screen rewrite removed
eight warnings the 1 634-line original carried. **Downward only** — the figure must never be
raised to accommodate a change, which is the trap that misled T-031.

---

## 6. Risks and traps, recorded up front

- **This screen has the app's densest logic** and has never been walked on a device even in its
  colours-only form (step 7's own closing line). A rebuild on top of unverified behaviour is the
  main risk — hence the rules-module-first order (④).
- **Saved searches have a stored JSON shape** (7d's lesson on the driver side). Keep it verbatim
  or old saves break silently.
- **`min_rating` is already wired and already works.** Do not "add" it; check it first.
- **The rating is an average over `driver_ratings`,** so a new driver has none. Draw the absence,
  do not render `0,0` as if it were a score.
- **T-109 ② and T-106 are both partly wrong** (above). Correct them in 14b-6 rather than quoting
  them, or the next step inherits the same false premise.

---

## 7. Session notes

### 2026-09-12 (7) — 14b-7: the owner was right twice in one day

The from/to block and the class filters were **invented, not measured**. 14b-4 reproduced what
the old screen DID and made up how it looked: two picker cells with a swap, and wrapped pills.
The artboard draws a vertical route with a connector and two bold lines, and a horizontally
scrolling strip of welded tabs. Both are now built as drawn.

**Three of the four contrast failures were the artboard's own `brand` green**, at 2.29:1 on the
ground, on the connector and the selected tab border — the very elements that carry the block's
meaning. The fourth was the empty tab label, which is **step 17b's finding on the same control
in the other app**. The palette's own header says it plainly: `brand` is for the wordmark and
tints, never for something that has to be seen.

*The honest summary of this step: I corrected five card claims in 14b-1 to 14b-6, and then the
owner had to correct me. Measuring the artboard is not a phase that ends.*

### 2026-09-12 (6) — 14b-5 and 14b-6: step 14b closed

Routing needed no change, which was itself worth checking: the screen is a tab, and narrowing
the merge left the bidding screen routed and un-orphaned. **One real bug fell out of looking:**
the rebuilt screen passed a back arrow AND a menu to `TopBar`, which shows the arrow instead of
the hamburger — the drawer would have been unreachable from the search tab.

`check-search-i18n.mjs` now guards what nothing else can see, and its own first run made the
point: it failed on a template key it cannot resolve statically. The four values were listed
explicitly rather than loosening the pattern.

**The step in one line:** a screen that was ticked as done six weeks ago without being rebuilt
is now rebuilt, and **five measurement corrections** came out of it — the driver rating, the
colour swatch and the fuel type all exist where cards said they did not; the review comments do
not exist where I said they did; and the front seat has three states where I had modelled two.

🛑 **NOT SEEN ON A DEVICE.** With steps 15-18 on the driver side, the untested surface is now
both apps' busiest screens.

### 2026-09-12 (5) — 14b-4: the screen, and a merge narrowed on purpose

The screen is rebuilt: two modes, the shared chrome, the card, the driver block. 1 634 lines
became about 560, and lint fell eight warnings below its baseline.

**The approved merge was narrowed, and this is the entry that says so.** Decision ① approved
folding `OfferDriversScreen` in. Only its list is folded. Accepting a driver is irreversible and
rejects every other bidder with a push each — that belongs behind its existing confirm dialog,
not on a list row, and the artboard puts it in the detail sheet anyway.

**Three translation keys existed only in the driver app.** They would have rendered raw on
screen in all three languages, and the type checker is blind to them. The key probe is the only
reason they were found — which is the same lesson as 14b-2's `myJoinRequests` namespace, twice
in one step.

**Next: 14b-5 routing and 14b-6 checkers/board**, then step 14b closes.

### 2026-09-12 (4) — 14b-3: the rating is built, and the reviews are not

The ★ rating now exists in the app for the first time, against an endpoint that has been live
and unused since it was written. **The reviews list does not**, and finding out why was this
step's real work: I had claimed the comments were backed, and only opening the controller showed
that the only endpoint carrying them is scoped to the driver reading their own. What replaces it
— the rating distribution — is real, public, and had never been called either.

**The "unrated driver" case is the one to watch on a device.** The server answers 200 with zeros
rather than 404, so the difference between "nobody has rated this driver" and "this driver
scores zero" is entirely a client-side rule. It is pinned by seven assertions in 14b-1.

**Next: 14b-4, the screen itself** — the two modes, the search form on the shared `GeoSheet`,
and every existing behaviour carried across and grepped for in the diff.

### 2026-09-12 (3) — 14b-2: the artboard lost three arguments, and so did I

The card is drawn, and **measuring beat copying three times**: the artboard's seat-cell colours
fail the non-text contrast floor on the one control that says whether a seat is free; its
presence dot and colour swatch have no backing; and its per-seat gender does not exist.

**Two of my own errors were worse than the artboard's.** I invented a field name
(`front_seat_free`) and collapsed the front seat's three states into two — the exact defect
`api/offers.ts` warns about under T-083, in a comment I had already read. And `bidLabelKey`
returned the DRIVER app's namespace, which would have rendered raw keys in every locale with
`tsc` perfectly happy. Both were found by reading the real type and the real locale file, not by
any tool.

*The pattern for this whole step: every negative claim — mine or a card's — has been wrong at
least once, and every one was settled by opening the file rather than reasoning about it.*

**Next: 14b-3, the driver block and reviews sheet.** The rating contrast pairs are already
measured and passing.

### 2026-09-12 (2) — 14b-1: the checker earned its place before any pixel

77 assertions, 16 mutations red, and **a real defect caught on the first run**: "eng tez" sorted
by time of day, so across midnight it meant its opposite. The artboard could not show this — all
its fixtures share one date.

Two mutations stayed green and both were weak coverage of mine, not bad mutations; one more
proved a rank key **dead** and it was deleted. **The shell's backslash-halving bit twice more**
(the CRLF anchors in the mutation runner), so that script now normalises line endings instead of
spelling them — the third time this session that a prover matched nothing and had to say so.

**Next: 14b-2, the result card.** Measure contrast from the bundled palette before committing ink.


### 2026-09-12 — written after the owner's report; nothing built

The owner said the search screen does not look like `UserQidiruv`. Measured: step 7 swapped
colours and nothing else, and the plan's own *Next actions* had already said this screen needs a
step called 14b that was never written. Measuring the artboard then found it is a **two-mode
merge** whose second mode is `OfferDriversScreen` — rebuilt nine days ago against no artboard,
because this was its artboard.

**Two board corrections fell out of the measurement, both in the direction of MORE being
possible:** the driver rating and its review comments are **fully backed** (T-109 ② was grepping
the wrong directory), and the colour swatch needs a one-line serialisation change rather than new
schema (T-106 overstates it). **No code written.**
