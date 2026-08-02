/**
 * Gender Pick Sheet
 * Two-button sheet the seat steppers open: which seat is being added or freed,
 * a man's or a woman's. (Figma: the seat boxes carry a male/female icon.)
 */

import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';

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
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.buttons}>
            {available.includes('male') && (
              <TouchableOpacity
                style={[styles.button, styles.buttonMale]}
                onPress={() => onPick('male')}
                activeOpacity={0.8}
              >
                <Ionicons name="man" size={28} color="#1D4ED8" />
                <Text style={styles.buttonText}>{t('passengerOffers.male')}</Text>
              </TouchableOpacity>
            )}

            {available.includes('female') && (
              <TouchableOpacity
                style={[styles.button, styles.buttonFemale]}
                onPress={() => onPick('female')}
                activeOpacity={0.8}
              >
                <Ionicons name="woman" size={28} color="#BE185D" />
                <Text style={styles.buttonText}>{t('passengerOffers.female')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  buttonMale: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  buttonFemale: {
    backgroundColor: '#FDF2F8',
    borderColor: '#F9A8D4',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cancel: {
    marginTop: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#6B7280',
  },
});

export default GenderPickSheet;
