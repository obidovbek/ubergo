/**
 * Empty State Component
 * Display when there's no data to show
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createTheme } from '../../themes';
import { Button } from '../Button';

const theme = createTheme('light');

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
  icon: {
    fontSize: 64,
    marginBottom: theme.spacing(2),
  },
  title: {
    ...theme.typography.h4,
    color: theme.palette.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing(1),
  },
  description: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing(3),
  },
  button: {
    marginTop: theme.spacing(2),
  },
});

