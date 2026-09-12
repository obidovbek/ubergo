# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 📦 **T-088 (Paynet) IS NOT FINISHED — it moved to `docs/PLAN-T088.md` on 2026-08-30.** It is still
> in *Now*. Its one remaining Claude coding step is **`ChangePassword` persistence**; the rest is
> **T-100** (proxy layer) and Paynet's credentials. Resume it from that file.
> 📦 **T-101 STEP 16 (the offer wizard) → `PLAN-T101-step16.md`, split 2026-09-05.** Not started.
> ✅ **T-092** → `PLAN-T092.md`. ✅ **T-091** → `PLAN-T091.md`. ✅ **T-087** → `PLAN-T087.md`.
> ✅ **T-081** → `PLAN-T081.md`. ✅ **T-078** → `PLAN-T078.md`. ✅ **T-077** → `PLAN-T077.md`.
> ✅ **T-065** → `PLAN-T065.md`. ✅ **T-066+T-067** → `PLAN-T066-T067.md`. ✅ **T-061** → `PLAN-T061.md`.
> 🔴 **T-047 PARKED.** 🛑 **T-031 — item 1 CLOSED by the owner, do NOT reopen** → `PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own files.

## 🔴 BOARD STATE 2026-08-31 — read before starting anything

**`tsc` BASELINES: API 281 · admin 6 (via `tsc -b`) · user 6 · driver 28.** All four lint at **0 errors**.
🔴 **ADMIN CORRECTED 2026-09-11: "admin 0" was never a measurement.** It came from plain
`tsc --noEmit` against a solution-style `tsconfig.json` that lists NO files — it checked nothing.
The build command (`tsc -b`, what `npm run build` runs) reports **6** unused-variable errors in
files untouched since 2025-11, so a local admin build FAILS; the Dockerfile switches
`noUnusedLocals`/`noUnusedParameters` off before building, so the deploy is unaffected.
**Measure admin with `npx tsc -b --pretty false`.**
🟢 **LINT WARNING BASELINES, RE-MEASURED 2026-09-11: user 216 · driver 275.**
Both are *below* where this card started (user 225 → 218 → **216**, driver 304 → 289 → 280 → **275**);
the conversions removed unused imports. **Neither was ever rebaselined upward to accommodate a
change** — every deviation during the card was a real defect and was fixed.
🔴 **The 225 / 289 / 304 figures recorded elsewhere in these files are HISTORY, not baselines.**
*A stale baseline reads a clean run as an improvement and hides a real regression — the trap that
misled T-031, and the reason these numbers are dated every time they are written.*

🟢 **RAW-COLOUR CEILINGS: user 1 · driver 3 — both at their floor**, enforced by
`scripts/check-design-tokens.mjs` in each app. All 4 remaining literals are deliberate third-party
constants; see the Resume point.

🛑 **THE TWO APP REBUILDS ARE STILL OUTSTANDING** — user (T-077 · T-083 · T-084) and driver
(T-078 · T-079/T-080 · T-061; T-076 removed a native dep).
🔴 **AND AS OF 2026-08-30 BOTH REBUILDS ARE NATIVE.** The owner approved `expo-linear-gradient`
and `react-native-svg` for both apps, so the **user** app now needs a prebuild too — it was going
to be a JS-only rebuild. **This card rides the outstanding rebuilds, but it upgrades one of them.**

---

## Task

- **ID / name:** T-101 — rebuild both apps on the new `htmlDesign/` design system
- **Why now:** the owner drew **33 artboards** with Claude Design on 2026-08-29 and asked (2026-08-30)
  to *"first change overall apps design and then step by step pages."* The apps' current look
  predates them entirely.

### Goal (definition of "done")

1. **One authoritative token layer per app** (`themes/`) carrying the artboards' real values —
   ground, surface, text tiers, accent, danger, borders, radii, spacing, type scale, fonts —
   and **`themes/` is actually what the screens read.**
2. **Manrope + JetBrains Mono render on a device**, at the artboards' weights (up to 900).
3. **A persistent top bar and a 5-tab bottom bar exist in both apps** and match the artboards.
4. **Dark mode is gone** — `darkPalette` deleted, no mode switch anywhere, `tsc` still at baseline.
5. **Every converted screen reads 0 raw colour literals**, proven by the step-1c counter script.
   🔴 **MEASURED CEILING: user = 839** (set 2026-08-30). The "789 / 863 / 1 652" figures quoted
   elsewhere in this file came from a **hex-only** grep and are undercounts — the script also counts
   `rgba()`/`hsl()` and scans `layout/` and `navigation/`. **Trust the script, not the prose.**
   The driver ceiling is recorded at step 1d.
6. Each converted screen is walked on a device against its artboard by the owner.

### Explicitly OUT of scope (owner, 2026-08-30)

- 🛑 **All new roles** — *usta*, *yuk mashinasi egasi*, *texnika*. Owner: *"do nothing for new roles,
  think like there is no other new roles."* So `UserUsta`, `UserTexnika`, `Yuk1`, `Yuk2`,
  `UserUstaBuyurtma`, `YukMashinalarElon`, `YukEgalariSorov` are **not built and not designed for.**
- 🛑 **Dark mode** — dropped, not deferred.
- ⏸️ **The admin panel** — owner said *"maybe admin"*. Not in this card; board it separately if wanted.
- 🛑 **No backend/API change.** This card is presentation only. If a screen needs data the API does
  not return, that becomes its own card — do not widen this one.

---

## Approach

**Foundation first, then one screen at a time — because the foundation is the whole point.**

The apps' real design system is **not** `themes/`; it is **1 652 hardcoded hex literals** (user 789,
driver 863) across **154 distinct values**. `themes/` is imported by 25 files but its palette
(`primary #000000`, `secondary #00D9A5`) matches almost nothing rendered. **Repainting screens
before fixing that just replaces old literals with new ones** and we are back here in a month.

So: build the token layer, prove it with a counter script that can only go down, then convert
screens one at a time, each screen ending at **zero raw hex**.

**Grounding rule for this card — the artboards win, not the design docs.** Vindicated twice in
step 1a. ① `htmlDesign/docs/00-UMUMIY-loyiha.md` says blue `#0049FF` is the Driver colour; measured,
green beats blue **398 to 51** across the 18 driver artboards, and the blue turns out to be the
sub-brand word "Driver", not an accent. ② The artboards **load** JetBrains Mono at three weights and
**use** it at six — a difference browsers hide and React Native does not.
**Neither was visible by reading; both were one `grep` away.** Every token in this card is extracted
by counting, not by reading prose — including prose written earlier in this very plan file.

**Per `ubexgo-app-conventions`: tokens are duplicated per app, NOT extracted to a shared package.**
Edit both copies together and verify with `diff -q`.

---

## Steps

### Phase 1 — foundation (both apps; nothing looks different yet except chrome)

- [x] **1a. Extract the token set by measurement. ✅ DONE 2026-08-30 → `docs/DESIGN-TOKENS.md`.**
      Measured with a 16-agent workflow (8 of 9 measurers returned before the account spend limit
      killed the rest), then **every headline number re-verified by hand against the source files**.
      Raw inventory: 615 colour observations · 208 type styles · 138 radii · 215 spacing · 191 sizes
      · 92 shadows · 17 gradients · 266 component specs · 181 flagged inconsistencies.
      🔴 **THE ACCENT QUESTION IS SETTLED, AND BOTH EARLIER READINGS WERE WRONG.** Green beats blue
      **398 to 51** in the driver artboards — but the blue is not decorative either: the header is
      **two words, "UbexGo" `#05BB42` + "Driver" `#0049FF`**, in **all 18** driver artboards and
      **zero** user ones. So the accent is **green in both apps** and `#0049FF` is exactly one token
      (`brandSuffix`). *The design doc pointed at something real and described it wrongly.*
      🔴 **A SHIPPABLE BUG CAUGHT: the artboards LOAD JetBrains Mono at `wght@400;500;600` but USE
      it at 700/800/900 — 290 times.** Browsers synthesise those weights; **React Native does not.**
      Bundling what the design declares would have rendered 290 prices and times one weight too
      light, with no error. Correct set is in `DESIGN-TOKENS.md` §3.1 — **it is not what step 2 below
      originally said.**
      🔴 **CONTRAST MEASURED, NOT ASSUMED: the redesign's primary CTA fails WCAG at 2.56:1**
      (white on `brand #05BB42`). Fix is one token — see owner question ① in `DESIGN-TOKENS.md` §9.
      ⚠️ **UNAUDITED:** the spend limit also killed both adversarial reproduction checks and the
      completeness critic, so **nothing has tried to falsify this token set**. And the 9 driver
      document/registration artboards (steps 21-22) were **never measured at all**.
      🛑 **AWAITING THE OWNER — 8 questions in `DESIGN-TOKENS.md` §9 gate step 1b.**
- [x] **1b. Rewrite `themes/` in the USER app. ✅ DONE 2026-08-30.**
      `themes/palettes/light.ts` and `themes/index.ts` rewritten to the measured tokens; the type
      scale, the `font()` helper, RN-converted shadows, `sizes`, `states` and the new `modal`
      language all landed. **`tsc` back at baseline 6, lint 225/0 — both exactly as before.**
      ✅ **The theme was EXECUTED, not just compiled** (esbuild bundle with `react-native` stubbed):
      `action` = `#1F7A55`, `font('mono',800)` folds to `JetBrainsMono_700Bold`,
      `createTheme('dark') === theme`. Compiling proves the types; running proves the values.
      🔴 **I BROKE 201 ERRORS INTO THE TREE MID-STEP AND HAD TO BACK OUT TWO DECISIONS.**
      ① I turned `palette.border` from a **string** into an object — 9 call sites pass it straight
      to `borderColor`. The ramp now lives at **`palette.borders`** (plural) and `border` stays a
      string. ② I made `spacing` both callable *and* indexable; that **defeats inference inside
      `StyleSheet.create`** and lit up all 190 call sites. `spacing` is a plain function again and
      the named scale lives beside it as **`space`**. *Both were "tidier" designs that the existing
      code could not accept — the baseline caught them within one command.*
      ⚠️ **`palettes/dark.ts` was NOT deleted** — `darkPalette` is exported as an alias of the light
      palette so the importers keep compiling. It dies with the other aliases in step 23.
- [x] **1c. Write `scripts/check-design-tokens.mjs`. ✅ DONE 2026-08-30 — AND PROVEN ABLE TO FAIL.**
      Plain node, no dependency. `--report` gives a per-file breakdown, `--set` lowers the ceiling.
      🔴 **THE CEILING IS 839, NOT THE 789 THIS PLAN PREDICTED.** The earlier figure came from a
      hex-only `grep`; the script also counts `rgba()`/`hsl()` and scans `layout/` and `navigation/`
      as well as `screens/`+`components/`. **839 is the real number** — the plan's headline
      "1 652 literals" is likewise an undercount, and both goal §5 and the Approach still quote it.
      ✅ **PROVEN RED:** adding one `"#ABCDEF"` to `BlockedScreen.tsx` → `840 > 839`, **exit 1**;
      reverted via `git checkout` → green at 839, `git diff` empty. *A check that cannot go red
      proves nothing, so it was made to go red on purpose.*
      **Worst offenders for Phase 2:** `SearchOffersScreen` 132 · `OfferDetailsScreen` 119 ·
      `MyBookingsScreen` 93 · `MyPassengerOffersScreen` 73 · `EditProfileScreen` 49.
- [x] **1d. Mirror 1b into the DRIVER app. ✅ DONE 2026-08-30.**
      `themes/index.ts`, `themes/palettes/light.ts` and `scripts/check-design-tokens.mjs` copied
      across. **`tsc` 28 at baseline on the FIRST run** — the alias strategy held in both apps.
      ✅ **The accent finding HELD: the two palettes are value-identical.** `diff` reports only a
      comment block on `brandSuffix`; **no colour differs between the apps.** The driver app is
      green, exactly like the user app, and the blue is the wordmark's second word.
      🔴 **DRIVER CEILING IS 964** (user 839). Worst: `OfferWizardScreen` 127 ·
      `SearchPassengerOffersScreen` 111 · `OfferPassengersScreen` 78 · `PassengerOfferDetailsScreen`
      69 · `components/offers/OfferDetailModal` 62.
      🔴 **AND THE DRIVER LINT BASELINE TURNED OUT TO BE STALE** — see the board-state note above.
      Measured **289 before my change and 289 after** by `git stash`-ing the theme; the recorded 304
      was already wrong. **Checked rather than celebrated:** a 15-warning "improvement" I had not
      earned was the tell. The user app's 225 was re-measured the same way and is correct.
- [x] **2. Fonts. ✅ DONE 2026-08-30 — owner supplied the families; 7 faces bundled per app.**
      `assets/fonts/` (1.2 MB per app) + `themes/fonts.ts` + `useFonts` gated on the existing
      splash in both `App.tsx`. **No new dependency** — `expo-font` was already there.
      🔴 **MANROPE 900 DOES NOT EXIST, AND THE DESIGN HAS ALWAYS RENDERED AT 800.** The family stops
      at ExtraBold — the variable font's `wght` axis is **200..800** and the static set has no Black.
      The artboards nevertheless request `wght@...;900` and use 900 **113 times**, including the
      wordmark; **Google Fonts silently substitutes 800**, so folding 900 -> 800 *reproduces* the
      artboards rather than falling short of them. **Do not go hunting for a Manrope Black** —
      another foundry's black would make the app diverge from the design, not match it.
      *This is the third time this card that the design's declared fonts and its real ones differ.*
      ✅ **Mono 700 IS bundled** — the artboards never load it but use it 250 times (step 1a).
      ✅ **Manrope 400 is NOT bundled** — declared, used zero times.
      ✅ **A name/file consistency check was run, not assumed:** every face referenced by
      `themes/index.ts` is loaded by `fonts.ts` and backed by a real `.ttf`, with no orphans, in
      **both** apps (7 files / 7 loaded / 7 referenced each). A name typo does not throw — it
      silently renders the system font — so this was verified mechanically.
      ⚠️ **A font failure never blocks startup:** the splash gate releases on `fontsLoaded || fontError`
      and the error is logged loudly, because the failure mode is otherwise invisible.
      🛑 **NOT YET SEEN ON A DEVICE.** Bundling is proven; *rendering* is not. Confirm at step 2b.
- [ ] **2b. Install the two APPROVED native dependencies in BOTH apps** (owner approved 2026-08-30):
      `npx expo install expo-linear-gradient react-native-svg` — **`expo install`, not `npm install`**,
      so the versions match Expo 54. Then `npx expo prebuild` and a full `npm run android` on each.
      🛑 **Do this before step 3, and confirm both apps still boot on a device before building any
      chrome on top of them.** A missing native module surfaces as a bundling error, which reads
      like a code mistake and sends you looking in the wrong place.
- [x] **3. The shared chrome. ✅ DONE 2026-08-30 (user app).**
      `components/chrome/`: **`Icon`** (the artboards' exact SVG `d` paths via the approved
      `react-native-svg` — no `@expo/vector-icons` approximations), **`Badge`** (both artboard
      variants — ringed on the bell, plain on tabs), **`TopBar`** (the
      `linear-gradient(180deg,#1D9846,#F4F2ED)` header via `expo-linear-gradient`, real safe-area
      inset instead of the artboards' hardcoded 58px), **`BottomTabBar`**.
      `navigation/MainTabs.tsx` mounts the previously-unused `@react-navigation/bottom-tabs`;
      `MainNavigator` now hosts it so detail screens push OVER the bar, as the artboards show.
      🛑 **FOUR TABS SHIPPED, NOT FIVE — "HISOB" HAS NO SCREEN IN EITHER APP.** The artboards show
      Asosiy · Qidirish · Mening buyurtmalarim · **Hisob** · Profil, but no wallet screen exists
      (and no `UserBalans` artboard exists either). A fifth tab would ship a crash or a blank.
      **Omitted deliberately, not overlooked** → owner question on the card. The driver side has the
      same hole; its `DriverBalans`/`DriverDaromad` artboards are step 19's new work.
      🔴 **CAUGHT MY OWN BUG: I left `Profile`, `OffersList` and `OfferWizard` registered in BOTH
      the driver stack and its tabs** — the exact ambiguity the file's own new comment warns about.
      Two routes sharing a name across nested navigators makes `navigate()` resolve to the nearest,
      which is not always the intended one. Removed; **a `comm`-based duplicate check now confirms
      zero overlap in both apps.**
      ✅ **EVERY `navigate()` TARGET VERIFIED TO RESOLVE** — 16/16 driver, 11/11 user. The two
      apparent misses (`PassengerOfferDetails`, `Typo`) are **comment prose describing past bugs**,
      not call sites; checked rather than assumed.
      ✅ `navigation/types.ts` updated — it warns in its own header that nothing derives it from the
      navigator and T-028 already fixed this drift once. `MainTabParamList` added and intersected
      into `MainStackParamList`, so nested `navigate('SearchOffers')` still type-checks.
      **Baselines after: user `tsc` 6 / lint 225 / tokens 839 · driver `tsc` 28 / lint 289 /
      tokens 964 — all four unchanged.**
      🛑 **NOT SEEN ON A DEVICE.** Compiles and resolves; *renders* is unproven until step 2b's
      rebuild. The tab bar changes back-button behaviour on every wrapped screen — walk that first.
- [x] **4. Mirror the chrome into the driver app. ✅ DONE 2026-08-30, in the same pass as step 3.**
      All four `components/chrome/` files are **byte-identical** across the apps (`diff -q` clean) —
      the driver's differences live entirely in `MainTabs.tsx` (its own tab set and the `offer`
      icon) and in the `suffix="Driver"` prop the TopBar already accepts.
      Driver tabs per `DriverMenu.dc.html`: Asosiy · E'lon · Buyurtmalarim · Profil (**Hisob omitted
      — see step 3**), mapped to `MenuScreen` · `OfferWizardScreen` · `OffersListScreen` ·
      `ProfileScreen`. Export shapes were checked before wiring: all four are named exports, and a
      default/named mismatch fails at runtime rather than at compile time.
