/**
 * MyRidesScreen — T-101 step 18d. `DriverMyOrder.dc.html`.
 *
 * ONE screen with three phases, replacing two:
 *   • `OffersListScreen` — the driver's own e'lons (the TAB), and
 *   • `OfferPassengersScreen` — the passengers of ONE e'lon (a pushed detail).
 *
 * The artboard slices by where a ride is in its life, not by which screen the data came
 * from — the same merge as step 9 (user) and step 17 (driver). A ride card expands in
 * place to show its passengers, so the pushed screen disappears.
 *
 * 🔴 THE PHASES ARE DERIVED, NOT STORED (owner decision ②):
 *   Jarayonda = published with seats free · Faol = published with 0 free ·
 *   Tarix = archived or cancelled.
 * `seats_free` drops when a passenger is CONFIRMED, so a ride with four pending requests
 * still reads "collecting" — correct, and deliberately not "fixed" here.
 *
 * 🔴 CARRIED-OVER FIXES — a rewrite is exactly where these go missing, so they are listed:
 *   T-028  `handleCreateOffer` passes NO params (not `offerId: null`); `OfferPassengers`
 *          ids are coerced with `Number(...)` at the boundary — the app's own `id: string`
 *          type is what is wrong (T-085), so the coercion stays until that card lands.
 *   T-055  a passenger's phone is read ONLY through `phoneUnlocked()` on a confirmed row;
 *          the server strips it from every other status.
 *   T-068  a push about one of these rides refreshes in place — the offers list always, and
 *          the open ride's passengers when the push names it. Scoped by `offer_id`, coerced:
 *          push `data` values are strings and `offer.id` is a string over an integer column.
 *   T-078  edit opens the wizard with `{ offerId }`; the wizard owns the 34-field restore.
 *
 * ⚠️ Every server precondition lives in `utils/myRides.ts` (18a), not here: cancel is
 * published-only, publish is archived/cancelled-only (a RE-publish — the server's own rule),
 * delete is archived/cancelled-only. The buttons are drawn from those gates, so a button that
 * would 400 is never shown.
 *
 * ⚠️ `SafeAreaView` is safe-area-context's, with the top edge left to `TopBar` — the double
 * inset step 8 caught. This is a TAB, so the hamburger opens the drawer (step 17h's rule).
 *
 * What is NOT here, on purpose (`PLAN-T101-step18.md` §2 → T-110): delivery steps, parcels,
 * chat, the Budilnik ping, cancel-with-reason for a whole ride, and the `Faol e'lon: 2/2`
 * limit chip — none has a backend.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { MainNavigationProp } from '../navigation/types';
import * as DriverOffersAPI from '../api/driverOffers';
import type { DriverOffer } from '../api/driverOffers';
import * as OfferPassengersAPI from '../api/offerPassengers';
import type { OfferPassenger } from '../api/offerPassengers';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { showConfirmDialog } from '../utils/confirmDialog';
import { getErrorMessage } from '../utils/errorHandler';
import { subscribePushReceived } from '../utils/pushEvents';
import { dialPhone } from '../utils/contactPhone';
import { TopBar } from '../components/chrome/TopBar';
import { NavDrawer } from '../components/chrome/NavDrawer';
import { SegmentedModes } from '../components/chrome/SegmentedModes';
import { MyRideCard } from '../components/rides/MyRideCard';
import { BookingRow } from '../components/rides/BookingRow';
import { BookingSheet } from '../components/rides/BookingSheet';
import { RejectReasonSheet } from '../components/rides/RejectReasonSheet';
import {
  defaultExpandedId,
  groupByPhase,
  PHASE_LABEL_KEY,
  PHASES,
  EMPTY_KEY,
  sameOfferId,
  type RidePhase,
} from '../utils/myRides';
import { theme } from '../themes';

export const MyRidesScreen: React.FC = () => {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<MainNavigationProp>();
  const route = useRoute();

  /*
   * T-101 step 18e — `OfferPassengers { offerId }` lands here (the route name survives so
   * pushes keep working, `utils/notificationRouting.ts`). The id opens that ride's card.
   */
  const params = (route.params ?? {}) as { offerId?: number | string };
  const requestedId = params.offerId;

  const displayName =
    user?.display_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || '';
  const initials = displayName.charAt(0).toUpperCase();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [phase, setPhase] = useState<RidePhase>('jarayon');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** Passengers per offer id — loaded lazily when a card is expanded (decision ④). */
  const [bookings, setBookings] = useState<Record<string, OfferPassenger[]>>({});
  const [openBooking, setOpenBooking] = useState<OfferPassenger | null>(null);
  const [rejecting, setRejecting] = useState<OfferPassenger | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  // The clock is the screen's, so the card stays pure. Refreshed with the data.
  const [nowMs, setNowMs] = useState(() => Date.now());

  const grouped = useMemo(() => groupByPhase(offers), [offers]);
  const visible = grouped[phase];

  const loadOffers = useCallback(
    async (silent = false) => {
      if (!token) return;
      try {
        if (!silent) setLoading(true);
        const res = await DriverOffersAPI.getDriverOffers(token, {});
        if (res.success && res.offers) setOffers(res.offers);
        setNowMs(Date.now());
      } catch (error) {
        if (silent) return;
        showToast.error(t('common.error'), getErrorMessage(error, t, 'errors.loadFailed'));
      } finally {
        if (!silent) setLoading(false);
        setRefreshing(false);
      }
    },
    [token, t],
  );

  const loadBookings = useCallback(
    async (offerId: string | number, silent = false) => {
      if (!token) return;
      try {
        const data = await OfferPassengersAPI.getOfferPassengers(token, Number(offerId));
        setBookings((prev) => ({ ...prev, [String(offerId)]: data }));
      } catch (error) {
        if (silent) return;
        showToast.error(t('common.error'), getErrorMessage(error, t, 'errors.loadFailed'));
      }
    },
    [token, t],
  );

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // Carried from `OffersListScreen`: coming back from the wizard must show the new offer.
  useFocusEffect(
    useCallback(() => {
      loadOffers(true);
    }, [loadOffers]),
  );

  /*
   * One card open by default, and the phase switched to wherever the requested ride lives —
   * otherwise a push about a ride in Tarix would open an empty Jarayonda list.
   */
  useEffect(() => {
    if (!offers.length) return;
    setPhase((current) => {
      if (requestedId == null) return current;
      const hit = offers.find((o) => sameOfferId(o.id, requestedId));
      if (!hit) return current;
      const owner = PHASES.find((p) => grouped[p].some((o) => sameOfferId(o.id, requestedId)));
      return owner ?? current;
    });
  }, [offers, requestedId, grouped]);

  useEffect(() => {
    setExpandedId((current) => {
      if (current && visible.some((o) => String(o.id) === current)) return current;
      return defaultExpandedId(visible, requestedId);
    });
  }, [visible, requestedId]);

  // The expanded card's passengers, fetched once and then kept.
  useEffect(() => {
    if (!expandedId) return;
    if (bookings[expandedId]) return;
    loadBookings(expandedId);
  }, [expandedId, bookings, loadBookings]);

  /*
   * T-068 — a passenger acting on one of these rides while the driver is looking at the
   * list. The offers list always refreshes (seat counts and phases move); the open ride's
   * passengers refresh too when the push names it.
   */
  useEffect(() => {
    return subscribePushReceived(
      (_type, data) => {
        loadOffers(true);
        const pushed = data?.offer_id;
        if (pushed != null && expandedId && sameOfferId(pushed, expandedId)) {
          loadBookings(expandedId, true);
        }
      },
      ['passenger_join_request', 'passenger_cancelled'],
    );
  }, [loadOffers, loadBookings, expandedId]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadOffers(true);
    if (expandedId) loadBookings(expandedId, true);
  }, [loadOffers, loadBookings, expandedId]);

  // ---------------------------------------------------------------- ride actions

  const runRideAction = (
    titleKey: string,
    call: () => Promise<unknown>,
    successKey: string,
    destructive = false,
  ) => {
    if (!token) return;
    showConfirmDialog({
      title: t(titleKey),
      message: t(titleKey),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      ...(destructive ? { confirmButtonStyle: 'destructive' as const } : {}),
      onConfirm: async () => {
        try {
          await call();
          showToast.success(t('common.success'), t(successKey));
          loadOffers(true);
        } catch (error) {
          showToast.error(t('common.error'), getErrorMessage(error, t, 'errors.unknown'));
        }
      },
      onCancel: () => {},
    });
  };

  const handleCreate = () => navigation.navigate('OfferWizard');
  const handleEdit = (ride: DriverOffer) => navigation.navigate('OfferWizard', { offerId: ride.id });
  const handleCancel = (ride: DriverOffer) =>
    runRideAction(
      'driverOffers.confirmCancel',
      () => DriverOffersAPI.cancelDriverOffer(token!, ride.id),
      'driverOffers.cancelSuccess',
    );
  const handleArchive = (ride: DriverOffer) =>
    runRideAction(
      'driverOffers.confirmArchive',
      () => DriverOffersAPI.archiveDriverOffer(token!, ride.id),
      'driverOffers.archiveSuccess',
    );
  const handlePublish = (ride: DriverOffer) =>
    runRideAction(
      'driverOffers.confirmPublish',
      () => DriverOffersAPI.publishDriverOffer(token!, ride.id),
      'driverOffers.publishSuccess',
    );
  const handleDelete = (ride: DriverOffer) =>
    runRideAction(
      'driverOffers.confirmDelete',
      () => DriverOffersAPI.deleteDriverOffer(token!, ride.id),
      'driverOffers.deleteSuccess',
      true,
    );

  // ---------------------------------------------------------------- booking actions

  const afterBookingChange = (offerId: string | number) => {
    // A confirm changes `seats_free`, which can move the ride to another phase — so the
    // offers list is refreshed too, not just the passengers.
    loadBookings(offerId, true);
    loadOffers(true);
  };

  const handleConfirmBooking = (booking: OfferPassenger) => {
    if (!token) return;
    const name = booking.passenger?.display_name || t('offerPassengers.unknownPassenger');
    const seats = booking.seats_requested;
    const message =
      seats === 1
        ? t('offerPassengers.confirmPassengerMessageOne').replace('{name}', name)
        : t('offerPassengers.confirmPassengerMessage')
            .replace('{name}', name)
            .replace('{seats}', String(seats));
    showConfirmDialog({
      title: t('offerPassengers.confirmPassenger'),
      message,
      confirmText: t('offerPassengers.confirm'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        setActionBusy(true);
        try {
          await OfferPassengersAPI.confirmPassenger(token, booking.id);
          showToast.success(t('common.success'), t('offerPassengers.confirmSuccess'));
          setOpenBooking(null);
          afterBookingChange(booking.offer_id);
        } catch (error) {
          showToast.error(t('common.error'), getErrorMessage(error, t, 'errors.unknown'));
        } finally {
          setActionBusy(false);
        }
      },
      onCancel: () => {},
    });
  };

  const handleRejectBooking = async (reason: string) => {
    if (!token || !rejecting) return;
    setActionBusy(true);
    try {
      await OfferPassengersAPI.rejectPassenger(token, rejecting.id, reason || undefined);
      showToast.success(t('common.success'), t('offerPassengers.rejectSuccess'));
      const offerId = rejecting.offer_id;
      setRejecting(null);
      setOpenBooking(null);
      afterBookingChange(offerId);
    } catch (error) {
      showToast.error(t('common.error'), getErrorMessage(error, t, 'errors.unknown'));
    } finally {
      setActionBusy(false);
    }
  };

  // ---------------------------------------------------------------- render

  const renderRide = ({ item }: { item: DriverOffer }) => {
    const id = String(item.id);
    const expanded = expandedId === id;
    const rows = bookings[id] ?? null;
    return (
      <View style={styles.rideBlock}>
        <MyRideCard
          ride={item}
          bookings={rows}
          expanded={expanded}
          nowMs={nowMs}
          onToggle={() => setExpandedId(expanded ? null : id)}
          onEdit={() => handleEdit(item)}
          onCancel={() => handleCancel(item)}
          onArchive={() => handleArchive(item)}
          onPublish={() => handlePublish(item)}
          onDelete={() => handleDelete(item)}
        />

        {expanded && (
          <View style={styles.bookings}>
            <View style={styles.headingRow}>
              <Text style={styles.heading} numberOfLines={1}>
                {t('myRides.passengersHeading')}
              </Text>
              <View style={styles.headingRule} />
              <Text style={styles.headingCount}>
                {rows === null ? '' : t('myRides.ordersCount').replace('{count}', String(rows.length))}
              </Text>
            </View>

            {rows === null ? (
              <ActivityIndicator color={theme.palette.action} style={styles.bookingsLoader} />
            ) : rows.length === 0 ? (
              <View style={styles.emptyBookings}>
                <Text style={styles.emptyBookingsText}>{t('offerPassengers.noPassengers')}</Text>
              </View>
            ) : (
              rows.map((b) => (
                <BookingRow
                  key={String(b.id)}
                  booking={b}
                  onPress={() => setOpenBooking(b)}
                  onConfirm={() => handleConfirmBooking(b)}
                  onReject={() => setRejecting(b)}
                  onCall={(phone) => dialPhone(phone, t)}
                />
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  const openRide = openBooking
    ? offers.find((o) => sameOfferId(o.id, openBooking.offer_id)) ?? null
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.palette.ground} />
      <TopBar
        background="flat"
        title={t('driverOffers.title')}
        suffix="Driver"
        initials={initials}
        onMenuPress={() => setDrawerOpen(true)}
        onBellPress={() => navigation.navigate('Notifications')}
        onAvatarPress={() => navigation.navigate('Profile')}
      />

      <View style={styles.createRow}>
        <Pressable style={styles.createButton} onPress={handleCreate} accessibilityRole="button">
          <Text style={styles.createIcon}>+</Text>
          <Text style={styles.createLabel}>{t('driverOffers.createOffer')}</Text>
        </Pressable>
      </View>

      <SegmentedModes
        modes={PHASES.map((p) => ({
          key: p,
          label: t(PHASE_LABEL_KEY[p]),
          count: grouped[p].length,
        }))}
        value={phase}
        onChange={setPhase}
        shape="pill"
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.palette.action} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          renderItem={renderRide}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t(EMPTY_KEY[phase])}</Text>
              <Pressable style={styles.emptyButton} onPress={handleCreate}>
                <Text style={styles.emptyButtonLabel}>{t('driverOffers.createOffer')}</Text>
              </Pressable>
            </View>
          }
        />
      )}

      <BookingSheet
        booking={openBooking}
        ride={openRide}
        busy={actionBusy}
        onClose={() => setOpenBooking(null)}
        onConfirm={() => openBooking && handleConfirmBooking(openBooking)}
        onReject={() => openBooking && setRejecting(openBooking)}
        onCall={(phone) => dialPhone(phone, t)}
      />

      <RejectReasonSheet
        visible={!!rejecting}
        passengerName={
          rejecting?.passenger?.display_name || t('offerPassengers.unknownPassenger')
        }
        busy={actionBusy}
        onClose={() => setRejecting(null)}
        onConfirm={handleRejectBooking}
      />

      <NavDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.ground },

  createRow: { paddingHorizontal: 14, paddingBottom: 8 },
  createButton: {
    minHeight: 44,
    borderRadius: theme.borderRadius.control,
    backgroundColor: theme.palette.action,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createIcon: { fontSize: 18, ...theme.font('sans', 800), color: theme.palette.text.onDark },
  createLabel: { fontSize: 13.5, ...theme.font('sans', 800), color: theme.palette.text.onDark },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, ...theme.font('sans', 600), color: theme.palette.text.muted },

  list: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 16, gap: 20 },
  rideBlock: { gap: 12 },

  bookings: { gap: 10 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 2 },
  heading: {
    fontSize: 10,
    ...theme.font('mono', 700),
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.palette.text.tertiary,
  },
  headingRule: { flex: 1, height: 1, backgroundColor: theme.palette.borders.strong },
  headingCount: { fontSize: 10.5, ...theme.font('mono', 700), color: theme.palette.text.muted },
  bookingsLoader: { paddingVertical: 16 },
  emptyBookings: {
    padding: 18,
    borderRadius: theme.borderRadius.card,
    backgroundColor: theme.palette.surface,
    alignItems: 'center',
  },
  emptyBookingsText: { fontSize: 12.5, ...theme.font('sans', 600), color: theme.palette.text.muted },

  empty: {
    backgroundColor: theme.palette.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.palette.borders.emphasis,
    borderRadius: theme.borderRadius.card,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 14, ...theme.font('sans', 800), color: theme.palette.text.primary },
  emptyButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.control,
    backgroundColor: theme.palette.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonLabel: { fontSize: 13, ...theme.font('sans', 800), color: theme.palette.text.onDark },
});
