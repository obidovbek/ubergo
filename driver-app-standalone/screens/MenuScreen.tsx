/**
 * Menu Screen (Home Screen)
 * Main menu with taxi service options
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createTheme } from '../themes';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import * as DriverOffersAPI from '../api/driverOffers';
import type { DriverOffer } from '../api/driverOffers';
import { showToast } from '../utils/toast';

const theme = createTheme('light');

interface TaxiOption {
  id: string;
  titleKey: string;
  subtitle?: string;
}

type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  OffersList: undefined;
  OfferWizard: { offerId?: string } | undefined;
};

type MenuScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Home'>;

export const MenuScreen: React.FC = () => {
  const { user, token } = useAuth();
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState(t('menu.uzbekistan'));
  const [activeOffers, setActiveOffers] = useState<DriverOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Taxi options with translation keys - My Offers first
  const taxiOptions: TaxiOption[] = [
    { id: 'myOffers', titleKey: 'menu.myOffers' }, // My Offers at the top
    { id: 'viloyatlar', titleKey: 'menu.viloyatlar' },
    { id: 'ichi', titleKey: 'menu.ichi' },
    { id: 'tuman', titleKey: 'menu.tuman' },
    { id: 'empty', titleKey: 'menu.empty' },
    { id: 'xalqaro', titleKey: 'menu.xalqaro' },
  ];

  // Get user display name or initials
  const displayName = (user as any)?.display_name || 
                     (user as any)?.name || 
                     t('menu.guest');
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleOptionPress = (optionId: string) => {
    console.log('Selected option:', optionId);
    // Navigate to offers screen when "My Offers" is clicked
    if (optionId === 'myOffers') {
      handleViewAllOffers();
    } else {
      // Handle other menu options
      // TODO: Add navigation for other options
    }
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleCreateOffer = () => {
    (navigation as any).navigate('OfferWizard', { offerId: null });
  };

  const handleViewAllOffers = () => {
    (navigation as any).navigate('OffersList');
  };

  const loadActiveOffers = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingOffers(true);
      // Load published and approved offers that are in the future
      const response = await DriverOffersAPI.getDriverOffers(token, {
        status: 'published,approved',
      });
      
      if (response.success && response.offers) {
        // Filter to only show future offers
        const now = new Date();
        const futureOffers = response.offers.filter(offer => {
          const startDate = new Date(offer.start_at);
          return startDate > now;
        });
        
        // Sort by start_at (earliest first) and limit to 3
        futureOffers.sort((a, b) => 
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
        );
        
        setActiveOffers(futureOffers.slice(0, 3));
      }
    } catch (error: any) {
      console.error('Failed to load active offers:', error);
      // Don't show error toast for menu screen, just fail silently
    } finally {
      setLoadingOffers(false);
      setRefreshing(false);
    }
  }, [token]);

  // Load offers when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadActiveOffers();
    }, [loadActiveOffers])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadActiveOffers();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: currency || 'UZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header with Logo and Profile Button */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>{t('auth.appName')}</Text>
            </View>
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

        {/* Main Card - Unified Menu */}
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

          {/* Taxi Options Grid - Including My Offers */}
          <View style={styles.optionsGrid}>
            {taxiOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  option.id === 'myOffers' && styles.offersOptionButton
                ]}
                onPress={() => handleOptionPress(option.id)}
                activeOpacity={0.7}
              >
                {option.id === 'myOffers' && (
                  <View style={styles.offersIconContainer}>
                    <View style={styles.offersIcon}>
                      <View style={styles.offersIconLine} />
                      <View style={styles.offersIconLine} />
                      <View style={styles.offersIconLine} />
                    </View>
                  </View>
                )}
                <Text style={[
                  styles.optionText,
                  option.id === 'myOffers' && styles.offersOptionText
                ]}>
                  {t(option.titleKey)}
                </Text>
                {option.id === 'myOffers' && activeOffers.length > 0 && (
                  <View style={styles.offersBadge}>
                    <Text style={styles.offersBadgeText}>{activeOffers.length}</Text>
                  </View>
                )}
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
  offersOptionButton: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    borderWidth: 2,
    position: 'relative',
  },
  offersOptionText: {
    color: '#10B981',
  },
  offersIconContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offersIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#10B981',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 6,
    paddingTop: 4,
  },
  offersIconLine: {
    width: 18,
    height: 2,
    backgroundColor: '#FFFFFF',
    marginBottom: 3,
    borderRadius: 1,
  },
  offersBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  offersBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

