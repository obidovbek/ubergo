# 🎯 PLAN — current task (one task at a time)

> **Rule for Claude:** `/new-task` rewrites this file. After finishing any step,
> mark it `[x]` IMMEDIATELY. Keep **Resume point** always true — a brand-new
> chat must be able to continue the work using ONLY this file.
>
> 📦 **T-088 (Paynet) IS NOT FINISHED — it moved to `docs/PLAN-T088.md` on 2026-08-30.** It is still
> in *Now*. Its one remaining Claude coding step is **`ChangePassword` persistence**; the rest is
> **T-100** (proxy layer) and Paynet's credentials. Resume it from that file.
> ✅ **T-092** → `PLAN-T092.md`. ✅ **T-091** → `PLAN-T091.md`. ✅ **T-087** → `PLAN-T087.md`.
> ✅ **T-081** → `PLAN-T081.md`. ✅ **T-078** → `PLAN-T078.md`. ✅ **T-077** → `PLAN-T077.md`.
> ✅ **T-065** → `PLAN-T065.md`. ✅ **T-066+T-067** → `PLAN-T066-T067.md`. ✅ **T-061** → `PLAN-T061.md`.
> 🔴 **T-047 PARKED.** 🛑 **T-031 — item 1 CLOSED by the owner, do NOT reopen** → `PLAN-T031.md`.
> ⏸️ **T-040 · T-039 · T-037 · T-033 · T-030 · T-027 · T-018 · T-026A · T-025** → their own files.

## 🔴 BOARD STATE 2026-08-31 — read before starting anything

**`tsc` BASELINES: API 281 · admin 0 · user 6 · driver 28.** All four lint at **0 errors**.
🟢 **LINT WARNING BASELINES, RE-MEASURED 2026-08-31: user 216 · driver 280.**
Both are *below* where this card started (user 225 → 218 → **216**, driver 304 → 289 → **280**);
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
- [ ] **9.** `MyBookingsScreen` + `MyPassengerOffersScreen` → `UserMyOrder.dc.html`
- [ ] **10.** `OfferDetailsScreen` + `OfferDriversScreen` → `UserMyOrder.dc.html` detail states
      🟡 **2026-08-31 — `OfferDriversScreen` IS TOKENIZED (41 → 0), NOT REBUILT.** Its colours now
      come from `themes/`; its layout is untouched and does not match the artboard yet.
- [ ] **11.** `MenuScreen` + `NotificationsScreen` → drawer + bell panel in the artboards
- [ ] **12.** `ProfileScreen` + `EditProfileScreen` → profile sheet in `UserMainMenu.dc.html`
      🟡 **2026-08-31 — BOTH TOKENIZED (43 + 49 → 0), NEITHER REBUILT.** Layouts untouched.
      🔴 **AND THE ARTBOARD DELETES SOMETHING THE CODE STILL HAS.** `ProfileScreen` paints a
      different coloured tint/dot pair per menu row (amber, blue, indigo, pink, grey);
      `UserMainMenu.dc.html` has **no coloured icon circles at all** — its menu is monochrome ink
      with green accents. Verified by counting the artboard's own literals. The pairs were mapped
      to the nearest tokens to clear the ratchet; **this step should DELETE them**, which is a
      layout change and so was left for the rebuild rather than smuggled into a repaint.
- [ ] **13.** Auth flow: `PhoneRegistrationScreen` → `UserR1`, `OTPVerificationScreen` → `UserR2OTP`,
      `UserDetailsScreen` → `UserR3Fio`. ⚠️ **Touching OTP risks the T-061/T-063 validators and the
      OR-003 SMS-Retriever hash — do not change field names or autofill behaviour.**
      🟡 **2026-08-31 — `UserDetailsScreen` IS TOKENIZED (47 → 0), NOT REBUILT.** Colours only;
      no field name, validator or autofill behaviour was touched.
