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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createTheme } from '../themes';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';

const theme = createTheme('light');

interface TaxiOption {
  id: string;
  titleKey: string;
  subtitle?: string;
}

type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
};

type MenuScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Home'>;

export const MenuScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState(t('menu.uzbekistan'));

  // Taxi options with translation keys
  const taxiOptions: TaxiOption[] = [
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
    // Handle navigation or action based on selected option
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

        {/* Main Card */}
        <View style={styles.card}>
          {/* Title */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('menu.title')}</Text>
            <Text style={styles.cardSubtitle}>{t('menu.subtitle')}</Text>
          </View>

          {/* Country Selector */}
          <TouchableOpacity style={styles.countrySelector}>
            <Text style={styles.countryFlag}>🇺🇿</Text>
            <Text style={styles.countryName}>{selectedCountry}</Text>
          </TouchableOpacity>

          {/* Taxi Options Grid */}
          <View style={styles.optionsGrid}>
            {taxiOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionButton}
                onPress={() => handleOptionPress(option.id)}
              >
                <Text style={styles.optionText}>{t(option.titleKey)}</Text>
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
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginTop: 8,
    marginBottom: 24,
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
    fontSize: 36,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
  profileButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 24,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 10,
  },
  countryName: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  optionButton: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#81C784',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
});

