/**
 * Gender Pick Sheet
 * Two-button sheet the seat steppers open: which seat is being added or freed,
 * a man's or a woman's. (Figma: the seat boxes carry a male/female icon.)
 *
 * T-036: the chrome moved to the shared `AppModal`; only the two buttons live here.
 * Public props unchanged — `SeatStepper` did not have to move.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from '../AppModal';
import { useTranslation } from '../../hooks/useTranslation';
import { createTheme } from '../../themes';

const theme = createTheme('light');
const m = theme.modal;

export type SeatGender = 'male' | 'female';

interface GenderPickSheetProps {
  visible: boolean;
  title: string;
  /** Genders with a zero count are not offered when removing. */
  available?: SeatGender[];
  onPick: (gender: SeatGender) => void;
  onClose: () => void;
}

export const GenderPickSheet: React.FC<GenderPickSheetProps> = ({
  visible,
  title,
  available = ['male', 'female'],
  onPick,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={title}
      actions={[{ label: t('common.cancel'), onPress: onClose, variant: 'cancel' }]}
    >
      <View style={styles.buttons}>
        {available.includes('male') && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => onPick('male')}
            activeOpacity={0.8}
          >
            <Ionicons name="man" size={30} color="#1D4ED8" />
            <Text style={styles.buttonText}>{t('passengerOffers.male')}</Text>
          </TouchableOpacity>
        )}

        {available.includes('female') && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => onPick('female')}
            activeOpacity={0.8}
          >
            <Ionicons name="woman" size={30} color="#BE185D" />
            <Text style={styles.buttonText}>{t('passengerOffers.female')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 96,
    backgroundColor: m.row,
    borderRadius: m.rowRadius,
    borderWidth: m.borderWidth,
    borderColor: m.border,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: m.rowText,
  },
});

export default GenderPickSheet;
