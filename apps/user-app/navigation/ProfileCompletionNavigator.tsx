/**
 * Profile Completion Navigator
 * Shown when user is authenticated but profile is incomplete
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserDetailsScreen } from '../screens/UserDetailsScreen';

const Stack = createNativeStackNavigator();

export const ProfileCompletionNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="UserDetails" 
        component={UserDetailsScreen}
        options={{ title: 'Complete Profile' }}
      />
    </Stack.Navigator>
  );
};

