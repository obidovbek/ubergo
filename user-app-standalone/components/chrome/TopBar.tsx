/**
 * TopBar — T-101 step 3.
 *
 * Byte-identical across every artboard in both apps, so it is built once and driven by
 * props. Spec in DESIGN-TOKENS.md §6.1.
 *
 *   padding 58px 18px 12px   the 58 is the status bar; we use the real safe-area inset
 *   background               linear-gradient(180deg, #1D9846, #F4F2ED)
 *   grid 1fr auto 1fr        so the centre block stays optically centred regardless of
 *                            how wide the left and right clusters are
 *   borderBottom             1px border.chrome
 *
 * The driver app passes `suffix="Driver"`, which renders in `brandSuffix` blue. That is
 * the ONLY colour difference between the two apps (DESIGN-TOKENS.md §1) — it is a
 * sub-brand word, NOT an accent: buttons and tabs are green in both apps.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../themes';
import { Icon } from './Icon';
import { Badge } from './Badge';

interface TopBarProps {
  /** Shown under the wordmark, e.g. "Asosiy menyu". */
  title?: string;
  /**
   * T-101 step 8 — the gradient is NOT universal, which reading the spec would not tell
   * you. Measured across the artboards: `UserMenuNeW` and `UserMyOrder` carry
   * `linear-gradient(180deg,#1D9846,#F4F2ED)`; `UserBuyurtma` and `UserQidiruv` are a
   * FLAT `#F4F2ED`. Form screens sit on the flat ground, landing screens on the
   * gradient.
   */
  background?: 'gradient' | 'flat';
  /**
   * T-101 step 8 — a back arrow in place of the hamburger.
   *
   * ⚠️ NOT IN THE ARTBOARDS, and deliberately so. Every board draws the drawer-first
   * chrome because each is a standalone frame; it does not model being PUSHED. In the
   * real navigator `CreatePassengerOffer` pushes OVER the tab bar, so without this the
   * screen has no way back at all — a dead end the artboard cannot show.
   */
  onBackPress?: () => void;
  /** Driver app passes "Driver". Omitted in the user app. */
  suffix?: string;
  /** Initials. The artboards have no image variant of the avatar. */
  initials?: string;
  notificationCount?: number | null;
  onMenuPress?: () => void;
  onBellPress?: () => void;
  onAvatarPress?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  background = 'gradient',
  onBackPress,
  suffix,
  initials = '',
  notificationCount,
  onMenuPress,
  onBellPress,
  onAvatarPress,
}) => {
  const insets = useSafeAreaInsets();

  const barStyle = [styles.bar, { paddingTop: insets.top + 12 }];

  const content = (
    <>
      {/* left cluster */}
      <View style={styles.side}>
        {onBackPress ? (
          <Pressable
            onPress={onBackPress}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel="Orqaga"
            hitSlop={4}
          >
            <Icon name="chevronLeft" size={22} color={theme.palette.text.primary} />
          </Pressable>
        ) : (
          <Pressable
            onPress={onMenuPress}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel="Menyu"
            hitSlop={4}
          >
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
          </Pressable>
        )}

        <Pressable
          onPress={onBellPress}
          style={styles.bellButton}
          accessibilityRole="button"
          accessibilityLabel={
            notificationCount
              ? `Bildirishnomalar, ${notificationCount} ta yangi`
              : 'Bildirishnomalar'
          }
          hitSlop={4}
        >
          <Icon name="bell" size={22} color={theme.palette.text.primary} />
          <Badge count={notificationCount} variant="ringed" />
        </Pressable>
      </View>

      {/* centre: wordmark + optional screen title */}
      <View style={styles.centre}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmark}>UbexGo</Text>
          {suffix ? <Text style={styles.wordmarkSuffix}>{suffix}</Text> : null}
        </View>
        {title ? (
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        ) : null}
      </View>

      {/* right cluster */}
      <View style={styles.sideEnd}>
        <Pressable
          onPress={onAvatarPress}
          style={styles.avatar}
          accessibilityRole="button"
          accessibilityLabel="Profil"
          hitSlop={4}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>
    </>
  );

  // A flat header is a plain View: wrapping it in a one-colour LinearGradient would
  // render the same pixels through an extra native view for no reason.
  if (background === 'flat') {
    return <View style={[barStyle, styles.flat]}>{content}</View>;
  }

  return (
    <LinearGradient
      colors={theme.palette.headerGradient}
      // The artboards' gradient is 180deg — straight down.
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={barStyle}
    >
      {content}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.palette.borders.chrome,
  },
  // `flex: 1` on both sides reproduces the artboards' `1fr auto 1fr` grid, which is
  // what keeps the wordmark optically centred rather than pushed off by the two-button
  // left cluster.
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  flat: { backgroundColor: theme.palette.ground },
  sideEnd: { flex: 1, alignItems: 'flex-end' },

  menuButton: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.borderRadius.control,
    backgroundColor: theme.palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.default,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  menuBar: {
    width: 18,
    height: 2,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.palette.text.primary,
  },
  bellButton: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.default,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centre: { alignItems: 'center', gap: 2 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  wordmark: { ...theme.typography.wordmark, color: theme.palette.brand },
  wordmarkSuffix: {
    ...theme.typography.wordmarkSuffix,
    color: theme.palette.brandSuffix,
  },
  title: { ...theme.typography.screenTitle, color: theme.palette.text.primary },

  avatar: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    ...theme.font('sans', 700),
    color: theme.palette.text.onDark,
    letterSpacing: 0.26,
  },
});
