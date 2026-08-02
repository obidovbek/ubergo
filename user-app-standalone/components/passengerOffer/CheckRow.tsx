/**
 * Check / radio row in the Figma style of the order screen:
 * a square (checkbox) or round (radio) box followed by "-label".
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckRowProps {
  label: string;
  checked: boolean;
  onPress: () => void;
  /** Radios are drawn round; both stay deselectable (owner spec). */
  shape?: 'check' | 'radio';
  disabled?: boolean;
  /** The Figma prints a few labels in red (pitak, "qo'shimcha ma'lumot"). */
  emphasis?: 'normal' | 'danger';
  style?: object;
}

export const CheckRow: React.FC<CheckRowProps> = ({
  label,
  checked,
  onPress,
  shape = 'check',
  disabled = false,
  emphasis = 'normal',
  style,
}) => (
  <TouchableOpacity
    style={[styles.row, disabled && styles.rowDisabled, style]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <View
      style={[
        styles.box,
        shape === 'radio' && styles.boxRadio,
        checked && (shape === 'radio' ? styles.boxRadioChecked : styles.boxChecked),
        disabled && styles.boxDisabled,
      ]}
    >
      {checked && (
        <Ionicons
          name={shape === 'radio' ? 'ellipse' : 'checkmark'}
          size={shape === 'radio' ? 12 : 16}
          color={shape === 'radio' ? '#059669' : '#FFFFFF'}
        />
      )}
    </View>

    <Text
      style={[
        styles.label,
        emphasis === 'danger' && styles.labelDanger,
        disabled && styles.labelDisabled,
      ]}
    >
      -{label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 4,
    gap: 8,
    flexShrink: 1,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  box: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: '#111827',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  boxRadio: {
    borderRadius: 12,
    borderColor: '#9CA3AF',
    backgroundColor: '#E5E7EB',
  },
  boxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  boxRadioChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#059669',
  },
  boxDisabled: {
    borderColor: '#D1D5DB',
  },
  label: {
    flexShrink: 1,
    fontSize: 15,
    color: '#111827',
  },
  labelDanger: {
    color: '#DC2626',
    fontWeight: '600',
  },
  labelDisabled: {
    color: '#9CA3AF',
  },
});

export default CheckRow;
