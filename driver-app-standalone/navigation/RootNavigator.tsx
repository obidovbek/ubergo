/**
 * Root Navigator
 * Main navigation entry point with authentication routing
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { MainNavigator } from './MainNavigator';
import { AuthNavigator } from './AuthNavigator';
import { ProfileCompletionNavigator } from './ProfileCompletionNavigator';
import { BlockedScreen } from '../screens/BlockedScreen';
import { SplashScreen } from '../components/SplashScreen';
import { getDriverProfileStatus } from '../api/driver';
import { subscribeDriverProfileChanged } from '../utils/driverProfileEvents';
import * as AuthAPI from '../api/auth';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoading, token, logout, updateUser } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [driverProfileComplete, setDriverProfileComplete] = useState(false);
  const [userStatus, setUserStatus] = useState<string | undefined>((user as any)?.status);
  const navigationRef = useNavigationContainerRef();
  // The check writes the user object (via updateUser), so a second call arriving while
  // one is running would re-enter through its own re-render. Let the first one finish.
  const checkInFlightRef = useRef(false);

  const currentStatus = (user as any)?.status;

  // Update userStatus state when user object changes
  useEffect(() => {
    if (currentStatus !== userStatus) {
      console.log('RootNavigator: User status changed from', userStatus, 'to', currentStatus);
      setUserStatus(currentStatus);
    }
  }, [currentStatus, userStatus]);

  console.log('RootNavigator: Auth state:', { isAuthenticated, user: user?.id, isLoading, userStatus: currentStatus });

  // Function to check driver profile status and refresh user data
  const checkDriverProfile = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setDriverProfileComplete(false);
      return;
    }

    if (checkInFlightRef.current) {
      console.log('RootNavigator: Driver profile check already running, skipping');
      return;
    }
    checkInFlightRef.current = true;

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
      checkInFlightRef.current = false;
      setCheckingProfile(false);
    }
  }, [isAuthenticated, token, logout, updateUser]);

  // Re-check when the AUTH IDENTITY changes — and only then.
  //
  // Deliberately NOT keyed on the `user` object or on `user.profile_complete` (T-017):
  // the check itself calls `updateUser()`, so any dep derived from the user object
  // re-triggers the very effect that produced it. That was an infinite loop —
  // two API calls and a splash-screen flash per iteration, until the server
  // rate-limited the app. `profile_complete` was also the wrong signal: it belongs to
  // the *user* record and is already `true` for drivers with an empty driver profile.
  useEffect(() => {
    if (isAuthenticated && token && user?.id) {
      console.log('RootNavigator: Auth changed, checking driver profile...', { userId: user.id });
      checkDriverProfile();
    } else {
      setDriverProfileComplete(false);
    }
  }, [isAuthenticated, token, user?.id, checkDriverProfile]);

  // A registration screen just saved a step that may have completed the profile.
  // This is the explicit replacement for the old `profile_complete` watcher.
  useEffect(() => subscribeDriverProfileChanged(checkDriverProfile), [checkDriverProfile]);

  // Profile status is checked:
  // 1. When the auth identity changes (effect above)
  // 2. When a registration screen calls notifyDriverProfileChanged()
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

    // Check user status (fall back to the state copy in case the user object lags)
    const currentUserStatus = currentStatus || userStatus;
    console.log('RootNavigator: Checking user status:', {
      currentUserStatus,
      userStatusState: userStatus,
      user: user ? { id: user.id, status: currentStatus } : null
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

