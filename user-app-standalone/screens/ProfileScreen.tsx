/**
 * Profile Screen
 * User profile and settings
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { createTheme } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { showConfirmDialog } from '../utils/confirmDialog';
import { useNavigation } from '@react-navigation/native';
import type { MainNavigationProp, ParamlessRoute } from '../navigation/types';
import { TopBar } from '../components/chrome/TopBar';
import { NavDrawer } from '../components/chrome/NavDrawer';

const theme = createTheme('light');

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<MainNavigationProp>();
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  return (
    /*
     * ⚠️ `edges` WITHOUT 'top' — `TopBar` applies the top inset itself. The step-8
     * double-inset defect.
     */
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/*
        ⚠️ This is a TAB destination, so it gets no back arrow — the old header had one
        beside a MenuButton, which on a tab was a route to nowhere in particular. The
        hamburger now opens the real drawer (step 11).
      */}
      <TopBar
        title={t('profile.title')}
        initials={userInitial}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*
          The artboard's identity block: a near-black avatar disc, the name, and the phone
          in MONO. `UserMainMenu.dc.html` line 92-97 — the avatar is `text.primary` with
          `text.onDark` initials, NOT a tinted circle.
        */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.phone} numberOfLines={1}>
              {userPhone}
            </Text>
            {!!userEmail && (
              <Text style={styles.email} numberOfLines={1}>
                {userEmail}
              </Text>
            )}
          </View>
        </View>

        {user?.id && (
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>{t('profile.userId')}</Text>
            <Text style={styles.idValue}>{user.id}</Text>
          </View>
        )}

        {/*
          🔴 THE COLOURED ICON CIRCLES ARE GONE, and that is the point of this step.

          Each row used to carry a tinted disc with a coloured dot — amber, blue, indigo,
          pink, grey. `UserMainMenu.dc.html`'s menu has **no icon circles at all**: it is
          monochrome ink with green accents, verified by counting the artboard's own
          literals. The pairs were mapped to the nearest tokens in the 2026-08-31 repaint
          only to clear the ratchet, with a note that deleting them belonged to this step.

          ⚠️ They were also not carrying information: `bell` and `help` rendered the SAME
          amber pair, and `edit` and `card` the same blue tint. Five colours encoding six
          rows, two of them duplicated — decoration reading as a system.
        */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => {
            const unbuilt = !item.navigate;
            return (
              <Pressable
                key={item.id}
                style={[styles.menuItem, index === menuItems.length - 1 && styles.menuItemLast]}
                disabled={unbuilt}
                onPress={() => item.navigate && navigation.navigate(item.navigate)}
                accessibilityRole="link"
              >
                <Text style={[styles.menuTitle, unbuilt && styles.menuTitleUnbuilt]}>
                  {item.title}
                </Text>
                {/*
                  ⚠️ An unbuilt row says so, exactly as the drawer's do (step 11). The old
                  code ran `console.log('Navigate to …')` on tap — indistinguishable from a
                  broken app to anyone holding the phone.
                */}
                {unbuilt ? (
                  <Text style={styles.soon}>{t('drawer.soon')}</Text>
                ) : (
                  <Text style={styles.chevron}>›</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* The artboard's one red row. `dangerText` is the ink tier, not the `danger` fill. */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </Pressable>

        <Text style={styles.appInfo}>{t('profile.appVersion')}</Text>
      </ScrollView>

      <NavDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.ground },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 40, gap: 12 },

  // ---------------------------------------------------------------- identity
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.chrome,
    borderRadius: theme.borderRadius.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 17, ...theme.font('sans', 800), color: theme.palette.text.onDark },
  identityText: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 15, ...theme.font('sans', 800), color: theme.palette.text.primary },
  phone: {
    ...theme.typography.monoMeta,
    ...theme.font('mono', 500),
    color: theme.palette.text.secondary,
  },
  email: { fontSize: 12, ...theme.font('sans', 500), color: theme.palette.text.tertiary },

  idRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 4,
  },
  idLabel: { fontSize: 11, ...theme.font('sans', 600), color: theme.palette.text.tertiary },
  idValue: {
    ...theme.typography.monoMeta,
    ...theme.font('mono', 600),
    color: theme.palette.text.secondary,
  },

  // ---------------------------------------------------------------- menu
  menuCard: {
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.chrome,
    borderRadius: theme.borderRadius.card,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  menuItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.md,
    borderBottomWidth: theme.sizes.borderHairline,
    borderBottomColor: theme.palette.borders.chrome,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuTitle: {
    flex: 1,
    fontSize: 13.5,
    ...theme.font('sans', 600),
    color: theme.palette.text.primary,
  },
  menuTitleUnbuilt: { color: theme.palette.text.tertiary },
  chevron: { fontSize: 17, color: theme.palette.text.chevron },
  soon: {
    ...theme.typography.monoTiny,
    ...theme.font('mono', 500),
    color: theme.palette.text.tertiary,
  },

  // ---------------------------------------------------------------- logout
  logoutButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderEmphasis,
    borderColor: theme.palette.dangerBorder,
    borderRadius: theme.borderRadius.field,
  },
  logoutText: { fontSize: 14, ...theme.font('sans', 800), color: theme.palette.dangerText },

  appInfo: {
    textAlign: 'center',
    ...theme.typography.helper,
    color: theme.palette.text.tertiary,
  },
});
