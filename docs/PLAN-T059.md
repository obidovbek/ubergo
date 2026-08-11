# 🎯 PLAN — T-059 (moved intact from `docs/PLAN.md` on 2026-08-11)

> Steps 1-4 are DONE. Only the owner's rebuild (step 5) and the commit (step 6) remain.

## Task
- **ID / name:** T-059 — menu cleanup in both apps (owner item C)
- **Goal (definition of "done"):**
  1. No menu row that **does nothing** is shown to a driver.
  2. Menu labels **wrap to the tile**, instead of breaking where a translator put a `\n`.
  3. A tile with no icon centres its text vertically.
  4. Nothing else on the menu changes — the working rows keep their destinations and their badges.
  5. `tsc` at baselines: API **281** · admin **0** · user **9** · driver **35**.
- **Why now:** owner, 2026-08-11 — *"both apps remove unnecessary menu items, and make text vertical
  centered (if there is no icon). in home menu items words braked ugly"*. Last un-started item from
  the owner's list; everything else there is either done or blocked.

## What is already there (verified 2026-08-11 — do NOT re-derive)
✅ **Both apps' menus are the same code** — identical `optionsGrid` / `optionButton` / `optionText`
styles, `width: '47%'`, `aspectRatio: 1`, already `justifyContent: 'center'` + `alignItems: 'center'`.
🔴 **The driver app has FIVE dead rows** — `viloyatlar`, `ichi`, `tuman`, `empty`, `xalqaro`. They
fall through `handleOptionPress` into an empty `else` with a `// TODO: Add navigation for other
options` (`MenuScreen.tsx:87-89`). They are tappable and do nothing.
✅ **The user app ALREADY fixed this** — the identical five are **commented out** at
`user…/MenuScreen.tsx:59-63`. The driver app simply never got the same treatment. **Owner chose the
same approach (2026-08-11): comment out, keep the keys, stay reversible.**
🔴 **The "ugly break" is hard-coded `\n` in the translation data**, not a layout bug:
- Dead rows (going away anyway): `'Taksi\nViloyatlar Aro'`, `'Taksi\nViloyat\nichi'`,
  `'Taksi\nTuman,\nichi va Yaqin\nmasofalar'`, `'Taksi\nXALQARO'`.
- 🔴 **Two LIVE driver rows keep the problem in all three locales:**
  `menu.passengerOrders` = `'Yo'lovchi\nbuyurtmalari'` / `'Заказы\nпассажиров'` /
  `'Passenger\norders'`, and `menu.myJoinRequests` = `'Yuborilgan\ntakliflarim'` /
  `'Мои\nпредложения'` / `'My sent\noffers'`.
- ✅ **The user app's four labels carry NO `\n`** — which is why only the driver menu looks wrong.
  That asymmetry is the whole bug.
⚠️ **The vertical-centring complaint is subtler than it sounds.** `optionButton` is already
`justifyContent: 'center'`. What differs is that **`myOffers` renders an icon block above its text**
and the others do not — so the text is centred, but that one tile's text sits lower.

## Approach
Data first, layout second — because most of the visible damage is in the translation strings.
1. Comment out the five dead driver rows (mirroring the user app exactly, including the comment
   style), so the tappable-but-dead rows and 4 of the 6 bad labels disappear together.
2. Strip `\n` from the two surviving driver labels in all three locales and let the tile wrap.
3. Only then look at centring, with the icon/no-icon difference in mind.

## Steps
- [x] 1. **DONE 2026-08-11. The five dead driver rows are commented out**, mirroring the user app,
  with a comment naming the reason (no destination exists) so nobody re-adds them blindly.
  ✅ **The empty `else` went too** — that was the mechanism that made them tappable-but-silent. A row
  added later without a destination now has nothing to fall through to.
- [x] 2. **DONE 2026-08-11. `\n` stripped from `menu.passengerOrders` and `menu.myJoinRequests`** in
  uz/ru/en. The four dead-row labels keep theirs, per the owner's "stay reversible" choice.
- [x] 3. **DONE 2026-08-11. Centring — and the diagnosis changed the fix.** `optionButton` was
  **already** `justifyContent: 'center'`, so the icon-less tiles were never wrong. What was wrong is
  that `myOffers` draws an icon **in flow**, so that tile centred *icon + text as a group* and its
  label sat lower than its neighbour's in the same row. `offersIconContainer` is now absolutely
  positioned, so the label centres identically on every tile. **No style was added to the tiles
  themselves** — fixing a centring that was already correct was the trap the plan warned about.
- [x] 4. **DONE 2026-08-11. 54/54, proven able to fail — 26 red.**
  🔴 **The suite found a defect this card did not go looking for:** `menu.driverOffersTitle` and
  `menu.myBookings` exist in **uz only**, so **RU and EN users saw the raw key on two of their four
  home tiles.** Fixed in both locales.
  🔴 **And it exposed a blind spot in T-058's sweep**, which had passed the same app as clean two
  cards ago: those keys are referenced as **data** (`titleKey: 'menu.foo'`), never as a literal
  `t('…')`, so the `t()` regex could not see them. The sweep now follows `titleKey` / `labelKey` /
  `messageKey` / `placeholderKey` too — **+16 keys, 2685 lookups**, both apps clean, and re-running it
  against pre-change code reproduces **7** faults instead of the 5 it used to find.
  `tsc` user **9** · driver **35**, both at baseline.
- [ ] 5. **Owner:** rebuild both apps, look at the home menu.
- [ ] 6. Commit (only after the owner's approval).

## Files touched
- `driver-app-standalone/screens/MenuScreen.tsx` — the five rows + centring
- `user-app-standalone/screens/MenuScreen.tsx` — centring only (its rows are already correct)
- `driver-app-standalone/translations/{uz,ru,en}.ts` — strip `\n` from two live labels
- ❌ **No API change, no migration, no deploy.** ❌ No navigation changes.

## Risks / open questions
- 🔴 **Do not delete the dead rows' translation keys.** The owner chose "comment out, stay
  reversible"; orphaning the keys would make restoring them a rewrite in three locales.
- ⚠️ **`menu.empty` is a name collision** — the driver app has `myJoinRequests.empty` **and**
  `menu.empty`. Only the `menu.` one belongs to a dead row.
- ⚠️ This is a **visual** card. `tsc` and a runtime check can prove the rows and keys are right; they
  **cannot** prove it looks good. The owner's eye is the real test.

## Session notes
- **2026-08-11** — opened after the owner parked T-031. Inventory taken: **5 dead driver rows**,
  already solved once in the user app; the "ugly break" is **hard-coded `\n` in the data**, and
  **2 of the 6 bad labels are on LIVE rows**. Owner chose *comment out, stay reversible*.

## Resume point
**T-059 steps 1-4 DONE 2026-08-11. Only step 5 (owner: rebuild and look) and step 6 (commit)
remain.** ❌ No API change, no deploy — app rebuild only.
