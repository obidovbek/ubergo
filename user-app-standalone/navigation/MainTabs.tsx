/**
 * MainTabs — T-101 step 3.
 *
 * The artboards' persistent 5-tab bottom bar. `@react-navigation/bottom-tabs` was
 * already a dependency and unused; this is its first use in the app.
 *
 * 🛑 FOUR TABS, NOT FIVE — AND THAT IS DELIBERATE.
 *
 * The artboards show: Asosiy · Qidirish · Mening buyurtmalarim · Hisob · Profil.
 * **"Hisob" (wallet/balance) has NO screen in this app** — there is no wallet screen,
 * and `UserBalans` is not among the 33 artboards either. Shipping a fifth tab would
 * mean shipping one that crashes or shows a blank.
 *
 * So Hisob is omitted until a wallet screen exists. When it does, add it here at index
 * 3 and the bar becomes the artboards' five. This is recorded as an owner question on
 * the T-101 card rather than silently absorbed.
 *
 * ⚠️ The tab bar is NEW NAVIGATION, not a repaint — it changes the back behaviour of
 * every screen it wraps. Detail screens (OfferDetails, EditProfile, …) stay in the
 * parent stack in `MainNavigator` so they push OVER the bar, which is what the
 * artboards show.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MenuScreen } from '../screens/MenuScreen';
import SearchOffersScreen from '../screens/SearchOffersScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { BottomTabBar, type TabIconMap } from '../components/chrome/BottomTabBar';

const Tab = createBottomTabNavigator();

/** Route name -> artboard icon. */
const ICONS: TabIconMap = {
  Home: 'home',
  SearchOffers: 'search',
  MyBookings: 'orders',
  Profile: 'profile',
};

export const MainTabs: React.FC = () => (
  <Tab.Navigator
    // The artboards' own top bar is per-screen, so the navigator draws no header.
    screenOptions={{ headerShown: false }}
    tabBar={(props) => <BottomTabBar {...props} icons={ICONS} />}
  >
    <Tab.Screen name="Home" component={MenuScreen} options={{ tabBarLabel: 'Asosiy' }} />
    <Tab.Screen
      name="SearchOffers"
      component={SearchOffersScreen}
      options={{ tabBarLabel: 'Qidirish' }}
    />
    {/*
      T-101 step 9 — this tab now shows BOTH the passenger's bookings and their own ride
      requests, grouped by lifecycle (see `MyOrdersScreen`). The route name stays
      `MyBookings` so existing `navigate('MyBookings')` calls keep working.
    */}
    <Tab.Screen
      name="MyBookings"
      component={MyOrdersScreen}
      options={{ tabBarLabel: 'Mening buyurtmalarim' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarLabel: 'Profil' }}
    />
  </Tab.Navigator>
);
