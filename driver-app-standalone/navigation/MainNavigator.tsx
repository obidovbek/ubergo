/**
 * Main Navigator
 *
 * T-101 step 3: the stack now hosts the artboards' persistent bottom tab bar as its
 * first route, with detail screens still in the stack so they push OVER the bar.
 *
 * 🛑 `Home`, `OfferWizard`, `OffersList` and `Profile` MOVED INTO `./MainTabs`. They are
 * deliberately NOT registered here as well: two routes sharing one name across nested
 * navigators makes `navigate()` ambiguous, and React Navigation resolves to the nearest,
 * which is not always the one intended.
 *
 * ⚠️ Existing `navigate('OffersList')` etc. still work — the call bubbles up to the tab
 * navigator and switches tab.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { NotificationsScreen } from '../screens/NotificationsScreen';

import { EditProfileScreen } from '../screens/EditProfileScreen';
import { DriverPersonalInfoScreen } from '../screens/DriverPersonalInfoScreen';
import { DriverPassportScreen } from '../screens/DriverPassportScreen';
import { DriverLicenseScreen } from '../screens/DriverLicenseScreen';
import { DriverVehicleScreen } from '../screens/DriverVehicleScreen';
import { DriverTaxiLicenseScreen } from '../screens/DriverTaxiLicenseScreen';
import { DriverDetailsScreen } from '../screens/DriverDetailsScreen';
import OfferPassengersScreen from '../screens/OfferPassengersScreen';
import SearchPassengerOffersScreen from '../screens/SearchPassengerOffersScreen';
import PassengerOfferDetailsScreen from '../screens/PassengerOfferDetailsScreen';
import MyJoinRequestsScreen from '../screens/MyJoinRequestsScreen';

const Stack = createNativeStackNavigator();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* The tab bar — Asosiy / E'lon / Buyurtmalarim / Profil. Everything below pushes over it. */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DriverPersonalInfo"
        component={DriverPersonalInfoScreen}
      />
      <Stack.Screen
        name="DriverPassport"
        component={DriverPassportScreen}
      />
      <Stack.Screen
        name="DriverLicense"
        component={DriverLicenseScreen}
      />
      <Stack.Screen
        name="DriverVehicle"
        component={DriverVehicleScreen}
      />
      <Stack.Screen
        name="DriverTaxiLicense"
        component={DriverTaxiLicenseScreen}
      />
      <Stack.Screen
        name="DriverDetails"
        component={DriverDetailsScreen}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OfferPassengers"
        component={OfferPassengersScreen}
        options={{
          headerShown: false,
        }}
      />
      {/* T-037 step 1 — the screen existed but was registered nowhere, so a
          driver could never reach the passenger orders at all. */}
      <Stack.Screen
        name="SearchPassengerOffers"
        component={SearchPassengerOffersScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PassengerOfferDetails"
        component={PassengerOfferDetailsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MyJoinRequests"
        component={MyJoinRequestsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

