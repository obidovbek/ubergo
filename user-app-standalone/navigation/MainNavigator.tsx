/**
 * Main Navigator
 * Simple stack navigation for authenticated users (no bottom tabs)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MenuScreen } from '../screens/MenuScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import SearchOffersScreen from '../screens/SearchOffersScreen';
import OfferDetailsScreen from '../screens/OfferDetailsScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import { CreatePassengerOfferScreen } from '../screens/CreatePassengerOfferScreen';
import { MyPassengerOffersScreen } from '../screens/MyPassengerOffersScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';

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
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="SearchOffers" 
        component={SearchOffersScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="OfferDetails" 
        component={OfferDetailsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="MyBookings" 
        component={MyBookingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="CreatePassengerOffer" 
        component={CreatePassengerOfferScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="MyPassengerOffers" 
        component={MyPassengerOffersScreen}
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
    </Stack.Navigator>
  );
};

