# 🎯 PLAN — T-114, the per-scope FROM/TO block on the passenger order form

> Split into its own file on 2026-09-13, the same way T-088, T-092, T-101-step16 and T-102 were.
> **`docs/PLAN.md` still holds T-101's plan and was NOT rewritten** — 152 KB of an active card.
> Its header now points here.

---

## 1. Task

**ID:** T-114 (P1, *Now*) · **Origin:** owner device test, 2026-09-13 —
*"user app user order … there must be different FROM, TO part"*, naming all four boards.

**Scope of THIS plan: sub-step ① only** (owner's call, 2026-09-13) — the scope-root card and the
per-scope picker entry level. The completeness rules (②) are a follow-up card.

### Goal / definition of done

Opening the order form from each of the four home-carousel scopes produces the from/to block that
scope's artboard draws:

| scope | board | root card above the block | picker opens at | pinned into the path |
|---|---|---|---|---|
| `aro` | `UserBuyurtma` | **none** | **viloyat** (adm1) | — |
| `viloyat` | `UserBuyurtmaViloyat` | **`Viloyat (Adm1)`** | **tuman** (adm2) | province |
| `tuman` | `UserBuyurtmaTuman` | **`Tuman (Adm2)`** | **QFY** (adm3) | province + district |
| `yaqin` | `UserBuyurtmaYaqin` | **none** | **viloyat** (adm1) | — |

Done when: all four render as above; changing the root re-pins both endpoints; the root card
survives an edit round trip; a checker asserts the per-scope config and goes red when mutated;
every baseline unchanged.

### Why now

The owner is device testing and this is what they hit. ① is **fully unblocked** — it needs no
migration, no API change, and nothing from T-102.

---

## 2. What is true today (measured 2026-09-13, not assumed)

🟢 **THE MECHANISM ALREADY EXISTS AND WAS BUILT FOR THIS CARD.** `components/geo/GeoSheet.tsx`
takes **`startLevel`** and **`initialPath`**, and its own header says why:

> *"`startLevel` lets a caller skip levels the scope already fixes — *Viloyat ichi* opens at adm2
> with the region pre-chosen, so the passenger does not pick it twice. **That is the whole reason
> the artboards have four `UserBuyurtma*` files.**"*

🔴 **AND THE CALLER HARDCODES BOTH.** `LocationCard.tsx:207-208` passes `startLevel="province"`
and `endLevel="settlement"` as literals, and takes neither as a prop. So the capability is built,
wired to nothing, and four boards collapse onto one.

🔴 **`CreatePassengerOfferScreen.tsx:127` reads `scope` and spends it on the header subtitle.**
Its own comment at line 125 says so: *"the subtitle is the scope name, which is the only thing
separating the four scopes."* The card is that comment coming true.

### What the artboards actually differ by — measured, all four

**All four pickers are byte-identical** (`pickAdm2` / `pickAdm3` run 1→2→3→4 in every file; step 4
is the landmark form). The difference is **only the entry step and what is pinned**:

```
aro      openFrom: { sheet:"from", sheetStep: 1 }
viloyat  openFrom: { sheet:"from", sheetStep: 2, tmpAdm1: viloyat }
tuman    openFrom: { sheet:"from", sheetStep: 3, tmpAdm1: viloyat, tmpAdm2: tuman }
yaqin    openFrom: { sheet:"from", sheetStep: 1 }
```

**The root card** (`viloyat` + `tuman` only — `openVil` and the `map` icon appear **zero** times in
the other two files) is one component with one label swapped, measured off the markup:

- white card · border **1.5px** `{{ vilBc }}` · radius **20** · padding **13** · gap **11**
- icon tile **38×38** · radius **13** · bg `#DCF6E4` · Material Symbols `map` · 21px · `#155C40`
- eyebrow: JetBrains Mono · 11px · 700 · letter-spacing `.1em` · uppercase · `#8A857A` —
  `Tuman (Adm2)` / `Viloyat (Adm1)`
- value: 15px · **800** · `{{ vilFg }}` — `vilLabel` is `viloyat` (Viloyat board) or
  `viloyat + ", " + tuman` (Tuman board)
- chevron right 19px `#8A857A`; the whole card is `onClick={{ openVil }}`

⚠️ **`vilBc` is `#05BB42`** — the artboards' `brand` green. Per the design-system header that green
fails contrast wherever it **carries meaning**; here it is a 1.5px border, so check it against the
`action` token before copying the literal. It has been substituted three times already on T-101.

### 🔴 One contradiction found between the artboards and the rules module

`UserBuyurtmaTuman`'s `place()` treats an endpoint as complete with **adm1 + adm2 only** (adm3
optional), but `validateScope(order, 'tuman')` in `api/src/utils/geoMatch.ts` matches at **adm3**
and pushes `missing_from` / `missing_to` without a settlement on both sides. **An order that form
accepts, the matcher refuses.**

