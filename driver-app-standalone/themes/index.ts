/**
 * Theme Configuration
 * Exports theme objects and utilities
 */

import { lightPalette } from './palettes/light';
import { darkPalette } from './palettes/dark';

// Spacing system (multiples of 8)
export const spacing = (factor: number): number => factor * 8;

// Typography system
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

// Border radius system
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadow system
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

/**
 * Modal design tokens (T-036).
 *
 * Derived from the Figma overlay language — `004Shaharlar aro K3 Tanlov oynasi.png`,
 * `K_RegShablon-3.png`, `K_buyurtma001Yangi.png`: a cream card with a heavy black
 * border, a red centred heading, pill rows, and stacked green/red actions.
 *
 * Mode-independent on purpose, like `borderRadius` and `shadows` above: the design is a
 * single light treatment and there is no dark variant of it to honour.
 *
 * ⚠️ Kept byte-identical to the user app's copy — the two standalone apps duplicate
 * shared code by convention, so these must be edited together.
 */
export const modal = {
  backdrop: 'rgba(0, 0, 0, 0.5)',
  body: '#FDF6E3',
  border: '#000000',
  borderWidth: 2,
  radius: 20,
  heading: '#E53935',
  // Rows / inputs
  row: '#FFFFFF',
  rowText: '#111111',
  rowRadius: 12,
  rowSelected: '#8FE3A6',
  rowSelectedText: '#1B5E20',
  // Actions
  primary: '#4CAF50',
  primaryText: '#FFFFFF',
  cancelFill: '#FFEBEE',
  cancelBorder: '#E53935',
  cancelText: '#E53935',
  // Muted text (placeholders, empty states)
  muted: '#6B6B6B',
};

// Theme object
export interface Theme {
  palette: typeof lightPalette;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  modal: typeof modal;
}

export const createTheme = (mode: 'light' | 'dark'): Theme => ({
  palette: mode === 'light' ? lightPalette : darkPalette,
  spacing,
  typography,
  borderRadius,
  shadows,
  modal,
});

export { lightPalette, darkPalette };

