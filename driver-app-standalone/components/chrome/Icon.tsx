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
