/**
 * UbexGo palette — the ONLY palette. (T-101, 2026-08-30)
 *
 * Measured from the `htmlDesign/` artboards; see `docs/DESIGN-TOKENS.md` for the counts,
 * the semantic roles and the WCAG contrast table behind every value here.
 *
 * There is no dark palette. The owner dropped dark mode on 2026-08-30 because the 33
 * artboards define exactly one light treatment and no dark variant of it exists to honour.
 *
 * TWO RULES THAT ARE EASY TO GET WRONG:
 *
 * 1. `brand` and `action` are NOT interchangeable.
 *    `brand` (#05BB42) is the LOGO green — it is bright and fails contrast (2.56:1 on white).
 *    `action` (#1F7A55) is the BUTTON green — 5.29:1, passes.
 *    Use `brand` for the wordmark, selection borders and tints. Never for a text or a fill
 *    that carries white text. The artboards break this rule exactly once (the UserMenuNeW
 *    CTA) and the owner approved fixing it on 2026-08-30.
 *
 * 2. Borders are never a solid colour — they are an opacity ramp on the ink colour.
 *    Use `border.*`, not a grey.
 */

// The ink these borders and scrims are derived from.
const INK = '22, 19, 14'; // === #16130E

export const lightPalette = {
  // ---------------------------------------------------------------- ground / surface
  ground: '#F4F2ED', // every screen background, drawer, sheet, inset well
  surface: '#FFFFFF', // cards, popovers, chip-off state, control tiles
  surfaceInput: '#FDFCFA', // input fields ONLY — never a card
  surfaceSunken: '#EDEAE3', // progress track, scroll arrows, "completed" pill
  /**
   * T-101 step 9 — the SEGMENTED-CONTROL TRACK, one step darker than `surfaceSunken`.
   * Measured on `UserMyOrder` (the order-mode strip) and `UserQidiruv`; 2 uses.
   * The selected segment is a white `surface` tile riding on it, so the track has to
   * sit below the card ground to read as a groove rather than another card.
   */
  surfaceTrack: '#E4E0D7',

  // ---------------------------------------------------------------- text
  text: {
    /**
     * 🔴 THE THREE SUPPORTING TIERS WERE DARKENED 2026-08-31, and this is a deliberate
     * departure from the artboards.
     *
     * As drawn, `secondary` was #7C776D (3.98:1 on ground) and `tertiary` #8A857A
     * (3.28:1) — both below WCAG AA's 4.5:1 for normal-size text. The "but they pass
     * AA-large" defence does not apply here: **the artboards use them at 9-12px**, never
     * at the 24px that AA-large needs. 651 uses across the 33 artboards, essentially all
     * of them small labels.
     *
     * Simply pushing both to 4.5:1 collapsed them into each other (#736E65 vs #726E65) —
     * two tiers rendering identically, which is its own bug. So all three supporting tiers
     * were re-spaced evenly between 4.5:1 and muted's 6.41:1, keeping the artboards' exact
     * hue (41.3°) and saturation (0.064) so the warm-grey character is unchanged:
     *
     *   muted      #5B5750  6.42:1   (was #5C574E 6.41:1 — imperceptible shift)
     *   secondary  #66625A  5.43:1   (was #7C776D 3.98:1)
     *   tertiary   #716D64  4.61:1   (was #8A857A 3.28:1)
     *
     * Every tier is now legible at small sizes AND a visible step from its neighbour.
     */
    primary: '#16130E', // body + headings; also the avatar / inverted-card fill
    secondary: '#66625A', // supporting copy, phone numbers, notes
    tertiary: '#716D64', // INACTIVE TAB, eyebrow labels, timestamps, meta
    muted: '#5B5750', // list titles, key-value labels, inactive segment
    onDark: '#F4F2ED', // text sitting on a `text.primary` fill
    /**
     * T-101 step 6b — the SECOND tier on a dark fill, measured `#B7B2A6` in
     * `UserMenuNeW.dc.html`'s active-trip banner. It exists because `onDark` is the
     * same value as `ground`: without a distinct muted tier the banner's supporting
     * line renders identically to its headline — the "two tiers, one colour" trap this
     * card already hit once on the status labels. 8.76:1 on `text.primary`.
     */
    onDarkMuted: '#B7B2A6',
    onAccent: '#FFFFFF', // text sitting on `action` / `danger` / `brandSuffix`
    chevron: '#B6B1A5', // disclosure glyphs — DECORATIVE ONLY (1.91:1)
    disabled: '#C9C4B8',
    /** @deprecated placeholder ink — the old palette's key. Use `tertiary`. Dies in step 23. */
    hint: '#716D64',
  },

  // ---------------------------------------------------------------- brand vs action
  brand: '#05BB42', // the wordmark, selection borders and tints. NOT a button fill.
  brandSuffix: '#0049FF', // the word "Driver" — driver app only. Unused in this app.
  action: '#1F7A55', // active tab, selected chip, confirm buttons, links
  actionPressed: '#155C40', // pressed state, price figures, icon glyphs
  headerGradient: ['#1D9846', '#F4F2ED'] as const, // the top bar, every screen
  tileGradient: ['#1D9846', '#FFFFFF'] as const, // service tiles on the main menu

  // ---------------------------------------------------------------- status
  danger: '#C0431B', // badge fill (bell + tab counts), warnings
  dangerText: '#B03A2E', // "Chiqish" / destructive labels, unset-value text
  dangerDeep: '#8E2E1E', // cancelled-state foreground
  dangerTint: '#FBE2DE',
  dangerBorder: '#D9705E',

  successTint: '#DCF6E4', // selected list row, "free seats" badge
  successTintSoft: '#F2FBF5', // unread notification row

  warnInk: '#7A5B10', // urgent tag text, "awaiting offer"
  warnBorder: '#E8B84B',
  warnTint: '#FFF1D6',

  disabled: '#D8D4C9', // disabled submit surface, read dot

  // ---------------------------------------------------------------- semantic accents
  male: '#1F5FA8', // male seat marker + gender modal (NOT a brand blue)
  female: '#C43D7A', // female seat marker
  /**
   * The gender pair's tints and inks, measured from the gender picker in
   * `UserBuyurtma.dc.html` (T-101, 2026-08-31) — NOT derived by lightening `male`/`female`.
   * Contrast checked: ink-on-tint 8.27:1 male / 7.24:1 female; marker-on-tint 5.61 / 4.27
   * (markers are borders and icons, never body text).
   * ⚠️ There are THREE seat states — neutral, male, female — and each needs its own tint AND
   * border. Collapsing any two makes different seats render identically.
   */
  maleTint: '#E8F0FA',
  maleInk: '#154779',
  femaleTint: '#FDEBF3',
  femaleInk: '#8E2455',
  /** The softer blue tint + border used by the sheets' "cancel" control. */
  blueTintSoft: '#DCEBFB',
  blueBorder: '#9CC4EC',
  /** The artboards' blue tint (14 uses) — informational surfaces. Pairs with `male`. */
  blueTint: '#DCEEFB',
  timeInRange: '#2D6CDF', // selected blocks on the 15-minute grid
  paid: '#5B2E9D', // the paid "Maxsus buyurtma" flow
  /**
   * T-101 step 8c — the paid accent at .22, the border of the special-order card.
   * Measured: `rgba(91,46,157,.22)` in `UserBuyurtma.dc.html`. A border, never text.
   */
  paidBorder: 'rgba(91, 46, 157, 0.22)',

  // ---------------------------------------------------------------- borders & scrims
  /**
   * The border opacity ramp.
   *
   * ⚠️ Named `borders` (plural), NOT `border`. `palette.border` must stay a plain
   * colour string: 9 existing call sites pass it straight to `borderColor`, and
   * turning it into an object silently breaks every one of them. It is aliased at
   * the bottom of this file and dies in step 23.
   */
  borders: {
    chrome: `rgba(${INK}, 0.07)`, // top-bar bottom, tab-bar top, card hairline
    default: `rgba(${INK}, 0.08)`, // the workhorse — buttons, popovers, drawer edge
    control: `rgba(${INK}, 0.09)`, // resting border of interactive cards and inputs
    strong: `rgba(${INK}, 0.12)`, // drawer separators, flag swatches
    emphasis: `rgba(${INK}, 0.16)`, // unselected pills, sheet grabber
  },
  scrim: {
    light: `rgba(${INK}, 0.28)`, // notification + profile popovers
    drawer: `rgba(${INK}, 0.32)`,
    sheet: `rgba(${INK}, 0.42)`, // NOTE: the artboards also blur this; RN cannot.
    modal: `rgba(${INK}, 0.5)`,
  },

  /**
   * ⚠️ NOT a screen colour. `#E8E4DB` is the desk the phone frame sits on in the
   * artboards. It is recorded here only so nobody "discovers" it later and ships it.
   */
  artboardCanvas: '#E8E4DB',

  // ================================================================================
  // COMPATIBILITY ALIASES — T-101 step 1b.
  //
  // 26 files import this palette and read the old Material-style keys. Renaming them
  // all in one commit would be a single unreviewable change, so the old shape stays
  // alive here, remapped onto the new values, and dies in step 23 once every screen
  // has been converted.
  //
  // DO NOT USE THESE IN NEW CODE.
  // ================================================================================
  primary: {
    main: '#1F7A55', // was #000000 — now `action`
    light: '#05BB42',
    dark: '#155C40',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#05BB42', // was #00D9A5 — now `brand`
    light: '#DCF6E4',
    dark: '#155C40',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F4F2ED', // was #FFFFFF — now `ground`
    paper: '#FFFFFF',
    card: '#FFFFFF',
  },
  error: { main: '#C0431B', light: '#FBE2DE', dark: '#8E2E1E' },
  warning: { main: '#E8B84B', light: '#FFF1D6', dark: '#7A5B10' },
  info: { main: '#1F5FA8', light: '#DCEEFB', dark: '#0049FF' },
  success: { main: '#1F7A55', light: '#DCF6E4', dark: '#155C40' },
  grey: {
    50: '#FDFCFA',
    100: '#F4F2ED',
    200: '#EDEAE3',
    300: '#D8D4C9',
    400: '#C9C4B8',
    500: '#B6B1A5',
    600: '#8A857A',
    700: '#7C776D',
    800: '#5C574E',
    900: '#16130E',
  },
  divider: `rgba(${INK}, 0.07)`,
  /** @deprecated a plain string on purpose — use `borders.default`. Dies in step 23. */
  border: `rgba(${INK}, 0.08)`,
};

export type Palette = typeof lightPalette;
