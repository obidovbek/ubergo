/**
 * Navigation Types
 * Shared type definitions for React Navigation
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Auth Stack Parameter List - Driver App
export type AuthStackParamList = {
  PhoneRegistration: undefined;
  RegisterFirst: { appStoreUrls?: { android?: string; ios?: string } };
  OTPVerification: { phoneNumber: string; userId?: string };
  DriverDetails: { phoneNumber: string };
  DriverPersonalInfo: undefined;
  DriverPassport: undefined;
  DriverLicense: undefined;
  DriverVehicle: undefined;
  DriverTaxiLicense: undefined;
};

// Main Stack Parameter List - Driver App
// ⚠️ Still incomplete — MainNavigator registers 14 routes and only these are
// typed, so the other screens navigate through `(navigation as any)`. T-037
// added the two passenger-order routes it needs; typing the rest is its own card.
export type MainStackParamList = {
  Home: undefined;
  Activity: undefined;
  Profile: undefined;
  SearchPassengerOffers: undefined;
  PassengerOfferDetails: { offerId: number };
  MyJoinRequests: undefined;
};

// Navigation Props
export type PhoneRegistrationNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PhoneRegistration'>;
export type OTPVerificationNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
export type DriverDetailsNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'DriverDetails'>;
export type DriverPersonalInfoNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'DriverPersonalInfo'>;
export type DriverPassportNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'DriverPassport'>;
export type DriverLicenseNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'DriverLicense'>;

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
