/**
 * "Mashina tanlash" — step 16b.
 *
 * ⚠️ The artboard lets the driver pick between several cars and add a new one
 * inline. **The driver profile holds exactly ONE vehicle**, so there is nothing
 * to pick between and no endpoint to add with (`docs/PLAN-T101-step16.md` §3 —
 * boarded, not built). This section therefore states the car rather than
 * choosing it, and says where to change it.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme, typography, borderRadius, space, sizes } from '../../themes';
import { SectionCard } from './SectionCard';

interface CarSectionProps {
  title: string;
  /** The profile's vehicle, or nothing if the driver has not filled one in. */
  vehicleLabel?: string;
  /** Shown when there is a car — "taken from your profile". */
  helper: string;
  /** Shown instead when there is none — "fill in your profile first". */
  emptyLabel: string;
  emptyHelper: string;
  error?: string;
}

export const CarSection: React.FC<CarSectionProps> = ({
  title,
  vehicleLabel,
  helper,
  emptyLabel,
  emptyHelper,
  error,
}) => (
  <SectionCard
    title={title}
    error={error}
    helper={vehicleLabel ? helper : emptyHelper}
  >
    <View style={[styles.card, !!error && styles.cardInvalid]}>
      <Text style={[styles.text, !vehicleLabel && styles.empty]}>
        {vehicleLabel || emptyLabel}
      </Text>
    </View>
  </SectionCard>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.palette.surface,
    borderWidth: sizes.borderEmphasis,
    borderColor: theme.palette.borders.control,
    borderRadius: borderRadius.field,
    padding: space.xxl + 2,
    justifyContent: 'center',
    minHeight: sizes.buttonLg,
  },
  cardInvalid: {
    borderColor: theme.palette.dangerText,
  },
  text: {
    ...typography.placeLine,
    color: theme.palette.text.primary,
  },
  empty: {
    color: theme.palette.text.tertiary,
  },
});

export default CarSection;