- [ ] **14.** `BlockedScreen` + remaining strays; **user raw-hex ceiling reaches 0.**
      🟢 **2026-08-31 — 111 → 15.** `Notifications` 35 · `Blocked` 19 · auth pair 19 · the
      `shadowColor: '#000'` strays the earlier screens left · `themed-text` · `RideCard` ·
      `BackButton` · `MenuButton`. All tokenized, `tsc` 6, lint 217.
      ✅ **`shadowColor: '#000'` → `text.primary`, and that is not a repaint but a CORRECTION:**
      `themes/index.ts`'s own `shadow()` helper already casts `#16130E`, so the loose call sites
      were casting a *different* shadow from the tokens beside them. They now agree.
      🔵 **`#1877F2` IS EXEMPT ON PURPOSE — it is Facebook's brand blue** on the Facebook login
      button, and Meta's guidelines require it exactly. Named `FACEBOOK_BRAND_BLUE` rather than
      tokenized, so it reads as a third-party constant instead of a missed conversion.
      ✅ **`BlockedScreen`'s three states (blocked/pending-delete/suspended) fold onto TWO palette
      families** — safe only because each state also carries its own emoji (🚫/⏳/⚠️) and its own
      translated title, so colour is not the sole signal. Checked before collapsing them.
      ✅ **SPLASH REDESIGNED LIGHT — owner decided 2026-08-31.** Was dark navy `#0a1929`. Now on
      `ground` with `successTint` bloom circles, a `surface` logo disc and `theme.shadows.raised`.
      **Every animation and the T-050 wordmark fix were preserved** — only colour and depth moved.
      🔴 **AND MEASURING IT CAUGHT THREE CONTRAST FAILURES THE MAPPING WOULD HAVE SHIPPED:**
      the 36px wordmark in `brand` was **2.56:1** (the exact failure `light.ts` warns about — it is
      the logo green, not a text green) → `action` **5.29:1**; the 18px tagline in `text.secondary`
      **3.98:1** and the 14px loading label in `text.tertiary` **3.28:1** — *18px regular is not
      "large text"*, which needs 24px — both → `text.muted` **6.41:1**. All four elements now pass.
      🛑 **THE DRIVER APP HAS THE SAME DARK SPLASH** (`#0d1b2a`, teal instead of blue) and it is
      still dark. It sits inside the driver's 951 and gets the same treatment in phase 3 — *this is
      exactly the twin the `fix-the-class-not-the-instance` memory is about.*
      ✅ **`themes/palettes/dark.ts` DELETED in both apps (owner approved 2026-08-31)**, along with
      the now-unused `darkPalette` alias in both `themes/index.ts`. Nothing imported either.
      **Goal 4 is now genuinely met** — dark mode is gone, not just unreachable.

### Phase 3 — driver app pages, one screen per step

- [ ] **15.** `HomeScreen` → `DriverMenu.dc.html`
- [ ] **16.** `OfferWizardScreen` → `DriverElon.dc.html`
      🛑 **The single biggest artboard (~128 KB, the design doc calls it ~1800 lines) and the app's
      most complex screen.** Expect this to be several sessions; split it into its own plan file if
      it does not fit one step.
- [ ] **17.** `OffersListScreen` + `SearchPassengerOffersScreen` → `DriverQidiruv.dc.html`
- [ ] **18.** `MyJoinRequestsScreen` + `OfferPassengersScreen` + `PassengerOfferDetailsScreen`
      → `DriverMyOrder.dc.html` + `DriverOrder.dc.html` *(the latter lives ONLY in
      `uploads/Chek_28082026/`)*
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

> **Written 2026-08-31 at end of day, for a brand-new chat session.**
> **Everything is committed through `c005785` except this file, `TODO.md` and `JOURNAL.md`.**
> Read this section, then `docs/JOURNAL.md`'s 2026-08-31 entry. Nothing else is required.

### 🟢 What is finished

**The COLOUR half of T-101 is complete in both apps. 1 803 raw literals removed.**
Every screen in both apps now reads its colours from `themes/`.

| | `tsc` | lint (0 errors) | raw colours |
|---|---|---|---|
| user | **6** | **216** | **1** (from 839) |
| driver | **28** | **280** | **3** (from 964) |

**The 4 remaining literals are deliberate and must NOT be "fixed":**
`FACEBOOK_BRAND_BLUE` (Meta requires it verbatim) · `PLAY_STORE_BLACK` + `APP_STORE_BLUE`
(store-badge guidelines) · `VEHICLE_SWATCH_FALLBACK` (a car's paint colour, overridden at runtime
by `hex_code` from the DB). Both ceilings sit at the floor and `check-design-tokens.mjs` holds them
there; it was re-proven able to go red at every ceiling.

### 🛑 What is NOT finished — read before claiming T-101 is done

1. **TOKENIZED IS NOT REBUILT.** Colours come from `themes/`; **the layouts are still the pre-T-101
   layouts** and almost no screen matches its artboard. Steps 8-22 each carry a note saying exactly
   what was and was not done. *The owner had to catch this from a screenshot on 2026-08-30 — do not
   let the colour count imply more than it means.*
2. **ALMOST NOTHING HAS RUN ON A DEVICE.** The largest unverified surface is the **ink-ladder
   change**, which altered supporting text on *every screen in both apps*, and the **two splash
   screens**, which changed structurally rather than just in colour.
   Also still unwalked from 2026-08-30: `SearchPassengerOffers`, whose three location buttons per
   direction became **one** — an interaction change, not a repaint.
3. **Step 23 is ~370 call sites** and wants its own card (sized in the step itself).
4. **T-102 and T-103 are open** and gate the search screens actually looking right.

### ▶️ Next actions, in the order they are worth doing

1. 🛑 **A device pass over both apps. This is the real gate** — see (2) above for where to look.
   **Step 8 added three things to walk:** the FLAT top bar on the order screen, the back arrow on
   a pushed screen, and the safe-area fix (the header must not sit a status-bar too low).
2. **The artboard rebuild** — the visible half of T-101. **Step 8 done 2026-09-01, the first one.**
3. **Step 23** as its own card.
4. **T-102 / T-103.**

### 🔴 What step 8 changed for the steps after it

