/**
 * UbexGo theme — T-101, 2026-08-30.
 *
 * Measured from the `htmlDesign/` artboards. The evidence for every number here
 * (counts, semantic roles, WCAG contrast) is in `docs/DESIGN-TOKENS.md`.
 *
 * There is ONE theme. Dark mode was dropped by the owner on 2026-08-30.
 * `createTheme()` still accepts a mode argument so the 26 existing importers keep
 * compiling; the argument is ignored and the parameter dies in step 23.
 */

import { Platform } from 'react-native';
import { lightPalette } from './palettes/light';

// ---------------------------------------------------------------------------- fonts
/**
 * THE ANDROID FONT TRAP (see DESIGN-TOKENS.md §3.1).
 *
 * React Native does NOT synthesise font weights. On Android `fontWeight` does not
 * select a face at all — the family NAME must carry the weight. So never write
 * `{ fontWeight: '800' }`; call `font('sans', 800)` and spread the result.
 *
 * A missing weight does not throw. It silently falls back and looks *nearly* right,
 * which is why this is a helper and not a convention.
 *
 * Step 2 bundles exactly these faces and no others:
 *   Manrope       500 600 700 800 900   (400 is declared by the design, used 0 times)
 *   JetBrainsMono 500 600 700           (the design loads 400/500/600 but USES 700
 *                                        250 times — bundling what it declares would
 *                                        render every price one weight too light)
 */
export type FontFamily = 'sans' | 'mono';
export type FontWeight = 500 | 600 | 700 | 800 | 900;

const FACE: Record<FontFamily, Partial<Record<FontWeight, string>>> = {
  sans: {
    500: 'Manrope_500Medium',
    600: 'Manrope_600SemiBold',
    700: 'Manrope_700Bold',
    800: 'Manrope_800ExtraBold',
    // 🔴 THERE IS NO MANROPE 900. The family stops at ExtraBold (800) — its variable
    // font's wght axis is 200..800, and the static set has no Black.
    //
    // The artboards nonetheless ASK for 900 (`family=Manrope:wght@...;900`) and use it
    // 113 times, including the wordmark. Google Fonts silently serves 800 for the
    // unavailable weight, so **the design has always RENDERED at 800** — the 900 in the
    // markup is aspirational, not something we are failing to match.
    //
    // Folding 900 -> 800 here therefore REPRODUCES the artboards exactly. Do not "fix"
    // this by hunting for a Manrope Black; substituting a different foundry's black
    // would make the app diverge from the design, not converge on it.
    900: 'Manrope_800ExtraBold',
  },
  mono: {
    500: 'JetBrainsMono_500Medium',
    600: 'JetBrainsMono_600SemiBold',
    // Mono 800 and 900 are 40 uses in total across every artboard; they map to 700
    // rather than earning two more font files in the APK.
    700: 'JetBrainsMono_700Bold',
  },
};

const FALLBACK: Record<FontFamily, string> = {
  sans: Platform.select({ ios: 'System', default: 'sans-serif' }) as string,
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }) as string,
};

export const font = (family: FontFamily, weight: FontWeight = 700) => {
  const faces = FACE[family];
  const exact = faces[weight];
  if (exact) return { fontFamily: exact };
  // Mono asked for 800/900 -> 700. Anything else falls back to the platform font.
  const nearest = faces[700] ?? faces[600] ?? faces[500];
  return { fontFamily: nearest ?? FALLBACK[family] };
};

// ---------------------------------------------------------------------------- spacing
/**
 * ⚠️ The artboards are NOT on an 8pt grid, and forcing one would visibly change the
 * design. Odd values are load-bearing: 7px is the chip-row gap (101 uses), 9px the
 * section gap (113 uses), 11px the inset-well padding.
 *
 * ⚠️ `spacing` stays a PLAIN FUNCTION. An earlier attempt in this step merged the
 * named scale onto the function object, so that `spacing(2)` and `spacing.md` both
 * worked. That defeats TypeScript's inference inside `StyleSheet.create` and produced
 * errors at all 190 call sites. The named scale therefore lives beside it as `space`.
 *
 * @deprecated Use `space.md`. The multiplier cannot express this design and dies in
 * step 23.
 */
export const spacing = (factor: number): number => factor * 8;

