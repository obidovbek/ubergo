/**
 * The offer form's text input and its select-looking sibling — T-101 step 16b.
 *
 * Both were repeated inline throughout the wizard (`styles.input`,
 * `styles.selectInput`, each with its own `inputError` variant). They are the
 * same control with one difference: `SelectField` opens something instead of
 * accepting keystrokes.
 *
 * ⚠️ The error look is `states.errorBorderColor`, defined once in `themes/`
 * because the artboards specify no error state at all (owner delegated it,
 * 2026-08-30). Do not invent a second red here.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  theme,
  typography,
  borderRadius,
  sizes,
  space,
  shadows,
  states,
} from '../../themes';

interface FormFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  numberOfLines?: number;
  invalid?: boolean;
  style?: TextStyle;
}

export const FormField: React.FC<FormFieldProps> = ({
  value,
  onChangeText,
  onBlur,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines,
  invalid = false,
  style,
}) => (
  <TextInput
    style={[
      styles.input,
      multiline && styles.textArea,
      invalid && styles.invalid,
      style,
    ]}
    value={value}
    onChangeText={onChangeText}
    onBlur={onBlur}
    placeholder={placeholder}
    placeholderTextColor={theme.palette.text.tertiary}
    keyboardType={keyboardType}
    multiline={multiline}
    numberOfLines={numberOfLines}
  />
);

interface SelectFieldProps {
  /** What the field currently reads. Falls back to `placeholder` when empty. */
  value?: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  invalid?: boolean;
  style?: ViewStyle;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  value,
  placeholder,
  onPress,
  disabled = false,
  invalid = false,
  style,
}) => (
  <TouchableOpacity
    style={[styles.select, invalid && styles.invalid, disabled && styles.disabled, style]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
    accessibilityRole="button"
  >
    <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={2}>
      {value || placeholder}
    </Text>
  </TouchableOpacity>
);

const base = {
  backgroundColor: theme.palette.surface,
  borderWidth: sizes.borderEmphasis,
  borderColor: theme.palette.borders.control,
  borderRadius: borderRadius.field,
  padding: space.xxl + 2,
  ...shadows.card,
} as const;

const styles = StyleSheet.create({
  input: {
    ...base,
    ...typography.placeLine,
    color: theme.palette.text.primary,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  select: {
    ...base,
    justifyContent: 'center',
    minHeight: sizes.buttonLg,
  },
  selectText: {
    ...typography.placeLine,
    color: theme.palette.text.primary,
  },
  selectPlaceholder: {
    color: theme.palette.text.tertiary,
  },
  invalid: {
    borderColor: states.errorBorderColor,
    borderWidth: states.focusRingWidth,
  },
  disabled: {
    opacity: states.disabledOpacity,
  },
});

export default FormField;
