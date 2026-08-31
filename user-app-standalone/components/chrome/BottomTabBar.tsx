/**
 * BottomTabBar — T-101 step 3.
 *
 * Spec in DESIGN-TOKENS.md §6.2:
 *   grid of 5 equal columns, padding 8px 6px 6px, borderTop 1px border.chrome
 *   item     minHeight 44, gap 3, icon 24 in a 26 box (stroke 1.8), label 10.5
 *   active   action green, weight 800     inactive  text.tertiary, weight 600
 *   badge    plain variant (no ring)
 *   below    home indicator 132x5, radius 99, text.primary
 *
 * Rendered through React Navigation's `tabBar` slot so the navigator owns the state —
 * the artboards fake it with local state and hrefs, which is not something to copy.
 *
 * ⚠️ `UserMainMenu`'s tab bar has NO background while `UserMenuNeW`'s sets `ground`.
 * The owner chose UserMenuNeW as canonical, and a transparent bar over a scrolling list
 * would let content show through, so the background is always set.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { theme } from '../../themes';
import { Icon, type IconName } from './Icon';
import { Badge } from './Badge';

/** Maps a route name to its artboard icon. Extend per app. */
export type TabIconMap = Record<string, IconName>;

interface Props extends BottomTabBarProps {
  icons: TabIconMap;
  /** Route name -> badge count, e.g. `{ Orders: 3 }`. */
  badges?: Record<string, number | null | undefined>;
}

export const BottomTabBar: React.FC<Props> = ({
  state,
  descriptors,
  navigation,
  icons,
  badges = {},
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            options.tabBarLabel !== undefined && typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const tint = focused
            ? theme.palette.action
            : theme.palette.text.tertiary;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({ type: 'tabLongPress', target: route.key })
              }
              style={styles.item}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
            >
              <View style={styles.iconBox}>
                <Icon name={icons[route.name] ?? 'home'} color={tint} />
                <Badge count={badges[route.name]} variant="plain" />
              </View>
              <Text
                style={[
                  focused
                    ? theme.typography.tabLabelActive
                    : theme.typography.tabLabelInactive,
                  styles.label,
                  { color: tint },
                ]}
                numberOfLines={2}
                // The bar is a fixed 5 columns, so a long label must shrink rather
                // than push its neighbours. Matches the wordmark's own treatment.
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Home indicator. On a device with a gesture bar the OS draws its own, so this
          only renders where the inset is absent — otherwise the two stack up. */}
      {insets.bottom > 0 ? (
        <View style={{ height: insets.bottom }} />
      ) : (
        <View style={styles.indicatorRow}>
          <View style={styles.indicator} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.palette.ground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.palette.borders.chrome,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  item: {
    flex: 1,
    // `minWidth: 0` lets the column actually shrink to its 1/5 share. Without it a
    // long label ("Mening buyurtmalarim") overflows its column and collides with the
    // neighbouring tab instead of wrapping inside its own.
    minWidth: 0,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
    gap: 3,
  },
  label: {
    textAlign: 'center',
    // The artboards wrap this label onto two lines on purpose — it is the longest in
    // the set. Reserving both lines' height on EVERY tab keeps the icon row aligned
    // whether a label wraps or not.
    width: '100%',
  },
  iconBox: {
    width: theme.sizes.tabIconBox,
    height: theme.sizes.tabIconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorRow: { alignItems: 'center', paddingTop: 6, paddingBottom: 10 },
  indicator: {
    width: theme.sizes.homeIndicator.width,
    height: theme.sizes.homeIndicator.height,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.text.primary,
  },
});
