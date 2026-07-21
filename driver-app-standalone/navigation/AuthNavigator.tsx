/**
 * Auth Navigator - Driver App
 * Stack navigation for driver authentication screens
 */

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { PhoneRegistrationScreen } from '../screens/PhoneRegistrationScreen';
import { OTPVerificationScreen } from '../screens/OTPVerificationScreen';
import { RegisterFirstScreen } from '../screens/RegisterFirstScreen';
import { DriverDetailsScreen } from '../screens/DriverDetailsScreen';
import { DriverPersonalInfoScreen } from '../screens/DriverPersonalInfoScreen';
import { DriverPassportScreen } from '../screens/DriverPassportScreen';
import { DriverLicenseScreen } from '../screens/DriverLicenseScreen';
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

  const resumeOtp = !!(pendingOtp && (pendingOtp.phone || pendingOtp.userId));

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
        name="RegisterFirst"
        component={RegisterFirstScreen}
        options={{ title: 'Register First' }}
      />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen}
        options={{ title: 'OTP Verification' }}
        initialParams={
          resumeOtp
            ? { phoneNumber: pendingOtp!.phone, userId: pendingOtp!.userId }
            : undefined
        }
      />
      <Stack.Screen
        name="DriverDetails"
        component={DriverDetailsScreen}
        options={{ title: 'Driver Details' }}
      />
      <Stack.Screen
        name="DriverPersonalInfo"
        component={DriverPersonalInfoScreen}
        options={{ title: 'Personal Information' }}
      />
      <Stack.Screen
        name="DriverPassport"
        component={DriverPassportScreen}
        options={{ title: 'Passport Information' }}
      />
      <Stack.Screen
        name="DriverLicense"
        component={DriverLicenseScreen}
        options={{ title: 'License Information' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Login' }}
      />
    </Stack.Navigator>
  );
};
