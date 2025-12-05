/**
 * Profile Screen
 * User profile and settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { createTheme } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { useNavigation } from '@react-navigation/native';

const theme = createTheme('light');

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Get user display data
  const displayName = (user as any)?.display_name || (user as any)?.name || t('menu.guest');
  const userEmail = (user as any)?.email || t('profile.noEmail');
  const userPhone = (user as any)?.phone_e164 || (user as any)?.phone || t('profile.noPhone');
  const userInitial = displayName.charAt(0).toUpperCase();

  // Debug auth state
  console.log('ProfileScreen: Auth state:', {
    user: user?.id,
    logoutAvailable: typeof logout,
    isAuthenticated: !!user
  });

  const handleLogout = () => {
    console.log('ProfileScreen: Logout button pressed');
    console.log('ProfileScreen: logout function available:', typeof logout);

    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Calling logout directly...');
              await logout();
              console.log('Direct logout completed');
            } catch (error) {
              console.error('Direct logout error:', error);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { id: 'notifications', title: t('profile.notifications'), iconType: 'bell', navigate: 'Notifications' },
    { id: 'edit', title: t('profile.editProfile'), iconType: 'edit', navigate: 'EditProfile' },
    { id: 'offers', title: t('profile.myOffers'), iconType: 'list', navigate: 'OffersList' },
    { id: 'payment', title: t('profile.paymentMethods'), iconType: 'card' },
    { id: 'history', title: t('profile.tripHistory'), iconType: 'history' },
    { id: 'help', title: t('profile.helpSupport'), iconType: 'help' },
    { id: 'settings', title: t('profile.settings'), iconType: 'settings' },
  ];

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'bell':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <View style={[styles.iconDot, { backgroundColor: '#F59E0B' }]} />
            </View>
          </View>
        );
      case 'edit':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
              <View style={[styles.iconDot, { backgroundColor: '#3B82F6' }]} />
            </View>
          </View>
        );
      case 'list':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
              <View style={styles.listIcon}>
                <View style={styles.listIconLine} />
                <View style={styles.listIconLine} />
                <View style={styles.listIconLine} />
              </View>
            </View>
          </View>
        );
      case 'card':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
              <View style={[styles.iconDot, { backgroundColor: '#6366F1' }]} />
            </View>
          </View>
        );
      case 'history':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#FCE7F3' }]}>
              <View style={[styles.iconDot, { backgroundColor: '#EC4899' }]} />
            </View>
          </View>
        );
      case 'help':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <View style={[styles.iconDot, { backgroundColor: '#F59E0B' }]} />
            </View>
          </View>
        );
      case 'settings':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#E5E7EB' }]}>
              <View style={[styles.iconDot, { backgroundColor: '#6B7280' }]} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
          <Text style={styles.phone}>{userPhone}</Text>
          {user?.id && (
            <View style={styles.idContainer}>
              <Text style={styles.idLabel}>{t('profile.driverId')}</Text>
              <Text style={styles.idValue}>{user.id}</Text>
            </View>
          )}
        </View>

        {/* Menu Items Card */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast
              ]}
              onPress={() => {
                if (item.navigate) {
                  (navigation as any).navigate(item.navigate);
                } else {
                  console.log(`Navigate to ${item.id}`);
                }
              }}
              activeOpacity={0.7}
            >
              {renderIcon(item.iconType)}
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>{t('profile.appVersion')}</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 60,
  },
  profileCard: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 40,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  phone: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  idLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  idValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
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
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  listIcon: {
    width: 20,
    height: 16,
    justifyContent: 'space-between',
  },
  listIconLine: {
    width: 18,
    height: 2,
    backgroundColor: '#10B981',
    borderRadius: 1,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  appInfo: {
    padding: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  appInfoText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

