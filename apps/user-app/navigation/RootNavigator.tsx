/**
 * Root Navigator
 * Main navigation entry point with authentication routing
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { MainNavigator } from './MainNavigator';
import { AuthNavigator } from './AuthNavigator';
import { ProfileCompletionNavigator } from './ProfileCompletionNavigator';
import { createTheme } from '../themes';

const theme = createTheme('light');

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  console.log('RootNavigator: Auth state:', { isAuthenticated, user: user?.id, isLoading });

  // Show loading indicator while checking auth state
  if (isLoading) {
    console.log('RootNavigator: Showing loading indicator');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.palette.secondary.main} />
      </View>
    );
  }

  // Determine which navigator to show
  const getNavigator = () => {
    if (!isAuthenticated) {
      // User is not authenticated, show auth screens
      console.log('RootNavigator: User not authenticated, showing AuthNavigator');
      return <AuthNavigator />;
    }

    // User is authenticated, check if profile is complete
    const profileComplete = (user as any)?.profile_complete !== false;
    
    if (!profileComplete) {
      // Profile is incomplete, show profile completion screen
      console.log('RootNavigator: Profile incomplete, showing ProfileCompletionNavigator');
      return <ProfileCompletionNavigator />;
    }

    // Profile is complete, show main app
    console.log('RootNavigator: Profile complete, showing MainNavigator');
    return <MainNavigator />;
  };

  return (
    <NavigationContainer>
      {getNavigator()}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.background.default,
  },
});

