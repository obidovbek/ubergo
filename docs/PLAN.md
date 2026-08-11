# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> ✅ **T-055 moved intact → `docs/PLAN-T055.md`** (steps 1-7 done; owner's deploy + commit remain).
> ✅ **T-057** → `docs/PLAN-T057.md`. ✅ **T-054** → `docs/PLAN-T054.md`.
> ✅ **T-045** → `docs/PLAN-T045.md`. ✅ **T-024** → `docs/PLAN-T024.md`.
> ✅ **T-056 · T-058 done 2026-08-11** — no separate plan files; small enough to live on their cards.
> 🔴 **T-047 PARKED** — killed-app push tap; needs a `logcat` line before more code.
> 🛑 **T-031 PARKED BY THE OWNER 2026-08-11** — its remaining steps 5-9 **are** the payment work
> (`payment_cash`/`payment_card`/`paid_by_friend` + the waiting-fee setting), and the owner is still
> designing payments, referrals and bonuses. **Do not start it**; a migration into a 3-boolean shape
> would very likely be wrong.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own
> `docs/PLAN-T0*.md`; most are waiting on the owner, not on code.

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
and the others do not — so the text is centred, but that one tile's text sits lower. Removing `\n`
changes line counts too. **Re-check on the device before adding any style, and do not "fix" a
centring that is already correct** (the T-031 item-1 lesson: a correct implementation can still
mislead, but the answer is not always a code change).

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
- [x] 2. **DONE 2026-08-11. `
` stripped from `menu.passengerOrders` and `menu.myJoinRequests`** in
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

## Files to touch
- `driver-app-standalone/screens/MenuScreen.tsx` — the five rows + centring
- `user-app-standalone/screens/MenuScreen.tsx` — centring only (its rows are already correct)
- `driver-app-standalone/translations/{uz,ru,en}.ts` — strip `\n` from two live labels
- ❌ **No API change, no migration, no deploy.** ❌ No navigation changes.

## Risks / open questions (READ before coding)
- 🔴 **Do not delete the dead rows' translation keys.** The owner chose "comment out, stay
  reversible"; orphaning the keys would make restoring them a rewrite in three locales.
- ⚠️ **`menu.empty` is a name collision** — the driver app has `myJoinRequests.empty` ("you have not
  sent any offers yet") **and** `menu.empty`. Only the `menu.` one belongs to a dead row. Check the
  section before touching either.
- ⚠️ **`\n` may be load-bearing for the tile height** — `aspectRatio: 1` fixes the tile square, so a
  label that was 2 lines becoming 1 changes where the text sits. That interacts with step 3; do
  steps 2 and 3 together and judge the result as a whole.
- ⚠️ Both apps carry near-identical screens — any style change is made twice.
- ⚠️ This is a **visual** card. `tsc` and a runtime check can prove the rows and keys are right; they
  **cannot** prove it looks good. The owner's eye is the real test, so keep step 5 honest.
- Environment: Avast breaks npm/Gradle/git TLS (`$env:NODE_OPTIONS="--use-system-ca"`, `GRADLE_OPTS`
  truststore, `git -c http.sslBackend=schannel push origin main`).

## Session notes (one line per work session)
- **2026-08-11** — opened after the owner parked T-031 (payment, pending their design discussion).
  Inventory taken: **5 dead driver rows**, already solved once in the user app; the "ugly break" is
  **hard-coded `\n` in the data**, and **2 of the 6 bad labels are on LIVE rows**. Owner chose
  *comment out, stay reversible*.

## Resume point (for the next chat)
**T-059 steps 1-4 DONE 2026-08-11. Only step 5 (owner: rebuild and look) and step 6 (commit)
remain.** ❌ No API change, no deploy — app rebuild only.

🛑 **THE WHOLE BOARD IS NOW WAITING ON THE OWNER'S DEVICE.** All 18 plan files were swept on
2026-08-11: **there is no Claude coding work left in any of them.** Every unchecked step is the
owner's (deploy / migrate / rebuild / walk / commit), blocked on an owner answer (**T-030** step 7,
**T-031** steps 4-9, **T-047**), or needs a running device and API (**T-018** step 9).

**TEN cards are code-complete and untested**, and they split into exactly two runs:
- **ONE shared API deploy → T-034 · T-043 · T-045 · T-054 · T-055.** No migration in any.
- **App rebuild only → T-024 · T-046 · T-056 · T-057 · T-058 · T-059.**
⚠️ **T-046 also needs its migration run** (it repairs stranded rows and prints the repaired count).

🔴 **The risk of testing nothing for this long is concentrated in one place:** the phone gate
(`gatePhones`) now exists **twice** — `OfferDriverService` (T-054) and `OfferPassengerService`
(T-055) — and neither has been seen on a device. If it is wrong, it is wrong in both services and
both apps. **Test T-054 before building anything else on that pattern.**

⚠️ **Lint cannot run in either RN app** (no `eslint.config.js`; ESLint 9 dropped `.eslintrc`) →
logged as **T-060**. The API's lint runs but is drowned in **24,473 CRLF findings** (T-032).

**What changed today (T-059):** the driver's home menu went from 8 rows to 3, all of which navigate;
labels wrap to the tile instead of breaking where a translator put a `
`; a tile's icon no longer
pushes its label off-centre. Two things surfaced that the card did not ask for — **two uz-only labels
on the user app's own home menu** (RU/EN users saw raw keys), and **a blind spot in T-058's i18n
sweep**, which cannot see keys referenced as data (`titleKey: '…'`). Both fixed; the sweep is wider.

**Baselines:** API **281** · admin **0** · user **9** · driver **35**.
