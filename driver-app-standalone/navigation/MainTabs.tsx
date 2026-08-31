/**
 * MainTabs — T-101 step 3 (driver app).
 *
 * The artboards' persistent bottom bar. `@react-navigation/bottom-tabs` was already a
 * dependency and unused; this is its first use here.
 *
 * Driver tab set, from `DriverMenu.dc.html`:
 *   Asosiy · E'lon · Buyurtmalarim · Hisob · Profil
 *
 * 🛑 FOUR TABS, NOT FIVE — same reason as the user app. **"Hisob" has no screen in
 * this app.** `DriverBalans.dc.html` and `DriverDaromad.dc.html` DO exist as artboards,
 * but there is no wallet screen behind them — they are step 19 of the plan, flagged
 * there as genuinely new work rather than a repaint. Until that screen exists a fifth
 * tab would ship a crash or a blank, so the bar carries four.
 *
 * ⚠️ Detail screens (OfferPassengers, the five document screens, …) stay in the parent
 * stack so they push OVER the bar, matching the artboards.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MenuScreen } from '../screens/MenuScreen';
import { OfferWizardScreen } from '../screens/OfferWizardScreen';
import { OffersListScreen } from '../screens/OffersListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { BottomTabBar, type TabIconMap } from '../components/chrome/BottomTabBar';

const Tab = createBottomTabNavigator();

/** Route name -> artboard icon. `offer` is the driver app's only unique glyph. */
const ICONS: TabIconMap = {
  Home: 'home',
  OfferWizard: 'offer',
  OffersList: 'orders',
  Profile: 'profile',
};

export const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={(props) => <BottomTabBar {...props} icons={ICONS} />}
  >
    <Tab.Screen name="Home" component={MenuScreen} options={{ tabBarLabel: 'Asosiy' }} />
    <Tab.Screen
      name="OfferWizard"
      component={OfferWizardScreen}
      options={{ tabBarLabel: "E'lon" }}
    />
    <Tab.Screen
      name="OffersList"
      component={OffersListScreen}
      options={{ tabBarLabel: 'Buyurtmalarim' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarLabel: 'Profil' }}
    />
  </Tab.Navigator>
);
