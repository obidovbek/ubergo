# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ⏸️ **T-039** → `docs/PLAN-T039.md`. Steps 1-3 done; step 4 = owner (**deploy the API**), step 5 commit.
> ⏸️ **T-038** → `docs/PLAN-T038.md`. Steps 1-6 done; step 7 = owner (**deploy API FIRST**), step 8 commit.
> ⏸️ **T-037** → `docs/PLAN-T037.md`. Steps 1, 3-6 done; step 2/7 = owner device test, step 8 commit.
> ✅ **T-036 CLOSED** → `docs/PLAN-T036.md`.
> ⏸️ **T-031** → `docs/PLAN-T031.md` — ⚠️ **same file as this card**, see Ordering below.
> ⏸️ **T-033/T-030/T-027/T-018/T-026A/T-025** → their own `docs/PLAN-T0*.md`.
> ⏸️ **Also parked:** T-011 · T-012 · T-014 · T-015 · T-016 · T-017.

## Task
- **ID / name:** T-040 — Let a passenger edit an order instead of cancelling and re-creating it
- **Goal (definition of "done"):**
  1. An **Edit** action on the order card opens the existing form **pre-filled** with the order.
  2. Saving **PATCHes** the order; creating still POSTs. One screen, two modes.
  3. Editing an order that already has **pending driver offers warns** the passenger and **keeps**
     those offers.
  4. A **cancelled / completed** order cannot be edited — enforced on the server, not just hidden.
  5. Nothing the passenger did not touch is lost — in particular the **mahalla**, which has no column.
  6. `tsc` at baselines; every new string in uz/ru/en; the pre-fill verified field by field.
- **Why now:** the owner asked for it directly, and T-039 showed why it matters — an order whose
  departure time has passed cannot be nudged forward, so the only remedy is to throw it away.
- **Source:** owner, 2026-08-08.

## Owner decisions taken 2026-08-08 (do NOT re-ask)
1. **Full edit**, by reusing `CreatePassengerOfferScreen` with an `offerId` — not a time-only sheet.
2. **Warn, keep the offers** when drivers have already offered. Do not block, do not auto-reject.

## What exists and what does not (verified 2026-08-08 — do NOT re-derive)
✅ **The backend is complete and safe. No API work beyond one guard.**
`PATCH /passenger-offers/:id` (`passenger-offer.routes.ts:43`) → `updateOffer:881`, which whitelists
writable fields via `buildOfferFields` (`user_id`/`status` are excluded by the type, so no
mass-assignment) and validates the patch **against the stored row**. `getOfferById(offerId, userId)`
throws **403** for someone else's order.
❌ **`updateOffer` has no status guard** — a `cancelled` or `completed` order can be patched today.

❌ **The app cannot edit.** `updatePassengerOffer` (`api/passengerOffers.ts:281`) has **zero call
sites**. `CreatePassengerOfferScreen` has **no `useRoute`, no `route.params`** — create only.
`MyPassengerOffersScreen` offers only cancel.

🔴 **The blocker nobody has hit yet: the user app's own `PassengerOffer` type is STALE.** It is
missing **17** fields the driver app already declares and the server already returns —
`is_urgent`, `depart_until`, `arrive_from`, `arrive_until`, `payment_type`, `seat_counts`,
`seat_position_any`, `salon_scope`, `vehicle_class`, `woman_in_car`, `roof_rack_needed`, `trailer`,
`road_pickup`, `road_pickup_note`, `special_order`, `from_landmark`, `to_landmark`.
**The passenger app cannot see most of the order it created.** Pre-fill is impossible until this is
fixed, which is why it is step 1.

## Approach
`CreatePassengerOfferScreen` becomes create-or-edit on a single optional `offerId` route param.
The 25 pieces of state are hydrated from the fetched order; submit branches to PATCH.

⚠️ **The geo cascade is the hard part.** The form holds full `GeoOption` objects; the API stores
**ids** (`from_province_id`, `from_city_id`, `from_settlement_id`). Rebuilding means fetching each
level and matching **by id** — targeted lookups, never a scan across provinces (that mistake is
already logged against the driver app in T-026: `parseLocationText` fanning out country×province
fetches).

⚠️ **Do not resend `from_text`/`to_text` unless the passenger actually re-picks the location.**
The **mahalla has no id column** (T-029) — it exists only inside the stored text. Rebuilding the text
from ids would silently delete it. Leaving the field out of the PATCH preserves it exactly.

## Ordering (read before starting)
⚠️ **T-031 edits the same 757-line file.** Its step 4 is blocked on the owner's salon-option answer,
so **T-040 goes first** and T-031's remaining steps build on the edit-mode version. Do not run both.

## Steps
- [x] 1. **DONE 2026-08-08. The order is visible to its own app again.** `PassengerOffer` now mirrors
  `PassengerOfferAttributes` in the server model — all 17 T-018 fields plus the 8 geo ids.
  ⚠️ The T-018 field types (`PassengerOfferPaymentType`, `PassengerOfferSeatCounts`, …) **already
  existed** further down the same file beside `CreatePassengerOfferData`; they are reused rather than
  redeclared, so there is one copy, not two.
- [x] 2. **DONE 2026-08-08. The server refuses to edit a dead order.** `updateOffer` now rejects
  anything that is not `published` or `driver_found` — new `offers.cannotEditInStatus` ×3 locales.
  Hiding the button in the app would not have been enough; the endpoint was open.
  `tsc` API **282 = baseline**, user **11** (= current baseline); the 4 errors reported in touched
  files were **proven identical at `HEAD`** via `git stash`.