✅ **DECIDED BY THE OWNER 2026-09-13: the QFY is REQUIRED on Tuman.** The rules module stands;
the form tightens beyond what the artboard draws. *Enforcement belongs to ② — but ① already makes
it natural, because the Tuman picker opens **at** the QFY step and that is all it asks for.*

---

## 3. Approach

**Push the scope's geo shape into data, then let two components read it.** Not four screens, not a
branch per scope in the render path — one table, in `types/orderScope.ts`, beside the scope list
that already lives there.

```ts
ORDER_SCOPE_GEO: Record<OrderScope, {
  rootLevel: null | "province" | "district";  // null = no root card
  startLevel: GeoLevel;                       // where the from/to picker opens
}>
```

Everything else falls out of it: the root card renders when `rootLevel !== null`, its own
`GeoSheet` ends at `rootLevel`, and the from/to sheets open at `startLevel` with the root as
`initialPath`. **One place to read when a fifth scope appears.**

⚠️ **Deliberately NOT touching `endLevel`.** All four boards run the picker to adm3; that is
already what `LocationCard` passes. Only the START differs.

---

## 4. Steps

- [x] **1. The config table.** `ORDER_SCOPE_GEO` in `types/orderScope.ts` with the four entries
      above, plus `scopeRootLabelKey(scope)`. Pure data, no imports from components.
- [x] **2. `LocationCard` takes the two props it hardcodes.** `startLevel` and `initialPath`
      through to `GeoSheet`; defaults keep today's behaviour so nothing else moves.
- [x] **3. `ScopeRootCard`.** New component in `components/passengerOffer/`, built to the measured
      spec in §2. Opens a `GeoSheet` with `endLevel = rootLevel`. **Resolve the border colour
      against the palette rather than copying `#05BB42`.**
- [x] **4. Wire it into the screen.** Scope-root state in `CreatePassengerOfferScreen`; render the
      card above `routeCard` when `rootLevel !== null`; feed `startLevel` + `initialPath` to both
      `LocationCard`s.
- [x] **5. 🔴 Re-pin on root change.** Changing the root must CLEAR both endpoints — they were
      chosen under the old root and would otherwise silently describe a different place. This is
      the "clear the child when the parent changes" rule `GeoSheet` exists to centralise, and it
      is the step most likely to be the bug.
- [x] **6. Edit round trip.** An order opened for edit must restore its root card from the stored
      path (`hydrateLocation` already rebuilds province/district). A root that loads blank and is
      then saved is the "saves but never loads back" failure this project keeps hitting.
- [x] **7. i18n.** Keys for the two eyebrows and the root sheet titles, in **uz · ru · en**, and
      the locale files are **CRLF**.
- [x] **8. A checker that can go red.** `scripts/check-order-scope-geo.mjs` over the pure config
      and the re-pin rule; prove it red on ≥ 5 mutations, restore byte-identical.
- [x] **9. Baselines + docs.** user `tsc` 6 · lint 0/208 · tokens 1 · all checkers; then TODO,
      JOURNAL, and this file's session notes.

---

## 5. Files to touch

| file | change |
|---|---|
| `user-app-standalone/types/orderScope.ts` | **+** `ORDER_SCOPE_GEO`, `scopeRootLabelKey` |
| `user-app-standalone/components/passengerOffer/ScopeRootCard.tsx` | **new** |
| `user-app-standalone/components/passengerOffer/LocationCard.tsx` | `startLevel` / `initialPath` props |
| `user-app-standalone/screens/CreatePassengerOfferScreen.tsx` | root state, re-pin, wiring |
| `user-app-standalone/translations/{uz,ru,en}.ts` | new keys (**CRLF**) |
| `user-app-standalone/scripts/check-order-scope-geo.mjs` | **new** |
| `docs/TODO.md` · `docs/JOURNAL.md` · this file | bookkeeping |

