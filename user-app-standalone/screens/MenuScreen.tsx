/**
 * Menu Screen (Home) — rebuilt on `UserMenuNeW.dc.html`, T-101 step 6.
 *
 * The owner chose `UserMenuNeW` as the canonical main menu on 2026-08-30 (there were
 * two competing artboards; `UserMainMenu` is the other and is now superseded).
 *
 * THE SHAPE OF THIS SCREEN: pick a SERVICE, pick a SCOPE, press the CTA.
 *
 *   service   A CAROUSEL showing ALL FIVE. Taksi is the only one enabled; the other
 *             four render dimmed and inert — "not built yet", not "cancelled". The
 *             owner confirmed 2026-08-30 that Jo'natma, Ustalar, Maxsus texnika and
 *             Yukmashina ARE COMING, so showing them keeps the product's shape visible
 *             as it grows. Adding one is a line in SERVICES plus a route.
 *
 *             🔴 I ORIGINALLY HID THIS ROW while only one service was enabled, reasoning
 *             that a one-option picker is noise. That was wrong: the owner had just said
 *             the others are coming, and hiding it made the service concept look deleted.
 *             Do not "tidy" it away again.
 *
 *   scope     A CAROUSEL of the four adm-level order scopes.
 *             **Xalqaro is omitted** — it appears in no scope rule the owner defined
 *             and has no adm mapping. See docs/PLAN-T101-SCOPES.md.
 *
 *   CTA       Carries the chosen service + scope to the order screen.
 *
 * ⚠️ Choosing a scope currently only STYLES the selection and travels with the CTA.
 * The four scopes need backend matching that does not exist yet (**T-102**: `DriverOffer`
 * has no geo columns and search is an `ILIKE` on free text). Until then all four behave
 * identically. This must not be presented as delivering the scopes.
 *
 * 🛑 NOT SHIPPED, all for one reason — they would be FABRICATED STATE: the active-trip
 * banner (no live-trip endpoint), recent routes (the artboard's are hardcoded), and the
 * balance/promo/trips stats (the wallet is step 19). The artboard shows all three with
 * invented data.
 */

