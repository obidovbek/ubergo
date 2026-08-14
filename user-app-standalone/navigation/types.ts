/**
 * Navigation Types
 * Shared type definitions for React Navigation
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GeoOption } from '../api/geo';

// Auth Stack Parameter List
export type AuthStackParamList = {
  PhoneRegistration: undefined;
  OTPVerification: { phoneNumber: string };
  UserDetails: { phoneNumber: string };
};

/**
 * T-077 — the route handed over after a ride request is posted.
 *
 * The whole `GeoOption` objects travel, not bare ids: `SearchOffersScreen`
 * keeps `{id, name}` per level and restores exactly this shape from storage.
 */
export type SearchOffersParams = {
  fromProvince?: GeoOption | null;
  fromCity?: GeoOption | null;
  toProvince?: GeoOption | null;
  toCity?: GeoOption | null;
};

/**
 * Main Stack Parameter List — **every route in `MainNavigator`, T-028.**
 *
 * 🔴 It used to list 3 of the navigator's 10, so screens navigated through
 * `(navigation as any)` and lost all checking: `navigate('Typo')` compiled
 * happily. It also carried an **`Activity` route that does not exist**, which
 * is the same defect pointing the other way.
 *
 * ⚠️ **Keep this in step with `MainNavigator` by hand.** Nothing derives one
 * from the other, so a route added there without a line here silently returns
 * this file to the state T-028 fixed.
 */
export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  SearchOffers: SearchOffersParams | undefined;
  OfferDetails: { offerId: number };
  MyBookings: undefined;
  /** T-040 — an id turns the create screen into an editor for that order. */
  CreatePassengerOffer: { offerId?: number } | undefined;
  MyPassengerOffers: undefined;
  /** T-024 — the drivers who bid on one passenger offer. */
  OfferDrivers: { offerId: number };
};

/** Typed `useNavigation()` for any screen on the main stack. */
export type MainNavigationProp = NativeStackNavigationProp<MainStackParamList>;

/**
 * The routes that can be opened with **no params** — `navigate(name)` alone.
 *
 * ⚠️ Derived, not hand-listed, so it stays correct on its own: adding a route
 * above that needs an `offerId` automatically keeps it out of here, and a
 * menu that tries to open it without one stops compiling.
 */
export type ParamlessRoute = {
  [K in keyof MainStackParamList]: undefined extends MainStackParamList[K] ? K : never;
}[keyof MainStackParamList];

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