❌ **No migration. No API change. No driver-app change.** `PassengerOffer` already has all 8 geo id
columns and already populates them (verified end to end 2026-09-12) — this is a form problem.

---

## 6. Risks / open questions

- 🔴 **Step 5 is where the silent bug lives.** A stale endpoint under a new root still *renders*
  fine; it is only wrong. Nothing throws. Assert it in the checker, not by eye.
- 🔴 **Do not let the root card become a fifth copy of the cascade.** It opens `GeoSheet` like
  everything else. The seven-copies note in `GeoSheet`'s header is the warning.
- ⚠️ **The `#05BB42` border.** Resolve against the palette; `brand` has been substituted three
  times on T-101 already for exactly this.
- ⚠️ **`aro` and `yaqin` are identical in ①.** That is measured, not an oversight — they diverge
  only in completeness (`yaqin` requires adm3), which is ②. Do not invent a difference.
- ❓ **Open, for ②:** where `yaqin`'s "not the same district on both ends" is refused —
  client-side, or surfaced from `validateScope`'s `same_district`.
- ❓ **Open:** does the home carousel pass `scope` on the EDIT path too, or only on create? If an
  edited order carries no scope, the form falls back to `DEFAULT_ORDER_SCOPE` (`aro`) and would
  drop a Tuman order's root. **Measure before step 6.**

---

## 7. Session notes

### 2026-09-13 (2) — the first device run found it: an empty picker, no error

**Owner:** *"tuman ichi -> Viloyat va tuman tanlang shows nothing, the same with others related"*.
**Right, and one cause explained every symptom.**

`GeoSheet` loads a level only when the level ABOVE it is already in the path —
`else if (lvl === "province" && p.country)`. When that ancestor is missing it does **not** throw
and does **not** set an error: it sets an EMPTY LIST, which looks exactly like a region that
genuinely has no districts. The country here is fixed to Uzbekistan and never shown (OR-004), so
every caller must put it back into the path by hand. `LocationCard` always did, inline.
**`ScopeRootCard` opened its sheet with `initialPath={value}` — the root, which starts `{}`.**

So the root could never be picked; `scopeRoot` stayed empty; and the `viloyat` / `tuman` from-to
pickers, which open at district and settlement, then had no ancestor either. **"The same with
others related" was the same bug, one layer down.**

**Fixed as a RULE, not a prop.** `scopeSheetPath(countryId, chosen)` in `utils/scopeRoot.ts` is now
the single way a sheet path is built, and `LocationCard`'s correct-but-inline version was replaced
by it too — the next caller cannot get this wrong the way the root card did.

🔴 **THE CHECKER DID NOT CATCH THIS, AND THAT IS THE REAL LESSON.** 50 assertions passed over a
screen that could not pick a province. They covered the config table and the merge — the things I
had written — and nothing asserted the SHEET IS OPENABLE, which is the only thing the passenger
experiences. **+8 assertions**, including a general one that walks every scope and checks the
picker's opening level has its parent in the path. The mutation that reproduces the shipped bug
exactly now fails **5** of them.

⚠️ **`GeoSheet`'s `startLevel` prop already documented this** — *"Anything above it must be
supplied in `initialPath`"*. I read that line, quoted its neighbour in the plan, and still did not
follow it. A doc comment is not a guard: the silent-empty branch is what needed the assertion.

### 2026-09-13 — ① built: the scope now drives the form, and two things moved to be testable

**All nine steps done.** The scope's geo shape is one table (`ORDER_SCOPE_GEO`), read by
`ScopeRootCard` and by both `LocationCard`s. `LocationCard`'s hardcoded `startLevel="province"`
became a prop; `GeoSheet` needed no change at all — it has taken `startLevel` since it was
written, and the caller was the only thing missing.

🔴 **THE EDIT PATH CANNOT KNOW THE SCOPE, AND I DID NOT LET IT GUESS.** `MyOrdersScreen:263` and
`MyPassengerOffersScreen:245` navigate here with `{ offerId }` and no scope — measured, and it
was the open question §6 flagged. `match_scope` is migrated but **not in `PassengerOffer`'s model**
(T-102b wrote migrations only), so nothing returns it until T-102d. The screen reads it
defensively and falls back to the default, so the day T-102d lands this starts working with no
further app change. **Inferring the scope from the stored path was rejected**: an `aro` order that
happens to stay inside one district is indistinguishable from a `tuman` one — which is exactly why
the migration stores the SCOPE, not the level. What IS restored, exactly and without guessing, is
the root VALUE: whatever province/district the endpoints already name *is* the root.

