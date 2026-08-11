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
  /**
   * T-024. ⚠️ This list is still missing most of `MainNavigator`'s routes, so
   * screens navigate through `(navigation as any)` and lose all checking —
   * that is **T-028**, deliberately not fixed here. This entry is typed
   * properly so the new route at least cannot be called wrongly.
   */
  OfferDrivers: { offerId: number };
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
