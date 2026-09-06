/**
 * The offer form's chip — T-101 step 16b.
 *
 * `DriverElon.dc.html` uses one chip for four different jobs (to'lov turi, avto
 * turi, qo'shimcha shartlar, and the standalone yes/no rows). Its `sel()` helper
 * returns exactly two looks:
 *
 *   off  white fill, `borders.control` hairline, `text.primary` ink
 *   on   SOLID `action` fill, `text.onAccent` ink
 *
 * 🔴 This is a real repaint, not a rename. The wizard's old `wizardChipOn` was a
 * TINTED chip (successTint fill, `brand` border, `actionPressed` ink). The
 * artboard fills it solid — an on chip reads as on across the room, which is the
 * point on a form this long.
 *
 * ⚠️ `min-height: 44px` is in the artboard's own markup, not an accessibility
 * retrofit — `sizes.touchTarget`. Keep it.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { theme, typography, borderRadius, sizes, space } from '../../themes';

interface ToggleChipProps {
  label: string;
  on: boolean;
  onPress: () => void;
  /** `fill` stretches the chip across the row — the artboard's payment pair. */
  layout?: 'hug' | 'fill';
  style?: ViewStyle;
}

export const ToggleChip: React.FC<ToggleChipProps> = ({
  label,
  on,
  onPress,
  layout = 'hug',
  style,
}) => (
  <TouchableOpacity
    style={[styles.chip, layout === 'fill' && styles.chipFill, on && styles.chipOn, style]}
    onPress={onPress}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityState={{ selected: on }}
  >
    <Text style={[styles.label, on && styles.labelOn]}>{label}</Text>
  </TouchableOpacity>
);

/** The artboard's chip container: wrapping row, 7px gap (`space.sm + 1`). */
export const ToggleChipRow: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({
  children,
  style,
}) => <View style={[styles.row, style]}>{children}</View>;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7, // measured; see the note on `space` in themes/index.ts
  },
  chip: {
    minHeight: sizes.touchTarget,
    paddingVertical: space.lg,
    paddingHorizontal: 13,
    borderRadius: borderRadius.control,
    borderWidth: sizes.borderHairline,
    borderColor: theme.palette.borders.control,
    backgroundColor: theme.palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipFill: {
    flex: 1,
  },
  chipOn: {
    borderColor: theme.palette.action,
    backgroundColor: theme.palette.action,
  },
  label: {
    ...typography.chipLabel,
    color: theme.palette.text.primary,
    textAlign: 'center',
  },
  labelOn: {
    color: theme.palette.text.onAccent,
  },
});

export default ToggleChip;
