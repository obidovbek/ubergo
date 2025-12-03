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
import { BlockedScreen } from '../screens/BlockedScreen';
import { SplashScreen } from '../components/SplashScreen';
import { getDriverProfileStatus } from '../api/driver';
import * as AuthAPI from '../api/auth';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoading, token, logout, updateUser } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [driverProfileComplete, setDriverProfileComplete] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userStatus, setUserStatus] = useState<string | undefined>((user as any)?.status);
  const navigationRef = useNavigationContainerRef();

  // Update userStatus state when user object changes
  useEffect(() => {
    const currentStatus = (user as any)?.status;
    if (currentStatus !== userStatus) {
      console.log('RootNavigator: User status changed from', userStatus, 'to', currentStatus);
      setUserStatus(currentStatus);
    }
  }, [(user as any)?.status, user]);

  console.log('RootNavigator: Auth state:', { isAuthenticated, user: user?.id, isLoading, userStatus: (user as any)?.status });

  // Function to check driver profile status and refresh user data
  const checkDriverProfile = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setDriverProfileComplete(false);
      return;
    }

    try {
      setCheckingProfile(true);
      console.log('RootNavigator: Checking driver profile status...');
      
      // Refresh user data from server to get latest status (in case admin changed the driver status)
      try {
        const currentUserResponse = await AuthAPI.getCurrentUser(token);
        
        // Handle different response formats
        let serverUser = null;
        if (currentUserResponse.data) {
          serverUser = currentUserResponse.data;
        } else if (currentUserResponse.user) {
          serverUser = currentUserResponse.user;
        } else if (currentUserResponse.id) {
          // Response is the user object directly
          serverUser = currentUserResponse;
        }
        
        if (serverUser) {
          console.log('RootNavigator: Refreshed user data from server:', { 
            id: serverUser.id, 
            status: serverUser.status,
            previousStatus: (user as any)?.status
          });
          // Update user in context with latest status (this also updates AsyncStorage)
          await updateUser(serverUser);
          // Update local status state immediately to trigger re-evaluation
          setUserStatus(serverUser.status);
        } else {
          console.warn('RootNavigator: Unexpected response format from getCurrentUser');
        }
      } catch (userError) {
        console.warn('RootNavigator: Failed to refresh user data, continuing with existing user:', userError);
        // Continue with existing user if refresh fails
      }
      
      const status = await getDriverProfileStatus(token);
      console.log('RootNavigator: Driver profile status:', status);
      
      setDriverProfileComplete(status.isComplete);
    } catch (error: any) {
      console.error('RootNavigator: Failed to check driver profile:', error);
      
      // Check if error is 401 (Unauthorized) - user was deleted or token is invalid
      const statusCode = error?.response?.status || error?.status;
      if (statusCode === 401) {
        console.log('RootNavigator: 401 error detected - user deleted or token invalid, logging out...');
        // Logout user to clear token and redirect to AuthNavigator
        try {
          await logout();
        } catch (logoutError) {
          console.error('RootNavigator: Failed to logout:', logoutError);
        }
        return;
      }
      
      // For other errors, assume profile is incomplete to be safe
      setDriverProfileComplete(false);
    } finally {
      setCheckingProfile(false);
    }
  }, [isAuthenticated, token, logout, updateUser]);

  // Check driver profile status when authenticated, when refresh is triggered, or when user changes
  useEffect(() => {
    if (isAuthenticated && token) {
      checkDriverProfile();
    }
  }, [isAuthenticated, token, refreshTrigger]);
  
  // Also check when user profile_complete changes (to handle profile completion)
  useEffect(() => {
    if (isAuthenticated && token && user) {
      const profileComplete = (user as any)?.profile_complete;
      console.log('RootNavigator: User profile_complete changed:', profileComplete);
      // Re-check profile status when profile_complete flag changes
      // This ensures navigation switches when profile is marked as complete
      if (profileComplete === true) {
        checkDriverProfile();
      }
    }
  }, [(user as any)?.profile_complete, user?.id, isAuthenticated, token, checkDriverProfile]); // Trigger when profile_complete or user ID changes

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

    // Check user status (use state variable to ensure we have latest value)
    const currentUserStatus = (user as any)?.status || userStatus;
    console.log('RootNavigator: Checking user status:', { 
      currentUserStatus, 
      userStatusState: userStatus,
      user: user ? { id: user.id, status: (user as any)?.status } : null 
    });
    
    if (currentUserStatus === 'blocked' || currentUserStatus === 'pending_delete') {
      // User is blocked or pending deletion, show blocked screen
      console.log('RootNavigator: User status is', currentUserStatus, ', showing BlockedScreen');
      return <BlockedScreen />;
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

