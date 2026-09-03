/**
 * NavDrawer — the artboard's slide-in navigation menu. T-101 step 11.
 *
 * 🔴 THE APP HAD NO DRAWER AT ALL. `MenuButton.tsx` said so outright ("the app has no
 * drawer navigator"), and the hamburger `TopBar` has drawn since step 3 was wired to
 * whatever each screen had lying around — it opened the PROFILE on the home screen and
 * navigated Home from the orders tab. Every artboard draws this menu behind that button.
 *
 * Measured from `UserMyOrder.dc.html` (lines 39-66) — the same block appears on the menu
 * boards:
 *
 *   scrim    rgba(ink,.32)          `scrim.drawer`
 *   panel    width 270, ground, right border `borders.default`, `shadows.drawer`
 *            padding 58px 14px 24px  — the 58 is the status bar; we use the real inset
 *   wordmark 19px/900 brand, padding 0 10 14
 *   group    minHeight 46, radius 12, padding 4px 10px, label 14.5/700, arrow 11/800
 *   child    minHeight 38, radius 10, padding 4px 10px 4px 22px, 13.5/600
 *   separator 1px `borders.strong`, margin 7px 8px
 *
 * ⚠️ NOT a `@react-navigation/drawer` navigator. That would be a new dependency (rule 4)
 * and would have to wrap the whole tree; this is a `Modal` over the current screen, which
 * is what the artboards actually draw — a panel over the page, not a navigator.
 *
 * ⚠️ `Modal` renders OUTSIDE the SafeAreaProvider, so insets must be applied by hand —
 * the device bug found on an S24 Ultra in step 8e, where the system navigation bar sat
 * over the sheet. Same reason `BottomSheet` does it.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { MainNavigationProp, ParamlessRoute } from '../../navigation/types';
import { useTranslation } from '../../hooks/useTranslation';
import { theme } from '../../themes';

/**
 * One drawer entry.
 *
 * `route` is typed `ParamlessRoute`, so an entry pointing at a screen that NEEDS params
 * (`OfferDetails`, `OfferDrivers`) does not compile. That type is derived from the param
 * list rather than hand-listed, so it stays correct on its own.
 *
 * An entry with **no** `route` is one the app has not built yet. It renders dimmed with a
 * "soon" marker rather than as a dead tap — the artboards do the same with their unbuilt
 * services, and the artboard's own `navGo()` handles exactly ONE of these ten labels and
 * merely closes the menu for the rest. *The design has always known most of this menu is
 * aspirational; showing it as live would be the lie.*
 */
interface NavEntry {
  labelKey: string;
  route?: ParamlessRoute;
}

interface NavGroup {
  labelKey: string;
  /** Draws a separator ABOVE the group — the artboard's own `sep` flag. */
  separator?: boolean;
  /** A group with children expands; one without is itself a link. */
  children?: NavEntry[];
  route?: ParamlessRoute;
}

/** The artboard's `NAV` array, label for label and in its order. */
const NAV: NavGroup[] = [
  {
    labelKey: 'drawer.groupOrder',
    children: [
      { labelKey: 'drawer.orderCreate', route: 'CreatePassengerOffer' },
      { labelKey: 'drawer.orderMine', route: 'MyBookings' },
    ],
  },
  {
    labelKey: 'drawer.groupMessages',
    separator: true,
    children: [
      { labelKey: 'drawer.messagesAll', route: 'Notifications' },
      // No service-message stream exists; the API has one notification feed.
      { labelKey: 'drawer.messagesService' },
    ],
  },
  { labelKey: 'drawer.chat' },
  { labelKey: 'drawer.balance', separator: true },
  { labelKey: 'drawer.promo' },
  { labelKey: 'drawer.promotions' },
  { labelKey: 'drawer.contacts', separator: true },
  { labelKey: 'drawer.settings', route: 'Profile' },
  { labelKey: 'drawer.prices' },
  { labelKey: 'drawer.guides' },
];

