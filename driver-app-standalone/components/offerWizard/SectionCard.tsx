/**
 * One section of the offer form — T-101 step 16b.
 *
 * `DriverElon.dc.html` draws every block the same way: a small uppercase mono
 * eyebrow ("QAYERDAN:", "TO'LOV TURI", "NARXLAR") and the controls under it.
 * The wizard's old `inputGroup` + `label` pair was a 15px bold sans label, which
 * is a different thing entirely — so this is the repaint, not a rename.
 *
 * ⚠️ `typography.eyebrow` is the artboard's measurement (10px mono 600, 1.0
 * tracking, always `text.tertiary`). Do not restyle it per section: the eyebrow
 * repeating identically is what makes the long scroll readable.
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { theme, typography, space } from '../../themes';

interface SectionCardProps {
  /** The eyebrow. Uppercased by the style, so pass it in normal case. */
  title?: string;
  children: React.ReactNode;
  /** Shown under the children in `dangerText` — the section's validation error. */
  error?: string;
  /** Shown under the children in `text.secondary`. */
  helper?: string;
  style?: ViewStyle;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  error,
  helper,
  style,
}) => (
  <View style={[styles.section, style]}>
    {!!title && <Text style={styles.eyebrow}>{title}</Text>}
    {children}
    {!!helper && <Text style={styles.helper}>{helper}</Text>}
    {!!error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: theme.palette.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: space.lg,
  },
  helper: {
    ...typography.helper,
    color: theme.palette.text.secondary,
    marginTop: space.sm,
  },
  error: {
    ...typography.caption,
    color: theme.palette.dangerText,
    marginTop: space.sm,
  },
});

export default SectionCard;
