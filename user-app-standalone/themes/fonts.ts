/**
 * Font loading — T-101 step 2.
 *
 * The 7 faces the design actually uses. Bundled as .ttf in `assets/fonts/` and loaded
 * with `expo-font`, which is already a dependency — this adds none.
 *
 * WHY THESE SEVEN AND NOT WHAT THE DESIGN DECLARES (see docs/DESIGN-TOKENS.md §3.1):
 *
 *   Manrope 400   the artboards load it and use it ZERO times          -> not bundled
 *   Manrope 900   DOES NOT EXIST. Manrope stops at ExtraBold (800);
 *                 its variable font's wght axis is 200..800. The
 *                 artboards ask for 900 and Google Fonts silently
 *                 serves 800, so the design has always rendered at
 *                 800 anyway.                                          -> folds to 800
 *   Mono 700      the artboards DO NOT load it but use it 250 times.
 *                 A browser fakes the weight; React Native does not,
 *                 so omitting it would render every price and time
 *                 one weight too light, silently.                      -> BUNDLED
 *   Mono 800/900  40 uses across every artboard                        -> folds to 700
 *
 * ⚠️ Keep this list in sync with `FACE` in `./index.ts`. A name mismatch does not throw
 * — the text just renders in the system font, which looks *nearly* right.
 */

export const fontAssets = {
  Manrope_500Medium: require('../assets/fonts/Manrope_500Medium.ttf'),
  Manrope_600SemiBold: require('../assets/fonts/Manrope_600SemiBold.ttf'),
  Manrope_700Bold: require('../assets/fonts/Manrope_700Bold.ttf'),
  Manrope_800ExtraBold: require('../assets/fonts/Manrope_800ExtraBold.ttf'),
  JetBrainsMono_500Medium: require('../assets/fonts/JetBrainsMono_500Medium.ttf'),
  JetBrainsMono_600SemiBold: require('../assets/fonts/JetBrainsMono_600SemiBold.ttf'),
  JetBrainsMono_700Bold: require('../assets/fonts/JetBrainsMono_700Bold.ttf'),
};

export type LoadedFontName = keyof typeof fontAssets;
