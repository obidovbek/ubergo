/**
 * Navigation Types
 * Shared type definitions for React Navigation
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { GeoOption } from '../api/geo';
import type { OrderScope } from '../types/orderScope';

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
  /**
   * T-102i — the order itself, so the search can match IT: its QFYs and its scope. With a
   * scope the screen is in "for your order" mode, and a `tuman` / `yaqin` side that named a
   * QFY is matched at that QFY on the server.
   */
  fromSettlement?: GeoOption | null;
  toSettlement?: GeoOption | null;
  scope?: OrderScope | null;
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
/**
 * T-101 step 3 — the four tab routes.
 *
 * These moved OUT of `MainNavigator` and into `MainTabs`. They stay in the list below
 * because navigation is nested: `navigate('SearchOffers')` from a stack screen still
 * resolves, bubbling up to the tab navigator and switching tab. Removing them would
 * break every existing call site for no benefit.
 *
 * 🛑 There is no `Hisob` (wallet) tab — the artboards show five tabs but this app has
 * no wallet screen, so the bar ships with four. See `MainTabs.tsx`.
 */
export type MainTabParamList = {
  Home: undefined;
  SearchOffers: SearchOffersParams | undefined;
  MyBookings: undefined;
  Profile: undefined;
};

export type MainStackParamList = MainTabParamList & {
  /**
   * T-101 — the tab navigator itself; everything else pushes over it.
   *
   * 🔴 `NavigatorScreenParams`, not `undefined` — device report 2026-09-13. A screen PUSHED
   * over the bar cannot reach a tab with a bare `navigate('SearchOffers')`: that switches the
   * tab UNDERNEATH and leaves the pushed screen on top, so the user appears not to have moved
   * (it left `CreatePassengerOffer` sitting on the form it had just submitted). The way that
   * both pops the stack and picks the tab is
   * `navigate('MainTabs', { screen: 'SearchOffers', params })`, and typing the route
   * `undefined` made that spelling a type error — so the broken one was the only one that
   * compiled.
   */
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  EditProfile: undefined;
  Notifications: undefined;
  OfferDetails: { offerId: number };
  /**
   * T-040 — an id turns the create screen into an editor for that order.
   * T-101 step 8 — `scope` is the order scope chosen on the home carousel. It is
   * PRESENTATION ONLY: it names the screen in the top bar (the four UserBuyurtma
   * artboards differ in that subtitle and in where the location sheet opens).
   * It does NOT change matching — that is still blocked on T-102.
   */
  CreatePassengerOffer: { offerId?: number; scope?: OrderScope } | undefined;
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
