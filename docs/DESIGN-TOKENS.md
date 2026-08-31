# 🎨 DESIGN-TOKENS.md — the UbexGo design system, measured from the artboards

> **Status: DRAFT for owner review. T-101 step 1a.** Written 2026-08-30 from `htmlDesign/`.
> **No TypeScript has been written yet** — step 1a's exit condition is that the owner reads this first.
>
> **This file is the single reference for both apps' rebuild.** When it and
> `htmlDesign/docs/00-UMUMIY-loyiha.md` disagree, **this file wins** — it was produced by counting
> the artboards, that one was written by hand and is wrong in at least one important place (§1).

## How this was produced, and what that is worth

Nine agents read the artboards in parallel and counted values with `grep`; eight returned.
Their raw inventory: **615 colour observations · 208 type styles · 138 radii · 215 spacing values ·
191 control sizes · 92 shadows · 17 gradients · 266 component specs · 181 flagged surprises.**
Every headline number below was then **re-verified directly against the source files** by hand.

🔴 **WHAT IS MISSING, STATED PLAINLY.** The run hit the account spend limit half-way. Lost:
- **the `driver-docs` measurer** — `DriverHujjatlar`, `DriverH1Pas`, `DriverH2Pr`, `DriverH3TexP`,
  `DriverH4Lit`, `DriverR1`, `DriverR2otp`, `DriverR3fio`, `DriverR4Veh` were **never measured**.
  Those are plan steps 21–22, so nothing near-term depends on them — but **this token set has not
  been tested against the driver document/registration screens.** Expect gaps there.
- **all three adversarial checkers** — the two "rebuild the hardest screen from these tokens and
  report what you cannot express" passes, and the completeness critic.
  **So no independent party has tried to falsify this document.** Treat it as measured but unaudited.

---

## 1. 🔴 The driver accent — the design doc is wrong, and here is what is actually true

`htmlDesign/docs/00-UMUMIY-loyiha.md` says: *"ko'k `#0049FF` (Driver)"* — blue is the Driver colour.
**Building to that sentence would have made the entire driver app the wrong colour.**

Measured across the 18 in-scope driver artboards:

| family | count | | family | count |
|---|---:|---|---|---:|
| `#05BB42` green | **243** | | `#0049FF` blue | **31** |
| `#1F7A55` green | **112** | | `#1F5FA8` blue | **15** |
| `#155C40` green | **43** | | `#2D6CDF` blue | **5** |
| **green total** | **398** | | **blue total** | **51** |

**But the doc was pointing at something real.** The blue is the app's **sub-brand word**:

```
UbexGo   Driver
#05BB42  #0049FF     ← two spans, 21px/900 and 24px/900, letter-spacing -.02em
```

**All 18 driver artboards carry it. Zero use a green "Driver". The 13 user artboards have no second
word at all.** So:

- ✅ **The accent is GREEN in both apps.** There is no blue driver theme.
- ✅ **`#0049FF` is exactly one token — `brandSuffix`** — used only for the word "Driver" in the
  header and drawer of the driver app.
- ⚠️ The other two blues are unrelated to branding: **`#1F5FA8` = the male gender marker** on seat
  maps, **`#2D6CDF` = in-range time blocks** on the 15-minute grid. Both are semantic, not brand.

> *I got this wrong once mid-analysis — an over-narrow `grep` returned "all driver wordmarks are
> blue", which was an artefact of the pattern, not the data. The corrected reading is above.*

---

## 2. Colour

255 distinct values were observed. That collapses to the set below; everything omitted is either an
opacity variant of a token here, or appears in a single artboard (listed in §8).

### 2.1 Ground and surface

| token | value | role | uses |
|---|---|---|---:|
| `ground` | `#F4F2ED` | screen background, drawer, bottom sheets, inset wells | 332 |
| `surface` | `#FFFFFF` | every card, popover, chip-off state, control tile | 655 |
| `surfaceInput` | `#FDFCFA` | **input fields only** — textareas and text fields sit on this, *not* on `surface` | 52 |
| `surfaceSunken` | `#EDEAE3` | progress track, scroll arrows, "completed" pill | 18 |
| `canvas` | `#E8E4DB` | ❌ **NOT a screen colour** — the desk behind the phone frame. Do not port. | 18 |

### 2.2 Text

