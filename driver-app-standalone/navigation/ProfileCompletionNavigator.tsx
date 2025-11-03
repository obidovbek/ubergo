/**
 * Profile Completion Navigator - Driver App
 * Shown when driver is authenticated but profile is incomplete
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverPersonalInfoScreen } from '../screens/DriverPersonalInfoScreen';
import { DriverPassportScreen } from '../screens/DriverPassportScreen';
import { DriverLicenseScreen } from '../screens/DriverLicenseScreen';
import { DriverVehicleScreen } from '../screens/DriverVehicleScreen';
import { DriverTaxiLicenseScreen } from '../screens/DriverTaxiLicenseScreen';

const Stack = createNativeStackNavigator();

export const ProfileCompletionNavigator: React.FC = () => {
  console.log('ProfileCompletionNavigator: Rendering driver registration screens');
  
  return (
    <Stack.Navigator
      initialRouteName="DriverPersonalInfo"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="DriverPersonalInfo" 
        component={DriverPersonalInfoScreen}
        options={{ title: 'Personal Information' }}
      />
      <Stack.Screen 
        name="DriverPassport" 
        component={DriverPassportScreen}
        options={{ title: 'Passport Information' }}
      />
      <Stack.Screen 
        name="DriverLicense" 
        component={DriverLicenseScreen}
        options={{ title: 'License Information' }}
      />
      <Stack.Screen 
        name="DriverVehicle" 
        component={DriverVehicleScreen}
        options={{ title: 'Vehicle Information' }}
      />
      <Stack.Screen 
        name="DriverTaxiLicense" 
        component={DriverTaxiLicenseScreen}
        options={{ title: 'Taxi License Information' }}
      />
    </Stack.Navigator>
  );
};

