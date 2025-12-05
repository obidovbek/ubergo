/**
 * Main Navigator
 * Simple stack navigation for authenticated users (no bottom tabs)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MenuScreen } from '../screens/MenuScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

import { EditProfileScreen } from '../screens/EditProfileScreen';
import { DriverPersonalInfoScreen } from '../screens/DriverPersonalInfoScreen';
import { DriverPassportScreen } from '../screens/DriverPassportScreen';
import { DriverLicenseScreen } from '../screens/DriverLicenseScreen';
import { DriverVehicleScreen } from '../screens/DriverVehicleScreen';
import { DriverTaxiLicenseScreen } from '../screens/DriverTaxiLicenseScreen';
import { DriverDetailsScreen } from '../screens/DriverDetailsScreen';
import { OffersListScreen } from '../screens/OffersListScreen';
import { OfferWizardScreen } from '../screens/OfferWizardScreen';

const Stack = createNativeStackNavigator();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={MenuScreen}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
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
        name="OffersList"
        component={OffersListScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OfferWizard"
        component={OfferWizardScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

