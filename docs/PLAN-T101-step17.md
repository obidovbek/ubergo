# 📋 PLAN — T-101 step 17: `DriverQidiruv.dc.html` → the passenger-orders screen

> Split out of `docs/PLAN.md` on **2026-09-11**, the same way step 16 was: measured first, and
> the card turned out to describe a different screen from the one the artboard draws.
> The parent card in `PLAN.md` stays unchecked and points here.
>
> 🛑 **NO CODE UNTIL THE OWNER APPROVES §3.** Seven decisions are listed there with a
> recommendation each; one "ok" covers them all, or answer them one by one.

---

## 1. What this actually is

| | |
|---|---|
| artboard | `htmlDesign/DriverQidiruv.dc.html` — **999 lines**, 68.6 KB. ⚠️ **`uploads/Chek_28082026/DriverOrder.dc.html` (864 lines) is an OLDER COPY of this same screen** — same `ORDERS`, `SENT`, `REJECT_REASONS`, same two modes. `htmlDesign/` is canonical, as in steps 15-16. |
| card said | `OffersListScreen` + `SearchPassengerOffersScreen` → `DriverQidiruv` |
| the artboard IS | **`SearchPassengerOffersScreen` (1 263 lines, 11 `useState`) + `MyJoinRequestsScreen` (532, 5) + the join form of `PassengerOfferDetailsScreen` (857, 12)** — three screens, one artboard |
| `OffersListScreen` | **460 lines, 8 `useState` — HAS NO ARTBOARD.** The design's own drawer sends "Mening e'lonlarim" to `DriverElon.dc.html`, the wizard. |

🔴 **THE CARD IS WRONG THREE WAYS, AND ONLY MEASURING SHOWED IT** — the same shape as steps 9-12 and 16:

1. **It is a MERGE, not a repaint.** The artboard's two modes — **`Kelgan buyurtmalar`** (incoming
   passenger orders the driver has not answered) and **`Taklif yuborish`** (orders the driver has
   already sent a proposal to, with `kutilmoqda / qabul / rad` states) — are `SearchPassengerOffers`
   and `MyJoinRequests`. Two screens sliced the same journey by SOURCE; the artboard slices it by
   *"have I answered this yet?"*. **Identical to step 9's finding on the passenger side.**
2. **The detail is a SHEET over the list** (`margin 64px 12px 14px`, radius 24, own scroll), and
   the offer form lives INSIDE it. Today that is a pushed screen, `PassengerOfferDetails`, whose
   join sheet collects `vehicle_id · seats_offered · offered_price_per_seat · message`. The
   artboard absorbs it.
3. **`OffersListScreen` does not belong here.** It is the driver's own e'lons — a TAB screen — and
   no artboard draws it. It gets a values-only conversion in the artboards' language (step 14's
   `BlockedScreen` rule), not a rebuild against nothing.

