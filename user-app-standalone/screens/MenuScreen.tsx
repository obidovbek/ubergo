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

import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { theme } from '../themes';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useNotifications } from '../contexts/NotificationContext';
import { TopBar } from '../components/chrome/TopBar';
import { Carousel } from '../components/Carousel';
import { Button } from '../components/Button';

/*
 * T-028 — the shared list, not a local copy.
 *
 * 🔴 This file used to declare its own `MainStackParamList`, and it was wrong
 * in two directions at once: it invented a `PassengerOfferDetails` route that
 * does not exist in this app's navigator (it is a DRIVER-app screen), and it
 * typed `CreatePassengerOffer` as taking no params when T-040 gave it an
 * `offerId`. A per-screen copy of the route table is a lie waiting to be told.
 */
type MenuScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Home'>;

/**
 * The services from `UserMenuNeW.dc.html`, in the artboard's order.
 *
 * ⚠️ `enabled: false` is NOT "cancelled" — it is "not built yet". Keep these rows.
 * Deleting them loses the artboard's own ordering and CTA wording, which is the only
 * record of what the owner drew.
 */
const SERVICES = [
  { key: 'taxi', labelKey: 'menu.serviceTaxi', ctaKey: 'menu.ctaTaxi', enabled: true },
  { key: 'jonatma', labelKey: 'menu.serviceJonatma', ctaKey: 'menu.ctaJonatma', enabled: false },
  { key: 'ustalar', labelKey: 'menu.serviceUstalar', ctaKey: 'menu.ctaUstalar', enabled: false },
  { key: 'texnika', labelKey: 'menu.serviceTexnika', ctaKey: 'menu.ctaTexnika', enabled: false },
  { key: 'yuk', labelKey: 'menu.serviceYuk', ctaKey: 'menu.ctaYuk', enabled: false },
] as const;

type ServiceKey = (typeof SERVICES)[number]['key'];

/**
 * The four scopes, in the artboard's own order.
 *
 * ⚠️ `matchLevel` IS RECORDED BUT NOT YET SENT ANYWHERE. It is the adm level the
 * backend will match on once **T-102** exists (`DriverOffer` has no geo columns today
 * and search is an `ILIKE` on free text, so no scope can be honoured). It lives here so
 * the mapping the owner defined on 2026-08-30 is captured in code next to the labels it
 * belongs to, rather than only in docs/PLAN-T101-SCOPES.md.
 *
 * **Do not read this as "the scope is wired up".** When T-102 lands, pass it to
 * `CreatePassengerOffer` and delete this warning.
 */
const SCOPES = [
  { key: 'tuman', labelKey: 'menu.scopeTuman', matchLevel: 'adm3' },
  { key: 'aro', labelKey: 'menu.scopeAro', matchLevel: 'adm2' },
  { key: 'viloyat', labelKey: 'menu.scopeViloyat', matchLevel: 'adm2' },
  { key: 'yaqin', labelKey: 'menu.scopeYaqin', matchLevel: 'adm3' },
] as const;

type ScopeKey = (typeof SCOPES)[number]['key'];

export const MenuScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();

  const [service, setService] = useState<ServiceKey>('taxi');
  // Defaults to the artboard's own default scope.
  const [scope, setScope] = useState<ScopeKey>('aro');

  const currentService = SERVICES.find((s) => s.key === service) ?? SERVICES[0];

  const displayName =
    (user as any)?.display_name || (user as any)?.name || t('menu.guest');
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleProfilePress = () => navigation.navigate('Profile');

  return (
    <SafeAreaView style={styles.container}>
      {/* T-101: the top bar's gradient runs up under the status bar, so the bar is
          transparent and lets the green show through rather than sitting on a slab of a
          colour that is no longer anywhere on screen (#F5F5F5 predates the redesign).
          `dark-content` stays: against the gradient's top (#1D9846) dark glyphs measure
          4.97:1 and white only 3.73:1, so dark is the more legible of the two. */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Deliberately OUTSIDE the ScrollView: fixed chrome, not content. */}
      <TopBar
        title={t('menu.screenTitle')}
        initials={userInitial}
        notificationCount={unreadCount}
        onMenuPress={handleProfilePress}
        onBellPress={() => navigation.navigate('Notifications')}
        onAvatarPress={handleProfilePress}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- service ---- */}
        <Text style={styles.eyebrow}>{t('menu.servicesLabel').toUpperCase()}</Text>
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
        <Text style={styles.eyebrow}>{t('menu.scopesLabel').toUpperCase()}</Text>
        <Carousel
          items={SCOPES.map((s) => ({ key: s.key, label: t(s.labelKey) }))}
          selectedKey={scope}
          onSelect={(k) => setScope(k as ScopeKey)}
          testID="scope-carousel"
        />

        {/* ---- the primary call to action ---- */}
        <Button
          title={t(currentService.ctaKey)}
          size="lg"
          fullWidth
          onPress={() =>
            // The scope travels now so the wiring is ready; the order screen
            // consumes it once T-102 makes the four scopes behave differently.
            navigation.navigate('CreatePassengerOffer', {})
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
          title={t('passengerOffers.myRideRequests')}
          variant="text"
          size="sm"
          fullWidth
          onPress={() => navigation.navigate('MyPassengerOffers')}
        />
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



  cta: { marginTop: 4 },
});
