/**
 * Button — T-101 step 5.
 *
 * Rebuilt on the measured artboard specs (DESIGN-TOKENS.md §7). The old version read
 * the pre-redesign `palette.primary` / `borderRadius.md` aliases and had no users in
 * either app; the variants below are the ones the artboards actually draw.
 *
 * SIZES — real control heights from the artboards, not a padding scale:
 *   sm   44   the chip/toggle height, and the minimum touch target (153 uses)
 *   md   52   sheet confirm buttons ("Tasdiqlash")
 *   lg   56   the primary CTA
 *
 * VARIANTS:
 *   primary      `action` fill + white       the confirm/submit button
 *   dark         `text.primary` fill         used ONLY by car-class and price-mode
 *                                            chips in the artboards — a deliberate
 *                                            second emphasis, not an accident
 *   outline      surface + `border.control`  the unselected chip state
 *   destructive  surface + `dangerText`      "Bekor qilish"; 1.5px border, red label
 *   text         no fill                     inline actions ("Hammasini o'qildi")
 *
 * 🔴 THE PRIMARY FILL IS `action` (#1F7A55), NOT `brand` (#05BB42).
 * White on brand green measures 2.56:1 — it fails WCAG even for large text. The owner
 * approved this correction on 2026-08-30. `brand` is the wordmark and selection colour;
 * it is never a fill behind white text. See DESIGN-TOKENS.md §5.
 *
 * ⚠️ The artboards define NO pressed, disabled, or loading state for any button. These
 * are derived from `theme.states` (the owner delegated them on 2026-08-30) so that every
 * button in the app answers the question the same way, rather than each screen inventing
 * its own.
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { theme } from '../themes';

export type ButtonVariant =
  | 'primary'
  | 'dark'
  | 'outline'
  | 'destructive'
  | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** Rendered before the label — a chip mark, an icon. */
  leading?: React.ReactNode;
  /** Stretches to fill its row. Sheet confirm buttons do this. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

const HEIGHTS: Record<ButtonSize, number> = {
  sm: theme.sizes.touchTarget, // 44
  md: theme.sizes.buttonLg, // 52
  lg: theme.sizes.buttonXl, // 56
};

const RADII: Record<ButtonSize, number> = {
  sm: theme.borderRadius.control, // 13
  md: theme.borderRadius.button, // 16
  lg: theme.borderRadius.button + 1, // 17 — the artboards' CTA radius
};

const FILL: Record<ButtonVariant, string> = {
  primary: theme.palette.action,
  dark: theme.palette.text.primary,
  outline: theme.palette.surface,
  destructive: theme.palette.surface,
  text: 'transparent',
};

const INK: Record<ButtonVariant, string> = {
  primary: theme.palette.text.onAccent,
  dark: theme.palette.text.onAccent,
  outline: theme.palette.text.primary,
  destructive: theme.palette.dangerText,
  text: theme.palette.action,
};

const BORDER: Partial<Record<ButtonVariant, { color: string; width: number }>> = {
  outline: { color: theme.palette.borders.control, width: theme.sizes.borderHairline },
  destructive: { color: theme.palette.dangerText, width: theme.sizes.borderEmphasis },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leading,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const inert = disabled || loading;
  const border = BORDER[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inert, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHTS[size],
          borderRadius: RADII[size],
          backgroundColor: disabled ? theme.palette.disabled : FILL[variant],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        border && { borderWidth: border.width, borderColor: border.color },
        // The artboards give the raised variants a coloured shadow; flat ones none.
        variant === 'primary' || variant === 'dark' ? theme.shadows.raised : null,
        pressed && !inert && { opacity: theme.states.pressedOpacity },
        disabled && { opacity: theme.states.disabledOpacity },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={INK[variant]}
          // Keeps the button's width stable while it spins, so a row of buttons does
          // not reflow the moment one is pressed.
          size="small"
        />
      ) : (
        <View style={styles.row}>
          {leading}
          <Text
            style={[
              theme.typography.cardTitle,
              { color: disabled ? theme.palette.text.disabled : INK[variant] },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
