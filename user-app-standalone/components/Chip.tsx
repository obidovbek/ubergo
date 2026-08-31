/**
 * Chip — T-101 step 5.
 *
 * The artboards define this once as a function called `sel()` and reuse it for payment
 * methods, car classes, extras, seat preferences, date chips, the urgent toggle and the
 * meet buttons. Reproduced verbatim (DESIGN-TOKENS.md §7):
 *
 *   sel(on, tone) {
 *     if (!on)            return { bg:'#FFFFFF', bc:'rgba(22,19,14,.09)', fg:'#16130E' }
 *     if (tone === 'dark')return { bg:'#16130E', bc:'#16130E',            fg:'#FFFFFF' }
 *     return                     { bg: accent,   bc: accent,              fg:'#FFFFFF' }
 *   }
 *
 * ⚠️ THE `dark` TONE IS NOT A MISTAKE. Car-class and price-mode chips select to
 * near-black while every other chip selects to green. Two different "on" looks in one
 * form reads like a bug, but it is consistent across all four UserBuyurtma artboards
 * and the driver's Elon screen — it distinguishes a *mode* choice from a *feature*
 * choice. Do not unify them without asking the owner.
 *
 * Height is 44 (the touch target) with a 13px/700 label — the single most common
 * control in the design, at 102 measured uses.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '../themes';

interface ChipProps {
  label: string;
  selected?: boolean;
  /** `dark` selects to near-black instead of green — mode choices only. */
  tone?: 'accent' | 'dark';
  onPress?: () => void;
  disabled?: boolean;
  /** The artboards put a "+" / "✓" mark before extras chips. */
  mark?: string;
  /** Chips in a wrap row share the width; standalone ones hug their label. */
  grow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  tone = 'accent',
  onPress,
  disabled = false,
  mark,
  grow = false,
  style,
}) => {
  const bg = !selected
    ? theme.palette.surface
    : tone === 'dark'
      ? theme.palette.text.primary
      : theme.palette.action;

  const bc = !selected
    ? theme.palette.borders.control
    : tone === 'dark'
      ? theme.palette.text.primary
      : theme.palette.action;

  const fg = !selected ? theme.palette.text.primary : theme.palette.text.onAccent;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: bc },
        grow ? styles.grow : null,
        pressed && !disabled && { opacity: theme.states.pressedOpacity },
        disabled && { opacity: theme.states.disabledOpacity },
        style,
      ]}
    >
      <View style={styles.row}>
        {mark ? <Text style={[styles.mark, { color: fg }]}>{mark}</Text> : null}
        <Text style={[theme.typography.chipLabel, { color: fg }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: theme.sizes.touchTarget,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.control,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mark: { ...theme.typography.chipLabel },
});
