/**
 * Main Navigator
 * Bottom tab navigation for authenticated users
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { createTheme } from '../themes';

const Tab = createBottomTabNavigator();
const theme = createTheme('light');

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: theme.palette.secondary.main,
        tabBarInactiveTintColor: theme.palette.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.palette.background.card,
          borderTopColor: theme.palette.divider,
        },
        headerStyle: {
          backgroundColor: theme.palette.background.card,
        },
        headerTintColor: theme.palette.text.primary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Book a Ride',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <React.Fragment>
              {/* You can use react-native-vector-icons here */}
              <span style={{ fontSize: size, color }}>🏠</span>
            </React.Fragment>
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={HomeScreen} // Replace with ActivityScreen
        options={{
          title: 'Your Activity',
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <React.Fragment>
              <span style={{ fontSize: size, color }}>📊</span>
            </React.Fragment>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <React.Fragment>
              <span style={{ fontSize: size, color }}>👤</span>
            </React.Fragment>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

