/**
 * Loading Spinner Component
 * Extended loading component with custom styling and multilingual support
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { createTheme } from '../../themes';
import { useTranslation } from '../../hooks/useTranslation';

const theme = createTheme('light');

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  useTranslation?: boolean;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = theme.palette.secondary.main,
  message,
  useTranslation: useTranslationProp = false,
  fullScreen = false,
}) => {
  const { t } = useTranslation();
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;
  
  const displayMessage = useTranslationProp && !message 
    ? t('common.loading') 
    : message;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {displayMessage && <Text style={styles.message}>{displayMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.background.default,
  },
  message: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(2),
  },
});