- [x] 3. **DONE 2026-08-08. Edit mode.** Optional `offerId` route param; `isEdit` drives the header,
  the submit label and POST-vs-PATCH. A spinner covers the fetch — without it the form would flash
  its create-mode defaults ("now + 1 hour", empty locations) into a form about to be overwritten.
  ⚠️ The PATCH omits `from_text`/`to_text` by **rest-destructuring**, not `delete` — `delete` on a
  type that declares them required is a `tsc` error, and casting it away would have hidden the point.
- [x] 4. **DONE 2026-08-08. Pre-fill.** All 25 pieces of state hydrated, geo included.
  `hydrateLocation` walks province → city → settlement, **fetching each level from its parent's id
  and matching by id** — 3 requests per side, not the country×province fan-out T-026 logged against
  the driver app.
  ⚠️ **The mahalla guard.** `sameGeo()` compares the *stored ids* with what the form holds; when they
  match, the text is left out of the PATCH entirely, so the stored string — mahalla included —
  survives. Rebuilding it from ids would have deleted the mahalla silently on every edit (T-029).
- [x] 5. **DONE 2026-08-08. Entry point + warning.** Edit button beside Cancel, on the same
  `published`/`driver_found` condition the server enforces — so an **expired** order stays editable,
  which is the point: the passenger can move the time forward instead of starting again. With pending
  driver offers it warns first and keeps them (owner decision).
- [x] 6. **DONE 2026-08-08. Verification — 125/125.** `tsc`: API **282 = baseline** · admin
  **0 = baseline** · user **11** · driver **35** (the two apps' one-below is T-038's, not this card);
  the 2 errors in a touched file were **proven identical at `HEAD`** via `git stash`.
  A true round trip needs the component running, so the check does it **statically over the real
  source**: for all **40** sendable fields it asserts the payload writes each one and the pre-fill
  reads each one — a field missing from either list *is* the bug. Plus the mahalla guard compares ids
  (not text), the geo cascade matches by id, create still POSTs, and all 9 new keys resolve in uz/ru/en.
  ⚠️ **It flagged 4, and 3 were the check being wrong, not the code:** `seats_needed` and
  `max_price_per_seat` are deliberately never sent (T-018 — the server derives the seat count) and
  `arrive_from` is not collected by this form. Omitting a field from a PATCH means "leave unchanged",
  which is correct. **Checked before dismissing:** `buildOfferFields` recomputes `seats_needed`
  whenever `seat_counts` or `salon_scope` is sent, and the edit payload always sends both — so
  changing the seat breakdown does update it. Script: `scratchpad/t040-check.js`.
- [ ] 7. **Owner: deploy the API, rebuild the user app.** Edit an order's time, route, seats and
  flags; confirm nothing else changed and the mahalla survived.
- [ ] 8. Commit (only after the owner's approval).

## Files to touch
- `user-app-standalone/api/passengerOffers.ts` — the stale type
- `user-app-standalone/screens/CreatePassengerOfferScreen.tsx` — edit mode + pre-fill
- `user-app-standalone/screens/MyPassengerOffersScreen.tsx` — the Edit button + warning
- `user-app-standalone/navigation/**` — the `offerId` param
- `user-app-standalone/translations/{uz,ru,en}.ts`
- `api,admin,db/apps/api/src/services/PassengerOfferService.ts` — the status guard (+ i18n)
- ❌ **No migration.**

## Risks / open questions (READ before coding)
- ⚠️ **A silently dropped field is the failure mode here.** 25 pieces of state, and a PATCH that
  omits one leaves the old value while the form showed the passenger something else. Step 6's
  round-trip check exists for exactly this and is not optional.
- ⚠️ **The mahalla cannot be rebuilt from ids** (T-029). Preserve it by not resending the text.
- ⚠️ **`buildOfferFields` validates the patch against the stored row**, so a partial PATCH is safe —
  but the `≥30 min in the future` rule still applies to a non-urgent order. Editing an order whose
  time has already passed **must move the time forward**, or the server will refuse it. Surface that
  as a real message, not a generic failure.
- ⚠️ **T-031 conflict** — see Ordering.
- ⚠️ **Three cards are uncommitted in this tree** (T-037, T-038, T-039). Keep the commits separate.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).
- 🚫 **Do not touch `JWT_EXPIRES_IN`** (owner, 2026-08-08).

## Session notes (one line per work session)
- **2026-08-08** — card opened from the owner's report. Backend proven complete and safe first; the
  real blocker turned out to be the user app's **stale `PassengerOffer` type**, 17 fields behind the
  driver app's, which makes pre-fill impossible until fixed.

## Resume point (for the next chat)
**Steps 1-6 DONE. Only step 7 (owner: deploy + test) and step 8 (commit) remain.**

A passenger can now tap **Edit** on an order, get the whole form pre-filled, change anything and
save. Create mode is untouched. An **expired** order is still editable on purpose — moving the
departure time forward is the repair for T-039's dead end.

**The two things that made this work, and would break it if changed:**
1. **The app's `PassengerOffer` type was 17 fields behind the server** — the passenger app could not
   see most of its own order. Everything else depended on fixing that first.
2. **`from_text`/`to_text` are omitted from the PATCH when the geo ids are unchanged.** The mahalla
   has no id column (T-029) and lives only inside that string; rebuilding it would delete it.

🛑 **API deploy required** (the status guard + its 3 locales), then rebuild the user app.
⚠️ Editing an order whose time has passed **must move the time forward** — the server still enforces
≥30 min for non-urgent orders. The message is the server's own and is translated.

**Baselines to compare `tsc` against:** API **282**, admin **0**, user app **12** (currently **11**),
driver app **36** (currently **35**) — both one below, from T-038's logout fix.