| token | value | role | uses |
|---|---|---|---:|
| `textPrimary` | `#16130E` | body and headings; also the avatar/inverted-card fill | 814 |
| `textSecondary` | `#7C776D` | supporting copy, phone numbers, notes | 188 |
| `textTertiary` | `#8A857A` | **inactive tab**, eyebrow labels, timestamps, meta | 306 |
| `textMuted` | `#5C574E` | list titles, key–value labels, inactive segment | 87 |
| `textOnDark` | `#F4F2ED` | text on `textPrimary` fills (avatar initials, toast) | — |
| `chevron` | `#B6B1A5` | disclosure `›` glyphs — decorative only | 20 |

### 2.3 Brand and action — **these are three different jobs, do not merge them**

| token | value | role | uses |
|---|---|---|---:|
| `brand` | `#05BB42` | **the wordmark, and selection borders/tints.** Bright, low contrast. | 266 |
| `brandSuffix` | `#0049FF` | the word "Driver" — **driver app only** | 31 |
| `action` | `#1F7A55` | **the interactive green: active tab, selected chip fill, confirm buttons, links** | 213 |
| `actionPressed` | `#155C40` | `a:hover`, price figures, icon glyphs, selected-row text | 83 |
| `headerGradientTop` | `#1D9846` | **only** as the top of the header gradient | — |

🔴 **`brand` and `action` are NOT interchangeable, and this is the most likely thing to get wrong.**
`#05BB42` is the *logo* green; `#1F7A55` is the *button* green. They fail differently on contrast
(§5). The one place the artboards use `#05BB42` as a button fill — the `UserMenuNeW` CTA — is
**exactly the accessibility failure flagged in §5.**

### 2.4 Status

| token | value | role |
|---|---|---|
| `danger` | `#C0431B` | **badge fill** (bell + tab counts), warnings |
| `dangerText` | `#B03A2E` | "Chiqish" / destructive labels, unset-value text |
| `dangerDeep` | `#8E2E1E` | cancelled-state foreground |
| `dangerTint` | `#FBE2DE` | cancelled pill background |
| `dangerBorder` | `#D9705E` | cancelled pill border |
| `successTint` | `#DCF6E4` | selected list row, "free seats" badge |
| `successTintSoft` | `#F2FBF5` | unread notification row |
| `warnInk` | `#7A5B10` | urgent tag text, "awaiting offer" |
| `warnBorder` | `#E8B84B` | urgent tag border |
| `warnTint` | `#FFF1D6` | urgent tag fill |
| `disabled` | `#D8D4C9` | disabled submit surface, read dot |
| `disabledInk` | `#C9C4B8` | disabled stepper glyph |

### 2.5 Semantic non-brand accents

| token | value | role |
|---|---|---|
| `male` | `#1F5FA8` | male seat marker, gender modal |
| `female` | `#C43D7A` | female seat marker |
| `timeInRange` | `#2D6CDF` | selected 15-minute blocks |
| `paid` | `#5B2E9D` | the paid "Maxsus buyurtma" flow — entry, CTA, total |

### 2.6 Borders and scrims — an opacity ramp on `#16130E`

The artboards never use a solid border colour; **every hairline is `rgba(22,19,14,α)`**:

| token | α | job | uses |
|---|---|---|---:|
| `border.chrome` | `.07` | top-bar bottom, tab-bar top, card hairline | 194 |
| `border.default` | `.08` | the workhorse — buttons, popovers, drawer edge | 201 |
| `border.control` | `.09` | resting border of interactive cards and inputs | 24 |
| `border.strong` | `.12` | drawer separators, flag swatches | 155 |
| `border.emphasis` | `.14`–`.16` | unselected pills, sheet grabber | 52 |
| `scrim.light` | `.28` | notification + profile popovers | 73 |
| `scrim.drawer` | `.32` | drawer, country picker | 19 |
| `scrim.sheet` | `.42` | bottom sheets (**plus `backdrop-filter: blur(2px)`**) | — |
| `scrim.modal` | `.5` | centred modals | 43 |

⚠️ **React Native has no `backdrop-filter`.** The sheet scrim's blur cannot be reproduced without
`@react-native-community/blur` (**a third dependency — not approved**). Recommendation: ship the
plain `.42` scrim, which is what the blur mostly reads as anyway.


### 2.9 The migration table — old literal → token

The screens are not being designed from scratch; they are being lifted off ~154 raw Tailwind
defaults. This table is **derived from the conversions already shipped** (`MenuScreen`,
`SearchOffers`, `OfferDetails`, `MyBookings`, `MyPassengerOffers`) by pairing each removed literal
with the token that replaced it — it is the mapping in the code, not one invented afterwards.

