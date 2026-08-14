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
/**
 * Main Stack Parameter List — **every route in `MainNavigator`, T-028 (driver).**
 *
 * 🔴 It used to list 6 of the navigator's 16 and carried an **`Activity` route
 * that does not exist** — the same phantom the user app had, copied from the
 * same source. Screens fell back to `(navigation as any)` and lost all
 * checking, which is how the user app shipped a tap to a route it did not have.
 *
 * ⚠️ **Keep this in step with `MainNavigator` by hand.** Nothing derives one
 * from the other; a route added there without a line here silently returns this
 * file to the state the card fixed.
 */
export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  /**
   * The five registration steps are reachable from the MAIN stack as well as
   * the auth one, so a signed-in driver can go back and edit them.
   */
  DriverDetails: { isEditing?: boolean } | undefined;
  DriverPersonalInfo: { isEditing?: boolean } | undefined;
  DriverPassport: { isEditing?: boolean } | undefined;
  DriverLicense: { isEditing?: boolean } | undefined;
  DriverVehicle: { isEditing?: boolean } | undefined;
  DriverTaxiLicense: { isEditing?: boolean } | undefined;
  OffersList: undefined;
  /** An id turns the wizard into an editor for that offer. */
  OfferWizard: { offerId?: string } | undefined;
  /** The passengers who booked one of the driver's own offers. */
  OfferPassengers: { offerId: number };
  SearchPassengerOffers: undefined;
  /** ⚠️ `offerId` here is a **PassengerOffer** id, not a DriverOffer one (T-044). */
  PassengerOfferDetails: { offerId: number };
  MyJoinRequests: undefined;
};

/** Typed `useNavigation()` for any screen on the driver's main stack. */
export type MainNavigationProp = NativeStackNavigationProp<MainStackParamList>;

/**
 * The registration steps a signed-in driver can re-open from `EditProfile`.
 * All six take `{ isEditing?: boolean }`.
 */
export type EditableStep =
  | 'DriverDetails'
  | 'DriverPersonalInfo'
  | 'DriverPassport'
  | 'DriverLicense'
  | 'DriverVehicle'
  | 'DriverTaxiLicense';

/**
 * The routes that can be opened with **no params** — `navigate(name)` alone.
 * Derived, so adding a route that needs an id keeps it out of here on its own.
 */
export type ParamlessRoute = {
  [K in keyof MainStackParamList]: undefined extends MainStackParamList[K] ? K : never;
}[keyof MainStackParamList];

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