- **`TopBar` now takes `background="gradient" | "flat"` and `onBackPress`.** The gradient is NOT
  universal — measured, `UserMenuNeW`/`UserMyOrder` have it, `UserBuyurtma`/`UserQidiruv` do not.
  **Step 17 (`DriverQidiruv`) must pass `flat`.** Every pushed screen wants `onBackPress`.
- **Any screen mounting `TopBar` under *safe-area-context*'s `SafeAreaView` must pass
  `edges={['left','right','bottom']}`** or the top inset is applied twice. React Native's own
  `SafeAreaView` (what `MenuScreen` uses) is a no-op on Android and hides this.
- **`ORDER_SCOPES` lives in `user-app-standalone/types/orderScope.ts`**, not in `MenuScreen`.
- **`Chip` is proven in real use now** — payment (accent) and car class (`dark`).

### How to convert a screen (the pattern that works)

**Small screen (<500 lines): rebuild it. Large screen: convert the VALUES, touch no logic.**
`SearchOffers` was 1 937 lines of working search — rewriting it would have risked real features for
a repaint. The proof it stayed safe: `git diff` showed **125 insertions / 124 deletions**, every
changed line a colour, the extra one the import.

🔴 **MAP BY ROLE, NOT BY VALUE — `DESIGN-TOKENS.md` §2.10.** The same literal maps differently
depending on the CSS property: `color:` needs an **ink** token (`*Ink`, `text.*`, `actionPressed`,
`dangerText`), while `backgroundColor:`/`borderColor:` take the **fill** token. Ignoring this
shipped text at **1.65:1**. `warnBorder`, `brand`, `dangerBorder`, `text.chevron` and
`text.disabled` are **never** body text.
🔴 **AFTER ANY FIND-AND-REPLACE, CHECK THE FILE IMPORTS `theme`.** This bit four times across two
days. Find-and-replace produces code that *looks* right; only the baseline notices.
🔴 **BEWARE DOUBLE-QUOTED STRINGS.** A naive replace turns `backgroundColor: "#FFF"` into JSX
braces inside a StyleSheet object — `tsc` went 6 → 34 that way.
⚠️ **Map from an EXPLICIT table (§2.9), never by hue**, and report what you cannot map rather than
guessing. Every accessibility failure this card found was found this way — including two where the
obvious fix would have made different states render identically.
⚠️ **Verify with the three baselines every time** (`tsc`, lint, the token script) and **never
rebaseline upward** to accommodate a change.

### Owner decisions already banked — do NOT re-ask

dark mode dropped (and `palettes/dark.ts` **deleted** in both apps) · user + driver only, no new
roles · `UserMenuNeW` is canonical · CTA uses `action` not `brand` · `expo-linear-gradient` +
`react-native-svg` approved · fonts bundled as `.ttf`, no dependency · **services AND scopes are
both carousels**, unbuilt services dimmed · adm3 = `GeoSettlement` · "Yaqin" = a neighbours table ·
"Hoziroq" = a real field · **splash screens redesigned light** (no artboard defines one) ·
**the ink ladder was darkened on delegated authority** — reasoning in `DESIGN-TOKENS.md` §2.11 so
it can be reversed on sight.

### Blocked on backend — these are NOT T-101's to fix

🛑 **T-102** — the four order scopes look right and **all behave identically**. `DriverOffer` has no
geo columns; search is `ILIKE` on free text. Don't present them as working.
🛑 **T-103** — "Hoziroq" on driver offers doesn't exist. It is a THIRD concept, distinct from
passenger `is_urgent` and driver `departs_when_full`.
🛑 **The search offer card cannot match its artboard yet** — needs per-seat gender, `hex_code` on
the offer response, and `vehicle_class`.

### Traps recorded so they are not rediscovered

⚠️ **Manrope has no 900** — the artboards ask for it 113×, Google Fonts serves 800. Folding 900→800
*reproduces* the design. Don't hunt for a Manrope Black.
🔴 ~~**`LocationCard` is NOT a `GeoSheet` candidate**~~ — **OBSOLETE 2026-09-01 (step 8c).** The
branch it could not express was the **mahalla**, and the owner removed that on the design's own
logic. `LocationCard` now uses `GeoSheet` like every other geo control; the landmark stays on the
row as free text and the country is skipped with `startLevel="province"` (OR-004).
*A "not a candidate" note is only true until the reason behind it is retired — re-read the reason,
not the verdict.*
⚠️ **`GeoPickerModal` already consolidated 7 copies in T-036** and has a multi-select `GeoSheet`
lacks. Leave it.
⚠️ **`menu-items/index.ts` is stale English placeholder data** pointing at a non-existent `Activity`
route. Untouched; worth its own card.
⚠️ **`expired` and `archived` statuses render identically** in `MyPassengerOffers` — pre-existing,
possibly deliberate, left alone.
⚠️ **Three tall driver modals** (`DriverLicense`, `DriverVehicle`, `PhoneRegistration`, all
`maxHeight: '70%'`) are at risk of the nav-bar overlap fixed elsewhere. Step 21's screens.

### Still unaudited

`docs/DESIGN-TOKENS.md` is **measured but never adversarially checked** — the spend limit killed all
three checkers. The **9 driver document/registration artboards were never measured at all** (steps
21-22 will hit this).
