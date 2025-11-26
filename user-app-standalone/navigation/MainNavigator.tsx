/**
 * Main Navigator
 * Simple stack navigation for authenticated users (no bottom tabs)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MenuScreen } from '../screens/MenuScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

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
          headerShown: true,
          title: 'Profile',
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          headerShown: true,
          title: 'Notifications',
        }}
      />
    </Stack.Navigator>
  );
};

