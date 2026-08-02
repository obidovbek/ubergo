/**
 * Seat Stepper ("old o'rindiq" / "orqa o'rindiq")
 *
 * One row of the Figma seat picker: the seats of that row drawn as boxes
 * (filled ones carry a male/female icon), then a − count + stepper.
 * "+" always asks which gender; "−" only asks when both are present.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';
import { GenderPickSheet, type SeatGender } from './GenderPickSheet';

export interface SeatRowCounts {
  male: number;
  female: number;
}

interface SeatStepperProps {
  label: string;
  counts: SeatRowCounts;
  /** How many seats this row physically has (Figma: 1 front, 3 back). */
  capacity: number;
  disabled?: boolean;
  onChange: (counts: SeatRowCounts) => void;
}

export const SeatStepper: React.FC<SeatStepperProps> = ({
  label,
  counts,
  capacity,
  disabled = false,
  onChange,
}) => {
  const { t } = useTranslation();
  const [sheet, setSheet] = useState<'add' | 'remove' | null>(null);

  const total = counts.male + counts.female;

  const handleAdd = () => {
    if (disabled || total >= capacity) return;
    setSheet('add');
  };

  const handleRemove = () => {
    if (disabled || total === 0) return;

    // Only ambiguous when the row holds both a man and a woman
    if (counts.male > 0 && counts.female > 0) {
      setSheet('remove');
      return;
    }
    onChange(counts.male > 0 ? { ...counts, male: counts.male - 1 } : { ...counts, female: counts.female - 1 });
  };

  const handlePick = (gender: SeatGender) => {
    if (sheet === 'add') {
      onChange({ ...counts, [gender]: counts[gender] + 1 });
    } else if (counts[gender] > 0) {
      onChange({ ...counts, [gender]: counts[gender] - 1 });
    }
    setSheet(null);
  };

  // Occupied seats first (men, then women), the rest drawn empty
  const seats: (SeatGender | null)[] = [
    ...Array<SeatGender>(counts.male).fill('male'),
    ...Array<SeatGender>(counts.female).fill('female'),
    ...Array<null>(Math.max(0, capacity - total)).fill(null),
  ].slice(0, Math.max(capacity, total));

  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.seats}>
        {seats.map((gender, index) => (
          <View
            key={`${label}-${index}`}
            style={[
              styles.seat,
              gender === 'male' && styles.seatMale,
              gender === 'female' && styles.seatFemale,
            ]}
          >
            {gender && (
              <Ionicons
                name={gender === 'male' ? 'man' : 'woman'}
                size={18}
                color={gender === 'male' ? '#1D4ED8' : '#BE185D'}
              />
            )}
          </View>
        ))}
      </View>

      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.stepperButton, (disabled || total === 0) && styles.stepperButtonOff]}
          onPress={handleRemove}
          disabled={disabled || total === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={18} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.count}>{total}</Text>

        <TouchableOpacity
          style={[styles.stepperButton, (disabled || total >= capacity) && styles.stepperButtonOff]}
          onPress={handleAdd}
          disabled={disabled || total >= capacity}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color="#111827" />
        </TouchableOpacity>
      </View>

      <GenderPickSheet
        visible={sheet !== null}
        title={
          sheet === 'remove'
            ? t('passengerOffers.genderRemoveTitle')
            : t('passengerOffers.genderAddTitle')
        }
        available={
          sheet === 'remove'
            ? ([counts.male > 0 && 'male', counts.female > 0 && 'female'].filter(
                Boolean
              ) as SeatGender[])
            : ['male', 'female']
        }
        onPick={handlePick}
        onClose={() => setSheet(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    gap: 8,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  seats: {
    flexDirection: 'row',
    gap: 4,
  },
  seat: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatMale: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  seatFemale: {
    backgroundColor: '#FCE7F3',
    borderColor: '#F9A8D4',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonOff: {
    opacity: 0.4,
  },
  count: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
});

export default SeatStepper;
