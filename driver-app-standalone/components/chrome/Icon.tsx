/**
 * Icon — T-101 step 3.
 *
 * The artboards draw every icon as an inline `<svg><path d="…">`. Those exact paths are
 * reproduced here with `react-native-svg` (approved by the owner 2026-08-30), rather
 * than approximated with `@expo/vector-icons` glyphs, so the chrome matches the design
 * stroke for stroke.
 *
 * All paths are verbatim from `htmlDesign/`, on a 24x24 viewBox with a 1.8 stroke,
 * round caps and joins, and NO fill — that is how the artboards render them.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../../themes';

/** Verbatim `d` attributes from the artboards. Do not hand-tidy these. */
export const ICON_PATHS = {
  // --- bottom tab bar, user app (UserMenuNeW.dc.html) ---
  home: 'M4 11.2 12 4.5l8 6.7V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z',
  search: 'M10.8 17.1a6.3 6.3 0 1 0 0-12.6 6.3 6.3 0 0 0 0 12.6M15.6 15.6 20 20',
  orders: 'M4 8.5h16v7H4zM4 12h16',
  wallet: 'M3.5 7.5h17v9h-17zM3.5 11h17',
  profile: 'M12 11.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2M5 20c0-3.4 3.1-5.4 7-5.4s7 2 7 5.4',
  // --- driver app only (DriverMenu.dc.html) ---
  offer: "M5 5.5h14v13H5zM8 9h8M8 12.5h8M8 16h5",
  // --- top bar (UserMainMenu.dc.html) ---
  bell: 'M6.2 16.5h11.6c-1.3-1.2-1.7-2.3-1.7-4.4 0-2.9-1.8-5-4.1-5s-4.1 2.1-4.1 5c0 2.1-.4 3.2-1.7 4.4M10.3 19a2 2 0 0 0 3.4 0',
  // --- row chevron (UserBuyurtma.dc.html), used 3x per location card ---
  chevronRight: 'M9.5 5.5 16 12l-6.5 6.5',
  // The artboards have no back arrow — every board draws the drawer, because a board is
  // never "pushed". This is `chevronRight` mirrored about x=12, the same stroke weight
  // and the same 24-box, so a pushed screen gets a back affordance that still looks like
  // the design's own chevron rather than a borrowed icon-set glyph.
  chevronLeft: 'M14.5 5.5 8 12l6.5 6.5',
  // --- DriverQidiruv.dc.html (T-101 step 17d): the Taxi / Jo'natma kind toggle and the
  // empty-state glyph. The taxi's two wheels are `<circle r="1.5">` in the artboard; they are
  // written here as arcs so the glyph stays one path — same geometry, not a tidy-up.
  taxi: 'M4 16.5v-3.2l1.7-4.1A2 2 0 0 1 7.5 8h9a2 2 0 0 1 1.8 1.2L20 13.3v3.2M4 16.5h16M9.5 8V5.8h5V8M6 17.8a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0M15 17.8a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0',
  parcel: 'M12 3.6 20 7.4v9.2L12 20.4 4 16.6V7.4zM4 7.4l8 3.8 8-3.8M12 11.2v9.2',
  // The result dialog's check (DriverQidiruv.dc.html, `resIconPath`), drawn at stroke 2.4.
  check: 'm5 12.5 4.5 4.5L19 7.5',
} as const;

export type IconName = keyof typeof ICON_PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** The artboards use 1.8 in the tab bar and 1.9-2.4 elsewhere. */
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = theme.sizes.tabIcon,
  color = theme.palette.text.primary,
  strokeWidth = theme.sizes.iconStroke,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d={ICON_PATHS[name]}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
