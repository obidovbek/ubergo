/**
 * Auth Navigator - Driver App
 * Stack navigation for driver authentication screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { PhoneRegistrationScreen } from '../screens/PhoneRegistrationScreen';
import { OTPVerificationScreen } from '../screens/OTPVerificationScreen';
import { DriverDetailsScreen } from '../screens/DriverDetailsScreen';
import { DriverPersonalInfoScreen } from '../screens/DriverPersonalInfoScreen';
import { DriverPassportScreen } from '../screens/DriverPassportScreen';
import { DriverLicenseScreen } from '../screens/DriverLicenseScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator: React.FC = () => {
  console.log('AuthNavigator: Rendering driver screens:', [
    'PhoneRegistration',
    'OTPVerification', 
    'DriverDetails',
    'DriverPersonalInfo',
    'DriverPassport',
    'DriverLicense',
    'Login'
  ]);
  
  return (
    <Stack.Navigator
      initialRouteName="PhoneRegistration"
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

