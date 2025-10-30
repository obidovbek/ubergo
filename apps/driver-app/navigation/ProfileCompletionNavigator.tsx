/**
 * Profile Completion Navigator - Driver App
 * Shown when driver is authenticated but profile is incomplete
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverDetailsScreen } from '../screens/DriverDetailsScreen';

const Stack = createNativeStackNavigator();

export const ProfileCompletionNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="DriverDetails" 
        component={DriverDetailsScreen}
        options={{ title: 'Complete Driver Profile' }}
      />
    </Stack.Navigator>
  );
};