/** The measured scale. Odd values are load-bearing — see the note above. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,   // the dominant rhythm (257 uses)
  lg: 10,  // the most common gap overall (280 uses)
  xl: 12,
  xxl: 14,
  xxxl: 18,
} as const;

// ---------------------------------------------------------------------------- radius
export const borderRadius = {
  xs: 2,       // hamburger bar caps
  sm: 8,       // gender squares, checkboxes
  md: 11,      // drawer child rows, steppers, small chips
  control: 13, // 44px buttons, chips, icon tiles
  field: 14,   // inputs, list rows, notification rows
  button: 16,  // 50-52px confirm buttons
  card: 20,    // THE card token
  cardLarge: 22,
  hero: 24,
  sheet: 26,   // bottom sheets (top corners only)
  full: 99,

  // --- aliases for the 26 existing importers; die in step 23 ---
  /** @deprecated */ lg: 16,
  /** @deprecated */ xl: 24,
};

// ---------------------------------------------------------------------------- type
/**
 * letterSpacing is ABSOLUTE in React Native, not em. Every value below is already
 * converted at its own size. lineHeight is likewise absolute, not a multiplier.
 */
export const typography = {
  wordmark:       { fontSize: 21,   ...font('sans', 900), letterSpacing: -0.42 },
  wordmarkSuffix: { fontSize: 24,   ...font('sans', 900), letterSpacing: -0.48 },
  screenTitle:    { fontSize: 14,   ...font('sans', 900), letterSpacing: 0.14 },

  sheetTitle:     { fontSize: 15.5, ...font('sans', 800) },
  cardTitle:      { fontSize: 15,   ...font('sans', 800) },
  modalTitle:     { fontSize: 14.5, ...font('sans', 800) },

  placeLine:      { fontSize: 14.5, ...font('sans', 700) },
  navItem:        { fontSize: 14.5, ...font('sans', 700), lineHeight: 18 },
  rowLabel:       { fontSize: 14,   ...font('sans', 700) },

  body:           { fontSize: 13.5, ...font('sans', 500), lineHeight: 20 },
  bodyStrong:     { fontSize: 13.5, ...font('sans', 800) },
  chipLabel:      { fontSize: 13,   ...font('sans', 700) },
  secondary:      { fontSize: 12.5, ...font('sans', 500), lineHeight: 18 },
  caption:        { fontSize: 12,   ...font('sans', 600) },
  helper:         { fontSize: 11.5, ...font('sans', 500) },

  tabLabelActive:   { fontSize: 10.5, ...font('sans', 800), letterSpacing: -0.11, lineHeight: 12 },
  tabLabelInactive: { fontSize: 10.5, ...font('sans', 600), letterSpacing: -0.11, lineHeight: 12 },
  badgeLabel:       { fontSize: 10.5, ...font('sans', 800) },

  /** Section eyebrow — uppercase, wide tracking, always text.tertiary. */
  eyebrow:    { fontSize: 10, ...font('mono', 600), letterSpacing: 1.0 },
  monoValue:  { fontSize: 15, ...font('mono', 700) },
  monoPrice:  { fontSize: 14, ...font('mono', 700) },
  monoMeta:   { fontSize: 11, ...font('mono', 500) },
  monoTiny:   { fontSize: 10.5, ...font('mono', 500) },

  // --- aliases for the 26 existing importers; die in step 23 ---
  /** @deprecated */ h1: { fontSize: 24, ...font('sans', 900), lineHeight: 30 },
  /** @deprecated */ h2: { fontSize: 21, ...font('sans', 900), lineHeight: 27 },
  /** @deprecated */ h3: { fontSize: 18, ...font('sans', 800), lineHeight: 24 },
  /** @deprecated */ h4: { fontSize: 16, ...font('sans', 800), lineHeight: 22 },
  /** @deprecated */ h5: { fontSize: 15, ...font('sans', 800), lineHeight: 20 },
  /** @deprecated */ h6: { fontSize: 14, ...font('sans', 700), lineHeight: 19 },
  /** @deprecated */ body1: { fontSize: 13.5, ...font('sans', 500), lineHeight: 20 },
  /** @deprecated */ body2: { fontSize: 12.5, ...font('sans', 500), lineHeight: 18 },
  /** @deprecated */ button: { fontSize: 15, ...font('sans', 800), lineHeight: 20 },
};

// ---------------------------------------------------------------------------- depth
/**
 * ⚠️ ANDROID reads `elevation` and ignores shadowColor/Offset/Opacity/Radius, and
 * elevation cannot cast upward or sideways. So `dock`, `sheet` and `drawer` DO NOT
 * render on Android — where the shadow carries meaning (the submit dock separating
 * itself from the content behind it), pair it with a `border.chrome` hairline.
 */
