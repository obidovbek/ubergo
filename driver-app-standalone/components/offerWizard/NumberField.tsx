/**
 * A money / count row of the offer form — T-101 step 16b.
 *
 * The screen's `numberField` helper, made a real component. Its parse, its group
 * formatting and its blur rule now live in `utils/offerWizardValidation.ts` where
 * `check-offer-validation.mjs` can execute them — this file is only the paint.
 *
 * 🔴 `allowZero` is load-bearing, not a convenience flag. `pickup_fee` and
 * `free_waiting_min` accept a real **0** ("free pickup", "no free minutes");
 * a salon price or a waiting RATE of 0 means the field was never filled in.
 * See `normalizeAmount` for why one line of difference carries two meanings.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme, typography, space } from '../../themes';
import { FormField } from './FormField';
import { formatAmount, normalizeAmount, parseAmount } from '../../utils/offerWizardValidation';

interface NumberFieldProps {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  helper?: string;
  error?: string;
  placeholder?: string;
  /** See the note above — this changes what a typed `0` means. */
  allowZero?: boolean;
  /**
   * A floor applied **on blur only** — the front-seat price may not sit below the
   * ordinary seat price.
   *
   * ⚠️ Blur, never keystroke. Clamping as the driver types turns the first digit of
   * "60000" into the whole floor and they can never finish the number.
   */
  clampMin?: number;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  helper,
  error,
  placeholder = '0',
  allowZero = false,
  clampMin,
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <FormField
      value={formatAmount(value)}
      placeholder={placeholder}
      keyboardType="numeric"
      invalid={!!error}
      onChangeText={(text) => onChange(parseAmount(text))}
      onBlur={() => {
        const normalized = normalizeAmount(value, { allowZero });
        onChange(
          normalized !== undefined && clampMin !== undefined && normalized < clampMin
            ? clampMin
            : normalized,
        );
      }}
    />
    {!!helper && <Text style={styles.helper}>{helper}</Text>}
    {!!error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  field: {
    marginBottom: space.xxxl,
  },
  label: {
    ...typography.rowLabel,
    color: theme.palette.text.primary,
    marginBottom: space.md,
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

export default NumberField;
