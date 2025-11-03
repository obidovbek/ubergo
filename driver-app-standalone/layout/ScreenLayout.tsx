/**
 * Screen Layout
 * Base layout component for screens
 */

import React, { ReactNode } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { createTheme } from '../themes';

const theme = createTheme('light');

interface ScreenLayoutProps {
  children: ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  padding?: boolean;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  scrollable = true,
  keyboardAvoiding = false,
  padding = true,
}) => {
  const content = scrollable ? (
    <ScrollView
      style={[styles.scrollView, padding && styles.padding]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.view, padding && styles.padding]}>{children}</View>
  );

  const layout = keyboardAvoiding ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return <SafeAreaView style={styles.container}>{layout}</SafeAreaView>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  view: {
    flex: 1,
  },
  padding: {
    padding: theme.spacing(2),
  },
});

