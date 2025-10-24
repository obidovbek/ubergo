/**
 * Auth Navigator
 * Stack navigation for authentication screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { PhoneRegistrationScreen } from '../screens/PhoneRegistrationScreen';
import { OTPVerificationScreen } from '../screens/OTPVerificationScreen';
import { UserDetailsScreen } from '../screens/UserDetailsScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator: React.FC = () => {
  console.log('AuthNavigator: Rendering with screens:', [
    'PhoneRegistration',
    'OTPVerification', 
    'UserDetails',
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
        name="UserDetails" 
        component={UserDetailsScreen}
        options={{ title: 'User Details' }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Login' }}
      />
      {/* <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /> */}
    </Stack.Navigator>
  );
};