> 🔴 **2026-08-30 — THE OWNER'S FIRST DEVICE SCREENSHOT EXPOSED THAT STEP 3 WAS NOT ACTUALLY DONE.**
> The chrome compiled, every route resolved, all baselines held — **and `TopBar` was rendering
> nowhere.** `MenuScreen` has its own hand-rolled header, so the screenshot showed the OLD header
> (flat white, no hamburger, no bell, green avatar) sitting above the NEW tab bar.
> **Building a component and mounting it are two different steps, and only the second one is
> visible.** `tsc`, lint and the token counter cannot tell you a component is unused — *"it
> compiles" is not "it renders"*, which is this card's own stated lesson arriving in practice.
> ✅ **FIXED in both apps:** the old header block deleted (user −2 237 chars, driver −1 724),
> `TopBar` mounted **outside** the `ScrollView` — in the artboards it is fixed chrome, not content
> that scrolls away — and 11 / 7 now-dead style blocks plus an unused `Ionicons` import removed.
> ✅ **A REAL BUG IN MY OWN COMPONENT, ALSO FROM THE SCREENSHOT:** "Mening buyurtmalarim" wrapped
> and **collided with the neighbouring tab**. Cause: the tab column lacked `minWidth: 0`, so a long
> label overflowed its 1/5 share instead of wrapping inside it. Fixed with `minWidth: 0`,
> `textAlign: 'center'` and `adjustsFontSizeToFit`. *The artboards do wrap this label onto two
> lines — the wrap was right, the overflow was mine.*
> 🟢 **AND THE SCREENSHOT PROVED THREE THINGS THAT WERE PREVIOUSLY ONLY ASSERTED:** the bundled
> fonts render, `react-native-svg` draws the artboards' exact icon paths, and the tab bar works
> with the correct active/inactive colours. **Those were unproven until a device ran them.**
> 🟡 **THE RATCHET MOVED FOR THE FIRST TIME:** user **839 → 829**, driver **964 → 958**, both
> ceilings lowered to lock it in.
> 🛑 **STILL UNSEEN:** the gradient header, the hamburger/bell, and the near-black avatar were all
> absent from the screenshot *because the component was not mounted* — they have still never been
> rendered. **Re-run the app and check those three specifically before trusting step 3.**

> 🟢 **2026-08-30 — SECOND DEVICE SCREENSHOT: THE CHROME IS CONFIRMED WORKING.**
> The gradient header, hamburger, bell and near-black avatar **all render**, and the tab label no
> longer collides. **`expo-linear-gradient` and `react-native-svg` are both proven on a real
> device**, which is what step 2b existed to establish.
> 🟡 **Two defects the screenshot showed, both mine, both fixed:**
> ① **"TAXI" appeared TWICE** — once as the top-bar title, once as the card heading. I had passed
> `menu.title` into `TopBar`, but that key IS the card heading. The artboards put the **screen
> name** there instead (`UserMainMenu`/`UserMenuNeW` → *"Asosiy menyu"*; the driver artboards →
> *"Shaharlar aro"*, a different string, so the two apps do NOT share this value).
> Added **`menu.screenTitle`** to all **six** locale files and verified each one resolves — a
> missing key renders the KEY, never English, so this had to be checked rather than assumed.
> ② **The status bar sat on `#F5F5F5`**, a pre-redesign colour that is nowhere on screen any more,
> so the gradient stopped dead under the clock. Now `transparent` + `translucent`, letting the
> green run to the top edge as the artboards show.
> ⚠️ **I wrote an unmeasured contrast figure into that fix's comment (4.6:1) and then measured it:
> the real number is 4.97:1** (white would be 3.73:1, so `dark-content` is still correct). Corrected
> in the code. *Asserting a number in a comment is the same failure as asserting one in a report.*
> 🟡 Ratchet moved again: user **829 → 828**, driver **958 → 957**, both locked.
> 🛑 **STILL NOT WALKED: the back-button behaviour.** The tab bar changed navigation structure for
> every wrapped screen and nobody has pushed a detail screen and come back yet. **That remains the
> riskiest untested part of step 3.**

- [x] **5. Primitives to the new language. ✅ DONE 2026-08-30 — PHASE 1 IS COMPLETE.**
      🟢 **THE MODAL TRIO NEEDED NO EDITS AT ALL — step 1b had already restyled it.** `AppModal`,
      `ModalList` and `ConfirmDialog` were built by T-036 to read **everything** from `theme.modal`
      and contain **zero** hardcoded colours, so rewriting that token block in step 1b restyled
      **23 call sites** (9 + 5 + 9) across both apps without touching a component.
      **Verified by executing the tokens, not by reading the files:** the Figma-era palette
      (`#FDF6E3` cream, `#E53935` red heading, `#4CAF50`, `#8FE3A6`, `#FFEBEE`) is **entirely
      absent** from the live values. *This card's widest-blast-radius step turned out to be already
      done — the reverse of the usual surprise, and only checking revealed it.*
      ✅ **`Button` rebuilt** on the measured specs: sizes **44 / 52 / 56** (real artboard control
      heights, not a padding scale), variants primary · dark · outline · destructive · text, with
      pressed/disabled/loading derived from `theme.states` because **the artboards define none**.
      ✅ **`Card` and `Chip` added** — neither existed. `Chip` reproduces the artboards' `sel()`
      function verbatim, **including its `dark` tone**: car-class and price-mode chips select to
      near-black while every other chip selects to green. That reads like a bug and is not — it is
      consistent across all four `UserBuyurtma` artboards and `DriverElon`, and distinguishes a
      *mode* choice from a *feature* choice. **Do not unify without asking the owner.**
      🔴 **I CALLED `Button` DEAD AND IT HAD FOUR LIVE CALL SITES.** My grep searched
      `components/Button` and `./Button` but the real importers use **`../Button`** — `EmptyState`
      and `NetworkStatus`, in **both** apps. The rename `size="large"` -> `"lg"` then broke
      `NetworkStatus`, which `tsc` caught immediately (7 vs the baseline 6).
      *A negative grep result is evidence about the pattern, not about the code — the baseline is
      what actually protected this.* Both call sites fixed.
      ✅ **Contrast re-measured on the finished variants, not assumed:** primary **5.29:1** ·
      dark **18.52:1** · outline **18.52:1** · destructive **6.02:1** — **all pass 4.5:1**, and the
      CTA now uses `action` per the owner's approval rather than the failing `brand` green.
      **Baselines: user `tsc` 6 / lint 225 / tokens 828 · driver `tsc` 28 / lint 289 / tokens 957.**
      🛑 **NOT SEEN ON A DEVICE.** `Card` and `Chip` have no call sites yet — they are for Phase 2.
      The modal restyle IS live in 23 places and **should be walked**: open any dialog.

### Phase 2 — user app pages, one screen per step

- [x] **8f. The time MODEL, not its looks. ✅ DONE 2026-09-01.**
      🔴 **THE OWNER QUESTIONED THE DESIGN ITSELF** — *"change this owner design date time
      selection logically correct because i dont see correct logic"* — **and was right. Four
      defects, three of them invisible while the rules lived inline in the form.**
      ① **"Hoziroq" BOTH WAS AND WAS NOT ALLOWED.** `MIN_ADVANCE_MS` refused any departure sooner
      than 31 minutes; `getStartAtDate()` returned `now` for an urgent order and `if (!isUrgent)`
      skipped the check. **Two contradictory rules with a toggle picking the winner.**
      → **Owner: Hoziroq genuinely means "I am ready now"** — an on-demand hail. The minimum is a
      rule about SCHEDULED orders (it stops one being posted too late for a driver to plan around),
      so the exemption is correct; it was only ever undocumented. **Resolved, not patched.**
      ② **"Arrival time" was really "arrive by".** The API has `arrive_from` AND `arrive_until`;
      the form only ever sent `arrive_until` and the sheet offers one time. The heading promised a
      window that never existed → relabelled ("Qachongacha yetib borish" / "Arrive by" /
      "Прибыть не позже"). The summary suffix was already correct.
      🔴 ③ **THE REAL BUG: arrival was compared against the START of the departure window.**
      `arriveUntilDate < startAtDate` — so **"leave 08:00–11:00, arrive by 09:00" was ACCEPTED**,
      an order already impossible the moment the driver uses the window the passenger granted.
      → now compared against **`latestDeparture`**, the only departure the passenger has committed
      to being no later than.
      ④ **Departure and arrival had independent dates** — "leave 5 Sept, arrive 3 Sept" was
      expressible, with only ③'s broken check in the way. → the arrival DAY now defaults to the
      departure day; an overnight trip is set explicitly (and is covered by a case).
      ✅ **`utils/rideTime.ts`** — the rules extracted as pure, dependency-free functions, because
      inline among form state they could not be reasoned about or tested. `combineDateTime` moved
      there too and is re-exported from `TimeWindowCard`, so the two identical copies became one.
      ✅ **`scripts/check-ride-time.mjs` — 8 cases, and it IMPORTS the real module.** A checker
      holding its own copy of the logic passes while the app is broken; that is precisely what made
      the 2026-08-30 i18n checker useless until it was rewritten to execute the real translations.
      ✅ **PROVEN ABLE TO FAIL AGAINST THE REAL SOURCE:** `latestDeparture` reverted to `departFrom`
      → the "THE BUG" case went red, exit 1; restored → green, `git diff` clean.
      ⚠️ **No test runner in the user app** (CLAUDE.md: only the API has one), so this is a script
      rather than a `*.test.ts`. **It should become one the moment a runner is approved** — worth
      asking, since this is the first pure logic this card has produced.
      **Baselines unchanged: user `tsc` 6 / lint 216 / tokens 1 · driver `tsc` 28 / lint 280 /
      tokens 3**, plus the new ride-time check at 8/8.
      🛑 **NOT SEEN ON A DEVICE.** ⚠️ **`arrive_from` is still never sent** — the API supports an
      arrival WINDOW that neither the design nor the form offers. Left alone (presentation card);
      worth its own decision if arrival windows are ever wanted.

- [x] **8e. The date/time picker. ✅ DONE 2026-09-01 — three device findings, one root cause.**
      🔴 **THE OWNER REPORTED THREE THINGS AND ALL THREE WERE THE SAME BUG:**
      ① *"date time selection view do not look like design"* — the artboard has date **CARDS**
      (weekday / big mono day / month), not a spinning wheel;
      ② *"calender selected time always in center"* — `AppModal` is `justifyContent: 'center'`;
      ③ *"calender appears from bottom like county/city/..."* — i.e. like `GeoSheet`.
      **The wheels were built on the DIALOG shell where the design specifies the SHEET one.** One
      wrong shell produced all three symptoms; fixing the shell fixed all three.
      ✅ **`components/BottomSheet.tsx` — the shell extracted from `GeoSheet`**, which had it inline.
      🔴 **THE REAL REASON TO SHARE IT IS A DEVICE BUG ALREADY FIXED ONCE:** the system nav bar
      sits OVER the sheet, and `Modal` renders outside the SafeAreaProvider so the inset must be
      applied by hand. Found on an S24 Ultra (~48px bar). **A second hand-rolled sheet would have
      re-introduced it** — precisely what happened to the geo cascade seven times before `GeoSheet`.
      ✅ **`components/passengerOffer/TimeSheet.tsx`** — 4 day cards + quarter-hour chips + confirm.
      ✅ **`GeoSheet` REFACTORED ONTO THE SAME SHELL**, so the two pickers cannot drift.
      ⚠️ **One deliberate visual change came with it:** `GeoSheet` centred its header text; the
      artboard's header block is a plain LEFT-ALIGNED column. Checked against `UserBuyurtma.dc.html`
      rather than preserved by habit, so the geo sheet's title moved left.
      ✅ **THE T-069 FLOORS AND THE COMMIT CONTRACT BOTH SURVIVE**, which is the part that mattered:
      `timeFloor` (the floor re-based onto the day being edited — the fix for the owner's
      2026-08-13 "arrival before departure" report) is passed through and honoured when building the
      slots, and **nothing reaches the form until Tasdiqlash** (the wheels worked that way because
      the OS picker they replaced fired per-spin on iOS).
      ✅ Changing the DAY **rebases** the chosen hours rather than clearing them, and an end slot
      that would precede the new start is dropped — the window cannot become incoherent.
      ⚠️ **THE DRAG STRIP IS DELIBERATELY NOT BUILT.** The artboard's time row is a draggable strip
      of 15-minute blocks with a ruler and a "keyingi kun" marker. **Owner chose tap-to-pick chips**
      — a custom pan-gesture control is the most intricate thing in the design and the easiest to
      get subtly wrong on a touchscreen. The data model is identical, so the strip can replace the
      chips later without touching the form.
      🔴 **I USED `monthsShort` BEFORE CHECKING IT EXISTED** — it did not. Added `weekdaysShort`
      and `monthsShort` to all three locales (the FULL weekday names overflow a quarter-width card).
      ✅ **The i18n checker now also asserts LIST LENGTH** (7 weekdays / 12 months) — a short list
      renders blank cards silently, which no other check would catch. **Proven able to fail**
      (truncated uz months → red, exit 1; restored).
      📋 **`TimeWheelModal` now has ZERO call sites.** `DateWheelModal` is still used by
      `EditProfile` and `UserDetails` (birth date) — **checked, not assumed.** Neither deleted
      (rule 4) → add to **T-105**.
      **Baselines unchanged: user `tsc` 6 / lint 216 / tokens 1 · driver `tsc` 28 / lint 280 / tokens 3.**
      🛑 **NOT SEEN ON A DEVICE.**

- [x] **6b. The home screen's empty space. ✅ DONE 2026-09-01 — owner ran step 6 on a device.**
      🔴 **THE OWNER'S REPORT: "a lot of free space".** True, and step 6 caused it deliberately:
      the artboard fills that area with an **active-trip banner**, **recent routes** and a
      **balance/promo/trips** row, and step 6 shipped none of the three because the artboard draws
      all of them with **invented data**.
      🟢 **RE-CHECKED, AND TWO OF THE THREE CAN BE REAL:** `getMyPassengerOffers` already exists,
      and `status` distinguishes `published` (waiting for drivers) from `driver_found` (a driver is
      CONFIRMED, ride not yet happened). **Neither block invents anything, and both render nothing
      at all when the user has no orders** — an empty home screen is honest, a fake trip is not.
      ✅ **Owner decision 2026-09-01: the stats row stays OUT until the wallet exists** (step 19).
      ✅ **`hooks/useHomeOrders.ts` — ONE request feeds both blocks.** Recent routes are
      de-duplicated (the same commute ordered ten times is one shortcut) and come only from
      FINISHED orders; the newest active order wins the banner, chosen by **sorting** because the
      endpoint promises no order.
      ⚠️ **Failure is silent by design** — the blocks are decoration over a working screen, so a
      failed request hides them and leaves the CTA untouched. Logged, never surfaced.
      🔴 **POSITION MEASURED, NOT ASSUMED.** I was about to put the banner ABOVE the carousels;
      in `UserMenuNeW.dc.html` it sits **below them and below the CTA** (line 293 vs 232/265).
      🔴 **AND THE NAVIGATION TARGET WAS WRONG ON MY FIRST PASS.** I sent the banner to
      `OfferDetails` — which shows a **driver's** offer with a join button. A passenger's own order
      belongs to **`OfferDrivers`** (who has responded), which is where `MyPassengerOffersScreen`
      sends its own rows. *`tsc` cannot catch a route that exists but means something else.*
      🔴 **`text.onDark` IS THE SAME VALUE AS `ground`** (`#F4F2ED`), so the banner's supporting
      line would have rendered **identically to its headline** — the "two tiers, one colour" trap
      this card already hit on the status labels. The artboard uses `#B7B2A6`; added as
      **`text.onDarkMuted`**, measured **8.76:1** against the near-black card (headline 16.56:1).
      ✅ **Contrast measured on the dark banner, not assumed:** eyebrow 16.18:1, route 16.56:1,
      meta 8.76:1.
      🟢 **STEP 6 HAD ALREADY ADDED THE KEYS** — `activeTrip`, `recentRoutes`, `balance`,
      `promoCodes`, `trips`, translated in all three locales and never used. **`tsc` caught me
      adding duplicates** (TS1117) rather than reusing them. Only two genuinely new keys were
      needed: `activeWaiting`, `activeDriverFound`.
      ✅ **4 i18n keys × 3 locales resolve, checker proven able to fail** (renamed `activeWaiting`
      in ru → ru red, uz/en green, exit 1; restored).
      **Baselines unchanged: user `tsc` 6 / lint 216 / tokens 1 · driver `tsc` 28 / lint 280 /
      tokens 3.** Both palettes re-diffed — the only delta is still the `brandSuffix` comment.
      ⚠️ **The recent-route chips open the ORDER FORM but do NOT pre-fill the route.** That needs
      the geo ids; `from_text` is a display string. **Half-wiring it would look like a feature and
      behave like a bug** — the shortcut is the screen, not the addresses. → own card if wanted.
      🛑 **NOT SEEN ON A DEVICE.**

> Order follows the artboards' own flow. **After each screen: its raw-hex count is 0, the ceiling in
> `check-design-tokens.mjs` is lowered, `tsc` is at baseline 6, lint 225/0.** Each step is a stop
> point — the owner walks the screen against its artboard before the next begins.

