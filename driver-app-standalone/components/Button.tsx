/**
 * Button Component
 * Reusable button component with variants
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { createTheme } from '../themes';

const theme = createTheme('light');

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    const sizeStyle = styles[`button_${size}`];
    const variantStyle = styles[`button_${variant}`];
    
    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...(disabled && styles.button_disabled),
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = styles.text;
    const sizeStyle = styles[`text_${size}`];
    const variantStyle = styles[`text_${variant}`];
    
    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...(disabled && styles.text_disabled),
      ...textStyle,
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outlined' || variant === 'text' 
            ? theme.palette.primary.main 
            : theme.palette.primary.contrastText
          }
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  button_small: {
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(2),
  },
  button_medium: {
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(3),
  },
  button_large: {
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(4),
  },
  button_primary: {
    backgroundColor: theme.palette.primary.main,
  },
  button_secondary: {
    backgroundColor: theme.palette.secondary.main,
  },
  button_outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.palette.primary.main,
  },
  button_text: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  button_disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  text_small: {
    ...theme.typography.body2,
  },
  text_medium: {
    ...theme.typography.body1,
  },
  text_large: {
    ...theme.typography.h5,
  },
  text_primary: {
    color: theme.palette.primary.contrastText,
  },
  text_secondary: {
    color: theme.palette.secondary.contrastText,
  },
  text_outlined: {
    color: theme.palette.primary.main,
  },
  text_text: {
    color: theme.palette.primary.main,
  },
  text_disabled: {
    color: theme.palette.text.disabled,
  },
});