interface NavDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const NavDrawer: React.FC<NavDrawerProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<MainNavigationProp>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // 270 is the artboard's width on a 402pt frame. On a narrow phone that would crowd the
  // page it sits over, so it is capped at 78% — the panel is a peek, not a takeover.
  const panelWidth = Math.min(270, width * 0.78);

  const go = (route?: ParamlessRoute) => {
    if (!route) return; // unbuilt: the row is not pressable, but stay defensive
    onClose();
    navigation.navigate(route);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('drawer.close')}
        />

        <View
          style={[
            styles.panel,
            {
              width: panelWidth,
              paddingTop: insets.top + 14,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <View style={styles.brandRow}>
            <Text style={styles.wordmark}>UbexGo</Text>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {NAV.map((group) => {
              const expandable = !!group.children?.length;
              const isOpen = openGroup === group.labelKey;
              // A group is inert only when it neither expands nor points anywhere.
              const inert = !expandable && !group.route;

              return (
                <View key={group.labelKey}>
                  {group.separator && <View style={styles.separator} />}

                  <Pressable
                    style={styles.group}
                    disabled={inert}
                    onPress={() =>
                      expandable
                        ? setOpenGroup(isOpen ? null : group.labelKey)
                        : go(group.route)
                    }
                    accessibilityRole={expandable ? 'button' : 'link'}
                    accessibilityState={expandable ? { expanded: isOpen } : undefined}
                  >
                    <Text style={[styles.groupLabel, inert && styles.inertText]}>
                      {t(group.labelKey)}
                    </Text>
                    {expandable ? (
                      <Text style={styles.arrow}>{isOpen ? '▾' : '▸'}</Text>
                    ) : inert ? (
                      <Text style={styles.soon}>{t('drawer.soon')}</Text>
                    ) : null}
                  </Pressable>

                  {expandable && isOpen && (
                    <View style={styles.children}>
                      {group.children!.map((child) => {
                        const childInert = !child.route;
                        return (
                          <Pressable
                            key={child.labelKey}
                            style={styles.child}
                            disabled={childInert}
                            onPress={() => go(child.route)}
                            accessibilityRole="link"
                          >
                            <Text
                              style={[styles.childLabel, childInert && styles.inertText]}
                            >
                              {t(child.labelKey)}
                            </Text>
                            {childInert && <Text style={styles.soon}>{t('drawer.soon')}</Text>}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.palette.scrim.drawer },
  panel: {
    backgroundColor: theme.palette.ground,
    borderRightWidth: theme.sizes.borderHairline,
    borderRightColor: theme.palette.borders.default,
    paddingHorizontal: 14,
    ...theme.shadows.drawer,
  },
  brandRow: { paddingHorizontal: 10, paddingBottom: 14 },
  wordmark: {
    fontSize: 19,
    ...theme.font('sans', 900),
    letterSpacing: -0.38,
    color: theme.palette.brand,
  },

  list: { flex: 1, minHeight: 0 },
  listContent: { gap: 1, paddingBottom: 8 },

  separator: {
    height: 1,
    marginVertical: 7,
    marginHorizontal: 8,
    backgroundColor: theme.palette.borders.strong,
  },

  group: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.xl,
  },
  groupLabel: {
    flex: 1,
    fontSize: 14.5,
    ...theme.font('sans', 700),
    color: theme.palette.text.primary,
    lineHeight: 18,
  },
  arrow: { fontSize: 11, ...theme.font('sans', 800), color: theme.palette.text.tertiary },

  children: { gap: 1, paddingTop: 1, paddingBottom: 5 },
  child: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 10,
    paddingLeft: 22,
    borderRadius: theme.borderRadius.md,
  },
  childLabel: {
    flex: 1,
    fontSize: 13.5,
    ...theme.font('sans', 600),
    color: theme.palette.text.secondary,
    lineHeight: 17,
  },

  /*
   * ⚠️ An unbuilt entry is DIMMED AND LABELLED, not hidden. Hiding it would make the menu
   * disagree with every artboard; leaving it plain would promise a screen that does not
   * exist. `text.tertiary` keeps the label readable (4.61:1 on ground) — this is
   * information, not decoration, so it must not drop below AA.
   */
  inertText: { color: theme.palette.text.tertiary },
  soon: {
    ...theme.typography.monoTiny,
    ...theme.font('mono', 500),
    color: theme.palette.text.tertiary,
  },
});
