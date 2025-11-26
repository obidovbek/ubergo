/**
 * Root Navigator
 * Main navigation entry point with authentication routing
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { MainNavigator } from './MainNavigator';
import { AuthNavigator } from './AuthNavigator';
import { ProfileCompletionNavigator } from './ProfileCompletionNavigator';
import { BlockedScreen } from '../screens/BlockedScreen';
import { SplashScreen } from '../components/SplashScreen';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  console.log('RootNavigator: Auth state:', { isAuthenticated, user: user?.id, isLoading });

  // Show splash screen while checking auth state
  if (isLoading) {
    console.log('RootNavigator: Showing splash screen');
    return <SplashScreen />;
  }

  // Determine which navigator to show
  const getNavigator = () => {
    if (!isAuthenticated) {
      // User is not authenticated, show auth screens
      console.log('RootNavigator: User not authenticated, showing AuthNavigator');
      return <AuthNavigator />;
    }

    // Check user status
    const userStatus = (user as any)?.status;
    if (userStatus === 'blocked' || userStatus === 'pending_delete') {
      // User is blocked or pending deletion, show blocked screen
      console.log('RootNavigator: User status is', userStatus, ', showing BlockedScreen');
      return <BlockedScreen />;
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