import React, { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../navigation/types";
import { theme } from "../themes";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { useNotifications } from "../contexts/NotificationContext";
import { TopBar } from "../components/chrome/TopBar";
import { Carousel } from "../components/Carousel";
import { Button } from "../components/Button";
import {
  ORDER_SCOPES,
  DEFAULT_ORDER_SCOPE,
  type OrderScope,
} from "../types/orderScope";
import { useHomeOrders, shortPlace } from "../hooks/useHomeOrders";

/*
 * T-028 — the shared list, not a local copy.
 *
 * 🔴 This file used to declare its own `MainStackParamList`, and it was wrong
 * in two directions at once: it invented a `PassengerOfferDetails` route that
 * does not exist in this app's navigator (it is a DRIVER-app screen), and it
 * typed `CreatePassengerOffer` as taking no params when T-040 gave it an
 * `offerId`. A per-screen copy of the route table is a lie waiting to be told.
 */
type MenuScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  "Home"
>;

/**
 * The services from `UserMenuNeW.dc.html`, in the artboard's order.
 *
 * ⚠️ `enabled: false` is NOT "cancelled" — it is "not built yet". Keep these rows.
 * Deleting them loses the artboard's own ordering and CTA wording, which is the only
 * record of what the owner drew.
 */
const SERVICES = [
  {
    key: "taxi",
    labelKey: "menu.serviceTaxi",
    ctaKey: "menu.ctaTaxi",
    enabled: true,
  },
  {
    key: "jonatma",
    labelKey: "menu.serviceJonatma",
    ctaKey: "menu.ctaJonatma",
    enabled: false,
  },
  {
    key: "ustalar",
    labelKey: "menu.serviceUstalar",
    ctaKey: "menu.ctaUstalar",
    enabled: false,
  },
  {
    key: "texnika",
    labelKey: "menu.serviceTexnika",
    ctaKey: "menu.ctaTexnika",
    enabled: false,
  },
  {
    key: "yuk",
    labelKey: "menu.serviceYuk",
    ctaKey: "menu.ctaYuk",
    enabled: false,
  },
] as const;

type ServiceKey = (typeof SERVICES)[number]["key"];

/**
 * T-101 step 8 — the four scopes moved to `../types/orderScope` when the order screen
 * became a second reader of them. Their caveats (T-102, `matchLevel`) live there.
 */

export const MenuScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();

  const [service, setService] = useState<ServiceKey>("taxi");
  // Defaults to the artboard's own default scope.
  const [scope, setScope] = useState<OrderScope>(DEFAULT_ORDER_SCOPE);

  const currentService = SERVICES.find((s) => s.key === service) ?? SERVICES[0];

  /*
    T-101 step 6b — the two blocks that fill the space below the CTA. Both come from ONE
    request for the user's own orders, and both render nothing when there are none.
    Step 6 left this area empty on purpose because the artboard fills it with invented
    data; these are the same blocks built from real data instead.
  */
  const { activeOffer, recentRoutes } = useHomeOrders();

  const displayName =
    (user as any)?.display_name || (user as any)?.name || t("menu.guest");
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleProfilePress = () => navigation.navigate("Profile");

  return (
    <SafeAreaView style={styles.container}>
      {/* T-101: the top bar's gradient runs up under the status bar, so the bar is
          transparent and lets the green show through rather than sitting on a slab of a
          colour that is no longer anywhere on screen (#F5F5F5 predates the redesign).
          `dark-content` stays: against the gradient's top (#1D9846) dark glyphs measure
          4.97:1 and white only 3.73:1, so dark is the more legible of the two. */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Deliberately OUTSIDE the ScrollView: fixed chrome, not content. */}
      <TopBar
        title={t("menu.screenTitle")}
        initials={userInitial}
        notificationCount={unreadCount}
        onMenuPress={handleProfilePress}
        onBellPress={() => navigation.navigate("Notifications")}
        onAvatarPress={handleProfilePress}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- service ---- */}
        <Text style={styles.eyebrow}>
          {t("menu.servicesLabel").toUpperCase()}
        </Text>
        <Carousel
          items={SERVICES.map((s) => ({
            key: s.key,
            label: t(s.labelKey),
            enabled: s.enabled,
          }))}
          selectedKey={service}
          onSelect={(k) => setService(k as ServiceKey)}
          testID="service-carousel"
        />

        {/* ---- scope ---- */}
        <Text style={styles.eyebrow}>
          {t("menu.scopesLabel").toUpperCase()}
        </Text>
        <Carousel
          items={ORDER_SCOPES.map((s) => ({
            key: s.key,
            label: t(s.labelKey),
          }))}
          selectedKey={scope}
          onSelect={(k) => setScope(k as OrderScope)}
          testID="scope-carousel"
        />

        {/* ---- the primary call to action ---- */}
        <Button
          title={t(currentService.ctaKey)}
          size="lg"
          fullWidth
          onPress={() =>
            // T-101 step 8 — the scope now really does travel; before, this said it
            // did and navigated with `{}`. The order screen uses it to NAME itself
            // (the four artboards differ in that subtitle). It still does not change
            // matching — that stays blocked on T-102.
            navigation.navigate("CreatePassengerOffer", { scope })
          }
          style={styles.cta}
        />

        {/*
          🔴 THIS LINK IS WHAT KEEPS `MyPassengerOffers` REACHABLE.

          The owner removed the four action cards on 2026-08-30 because the tab bar and
          drawer already cover them. That is true for three of the four — SearchOffers
          and MyBookings are TABS, and CreatePassengerOffer is this screen's own CTA —
          but `MyPassengerOffers` is a STACK-ONLY route with no other entry point, so
          deleting its card outright would have stranded a working screen.

          Checked, not assumed: nothing else in the app navigates to it, `MyBookings`
          has no ride-requests section, and the drawer config is stale placeholder data.
          The right long-term home is a segment inside MyBookings — that belongs to
          step 9, which rebuilds both screens together. Until then, one text link.
        */}
        <Button
          title={t("passengerOffers.myRideRequests")}
          variant="text"
          size="sm"
          fullWidth
          onPress={() => navigation.navigate("MyPassengerOffers")}
        />

        {/*
          ---- the active order ----

          Position is measured, not guessed: in `UserMenuNeW.dc.html` the banner sits
          BELOW the carousels and the CTA, not above them.

          Near-black card, radius 22, a green dot, a mono eyebrow and the route — the
          artboard's own treatment. Its third line there is invented ("Sardor A. ·
          Malibu 01 A 777 · 12 daqiqada"); ours is the real status, which is the whole
          reason this block can ship now and could not in step 6.
        */}
        {!!activeOffer && (
          <TouchableOpacity
            style={styles.activeCard}
            /*
              `OfferDrivers`, NOT `OfferDetails`. `OfferDetails` shows a DRIVER's offer
              with a join button — the passenger's own order has no such page. This is
              where `MyPassengerOffersScreen` sends its own rows too, and it is the
              screen that answers the banner's question: who has responded?
            */
            onPress={() =>
              navigation.navigate("OfferDrivers", { offerId: activeOffer.id })
            }
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <View style={styles.activeDot} />

            <View style={styles.activeBody}>
              <Text style={styles.activeEyebrow}>
                {t("menu.activeTrip").toUpperCase()}
              </Text>
              <Text style={styles.activeRoute} numberOfLines={2}>
                {shortPlace(activeOffer.from_text)} →{" "}
                {shortPlace(activeOffer.to_text)}
              </Text>
              <Text style={styles.activeMeta} numberOfLines={1}>
                {activeOffer.status === "driver_found"
                  ? t("menu.activeDriverFound")
                  : t("menu.activeWaiting")}
              </Text>
            </View>

            <Text style={styles.activeChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/*
          ---- order again ----

          The artboard declares a `routes` list and then leaves its markup EMPTY, so the
          design defines the data and not the appearance. Drawn here as compact chips,
          which is the shape the rest of this screen already uses.

          Tapping one opens the order form; it does NOT pre-fill the route yet — that
          needs the geo ids, and `from_text` is a display string. Kept honest rather
          than half-wired: the shortcut is the screen, not the addresses.
        */}
        {recentRoutes.length > 0 && (
          <>
            <Text style={styles.eyebrow}>
              {t("menu.recentRoutes").toUpperCase()}
            </Text>
            <View style={styles.recentRow}>
              {recentRoutes.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={styles.recentChip}
                  onPress={() =>
                    navigation.navigate("CreatePassengerOffer", { scope })
                  }
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.recentText} numberOfLines={2}>
                    {route.fromText} → {route.toText}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.ground },
  scrollContent: { padding: 18, paddingBottom: 32, gap: 12 },

  eyebrow: {
    ...theme.typography.eyebrow,
    color: theme.palette.text.tertiary,
  },

  /**
   * T-101 step 6b — the active-order banner, measured off `UserMenuNeW.dc.html`:
   * near-black `#16130E` (= `text.primary`), radius 22, pad 14, a 38px green marker.
   * It is the one dark surface on this screen, which is what makes it read as urgent.
   */
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: theme.palette.text.primary,
    marginTop: 4,
  },
  activeDot: {
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: theme.palette.brand,
  },
  activeBody: { flex: 1, minWidth: 0, gap: 3 },
  activeEyebrow: {
    ...theme.typography.eyebrow,
    // On the dark card the eyebrow is a light green, not the grey used on the ground.
    color: theme.palette.successTint,
  },
  activeRoute: {
    ...theme.typography.placeLine,
    color: theme.palette.ground,
    lineHeight: 18,
  },
  activeMeta: {
    ...theme.typography.secondary,
    // NOT `onDark` — that is the same value as `ground`, so this line would render
    // identically to the route above it. Measured tier, 8.76:1.
    color: theme.palette.text.onDarkMuted,
  },
  activeChevron: {
    fontSize: 20,
    color: theme.palette.ground,
  },

  /** "Order again" — the artboard declares the list but draws no markup for it. */
  recentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  recentChip: {
    flexGrow: 1,
    flexBasis: "30%",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.control,
  },
  recentText: {
    ...theme.typography.caption,
    color: theme.palette.text.primary,
  },

  cta: { marginTop: 4 },
});
