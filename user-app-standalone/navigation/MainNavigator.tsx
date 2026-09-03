/**
 * Main Navigator
 *
 * T-101 step 3: the stack now hosts the artboards' persistent bottom tab bar as its
 * first route, with every detail screen still in the stack so it pushes OVER the bar —
 * which is what the artboards show.
 *
 * 🛑 `Home`, `SearchOffers`, `MyBookings` and `Profile` MOVED INTO THE TAB NAVIGATOR
 * (`./MainTabs`). They are deliberately NOT registered here as well: two routes with
 * one name in nested navigators makes `navigate('Profile')` ambiguous, and React
 * Navigation resolves it to the nearest one, which is not always the one you meant.
 *
 * ⚠️ Existing `navigate('SearchOffers')` / `navigate('MyBookings')` / etc. calls from
 * `MenuScreen` still work — the call bubbles up to the tab navigator and switches tab.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import OfferDetailsScreen from '../screens/OfferDetailsScreen';
import { CreatePassengerOfferScreen } from '../screens/CreatePassengerOfferScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import OfferDriversScreen from '../screens/OfferDriversScreen';

const Stack = createNativeStackNavigator();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* The tab bar — Asosiy / Qidirish / Mening buyurtmalarim / Profil.
          Everything below pushes OVER it. */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
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
        name="CreatePassengerOffer"
        component={CreatePassengerOfferScreen}
        options={{
          headerShown: false,
        }}
      />
      {/*
        T-101 step 9 — `MyPassengerOffers` NO LONGER HAS ITS OWN SCREEN. The passenger's
        ride requests are now one lifecycle mode inside the merged `MyBookings` tab, so
        this route is kept only as a REDIRECT for any lingering caller (the home screen's
        text link, a push deep-link) and renders the same merged screen.

        📋 Delete the route once nothing navigates to it — that is a cleanup card
        (T-105), not this step: removing a route name is the kind of change that strands
        a deep link silently.
      */}
      <Stack.Screen
        name="MyPassengerOffers"
        component={MyOrdersScreen}
        options={{
          headerShown: false,
        }}
      />
      {/* T-024: where the passenger answers the drivers who offered. */}
      <Stack.Screen
        name="OfferDrivers"
        component={OfferDriversScreen}
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

