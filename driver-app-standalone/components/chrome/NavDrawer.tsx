/**
 * NavDrawer — the artboard's slide-in navigation menu. T-101 step 15 (driver app).
 *
 * 🔴 THE DRIVER APP HAD NO DRAWER EITHER, and its hamburger had the SAME defect the user
 * app's did: `MenuScreen` passed `onMenuPress={handleProfilePress}`, so the hamburger
 * opened the PROFILE — which is exactly what the avatar beside it already did. Two
 * controls, one destination, and the menu every artboard draws behind that button did not
 * exist. (The user app's twin was found in step 11; this is the same defect in the other
 * app, which is the single most repeated shape of bug in this project.)
 *
 * Ported from `user-app-standalone/components/chrome/NavDrawer.tsx` — the chrome
 * components are duplicated per app on purpose, not shared. The LAYOUT is identical
 * (both apps' artboards draw the same panel); only the NAV table below differs.
 *
 * Measured from `htmlDesign/DriverMenu.dc.html` (lines 34-60):
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
 * ⚠️ `Modal` renders OUTSIDE the SafeAreaProvider, so insets must be applied by hand.
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
import { createTheme } from '../../themes';

const theme = createTheme('light');

/**
 * One drawer entry.
 *
 * `route` is typed `ParamlessRoute`, so an entry pointing at a screen that NEEDS params
 * (`OfferPassengers`, `PassengerOfferDetails`) does not compile. That type is derived from
 * the param list rather than hand-listed, so it stays correct on its own.
 *
 * An entry with **no** `route` is one this app has not built yet. It renders dimmed with a
 * "soon" marker rather than as a dead tap — the artboard does the same, and its own
 * `UBX_GO` table resolves only 13 of its labels, merely closing the menu for the rest.
 * *The design has always known part of this menu is aspirational.*
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

/**
 * The artboard's `UBX_NAV` array, label for label and in its order.
 *
 * 🛑 SIX ENTRIES HAVE NO SCREEN IN THIS APP and are deliberately left routeless:
 *   • Balans / Daromad va xarajatlar — step 19, flagged there as genuinely NEW work that
 *     touches T-087's ledger, not a repaint. No wallet screen exists to point at.
 *   • Xabarlar (chat) — there is no chat feature; the API has one notification feed, which
 *     the bell already opens.
 *   • Mening mashinalarim — the artboard's multi-vehicle list. The driver profile carries a
 *     SINGLE vehicle (a registration step), so there is no list screen -> step 21.
 *   • Barcha hujjatlar — the documents HUB (`DriverHujjatlar`) does not exist; the four
 *     individual document screens below it DO, and are routed.
 *   • Yo'riqnomalar — no guides screen.
 *
 * ⚠️ "Kelgan buyurtmalar" and "Mening buyurtmalarim" are DIFFERENT things here, and the
 * artboard's own `UBX_GO` conflates them (both point at DriverMyOrder). In this app the
 * incoming side is `SearchPassengerOffers` (passenger orders a driver can bid on) and the
 * own side is `MyJoinRequests` (bids he has already sent). Following the artboard's table
 * literally would have sent both rows to the same screen.
 */
const NAV: NavGroup[] = [
  {
    labelKey: 'drawer.groupOffers',
    children: [
      { labelKey: 'drawer.offerCreate', route: 'OfferWizard' },
      { labelKey: 'drawer.offerMine', route: 'OffersList' },
    ],
  },
  {
    labelKey: 'drawer.groupOrders',
    separator: true,
    children: [
      { labelKey: 'drawer.ordersIncoming', route: 'SearchPassengerOffers' },
      { labelKey: 'drawer.ordersMine', route: 'MyJoinRequests' },
    ],
  },
  // No vehicle LIST screen — the profile holds one vehicle. Step 21.
  { labelKey: 'drawer.cars' },
  // No chat feature; the bell opens the one notification feed there is.
  { labelKey: 'drawer.messages' },
  { labelKey: 'drawer.balance', separator: true },
  { labelKey: 'drawer.income' },
  { labelKey: 'drawer.profile', route: 'Profile' },
  {
    labelKey: 'drawer.groupDocs',
    children: [
      // The hub screen does not exist; the four documents below it do.
      { labelKey: 'drawer.docsAll' },
      { labelKey: 'drawer.docsPassport', route: 'DriverPassport' },
      { labelKey: 'drawer.docsLicense', route: 'DriverLicense' },
      { labelKey: 'drawer.docsTechPassport', route: 'DriverVehicle' },
      { labelKey: 'drawer.docsTaxiLicense', route: 'DriverTaxiLicense' },
    ],
  },
  { labelKey: 'drawer.settings', separator: true, route: 'EditProfile' },
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
   * exist. `text.tertiary` keeps the label readable — this is information, not decoration,
   * so it must not drop below AA.
   */
  inertText: { color: theme.palette.text.tertiary },
  soon: {
    ...theme.typography.monoTiny,
    ...theme.font('mono', 500),
    color: theme.palette.text.tertiary,
  },
});
