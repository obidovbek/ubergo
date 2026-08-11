/**
 * Navigation Types
 * Shared type definitions for React Navigation
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Auth Stack Parameter List
export type AuthStackParamList = {
  PhoneRegistration: undefined;
  OTPVerification: { phoneNumber: string };
  UserDetails: { phoneNumber: string };
};

// Main Stack Parameter List
export type MainStackParamList = {
  Home: undefined;
  Activity: undefined;
  Profile: undefined;
};

// Navigation Props
export type PhoneRegistrationNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PhoneRegistration'>;
export type OTPVerificationNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
export type UserDetailsNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'UserDetails'>;

// Route Props
export type PhoneRegistrationRouteProp = {
  params: undefined;
};

export type OTPVerificationRouteProp = {
  params: { phoneNumber: string };
};

export type UserDetailsRouteProp = {
  params: { phoneNumber: string };
};
