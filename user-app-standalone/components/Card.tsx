/**
 * Card — T-101 step 5.
 *
 * The artboards' single most repeated container (DESIGN-TOKENS.md §7): white surface,
 * 1px `border.chrome` hairline, radius 20, padding 14, and the faintest shadow in the
 * system (`0 1px 2px rgba(22,19,14,.04)`).
 *
 * Variants seen in the artboards:
 *   default    the workhorse — route card, time card, comment card, offer card
 *   selected   1.5px `brand` border. Used by the Viloyat/Tuman scope cards. NOTE the
 *              border is the BRAND green, not `action`: here it is a selection
 *              indicator, not an interactive fill, which is the one job `brand` keeps.
 *   inverted   `text.primary` fill — the active-trip banner, the only dark surface in
 *              either app.
 *   flush      no padding, for cards that host their own rows (the seat stepper list).
 */

import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '../themes';

export type CardVariant = 'default' | 'selected' | 'inverted' | 'flush';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  /** Makes the whole card a button. Omit for a static container. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  accessibilityLabel,
}) => {
  const body = (
    <>
      {children}
    </>
  );

  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    variant === 'flush' && styles.flush,
    variant === 'selected' && styles.selected,
    variant === 'inverted' && styles.inverted,
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        cardStyle,
        pressed && { opacity: theme.states.pressedOpacity },
      ]}
    >
      {body}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.palette.surface,
    borderRadius: theme.borderRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.chrome,
    padding: 14,
    ...theme.shadows.card,
  },
  flush: { padding: 6 },
  selected: {
    borderWidth: theme.sizes.borderEmphasis,
    borderColor: theme.palette.brand,
  },
  inverted: {
    backgroundColor: theme.palette.text.primary,
    borderColor: theme.palette.text.primary,
    borderRadius: theme.borderRadius.cardLarge,
  },
});
