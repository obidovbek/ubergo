/**
 * Main Layout
 * Primary layout wrapper for authenticated screens
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { createTheme } from '../themes';

const theme = createTheme('light');

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
  },
});