⚠️ **TWO THINGS MOVED OUT OF COMPONENTS TO BE TESTABLE AT ALL.** `mergeScopeRoot` and
`scopeRootChanged` first went into `LocationCard`, and the checker could not bundle it: a file
importing react-native cannot be built for `--platform=neutral`. They now live in
`utils/scopeRoot.ts` with a structural geo type, the same shape and for the same reason as the
driver app's `utils/offerRestore.ts`. **A rule inside a component is a rule no checker here can
execute** — worth remembering before writing the next one.

⚠️ **The artboard's eyebrow colour was NOT copied.** `#8A857A` measures 3.28:1; the palette had
already corrected it to `tertiary` (#716D64, 4.61:1). The border's `#05BB42` **was** kept, as
`brand` — the palette header sanctions it for "selection borders" specifically. Raw colour
literals stayed at **1**, the ceiling. The `map` glyph is `MaterialIcons`, the app's own icon set,
not the emoji I first reached for.

**Verification.** user `tsc` **6** — *identical error set*, proved by stashing, not by counting ·
lint **0 / 208** · raw colours **1/1** · **9 checkers green**. `check-order-scope-geo.mjs` is new:
**58 assertions** (50 + 8 after the device defect), **RED on all 11 mutations** across all three files it covers (the config table,
the pure merge, and a locale), every file restored byte-identical. Driver and API untouched and
re-measured: `tsc` 28 / 281, 284 tests.

🛑 **NOT RUN ON A DEVICE.** The honest test is in §8.

---

## 8. Resume point — 2026-09-13

✅ **SUB-STEP ① IS CODE-COMPLETE, all nine steps, every baseline unmoved.**
🟢 **FIRST DEVICE RUN 2026-09-13 FOUND ONE DEFECT — the empty picker — NOW FIXED** (§7).
🛑 **The rest of the walk below has still not been done, item 2 above all.**

### What to check on the phone, in this order

1. **Open the order form from each of the four home tiles.** *Viloyat ichi* and *Tuman ichi* draw
   the root card; *Shaharlar aro* and *Yaqin* must NOT. Then open a from/to picker on each: it
   should start at viloyat · tuman · QFY · viloyat respectively, never asking again for what the
   root already fixed.
2. **🔴 THE ONE NO CHECKER COVERS — the re-pin.** On *Viloyat ichi*: pick a province, fill BOTH
   endpoints, then change the root province. **Both endpoints must clear.** If they keep their old
   districts the order is silently wrong, and nothing will throw. Then re-open the root sheet and
   confirm the SAME province — the endpoints must NOT be cleared that time.
3. **Edit an order created TODAY** (after this change): it must reopen in the scope it was made
   with — *Tuman ichi* comes back as *Tuman ichi*, root card and all, with both endpoints restored.
   Save without touching the route: nothing about the addresses may change.
   ⚠️ **An order created BEFORE today opens as *Shaharlar aro* with no root card.** That is
   correct, not a bug: it never recorded a scope, and inferring one from its geo would be a guess.

### What is NOT done

- **② the completeness rules** — `yaqin` requiring a QFY on both ends, and the per-scope MATCH
  strip. Needs its own card. The owner has already decided the piece that blocks it:
  **the QFY is REQUIRED on Tuman**, the rules module stands, the form tightens.
- ✅ **RESOLVED 2026-09-13 — the edit path now opens in the order's own scope.** The owner asked
  for it directly (*"on edit it should open based on how created"*), so **T-102d's scope half was
  built**: `match_scope` reached `PassengerOffer`'s model, the service accepts/validates/returns
  it, and the form sends it on create and edit. An order made BEFORE today still has NULL and
  opens with the default — correct, and not guessable from its geo.
- ⚠️ Three call sites navigate here with no scope at all and will always be `aro`:
  `MyOrdersScreen:729`, `MyPassengerOffersScreen:589` and `:629` (the "new order" buttons). That is
  today's behaviour, unchanged — but it means the default is reachable from more than the edit path.

⚠️ **T-102 stays live in *Now*** (owner, 2026-09-13). Its resume point is `PLAN-T102.md` §9 and its
next step is T-102d — which is also what finishes this card's edit path. **This card touched no
API and no migration.**
