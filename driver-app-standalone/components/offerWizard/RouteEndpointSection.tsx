/**
 * "Qayerdan:" / "Qayerga:" — one endpoint of the route. T-101 steps 16b + 16c.
 *
 * 🔴 STEP 16b REPLACED TWO IDENTICAL COPIES. The screen carried the from-block and
 * the to-block as 116 lines each; a normalising diff (`from`->X, `to`->X) showed them
 * to be byte-identical. Every fix to one had to be remembered for the other — the
 * single most repeated defect shape in this project.
 *
 * 🔴 STEP 16c THEN REPLACED THE CONTROL ITSELF. It was three stacked dropdowns
 * (mamlakat / viloyat / tuman), which is the cascade drawn as a form. The artboard
 * draws ONE tappable line per endpoint — a route dot, the eyebrow, and the resolved
 * place — with the cascade living in `GeoSheet`. That sheet already existed in this
 * app and this screen was one of the SEVEN places its own header lists as having
 * re-implemented the cascade by hand.
 *
 * The free-text fallback is deliberately kept: a driver who has not picked from the
 * tree can still type a place, exactly as before.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme, typography, borderRadius, space, sizes } from '../../themes';
import { SectionCard } from './SectionCard';
import { FormField } from './FormField';

interface RouteEndpointSectionProps {
  /** The eyebrow — "Qayerdan:" or "Qayerga:". */
  title: string;
  /**
   * Which end of the route this is. Only the dot differs: the artboard draws the
   * origin as a hollow ring and the destination as a ring with a filled centre, so
   * the rail reads as a direction rather than two identical bullets. `stop` is a
   * third, quieter ring — the artboard draws no stops, but the screen has them.
   */
  variant: 'from' | 'to' | 'stop';
  /** The resolved place — "Farg'ona t., Farg'ona viloyati, O'zbekiston". */
  line?: string;
  placeholder: string;
  /** Opens the `GeoSheet` for this endpoint. */
  onPress: () => void;
  /** Free text, offered only while nothing has been picked from the geo tree. */
  text?: string;
  onChangeText: (text: string) => void;
  freeTextPlaceholder: string;
  error?: string;
}

export const RouteEndpointSection: React.FC<RouteEndpointSectionProps> = ({
  title,
  variant,
  line,
  placeholder,
  onPress,
  text,
  onChangeText,
  freeTextPlaceholder,
  error,
}) => (
  <SectionCard error={error}>
    <TouchableOpacity
      style={[styles.row, !!error && styles.rowInvalid]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${title} ${line || placeholder}`}
    >
      <View style={styles.rail}>
        <View style={[styles.dot, variant === 'stop' && styles.dotStop]}>
          {variant === 'to' && <View style={styles.dotCore} />}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>{title}</Text>
        <Text style={[styles.line, !line && styles.linePlaceholder]} numberOfLines={3}>
          {line || placeholder}
        </Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>

    {/*
      The typed fallback. It disappears the moment the tree has an answer, because
      two places claiming to be the same endpoint is how `from_text` and the geo
      selection drift apart — and `resolveLocationText` would then silently prefer
      the tree, discarding what the driver typed without telling them.
    */}
    {!line && (
      <FormField
        style={styles.freeText}
        value={text || ''}
        placeholder={freeTextPlaceholder}
        invalid={!!error}
        onChangeText={onChangeText}
      />
    )}
  </SectionCard>
);

/** The artboard's ⇅ between the two endpoints. */
export const RouteSwapButton: React.FC<{ onPress: () => void; label: string }> = ({
  onPress,
  label,
}) => (
  <View style={styles.swapRow}>
    <View style={styles.swapRule} />
    <TouchableOpacity
      style={styles.swap}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.swapGlyph}>⇅</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.xl,
    padding: space.xl,
    borderRadius: 15,
    backgroundColor: theme.palette.surface,
    borderWidth: sizes.borderHairline,
    borderColor: theme.palette.borders.control,
  },
  rowInvalid: {
    borderColor: theme.palette.dangerText,
    borderWidth: sizes.borderEmphasis,
  },
  rail: {
    width: 22,
    alignItems: 'center',
    paddingTop: space.xs,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    borderWidth: 3,
    borderColor: theme.palette.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // An intermediate stop is not an endpoint: a thinner, quieter ring, so the two
  // ends of the route stay the things the eye finds first.
  dotStop: {
    borderWidth: 2,
    borderColor: theme.palette.borders.emphasis,
    width: 14,
    height: 14,
  },
  dotCore: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: theme.palette.action,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: theme.palette.text.tertiary,
    textTransform: 'uppercase',
  },
  line: {
    ...typography.placeLine,
    color: theme.palette.text.primary,
    lineHeight: 20,
  },
  linePlaceholder: {
    color: theme.palette.text.tertiary,
  },
  chevron: {
    ...typography.cardTitle,
    color: theme.palette.text.chevron,
    paddingTop: space.md,
  },
  freeText: {
    marginTop: space.md,
  },

  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: space.lg,
    marginBottom: 24,
  },
  swapRule: {
    flex: 1,
    height: sizes.borderHairline,
    backgroundColor: theme.palette.borders.chrome,
  },
  swap: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: borderRadius.md,
    backgroundColor: theme.palette.ground,
    borderWidth: sizes.borderHairline,
    borderColor: theme.palette.borders.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapGlyph: {
    ...typography.rowLabel,
    color: theme.palette.text.primary,
  },
});

export default RouteEndpointSection;