**Use it explicitly. Never map by hue** — that is how `driver_found` and the rating label came to
fail contrast, and how two different statuses nearly rendered identically.

| Old literal | Token | Role |
|---|---|---|
| `#FFFFFF` | `surface` | cards, sheets, control tiles |
| `#F9FAFB` `#F8FAFC` `#FAFAFA` | `ground` | screen background |
| `#F3F4F6` `#F0F0F0` | `surfaceSunken` | tracks, wells, completed pills |
| `#111827` `#333` | `text.primary` | headings, body |
| `#374151` `#4B5563` | `text.muted` | list titles, key-value labels |
| `#6B7280` `#666` | `text.secondary` | supporting copy |
| `#9CA3AF` | `text.tertiary` | meta, timestamps, placeholders |
| `#D1D5DB` `#E0E0E0` | `text.disabled` | empty-state glyphs, inactive icons |
| `#E5E7EB` | `borders.strong` | separators, hairlines |
| `#10B981` `#4CAF50` | `action` | buttons, active state, links |
| `#059669` `#047857` `#166534` | `actionPressed` | pressed, price figures |
| `#22C55E` | `brand` | wordmark, selection tint |
| `#F0FDF4` `#D1FAE5` `#ECFDF5` `#DCFCE7` | `successTint` | selected row, free-seat badge |
| `#EF4444` | `danger` | destructive fill, badges |
| `#B91C1C` `#DC2626` | `dangerText` | destructive labels |
| `#FEE2E2` `#FEF2F2` | `dangerTint` | destructive surfaces |
| `#F59E0B` `#FDE68A` `#FFE082` | `warnBorder` | stars, urgent borders |
| `#FEF3C7` `#FFF9E6` | `warnTint` | urgent surfaces |
| `#D97706` `#92400E` `#B45309` | `warnInk` | urgent text |
| `#3B82F6` `#2563EB` `#1E40AF` `#4A90E2` | `male` | male marker, informational accent |
| `#DBEAFE` `#EFF6FF` `#E0E7FF` | `blueTint` | informational surfaces |
| `#EC4899` `#BE185D` `#F9A8D4` | `female` | female marker |
| `#FCE7F3` | `femaleTint` | female seat fill |
| `#1D4ED8` | `male` | male marker |
| `#DBEAFE` | `maleTint` | male seat fill |
| `#1E3A8A` | `maleInk` | ink on a male/informational tint |
| `#BFDBFE` `#C7D2FE` | `blueTintSoft` | sheet "cancel" control fill |
| `#93C5FD` | `blueBorder` | its border |
| `#86EFAC` `#A7F3D0` | `brand` | neutral seat border (fill is `successTint`) |
| `#CA8A04` | `warnBorder` | urgent border |
| `#FEF08A` | `warnTint` | urgent fill |
| `rgba(0,0,0,0.5)` | `scrim.modal` | modal backdrop |
| `rgba(0,0,0,0.3)` | `scrim.light` | popover backdrop |
| `#000` (shadowColor) | `text.primary` | shadows — the ink, not pure black |

### 2.10 🔴 FILL TOKENS ARE NOT INK TOKENS — the defect this card kept producing

A colour that is correct as a **background or border** is usually wrong as **text**, and the
mapping table cannot tell the difference: it maps a *value*, not a *role*. Found 2026-08-31 in
both apps, after it had already shipped through several "converted" screens:

| Rendered as text | Measured | Correct token |
|---|---|---|
| `warnBorder` on ground (driver status "pending") | **1.65:1** | `warnInk` 5.63:1 |
| `warnBorder` on surface (stop badges ×4) | **1.84:1** | `warnInk` 6.28:1 |
| `warnBorder` on `dangerTint` (user OTP attempts left) | **1.50:1** | `warnInk` 5.11:1 |
| `warnBorder` on surface (user rating label, 18px) | **1.84:1** | `warnInk` 6.30:1 |

⚠️ **The rating label was "fixed" on 2026-08-30 and came out WORSE** — 2.85:1 became 1.84:1,
because the fix moved it off one fill token onto another. *A contrast fix that is not measured
after the change is not a fix.*

**The rule:** before mapping a literal, ask what the property is. `color:` and `textShadowColor:`
need an ink token (`*Ink`, `text.*`, `actionPressed`); `backgroundColor:` and `borderColor:` take
the fill/border tokens. `warnBorder`, `brand`, `dangerBorder`, `text.chevron` and `text.disabled`
are **never** body text.

