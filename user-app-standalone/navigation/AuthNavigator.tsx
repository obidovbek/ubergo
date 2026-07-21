/**
 * Auth Navigator
 * Stack navigation for authentication screens
 */

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { PhoneRegistrationScreen } from '../screens/PhoneRegistrationScreen';
import { OTPVerificationScreen } from '../screens/OTPVerificationScreen';
import { UserDetailsScreen } from '../screens/UserDetailsScreen';
import { SplashScreen } from '../components/SplashScreen';
import { loadPendingOtp, PendingOtp } from '../utils/pendingOtp';

const Stack = createNativeStackNavigator();

export const AuthNavigator: React.FC = () => {
  // If the app was killed while the user was on the OTP step, resume there (OR-001)
  // instead of flashing the phone-registration ("main menu") screen.
  const [ready, setReady] = useState(false);
  const [pendingOtp, setPendingOtp] = useState<PendingOtp | null>(null);

  useEffect(() => {
    let mounted = true;
    loadPendingOtp().then((pending) => {
      if (mounted) {
        setPendingOtp(pending);
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    // Brief wait while we check for an in-progress OTP; avoids a "main menu" flash.
    return <SplashScreen />;
  }

  const resumeOtp = !!(pendingOtp && pendingOtp.phone);

  return (
    <Stack.Navigator
      initialRouteName={resumeOtp ? 'OTPVerification' : 'PhoneRegistration'}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="PhoneRegistration"
        component={PhoneRegistrationScreen}
        options={{ title: 'Phone Registration' }}
      />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen}
        options={{ title: 'OTP Verification' }}
        initialParams={resumeOtp ? { phoneNumber: pendingOtp!.phone } : undefined}
      />
      <Stack.Screen
        name="UserDetails"
        component={UserDetailsScreen}
        options={{ title: 'User Details' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Login' }}
      />
    </Stack.Navigator>
  );
};
