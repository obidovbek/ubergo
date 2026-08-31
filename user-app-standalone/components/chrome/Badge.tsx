/**
 * Badge — T-101 step 3.
 *
 * The artboards use TWO variants, and the difference is deliberate rather than an
 * inconsistency (DESIGN-TOKENS.md §6.2):
 *
 *   ringed   top bar   `border: 2px solid #FFFFFF`, sits at top:2 right:2
 *            The bell badge overlaps the circular button's edge, so it needs the ring
 *            to separate itself from the border underneath.
 *
 *   plain    tab bar   no ring, sits at top:-6 right:-8
 *            Floats clear of the icon, so a ring would only add visual noise.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../themes';

interface BadgeProps {
  /** Hidden entirely when 0 or undefined — matches the artboards' `sc-if`. */
  count?: number | null;
  variant?: 'ringed' | 'plain';
  /** Caps the label; 100 renders as "99+". */
  max?: number;
}

export const Badge: React.FC<BadgeProps> = ({ count, variant = 'plain', max = 99 }) => {
  if (!count || count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);

  return (
    <View
      style={[
        styles.base,
        variant === 'ringed' ? styles.ringed : styles.plain,
      ]}
      // The count is already announced by the parent control's label, so the badge
      // itself is decorative to a screen reader.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringed: {
    top: 2,
    right: 2,
    borderWidth: 2,
    borderColor: theme.palette.surface,
  },
  plain: {
    top: -6,
    right: -8,
  },
  label: {
    ...theme.typography.badgeLabel,
    color: theme.palette.text.onAccent,
  },
});
