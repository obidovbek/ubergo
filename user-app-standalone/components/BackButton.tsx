/**
 * BackButton (T-071)
 *
 * One back button for the whole app.
 *
 * 🔴 Before this there were TWO families across the two apps — 24 call sites, 14
 * of them a bare `<Text>←</Text>` and 10 an `Ionicons arrow-back` — and they did
 * not merely look different:
 *   - the text arrow **scales with the user's system font size**, which is the
 *     T-050 overflow class; an `Ionicons` at `size={24}` does not;
 *   - several text copies were rendered in green `#10B981` at 24px against the
 *     reference's dark `#111827` icon;
 *   - the tap targets ranged from `padding: 8` to a 40×40 box.
 *
 * The shape here is the owner's chosen reference: the passenger app's
 * "search ride" screen (`SearchOffersScreen`) — a 40×40 white rounded tile with
 * a soft shadow and a dark `arrow-back` glyph.
 *
 * ⚠️ Byte-identical to the driver app's copy, deliberately — the same convention
 * as the shared modal components (T-036). Change both or neither.
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BackButtonProps {
  onPress: () => void;
  /** Extra layout (margins, alignment) — never re-style the tile itself. */
  style?: StyleProp<ViewStyle>;
  /**
   * Drop the white tile and show only the glyph. For headers that already sit on
   * a white surface, where the tile would be invisible anyway.
   */
  plain?: boolean;
  /** Overrides the glyph colour. Defaults to the reference's `#111827`. */
  color?: string;
  /**
   * Blocks going back — used by the registration screens while a save is in
   * flight, where leaving mid-request would strand the form.
   */
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  style,
  plain = false,
  color = '#111827',
  disabled = false,
  accessibilityLabel,
}) => (
  <TouchableOpacity
    style={[styles.button, plain && styles.plain, disabled && styles.disabled, style]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    accessibilityLabel={accessibilityLabel ?? 'Back'}
    // A 40×40 tile is already at the 44pt guideline; this widens the tap area
    // without changing the layout.
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  >
    <Ionicons name="arrow-back" size={24} color={color} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  plain: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.4,
  },
});
