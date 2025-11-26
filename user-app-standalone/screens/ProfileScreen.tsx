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
    { id: 'notifications', title: t('profile.notifications'), icon: '🔔', navigate: 'Notifications' },
    { id: 'edit', title: t('profile.editProfile'), icon: '✏️' },
    { id: 'payment', title: t('profile.paymentMethods'), icon: '💳' },
    { id: 'history', title: t('profile.tripHistory'), icon: '📜' },
    { id: 'help', title: t('profile.helpSupport'), icon: '❓' },
    { id: 'settings', title: t('profile.settings'), icon: '⚙️' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
          <Text style={styles.phone}>{userPhone}</Text>
          {user?.id && (
            <View style={styles.idContainer}>
              <Text style={styles.idLabel}>{t('profile.userId')}:</Text>
              <Text style={styles.idValue}>{user.id}</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => {
                if (item.navigate) {
                  (navigation as any).navigate(item.navigate);
                } else {
                  console.log(`Navigate to ${item.id}`);
                }
              }}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={async () => {
            console.log('Direct logout test pressed');
            try {
              console.log('Calling logout directly...');
              await logout();
              console.log('Direct logout completed');
            } catch (error) {
              console.error('Direct logout error:', error);
            }
          }}
          activeOpacity={0.7}
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
    backgroundColor: theme.palette.background.default,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: theme.spacing(4),
    backgroundColor: theme.palette.background.card,
    marginBottom: theme.spacing(2),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.palette.secondary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
  },
  avatarText: {
    ...theme.typography.h1,
    color: theme.palette.secondary.contrastText,
  },
  name: {
    ...theme.typography.h3,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  email: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  phone: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.borderRadius.sm,
  },
  idLabel: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(1),
  },
  idValue: {
    ...theme.typography.body2,
    color: theme.palette.text.primary,
    fontFamily: 'monospace',
  },
  menuSection: {
    backgroundColor: theme.palette.background.card,
    marginBottom: theme.spacing(2),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.divider,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: theme.spacing(2),
  },
  menuTitle: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    flex: 1,
  },
  menuArrow: {
    fontSize: 24,
    color: theme.palette.text.secondary,
  },
  logoutButton: {
    backgroundColor: theme.palette.error.main,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing(2),
    alignItems: 'center',
    ...theme.shadows.md,
  },
  logoutButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
  },
  appInfo: {
    padding: theme.spacing(2),
    alignItems: 'center',
  },
  appInfoText: {
    ...theme.typography.caption,
    color: theme.palette.text.disabled,
  },
});