- [x] **6. Home screen → `UserMenuNeW`. ✅ DONE 2026-08-30. THE FIRST SCREEN AT ZERO.**
      🟢 **`MenuScreen` went 24 -> 0 raw colour literals** — every colour on it now comes from
      `themes/`. App total **828 -> 814**, ceiling lowered. *Proof the foundation does what it was
      built for: the screen shrank while gaining features.*
      ✅ **Owner decisions 2026-08-30, both asked before building:**
      **① The 5-service carousel is NOT shipped.** Four of its five services (Jo'natma, Ustalar,
      Maxsus texnika, Yukmashina) are the out-of-scope roles and none has a screen — owner chose
      Taksi alone over advertising four things the app cannot do.
      **② The scope carousel ships with FOUR, not five** — Tuman ichi · Viloyatlar aro · Viloyat
      ichi · Yaqin hududlar. **Xalqaro is omitted:** it appears in no scope rule the owner defined
      and has no adm mapping.
      🛑 **Also NOT shipped, and each for the same reason — it would be FABRICATED STATE:** the
      active-trip banner (no live-trip endpoint), recent routes (the artboard's are hardcoded), and
      the balance/promo/trips stats (the wallet is step 19). **The artboard shows all three with
      invented data; shipping them would put fiction on the user's home screen.**
      ⚠️ **Choosing a scope currently only STYLES the selection.** The value travels to the order
      screen so the wiring is ready, but until **T-102** the four scopes behave identically.
      **Do not present step 6 as delivering the scopes.**
      🔴 **I WROTE AN i18n CHECKER THAT REPORTED EVERY KEY MISSING — INCLUDING `menu.guest`, WHICH
      PREDATES THIS CARD.** Three "fixes" later it still returned identical output, which was the
      tell: *a check that cannot change its answer is not measuring anything.* Root cause, found by
      printing the compiled pattern: **shell quoting ate the backslashes**, so `\s` reached
      `RegExp` as a literal `s` and the source was `^s*ctaTaxis*:`. Rewritten as a real file rather
      than a heredoc → all **12 keys resolve in uz/ru/en**, and **proven able to fail** by renaming
      `ctaTaxi` (uz went red, ru/en stayed green, exit 1) then restoring.
      *The near-miss: I could have "fixed" the translations to satisfy a broken checker.*
      ✅ **Lint DROPPED 225 -> 222, and the drop was verified rather than accepted** — `git stash` on
      this one file shows `MenuScreen` went **5 -> 2** warnings, exactly the delta, from removing
      three `as any` casts. **`tsc` 6, at baseline.**
      🔄 **REVISED SAME DAY on the owner's correction — three changes:**
      **① Taksi is the FIRST service, not the only one.** *"later there will be all not only
      taxi."* `SERVICES` is now data with an `enabled` flag carrying all five and their CTA
      wording; the selector hides itself while only one is enabled (a picker with one option is
      noise) and appears automatically at two. **Adding a service is a row plus a route, not a
      rewrite** — which is what I would have forced by hardcoding Taxi.
      **② The four scopes are NOT a carousel** — they are the screen's primary choice, shipped as
      a **2x2 grid of cards** (owner's layout choice). *My reading of the artboard was wrong.*
      **③ The four action cards removed** — the tab bar and drawer cover them.
      🔴 **REMOVING THEM WOULD HAVE STRANDED A WORKING SCREEN, AND I CHECKED BEFORE DELETING.**
      Three of the four are reachable elsewhere (`SearchOffers` and `MyBookings` are **tabs**,
      `CreatePassengerOffer` is this screen's own CTA) — but **`MyPassengerOffers` is stack-only
      with no other entry point anywhere in the app.** Verified: nothing else navigates to it,
      `MyBookings` has no ride-requests section, and `menu-items/index.ts` is **stale English
      placeholder data pointing at an `Activity` route that does not exist**. Kept as one text
      link until step 9 gives it a proper home inside `MyBookings`.
      ⚠️ **`SCOPES.matchLevel` is recorded but sent NOWHERE** — it is T-102's data, kept beside the
      labels it belongs to. The code says so explicitly so it cannot be mistaken for wiring.
      ✅ Re-verified after the rewrite: `tsc` **6** · lint **222** · MenuScreen still **0** literals
      · **14/14 i18n keys resolve in uz/ru/en** · all 4 navigation targets registered.
      🔴 **SECOND REVISION, SAME DAY — I MISREAD THE OWNER AND THEN OVERRODE THEM.**
      The owner wrote *"other 4 scopes not carousel"*. That was about **the scopes**; I collapsed it
      into "nothing is a carousel" and dropped the **service** row too. Then, because only Taksi is
      enabled, I **hid the service selector entirely** on the reasoning that a one-option picker is
      noise — **immediately after the owner said the other services are coming.** Hiding it made the
      whole service concept look deleted, which is what the screenshot showed.
      *Two failures in one change: over-generalising an instruction, then applying my own taste on
      top of a decision the owner had just made.*
      ✅ **Corrected on the owner's second reading:** a reusable **`Carousel`** component
      (`components/Carousel.tsx`, measured from the artboard — 34px round arrows, dots, the
      `#D8F4E1` tint + 2px `brand` ring on the selected card) now drives **BOTH** rows.
      **Services show all five**, the four unbuilt ones **dimmed and inert** (owner's choice:
      "visible but not tappable" — the structure stays visible as the product grows).
      **Scopes are a carousel too** (owner's choice on the second question).
      ⚠️ Two artboard details deliberately dropped, both recorded in the component: RN has no
      `mix-blend-mode: multiply` (the tint is applied directly — the blend only mattered over
      photographic tiles, and there are none), and the arrows' `ubxBlink` pulse is omitted because a
      scrollable row already signals that it scrolls.
      ✅ The file's own header comment now carries **"Do not tidy it away again"** next to the
      hidden-selector mistake, so the next session cannot repeat it.
      ✅ Re-verified: `tsc` **6** · lint **222** (a stray unused `View` from the removed grid was
      caught at 223 and fixed) · MenuScreen and Carousel both **0** raw colours ·
      **14/14 i18n keys resolve in uz/ru/en**.
      🎛️ **THIRD REVISION — owner's carousel adjustments (2026-08-30):** cards **84 -> 60** high
      (still above the 44px touch minimum, two-line labels still fit), arrows **34 -> 40**
      (closer to the touch target, with `hitSlop` covering the rest), and **the selected card is
      now always CENTRED**.
      🔴 **Centring is three interlocking parts, and omitting any one leaves a subtle bug:**
      ① **`sidePad`** = half the leftover viewport, so the **first and last** cards can reach the
      middle — without it the ends jam against the edge and sit off-centre exactly when the user
      is at the extremes; ② the scroll effect depends on **`viewport` as well as the index**,
      because the first layout arrives *after* the first render — otherwise the initial selection
      stays pinned left until something is tapped; ③ **a swipe SELECTS what it lands on**, so
      "centred" and "selected" can never disagree.
      ✅ **The centring arithmetic was VERIFIED, not eyeballed** — a script walks every index at
      four phone widths (360/392/412/480) and asserts each card lands dead centre and every scroll
      target is reachable: **all pass, offset < 0.5px**. It also confirmed the proportions are
      sensible: 39-65px of the neighbouring cards stay visible, which is what tells the user the
      row scrolls.
      ✅ **Arrows now step to the nearest ENABLED neighbour and disable at the ends** — an arrow
      that lands on a dimmed, untappable service would be a dead control.
      ✅ `tsc` **6** · lint **222** · **`Carousel.tsx` lints completely clean and has 0 raw colours**.
      🛑 **NOT SEEN ON A DEVICE.**
- [x] **7. `SearchOffersScreen` -> `UserQidiruv`. ✅ DONE 2026-08-30. THE BIGGEST DROP SO FAR.**
      🟢 **App total 814 -> 687: 127 colours gone in one screen**, and the file now reads **0**.
      🔴 **DELIBERATELY A DIFFERENT APPROACH FROM STEP 6, AND THIS IS THE PATTERN FOR THE REST OF
      PHASE 2.** `MenuScreen` was 180 lines and was rewritten; **this file is 1 937 lines** carrying
      real logic — geo cascades, offer loading, the join flow, saved searches. **Rewriting it would
      have risked working features for a repaint.** So: convert the style VALUES, touch no logic.
      **Proved rather than claimed** — `git diff` is **125 insertions / 124 deletions**, and every
      changed line is either a colour or the one added import. The extra line IS the import.
      ✅ Converted with an **explicit mapping table**, not a blind hue swap: 100 inside the
      `StyleSheet` block, 27 inline in JSX. **Six colours it could not map were REPORTED, not
      guessed** (`#D1FAE5` `#22C55E` `#FDE68A` `#D97706` `#92400E` `#F59E0B` — the seat badge and
      rating tags); each was then checked against what it actually styles before being added.
      🟢 **THE CONVERSION FIXED TWO REAL ACCESSIBILITY FAILURES, measured before and after:** the
      rating label was **2.85:1** and the seat-badge text **3.32:1** — both below the 4.5 floor.
      On the tokens they are **5.64:1** and **6.96:1**. *The design system was more accessible than
      the code it replaced, which is an argument for the whole card.*
      🔴 **`tsc` WENT TO 106 AND CAUGHT EXACTLY THE RIGHT THING: the file never imported `theme`,**
      so all 100 fresh token references were undefined. One import line took it back to **6**.
      *A find-and-replace that produces valid-looking code is precisely where a baseline earns its
      keep — nothing else would have noticed.*
      ✅ All three conditional colour expressions kept their structure (`cond ? tokenA : tokenB`),
      checked individually — a careless substitution there changes behaviour, not just appearance.
      **`tsc` 6 · lint 222 · 35/35 i18n keys resolve in uz/ru/en · file at 0 literals.**
      🛑 **NOT SEEN ON A DEVICE.** This screen has the app's densest logic; walk a real search.
- [x] **7b. The shared geo picker (`GeoSheet`). ✅ DONE 2026-08-30 — the owner spotted this on a
      device before it existed.**
      🔴 **THE CASCADE WAS IMPLEMENTED SEVEN TIMES ACROSS THE TWO APPS** — `SearchOffersScreen`,
      `LocationCard`, `OfferWizardScreen`, `SearchPassengerOffersScreen`, `DriverPersonalInfoScreen`,
      `DriverVehicleScreen`, plus **two differently-named modals** (`GeoSelectModal` here,
      `GeoPickerModal` in the driver app). Each carried its own "clear the child when the parent
      changes" rule. *That is why the pickers had visibly drifted apart — the owner was right.*
      ✅ **`components/geo/GeoSheet.tsx`** — one sheet that walks its own levels with a breadcrumb,
      matching the artboards. `startLevel` lets a scope pre-fix ancestors (*Viloyat ichi* opens at
      adm2), and it returns the **full path**, not the leaf, because callers need the ancestors to
      display and — after T-102 — to send an id per level.
      ✅ **THE CASCADE RULES WERE TESTED IN ISOLATION AND THE TEST WAS PROVEN ABLE TO FAIL.** 12
      assertions over advancing, terminal levels, `startLevel`, and descendant-clearing; deleting
      the one clearing line turns **2 of them red**. *That clearing rule is precisely what seven
      hand-written copies each had to remember — choosing a new region must drop the district under
      it, or the form silently keeps one that no longer belongs.*
      🟢 **`SearchOffersScreen`: 1 937 -> 1 634 lines (-303).** Deleted **16 state hooks**, six
      loader functions, three helpers that existed only to feed the old modal, and the
      ~40-line `swapLocations` — which had been clearing and **re-fetching** both directions
      because the old picker could only show lists it had already loaded. Swapping is now two
      assignments. `loadLastSearch` lost its **300 ms sleep** for the same reason.
      ✅ **THE RISK WAS THE 1 900-LINE FILE'S WORKING SEARCH, AND IT WAS CONTAINED DELIBERATELY:**
      the six `selected*` names are kept as **derived values** off the two paths, so the search
      request, route card and swap button read exactly what they read before. **Verified:** the
      request still sends the same four `*_province_id`/`*_city_id` fields, and the saved-search
      **write shape is unchanged**, so searches stored before this change still restore.
      ⚠️ **UI CHANGE THE OWNER SHOULD WALK:** three buttons per direction (country / province /
      city) became **one**, showing the chosen path. That is the artboards' pattern, but it is a
      real interaction change, not a repaint.
      **`tsc` 6 (0 in this file) · lint 225 -> 218 · tokens 687 · 33/33 i18n keys resolve.**
      🛑 **Six other call sites still use the old pickers** — wiring them was deliberately NOT done
      until the owner walks this one.
- [x] **7c. Safe-area / navigation-bar fix. ✅ DONE 2026-08-30 — owner found it on an S24 Ultra.**
      🔴 **THE SYSTEM NAVIGATION BAR SAT OVER THE SHEET**, hiding the last row ("Uzbekiston") behind
      the home/back buttons. `GeoSheet` had a hardcoded `paddingBottom: 8` and **no safe-area
      handling at all** — a fixed value cannot work, because the bar is 0px on some devices, ~24px
      with gestures and ~48px with three-button navigation.
      ⚠️ **`Modal` renders OUTSIDE the app's SafeAreaProvider layout**, so nothing upstream applies
      the inset — every modal has to do it itself. That is why this class of bug is easy to ship.
      ✅ Fixed in `GeoSheet` on **both** the sheet (`Math.max(insets.bottom, 8)`) and the list's
      `contentContainerStyle` — padding on the sheet alone stops the last row *behind* the bar
      instead of letting it scroll clear.
      🔴 **THE SAME BUG WAS AUDITED FOR, NOT WAITED FOR — AND FOUND IN `AppModal`, THE SHELL BEHIND
      9 DIALOGS PER APP.** Its `maxHeight` was `screenHeight * 0.85`, and `screenHeight` **includes
      the navigation bar**, so a tall dialog's bottom edge could land underneath it. Now
      `(height - insets.top - insets.bottom) * ratio`, so the ratio means "85% of what the user can
      actually see". Fixed in both apps; `diff -q` confirms the copies stay identical.
      ✅ Swept all 13 `Modal`-rendering files across both apps. The rest are centred and short
      enough not to reach the bar; three tall driver-app modals (`DriverLicense`, `DriverVehicle`,
      `PhoneRegistration`, all `maxHeight: '70%'`) are **recorded as at-risk but untouched** — they
      are step 21's screens and will be rebuilt there. *Listed rather than silently left.*
      ✅ `GeoSheet` mirrored to the driver app (its geo API has the same six endpoints).
      **user `tsc` 6 / lint 218 / tokens 687 · driver `tsc` 28 / lint 289 / tokens 957.**
- [x] **7d. Wire the remaining geo call sites. ✅ DONE 2026-08-30 — but the scope was WRONG and
      investigating first cut it from six sites to one.**
      🔴 **"SEVEN IMPLEMENTATIONS" WAS TOO BROAD A CLAIM — I MADE IT AND IT WAS PARTLY WRONG.**
      The six remaining sites turned out to be **three different jobs**:
      **① route pickers** (country->province->district) — `GeoSheet` fits;
      **② ADDRESS FORMS** (`DriverPersonalInfo`, `DriverVehicle`, `DriverPassport`) — these collect a
      driver's *home address* down to mahalla using **SIX levels**, including
      `GeoAdministrativeArea` and `GeoNeighborhood` that `GeoSheet` does not know. Different job;
      **③ a MULTI-SELECT stop picker** in `OfferWizardScreen` — the driver picks *several* districts
      as intermediate stops, which `GeoSheet` cannot do at all.
      ⚠️ **`GeoPickerModal`'s own header says it already consolidated SEVEN copies in T-036.**
      Replacing it wholesale would have undone someone else's consolidation to impose mine, and lost
      the multi-select. **Left in place deliberately.**
      ✅ **`SearchPassengerOffersScreen` CONVERTED — the driver-side TWIN of the user's search.**
      Same 12 state hooks, same seven helpers, same duplicated clearing rule, **same 300 ms sleep**.
      *Fixing one twin and walking past the other is this project's single most repeated defect
      (`ubexgo-fix-the-class-not-the-instance`), so this one mattered more than the count suggests.*
      🟢 **1 583 -> 1 262 lines (-321)**, lint **289 -> 285**, and **6 raw colours** fell out with the
      deleted markup (957 -> 951, ceiling lowered).
      ⚠️ **The twins are NOT identical underneath and that was checked, not assumed:** this search
      sends **`from_text`/`to_text` STRINGS** while the passenger app sends `*_province_id`. The
      derived `selected*` names keep the difference invisible to the rest of each file; **both
      request shapes and both saved-search formats verified unchanged.**
      🛑 **`LocationCard` DELIBERATELY NOT CONVERTED.** It looked like the obvious next candidate and
      is not: it picks **settlement AND neighborhood as SIBLINGS** off the same district (a branch,
      where `GeoSheet` walks a chain), adds a free-text landmark, **omits country on purpose
      (OR-004)**, and carries request-cancellation and load-failure state `GeoSheet` lacks.
      *Forcing it in would have lost behaviour to gain consistency.*
      **user `tsc` 6 / lint 218 / tokens 687 · driver `tsc` 28 / lint 285 / tokens 951.**
      🛑 **NOT SEEN ON A DEVICE** — the driver app's search needs a walk.
- [x] **9-10. `OfferDetails` + `MyBookings` + `MyPassengerOffers`. ✅ DONE 2026-08-30.**
      🟢 **687 -> 414 (-273 across three screens); all three read 0.** Steps 9 and 10 done together
      because the tokenizer from step 7 made them mechanical.
      ✅ Same discipline: explicit mapping table, unmapped colours **reported not guessed**, and
      `git diff` on `OfferDetails` shows **108 insertions / 107 deletions** — the extra line is the
      `theme` import. **No logic touched.**
      🟢 **A THIRD ACCESSIBILITY FAILURE FOUND BY MEASURING — AND THE OBVIOUS FIX WAS WRONG.**
      `MyPassengerOffers`' **`driver_found`** status rendered `#0EA5E9` on `#E0F2FE` = **2.42:1**,
      the worst contrast in the app. The nearest token pair (`male`/`blueTint`) would have fixed the
      contrast **and made `driver_found` render IDENTICALLY to `completed`** — two distinct states
      looking the same is a worse bug than the one being fixed. Checked the whole status set for
      collisions first; `brand`/`successTint` is distinct from both and means what the state means.
      **2.42:1 -> 6.96:1.**
      ⚠️ **Found while checking, NOT introduced by this card: `expired` and `archived` were already
      pixel-identical.** Left alone and recorded rather than silently "fixed" — they may be
      deliberate.
      ✅ Four more tint+ink pairs mapped, each contrast-checked: green **5.21 -> 6.96**, blue
      **4.75 -> 5.42**. New palette token **`blueTint` (`#DCEEFB`, 14 artboard uses)** added to both
      apps for the informational-surface role.
      🔴 **`tsc` CAUGHT THE MISSING `theme` IMPORT AGAIN** on `OfferDetails` — the identical failure
      as step 7. Now checked as part of the routine rather than rediscovered.
      **user `tsc` 6 / lint 218 / tokens 414 · 54 + 40 i18n keys resolve in uz/ru/en.**
      🛑 **NOT SEEN ON A DEVICE.**
- [x] **8. `CreatePassengerOfferScreen` → `UserBuyurtma.dc.html`. ✅ LAYOUT + CONTROLS DONE 2026-09-01.**
      ✅ **OWNER DECISION 2026-09-01: ONE SCREEN WITH A MODE, not four screens** — and the
      measurement backs it: the four artboards differ by **22-78 lines out of ~138 KB** (`diff` on
      tag-split files). The difference is the top-bar subtitle and how deep the location sheet
      opens. `ORDER_SCOPES` moved out of `MenuScreen` into `types/orderScope.ts` now that two
      screens read it.
      🔴 **STEP 6's COMMENT SAID THE SCOPE "TRAVELS TO THE ORDER SCREEN". IT DID NOT** — the CTA
      navigated with `{}` and the nav type had no `scope` at all. Now wired, **presentation only**:
      it names the screen. It changes no matching and no validation; the four scopes still behave
      identically until **T-102**.
      🔴 **THE SCREEN HAD ITS OWN HAND-ROLLED HEADER — the exact pattern that made `TopBar` render
      nowhere on 2026-08-30.** Replaced with the shared `TopBar`; 4 dead style blocks deleted.
      🔴 **THE GRADIENT HEADER IS NOT UNIVERSAL, and only measuring showed it.** `UserMenuNeW` and
      `UserMyOrder` carry `linear-gradient(180deg,#1D9846,#F4F2ED)`; **`UserBuyurtma` and
      `UserQidiruv` are a FLAT `#F4F2ED`.** `TopBar` gained `background="gradient" | "flat"` —
      a flat bar renders as a plain `View`, not a one-colour gradient. **This affects step 17 too.**
      🔴 **A DOUBLE SAFE-AREA INSET CAUGHT BEFORE THE DEVICE.** This screen wraps in
      *safe-area-context*'s `SafeAreaView` (pads on **both** platforms) while `MenuScreen` uses
      **React Native's** (a **no-op on Android** — which is why the owner's screenshot looked
      right). With `TopBar` applying `insets.top` itself the header would have sat a status-bar too
      low. Fixed with `edges={['left','right','bottom']}`.
      ✅ **`TopBar` gained `onBackPress`** — a back arrow replacing the hamburger. **Not in any
      artboard, deliberately:** every board draws the drawer because a board is never *pushed*.
      This screen pushes OVER the tab bar, so without it the screen is a dead end the artboard
      cannot show. Icon is the artboards' own `chevronRight` path mirrored about x=12, not a
      borrowed glyph.
      ✅ **`Chip` HAS ITS FIRST CALL SITES** (it shipped in step 5 with none): payment and car
      class. Car class uses `tone="dark"` per the artboards' `sel()`.
      🟢 **CHECKED RATHER THAN ASSUMED, AND IT PREVENTED A SILENT REVERT OF T-031:** the artboard's
      two payment chips *look* like a radio group, but their handler is
      `pick: () => set({ [k]: !on })` — a **toggle**, matching the owner's 2026-08-13 decision that
      the payment options are independent. Reading the rendering would have said radio.
      Likewise `dost` ("Do'stimning raqami") is a separate control in the artboard, not a third
      payment chip — which is how the code already had it.
      ✅ **Section labels → `typography.eyebrow`** (mono, uppercase, 10px/600, wide tracking) on the
      two converted sections, replacing the 18px/700 `cardTitle`.
      ✅ **NO LOGIC TOUCHED** — verified mechanically: every deletion in the screen's diff is
      presentational. T-031's toggles, T-040's edit-prepare, T-069's time floors and OR-012's
      keyboard handling are all untouched.
      ✅ **14 i18n keys × 3 locales all resolve, and the checker was PROVEN ABLE TO FAIL** (renamed
      `classTourist` in uz → uz red, ru/en green, exit 1; restored, `git diff` clean).
      **Baselines unchanged: user `tsc` 6 / lint 216 / tokens 1 · driver `tsc` 28 / lint 280 /
      tokens 3.** All four `components/chrome/` files re-verified byte-identical across both apps.
      🛑 **NOT SEEN ON A DEVICE.** The riskiest parts are the ones a device decides: the flat
      header, the back arrow on a pushed screen, and the safe-area fix above.
      🛑 **STILL NOT REBUILT:** the seat picker is still `SeatStepper`, not the artboard's 3-state
      seat-square grid (owner deferred it — it is an interaction change, not a repaint), and the
      location cards, time sheet and special-order panel keep their current layouts.
- [x] **8b. The from/to card rebuilt. ✅ DONE 2026-09-01, after the owner ran step 8 on a device.**
      🔴 **THE DEVICE VERDICT ON STEP 8 WAS "DOES NOT LOOK LIKE THE DESIGN", AND IT WAS RIGHT.**
      Step 8 changed the top bar, two button rows and the section labels — **~15% of the screen**.
      The ~1 600 lines of body components (`LocationCard` 472 · `TimeWindowCard` 379 ·
      `SpecialOrderPanel` 284 · `SeatStepper` 204) were untouched. *Marking step 8 "done" overstated
      it: the chrome was done, the screen was not. Say which PART of a screen is finished.*
      ✅ **`LocationCard` REBUILT TO THE ARTBOARD'S ROW.** Was **4 stacked dropdowns + a landmark
      field per direction** (8 boxes down the page); now **one tappable row** — marker, mono eyebrow,
      bold place line, quieter path line, chevron — with the picker opening as a sheet. Origin is a
      hollow 11px ring, destination a 20px ring with a filled core, per the artboard.
      ✅ **THE DATA CONTRACT IS UNTOUCHED**, which is what made this safe: `LocationValue`,
      `emptyLocation` and `buildLocationText` are unchanged, and the screen only ever reads those.
      All four geo-loading effects, the cascade-clearing in `handleSelect` and `GeoSelectModal` are
      reused as-is. **The artboard's 4-step wizard maps 1:1 onto the existing levels** (1/4 viloyat
      → `province`, 2/4 tuman → `cityDistrict`, 3/4 mavze → `settlement`, 4/4 orientir → `landmark`).
      🔴 **THE ARTBOARD HAS NO MAHALLA STEP AND THE CODE DOES.** Dropping it to match the design
      would delete a field users can fill today — and it is the fragile one: **the mahalla has no id
      column (T-029)**, so `hydrateLocation` cannot restore it and `handleSubmit` carries an explicit
      guard to stop an edit erasing it. Kept as a sibling chip beside settlement, because settlement
      and mahalla **branch off the district** — a linear wizard cannot express that without losing
      one. **→ OWNER QUESTION: is the mahalla meant to survive the redesign?**
      🔴 **MY REWRITE SILENTLY DROPPED FOUR BEHAVIOURS AND THE DIFF REVIEW CAUGHT ALL FOUR:**
      ① the `settlements.length > 0` / `neighborhoods.length > 0` guards (**many districts have
      neither** — without them the row offers a chip that opens an empty list, which reads as
      broken); ② both **clear (✕) buttons**, so an optional level could no longer be un-picked;
      ③ `maxLength={255}`, the stored column's limit; ④ the `export default`.
      *Every one compiled, linted and token-checked clean. A rewrite loses behaviour no baseline can
      see — only reading the deletions finds it.*
      🔴 **`common.clear` DID NOT EXIST.** I used the key before checking; `clear` lives under
      `searchOffers`. Added to all three locales rather than borrowing another screen's namespace.
      Caught by the checker, not by `tsc` — though `tsc` **would** have caught adding it to only one
      locale, since `translations/index.ts` types the three against each other.
      ✅ **9 i18n keys × 3 locales resolve; checker proven able to fail** (renamed `clear` in ru →
      ru red, uz/en green, exit 1; restored).
      **Baselines unchanged: user `tsc` 6 / lint 216 / tokens 1 · driver `tsc` 28 / lint 280 / tokens 3.**
      🛑 **STILL NOT REBUILT AT THE TIME OF 8b:** `TimeWindowCard`, `SeatStepper` and
      `SpecialOrderPanel`. **→ 8c below does the first two.**
      🛑 **NOT SEEN ON A DEVICE.**
- [x] **8c. The rest of the order screen. ✅ DONE 2026-09-01.**
      🟢 **THE OWNER SPOTTED THE REAL FIX: `GeoSheet` ALREADY EXISTS** — *"on passenger search
      we create country/city step-by-step selection, I think there are similar on design"*. Correct,
      and it is the artboards' own picker. My step-8b row was a second cascade built beside it.
      🔴 **MAHALLA REMOVED — owner delegated the call to "the design's best logic", and four
      independent lines of evidence agreed:** ① `UserBuyurtma.dc.html` mentions mahalla/MFY **zero**
      times and labels adm3 "mavze/QFY"; ② `GeoSheet`'s own level list — written for these artboards
      — records mahalla as "a sibling, not a depth"; ③ it has **no id column (T-029)**, so
      `hydrateLocation` never restored it and opening an order for edit already dropped it;
      ④ nothing can match on it, now or after T-102. **It was the ONLY reason `LocationCard` was
      excluded from `GeoSheet`** — the trap note at the bottom of this file is now obsolete.
      ⚠️ **`LocationValue.neighborhood` IS KEPT, deprecated, always null.** `buildLocationText` still
      reads it: pre-existing orders carry a mahalla inside their stored `from_text`, and
      `handleSubmit`'s guard only resends that text when the passenger re-picks. Deleting the field
      would rewrite those strings and lose real addresses.
      ✅ **`LocationCard` now uses `GeoSheet`** (`startLevel="province"` — country is fixed, OR-004;
      `endLevel="settlement"` — adm3, one deeper than search, exactly as `SearchOffersScreen`'s own
      comment predicted). **The eighth and last hand-rolled geo cascade in the user app is gone.**
      ✅ **THE ROUTE AND TIME BLOCKS ARE NOW TWO CARDS, as the artboard draws them.** The times used
      to sit *interleaved between* the two locations, which is what made the block read as a stack of
      forms rather than a route.
      ✅ **`TimeWindowCard` restyled:** mono eyebrow heading, "Hoziroq" is a `Chip` not a
      flash-icon + checkbox, and the inner panel is the neutral **ground** — it was a **blue tint,
      a colour that appears nowhere on this screen in the design**. Its error text also moved from
      `danger` (a FILL) to `dangerText` (the ink) — the §2.10 defect class, found again.
      ✅ **`SeatStepper`: the seats are TAPPABLE now**, as the artboard draws them — an empty square
      asks the gender, a filled one gives that seat back with no sheet (unambiguous). **The +/−
      stepper is kept on purpose:** it is the only control that still works when a row is full.
      Squares to the artboard's 30px/radius 8/2px, and the icons moved to `maleInk`/`femaleInk`.
      ✅ **Every section heading is now the artboard eyebrow.** The last two were still 18px/700, and
      one of them (`Qo'shimcha ma'lumot`) was **RED** — no artboard heading is red; danger is for
      errors. `cardTitle`/`cardTitleDanger` deleted.
      ✅ **Deletions reviewed mechanically again** (the check that caught four losses in 8b): every
      deleted line in `SeatStepper` and `TimeWindowCard` is presentational. `CheckRow` survives at
      ~10 call sites — the genuinely multi-select options, which are checkboxes in the design too.
      ✅ **16 i18n keys × 3 locales resolve; checker proven able to fail** (renamed `departTitle` in
      uz → uz red, ru/en green, exit 1; restored). Two new keys in all three locales:
      `departTitle`, `arriveTitle`.
      **Baselines unchanged: user `tsc` 6 / lint 216 / tokens 1 · driver `tsc` 28 / lint 280 / tokens 3.**
      📋 **`GeoSelectModal` NOW HAS ZERO CALL SITES** — its last one was the code this step
      replaced. **Not deleted** (rule 4: ask first). Same for the now-unused
      `passengerOffers.selectNeighborhood` / `selectCity` keys. → worth a small cleanup card.
      🛑 **NOT SEEN ON A DEVICE.** The interaction changes are what to walk: the sheet picker on
      both directions, tapping seats, and the "Hoziroq" chip.
- [x] **8d. `SpecialOrderPanel`. ✅ DONE 2026-09-01 — the order screen is now fully converted.**
      🔴 **THE WHOLE BLOCK IS PURPLE IN THE DESIGN, AND THE TOKEN ALREADY EXISTED.**
      `palette.paid` (#5B2E9D) — 6 uses on this artboard, present on **9 of the 33 boards**. The
      panel was a **patchwork of four accent families instead**: a green border on mint, blue price
      inputs, an amber waiting field and a **RED** price notice. *None of them was the colour the
      design assigns to paid flows, and the token for it had been sitting in the palette since
      step 1b.*
      ✅ **One new token, measured not invented: `paidBorder` = `rgba(91,46,157,.22)`**, the
      artboard's own card border. Added to **both** palettes together; `diff` confirms the only
      remaining delta between them is still the documented `brandSuffix` comment.
      🔴 **`tsc` CAUGHT ME INVENTING `paidBorder` BEFORE IT EXISTED** — I wrote the style first and
      the palette second. The baseline is what noticed, not me.
      ✅ **Money now reads in MONO** (`monoPrice` / `monoMeta`), as every number in these artboards
      does — and a price column only lines up in a monospaced face.
      ✅ **Contrast measured, not assumed:** white on `paid` **9.04:1**, `paid` on surface
      **9.04:1**, `paid` on ground **8.08:1**. All pass comfortably.
      ✅ Error text moved from `danger` (a FILL) to `dangerText` — the §2.10 class again, third
      instance in this card.
      🔴 **I TRUNCATED THE FILE'S `export default` FOR THE SECOND TIME.** Replacing a trailing
      style block by slicing to the end of the file drops whatever followed it. Caught by the same
      deletion review that caught it in 8b, then **every edited file's last line was checked** — the
      rest are intact. *A slip repeated is a method problem: append-after-styles must be re-checked
      whenever a stylesheet is replaced wholesale.*
      **Baselines unchanged: user `tsc` 6 / lint 216 / tokens 1 · driver `tsc` 28 / lint 280 / tokens 3.**
      🛑 **NOT SEEN ON A DEVICE.**
      🟡 **2026-08-31 — THE WHOLE FLOW IS TOKENIZED (121 → 0), NOT REBUILT.** `CreatePassengerOffer`
      33 + all six `components/passengerOffer/*` (88). Colours only; no layout, no logic.
      ✅ **SIX NEW PALETTE TOKENS, MEASURED NOT INVENTED** — `maleTint` `maleInk` `femaleTint`
      `femaleInk` `blueTintSoft` `blueBorder`, read off the gender picker in `UserBuyurtma.dc.html`
      and contrast-checked (8.27:1 / 7.24:1 ink-on-tint). Added to **both** apps' palettes together.
      🔴 **THE SEAT MARKER IS THREE STATES, NOT TWO** — neutral / male / female, each a fill *and* a
      border. The palette had `male` and `female` but no tints; mapping all three to what existed
      would have made different seats render identically.
- [x] **9. `MyBookingsScreen` + `MyPassengerOffersScreen` → `UserMyOrder.dc.html`.
      ✅ DONE 2026-09-03 — THE TWO SCREENS BECAME ONE.**
      🔴 **THIS STEP WAS A MERGE, NOT A REPAINT, AND MEASURING IS WHAT SHOWED IT.** The
      artboard's three modes — `Jarayonda` / `Faol` / `Tarix` — are **LIFECYCLE STAGES**, read
      off its own `buildList()`: `(done||cancelled) ? tarix : step===0 ? jarayon : aktiv`. They
      cut **across** the two screens rather than along them: a passenger asks *"have I got a
      driver yet?"*, not *"whose offer was this?"*. The two screens sliced the same journey by
      SOURCE — an implementation detail — and **disagreed with each other about their own tabs**
      (all/pending/confirmed vs all/published/completed/cancelled).
      ✅ **The plan of record already said so:** `MenuScreen`'s step-6b comment names *"a segment
      inside MyBookings — that belongs to step 9"*. **That text-link workaround is now retired.**
      ✅ **Owner decisions 2026-09-03:** full merge into the one tab; **build only what has a
      backend.**
      🛑 **FOUR ARTBOARD FEATURES DELIBERATELY NOT BUILT — they have no API:** the tax receipt
      ("Chek", fiscal mark), the "budilnik" alarm ping, the in-app message sheet, and the
      like/dislike + tags rating. **The stars-and-comment rating IS real and was kept.** Drawing
      the other three would ship four dead buttons on a screen about to be walked on a device.
      ✅ **`utils/orderLifecycle.ts` — the grouping as PURE FUNCTIONS**, plus
      `scripts/check-order-lifecycle.mjs`: **18 cases, importing the REAL module.**
      **Proven able to fail:** dropping the expiry branch → `published, left 4h ago` lands in
      `jarayon`, red, exit 1; restored → green.
      🔴 **TWO CONTRAST FAILURES INHERITED FROM THE OLD SCREENS, BOTH FOUND BY MEASURING:**
      ① `driver_found` used `brand` on `successTint` and its comment **claimed 6.96:1** — but
      `brand` is the BRIGHT `#05BB42` (the palette's own note: *"NOT a button fill"*), so it
      really measured **2.24:1**, barely better than the `#0EA5E9` defect T-101 replaced. *The
      comment had measured a different colour from the one the code used.* → `actionPressed` on
      `blueTint`, **6.70:1**. ② `cancelled`/`rejected` used `danger` (a FILL) as ink, **4.20:1**
      → `dangerText`, **4.88:1** — the §2.10 role rule again.
      ⚠️ **`completed` MOVED to the neutral `surfaceSunken`** to free the blue: the two inks
      measured **1.24:1 from each other** on a shared tint, so `driver_found` and `completed`
      would have read as the same pill — the collision the old comment was right to fear even
      though its number was wrong. **All 20 pairs on the screen now pass AA**, measured against
      the real palette (not hand-typed hexes — two of my own probes used wrong values first).
      ✅ **ONE NEW TOKEN, MEASURED NOT INVENTED: `surfaceTrack` = `#E4E0D7`**, the
      segmented-control groove (2 uses: `UserMyOrder`, `UserQidiruv`). Added to **both** palettes
      together; `diff` confirms the only remaining delta is still the documented `brandSuffix`.
      ✅ **`components/chrome/SegmentedModes.tsx` in both apps** — the mode strip with mono count
      pills. ⚠️ **NOT the same control as the `Qidiruv` boards' filter strip**, though both carry
      a count pill: those are `radius 12px 12px 0 0` with `border-bottom:none` — TABS welded to a
      panel. Measured side by side; **step 17 should build that variant separately.**
      ✅ **EVERY CARRIED-OVER FIX LISTED IN THE FILE HEADER AND VERIFIED:** T-024 · T-028 · T-039 ·
      T-040 · T-051 · T-055 · T-068 · the auth-expiry logout. *A rewrite is exactly where such
      things go missing, so they are enumerated where the next reader will see them.*
      🟢 **AND `MyBookings` HAD T-051's DEFECT STILL IN IT** — `useEffect(…, [token, filter])`
      refetched on every tab tap AND raised the full-screen spinner. Fixed on the other screen in
      T-051 and left standing here: *fix the class, not the instance.* One fetch per visit now,
      `Promise.allSettled` so one endpoint failing cannot blank the other list.
      ✅ **19 i18n keys × 3 locales resolve** (new `myOrders` block, copy taken from the artboard
      itself). 🔴 **THE CHECKER'S FIRST VERSION WAS THE BUG IT EXISTS TO CATCH** — it matched only
      literal `t('…')`, so it skipped the three mode labels that reach `t()` via a ternary, and
      breaking `modeAktiv` left it **GREEN**. Widened to every `myOrders.*` literal; now red on
      that break. *A checker that cannot go red proves nothing — twice learned, now written down.*
      📋 **BOTH OLD SCREEN FILES ARE NOW ORPHANED** (`MyBookingsScreen.tsx`,
      `MyPassengerOffersScreen.tsx` — nothing imports them; grep-verified). **NOT deleted —
      rule 4.** 2 of the user app's 6 baseline `tsc` errors live in the orphan. → **T-105.**
      📋 **The `MyPassengerOffers` ROUTE is kept as a redirect** to the merged screen so no
      lingering caller or deep link is stranded; delete it in the same cleanup card.
      **Baselines unchanged: user `tsc` 6 / lint 216 / tokens 1 · driver `tsc` 28 / lint 280 /
      tokens 3**, plus 45 checker cases green (18 lifecycle · 19×3 i18n · 8 ride-time).
      🛑 **NOT SEEN ON A DEVICE.**
- [x] **10. `OfferDetailsScreen` + `OfferDriversScreen`. ✅ DONE 2026-09-03 — but the card's
      premise was wrong, and measuring is what showed it.**
      🔴 **NEITHER SCREEN IS THE ARTBOARD'S "DETAIL STATE".** `UserMyOrder.dc.html`'s detail is a
      read-only **SHEET over the order list** (order code, driver block, route, info rows,
      cancel + alarm/message/call). The two screens this card names are different things:
      • **`OfferDetailsScreen` (1 456 lines) is a DRIVER'S OFFER WITH A JOIN FORM** — seat
        picking, front-seat premium, salon scope, price confirmation. Reached from **search**.
        It is where you *book* a ride, not where you *view* one you already have.
      • **`OfferDriversScreen` (487 lines)** is the passenger choosing between bidding drivers.
      **The artboard specifies neither.** Recorded rather than pretended otherwise.
      ✅ **Owner decision 2026-09-03: rebuild the small one, convert the big one.**
      ✅ **`OfferDriversScreen` REBUILT** (487 lines, under the 500-line threshold): shared
      `TopBar` (`flat` + `onBackPress`), the artboard's card / avatar / status pill / inset
      "terms well", money in MONO, dashed-border empty state. **All logic preserved verbatim** —
      T-024 (the screen's reason to exist), T-054 (phone only on the confirmed row), T-068
      (push scoped by `offer_id`), the `busyId` single-flight guard, and the confirm dialog that
      **names how many rival drivers a tap will auto-reject**.
      ⚠️ **REJECT IS DELIBERATELY THE QUIET BUTTON.** Accepting is irreversible and declines
      every other bidder, so the destructive-*looking* control is the one that does less harm.
      Reject is an outlined danger button, not a danger FILL.
      ✅ **`OfferDetailsScreen` CONVERTED, NOT REBUILT** — 1 456 lines of working booking maths
      (T-067 duplicate-request handling, T-081 salon scope, the front-seat premium that mirrors
      `OfferPassengerService.joinOffer` exactly). **Proof it stayed safe: 47 insertions /
      79 deletions, and the diff contains no `joinOffer`, seat, price, salon or token line.**
      🔴 **34 `fontWeight` LITERALS → `font('sans', n)` — THE ANDROID FONT TRAP.** React Native
      does **not** synthesise weights on Android: `fontWeight` selects no face at all, the family
      NAME must carry it. A missing weight does not throw, it silently falls back and looks
      *nearly* right. All 34 mapped to bundled faces (500/600/700). ⚠️ **And `font` then had to
      be imported** — the "check the file imports what you used" trap, which has now bitten five
      times across three days.
      ✅ **Four dead style blocks deleted** (`header`, `backButton`, `headerTitle`,
      `headerSpacer` — 0 uses each after the `TopBar` swap) and the then-unused `Platform`
      import with them. **File terminator re-checked** — the step-8d truncation slip.
      ⚠️ **`OfferDetailsScreen` imports `SafeAreaView` from `react-native`, NOT
      safe-area-context** — a no-op on Android, which is exactly what hides the double-inset bug.
      Left alone (it is not double-padding today because `TopBar` is the only inset applier), but
      it should move to safe-area-context when someone touches this screen again.
      ✅ **Contrast measured from the REAL palette: 17/17 pairs pass AA** on the rebuilt screen.
      `dangerBorder` `#D9705E` is the artboard's own cancel-button border.
      📋 **THE ARTBOARD'S DETAIL SHEET IS STILL UNBUILT** — it belongs over `MyOrdersScreen`, not
      here, and two of its three action buttons (alarm ping, in-app message) have no backend.
      Worth its own card once those exist; the remaining cancel + call already work from the
      merged card.
      **Baselines unchanged: user `tsc` 6 / lint 216 / tokens 1 · driver `tsc` 28 / lint 280 /
      tokens 3**, plus 45 checker cases green.
      🛑 **NOT SEEN ON A DEVICE.**
- [x] **11. `MenuScreen` + `NotificationsScreen` → drawer + bell panel.
      ✅ DONE 2026-09-03 — and the hamburger had been lying since step 3.**
      🔴 **THERE WAS NO DRAWER IN THE APP AT ALL.** `MenuButton.tsx` said so outright (*"the app
      has no drawer navigator"*), yet `TopBar` has drawn a hamburger since step 3. It was wired
      to whatever each screen had lying around: on the **home screen it opened the PROFILE — the
      same thing the avatar beside it did** — and on the orders tab it navigated Home (my own
      step-9 code, for want of anything better). **Every artboard draws a navigation menu behind
      that button.** *A control that has been on screen for eight steps doing the wrong thing is
      not something the artboards told me; it took following the button to what it called.*
      ✅ **`components/chrome/NavDrawer.tsx`** — the artboard's panel, measured from
      `UserMyOrder.dc.html` lines 39-66: 270-wide (capped at 78% on narrow phones), `ground`,
      right hairline, `shadows.drawer`, wordmark 19/900, groups 46px/14.5/700 with expand arrows,
      children 38px/13.5/600 indented 22, separators above the three grouped sections.
      ⚠️ **NOT a `@react-navigation/drawer` navigator** — that is a new dependency (rule 4) and
      would have to wrap the whole tree. This is a `Modal` over the current screen, which is what
      the artboards actually draw: a panel over the page, not a navigator.
      ⚠️ **`Modal` renders OUTSIDE the SafeAreaProvider**, so insets are applied by hand — the
      S24-Ultra nav-bar bug from step 8e, same reason `BottomSheet` does it.
      ✅ **SIX OF THE TEN ENTRIES HAVE NO SCREEN** (Chat, Balans, Promo, Aksiyalar, Narxlar,
      Yo'riqnomalar, plus "Servis xabarlar"). They render **dimmed with a "Tez orada" marker**,
      not as dead taps. 🔴 **The artboard's own `navGo()` handles exactly ONE of its ten labels
      and merely closes the menu for the rest** — the design has always known this menu is mostly
      aspirational. Owner decision 2026-09-03: wire what exists, dim the rest.
      ✅ **TYPE-SAFE BY CONSTRUCTION: entries are typed `ParamlessRoute`** — the existing derived
      type — so an entry pointing at a screen that needs params **does not compile**.
      **Proven, not asserted:** pointing `orderMine` at `OfferDrivers` → `TS2322: Type
      '"OfferDrivers"' is not assignable to type 'ParamlessRoute | undefined'`; restored.
      ✅ **`NotificationsScreen`: header → `TopBar`**, and **T-072's icon-only mark-all becomes a
      full-width panel row with words again** ("Hammasini o'qildi" — the artboard's own). *T-072
      shrank it to an icon because it wrapped the title in a crowded row; the artboard gives it
      its own row, so the reason for the compromise is gone. The fix was right for the layout it
      was in; the layout changed.*
      🔴 **FIVE RAW COLOURS THE TOKEN RATCHET COULD NOT SEE.** The screen built its tints as
      `colour + '20'` — string concatenation appending 12.5% alpha at RUNTIME.
      `check-design-tokens.mjs` scans for literals, and there is no literal, so the screen counted
      as **clean at 0 while shipping five untokenised fills**. It also mapped by value, not role:
      `danger` and `warnBorder` are FILLS being used as ink over tints derived from themselves.
      Replaced with measured ink/tint pairs. ⚠️ **A ceiling of 0 means "no literals", not "no raw
      colours" — a runtime-built colour is invisible to it.**
      ✅ **12 more `fontWeight` literals → `font()`** (the step-10 Android trap), **and `font` had
      to be imported here too** — sixth time that trap has bitten.
      ⚠️ **ONE `fontWeight` DELIBERATELY LEFT**: the `×` delete glyph at 300. Manrope's bundled
      range starts at 500, so `font()` would fold it **UPWARD** and render the hairline heavier —
      the opposite of the intent. Reason recorded at the style. *Mechanical conversion would have
      silently changed it.*
      ✅ **Four orphaned style blocks + `Ionicons`/`Platform` imports removed** after the header
      swap; **file terminator re-checked** (the step-8d slip).
      ✅ **The i18n checker now sweeps THREE files** (`myOrders` · `drawer` · `notifications`) —
      **56 keys × 3 locales = 168 lookups.** **Proven able to fail:** renaming `drawer.balance` in
      uz → `FAIL uz drawer.balance`, exit 1; restored → green.
      🔴 **AND ITS REGEX WAS WRONG WHEN GENERALISED** — `${prefix}\\.` emitted an UNESCAPED dot, so
      `drawerXopen` would have matched and been reported as a phantom missing key. Caught by
      testing the regex against a probe string rather than trusting the green run; the count was
      56 either way, so nothing but a deliberate check would have found it.
      ✅ **Contrast: 11/11 pass AA.** The drawer wordmark measures 2.29:1 and is the **already-
      documented logotype exemption** (`DESIGN-TOKENS.md` §2.11 — same as `TopBar`'s); recorded
      there rather than "fixed", since `brand` green *is* the mark.
      📋 **`menu-items/index.ts` IS CONFIRMED DEAD** — stale English placeholder data
      (`Home`/`Activity`/`Profile`, emoji icons) with **zero importers**, grep-verified. The
      drawer supersedes it. **Not deleted — rule 4.** → **T-105**.
      **Baselines unchanged: user `tsc` 6 / lint 216 / tokens 1 · driver `tsc` 28 / lint 280 /
      tokens 3.**
      🛑 **NOT SEEN ON A DEVICE.** The drawer is brand-new interaction surface — worth opening
      from both screens, expanding both groups, and checking the dimmed entries do nothing.
- [x] **12. `ProfileScreen` + `EditProfileScreen`. ✅ DONE 2026-09-03 — the coloured circles are
      gone, as this card predicted.**
      🔴 **THE ARTBOARD'S "PROFILE SHEET" IS A 232px POPOVER, NOT A SCREEN.**
      `UserMainMenu.dc.html` lines 89-103: an avatar, a name, a mono phone number, a hairline, and
      six plain text rows with a red "Chiqish". **No icons anywhere in it.** But `Profile` is a
      bottom-TAB destination in this app, so the popover cannot replace it — the screen was rebuilt
      in the popover's *language* (monochrome ink, near-black avatar disc, mono phone, one red
      row), not swapped for it. Same call as step 10: the artboard is a drawing, not a spec.
      ✅ **THE SIX COLOURED TINT/DOT PAIRS ARE DELETED** — amber, blue, indigo, pink, grey — with
      `renderIcon` and its three style blocks. The 2026-08-31 repaint mapped them to the nearest
      tokens only to clear the ratchet, and left a note that deleting them belonged here.
      🔴 **AND THEY WERE NEVER CARRYING INFORMATION:** `bell` and `help` rendered the **same**
      amber pair, `edit` and `card` the **same** blue tint. Five colours encoding six rows, two
      pairs duplicated — decoration that read as a system. *Counting them is what showed it; the
      card said "delete" and was right for a second reason nobody had recorded.*
      ✅ **FOUR OF THE SIX MENU ROWS GO NOWHERE** (`payment`, `history`, `help`, `settings`). The
      old code ran `console.log('Navigate to …')` on tap — **indistinguishable from a broken app
      to anyone holding the phone.** They now render dimmed with the "Tez orada" marker, exactly
      as the drawer's unbuilt entries do (step 11).
      ✅ **`EditProfileScreen` CONVERTED, NOT REBUILT** (1 511 lines). **31 insertions / 60
      deletions, and the diff contains no validation, save, phone or `onChangeText` line** —
      grep-verified. Both header instances (the loading branch AND the main return) → `TopBar`;
      **T-071's grievance stays fixed**, since `TopBar`'s back control is a fixed-size tile.
      ✅ **14 more `fontWeight` literals → `font()`**, and **`font` had to be imported here too —
      seventh time that trap has bitten.** Four orphaned style blocks removed; terminator checked.
      🔴 **A THIRD AND FOURTH RUNTIME-BUILT COLOUR, FOUND BY SWEEPING FOR THE CLASS.** Step 11
      found five `colour + '20'` fills in `NotificationsScreen`; grepping
      `palette\\.[a-zA-Z.]* *\\+ *['\"]` across **both apps** found one more in each —
      `components/@extended/NetworkStatus.tsx`, an info panel. Both fixed to `blueTint`.
      **Both apps are now clean of the pattern**, which the token ratchet still cannot see.
      *Finding one instance is a fix; sweeping for the class is the fix.*
      ✅ **The i18n checker now sweeps FOUR files** — 69 keys × 3 locales = 207 lookups.
      ✅ **Contrast: 12/12 pass AA**, measured from the real palette.
      ⚠️ **`text.chevron` is used for the disclosure `›` and is DECORATIVE ONLY (1.91:1)** — that
      is its documented role in the palette, not a finding.
      ⚠️ **`EditProfileScreen` imports `SafeAreaView` from `react-native`**, like
      `OfferDetailsScreen`. A no-op on Android, so `TopBar` is the only inset applier and there is
      no double-inset today. Left alone in a value conversion; move it when the screen is next
      rebuilt.
      ⚠️ **`ProfileScreen` logs auth state on EVERY render** (`console.log('ProfileScreen: Auth
      state', …)`) plus three more in the logout path. Pre-existing noise, outside a repaint's
      remit — recorded, not silently removed. → worth a sweep card.
      **Baselines unchanged: user `tsc` 6 / lint 216 / tokens 1 · driver `tsc` 28 / lint 280 /
      tokens 3.**
      🛑 **NOT SEEN ON A DEVICE.**
- [x] **13. Auth flow: `PhoneRegistration` → `UserR1`, `OTPVerification` → `UserR2OTP`,
      `UserDetails` → `UserR3Fio`. ✅ DONE 2026-09-03 — VALUES ONLY, and the artboard was
      deliberately NOT followed in two places.**
      ✅ **Owner decision 2026-09-03: values only; field names, validators, autofill props and the
      SMS hash are untouchable regardless of line count.**
      ✅ **PROVEN, NOT ASSERTED. 56 insertions / 43 deletions across 2 659 lines, and grepping the
      diff for `autoComplete|textContentType|importantForAutofill|maxLength|keyboardType|
      onChangeText|onKeyPress|validat|verifyOtp|sendOtp|phone_e164|smsRetriever|startOtpListener|
      first_name|last_name` returns NOTHING but my own comment text.** T-061/T-063 and OR-003 are
      untouched by construction, and the grep is the evidence.
      🔴 **THE ARTBOARD ASKS FOR A 5-DIGIT CODE. THE SERVER GENERATES 4.**
      `UserR2OTP.dc.html` draws **5 cells** (`hint-placeholder-count="5"`, `code.length === 5`);
      `config.otp.codeLength` defaults to **4** (`OTP_CODE_LENGTH`, API `src/config/index.ts:36`).
      **Building the artboard's five boxes would have broken verification outright** — the app
      would collect a digit the SMS never contains. Left at 4. *Checked the backend rather than
      the drawing; nothing in the app could have revealed this.*
      🔴 **THE ARTBOARD'S CUSTOM KEYPAD WOULD DESTROY SMS AUTOFILL.** `UserR2OTP` draws its own
      3×4 numeric pad of `<div>`s and no system keyboard. A `View` grid cannot carry
      `autoComplete="sms-otp"` or `textContentType="oneTimeCode"`, so building it would silently
      remove OR-003's zero-tap fill — **a regression no baseline, checker or contrast run can
      see.** Not built. *The design is a drawing of a screen, not a specification of its input
      behaviour.*
      ✅ **What DID change, all of it presentation:** **28 `fontWeight` literals → `font()`** across
      the three screens (the Android trap; imports handled per-file this time, so the seventh
      instance of that trap did not recur) · the **OTP box measured from the artboard** — 64px
      tall, radius 14, 1.5px border, `surfaceSunken` when empty, and **the digit in MONO at 30px**,
      as every number in these boards is · the indicator bar onto `borders.emphasis`/`full`.
      ✅ **FIVE DEPRECATED `grey[]` ALIASES REPLACED BY ROLE** (§2.10) — `grey[50]`→`surfaceInput`,
      `grey[100]`→`ground`, `grey[200]`→`surfaceSunken`, `grey[300]`→`disabled`. All five were
      fills or borders, never ink, so the mapping is unambiguous. **That is 5 fewer call sites for
      step 23.**
      ✅ **NO STRUCTURAL CHANGE, AND THE ARTBOARD AGREES.** The auth boards have **no `TopBar`** —
      no hamburger, bell or avatar, just a centred wordmark (`UserR1` line 25). The existing
      screens already have exactly that shape, so unlike steps 10-12 there was no header to
      replace. *Worth recording: "convert this screen" does not always imply the shared chrome.*
      ✅ **Contrast 5/5 pass AA.** Baselines unchanged: **user `tsc` 6 / lint 216 / tokens 1 ·
      driver `tsc` 28 / lint 280 / tokens 3.**
      🛑 **NOT SEEN ON A DEVICE — AND THIS SCREEN IS THE ONE WHERE THAT MATTERS MOST.** Green
      checks prove least here: only a real phone receiving a real SMS can show that OTP autofill
      still works. **Walk it before trusting it**, even though nothing in the diff should have
      affected it.
- [x] **14. `BlockedScreen` + remaining strays. ✅ DONE 2026-09-03 — and the card's headline goal
      was already met before the step started.**
      🔴 **"USER RAW-HEX CEILING REACHES 0" IS WRONG AS WRITTEN.** Measured with
      `check-design-tokens.mjs --report`: the ceiling is **1**, and that one is
      `FACEBOOK_BRAND_BLUE = '#1877F2'` in `PhoneRegistrationScreen` — **Facebook's brand colour**,
      required exactly by Meta's guidelines and already documented at its definition. **1 is the
      FLOOR, not a debt.** *(Earlier prose in this card named `VEHICLE_SWATCH_FALLBACK` among the
      survivors; that constant no longer exists. The script is the truth, the prose was stale.)*
      🟢 **THE 2026-08-31 TOKENIZATION HALF OF THIS CARD WAS ALREADY DONE — 111 → 15**
      (`Notifications` 35 · `Blocked` 19 · the auth pair 19 · `themed-text` · `RideCard` ·
      `BackButton` · `MenuButton` · the `shadowColor: '#000'` strays).
      ✅ **`shadowColor: '#000'` → `text.primary` was a CORRECTION, not a repaint:**
      `themes/index.ts`'s own `shadow()` helper already casts `#16130E`, so the loose call sites
      were casting a *different* shadow from the tokens beside them. They now agree.
      ✅ **`BlockedScreen`'s three states (blocked / pending-delete / suspended) fold onto TWO
      palette families** — safe **only** because each state also carries its own emoji (🚫/⏳/⚠️)
      and its own translated title, so colour is never the sole signal. Checked before collapsing.
      ✅ **Owner decision 2026-09-03: convert `BlockedScreen` + the genuinely LIVE components;
      leave the orphans and defer `SearchOffers`.** Converting dead code has no user-visible effect.
      🔴 **I DEFERRED IT TO "STEP 17" AND STEP 17 IS THE DRIVER'S SEARCH SCREEN.** The user app's
      `SearchOffersScreen` (1 937 lines, 42 weights, artboard `UserQidiruv.dc.html`) has **NO STEP
      IN THIS PLAN AT ALL** — see *Next actions*, item 2. The deferral still stands (T-102/T-103
      gate it), but it is deferred to an unwritten card, not to step 17.
      ✅ **22 `fontWeight` literals converted across 11 live files** — `BlockedScreen` (4),
      `AppModal` (2), `ModalList`, `LanguageSelector`, `themed-text` (3), `CheckRow`,
      `GenderPickSheet`, `DateWheelModal` (2), `NotificationsScreen` (2),
      `CreatePassengerOfferScreen` (4), `SeatStepper` (1). **All nine import sites verified
      individually**, not assumed from a green `tsc`.
      🔴 **THE ANDROID FONT TRAP HAD THREE SPELLINGS AND I HAD ONLY EVER GREPPED ONE.**
      Steps 10-13 converted 88 of these matching `fontWeight: '700'` — single quotes, numerals.
      Step 14 found more in screens **already declared converted**:
      • `fontWeight: "700"` — **double quotes**, 5 of them, in `CreatePassengerOffer` (step 8) and
        `SeatStepper` (step 8c);
      • `fontWeight: 'bold'` — **the keyword**, 4 of them, including 2 in `NotificationsScreen`
        which step 11 had "finished".
      *A hand-run grep is only as good as the spelling you happen to think of.*
      ✅ **`scripts/check-font-weights.mjs` — SO THIS CANNOT RECUR.** One regex covering every
      spelling (`'700'` · `"700"` · `'bold'` · `'normal'`), run over `screens/` and `components/`.
      **Proven able to fail in all three spellings that actually slipped past me**: each injected
      into `BlockedScreen` in turn → red, exit 1; restored → green, `git diff` shows only the 5
      intended conversions.
      ⚠️ **The checker carries TWO kinds of exemption, each with a written reason and an expiry:**
      **7 files** (3 orphans + `SearchOffers` + 3 zero-importer components) and **one LINE** —
      `NotificationsScreen:543`, the `×` hairline at weight 300, because Manrope's bundled range
      starts at 500 and `font()` would fold it **UPWARD** and render it heavier. *A stale exemption
      hides a real defect; drop each one when its reason expires.*
      📋 **A THIRD ORPHAN FOUND: `screens/HomeScreen.tsx`** — exported from `screens/index.ts` but
      **never routed**; the `Home` tab renders `MenuScreen` (`MainTabs.tsx:48`). Also confirmed
      zero-importer: `components/cards/RideCard.tsx` and `components/@extended/NetworkStatus.tsx`.
      **None deleted — rule 4.** → **T-105**, which now holds 3 orphaned screens + 3 components.
      ⚠️ **THE DRIVER APP HAS 298 `fontWeight` OCCURRENCES.** Not a regression — its screens are
      steps 15-22, all unconverted. **The checker is user-app-only for now; copy it to the driver
      app when step 15 starts**, so the same three spellings cannot slip through there.
      ✅ **Contrast 6/6 pass AA.** Baselines unchanged: **user `tsc` 6 / lint 216 / tokens 1 ·
      driver `tsc` 28 / lint 280 / tokens 3.**
      🛑 **NOT SEEN ON A DEVICE.** ⚠️ **And the font trap is invisible anywhere else** — a wrong
      weight renders as *nearly* right, so these 22 conversions can only be confirmed on a real
      Android device beside a correct screen.
- [x] **15.** `HomeScreen` → `DriverMenu.dc.html` — **the card named the wrong screen, and most of
      the artboard has no backend.** Done 2026-09-05.
      🔴 **`HomeScreen` IS AN ORPHAN.** Exported from `screens/index.ts`, imported by nothing,
      routed nowhere — the Home tab renders **`MenuScreen`** (`navigation/MainTabs.tsx:48`).
      **This is the SAME trap step 14 found in the user app**, in the other app, and neither the
      card nor the artboard could show it: only following the route table did. Not deleted
      (rule 4) → **T-105**, which now holds a 4th orphaned screen + 3 more components
      (`RideCard`, `sections/home/RideTypeSelector`, `sections/profile/ProfileHeader`, all
      zero-importer and verified).
      🔴 **THE HAMBURGER OPENED THE PROFILE — the identical defect step 11 fixed in the user app.**
      `MenuScreen` passed `onMenuPress={handleProfilePress}`, so the hamburger was a second copy
      of the avatar beside it, and the menu every artboard draws behind it did not exist.
      ✅ **`components/chrome/NavDrawer.tsx` (new)** — ported from the user app's step-11 drawer
      (chrome is duplicated per app on purpose); same layout, driver's own `UBX_NAV` table.
      🛑 **SIX OF THE DRAWER'S ENTRIES HAVE NO SCREEN AND ARE DIMMED**, not hidden: Balans and
      Daromad (step 19, genuinely new work on T-087's ledger), Xabarlar (no chat exists — the API
      has ONE notification feed, which the bell already opens), Mening mashinalarim (the profile
      holds a SINGLE vehicle, there is no list → step 21), Barcha hujjatlar (no hub screen; the
      four documents under it ARE routed), Yo'riqnomalar.
      ⚠️ **The artboard's own `UBX_GO` sends "Kelgan buyurtmalar" and "Mening buyurtmalarim" to the
      SAME file.** They are different things here — incoming is `SearchPassengerOffers`, own is
      `MyJoinRequests`. Following the design literally would have shipped two rows to one screen.
      🛑 **THE REST OF `DriverMenu` IS BACKEND-BLOCKED — NOT BUILT, ON PURPOSE** (owner 2026-09-03,
      "build only what has a backend"). See the new blocked list below: the online/offline toggle
      is the artboard's central mechanic and **does not exist anywhere** — not in `api/driver.ts`,
      not on the API models.
      ✅ **`scripts/check-font-weights.mjs` ported to the driver app, with TWO gaps closed** that
      the user app's copy still has: `fontWeight: 700` (the **unquoted** numeral — a legal 4th
      spelling its regex cannot see) and the `sections/` + `utils/` directories, which were never
      scanned. **Proven able to fail in all four spellings.**
      🔴 **MY OWN FIRST MEASUREMENT WAS WRONG: I reported "only 6 files" from a mis-quoted grep;
      the checker found 235 occurrences across 30 files.** The plan's warning was right. Only
      `MenuScreen`'s 6 were converted — the other 29 files are owned by steps 16-22 and each
      carries an exemption **naming the step that retires it**.
      ✅ **`scripts/check-drawer.mjs` (new)** — 10 routes exist *and are paramless*, 21 keys resolve
      in uz/en/ru. **Proven able to fail** on all three (bad route, param-needing route, missing
      key). 🔴 **Its first draft grepped the `drawer: {` block and reported all 63 keys missing** —
      the regex stopped at the first nested `},`. It now **bundles and evaluates** the real
      modules. *A grep cannot see nesting — the same trap as step 14's i18n checker, redressed.*
      ✅ Baselines all hold: **driver `tsc` 28 · lint 0 errors / 280 warnings · tokens 3.**
      🛑 **NOT SEEN ON A DEVICE.**
- [x] **16.** `OfferWizardScreen` → `DriverElon.dc.html` — **✅ DONE 2026-09-11 (16a-16g).**
      📦 **SPLIT OUT 2026-09-05 → `docs/PLAN-T101-step16.md`.** It did not fit one step, exactly as
      this card predicted. **The whole story is in that file** — 16a-16e landed 09-05 → 09-07, 16f-16g
      09-11. Headlines: the 4-step wizard is ONE scrolling form with four sheets · the edit path
      restores all 34 fields and a real silent-blanking bug was found in it (16e) · 74 dead style
      blocks deleted (16f, 3 883 → 1 895 lines over the step) · `check-offer-i18n.mjs` found
      `common.delete` missing from every locale. Unbacked features → **T-106 · T-107**.
      🛑 **NOT SEEN ON A DEVICE.**
      🔴 **MEASURED, AND THE CARD'S PREMISE IS WRONG THE SAME WAY STEPS 9-12's WERE.** The artboard
      is **ONE scrolling form**; the screen is a **4-step paginated wizard**. The artboard has no
      step concept at all. This is a RESTRUCTURE, not a repaint. **Owner chose the artboard's
      single form** (2026-09-05), and **backend-only** for its content.
      🛑 **THE TRAP THAT MUST NOT BE GOT WRONG: `handleSave` calls `validateStep(currentStep)` —
      only the CURRENT step.** The wizard makes that safe (you cannot reach step 4 without passing
      1-3); collapsing to one form destroys the guarantee, and submit would validate one section
      and let the rest through. **`validateAll()` lands FIRST (16a), before the pagination goes.**
      🛑 **Not backed, left out and boarded:** the per-seat **gender** grid (the API has only
      `seats_total`/`seats_free`) — ⚠️ **the same gap this plan already records on the SEARCH side,
      so it is ONE card, not two** — plus the "Maxsus buyurtma" block, `dost`avka, and inline
      multi-vehicle (step 21's territory). *The rest of the screen IS backed: the offer API is
      genuinely rich, unlike step 15's.*
      Scale: **1 800 artboard lines / ~180 render keys** against **3 883 screen lines / 41 `useState`**.
- [x] **17.** `OffersListScreen` + `SearchPassengerOffersScreen` → `DriverQidiruv.dc.html` —
      **✅ CLOSED 2026-09-11 (17a-17i, one day).** What shipped: `PassengerOrdersScreen` (the merge of
      the search, the sent requests and the join form: two modes, welded tabs, sort chips, the card,
      the detail-and-offer sheet, the result dialog), reachable by the three old route names;
      `OffersListScreen` on the shared chrome (values only); `SegmentedModes` fixed in BOTH apps; one
      pure module with 69 assertions red on 11 mutations; 51 keys × 3; T-109 boarded. 🛑 **NOT SEEN
      ON A DEVICE — the biggest untested surface in either app.**
      📦 **SPLIT OUT 2026-09-11 → `docs/PLAN-T101-step17.md`** — the whole story lives there.
      🔴 **MEASURED, AND THE CARD WAS WRONG THREE WAYS:** ① the artboard
      is a MERGE of `SearchPassengerOffers` (incoming) + `MyJoinRequests` (sent proposals) — step 9's
      shape again; ② its detail is a SHEET that absorbs `PassengerOfferDetails`' join form; ③
      **`OffersListScreen` has NO artboard** (the design sends "Mening e'lonlarim" to the wizard) —
      values-only conversion. ⚠️ **No route search in the artboard and no matching backend** — the
      route row stays by recommendation. 🛑 **No API for the driver to reject an order** — `Rad etish`
      not built. 🟢 Seat cells ARE backed on this side (`seat_counts`).
- [x] **18.** `OffersListScreen` + `OfferPassengersScreen` → `DriverMyOrder.dc.html`.
      **✅ CLOSED 2026-09-12 (18a-18f, one day).** What shipped: **`MyRidesScreen`** — the driver's
      own rides in three DERIVED phases (Jarayonda / Faol / Tarix), each card expanding to its
      passengers, with `MyRideCard` (the only gradient card body in either app), `BookingRow`,
      `BookingSheet` and the artboard's nine-reason `RejectReasonSheet`; both old route names
      (`OffersList`, `OfferPassengers`) render it; one pure module with 64 assertions red on 11
      mutations; 31 keys × 3; six palette tokens in both apps; T-110 boarded; five files → T-105.
      🛑 **NOT SEEN ON A DEVICE — and it replaces the driver's most-used tab.**
      📦 **SPLIT OUT 2026-09-12 → `docs/PLAN-T101-step18.md`** — the whole story lives there.
      📦 **SPLIT OUT 2026-09-12 → `docs/PLAN-T101-step18.md`. Measured; the card was wrong AGAIN:**
      the artboard is the driver's **OWN OFFERS with their passengers nested** in three DERIVED
      phases (Jarayonda = seats free · Faol = 0 free · Tarix = archived/cancelled) — i.e.
      **`OffersListScreen` + `OfferPassengersScreen` merged**, not "accepted rides". So the
      third-tab question dissolves (same screen), and **17h's "no artboard draws `OffersList`" was
      wrong — `DriverMyOrder` does.** 🛑 Seven owner decisions in that file gate 18a.
      ⚠️ **RESCOPED 2026-09-11 by step 17's measurement:** `DriverOrder.dc.html` is an OLDER COPY of
      `DriverQidiruv` (same data, same modes) and `MyJoinRequests` + `PassengerOfferDetails` are
      absorbed by step 17. **What is left: `DriverMyOrder` only** (Jarayonda / Faol / Tarix — the
      driver's accepted rides) against `OfferPassengersScreen` + the confirmed join requests.
      🛑 **First question for this step: the THIRD TAB.** The artboard's is "Mening buyurtmalarim" →
      accepted rides; the app's is `OffersList` (own e'lons) labelled *Buyurtmalarim*. Owner decides.
- [ ] **19.** Balance / income → `DriverBalans.dc.html` + `DriverDaromad.dc.html`.
      ⚠️ **No such screens exist in the driver app today** — these are new, and they touch T-087's
      ledger. Confirm scope with the owner before building; may belong in its own card.
- [ ] **20.** `ProfileScreen` + `EditProfileScreen` → `DriverProfil.dc.html`
- [ ] **21.** Vehicles + documents → `DriverMashinalar` / `DriverHujjatlar` / `DriverH1Pas` /
      `DriverH2Pr` / `DriverH3TexP` / `DriverH4Lit` → the five document screens
      (`DriverPassportScreen`, `DriverLicenseScreen`, `DriverTaxiLicenseScreen`,
      `DriverVehicleScreen`, `DriverPersonalInfoScreen`).
      ⚠️ **T-061 mounted a live validator on the passport step** — if a real driver starts being
      refused, that is the first suspect.
- [ ] **22.** Auth flow → `DriverR1` / `DriverR2otp` / `DriverR3fio` / `DriverR4Veh`;
      **driver raw-hex ceiling reaches 0.**

### Phase 4 — close

- [ ] **23.** Delete the token aliases left from step 1b; both ceilings are at their floor and the
      script enforces it.
      🔴 **MEASURED 2026-08-31 — THIS IS ~370 CALL SITES, NOT A CLEANUP.** Counted across both apps:
      `createTheme` **98** · `palette.background` **77** · `palette.success` **68** ·
      `palette.grey` **29** · `shadows.md` **24** · `palette.error` **15** · `palette.primary` **14** ·
      `palette.border` **18** · `palette.divider` **12** · `palette.secondary` **8** ·
      `palette.info` **8** · `shadows.sm/lg` **10** · `palette.warning` **4** · `text.hint` **1**.
      **Do this as its own card with its own plan** — it touches every screen in both apps and has
      no visual intent, so a regression here is silent. The aliases are correct today; they are
      debt, not a bug.
- [ ] **24.** `/arch` to sync `docs/ARCHITECTURE.md`; add the design-system section.
- [ ] **25.** Update `docs/CHECKLIST.md` with a per-screen visual walk.
- [ ] **26.** Owner rebuilds both apps and walks the checklist.

---

## Files to touch

**User app** (`user-app-standalone/`)
- `themes/index.ts` · `themes/palettes/light.ts` · **delete** `themes/palettes/dark.ts`
- `assets/fonts/` *(new)* · `App.tsx` (font loading)
- `layout/MainLayout.tsx` · `layout/ScreenLayout.tsx`
- `navigation/MainNavigator.tsx` · `navigation/types.ts`
- `components/` *(new)* `TopBar.tsx` · `BottomTabBar.tsx`; *(edit)* `Button.tsx` · `AppModal.tsx` ·
  `ModalList.tsx` · `ConfirmDialog.tsx` · `cards/RideCard.tsx` · `MenuButton.tsx` · `BackButton.tsx`
- all **15** `screens/*.tsx`, one per step
- `scripts/check-design-tokens.mjs` *(new)*

**Driver app** (`driver-app-standalone/`) — the same list, plus all **21** `screens/*.tsx`.

**Docs** — `docs/DESIGN-TOKENS.md` *(new)* · `TODO.md` · `PLAN.md` · `JOURNAL.md` ·
`ARCHITECTURE.md` · `CHECKLIST.md`.

**Not touched:** `api,admin,db/**` (no API change in this card), `htmlDesign/**` (read-only source
of truth — do not edit the owner's artboards).

---

## Risks / open questions

- ✅ **RESOLVED 2026-08-31 (owner delegated the call): the three supporting ink tiers were
  darkened in BOTH apps.** `secondary` #7C776D → **#66625A** (3.98 → 5.43:1) · `tertiary`
  #8A857A → **#716D64** (3.28 → 4.61:1) · `muted` #5C574E → **#5B5750** (unchanged in effect).
  🔴 **The "they pass AA-large" defence did not survive checking the artboards** — AA-large needs
  24px and the artboards use these at **9-12px**, 651 times. 🔴 **And the obvious fix was wrong:**
  pushing both to exactly 4.5:1 made them #736E65 / #726E65 — *identical tiers*, a meaning bug
  replacing a legibility one. Instead all three were re-spaced evenly to 6.42 / 5.43 / 4.61,
  keeping the artboards' exact hue and saturation. **Failures across both apps: 219 → 6, and all
  6 are verified-decorative** (wordmark, chevron glyph, two icons). → `DESIGN-TOKENS.md` §2.11.

- ✅ **RESOLVED 2026-08-30 — THE OWNER APPROVED BOTH NEW DEPENDENCIES (rule 4 satisfied):**
  **`expo-linear-gradient`** and **`react-native-svg`**, in **both** apps. The artboards need both:
  the top bar and service cards are `linear-gradient(180deg,#1D9846,#F4F2ED)`, and every icon is an
  inline SVG path, so icons can now use the artboards' exact paths rather than
  `@expo/vector-icons` approximations.
  🛑 **CONSEQUENCE — THE USER APP'S REBUILD IS NOW NATIVE TOO.** It was going to be a plain JS
  rebuild (T-077 · T-083 · T-084). Both are native modules, so **`npx expo prebuild` + a full
  `npm run android` is now required for the user app as well**, not just the driver app.
  **Nothing ships to a device until that runs — a JS-only reload will crash on the missing native
  module, and the failure looks like a bundling error, not a missing dependency.**
  ⚠️ Install them with **`npx expo install`**, not `npm install`, so the versions match Expo 54.
- 🔴 **Mid-conversion the apps look half-old, half-new.** Unavoidable with screen-by-screen
  conversion, and each step still runs. Do not ship a build to real users mid-phase.
- 🔴 **Step 5's modal trio changes every modal at once** in both apps.
- 🔴 **Step 3's tab bar changes navigation, not just pixels** — back-button behaviour on every
  wrapped screen.
- ⚠️ **No test suite in either RN app.** "Working" means the flow runs end-to-end on a device.
  The step-1c counter script is the only automated instrument this card adds; it checks **tokens,
  not correctness**. `tsc` + lint baselines are the other guard.
- ⚠️ **`htmlDesign/uploads/Chek_28082026/` holds 5 artboards the root lacks** and the root holds 4
  the uploads folder lacks. **Neither set is complete.** In scope from uploads: only `DriverOrder`.
- ⚠️ **Two competing main menus** (`UserMainMenu` vs `UserMenuNeW`) — step 6 blocks on the owner
  naming one.
- ⚠️ **Four near-identical `UserBuyurtma*` artboards** — step 8 blocks on merge-or-keep.
- ⚠️ **Steps 13 and 21 touch OTP and the document validators** (T-061 · T-063 · OR-003 SMS hash).
  Repaint only; do not change field names, autofill, or validation.
- ⚠️ **Step 19 (balance/income) has no existing screens** — genuinely new work hiding inside a
  redesign card. Flag to the owner rather than absorbing it silently.
- ⚠️ **`themes/` currently has 25 importers.** Changing key names in one commit breaks them all —
  hence the aliases in step 1b and their deletion in step 23.

---

## Session notes

### 2026-09-11 (3) — step 17 CLOSED, 17a-17i in one day; the rest is in `PLAN-T101-step17.md`

- **Owner accepted all seven recommendations; nine sub-steps followed**, each with a baseline run
  and a checker proven red: the pure rules (69 assertions), `PanelTabs` + `SortChips`, the card, the
  merged `PassengerOrdersScreen`, the detail-and-offer sheet, the result dialog, the routes (three
  names → one screen; pushes still land), `OffersListScreen` values-only, and the close-out.
- 🔴 **`SegmentedModes` (step 9) had drawn 24px pills instead of its measured 12 since 2026-09-03
  — in BOTH apps.** Fixed by copying one file. `UserMyOrder`'s strip changes shape as a result.
- 🔴 **Three baseline moves of my own were pulled back** (two `catch (error: any)`, one
  `ReadonlyArray<T>`), each found by the number. **Four artboard details were corrected rather
  than copied** (no route search, no reject, an accept that promised a phone, an English label).
- **Boarded:** T-109 (the four things `DriverQidiruv` asks for that the API cannot give). Five
  orphans on T-105. Step 18 rescoped to `DriverMyOrder` only, with the third-tab question first.
- **Next: a DEVICE WALK of the new screen, then the step 18 plan.**

### 2026-09-11 (2) — step 17 scoped and split; no code written

- **Measured before touching anything**, and the card was wrong three ways: the artboard merges
  `SearchPassengerOffers` + `MyJoinRequests` (incoming vs sent — step 9's shape), its detail is a
  sheet that absorbs `PassengerOfferDetails`' join form, and `OffersListScreen` has no artboard at
  all. `DriverOrder.dc.html` (step 18's) is an older copy of this board, so step 18 shrinks to
  `DriverMyOrder`.
- **Backend measured against the artboard:** join/accept/counter-offer all map onto ONE
  `joinPassengerOffer` call (one per-seat price, not per-row); seat cells are backed by
  `seat_counts`; **no driver-side reject, no presence, no rating model exists at all**, no route
  matching (the artboard has no search form).
- **Split to `docs/PLAN-T101-step17.md`** with 17a-17i and **seven owner decisions in its §3**,
  each with a recommendation. **No code yet (rule 3). Next: owner answers, then 17a.**

### 2026-09-11 — step 16 closed (16f + 16g); the rest of its story is in `PLAN-T101-step16.md`

- **16a-16e were done 2026-09-05 → 09-07 without a note here or a journal entry** — those
  sessions recorded themselves only in the step file. Caught up today in `JOURNAL.md`.
- **16f:** 74 dead style blocks deleted from the wizard (2 399 → 1 895 lines), the 3 live weights
  on `theme.font()`, `check-offer-i18n.mjs` new (70 keys × 3, proven red) — and it found
  `common.delete` missing from every locale. 🔴 **The shell halves backslashes in files it
  writes**: a measurement said 99/99 styles dead until grep disagreed. **Baselines all hold**
  (`tsc` 28 · lint 275 · tokens 3 · 7 checkers · `expo export`).
- **16g:** T-106 / T-107 / T-108 boarded; T-105 extended with the driver app's five orphans.
- ⚠️ **Admin `tsc` baseline corrected to 6 (via `tsc -b`)** — see the board-state header. The
  old 0 measured nothing.
- **Next: step 17 — plan first.**

### 2026-09-05 (2) — step 16 scoped and split; no code written

- **Measured before touching anything**, and found two things the card did not say:
  the artboard is **ONE scrolling form** against a **4-step wizard** (a restructure, not a
  repaint — the same wrong premise steps 9-12 each had), and **`handleSave` validates only the
  CURRENT step**, which the pagination is silently making safe. Collapsing the form without a
  `validateAll()` first would ship a submit that checks one section.
- **Owner chose** the artboard's single form, and backend-only content.
- **Split to `docs/PLAN-T101-step16.md`** with steps 16a-16g, 16a being the validation safety net.
  **No code yet** (rule 3). **Next: 16a.**

### 2026-09-05 (1) — step 15: the card named an orphan, and the artboard needs a backend

- **Step 15 done, in the only shape it could honestly take.** The card said
  `HomeScreen → DriverMenu.dc.html`; `HomeScreen` is an **orphan** and the Home tab renders
  `MenuScreen`. The screen's real content is **backend-blocked** (online/offline, shablon
  templates, per-car usage), so what shipped is the **drawer** (new, `NavDrawer.tsx` — the
  hamburger had opened the profile, the user app's step-11 defect in the other app),
  `MenuScreen`'s 6 font weights, and **two checkers** (`check-font-weights.mjs` ported with two
  gaps closed, `check-drawer.mjs` new). All baselines hold; nothing seen on a device yet.
- 🔴 **I mis-measured the font scope and said so in the plan.** A mis-quoted grep gave "6 files";
  the checker gave **235 occurrences in 30 files**. *The checker was right and my grep was not —
  which is the entire argument for having written it.*
- 🔴 **My drawer checker's first draft was the bug it exists to catch**: it grepped the
  `drawer: {` block, the regex stopped at the first nested `},`, and it reported **63 phantom
  missing keys**. Rewritten to bundle and evaluate the real modules. *Same lesson as step 14's
  i18n checker: an i18n check must EVALUATE, not grep.*
- ⚠️ **A stray `tmp/tr.mjs`** (an esbuild probe I wrote into the repo) put **5 lint errors** on a
  project whose baseline is 0. Deleted; the packaged checker writes to `node_modules/.cache/` and
  removes its own output. *Measure the baseline after your own scaffolding is gone.*
- 📋 **Port back to the user app** (recorded in step 15): the unquoted-numeral regex and the
  `sections/` + `utils/` directories, both missing from its `check-font-weights.mjs`.

### 2026-09-03 (6) — step 14: the trap had three spellings and I had only ever grepped one

- **Step 14 done.** 22 `fontWeight` literals converted across 11 live files, and
  **`scripts/check-font-weights.mjs`** written so the trap cannot recur — **proven able to fail in
  all three spellings.**
- 🔴 **Steps 10-13 converted 88 of these matching only `fontWeight: '700'`.** Step 14 found more in
  screens **already declared converted**: `fontWeight: "700"` (double quotes — 5, in step 8's and
  8c's files) and `fontWeight: 'bold'` (the keyword — 4, including 2 in `NotificationsScreen`,
  which step 11 had "finished"). *A hand-run grep is only as good as the spelling you think of;
  that is what makes it a checker's job, not a habit's.*
- 🔴 **The card's headline goal was already met, and stated wrongly.** "User raw-hex ceiling
  reaches 0" — the ceiling is **1**, and it is Facebook's brand blue, correctly exempt. **1 is the
  floor.** The card's own prose named a constant that no longer exists.
- 📋 **A third orphan: `HomeScreen.tsx`** — exported but never routed. With `RideCard` and
  `NetworkStatus` (zero importers), **T-105 now holds 3 screens + 3 components.** None deleted.
- ⚠️ **The driver app has 298 `fontWeight` occurrences** — expected (steps 15-22), but **copy the
  checker there when step 15 starts.**
- All six baselines unchanged; contrast 6/6 AA.

### 2026-09-03 (5) — step 13: the artboard asked for a 5-digit code and the server sends 4

- **Step 13 done, values only** (owner's call). **56+/43- across 2 659 lines**, and grepping the
  diff for every validator, field name and autofill prop returns **nothing but my own comments** —
  T-061/T-063 and OR-003 untouched by construction.
- 🔴 **`UserR2OTP` draws FIVE OTP cells; `config.otp.codeLength` defaults to FOUR.** Building the
  artboard would have broken verification outright. Found by checking the API, not the drawing.
- 🔴 **The artboard's custom `<div>` keypad would destroy SMS autofill** — a `View` grid cannot
  carry `autoComplete="sms-otp"`. Not built. **A regression no baseline could have seen.**
- ✅ **No structural change, and the artboard agrees**: the auth boards have no `TopBar` at all,
  and the screens already matched. *"Convert this screen" does not always mean the shared chrome.*
- **28 `fontWeight` → `font()`; 5 deprecated `grey[]` aliases retired by role** (5 fewer step-23
  call sites). All six baselines unchanged; contrast 5/5 AA.

### 2026-09-03 (4) — step 12: colours that encoded nothing, and a class swept instead of an instance

- **Step 12 done.** `ProfileScreen` **rebuilt** (439 lines) on the artboard's monochrome language;
  `EditProfileScreen` **converted values only** (1 511 lines — 31+/60-, no validation/save line in
  the diff). **The six coloured tint/dot pairs are deleted**, as the card predicted.
- 🔴 **And they were never carrying information:** `bell`/`help` rendered the *same* amber pair and
  `edit`/`card` the *same* blue tint — five colours for six rows, two duplicated. Counting them
  gave the card a second reason nobody had recorded.
- 🔴 **Four of the six menu rows go nowhere** and used to `console.log` on tap — indistinguishable
  from a broken app. Now dimmed with "Tez orada", like the drawer's.
- 🔴 **Swept for step 11's runtime-colour class instead of fixing one instance:** grepping both
  apps found `palette.info.light + '20'` in each `NetworkStatus.tsx`. **Both apps are now clean of
  a pattern the token ratchet cannot see.**
- **All six baselines unchanged; 12/12 contrast pairs pass AA; i18n sweep now 69 keys × 3 locales.**

### 2026-09-03 (3) — step 11: the hamburger had been wired to the wrong thing since step 3

- **Step 11 done.** Built `components/chrome/NavDrawer.tsx` — the app had **no drawer at all**,
  and `TopBar`'s hamburger opened the *profile* on the home screen (the same thing the avatar
  did) and navigated Home on the orders tab. Six of the ten entries have no screen and render
  **dimmed with a "Tez orada" marker**; entries are typed `ParamlessRoute`, so a route needing
  params **cannot compile** (proven).
- **`NotificationsScreen`**: header → `TopBar`, and **five raw colours the token ratchet could not
  see** — built as `colour + '20'` at runtime, so a literal-scanning checker read the screen as
  clean at 0. Replaced with measured ink/tint pairs. **T-072's icon-only mark-all got its words
  back**, because the artboard gives it a row of its own.
- **The i18n checker now sweeps three files (56 keys × 3 locales)** — and **its generalised regex
  had an unescaped dot** that would have matched `drawerXopen`. Found by testing the regex against
  a probe, not by trusting the green run.
- **All six baselines unchanged; 11/11 contrast pairs pass AA** (the drawer wordmark is the
  already-documented logotype exemption).

### 2026-09-03 (2) — step 10: the card named two screens the artboard does not specify

- **Step 10 done.** `OfferDriversScreen` **rebuilt** (487 lines, under the threshold) on the
  artboard's card language; `OfferDetailsScreen` **converted values only** (1 456 lines of
  booking maths — 47+/79- and no logic line in the diff). **34 `fontWeight` literals → `font()`**,
  the Android font trap. Four dead style blocks removed.
- 🔴 **The card's premise was wrong and measuring showed it:** the artboard's "detail state" is a
  read-only SHEET over the order list; `OfferDetails` is a *join form* reached from search, and
  `OfferDrivers` is bid selection. **Recorded rather than papered over.** The real sheet belongs
  over `MyOrdersScreen` and two of its three actions have no backend → its own card.
- **All six baselines unchanged; 17/17 contrast pairs pass AA on the rebuilt screen.**

### 2026-09-03 — step 9: two screens became one, and two contrast defects came with them

- **Step 9 done.** `MyBookingsScreen` + `MyPassengerOffersScreen` → one `MyOrdersScreen` on the
  artboard's three lifecycle modes. New: `utils/orderLifecycle.ts` (pure rules),
  `components/chrome/SegmentedModes.tsx` (both apps), `surfaceTrack` token (both palettes),
  a `myOrders` i18n block, and two checkers (18 lifecycle cases · 19 keys × 3 locales), **both
  proven able to fail**. The `MenuScreen` text-link workaround retired exactly as predicted.
  **All six baselines unchanged; all 20 contrast pairs on the screen pass AA.**

### 2026-08-30 — card opened, plan approved, step 1a started

- ✅ **PLAN APPROVED BY THE OWNER**, together with **both new dependencies**
  (`expo-linear-gradient` + `react-native-svg`). Rule 4 is satisfied for this card; no further
  dependency may be added without asking again.
- ✅ **Five owner decisions banked before any code:** dark mode dropped · user + driver only, no new
  roles · user app first · fonts as bundled `.ttf` (no new dep) · both native deps approved.
- 🔴 **Three findings came from measuring rather than reading, and one of them would have been
  expensive:** the design doc's claim that blue `#0049FF` is the Driver accent is contradicted by
  its own artboards (green `#05BB42` 224× vs blue 30× across the 14 driver files) — **building to
  the doc would have made the entire driver app the wrong colour.** Also: the tab bar is *new
  navigation*, not a repaint (`MainNavigator` is a pure native stack today), and
  `uploads/Chek_28082026/` is not the redundant folder its own docs call it — it holds 5 artboards
  the root lacks while the root holds 4 it lacks, so **neither set is complete**.
- 🔄 **Step 1a is RUNNING as a 16-agent workflow** (`ubexgo-design-tokens`, run
  `wf_77dd53ae-c9f`): 9 agents measuring artboard groups with `grep`-based counting, 4 synthesising
  per dimension (colour+contrast · typography · geometry · components), 2 adversarially checking the
  token set can reproduce `UserMainMenu` and `DriverElon`, 1 completeness critic.
  **Dropped-role artboards (usta / yuk / texnika) were excluded from extraction on purpose.**

---

## Resume point

> **Written 2026-09-11 after closing step 17, for a brand-new chat session.**
> Read this section, then `docs/JOURNAL.md`'s newest entry. Nothing else is required.

### 🟢 What is finished

**The COLOUR half of T-101 is complete in both apps** (1 803 raw literals removed; both ceilings
at their floor and enforced by `scripts/check-design-tokens.mjs`).

**The VISIBLE half: the USER APP is done (steps 6-14). The DRIVER APP is three screens in
(steps 15-17 of 15-22).** Screens rebuilt so far:

| step | screen | note |
|---|---|---|
| 6 / 6b | `MenuScreen` (home) | + active-trip banner and recent routes, from real data |
| 8 · 8b–8f | `CreatePassengerOfferScreen` | the whole order form, incl. the date/time sheet and its RULES |
| **9** | **`MyOrdersScreen`** | **the merged order list — replaces TWO screens** |
| **10** | **`OfferDriversScreen`** | **rebuilt**; `OfferDetailsScreen` converted (values only) |
| **11** | **`NavDrawer`** (new) + `NotificationsScreen` | the drawer never existed; the hamburger was wired wrong |
| **12** | **`ProfileScreen`** | **rebuilt**; `EditProfileScreen` converted (values only) |
| **13** | auth flow (3 screens) | **values only** — the artboard was deliberately not followed twice |
| **14** | `BlockedScreen` + live components | closes the strays — **but see the gap below** |

**Driver app:**

| step | screen | note |
|---|---|---|
| **15** | **`NavDrawer`** (new) + `MenuScreen` weights | the card named an ORPHAN; most of the artboard is backend-blocked |
| **16** | **`OfferWizardScreen`** — RESTRUCTURED | 4-step wizard → ONE form + 4 sheets; edit path restores 34/34 fields; 3 883 → 1 895 lines. Full story in `PLAN-T101-step16.md` |
| **17** | **`PassengerOrdersScreen`** (new) — a MERGE | `SearchPassengerOffers` + `MyJoinRequests` + the join half of `PassengerOfferDetails` → one list with two modes, a detail-and-offer sheet and a result dialog; `OffersListScreen` values-only; `SegmentedModes` fixed in BOTH apps. Full story in `PLAN-T101-step17.md` |

**Baselines, all six at their long-standing values:**
user `tsc` **6** · lint **216** · tokens **1** · driver `tsc` **28** · lint **275** · tokens **3**.
**Re-measured 2026-09-11 after step 17 — unchanged** (three moves of my own during the step were
pulled back, never rebaselined up). ⚠️ **Admin's `tsc` baseline is 6, measured with `tsc -b`** — the old
"admin 0" ran against a config with no files. ⚠️ Measure the driver app's lint only after
deleting any scratch file you wrote into it: a stray esbuild bundle in `driver-app-standalone/tmp/`
showed **5 errors** on a project whose baseline is **0**.
🔴 **Never rebaseline upward.** Three lint warnings appeared during step 9 (`catch (error: any)`
carried over from the old screens) and were **fixed**, not accommodated — `unknown` is safe there
because `isAuthError`/`getErrorMessage` both accept `any`.

**Checkers that must stay green** (all `node scripts/…`, no new dep):
**user app** — `check-design-tokens.mjs` · `check-font-weights.mjs` · `check-ride-time.mjs` (8) ·
`check-order-lifecycle.mjs` (18) · `check-i18n-myorders.mjs` (69 keys × 3 locales).
**driver app** — `check-design-tokens.mjs` · **`check-font-weights.mjs`** (new, step 15) ·
**`check-drawer.mjs`** (new, step 15: 10 routes + 21 keys × 3 locales) ·
**`check-offer-validation.mjs`** (16a) · **`check-offer-schedule.mjs`** (16c-2) ·
**`check-offer-restore.mjs`** (16e, 41 assertions) · **`check-offer-i18n.mjs`** (16f; sweeps 9
files, **182 keys × 3** after step 17) · **`check-passenger-orders.mjs`** (17a, **69 assertions,
red on 11 mutations**).
**Every one has been proven able to go red.**
🔴 **THE SHELL THIS SESSION WRITES FILES THROUGH HALVES BACKSLASHES** — heredocs AND inline node
strings alike: `\.` arrives as `.`, `\b` as a backspace. On 2026-09-11 that made a measurement report
99/99 style keys dead (grep said 29 live) and put the step-11 unescaped-dot bug into a checker as it
was written. **Write scripts with the editor tool, use backslash-free regexes (`[.]`, `[{]`,
`(?![A-Za-z0-9_])`), and read every new script back before trusting a green run.**
📋 **Port back to the user app's `check-font-weights.mjs`** the two gaps the driver copy closed:
the **unquoted** `fontWeight: 700` spelling, and scanning `sections/` + `utils/`.

### ▶️ Next actions, in the order they are worth doing

0. ✅ **STEP 17 IS CLOSED (2026-09-11, 17a-17i) — `docs/PLAN-T101-step17.md` has the whole story.**
   The driver's passenger-orders screen (`DriverQidiruv`) exists as `screens/PassengerOrdersScreen.tsx`
   — incoming and sent modes, the welded tabs and sort chips, the card, the detail-and-offer sheet
   (accept at the listed price · one per-seat counter-offer · cancel while pending · phone gated by
   T-054), the result dialog — reachable from the drawer, the home screen and pushes by the three
   OLD route names. `OffersListScreen` wears the shared chrome. `SegmentedModes`' radius defect is
   fixed in both apps. **What the API cannot give is boarded as T-109**; per-seat gender on the
   driver offer stays T-106. Five files are orphans on T-105.
   ▶️ **NEXT, IN THIS ORDER:**
   **(a) A DEVICE WALK OF THE NEW SCREEN — before anything else.** Drawer → "Kelgan buyurtmalar"
   (incoming) and "Mening buyurtmalarim" (sent); the route row, the tabs and chips; tap a card → the
   sheet; send an offer → the result dialog → the sent mode; accept → the confirm dialog; a push about
   a bid → the sheet by id; the keyboard over the offer field inside the modal; `OffersListScreen`'s
   create button under the bar; and `UserMyOrder`'s segments, which changed shape (12px, not pills).
   **(b) The step 18 plan** — rescoped by 17's measurement to **`DriverMyOrder` only** (Jarayonda /
   Faol / Tarix — the driver's accepted rides) against `OfferPassengersScreen` + the confirmed join
   requests. **Its first question is the THIRD TAB**: the artboard's is "Mening buyurtmalarim"
   (accepted rides → `DriverMyOrder`); the app's is `OffersList` (own e'lons) labelled
   *Buyurtmalarim*. Owner decides before code. Measure the artboard first — every step since 9 has
   been a restructure the card called a repaint.

0b. 🛑 **DECIDE WHAT `DriverMenu` IS WITHOUT A BACKEND.** Step 15 shipped the drawer and left the
   artboard's whole centre unbuilt — the **online/offline toggle**, the two **shablon** route
   templates, the **per-car usage** select and the aggregator/activity selects have **no columns,
   no endpoints, nothing**. That is most of the screen. It needs an owner decision and probably a
   migration; see "Blocked on backend". **Steps 16-22 will keep hitting this** — the driver
   artboards assume a richer model than the API has.

1. 🛑 **A DEVICE PASS. This is still the real gate, and it keeps growing** — nothing from steps 6b,
   8e, 8f, 9 or 10 has been seen on a device. **Step 10 adds two screens to walk:** the rebuilt
   `OfferDrivers` (accept/reject still work? the confirm dialog still names the rival count?) and
   `OfferDetails`, whose booking form was converted — **its seat/price maths must still be right**,
   which is the one thing a repaint should never have changed.
   **Step 11 adds the DRAWER, which is brand-new interaction surface**: open it from both screens,
   expand both groups, confirm the six dimmed entries do nothing, and check the notification
   panel's mark-all row.
   **Step 12 adds the profile tab** (its four dimmed rows, the drawer from its hamburger) and
   **`EditProfile`, whose form was converted — saving a profile must still work**.
   🛑 **Step 13 adds the AUTH FLOW, and it is the highest-value walk in the queue**: register with
   a real number and confirm **the SMS code still autofills with zero taps** (OR-003). Nothing in
   the diff touched an autofill prop, but only a real phone can prove it.
   ⚠️ **Step 14's 22 font conversions are invisible everywhere except a device** — a wrong weight
   renders as *nearly* right, so they can only be confirmed on real Android, beside a correct
   screen. **Step 9 is the biggest thing to walk**: it changes what the
   `Mening buyurtmalarim` TAB shows (both bookings and the passenger's own ride requests, in three
   modes) and removes the home screen's ride-requests text link. Check each mode holds the right
   rows, the count pills are right, and cancel / edit / rate still work from the merged card.
   🆕 **Step 15 opens the DRIVER app's walk, and its drawer is new interaction surface too**:
   open it from the hamburger (it used to open the profile — confirm it no longer does, and that
   the avatar still does), expand **E'lonlar**, **Buyurtmalar** and **Mening hujjatlarim**, confirm
   the **six dimmed entries do nothing**, and check that **Kelgan buyurtmalar** and **Mening
   buyurtmalarim** land on **different** screens. `MenuScreen`'s 6 font conversions need the same
   side-by-side check as step 14's.
2. 🔴 **THE USER APP HAS AN UNPLANNED SCREEN: `SearchOffersScreen`.** Found in step 14 — 1 937
   lines, 42 `fontWeight` literals, and **`UserQidiruv.dc.html` exists as its artboard** — but
   **no step in this plan covers it.** Step 17 is the DRIVER's search
   (`OffersListScreen` + `SearchPassengerOffersScreen` → `DriverQidiruv`), which is a different
   screen in a different app. *Two places in these notes said "SearchOffers → step 17"; both were
   wrong, and it is the same class of error the board-vs-prose warnings keep catching.*
   **It needs a step of its own — call it 14b — before the user app can be called done.**
   ⚠️ It is also **gated by T-102/T-103**: the four order scopes all behave identically and the
   offer card cannot match its artboard without per-seat gender, `hex_code` and `vehicle_class`.
   So the honest order is: **T-102/T-103 first, then 14b.**
3. **Step 15 — the DRIVER app** (`HomeScreen` → `DriverMenu.dc.html`). ⚠️ **Copy
   `check-font-weights.mjs` into the driver app first**: it has **298** `fontWeight` occurrences
   and the same three spellings will slip through a hand grep. Its chrome components (`TopBar`,
   `SegmentedModes`) already exist there; the wordmark takes `suffix="Driver"`, and that blue is
   the ONLY colour difference between the apps.
4. **T-105 (cleanup card) has grown** — see below.
5. **Step 23** (~370 call sites) as its own card. **T-102 / T-103** still gate the search screens.

### 📋 What step 9 handed to the cleanup card (T-105)

- **`screens/MyBookingsScreen.tsx` and `screens/MyPassengerOffersScreen.tsx` are ORPHANED**
  — nothing imports either (grep-verified). **Not deleted: rule 4.** ⚠️ **2 of the user app's 6
  baseline `tsc` errors live inside the orphan**, so deleting it *lowers* the baseline to 4.
- **The `MyPassengerOffers` ROUTE is kept as a redirect** to the merged screen, so no lingering
  caller or deep link is stranded. Delete it in the same pass.
- **`menu-items/index.ts` is stale English placeholder data with ZERO importers** (grep-verified,
  step 11) — `Home`/`Activity`/`Profile`, emoji icons, pointing at a route that does not exist.
  `NavDrawer` supersedes it.
- **`MenuButton.tsx`** — its whole reason for existing was that "the app has no drawer navigator".
  It now has one. **Counted, not guessed: 4 call sites, and 2 are the orphaned step-9 screens** —
  so it really has **2** (`ProfileScreen` → step 12, `SearchOffersScreen` → **14b, unplanned —
  see Next actions**). Both should
  take `TopBar`+`NavDrawer` instead, after which the component dies with the orphans.
- Already on the card from earlier steps: `GeoSelectModal` and `TimeWheelModal` have **zero call
  sites**; `DateWheelModal` is still used by `EditProfile`/`UserDetails` (**checked, not assumed**).

### 🔴 What step 14 established

- 🔴 **`fontWeight` HAS THREE SPELLINGS**: `'700'`, `"700"` and `'bold'`. Four steps of hand-greps
  matched only the first, and left defects in screens declared converted.
  **`node scripts/check-font-weights.mjs` now covers all of them — run it, don't grep.**
- **Exemptions must carry a reason and expire.** The checker exempts 7 files (orphans, and screens
  a later step rebuilds) and one LINE (a 300 hairline that `font()` would fold upward and render
  heavier). **Drop each entry when its reason dies** — a stale exemption hides a real defect, the
  same mechanism as the stale-baseline trap.
- 🔴 **A CARD'S STATED GOAL CAN ALREADY BE MET, OR BE WRONG.** Step 14's "ceiling reaches 0" was
  both: the tokenization was done in August, and 1 is the floor (Facebook's brand blue), not a
  debt. **Measure with `--report` before working toward a number in prose.**
- **Don't convert code a later step rebuilds.** `SearchOffers` (42 weights) is step 17's; the
  orphans are nobody's until T-105 deletes them.

### 🔴 What step 13 established

- 🔴 **CHECK THE BACKEND BEFORE BUILDING AN ARTBOARD'S INPUT.** `UserR2OTP` draws 5 OTP cells;
  the API generates 4 (`config.otp.codeLength`). The drawing cannot know the server's shape, and
  nothing in the app would have revealed the mismatch.
- 🔴 **A DESIGN CAN SPECIFY A CONTROL THAT REMOVES A FEATURE.** The artboard's custom `<div>`
  keypad would have silently killed OR-003's SMS autofill, because a `View` cannot carry
  `autoComplete="sms-otp"`. **Ask what a control does, not just what it looks like.**
- ✅ **Not every screen wants the shared chrome.** The auth boards have no `TopBar` — measured, not
  assumed. Steps 10-12 all swapped headers; step 13 correctly did not.
- **`grey[]` aliases can be retired opportunistically** — 5 went in step 13, all fills/borders with
  unambiguous role mappings. Step 23 shrinks every time a screen is converted properly.

### 🔴 What step 12 established

- **An unbuilt destination is DIMMED AND LABELLED — everywhere now**, not just in the drawer.
  `ProfileScreen`'s four dead rows used to `console.log` on tap. If a row cannot go anywhere, say
  so on the row.
- 🔴 **SWEEP FOR A CLASS, NOT AN INSTANCE.** Step 11 found five runtime-built colours in one
  screen; step 12 grepped `palette\.[a-zA-Z.]* *\+ *['"]` across BOTH apps and found the last
  two. **Both apps are clean of it now** — re-run that grep after any conversion.
- **Coloured decoration that duplicates itself is not a system.** Before preserving a per-row
  colour scheme, count the distinct pairs against the rows: `ProfileScreen` had five colours for
  six rows with two duplicated, which is why deleting them lost nothing.
- ⚠️ **Two screens import `SafeAreaView` from `react-native`** (`OfferDetailsScreen`,
  `EditProfileScreen`). A no-op on Android; harmless while `TopBar` is the only inset applier, but
  it is exactly what hides a double-inset. Move both when either is next rebuilt.

### 🔴 What step 11 established

- **`NavDrawer` is the hamburger's destination now.** Any screen mounting `TopBar` with
  `onMenuPress` should open it (`MenuScreen` and `MyOrdersScreen` do). ⚠️ **It is a `Modal`, not
  a navigator** — no new dependency, and insets are applied by hand because `Modal` renders
  outside the SafeAreaProvider.
- **Unbuilt destinations render DIMMED with a "soon" marker, never as dead taps.** Six of the
  drawer's ten entries have no screen. The artboard does the same with its unbuilt services.
- **Drawer entries are typed `ParamlessRoute`** — a route needing params does not compile. Reuse
  that type for any future menu.
- 🔴 **A TOKEN CEILING OF 0 MEANS "NO LITERALS", NOT "NO RAW COLOURS".**
  `NotificationsScreen` built five fills as `colour + '20'` at runtime and the ratchet read it as
  clean. **When converting a screen, grep for `+ '` and template literals near colours**, not
  just for `#`.
- 🔴 **`fontWeight` is still the most common unconverted defect** (see step 10) — but **do not
  convert it mechanically.** A weight below 500 (Manrope's bundled floor) folds UPWARD through
  `font()` and renders *heavier*. Step 11 left one `300` hairline alone for that reason.

### 🔴 What step 10 established

- **`TopBar` with `background="flat"` + `onBackPress` is the pattern for every PUSHED screen.**
  Used by `OfferDrivers` and `OfferDetails`; steps 11-22 should follow it rather than hand-rolling
  a header. **Any screen mounting `TopBar` under safe-area-context's `SafeAreaView` must pass
  `edges={['left','right','bottom']}`** or the top inset is applied twice.
- 🔴 **`fontWeight: 'n'` IS A BUG ON ANDROID, NOT A STYLE CHOICE.** RN does not synthesise weights
  there — the family NAME must carry it, so `fontWeight` alone selects no face and silently falls
  back to something that looks *nearly* right. **Use `...font('sans', n)`.** Step 10 converted 34
  of them in one screen; **other unconverted screens almost certainly still carry this**, so grep
  `fontWeight: '` before declaring a screen converted.
- ⚠️ **`OfferDetailsScreen` imports `SafeAreaView` from `react-native`, not safe-area-context** —
  a no-op on Android, which is precisely what hides double-inset bugs. Harmless today; move it
  when that screen is next touched.
- 📋 **The artboard's DETAIL SHEET is still unbuilt.** It belongs over `MyOrdersScreen`, and two of
  its three actions (alarm ping, in-app message) have no backend. Its own card once they exist.

### 🔴 What step 9 changed for the steps after it

- **`SegmentedModes` exists in both apps** — the mode strip with mono count pills.
  ⚠️ **It is NOT the `Qidiruv` boards' filter strip.** Both carry a count pill, but those are
  `radius 12px 12px 0 0` with `border-bottom:none` — TABS welded to the panel below. Measured side
  by side. **Step 17 must build that variant separately, not bend this component.**
- **`surfaceTrack` (`#E4E0D7`)** is in both palettes — the segmented-control groove.
- **The status-tone table in `MyOrdersScreen` is the corrected one.** Any screen showing an order
  status should read it from there rather than re-deriving: two of the pairs it inherited from the
  old screens were below AA.
- **`utils/orderLifecycle.ts` is where "which mode is this order in?" lives.** Step 10's screens
  answer the same question and must not grow a second copy of it.

### How to convert a screen (the pattern that works)

**Small screen (<500 lines): rebuild it. Large screen: convert the VALUES, touch no logic.**
⚠️ **STEP 9 IS THE EXCEPTION THAT PROVES THE RULE.** Both screens were ~1 000 lines and were
rewritten anyway — because the artboard *reorganised* them rather than restyling them. **When a
rewrite is unavoidable, enumerate the fixes being carried over** (step 9 lists eight by card number
in the new file's header): a rewrite is exactly where hard-won behaviour goes missing.

🔴 **MAP BY ROLE, NOT BY VALUE — `DESIGN-TOKENS.md` §2.10.** `color:` needs an **ink** token
(`*Ink`, `text.*`, `actionPressed`, `dangerText`); `backgroundColor:`/`borderColor:` take the
**fill**. `warnBorder`, `brand`, `danger`, `dangerBorder`, `text.chevron` and `text.disabled` are
**never** body text. *Step 9 found this violated twice in already-shipped code.*
🔴 **MEASURE CONTRAST FROM THE REAL PALETTE, NOT FROM HEXES YOU TYPE.** Two of step 9's own probes
used wrong values (`dangerTint` is `#FBE2DE`, not `#FDE7E1`) and would have "confirmed" a wrong
answer. Bundle the palette with esbuild and read the tokens.
🔴 **A COMMENT'S MEASUREMENT CAN BE WRONG.** `driver_found` carried "6.96:1" for a pair that really
measured **2.24:1** — the number was real, but for a different token than the code used.
🔴 **A CHECKER THAT CANNOT GO RED PROVES NOTHING.** Step 9's i18n checker passed while the very key
it guards was renamed, because its pattern only matched literal `t('…')` calls. **Always break the
thing on purpose once.**
🔴 **AFTER ANY FIND-AND-REPLACE, CHECK THE FILE IMPORTS `theme`.** ⚠️ Beware double-quoted strings.
⚠️ **Verify with the baselines every time, and never rebaseline upward.**

### Owner decisions already banked — do NOT re-ask

dark mode dropped (`palettes/dark.ts` **deleted** in both apps) · user + driver only, no new roles ·
`UserMenuNeW` is canonical · CTA uses `action` not `brand` · `expo-linear-gradient` +
`react-native-svg` approved · fonts bundled as `.ttf` · services AND scopes are both carousels ·
adm3 = `GeoSettlement` · "Yaqin" = a neighbours table · "Hoziroq" = a real field, and its exemption
from the 31-minute minimum is the RULE, not a loophole · splash screens redesigned light · the ink
ladder was darkened on delegated authority (`DESIGN-TOKENS.md` §2.11) · the stats row stays out
until the wallet exists (step 19) · the drag-strip time picker is deliberately chips instead ·
**step 9: full merge into one tab, and build only what has a backend.**

### Blocked on backend — these are NOT T-101's to fix

🛑 **T-102** — the four order scopes look right and **all behave identically**. `DriverOffer` has no
geo columns; search is `ILIKE` on free text. Don't present them as working.
🛑 **T-103** — "Hoziroq" on driver offers doesn't exist; it is a THIRD concept.
🛑 **The search offer card cannot match its artboard yet** — needs per-seat gender, `hex_code` and
`vehicle_class` on the offer response.
🛑 **Four `UserMyOrder` features have no API** — the tax receipt ("Chek", fiscal mark), the alarm
ping, the in-app message sheet, and the like/dislike+tags rating. Owner 2026-09-03: build only what
has a backend. **The stars-and-comment rating IS real and was built.**
⚠️ `arrive_from` is supported by the API but still never sent by the order form.

🛑 **`DriverMenu`'s CENTRAL MECHANIC HAS NO BACKEND — found in step 15, 2026-09-05.** The artboard
is built around a driver **online/offline** state: it gates "+Elon Yaratish" and both route
templates, drives the ISHNI BOSHLADIM / LINIYADAMASMAN banner, and colours the primary button.
**It exists nowhere** — not in `driver-app-standalone/api/driver.ts`, not on the API models.
Three more pieces of that screen are blocked with it:
  • **the two "Shablon" route templates** — saved from/to pairs that prefill the offer wizard.
    No storage, no endpoint; the artboard fakes them in `localStorage`.
  • **the per-vehicle "Qo'llanish sohasi" select** — the artboard reads a usage list off each
    saved CAR. The driver profile carries **one** vehicle and no usage field.
  • **"Taxi agrigator" / "Faoliyat"** — two selects with no column behind them.
*Per the owner's 2026-09-03 rule these were NOT built. The screen ships what has a backend: the
menu rows, the offer counts, and the new drawer.* → needs a card, and probably a migration.

### Traps recorded so they are not rediscovered

⚠️ **Manrope has no 900** — the artboards ask 113×, Google serves 800. Folding 900→800 *reproduces*
the design. Don't hunt for a Manrope Black.
⚠️ **`TopBar`'s gradient is NOT universal** — landing screens gradient, form screens flat. Any
screen mounting it under safe-area-context's `SafeAreaView` must pass
`edges={['left','right','bottom']}` or the top inset is applied twice.
⚠️ **`GeoPickerModal` already consolidated 7 copies in T-036** and has a multi-select `GeoSheet`
lacks. Leave it.
⚠️ **`menu-items/index.ts` is stale English placeholder data** pointing at a non-existent route.
⚠️ **`expired` and `archived` render identically** — pre-existing, and `completed` joined them in
step 9. All three are genuinely "over" and their LABELS differ, so they stay distinguishable.
⚠️ **Three tall driver modals** (`DriverLicense`, `DriverVehicle`, `PhoneRegistration`, all
`maxHeight: '70%'`) risk the nav-bar overlap fixed elsewhere. Step 21's screens.
⚠️ **React Native cannot draw the artboards' dashed route connector**
(`repeating-linear-gradient`); step 9 used a solid brand hairline as the nearest honest equivalent.

### Still unaudited

`docs/DESIGN-TOKENS.md` is **measured but never adversarially checked**. The **9 driver
document/registration artboards were never measured at all** (steps 21-22).
