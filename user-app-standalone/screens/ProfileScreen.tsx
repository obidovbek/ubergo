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
  Platform,
  StatusBar,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { createTheme } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { showConfirmDialog } from '../utils/confirmDialog';
import { useNavigation } from '@react-navigation/native';
import type { MainNavigationProp, ParamlessRoute } from '../navigation/types';
import { MenuButton } from '../components/MenuButton';
import { BackButton } from '../components/BackButton';

const theme = createTheme('light');

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<MainNavigationProp>();

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
    
    showConfirmDialog({
      title: t('profile.logout'),
      message: t('profile.logoutConfirm'),
      confirmText: t('profile.logout'),
      cancelText: t('common.cancel'),
      confirmButtonStyle: 'destructive',
      onConfirm: async () => {
        try {
          console.log('Calling logout directly...');
          await logout();
          console.log('Direct logout completed');
        } catch (error) {
          console.error('Direct logout error:', error);
        }
      },
      onCancel: () => {},
    });
  };

  /*
   * T-028 — `navigate` is a route NAME, so it is typed as one.
   *
   * ⚠️ This is the payoff of the shared param list: a typo or a renamed screen
   * now fails to compile here, where before `navigation.navigate(item.navigate)`
   * on an untyped navigator accepted any string at all — the same hole that let
   * `MyPassengerOffersScreen` ship a tap to a route this app does not have.
   */
  const menuItems: {
    id: string;
    title: string;
    iconType: string;
    navigate?: ParamlessRoute;
  }[] = [
    { id: 'notifications', title: t('profile.notifications'), iconType: 'bell', navigate: 'Notifications' },
    { id: 'edit', title: t('profile.editProfile'), iconType: 'edit', navigate: 'EditProfile' },
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
            <View style={[styles.iconCircle, { backgroundColor: theme.palette.warnTint }]}>
              <View style={[styles.iconDot, { backgroundColor: theme.palette.warnBorder }]} />
            </View>
          </View>
        );
      case 'edit':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.palette.blueTint }]}>
              <View style={[styles.iconDot, { backgroundColor: theme.palette.male }]} />
            </View>
          </View>
        );
      case 'card':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.palette.blueTint }]}>
              <View style={[styles.iconDot, { backgroundColor: theme.palette.paid }]} />
            </View>
          </View>
        );
      case 'history':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.palette.dangerTint }]}>
              <View style={[styles.iconDot, { backgroundColor: theme.palette.female }]} />
            </View>
          </View>
        );
      case 'help':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.palette.warnTint }]}>
              <View style={[styles.iconDot, { backgroundColor: theme.palette.warnBorder }]} />
            </View>
          </View>
        );
      case 'settings':
        return (
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.palette.borders.strong }]}>
              <View style={[styles.iconDot, { backgroundColor: theme.palette.text.secondary }]} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.palette.surface} />
      {/* Header with Back Button */}
      <View style={styles.header}>
        {/* T-071 — was a green `←` at 24px that scaled with the system font. */}
        <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />
        <MenuButton color={theme.palette.action} />
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
              <Text style={styles.idLabel}>{t('profile.userId')}</Text>
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
                  navigation.navigate(item.navigate);
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
    backgroundColor: theme.palette.ground,
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
    backgroundColor: theme.palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.borders.strong,
    shadowColor: theme.palette.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  // T-071 — layout only; the tile itself comes from <BackButton />.
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: theme.palette.text.primary,
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
    backgroundColor: theme.palette.surface,
    borderRadius: 20,
    shadowColor: theme.palette.text.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.palette.borders.strong,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.palette.action,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: theme.palette.surface,
    shadowColor: theme.palette.action,
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
    color: theme.palette.surface,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.palette.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 15,
    color: theme.palette.text.secondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  phone: {
    fontSize: 15,
    color: theme.palette.text.secondary,
    marginBottom: 16,
    fontWeight: '500',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.palette.ground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.palette.borders.strong,
  },
  idLabel: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginRight: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  idValue: {
    fontSize: 14,
    color: theme.palette.text.primary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: theme.palette.surface,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: theme.palette.text.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.palette.borders.strong,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.surfaceSunken,
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
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 24,
    color: theme.palette.text.tertiary,
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: theme.palette.danger,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: theme.palette.danger,
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
    color: theme.palette.surface,
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
    color: theme.palette.text.tertiary,
    fontWeight: '500',
  },
});