const shadow = (
  h: number, radius: number, opacity: number, elevation: number, w = 0,
) => ({
  shadowColor: '#16130E',
  shadowOffset: { width: w, height: h },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const shadows = {
  card:    shadow(1, 2, 0.04, 1),
  raised:  shadow(3, 10, 0.08, 3),
  popover: shadow(18, 40, 0.3, 12),
  sheet:   shadow(-8, 40, 0.2, 16),
  dock:    shadow(-12, 24, 0.12, 8),
  drawer:  shadow(0, 48, 0.35, 16, 24),

  // --- aliases; die in step 23 ---
  /** @deprecated */ sm: shadow(1, 2, 0.04, 1),
  /** @deprecated */ md: shadow(3, 10, 0.08, 3),
  /** @deprecated */ lg: shadow(18, 40, 0.3, 12),
};

// ---------------------------------------------------------------------------- sizes
export const sizes = {
  /** The chrome standard. 153 uses. Anything smaller needs hitSlop. */
  touchTarget: 44,
  controlSm: 38,
  controlMd: 42,
  controlLg: 48,
  buttonLg: 52,
  buttonXl: 56,
  tabIcon: 24,
  tabIconBox: 26,
  iconStroke: 1.8,
  homeIndicator: { width: 132, height: 5 },
  borderHairline: 1,
  borderEmphasis: 1.5,
};

// ---------------------------------------------------------------------------- states
/**
 * The artboards define NO focus, error, pressed, disabled or loading state anywhere.
 * The owner delegated these on 2026-08-30 ("design yourself"), so they are derived
 * from the measured palette rather than invented per screen:
 *   focus    2px `action` ring        — the same green the control turns when selected
 *   error    `dangerText` border + helper text below
 *   pressed  `actionPressed`          — the artboards' own :hover value
 *   disabled `disabled` fill + `text.disabled` ink, the values already used by the
 *            disabled submit button and the maxed-out stepper
 */
export const states = {
  focusRingWidth: 2,
  focusRingColor: lightPalette.action,
  errorBorderColor: lightPalette.dangerText,
  pressedOverlay: lightPalette.actionPressed,
  pressedOpacity: 0.9,
  disabledOpacity: 0.4, // matches the artboards' locked seat-stepper row
};

// ---------------------------------------------------------------------------- modal
/**
 * Replaces the Figma-era T-036 modal language (cream #FDF6E3, 2px black border, red
 * heading), which the new design supersedes outright. Kept under the same key so
 * AppModal / ModalList / ConfirmDialog keep compiling — they are restyled in step 5.
 */
export const modal = {
  backdrop: lightPalette.scrim.modal,
  body: lightPalette.ground,
  border: lightPalette.borders.default,
  borderWidth: 1,
  radius: borderRadius.sheet,
  heading: lightPalette.text.primary,

  row: lightPalette.surface,
  rowText: lightPalette.text.primary,
  rowRadius: borderRadius.field,
  rowSelected: lightPalette.successTint,
  rowSelectedText: lightPalette.actionPressed,

  primary: lightPalette.action,
  primaryText: lightPalette.text.onAccent,
  cancelFill: lightPalette.surface,
  cancelBorder: lightPalette.dangerText,
  cancelText: lightPalette.dangerText,

  muted: lightPalette.text.tertiary,

  /** Sheet grabber — 40x4, centred. */
  grabber: { width: 40, height: 4, color: lightPalette.borders.emphasis },
};

// ---------------------------------------------------------------------------- theme
export interface Theme {
  palette: typeof lightPalette;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  sizes: typeof sizes;
  states: typeof states;
  modal: typeof modal;
  font: typeof font;
}

export const theme: Theme = {
  palette: lightPalette,
  spacing,
  typography,
  borderRadius,
  shadows,
  sizes,
  states,
  modal,
  font,
};

/**
 * @deprecated There is only one theme. Import `theme` directly.
 * The `_mode` argument is ignored and is removed in step 23.
 */
export const createTheme = (_mode?: 'light' | 'dark'): Theme => theme;

export { lightPalette };
/** @deprecated Dark mode was dropped 2026-08-30. Aliased so imports keep compiling. */
export const darkPalette = lightPalette;
