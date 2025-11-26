/**
 * Root Navigator
 * Main navigation entry point with authentication routing
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { MainNavigator } from './MainNavigator';
import { AuthNavigator } from './AuthNavigator';
import { ProfileCompletionNavigator } from './ProfileCompletionNavigator';
import { SplashScreen } from '../components/SplashScreen';
import { getDriverProfileStatus } from '../api/driver';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoading, token } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [driverProfileComplete, setDriverProfileComplete] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigationRef = useNavigationContainerRef();

  console.log('RootNavigator: Auth state:', { isAuthenticated, user: user?.id, isLoading });

  // Function to check driver profile status
  const checkDriverProfile = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setDriverProfileComplete(false);
      return;
    }

    try {
      setCheckingProfile(true);
      console.log('RootNavigator: Checking driver profile status...');
      
      const status = await getDriverProfileStatus(token);
      console.log('RootNavigator: Driver profile status:', status);
      
      setDriverProfileComplete(status.isComplete);
    } catch (error) {
      console.error('RootNavigator: Failed to check driver profile:', error);
      // If API fails, assume profile is incomplete to be safe
      setDriverProfileComplete(false);
    } finally {
      setCheckingProfile(false);
    }
  }, [isAuthenticated, token]);

  // Check driver profile status when authenticated, when refresh is triggered, or when user changes
  useEffect(() => {
    checkDriverProfile();
  }, [checkDriverProfile, refreshTrigger, user]);

  // Profile status is checked:
  // 1. On initial mount (useEffect above)
  // 2. After taxi license submission (DriverTaxiLicenseScreen calls checkDriverProfileStatus)
  // No polling needed - prevents unnecessary API calls

  // Show splash screen while checking auth state or profile
  if (isLoading || checkingProfile) {
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

    // User is authenticated, check if driver profile is complete
    if (!driverProfileComplete) {
      // Driver profile is incomplete, show profile completion screens
      console.log('RootNavigator: Driver profile incomplete, showing ProfileCompletionNavigator');
      return <ProfileCompletionNavigator />;
    }

    // Profile is complete, show main app
    console.log('RootNavigator: Driver profile complete, showing MainNavigator');
    return <MainNavigator />;
  };

  return (
    <NavigationContainer ref={navigationRef}>
      {getNavigator()}
    </NavigationContainer>
  );
};