⚠️ **Step 18 shrinks accordingly.** Its card names `DriverMyOrder` + `DriverOrder`; `DriverOrder` is
this screen. What remains for 18 is **`DriverMyOrder` only** (modes `Jarayonda / Faol / Tarix` — the
driver's accepted rides), against `OfferPassengersScreen` and the confirmed half of the join
requests. Recorded on the step 18 card in `PLAN.md`.

⚠️ **The artboard has NO from/to search.** "Kelgan" implies the backend matches orders to the
driver's route. **Nothing does** — search is `ILIKE` on free text (`PassengerOfferService.ts:1425`),
the same T-102 gap as the passenger scopes. Without a route row the feed is every published order in
the country. → decision ①.

⚠️ **The bottom bar disagrees with the app.** The artboard's third tab is *"Mening buyurtmalarim"*
→ `DriverMyOrder` (accepted rides); the app's third tab is `OffersList` labelled *Buyurtmalarim*
(own e'lons). The fifth tab, *Hisob*, is step 19. **Not step 17's to change** — it is step 18's first
question, noted there.

---

## 2. What has a backend, and what does not

**✅ Backed — build these** (driver app `api/passengerOffers.ts`, verified 2026-09-11):

| artboard element | backing |
|---|---|
| the incoming list | `searchPassengerOffers({from_text, to_text, date, min_seats, max_price, sort_by, limit, offset})` |
| the sent list + states | `getMyJoinRequests(token, status?)` → `OfferDriver.status: pending · confirmed · rejected · cancelled` = `Kutilmoqda · Qabul qilindi · Rad etildi (· Bekor)` |
| cancel a pending proposal | `cancelJoinRequest` — the screen has it today; the artboard does not draw it. **Kept** (a real action). |
| **Qabul qilish** | `joinPassengerOffer` at the passenger's own price (`max_price_per_seat` / the special-order prices), `seats_offered = seats_needed`. → decision ③ |
| **Taklif yuborish** (counter-offer) | `joinPassengerOffer({vehicle_id, seats_offered, offered_price_per_seat, message})` — **ONE per-seat price**, not per-row. → decision ④ |
| Oddiy / Maxsus + counts | `special_order` present ⇒ maxsus. Client-side. |
| sorts `Narx ↑↓ · Yo'lovchi ↑↓ · Eng tez` | server `sort_by` for price/date/seats; **"Best matching" = urgent first, then soonest** — the only two of the artboard's three rank keys that exist (`is_urgent`, `start_at`). |
| seat cells (front 1 + back 3, m / f / empty) | **`seat_counts {front_male, front_female, back_male, back_female}`** + `seats_needed`, `front_seat`, `salon_scope`. 🟢 *The passenger side HAS the per-seat gender the driver side lacks (T-106) — the cells are honest here.* |
| urgent pill | `is_urgent` |
| tags | `woman_in_car` → "Faqat ayol kishi bor avto" · `large_baggage` → "Bagaj bor" · `roof_rack_needed` → "Tom bagajnik kerak" · `pets` · `trailer` · `road_pickup` (+ note) |
| payment line | `payment_type` / `payment_cash` / `payment_card` / `paid_by_friend` |
| phone | `passengerPhoneOf()` — **gated by T-054**: only after the passenger confirms |
| order code | `id` |
| route + notes + window | `from_text/to_text`, `from_landmark/to_landmark`, `start_at`, `depart_until`, `arrive_from/until` |
| pull-to-refresh, last search restore | exists (`AsyncStorage` `LAST_SEARCH_KEY`) — keep the stored shape unchanged |
| push → screen | `utils/notificationRouting.ts` targets **`MyJoinRequests`** and **`PassengerOfferDetails {offerId}`**. Both route names MUST survive the merge (17g). |

**🛑 NOT backed — leave out and board:**

- **`Rad etish` with four reasons.** A driver cannot reject a passenger's ORDER; the API's only
  reject (`/driver/passengers/:id/reject`) is the other direction — a passenger who joined the
  driver's offer. Drivers simply don't answer. Drawing the button would ship a dead control.
  → decision ②.
- **Presence** (online / ilova fonda / 24 soat / seen "9 daq oldin"). No `last_seen`, no online
  flag on any model. The card's presence dot and "seen" line are omitted. → decision ⑥.
- **Passenger rating and trip count** (`★ 4,8 · 42 ta safar`). **There is NO rating or review model
  in the API at all** (`grep -ril rating models/` → nothing) — the passenger app's stars rate a
  ride locally to that screen. Omitted. → decision ⑥.
- **Per-row counter-offer prices** (old/orqa/full salon + extras, each in thousands, summed). The
  API takes one `offered_price_per_seat`. → decision ④.
- **Jo'natma (parcel) mode** and `PARCEL_ORDERS`. Out-of-scope role (owner 2026-08-30). The toggle
  ships **dimmed and inert**, as step 6's service carousel does. → decision ⑤.
- **The artboard's "phone revealed on accept".** In this product the PASSENGER chooses the driver
  (T-024) and phones open only then (T-054). Accept = a proposal at the listed price; the result
  sheet's copy must say *"yo'lovchi tasdiqlaydi"*, not *"telefon ochildi"*. → decision ③.

---

## 3. ✅ Owner decisions — ALL SEVEN RECOMMENDATIONS ACCEPTED 2026-09-11 ("accept all your recommendations")

| # | question | recommendation |
|---|---|---|
| ① | The artboard has no route search, and no backend matches orders to a driver. **Keep a compact from/to row** (the `GeoSheet` pair step 7d already built) above the mode strip, empty = all orders? | **Yes.** Until a matching backend exists (T-102's family) the row is the only thing that makes "kelgan" mean anything. Same language as the artboard's own chips; one line, not the old two cards. |
| ② | `Rad etish` + reasons has no API. **Leave it out and board a backend card?** | **Yes — not built.** A local "hide" would be fabricated state (2026-09-01 rule). |
| ③ | `Qabul qilish` = a join request at the passenger's price, seats = `seats_needed`; the passenger confirms; phone after that. Result copy says so. | **Yes.** It is how T-024/T-054 work; the artboard's instant phone reveal is a drawing, not the product. |
| ④ | Counter-offer = **per-seat price (in thousands) × seats → total**, plus a note. Not per-row. | **Yes.** Mirrors the API and the passenger app's own price maths. |
| ⑤ | `Jo'natma` toggle dimmed and inert. | **Yes** (step 6's "visible but not tappable"). |
| ⑥ | Presence dot, "seen", rating, trips: **omitted**, not faked. | **Yes.** Board presence + passenger rating as one "social signals" backend card if wanted. |
| ⑦ | **Merge into ONE new screen** (`screens/PassengerOrdersScreen.tsx`) with two modes; the detail + offer form become its sheet; `SearchPassengerOffers` / `MyJoinRequests` / `PassengerOfferDetails` become orphans → T-105. Route names kept (pushes depend on them). | **Yes** — the step 9 pattern, carried-over fixes enumerated in the new file's header. |

---

## 4. Steps

> Each leaves the app runnable (rule 2). **Rules before rendering, as in 8f / 16a / 16c-2.**

- [x] **17a. The rules, pure, before any pixel. ✅ DONE 2026-09-11.**
      ✅ **`utils/passengerOrders.ts` (new, ~330 lines, pure)** — `money` (the ONE coercion point:
      DECIMAL columns arrive as strings) · `isSpecialOrder` / `orderKind` (a special block with
      only flags is NOT maxsus) · `seatCells` (front 1 + back 3, women first, overflow spills
      before it is dropped, **never a fifth cell**) · `listedPrice` (oddiy = ask × seats; maxsus =
      whole salon > back salon > front/back lines × the seats asked; **per-seat = ceil(total /
      seats)** so the server's `per seat × seats_needed` never lands under the ask) ·
      `acceptPayload` · `parseThousands` / `offerTotal` / `seedOfferThousands` / `validateOffer`
      (the old details screen's three checks, same order, same keys) · `orderTags` · `sortOrders`
      (match = urgent then soonest, unparseable date LAST; price: unpriced last in both directions;
      seats desc/asc) · `nextSortState` · `serverSortFor` · `filterByKind` / `classCounts` ·
      `excludeMine` (ANY status — rejected/cancelled are terminal server-side) · `requestTone` /
      `requestLabelKey` / `canCancelRequest` / `phoneUnlocked` (T-054).
      ✅ **Every label is an EXISTING key** (`passengerOfferExtras.*`, `myJoinRequests.status_*`,
      `passengerOfferDetails.*`) — the merge adds no locale entries for things that had words.
      ✅ **`scripts/check-passenger-orders.mjs` — 59 assertions, PROVEN RED ON 9 MUTATIONS**, each
      restored from a pristine copy and byte-compared (a new file has no `git diff`).
      🔴 **ONE MUTATION STAYED GREEN THE FIRST TIME — `ceil → floor` on the maxsus per-seat price.**
      The fixture's total divided evenly by the seat count, so both roundings agreed and the
      assertion was passing for the wrong reason. Re-fixtured to 100 000 / 3 → 33 334; now 2 red.
      *The 16c-2 lesson, verbatim: a mutation that stays green is the most valuable line.*
      🔴 **Two of my hand-computed sort expectations were wrong, not the rules**: on a price tie and
      a seats tie the urgent order wins, which I had forgotten when writing the sequences.
      ⚠️ **`match` and `soon` coincide** until presence exists — recorded in the module; 17d draws
      both chips anyway because the row is four equal columns.
      ✅ **Server total confirmed at the source**: `OfferDriverService.ts:161` bills
      `offeredPrice × offer.seats_needed`, exactly what `acceptPayload` assumes.
      ✅ Baselines: **`tsc` 28 · lint 0 / 275** (both new files lint clean) · tokens untouched.
- [x] **17b. Two strips the artboard introduces. ✅ DONE 2026-09-11.**
      ✅ **`components/chrome/PanelTabs.tsx`** — the welded tabs, measured from artboard lines
      128-135: radius 12 12 0 0 with NO bottom border, 44 high, label 12/800(=900)·600, mono count
      pill 10/700; the paid tab borders and inks `paid`, the others `brand`; an empty tab sinks to
      `surfaceTrack`. **`tone: 'paid'`** is the one prop beyond label/count.
      ✅ **`components/chrome/SortChips.tsx`** — N equal chips butted edge to edge (radius 0, no
      gap, no side padding — the artboard's strip), 38 high, glyph + 10.5/700 label; selected =
      `text.primary` fill with `text.onDark` ink. **The glyph is the caller's**: ↑/↓ direction is
      `nextSortState`'s rule (17a), not the strip's.
      ✅ **ONE NEW TOKEN, MEASURED NOT INVENTED: `paidTint` = `#D9CCEE`** (the selected paid tab's
      `pillBg`). Added to **both** palettes together and to `DESIGN-TOKENS.md` §2.5; `paid` on it
      measures **5.95:1**.
      🔴 **CONTRAST MEASURED FROM THE REAL PALETTE, AND TWO PAIRS FAILED THE FIRST TIME.** The
      empty tab's label and pill ink was `text.tertiary`: **3.91:1** on `surfaceTrack`, **3.48:1**
      on `disabled`. Switched to `text.muted` — the palette's own "inactive segment" tier — →
      5.45:1 and 4.85:1. **10/10 pairs pass AA** (probe bundles `themes/palettes/light.ts` with
      esbuild and reads the tokens; no hand-typed hexes — the step-9 lesson).
      ⚠️ **Three deviations from the drawing, each recorded in the component header:** the
      artboard's empty-tab inks measure ~2:1 and were not reproduced; its brighter ON pill green
      (#A9F0BE) folds onto `successTint`; the `rightTabHint` blink is omitted (step 6's precedent).
      🔴 **FOUND WHILE MEASURING, NOT FIXED HERE: `SegmentedModes` (step 9) uses
      `theme.borderRadius.xl` for its segments — the DEPRECATED alias, worth 24, on a control its
      own header measured at 12.** On a 42px segment that renders a pill. **Same line in BOTH apps'
      copies.** It happens to match `DriverQidiruv`'s mode strip (radius 99) and NOT `UserMyOrder`'s
      (12) — so step 9's screen has been drawing the wrong shape since 2026-09-03 and nobody has
      seen it on a device. → **17d adds a measured `shape` prop and fixes both copies** (the class,
      not the instance).
      ✅ Baselines: **driver `tsc` 28 · lint 0 / 275 · tokens 3 · fonts clean · user `tsc` 6 ·
      tokens 1** (the user palette changed, so its baselines were re-run too). Both components lint
      clean. 🛑 **NOT SEEN ON A DEVICE** — and no screen mounts them until 17d.
- [x] **17c. The order card. ✅ DONE 2026-09-11.**
      ✅ **`components/offers/PassengerOrderCard.tsx`** (new), measured from artboard lines 157-268:
      radius 20, padding 13/13/12/15, name 14.5/800, urgent pill (`warnTint`/`warnBorder`/`warnInk`
      + the artboard's bolt path, filled), route with the solid-`brand` connector, 38px pax disc
      (`successTint`/`brand` or `paidTint`/`paid`, mono 17/700), the 26px seat cells on
      `maleTint`/`male` and `femaleTint`/`female` with the artboard's own glyph paths (filled —
      the chrome `Icon` is stroke-only, so the card draws its own `Svg`), price block (mono
      14/700; `paid` for maxsus, `actionPressed` for the driver's own offer), footer with mono
      depart (24-hour, language-aware — `formatTime` is 12-hour US and was NOT used) + date +
      the kind tag + the flag tags. **One component for BOTH modes**: `request` present → status
      pill (17a's tone → `successTint`/`dangerTint`/`warnTint`/`surfaceSunken`), card border
      `brand` when confirmed / `dangerBorder` when rejected, price = the driver's own total.
      ✅ **Draws only.** Kind, cells, which price, tags and the pill's tone all come from
      `utils/passengerOrders.ts`; the card has no rule of its own.
      ✅ **Six new keys, `passengerOrders.*`, in all three locales** (the three price labels, the
      two kind tags, "kishi"); everything else reuses `passengerOfferExtras.*` and
      `myJoinRequests.status_*`. `check-offer-i18n.mjs` now sweeps the rules module and the card
      too — **91 keys × 3 = 273 lookups, proven red on `priceMine`.**
      ✅ **Contrast: 21/21 pairs pass, measured from the bundled palette** (text at 4.5, the two
      seat glyphs at the 3:1 icon floor — female measures 4.27:1 on its tint).
      ⚠️ **Deviations, each in the header:** no presence dot, "seen" or ★ rating (§3 ⑥); dashed
      connector → solid hairline (step 9's call); `'any'` cells (no `seat_counts`) draw as a
      neutral filled square; **no weekday on the date** — `formatDateByLanguage` has none and
      Hermes' `Intl` is not trusted to add one.
      ✅ Baselines: **`tsc` 28 · lint 0 / 275 · tokens 3 · fonts clean**; the card lints clean.
      🛑 **NOT SEEN ON A DEVICE — and nothing mounts it until 17d.**
- [x] **17d. The merged screen. ✅ DONE 2026-09-11.**
      ✅ **`screens/PassengerOrdersScreen.tsx` (new, ~430 lines)** — flat `TopBar` with the back arrow
      (pushed over the tabs), the Taxi / Jo'natma kind toggle (Jo'natma dimmed, inert, "Tez orada"),
      the compact route card with swap and per-direction clear (decision ①: **an empty route = every
      published order** — the old screen refused to search without both provinces), `SegmentedModes`
      for the two modes, `PanelTabs`, `SortChips`, list title + mono count, `PassengerOrderCard` rows,
      the dashed empty card, pull-to-refresh, T-068 push refresh, and the sent mode from
      `getMyJoinRequests` (requests whose offer is gone render as footer lines, not dropped).
      **Header lists every carried fix: T-018 · T-021 · T-037 · T-054 · T-068 · 7d.**
      ✅ **The saved-search key and JSON shape are the 2026-08 ones, verbatim** (`fromCountry …
      toCity`), so every existing save restores. **Verified by reading both the old writer and the
      old reader, not by assuming.**
      ✅ **`SegmentedModes` gained `shape="pill"` and an optional `count`** (the artboard's mode strip
      has no pill), **and its radius defect is fixed in BOTH apps** — one file, copied, `diff -q`
      identical. `UserMyOrder`'s strip now draws the 12 it measured; the user app's baselines were
      re-run for it (`tsc` 6 · lint 216 · tokens 1 · fonts clean).
      ✅ Two stroke glyphs added to `Icon` verbatim (`taxi`, `parcel`; the taxi's `<circle>` wheels
      written as arcs — same geometry). **21 new `passengerOrders.*` keys × 3 locales**; the i18n
      checker sweeps the screen too — **121 keys × 3 = 363 lookups, proven red on `emptySent`**.
      🔴 **Lint went 275 → 277 and was pulled BACK, not rebaselined:** two `catch (error: any)` of my
      own → `unknown` (`getErrorMessage` accepts it — the step-9 note).
      ⚠️ **Deviations, each in the header:** the old filter modal (max price / min seats) is gone —
      the artboard has class tabs and sort chips instead; **"Best matching" is translated** ("Eng
      mos" / "Подходящие" / "Best match") — the artboard's English label reads as a placeholder in
      an Uzbek UI; `match` and `soon` sort identically until presence exists (17a).
      ⚠️ **A tap still pushes the old `PassengerOfferDetails`** (typed route) — 17e replaces it with
      the sheet. Cancelling a pending request also waits for the sheet.
      ✅ Baselines: **driver `tsc` 28 · lint 0 / 275 · tokens 3 · fonts clean · drawer green ·
      `expo export` clean.** ⚠️ **The export does NOT prove the new screen bundles** — nothing
      imports it until 17g wires the routes, so Metro never sees it; `tsc` is the only proof today.
      🛑 **NOT SEEN ON A DEVICE, AND NOT REACHABLE YET** — 17g makes it the target of
      `SearchPassengerOffers` / `MyJoinRequests`.
- [x] **17e. The detail sheet. ✅ DONE 2026-09-11.**
      ✅ **`components/offers/PassengerOrderSheet.tsx` (new, ~560 lines)** — the inset panel per
      artboard lines 271-412: scrim `.42` (`scrim.sheet`), `ground`, radius 24 (`hero`), its own
      scroll, insets by hand (`Modal` sits outside the provider — the 7c/8e lesson, `NavDrawer`'s
      pattern). Header with the mono eyebrow + `#id` code; passenger card (initial disc + name —
      **no rating, no presence**, §3 ⑥); route card with landmarks, the date · window line and the
      arrival deadline; the tag row; the "So'ralgan o'rindiqlar" card — front/back counts, **Joy
      turi**, **To'lov** (T-031's three flags with the deprecated fallback, lifted into a pure
      `paymentKeys`), **Telefon (masked as "opens once the passenger confirms" until
      `phoneUnlocked` AND `passengerPhoneOf` agree — T-054)**, the special-order lines in `paid`
      ink, and the listed total; the passenger's note; in the SENT mode the driver's own offer card
      (per seat · seats · total · message · rejection reason · sent at) and **cancel while pending**
      (the server's guard, kept).
      ✅ **Two actions, both on the one `joinPassengerOffer` call** (owner ③ ④): **Qabul qilish** =
      `acceptPayload` after a confirm dialog naming the total (hidden when the order names no
      price); **Taklif yuborish** = the offer mode — ONE per-seat price typed in thousands in the
      artboard's pill field, × seats needed → the calc block and total, a note, the vehicle line
      (read-only; "no vehicle" in danger ink), send disabled at zero. `validateOffer` runs the old
      screen's three checks in the old order; the server's translated 400s show verbatim.
      ⚠️ **The `seats offered` stepper is gone on purpose**: the server bills per seat × what the
      passenger NEEDS (`OfferDriverService.ts:161`), so more seats change nothing — sent as
      `seats_needed`. Recorded in the header.
      ✅ **The screen now opens the sheet instead of pushing `PassengerOfferDetails`**; after a
      counter-offer it switches to the sent mode (the artboard's `closeSent`), after an accept or a
      cancel it stays and reloads. The old route stays registered for pushes → 17g.
      ✅ **Two more pure rules** (`paymentKeys`, `seatKindKey`) with 10 assertions — the checker is
      at **69, red on 11 mutations**. 18 more `passengerOrders.*` keys × 3; the i18n checker sweeps
      the sheet too — **162 keys × 3 = 486 lookups, red on `phoneHidden`.**
      ✅ **Contrast: 21/21 sheet pairs pass AA** from the bundled palette — ⚠️ the offer field's
      placeholder digit sits at **exactly 4.50:1** (`text.tertiary` on `successTint`); a darker
      tint would move it, so it is recorded, not "fixed".
      ✅ Baselines: **`tsc` 28 · lint 0 / 275 · tokens 3 · fonts clean**; sheet and screen lint
      clean (a first-draft `eslint-disable` on the reset effect was replaced by a real dependency —
      the 16c-2 lesson).
      🛑 **NOT SEEN ON A DEVICE, AND STILL UNREACHABLE** until 17g. The keyboard over the offer
      field inside a `Modal` + `ScrollView` is the thing to watch on a phone.
- [x] **17f. The result sheet + mode switch. ✅ DONE 2026-09-11.**
      ✅ **`components/offers/OrderResultSheet.tsx` (new)** — the centred dialog of artboard lines
      432-452: the check disc (the artboard's own path, added to `Icon` as `check`, stroke 2.4),
      title 18/800, body 13.5/500, the lines block on `ground` (passenger · Joy turi · the offer
      price or the total · for an accept, the phone line reading "opens once the passenger
      confirms"), and the dark "Yopish" button. **Replaces the success toast** for an accept and an
      offer; a cancel keeps its toast (the artboard has no result for it).
      ✅ **Copy corrected, not copied** (owner ③): the artboard's accept result claims a confirmation
      was sent and lists the phone; ours says a proposal at the listed price went out and the number
      opens once the passenger confirms. The "rad etildi" variant has no backend and is absent.
      ✅ **The sheet now hands the total out** (`onChanged(outcome, total)`), so the dialog names the
      figure the passenger will see; **the mode switch to "sent" moved from the sheet's close to the
      DIALOG's close after an offer** — `closeSent`'s rule, exactly.
      ✅ Contrast: check glyph `action` on `successTint` **4.62:1** (icon floor 3:1), close button
      16.56:1, body 7.18:1. 6 keys × 3; the i18n checker sweeps the dialog — **168 keys × 3 = 504
      lookups, red on `resultTotal`.**
      ✅ Baselines: **`tsc` 28 · lint 0 / 275 · tokens 3 · fonts clean**; all three touched files
      lint clean. 🛑 **NOT SEEN ON A DEVICE; still unreachable until 17g.**
- [x] **17g. Routes and orphans. ✅ DONE 2026-09-11 — 17a-17f ARE REACHABLE.**
      ✅ **`MainNavigator`: the three names render `PassengerOrdersScreen`** — `SearchPassengerOffers`
      (incoming), `MyJoinRequests` via `initialParams: { mode: 'sent' }`, and
      `PassengerOfferDetails { offerId }`, for which the screen **opens its sheet on that order**:
      found among the sent or incoming rows, else fetched by id (`getPassengerOfferById`), a 404
      reported as "not found" as the old screen did; a sent row also switches the mode. The push
      router's two targets (`notificationRouting.ts`) keep working unchanged — its stale comments
      were corrected, not its logic.
      ✅ **`navigation/types.ts`: `{ mode? } | undefined`** for the two list names — `undefined` stays
      in the union, so **`check-drawer.mjs` still sees them as paramless: green.**
      ✅ **Four orphans, zero importers (grep-verified), NOT deleted (rule 4) → T-105:** the three old
      screens + `PassengerOfferExtras` (imported only by two of them). Their `check-font-weights`
      exemptions re-labelled "orphan since 17g"; the remaining step-17 entries are 17h's
      (`OffersListScreen`, `StatusFilterTabs`). ⚠️ Most `searchPassengerOffers.*` keys and the
      join-sheet half of `passengerOfferDetails.*` are now unused in all three locales — on the
      T-105 card for the same cleanup.
      ✅ Baselines: **`tsc` 28 · lint 0 / 275** (the per-file run shows 7 warnings in the navigator
      and push router — all pre-existing `any`s; the whole-app count did not move) · tokens 3 ·
      fonts · drawer · i18n 168 · rules 69 — all green.
      ✅ **`expo export` — THE FIRST ONE THAT CONTAINS THE SCREEN — exit 0, and the Hermes bundle
      was grepped for the screen's own keys (`passengerOrders.modeIncoming`,
      `passengerOrders.resultAcceptTitle`): present.** Until this step Metro had never seen it.
      🛑 **NOT SEEN ON A DEVICE — and now it can be.**
- [x] **17h. `OffersListScreen` — no artboard, values only. ✅ DONE 2026-09-11.**
      ✅ The hand-rolled header (a `BackButton` on a TAB screen — a leftover from its stack days,
      T-071) → the shared flat `TopBar` with the hamburger opening `NavDrawer`, bell and avatar; the
      create button kept its place at the right, in a row under the bar. `StatusFilterTabs` →
      **`PanelTabs`** with the same four tabs and the same counts, the labels now LITERAL keys so the
      i18n checker sweeps them (`common.all` + `driverOffers.status.*` — 182 keys × 3 now).
      `SafeAreaView` → safe-area-context's with `edges={['left','right']}` (the tab bar owns the
      bottom; `TopBar` the top).
      ✅ **15 weight literals → `font()`** (6 in the screen, 9 in `OfferCard`), mechanically, inside
      the stylesheets only; three dead header style blocks deleted. `OfferDetailModal` untouched —
      it is step 18's.
      ✅ **Logic untouched, proven:** the diff was grepped for publish / cancel / archive / delete /
      load / edit / view — the only hits are the header comment and the three literal key strings.
      ✅ **Exemptions retired** for the screen and `OfferCard`; `StatusFilterTabs` is an orphan (the
      barrel still re-exports it, nothing renders it) → T-105, exempt with that reason.
      🔴 **Lint went 275 → 276 on one line of mine** — `ReadonlyArray<T>` where the project's rule
      wants `readonly T[]` — found by a scoped `git stash` before-and-after on the two files, fixed,
      back to 275. Not rebaselined.
      ✅ Baselines: **`tsc` 28 · lint 0 / 275 · tokens 3 · fonts clean (30 files exempt, down from
      32) · drawer green · i18n 182 · rules 69.** No `expo export` this step: a tab screen already in
      the bundle, values only — `tsc` and lint are the proof.
      🛑 **NOT SEEN ON A DEVICE.** The one thing to look at: the create button now sits under the
      shared bar instead of inside a white header.
- [x] **17i. Checkers + baselines + docs. ✅ DONE 2026-09-11 — STEP 17 IS CLOSED.**
      ✅ **Final sweep, both apps, all green:** driver `tsc` **28** · lint **0 / 275** · tokens **3** ·
      fonts (30 exempt) · drawer · offer-validation · offer-schedule · offer-restore (41) ·
      offer-i18n (**182 keys × 3**) · passenger-orders (**69, red on 11 mutations**) · `expo export`
      · user `tsc` **6** · lint **216** · tokens **1** · fonts · i18n-myorders (69) · lifecycle (18) ·
      ride-time (8). Every checker written this step was read back after writing (16f's lesson).
      ✅ **Boarded what §2 leaves out → T-109** (driver-side reject with reason · presence and
      passenger rating · per-row counter-offer breakdown · server-side route matching for "kelgan").
      Per-seat gender on the DRIVER offer stays T-106; the parcel kind is an out-of-scope role, not
      a card.
      ✅ **`formatTime` (12-hour `en-US`) has exactly ONE live call site left — `RideCard`, an orphan.**
      Not a sweep card: noted on T-105 to go with the orphans.
      ✅ `PLAN.md` step 17 checked, session note + Resume point rewritten; `TODO.md` T-101 card and
      T-105 annotated; `JOURNAL.md` closed for the day.

---

## 5. Baselines — never rebaseline upward

**driver `tsc` 28 · lint 0 errors / 275 warnings · tokens 3** (measured 2026-09-11, after 16f).
🟢 **Still 28 / 275 / 3 at the close of step 17 (17i, 2026-09-11)** — moved by my own hand three
times during the step (277, 276), pulled back each time, never rebaselined.
**Checkers that must stay green** (`node scripts/…` in `driver-app-standalone`):
`check-design-tokens` · `check-font-weights` · `check-drawer` · `check-offer-validation` ·
`check-offer-schedule` · `check-offer-restore` · `check-offer-i18n` · **`check-passenger-orders`
(17a, 59 assertions)**.
⚠️ Scripts written through this session's shell lose backslashes — Write/Edit tool, backslash-free
regexes, read back before trusting green.

---

## 6. Risks and traps, recorded up front

- 🔴 **The saved-search JSON and the request shape are the two silent breakages.** 7d verified both
  unchanged; 17d must re-verify — a search that stores a new shape strands every saved search.
- 🔴 **T-054 is the one that would embarrass us on a phone**: a phone number shown before the
  passenger confirms. `passengerPhoneOf` is the only source of a number on this screen.
- 🔴 **Pushes navigate by route name with `{offerId}`.** Renaming or dropping `PassengerOfferDetails`
  turns every "your offer was accepted" notification into a dead tap.
- ⚠️ **`OfferDriver.status` has FOUR values; the artboard draws three.** `cancelled` needs a pill
  too (neutral), not a fall-through to "Kutilmoqda".
- ⚠️ **The user app's `SearchOffersScreen` is this screen's TWIN** (`UserQidiruv`, deferred with no
  step — `PLAN.md` step 14). `PanelTabs`, `SortChips` and the card are shared language: build them
  so the twin can mirror them file-for-file. *Fix the class, not the instance.*
- ⚠️ `SafeAreaView` from `react-native` (a no-op on Android) is what the old screens use; the new
  one uses safe-area-context with `edges={['left','right','bottom']}` under `TopBar`.

---

## 7. Session notes

### 2026-09-11 (10) — 17i: step 17 closed

- **Nine sub-steps in one day, every one with a baseline run and a "proven red".** What the day
  produced: 1 pure module (69 assertions), 3 chrome components, 3 offer components, 1 merged
  screen, 1 fixed defect in both apps (`SegmentedModes`), 51 locale keys × 3, 5 orphans, 3 cards.
- 🔴 **Three times today a baseline moved by my own hand and was pulled back** (two `catch
  (error: any)`, one `ReadonlyArray<T>`). Each was found by the number, not by reading.
- 🔴 **Four times today the artboard was corrected rather than copied**: no route search, no
  reject, an accept that promised a phone, and a "Best matching" in English. Each is in a header.
- **The gate before step 18 is a PHONE, not another checker.** Nothing from 8e on has been walked;
  this screen is the biggest untested surface in either app.

### 2026-09-11 (9) — 17h: values only, and the proof that it was

- **17h done.** `OffersListScreen` on the shared chrome with `PanelTabs`; 15 weights converted;
  `StatusFilterTabs` orphaned. The handler grep on the diff came back empty — "values only" is a
  claim that can be checked, so it was.
- 🔴 **One lint warning of mine (`ReadonlyArray<T>`)**, found with a scoped `git stash`
  before/after rather than by reading. Fixed; 275.
- **Next: 17i — checkers, docs, and boarding what §2 leaves out.** Then step 17 closes and the
  device walk is the gate before step 18.

### 2026-09-11 (8) — 17g: the names stayed, the files changed

- **17g done.** Three route names, one screen; `PassengerOfferDetails { offerId }` opens the
  sheet by id so pushes keep landing where they did. Four files are orphans → T-105.
- ✅ **`check-drawer` earned its keep**: the `| undefined` in the new param unions is what keeps
  the drawer's two entries "paramless", and the checker is what would have said so if not.
- ⚠️ **Dead keys are the next tide**: three locales × the old search's filter modal and empty
  states. Listed on T-105 rather than pruned mid-card.
- **Next: 17h — `OffersListScreen`, values only** (no artboard): `TopBar` with the hamburger
  (it is a TAB), `StatusFilterTabs` → `PanelTabs`, `OfferCard` weights → `font()`. Logic
  untouched — the diff must contain no publish / cancel / archive / delete line.

### 2026-09-11 (7) — 17f: the result dialog says what actually happened

- **17f done.** `OrderResultSheet` replaces the success toast after an accept or an offer; the
  total travels out of the sheet so the dialog can name it; the switch to the sent mode now
  happens when the dialog closes after an offer, as the artboard's `closeSent` does.
- ⚠️ **The artboard's accept copy was wrong for this product** — it promised a confirmation and
  a phone number. Corrected to what T-024/T-054 actually do. *A design's words are a drawing too.*
- **Next: 17g — routes and orphans.** `SearchPassengerOffers` and `MyJoinRequests` → the new
  screen (`{ mode? }`, paramless-compatible for `check-drawer`); `PassengerOfferDetails
  { offerId }` → the new screen with the sheet opened on that order (pushes depend on it —
  `notificationRouting.ts:66-80`); the three old files become orphans → T-105 + exemptions
  re-labelled. This is the step that makes 17a-17f reachable.

### 2026-09-11 (6) — 17e: the sheet, and the stepper that changed nothing

- **17e done.** `PassengerOrderSheet` over the list: detail, accept, counter-offer, cancel.
  The screen opens it in place of the push. 18 keys × 3; i18n checker at 162; contrast 21/21.
- 🔴 **The old join sheet's seats stepper was dead weight** — the server bills per seat × what
  the passenger needs, so "offering more seats" never changed a price. Removed, with the server
  line cited. *A control that cannot change the outcome is a question the user need not answer.*
- ✅ **Two rules lifted out of the old extras component** (`paymentKeys` with the T-031 fallback,
  `seatKindKey`) and executed before the sheet drew them: 10 assertions, 2 mutations red.
- ⚠️ **One contrast pair at exactly 4.50:1** (the offer field's placeholder). Recorded.
- **Next: 17f — the result sheet** ("Taklif yuborildi" / "Buyurtma qabul qilindi", artboard
  lines 432-470) replacing the success toast; the mode switch after an offer already lands.

### 2026-09-11 (5) — 17d: three screens became one, and the radius fix landed in both apps

- **17d done.** `PassengerOrdersScreen` — the merged list with both modes, every carried fix
  named in its header, the saved-search shape kept verbatim. 21 keys × 3; the i18n checker at
  121 keys, red on `emptySent`.
- 🔴 **`SegmentedModes` fixed in both apps by copying one file** (`diff -q` identical) — the
  class, not the instance. It also gained the artboard's pill shape and a pill-less mode.
- 🔴 **Two `catch (error: any)` of my own pushed lint to 277.** Fixed to `unknown`, back to 275.
  *A baseline only works if the person who moved it is the one who moves it back.*
- ⚠️ **`expo export` cannot see an unrouted screen.** Green export today proves the changed
  chrome bundles, not the new screen. 17g is where it becomes real.
- **Next: 17e — the detail-and-offer sheet.** It absorbs `PassengerOfferDetails`' join form:
  vehicle (read-only, the driver has one), seats, per-seat price in thousands → total, note;
  `Qabul qilish` = `acceptPayload`; phone through `passengerPhoneOf` only on confirmed.

### 2026-09-11 (4) — 17c: the card draws, the module decides

- **17c done.** `PassengerOrderCard` for both modes; six `passengerOrders.*` keys × 3 locales;
  `check-offer-i18n.mjs` extended to the rules module and the card (91 keys, red on `priceMine`);
  21/21 contrast pairs from the real palette.
- ⚠️ **`utils/date.formatTime` is 12-hour `en-US`** ("09:00 PM") — the artboard is 24-hour. Used
  `formatTimeByLanguage` instead. Worth a sweep: the old search card used `formatDateTime`, which
  is language-aware; the extras component uses `formatTime`. Two conventions in one list.
- **The gender glyphs are FILLED paths; the chrome `Icon` is stroke-only by design** — so the
  card carries its own `Svg`. Recorded rather than bending `Icon` to a second rendering mode.
- **Next: 17d — the merged screen, and the `SegmentedModes` radius fix in both apps.**

### 2026-09-11 (3) — 17b: two strips, one token, and a radius that was wrong in both apps

- **17b done.** `PanelTabs` (welded tabs) and `SortChips` in `components/chrome/`; `paidTint`
  added to both palettes and the token doc.
- 🔴 **Two contrast pairs failed on the first measurement** — `text.tertiary` on the two greys an
  empty tab uses. Fixed by role (`text.muted`, the "inactive segment" tier), then re-measured:
  10/10. *Measure from the palette; the doc's ladder does not know which grey a tab sits on.*
- 🔴 **`SegmentedModes` draws pills, not the 12px it measured** — it reads the deprecated
  `borderRadius.xl` (24). Both apps' copies. Step 9's `UserMyOrder` strip has been the wrong
  shape for eight days; the driver's `DriverQidiruv` strip happens to want pills, which is how it
  went unnoticed. → 17d adds `shape` and fixes both.
- **Next: 17c — the order card, measured from artboard lines 157-268.**

### 2026-09-11 (2) — 17a: the rules, and the mutation that stayed green

- **Owner accepted all seven §3 recommendations** ("accept all your recommendations").
- **17a done.** `utils/passengerOrders.ts` + `scripts/check-passenger-orders.mjs` (59 assertions,
  red on 9 mutations). Every label reuses an existing key.
- 🔴 **The `ceil → floor` mutation stayed GREEN on the first run** because the fixture's total
  divided evenly by the seat count. The assertion was true for the wrong reason. Re-fixtured to a
  non-divisible total → 2 red. *Prove the checker's coverage, not just its rules.*
- 🔴 **Two sort expectations I hand-computed were wrong** (ties go to the urgent order). The
  rules were right; the ruler was not. Fixed the assertions, not the code — after checking which
  side was wrong.
- ✅ Server total formula read at its source (`OfferDriverService.ts:161`), not from a comment.
- **Next: 17b — `PanelTabs` and `SortChips`, measured from the palette.**

### 2026-09-11 — scoped and split; no code written

- **Measured before touching anything.** The card named the wrong screens: the artboard is the
  passenger-orders feed with two modes (incoming / sent) and an inline detail-and-offer sheet — i.e.
  `SearchPassengerOffers` + `MyJoinRequests` + the join half of `PassengerOfferDetails`.
  `OffersListScreen` has no artboard; `DriverOrder` (step 18's) is an older copy of this board.
- **Seven decisions listed in §3** with a recommendation each. The two that change what ships:
  keep a route row the artboard lacks (no matching backend), and drop the reject-with-reason
  (no API). Accept and counter-offer both map onto the one `joinPassengerOffer` call.
- 🟢 **The seat cells ARE backed here** — `seat_counts` carries per-seat gender on the passenger
  side. T-106 is a driver-offer gap only.
- **Next: owner answers §3, then 17a.**