### 2.11 ✅ RESOLVED 2026-08-31 — the three supporting ink tiers were darkened

**As drawn, `secondary` (#7C776D, 3.98:1) and `tertiary` (#8A857A, 3.28:1) failed WCAG AA for
normal text**, and are used that way ~200× across both apps.

🔴 **The "they pass AA-large" defence does not survive checking the artboards.** AA-large needs
24px (or 18.5px bold). The artboards use these two colours at **9-12px** — 651 uses, essentially
all small labels. So the exemption never applied.

🔴 **And the obvious fix was wrong.** Pushing both to exactly 4.5:1 produced #736E65 and #726E65 —
**two tiers rendering identically**, replacing a legibility bug with a meaning bug.

**What shipped instead:** all three supporting tiers re-spaced evenly between 4.5:1 and muted's
6.41:1, preserving the artboards' exact hue (41.3°) and saturation (0.064):

| Token | Was | Now | On ground | On surface |
|---|---|---|---|---|
| `text.muted` | `#5C574E` | `#5B5750` | 6.42:1 | 7.18:1 |
| `text.secondary` | `#7C776D` | `#66625A` | **5.43:1** | 6.07:1 |
| `text.tertiary` | `#8A857A` | `#716D64` | **4.61:1** | 5.16:1 |

Every tier is legible at small sizes and a visible step from its neighbour. The warm-grey
character is unchanged — only lightness moved.

**Two consequential follow-ons, both found by re-auditing afterwards:**
- `selectPlaceholder` in three driver document screens used `text.disabled` (**1.55:1**) for
  placeholder text. Every `placeholderTextColor` in both apps uses `text.tertiary`; these three
  were inconsistent with their own app. Aligned.
- The OTP resend countdown (**both apps**) used `text.disabled` so it would not read as tappable.
  Right intent, wrong mechanism — it achieved that by being nearly invisible, on a live countdown
  the user is reading. `text.tertiary` is still clearly non-interactive beside the link colour.

**Legitimately exempt, verified individually:** the `TopBar` wordmark (a logotype — `brand` green
is the mark itself), the GeoSheet `›` chevron, and two `<Ionicons>` glyphs. Decorative or
non-text; contrast minimums do not apply.

🔴 **THE SEAT MARKERS ARE THREE STATES, NOT TWO.** Neutral, male and female each need their own
fill *and* border (`successTint`+`brand`, `maleTint`+`male`, `femaleTint`+`female`). The tints and
inks were **measured from the gender picker in `UserBuyurtma.dc.html`** on 2026-08-31, not derived
by lightening `male`/`female` — contrast checked at 8.27:1 and 7.24:1 ink-on-tint. Collapsing any
two of the three makes different seats render identically.

🔴 **`#000` is ambiguous and must be read in context.** As `shadowColor` it becomes
`text.primary`; anywhere else, check what it actually paints before mapping it.

---

## 3. Typography

Two families. **Manrope** for text, **JetBrains Mono** for every number, ID, time and price.

### 3.1 🔴 The weight set — this is a real trap

Measured weight usage across all artboards:

| Manrope | uses | | JetBrains Mono | uses |
|---|---:|---|---|---:|
| 500 | 241 | | 500 | 85 |
| 600 | 605 | | 600 | 290 |
| 700 | 758 | | **700** | **250** |
| 800 | 621 | | **800** | **36** |
| 900 | 113 | | **900** | **4** |
| 400 | **0** | | | |

🔴 **The artboards load JetBrains Mono at `wght@400;500;600` but USE it at 700, 800 and 900 — 290
times.** A browser silently synthesises those. **React Native does not synthesise weights at all.**
If we bundle only what the design declares, **290 numeric labels render one weight too light, with
no error and no crash** — prices and times looking subtly wrong across both apps.

✅ **Bundle exactly these 8 files, and no others:**
- `Manrope`: **500, 600, 700, 800, 900** *(400 is declared but never used — skip it)*
- `JetBrainsMono`: **500, 600, 700** *(800 and 900 are 40 uses total — map them to 700; a Mono
  ExtraBold is not worth the APK weight)*

⚠️ **On Android, `fontWeight` does not select a face** — the family name must carry it
(`Manrope_700Bold`). Plan for a `font(family, weight)` helper rather than passing `fontWeight`.

### 3.2 The scale

133 distinct style combinations collapse to these. `ls` = letterSpacing, **already converted from
`em` to the absolute numbers React Native requires** (at the stated size).

| token | size | weight | family | ls | job |
|---|---:|---:|---|---:|---|
| `wordmark` | 21 | 900 | Manrope | −0.42 | "UbexGo" in the header |
| `wordmarkSuffix` | 24 | 900 | Manrope | −0.48 | "Driver" |
| `screenTitle` | 14 | 900 | Manrope | +0.14 | header subtitle |
| `sheetTitle` | 15.5 | 800 | Manrope | — | bottom-sheet titles |
| `cardTitle` | 15 | 800 | Manrope | — | card headings, submit labels |
| `modalTitle` | 14.5 | 800 | Manrope | — | modal titles, primary CTA |
| `placeLine` | 14.5 | 700 | Manrope | — | the selected from/to text |
| `navItem` | 14.5 | 700 | Manrope | — | drawer top-level row |
| `body` | 13.5 | 500 | Manrope | — | input text, paragraphs (lh 1.5) |
| `bodyStrong` | 13.5 | 800 | Manrope | — | profile name, popover header |
| `chipLabel` | 13 | 700 | Manrope | — | **the most common label** (102 uses) |
| `rowLabel` | 14 | 700 | Manrope | — | list rows |
| `secondary` | 12.5 | 500 | Manrope | — | notification body (lh 1.4) |
| `caption` | 12 | 600 | Manrope | — | small labels |
| `helper` | 11.5 | 500 | Manrope | — | parenthetical, at opacity .7 |
| `tabLabel` | 10.5 | 800/600 | Manrope | −0.11 | 800 active / 600 inactive, lh 1.15 |
| `badgeLabel` | 10.5 | 800 | Manrope | — | badge counts |
| `eyebrow` | 10 | 600 | **Mono** | +1.0 | **section labels — uppercase, `#8A857A`** (45 uses) |
| `monoValue` | 15 | 700 | **Mono** | — | time fields, phone prefix |
| `monoPrice` | 14 | 800 | **Mono** | — | price figures |
| `monoMeta` | 11 | 500/600 | **Mono** | — | timestamps, detail rows |
| `monoTiny` | 10.5 | 500 | **Mono** | — | list meta |

⚠️ **`lineHeight` in React Native is an absolute number, not a multiplier.** The artboards use
ratios (1.15 / 1.25 / 1.3 / 1.4 / 1.5); each must be multiplied by its size at token-definition time.

---

## 4. Geometry

### 4.1 Radius — **not a clean scale; these are the real values**

| token | value | applied to | uses |
|---|---:|---|---:|
| `pill` | `99` | avatars, badges, dots, grabbers, tags | **392** |
| `xs` | `2` | hamburger bar caps | 54 |
| `sm` | `8` | gender squares, checkboxes | 17 |
| `md` | `10`–`11` | drawer child rows, steppers, small chips | 114 |
| `control` | `12`–`13` | 44px buttons, chips, icon tiles | 201 |
| `field` | `14` | inputs, list rows, notification rows | 146 |
| `button` | `15`–`16` | 50–52px confirm buttons | 116 |
| `card` | `18`–`20` | **the card token** | 159 |
| `cardLarge` | `22`–`24` | hero cards, active-trip banner | 32 |
| `sheet` | `26 26 0 0` | bottom sheets (also seen as `24 24 0 0`) | 20 |

⚠️ **The pairs `18/20`, `15/16`, `12/13`, `10/11` are near-duplicates across artboards.**
Recommendation: **collapse each pair to the higher value.** Flagged as an owner question (§9).

### 4.2 Spacing — the real rhythm is **not** an 8pt grid

Measured gaps, most-used first: **10 (280) · 8 (257) · 6 (152) · 12 (92) · 14 (84) · 9 (113) ·
7 (101) · 4 (76) · 3 (85) · 2 (116) · 5 (55) · 1 (71)**.

**Odd values are load-bearing** — `7px` is the chip-row gap (101 uses), `9px` the section gap
(113 uses), `11px` the well padding. Forcing an 8pt grid would visibly change the design.
✅ **Recommendation: ship a literal 1–28 spacing scale, not a multiplier function.** The existing
`spacing(factor) => factor * 8` helper **cannot express this design** and should be retired.

### 4.3 Control sizes

| token | value | note |
|---|---:|---|
| `touchTarget` | **44** | the chrome standard — hamburger, bell, avatar, chips, tab items (153 uses) |
| `controlSm` | 36–38 | steppers, geo buttons, small avatars |
| `controlMd` | 40–42 | modal close buttons ⚠️ **below 44 — see §5** |
| `controlLg` | 46–48 | list rows, inputs |
| `buttonLg` | 50–52 | sheet confirm buttons |
| `buttonXl` | 54–56 | primary CTA |
| `tabIcon` | 24 in a 26 box | stroke width **1.8** |
| `homeIndicator` | 132 × 5 | `pill`, `#16130E` |

Border widths: **1px** (117 uses) · **1.5px** (26, emphasised) · **2px** (badge ring, checkboxes).
Icon stroke widths: **1.8** (tab bar) · **1.9** (default action icons) · **2.2** · **2.4** (close/back).

### 4.4 Shadows — converted for React Native

CSS `box-shadow` does not exist in RN. Converted, with the Android `elevation` companion:

| token | RN | elevation |
|---|---|---:|
| `card` | `offset {0,1} radius 2 opacity .04` | 1 |
| `raised` | `offset {0,3} radius 10 opacity .08` | 3 |
| `popover` | `offset {0,18} radius 40 opacity .30` | 12 |
| `sheet` | `offset {0,-8} radius 40 opacity .20` | 16 |
| `dock` | `offset {0,-12} radius 24 opacity .12` | 8 |
| `drawer` | `offset {24,0} radius 48 opacity .35` | 16 |

⚠️ **Android ignores `shadowColor`/offset on most versions — only `elevation` applies**, and
elevation cannot cast upward or sideways. **The dock, sheet and drawer shadows will not render on
Android.** Where the shadow carries meaning (the submit dock separating from content), add a
**1px `border.chrome` hairline** as the Android fallback.

### 4.5 Gradients — `expo-linear-gradient` (approved)

| token | value | applied to |
|---|---|---|
| `header` | `#1D9846 → #F4F2ED`, vertical | **the top bar, every screen** |
| `tile` | `#1D9846 → #FFFFFF`, vertical | service tiles on the main menu |

⚠️ The dotted route connectors are `repeating-linear-gradient` (`#05BB42 0 3px, transparent 3px 6px`).
**Do not use LinearGradient for these** — use a `borderStyle: 'dashed'` view or a small repeated
element; a gradient here is wasteful and blurs on Android.

---

## 5. 🔴 Accessibility — measured, and it fails in three places

WCAG 2.1 contrast ratios, computed properly (relative luminance), not estimated.
The design's own doc admits *"kontrast ba'zi ikkilamchi matnlarda 4.5:1 dan past"*. **Confirmed —
here is exactly where, and how bad.**

| pair | ratio | verdict |
|---|---:|---|
| **`#FFFFFF` on `brand #05BB42`** | **2.56** | 🔴 **FAILS even the 3:1 large-text floor** |
| `brand #05BB42` on `ground` | 2.29 | 🔴 fails — never use `brand` for text |
| `textTertiary #8A857A` on `ground` | 3.28 | ⚠️ large text / UI only — **but it is the inactive tab label at 10.5px** |
| `textSecondary #7C776D` on `ground` | 3.98 | ⚠️ below 4.5 for body copy |
| `chevron #B6B1A5` on `ground` | 1.91 | ⚠️ decorative only — acceptable if never load-bearing |
| `textPrimary` on `ground` | 16.56 | ✅ |
| `action #1F7A55` on `ground` | 4.72 | ✅ |
| `#FFFFFF` on `action #1F7A55` | 5.29 | ✅ |
| `#FFFFFF` on `danger #C0431B` | 5.17 | ✅ |

🔴 **The worst one is the most important control in the new design.** `UserMenuNeW`'s primary CTA —
the 54px "Taksi buyurtma qilish" button — is white on `#05BB42` at **2.56:1**. It is the single
button the whole redesigned main menu funnels into.

**Recommendation (needs the owner's decision, §9):** use `action #1F7A55` as the CTA fill —
**5.29:1, passes** — and keep `#05BB42` for the wordmark and selection borders only. This is a
one-token change that fixes the app's most-used button and matches how every *other* artboard
already fills its buttons.

⚠️ Also below the 44px minimum: the sheet header back/close buttons (**42px**) and the
`UserMenuNeW` carousel arrows (**34px**). Cheap fix — keep the visual size, add `hitSlop`.

---

## 6. The shared chrome — build this once, use everywhere

### 6.1 Top bar — **byte-identical across every artboard in both apps**

```
padding: 58px 18px 12px          ← 58px top = status bar; use useSafeAreaInsets() instead
background: linear-gradient(180deg, #1D9846, #F4F2ED)
grid: 1fr auto 1fr, gap 12, align center
borderBottom: 1px rgba(22,19,14,.07)
```
- **left** (gap 8): hamburger `44×44`, `radius 12`, `surface`, `border.default`, three `18×2` bars
  `radius 2` in `textPrimary` · bell `44×44`, `radius 99`, same fill, `22px` icon, stroke 1.8
- **centre** (gap 2): wordmark `21/900/#05BB42` + optional `Driver` `24/900/#0049FF`;
  under it the screen title `14/900/#131313`
- **right**: avatar `44×44`, `radius 99`, `#16130E` fill, `#F4F2ED` initials `13/700`, ls +0.26

⚠️ **The subtitle uses `#131313`, not `textPrimary #16130E`** — a second near-black that exists
nowhere else. Almost certainly an oversight. **Recommendation: normalise to `textPrimary`** (§9).

### 6.2 Bottom tab bar

```
display: grid, 5 equal columns
padding: 8px 6px 6px
borderTop: 1px rgba(22,19,14,.07)
item: minHeight 44, gap 3, icon 24 in a 26 box (stroke 1.8), label 10.5
active:   #1F7A55, weight 800      inactive: #8A857A, weight 600
badge:    top −6 right −8, minWidth 18, h 18, pad 0 4, radius 99, #C0431B, #FFFFFF 10.5/800
below it: home indicator 132×5, radius 99, #16130E, in padding 6px 0 10px
```

| # | user app | driver app |
|---|---|---|
| 1 | Asosiy | Asosiy |
| 2 | Qidirish | E'lon |
| 3 | Mening buyurtmalarim *(badge)* | Buyurtmalarim |
| 4 | Hisob | Hisob |
| 5 | Profil | Profil |

⚠️ **Two inconsistencies, both real:** `UserMenuNeW`'s bar adds `background:#F4F2ED` while
`UserMainMenu`'s bar has **no background at all** (transparent over the ground). And the **badge
appears in two variants** — the bell's has a `2px #FFFFFF` ring, the tab's has none.
**Recommendation: always set the background; keep both badge variants** (the ring exists because
the bell badge overlaps a circular button edge).

### 6.3 Drawer

`270px` wide, `ground` fill, `border.default` right edge, scrim `.32`, shadow `24px 0 48px −20px`.
Parent row `minHeight 46`, `radius 12`, `14.5/700`; child row `minHeight 38`, `radius 10`,
`paddingLeft 22`, `13.5/600/#3C382F`; separators `1px rgba(22,19,14,.12)`, margin `7px 8px`.
**22 nav groups, 5 with children, 5 with separators. No open/close animation is specified** — the
artboards hard-toggle it. Use a standard 200 ms slide.

### 6.4 Bottom sheet

`ground` fill, `radius 26 26 0 0`, `maxHeight 78%` (88% for the paid sheet), scrim `.42`.
Grabber `40×4`, `radius 99`, `rgba(22,19,14,.16)`, centred.
Header `padding 12px 18px 10px`, `44×44` back/close buttons, title `15.5/800`, crumb mono `10.5/600`.
Body `padding 12px 18px 26px`, gap 6.

---

## 7. Primitives

| component | spec |
|---|---|
| **Chip / toggle** | `h 44`, `radius 13`, `pad 0 14`, gap 6, `border 1px`. **Off:** `surface` / `border.control` / `textPrimary`. **On:** `action` fill, `action` border, `#FFFFFF` text. **On (dark):** `#16130E` fill + white — used *only* by car-class and price-mode chips. |
| **Button — primary** | `h 50–52`, `radius 16`, `action` fill, `15/800` white, shadow `0 8px 18px rgba(31,122,85,.26)` |
| **Button — dark** | same metrics, `#16130E` fill |
| **Button — destructive** | `h 56`, `radius 16`, `surface` fill, `1.5px dangerText` border, `15/800 dangerText` |
| **Card** | `surface`, `1px border.chrome`, `radius 20`, `padding 14`, shadow `card` |
| **Input** | `surfaceInput` fill, `1px border.control`, `radius 14`, `padding 11px 14px`, `13.5/500`, lh 1.5 |
| **List row** | `padding 13px 14px`, `radius 14`, `1px border.default`, label `14/700`, meta mono `10.5/500 #8A857A`, trailing `15px #B6B1A5`. **Selected:** `successTint` fill, `brand` border, `actionPressed` text, `✓` |
| **Stepper** | `38×38`, `radius 11`. Minus: `ground` fill, `border.default`. Plus: `#16130E` fill, white glyph. Disabled glyph `#C9C4B8`. Count between them: mono `13/600`, minWidth 26 |
| **Badge** | `minWidth 18`, `h 18`, `pad 0 4`, `radius 99`, `danger`, white `10.5/800` |
| **Avatar** | `radius 99`, `#16130E`, `#F4F2ED` initials. **Initials only — no image variant exists anywhere** |

🔴 **No `:focus`, `:disabled` or error style is defined for inputs anywhere in the artboards**, and
the CTA has no pressed or loading state. We must design those — see §9.

---

## 8. Inconsistencies found (the 181 "surprises", consolidated)

1. 🔴 **`UserMainMenu` vs `UserMenuNeW` are competing main menus** and differ structurally, not
   cosmetically: NeW has a service carousel, a dark active-trip banner, a country bottom sheet and
   the green CTA; MainMenu has a green-outlined tile grid and a country *modal*.
   **MainMenu's "Asosiy" tab navigates to NeW, but NeW's does not navigate back — the A/B is
   one-way.** → owner question.
2. 🔴 **The four `UserBuyurtma*` artboards differ in exactly one way:** `Viloyat` and `Tuman` define
   a **selected** list-row state (`successTint` / `brand` / `✓`); `UserBuyurtma` and `Yaqin` define
   **none** — every row is unconditionally white. `Tuman` adds a district scope card.
   **This is one screen with a mode**, confirming the design doc's own recommendation.
3. ⚠️ **Three different "Tasdiqlash" buttons** — heights 52/50/48, two fills, radii 16/15, for the
   same action. Normalise to `h 52 / radius 16 / action`.
4. ⚠️ **`#131313` header subtitle** vs `#16130E` everywhere else.
5. ⚠️ **Two badge variants** (ring / no ring) — legitimate, keep both.
6. ⚠️ **Tab bar background** present in one artboard, absent in the other.
7. ⚠️ **Near-duplicate radii** `18/20`, `15/16`, `12/13`, `10/11`.
8. ⚠️ **`transparent` inputs** — every `<input>` is transparent; the visible field is the wrapper.
   Port the wrapper, not the input.
9. ⚠️ **Sub-44px targets**: 42px sheet buttons, 34px carousel arrows.
10. ⚠️ **`mix-blend-mode: multiply`** on the NeW selection highlight — **no RN equivalent**; use a
    solid `successTint` instead.
11. ⚠️ **A CSS keyframe animation `ubxRing`** pulses the time card and stepper until a value is set.
    Reproducible with `Animated`, but it is a real behaviour, not decoration — it is the form's only
    validation cue.

---

## 9. 🛑 Owner questions — these change the tokens, so they are not mine to decide

1. **The CTA contrast failure (§5).** May I fill the primary CTA with `action #1F7A55` (5.29:1,
   passes) instead of `brand #05BB42` (2.56:1, fails)? *Recommend: yes.* It is one token and it
   fixes the redesign's most important button.
2. **`UserMainMenu` or `UserMenuNeW`** as the canonical main menu? *(blocks step 6)*
3. **Merge the four `UserBuyurtma*` into one moded screen?** *(blocks step 8)* *Recommend: yes —
   finding 8.2 shows the delta is one row state plus one card.*
4. **Collapse the near-duplicate radii** to one value per pair? *Recommend: yes.*
5. **Normalise the `#131313` subtitle** to `textPrimary`? *Recommend: yes.*
6. **`UserJonatma`** has an artboard but no screen in the app and no step in the plan. In or out?
7. **`DriverBalans` / `DriverDaromad`** (step 19) likewise have artboards but no existing screens —
   genuinely new work inside a redesign card. Confirm before I build them.
8. **Focus / error / pressed / loading states are undefined in the design.** Shall I derive them
   (focus = 2px `action` ring; error = `dangerText` border + helper text; pressed = `actionPressed`;
   disabled = `disabled` fill) and show you, rather than inventing them silently later?

---

## 10. What happens next

On approval this becomes `themes/` in the user app (step 1b), then the driver app (1d), with the
`check-design-tokens.mjs` counter (1c) ratcheting the **1 652 hardcoded literals** to zero.

⚠️ **Before step 1b begins, this document should be re-checked against the 9 unmeasured driver
document/registration artboards (§"What is missing")** — or we accept that gaps there surface at
steps 21–22 and are fixed then. **That is a deliberate choice, not an oversight.**
