/**
 * Menu Screen (Home Screen)
 * Main menu with taxi service options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { createTheme } from '../themes';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../contexts/NotificationContext';

const theme = createTheme('light');

interface TaxiOption {
  id: string;
  titleKey: string;
  subtitle?: string;
}

/*
 * T-028 — the shared list, not a local copy.
 *
 * 🔴 This file used to declare its own `MainStackParamList`, and it was wrong
 * in two directions at once: it invented a `PassengerOfferDetails` route that
 * does not exist in this app's navigator (it is a DRIVER-app screen), and it
 * typed `CreatePassengerOffer` as taking no params when T-040 gave it an
 * `offerId`. A per-screen copy of the route table is a lie waiting to be told.
 */
type MenuScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Home'>;

export const MenuScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  const [selectedCountry, setSelectedCountry] = useState(t('menu.uzbekistan'));

  // Taxi options with translation keys
  const taxiOptions: TaxiOption[] = [
    { id: 'driver_offers', titleKey: 'menu.driverOffersTitle' },
    { id: 'my_bookings', titleKey: 'menu.myBookings' },
    { id: 'create_passenger_offer', titleKey: 'passengerOffers.createRideRequest' },
    { id: 'my_passenger_offers', titleKey: 'passengerOffers.myRideRequests' },
    // { id: 'viloyatlar', titleKey: 'menu.viloyatlar' },
    // { id: 'ichi', titleKey: 'menu.ichi' },
    // { id: 'tuman', titleKey: 'menu.tuman' },
    // { id: 'empty', titleKey: 'menu.empty' },
    // { id: 'xalqaro', titleKey: 'menu.xalqaro' },
  ];

  // Get user display name or initials
  const displayName = (user as any)?.display_name || 
                     (user as any)?.name || 
                     t('menu.guest');
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleOptionPress = (optionId: string) => {
    if (optionId === 'driver_offers') {
      navigation.navigate('SearchOffers');
    } else if (optionId === 'my_bookings') {
      navigation.navigate('MyBookings');
    } else if (optionId === 'create_passenger_offer') {
      navigation.navigate('CreatePassengerOffer');
    } else if (optionId === 'my_passenger_offers') {
      navigation.navigate('MyPassengerOffers');
    } else {
      console.log('Selected option:', optionId);
      // Handle navigation or action based on selected option
    }
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo and Profile Button */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              {/* T-050: 38px + a profile button competing for the same row is
                  enough to wrap the wordmark mid-word on a large font scale. */}
              <Text
                style={styles.logo}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {t('auth.appName')}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {/* Unread messages — visible without opening the menu. The count
                  comes from NotificationContext, which already reloads when a
                  push arrives in the foreground, so this stays live. */}
              <TouchableOpacity
                style={styles.mailButton}
                // `as any` matches the rest of this file (see the CreatePassengerOffer
                // call above): MainStackParamList still lists only 3 of the
                // navigator's 9 routes, so 'Notifications' is not in the type yet.
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('notifications.title')}
              >
                <Ionicons name="mail-outline" size={24} color="#111827" />
                {unreadCount > 0 && (
                  <View style={styles.mailBadge}>
                    <Text style={styles.mailBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={handleProfilePress}
                activeOpacity={0.7}
              >
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileInitial}>{userInitial}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {/* Title */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('menu.title')}</Text>
            {/* <Text style={styles.cardSubtitle}>{t('menu.subtitle')}</Text> */}
          </View>

          {/* Country Selector */}
          {/* <TouchableOpacity style={styles.countrySelector}>
            <Text style={styles.countryFlag}>🇺🇿</Text>
            <Text style={styles.countryName}>{selectedCountry}</Text>
          </TouchableOpacity> */}

          {/* Taxi Options Grid */}
          <View style={styles.optionsGrid}>
            {taxiOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionButton}
                onPress={() => handleOptionPress(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionText}>
                  {t(option.titleKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'android' ? 50 : 20,
  },
  header: {
    marginTop: Platform.OS === 'android' ? 12 : 8,
    marginBottom: 28,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(16, 185, 129, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mailButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Sits on the icon's top-right corner. overflow stays visible because the
  // badge deliberately spills outside the button's bounds.
  mailBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mailBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  countryFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  countryName: {
    fontSize: 17,
    color: '#111827',
    fontWeight: '700',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionButton: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  optionText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
});

