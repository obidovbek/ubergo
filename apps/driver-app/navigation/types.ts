/**
 * Navigation Types
 * Shared type definitions for React Navigation
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Auth Stack Parameter List - Driver App
export type AuthStackParamList = {
  PhoneRegistration: undefined;
  OTPVerification: { phoneNumber: string; userId?: string };
  DriverDetails: { phoneNumber: string };
  DriverPersonalInfo: undefined;
  DriverPassport: undefined;
  DriverLicense: undefined;
  DriverVehicle: undefined;
  DriverTaxiLicense: undefined;
  Login: undefined;
};

// Main Stack Parameter List - Driver App
export type MainStackParamList = {
  Home: undefined;
  Activity: undefined;
  Profile: undefined;
};

// Navigation Props
export type PhoneRegistrationNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PhoneRegistration'>;
export type OTPVerificationNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
export type DriverDetailsNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'DriverDetails'>;
export type DriverPersonalInfoNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'DriverPersonalInfo'>;
export type DriverPassportNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'DriverPassport'>;
export type DriverLicenseNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'DriverLicense'>;
export type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

// Route Props
export type PhoneRegistrationRouteProp = {
  params: undefined;
};

export type OTPVerificationRouteProp = {
  params: { phoneNumber: string; userId?: string };
};

export type DriverDetailsRouteProp = {
  params: { phoneNumber: string };
};

export type LoginRouteProp = {
  params: undefined;
};
