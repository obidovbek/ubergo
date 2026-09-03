/**
 * MyOrdersScreen — the passenger's order list. T-101 step 9, built on
 * `htmlDesign/UserMyOrder.dc.html`.
 *
 * 🔴 THIS SCREEN REPLACES TWO. `MyBookingsScreen` (a tab) listed the seats the passenger
 * had booked on drivers' offers; `MyPassengerOffersScreen` (a stack route reachable only
 * from one text link on the home screen) listed the ride requests they had posted. Both
 * were ~1 000 lines, ~80% identical, and disagreed with each other about their own tabs
 * — all/pending/confirmed against all/published/completed/cancelled.
 *
 * The artboard settles it. Its three modes are LIFECYCLE STAGES, not statuses, and they
 * cut across both sources: see `utils/orderLifecycle.ts` for the rules and
 * `scripts/check-order-lifecycle.mjs` for the cases. A passenger thinks "have I got a
 * driver yet?", not "whose offer was this?".
 *
 * ⚠️ WHAT WAS CARRIED OVER FROM THE TWO SCREENS — every one of these is a fix that was
 * paid for once already, and a rewrite is exactly where such things go missing:
 *   T-024  the driver-count row opens `OfferDrivers` so the passenger can answer them
 *   T-028  a request card opens `OfferDrivers`, NOT the driver-app-only `PassengerOfferDetails`
 *   T-039  an expired request is labelled expired, not "Faol" (now also filed under Tarix)
 *   T-040  editing allowed for published/driver_found; warn-and-keep when drivers have offered
 *   T-051  fetch once per visit, filter in memory — switching modes fires no request
 *   T-055  the driver's phone shows only on a confirmed booking
 *   T-068  push refreshes the list silently, under the pull-to-refresh spinner
 *   the auth-error path that logs the passenger out on an expired token
 *
 * 🛑 DELIBERATELY NOT BUILT — the artboard draws four things with no backend behind them:
 * the tax receipt ("Chek", with a fiscal mark), the "budilnik" alarm ping, the in-app
 * message sheet, and the like/dislike + tags rating. Owner decision 2026-09-03: build
 * only what has an API. The stars-and-comment rating IS real and is kept. Drawing the
 * other three would ship four dead buttons on a screen the owner is about to walk.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import * as OffersAPI from '../api/offers';
import {
  getMyPassengerOffers,
  cancelPassengerOffer,
  PassengerOffer,
} from '../api/passengerOffers';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { formatNumberWithSpaces } from '../utils/format';
import { formatDateTime } from '../utils/date';
import { showToast } from '../utils/toast';
import { showConfirmDialog } from '../utils/confirmDialog';
import { getErrorMessage, isAuthError } from '../utils/errorHandler';
import { subscribePushReceived } from '../utils/pushEvents';
import { dialPhone, formatContactPhone } from '../utils/contactPhone';
import { AppModal } from '../components/AppModal';
import { TopBar } from '../components/chrome/TopBar';
import { SegmentedModes } from '../components/chrome/SegmentedModes';
import { NavDrawer } from '../components/chrome/NavDrawer';
import {
  ORDER_MODES,
  type OrderMode,
  offerMode,
  bookingMode,
  displayOfferStatus,
  byNewestCreated,
} from '../utils/orderLifecycle';
import { theme } from '../themes';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

/**
 * One list holds two record types, so each row carries its own tag. A discriminated
 * union keeps the card honest: `tsc` refuses a booking field on a request row, which is
 * the class of mistake a merge like this invites.
 */
type Row =
  | { kind: 'request'; key: string; offer: PassengerOffer }
  | { kind: 'booking'; key: string; booking: OffersAPI.OfferPassenger };

export default function MyOrdersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { token, logout } = useAuth();
  const { t, currentLanguage } = useTranslation();

  const [requests, setRequests] = useState<PassengerOffer[]>([]);
  const [bookings, setBookings] = useState<OffersAPI.OfferPassenger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mode, setMode] = useState<OrderMode>('jarayon');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Rating — the one artboard modal with a real endpoint behind it.
  const [ratingFor, setRatingFor] = useState<OffersAPI.OfferPassenger | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  /**
   * The passenger is signed out when their token has expired. Both source screens had
   * their own copy of this; the merged one has one.
   */
  const handleAuthFailure = useCallback(() => {
    showConfirmDialog({
      title: t('errors.unauthorized'),
      message: t('passengerOffers.tokenExpired'),
      confirmText: t('common.ok'),
      cancelText: '',
      onConfirm: async () => {
        try {
          await logout();
        } catch (logoutError) {
          console.error('Logout error:', logoutError);
        }
      },
      onCancel: () => {},
    });
  }, [logout, t]);

  /**
   * T-051 — ONE fetch per visit, for BOTH sources. The modes filter in memory, so
   * switching them costs nothing and works offline. `MyBookingsScreen` did the opposite
   * (`useEffect(..., [token, filter])` refetched on every tab tap, and set the
   * full-screen spinner while it did) — the same defect T-051 fixed on the other screen
   * and left standing here.
   *
   * @param silent skip the spinner and the error toast — used by the push refresh
   *   (T-068), where the passenger is already reading the list.
   */
  const load = useCallback(
    async (opts: { silent?: boolean; refresh?: boolean } = {}) => {
      const { silent = false, refresh = false } = opts;
      if (!token) return;

      if (refresh) setIsRefreshing(true);
      else if (!silent) setIsLoading(true);

      /*
       * ⚠️ `allSettled`, not `all`. The two lists are independent, and one endpoint
       * failing must not blank the other — a passenger with a live booking should still
       * see it when the requests call times out.
       */
      const [reqResult, bookResult] = await Promise.allSettled([
        getMyPassengerOffers(),
        OffersAPI.getMyBookings(token),
      ]);

      if (reqResult.status === 'fulfilled') setRequests(reqResult.value);
      if (bookResult.status === 'fulfilled') setBookings(bookResult.value);

      const failure =
        reqResult.status === 'rejected'
          ? reqResult.reason
          : bookResult.status === 'rejected'
            ? bookResult.reason
            : null;

      if (failure && !silent) {
        if (isAuthError(failure)) {
          handleAuthFailure();
        } else {
          showToast.error(
            t('common.error'),
            getErrorMessage(failure, t, 'passengerOffers.errorLoadMessage'),
          );
        }
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [token, handleAuthFailure, t],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  /**
   * T-068 — the owner's symptom, from both screens at once: a driver confirms, rejects
   * or backs out, the push lands while this list is open, and the row keeps showing the
   * old status until a manual pull-to-refresh. The merged screen subscribes to the union
   * of both screens' event lists.
   */
  React.useEffect(
    () =>
      subscribePushReceived(() => load({ silent: true }), [
        'join_confirmed',
        'join_rejected',
        'driver_arrived',
        'driver_10min_away',
        'offer_cancelled_by_driver',
        'driver_join_request',
        'driver_request_cancelled',
      ]),
    [load],
  );

  // ------------------------------------------------------------------ grouping
  const rows = useMemo<Record<OrderMode, Row[]>>(() => {
    const buckets: Record<OrderMode, Row[]> = { jarayon: [], aktiv: [], tarix: [] };

    requests.forEach((offer) => {
      buckets[offerMode(offer)].push({ kind: 'request', key: `r${offer.id}`, offer });
    });
    bookings.forEach((booking) => {
      buckets[bookingMode(booking)].push({ kind: 'booking', key: `b${booking.id}`, booking });
    });

    // T-051 — newest created on top, across both sources.
    (Object.keys(buckets) as OrderMode[]).forEach((k) => {
      buckets[k].sort((a, b) =>
        byNewestCreated(
          a.kind === 'request' ? a.offer : a.booking,
          b.kind === 'request' ? b.offer : b.booking,
        ),
      );
    });
    return buckets;
  }, [requests, bookings]);

  const visible = rows[mode];

  const modes = useMemo(
    () =>
      ORDER_MODES.map((k) => ({
        key: k,
        label: t(
          k === 'jarayon'
            ? 'myOrders.modeJarayon'
            : k === 'aktiv'
              ? 'myOrders.modeAktiv'
              : 'myOrders.modeTarix',
        ),
        count: rows[k].length,
      })),
    [rows, t],
  );

  // ------------------------------------------------------------------ actions
  /**
   * T-040. Editing is allowed for the statuses the server allows (`published` /
   * `driver_found`) — an order that has merely EXPIRED is still `published`, so it stays
   * editable, which is the point: the passenger can push the departure forward instead
   * of starting again.
   *
   * ⚠️ Owner decision 2026-08-08: when drivers have already offered, warn and KEEP their
   * offers. Do not block the edit and do not auto-reject anyone.
   */
  const handleEditRequest = (offer: PassengerOffer) => {
    const pending = offer.drivers?.filter((d) => d.status === 'pending').length || 0;
    const open = () => navigation.navigate('CreatePassengerOffer', { offerId: offer.id });

    if (pending > 0) {
      showConfirmDialog({
        title: t('passengerOffers.editWithDriversTitle'),
        message: t('passengerOffers.editWithDriversMessage'),
        confirmText: t('passengerOffers.edit'),
        cancelText: t('common.cancel'),
        onConfirm: open,
        onCancel: () => {},
      });
      return;
    }
    open();
  };

  const handleCancelRequest = (offerId: number) => {
    showConfirmDialog({
      title: t('passengerOffers.cancelRequest'),
      message: t('passengerOffers.cancelConfirm'),
      confirmText: t('myBookings.yes'),
      cancelText: t('myBookings.no'),
      confirmButtonStyle: 'destructive',
      onConfirm: async () => {
        try {
          await cancelPassengerOffer(offerId);
          showToast.success(t('passengerOffers.success'), t('passengerOffers.cancelSuccess'));
          load();
        } catch (error: unknown) {
          if (isAuthError(error)) {
            handleAuthFailure();
          } else {
            showToast.error(
              t('passengerOffers.cancelError'),
              getErrorMessage(error, t, 'passengerOffers.cancelErrorMessage'),
            );
          }
        }
      },
      onCancel: () => {},
    });
  };

  const handleCancelBooking = (booking: OffersAPI.OfferPassenger) => {
    showConfirmDialog({
      title: t('myBookings.cancelBooking'),
      message: t('myBookings.cancelConfirm'),
      confirmText: t('myBookings.yes'),
      cancelText: t('myBookings.no'),
      confirmButtonStyle: 'destructive',
      onConfirm: async () => {
        try {
          await OffersAPI.cancelJoin(token!, booking.id);
          showToast.success(t('myBookings.cancelSuccess'), t('myBookings.cancelSuccessMessage'));
          load();
        } catch (error: unknown) {
          showToast.error(t('common.error'), getErrorMessage(error, t, 'myBookings.cancelError'));
        }
      },
      onCancel: () => {},
    });
  };

  /** A ride can be rated once it has started — the same rule the old screen used. */
  const canRate = (booking: OffersAPI.OfferPassenger): boolean => {
    if (booking.status !== 'confirmed' || !booking.offer) return false;
    return Date.now() >= new Date(booking.offer.start_at).getTime();
  };

  const submitRating = async () => {
    if (!ratingFor || !token) return;
    if (rating === 0) {
      showToast.error(t('myBookings.ratingRequired'), t('myBookings.ratingRequiredMessage'));
      return;
    }
    try {
      setSubmittingRating(true);
      await OffersAPI.rateDriver(token, ratingFor.id, rating, ratingComment || undefined);
      showToast.success(t('myBookings.ratingSuccess'), t('myBookings.ratingSuccessMessage'));
      setRatingFor(null);
      load();
    } catch (error: unknown) {
      showToast.error(t('common.error'), getErrorMessage(error, t, 'myBookings.ratingError'));
    } finally {
      setSubmittingRating(false);
    }
  };

  // ------------------------------------------------------------------ status chrome
  const statusTone = (
    status: string,
  ): { fg: string; bg: string; label: string } => {
    switch (status) {
      case 'published':
        return {
          fg: theme.palette.action,
          bg: theme.palette.successTint,
          label: t('passengerOffers.active'),
        };
      case 'driver_found':
        /*
         * 🔴 MEASURED, AND THE INHERITED PAIR FAILED. `MyPassengerOffersScreen` used
         * `brand` on `successTint` and its comment claimed 6.96:1 — but `brand` is the
         * BRIGHT `#05BB42` (the palette's own note: "NOT a button fill"), and as text on
         * `successTint` it measures **2.24:1**. The comment had measured a different
         * colour from the one the code used, so the T-101 fix for `#0EA5E9` (2.42:1)
         * landed on a value barely better than the defect it replaced.
         *
         * `actionPressed` on `blueTint` is **6.70:1** and stays distinct from both
         * neighbours: `published` is green-on-green, `completed` is `male` on the same
         * blue tint at a visibly lighter weight. Two statuses that render identically
         * would be a worse bug than the contrast one — the constraint the old comment
         * was right about even though its number was wrong.
         */
        return {
          fg: theme.palette.actionPressed,
          bg: theme.palette.blueTint,
          label: t('passengerOffers.driverFound'),
        };
      case 'expired':
        return {
          fg: theme.palette.text.secondary,
          bg: theme.palette.surfaceSunken,
          label: t('passengerOffers.expired'),
        };
      case 'completed':
        /*
         * Moved off `male`/`blueTint`, which `driver_found` now needs. A COMPLETED ride
         * is a settled, past thing; the neutral sunken surface says that better than a
         * second blue did, and it frees the blue for the one live state that is neither
         * "waiting" nor "over". `text.secondary` on `surfaceSunken` measures 5.05:1.
         */
        return {
          fg: theme.palette.text.secondary,
          bg: theme.palette.surfaceSunken,
          label: t('passengerOffers.completed'),
        };
      case 'cancelled':
        /*
         * `dangerText`, not `danger` — DESIGN-TOKENS.md §2.10, mapped by ROLE. `danger`
         * is a FILL (the bell/tab badge) and measures 4.20:1 as ink on `dangerTint`,
         * which both source screens shipped. `dangerText` is the ink tier: 4.88:1.
         */
        return {
          fg: theme.palette.dangerText,
          bg: theme.palette.dangerTint,
          label: t('passengerOffers.cancelled'),
        };
      case 'archived':
        return {
          fg: theme.palette.text.secondary,
          bg: theme.palette.surfaceSunken,
          label: t('passengerOffers.archived'),
        };
      case 'pending':
        return {
          fg: theme.palette.warnInk,
          bg: theme.palette.warnTint,
          label: t('myBookings.pending'),
        };
      case 'confirmed':
        return {
          fg: theme.palette.action,
          bg: theme.palette.successTint,
          label: t('myBookings.confirmed'),
        };
      case 'rejected':
        // Same §2.10 fix as `cancelled` above.
        return {
          fg: theme.palette.dangerText,
          bg: theme.palette.dangerTint,
          label: t('common.error'),
        };
      default:
        return {
          fg: theme.palette.text.secondary,
          bg: theme.palette.surfaceSunken,
          label: status,
        };
    }
  };

  // ------------------------------------------------------------------ card pieces
  /** The artboard's dotted origin→destination rail, shared by both row types. */
  const RouteRail: React.FC<{ from: string; to: string }> = ({ from, to }) => (
    <View style={styles.rail}>
      <View style={styles.railGutter}>
        <View style={styles.railDotStart} />
        <View style={styles.railLine} />
        <View style={styles.railDotEnd} />
      </View>
      <View style={styles.railText}>
        <Text style={styles.railPlace} numberOfLines={2}>
          {from}
        </Text>
        <Text style={styles.railPlace} numberOfLines={2}>
          {to}
        </Text>
      </View>
    </View>
  );

  const StatusPill: React.FC<{ status: string }> = ({ status }) => {
    const tone = statusTone(status);
    return (
      <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
        <Text style={[styles.statusText, { color: tone.fg }]}>{tone.label}</Text>
      </View>
    );
  };

  /** The card's summary strip: the route on the left, the time in mono on the right. */
  const WhenStrip: React.FC<{ text: string; when: string }> = ({ text, when }) => (
    <View style={styles.whenStrip}>
      <Text style={styles.whenRoute} numberOfLines={1}>
        {text}
      </Text>
      <Text style={styles.whenTime}>{when}</Text>
    </View>
  );

  // ------------------------------------------------------------------ rows
  const renderRequest = (offer: PassengerOffer) => {
    const shown = displayOfferStatus(offer);
    const driverCount = offer.drivers?.length || 0;
    const canManage = offer.status === 'published' || offer.status === 'driver_found';

    return (
      <Pressable
        style={styles.card}
        /*
         * 🔴 T-028 — `OfferDrivers`, NOT `PassengerOfferDetails`. The latter is a
         * DRIVER-app screen; navigating to it here did nothing at all, and a local copy
         * of the route table is what let it compile. This is the same destination the
         * driver-count row uses (T-024), so the whole card is the hit area.
         */
        onPress={() => navigation.navigate('OfferDrivers', { offerId: offer.id })}
      >
        <View style={styles.cardHead}>
          <View style={styles.avatarNeutral}>
            <Ionicons name="person-outline" size={19} color={theme.palette.actionPressed} />
          </View>
          <View style={styles.cardHeadText}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {t('myOrders.myRequest')}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {driverCount > 0
                ? t('myOrders.driversInterested').replace('{count}', String(driverCount))
                : t('myOrders.awaitingDrivers')}
            </Text>
          </View>
          <StatusPill status={shown} />
        </View>

        <WhenStrip
          text={t('myOrders.seatsNeeded').replace('{count}', String(offer.seats_needed))}
          when={formatDateTime(offer.start_at, currentLanguage)}
        />

        <RouteRail from={offer.from_text} to={offer.to_text} />

        <View style={styles.cardFoot}>
          <View style={styles.priceBlock}>
            {offer.max_price_per_seat == null ? (
              // Offers from the new form carry no price at all (T-018).
              <Text style={styles.priceMuted}>{t('passengerOffers.priceNegotiable')}</Text>
            ) : (
              <>
                <Text style={styles.priceLabel}>{t('passengerOffers.maxPricePerSeat')}</Text>
                <Text style={styles.price}>
                  {formatNumberWithSpaces(offer.max_price_per_seat)} {offer.currency}
                </Text>
              </>
            )}
          </View>

          {canManage && (
            <View style={styles.actions}>
              <Pressable
                style={styles.actionGhost}
                onPress={() => handleEditRequest(offer)}
                hitSlop={6}
              >
                <Text style={styles.actionGhostText}>{t('passengerOffers.edit')}</Text>
              </Pressable>
              <Pressable
                style={styles.actionDanger}
                onPress={() => handleCancelRequest(offer.id)}
                hitSlop={6}
              >
                <Text style={styles.actionDangerText}>{t('passengerOffers.cancelRequest')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderBooking = (booking: OffersAPI.OfferPassenger) => {
    const offer = booking.offer;
    if (!offer) return null;

    // T-055 — the server sends the driver's number ONLY on a confirmed booking, so this
    // is empty for every other status even without the check. The status check stays:
    // the block belongs to an accepted booking, and leaning on the field's absence alone
    // would make a server change silent.
    const isConfirmed = booking.status === 'confirmed';
    const driverPhone = OffersAPI.driverPhoneOf(offer);
    const driverName = offer.user?.first_name || t('offerDrivers.unknownDriver');
    const canCancel = ['pending', 'confirmed'].includes(booking.status);

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('OfferDetails', { offerId: offer.id })}
      >
        <View style={styles.cardHead}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {driverName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardHeadText}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {driverName}
            </Text>
            {!!offer.vehicle && (
              <Text style={styles.cardSub} numberOfLines={1}>
                {[offer.vehicle.make, offer.vehicle.model].filter(Boolean).join(' ')}
              </Text>
            )}
          </View>
          <StatusPill status={booking.status} />
        </View>

        <WhenStrip
          text={t('myOrders.seatsNeeded').replace('{count}', String(booking.seats_requested))}
          when={formatDateTime(offer.start_at, currentLanguage)}
        />

        <RouteRail from={offer.from_text} to={offer.to_text} />

        {!!booking.rejection_reason && (
          <View style={styles.rejection}>
            <Text style={styles.rejectionLabel}>{t('myBookings.rejectionReason')}</Text>
            <Text style={styles.rejectionText}>{booking.rejection_reason}</Text>
          </View>
        )}

        <View style={styles.cardFoot}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>{t('myBookings.totalPrice')}</Text>
            <Text style={styles.price}>
              {formatNumberWithSpaces(booking.total_agreed_price)} {booking.currency}
            </Text>
          </View>

          <View style={styles.actions}>
            {isConfirmed && !!driverPhone && (
              <Pressable
                style={styles.actionCall}
                onPress={() => dialPhone(driverPhone, t)}
                hitSlop={6}
                accessibilityLabel={formatContactPhone(driverPhone)}
              >
                <Ionicons name="call" size={17} color={theme.palette.actionPressed} />
              </Pressable>
            )}
            {canRate(booking) && (
              <Pressable
                style={styles.actionGhost}
                onPress={() => {
                  setRatingFor(booking);
                  setRating(0);
                  setRatingComment('');
                }}
                hitSlop={6}
              >
                <Text style={styles.actionGhostText}>{t('myBookings.rateDriver')}</Text>
              </Pressable>
            )}
            {canCancel && (
              <Pressable
                style={styles.actionDanger}
                onPress={() => handleCancelBooking(booking)}
                hitSlop={6}
              >
                <Text style={styles.actionDangerText}>{t('myBookings.cancelBooking')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderRow = ({ item }: { item: Row }) =>
    item.kind === 'request' ? renderRequest(item.offer) : renderBooking(item.booking);

  const listHeading =
    mode === 'jarayon'
      ? t('myOrders.listJarayon')
      : mode === 'aktiv'
        ? t('myOrders.listAktiv')
        : t('myOrders.listTarix');

  const emptyTitle =
    mode === 'jarayon'
      ? t('myOrders.emptyJarayonTitle')
      : mode === 'aktiv'
        ? t('myOrders.emptyAktivTitle')
        : t('myOrders.emptyTarixTitle');

  const emptyBody =
    mode === 'jarayon'
      ? t('myOrders.emptyJarayonBody')
      : mode === 'aktiv'
        ? t('myOrders.emptyAktivBody')
        : t('myOrders.emptyTarixBody');

  return (
    /*
     * ⚠️ `edges` WITHOUT 'top' — `TopBar` applies the top inset itself via
     * `useSafeAreaInsets`. Letting SafeAreaView pad as well shifts the header down by a
     * whole status bar; the double-inset defect found in step 8.
     */
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopBar
        title={t('myOrders.title')}
        /*
         * T-101 step 11 — the hamburger opens the DRAWER. Step 9 wired it to `Home`
         * because no drawer existed yet; the artboards have always drawn a menu here.
         */
        onMenuPress={() => setDrawerOpen(true)}
        onBellPress={() => navigation.navigate('Notifications')}
      />

      <SegmentedModes modes={modes} value={mode} onChange={setMode} />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.palette.action} />
        </View>
      ) : (
        <FlatList
          data={visible}
          renderItem={renderRow}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHead}>
              <Text style={styles.listHeadTitle}>{listHeading}</Text>
              <Text style={styles.listHeadCount}>
                {t('myOrders.listCount').replace('{count}', String(visible.length))}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{emptyTitle}</Text>
              <Text style={styles.emptyBody}>{emptyBody}</Text>
              <Pressable
                style={styles.emptyCta}
                onPress={() => navigation.navigate('CreatePassengerOffer')}
              >
                <Text style={styles.emptyCtaText}>{t('myOrders.newOrder')}</Text>
              </Pressable>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => load({ refresh: true })}
              tintColor={theme.palette.action}
              colors={[theme.palette.action]}
            />
          }
        />
      )}

      {/* The one artboard modal with an endpoint behind it. */}
      <AppModal
        visible={!!ratingFor}
        onClose={() => setRatingFor(null)}
        title={t('myBookings.rateYourDriver')}
      >
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setRating(n)}
              style={[styles.star, n <= rating && styles.starOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: n <= rating }}
            >
              <Ionicons
                name={n <= rating ? 'star' : 'star-outline'}
                size={22}
                color={n <= rating ? theme.palette.actionPressed : theme.palette.text.tertiary}
              />
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.ratingInput}
          value={ratingComment}
          onChangeText={setRatingComment}
          placeholder={t('myBookings.shareExperience')}
          placeholderTextColor={theme.palette.text.tertiary}
          multiline
          numberOfLines={3}
        />
        <Pressable
          style={[styles.submit, submittingRating && styles.submitDisabled]}
          onPress={submitRating}
          disabled={submittingRating}
        >
          <Text style={styles.submitText}>{t('myBookings.submitRating')}</Text>
        </Pressable>
      </AppModal>

      <NavDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.ground },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent: { paddingHorizontal: 18, paddingBottom: 16, gap: 12 },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  listHeadTitle: { ...theme.typography.caption, ...theme.font('sans', 700), color: theme.palette.text.secondary },
  listHeadCount: { ...theme.typography.monoMeta, ...theme.font('mono', 600), color: theme.palette.text.tertiary },

  // ---------------------------------------------------------------- card
  card: {
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.chrome,
    borderRadius: theme.borderRadius.card,
    padding: 13,
    gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarNeutral: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, ...theme.font('sans', 800), color: theme.palette.actionPressed },
  cardHeadText: { flex: 1, minWidth: 0, gap: 3 },
  cardTitle: { fontSize: 14.5, ...theme.font('sans', 800), color: theme.palette.text.primary },
  cardSub: { fontSize: 12, ...theme.font('sans', 600), color: theme.palette.text.secondary },

  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusText: { fontSize: 10.5, ...theme.font('sans', 800) },

  whenStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 13,
    backgroundColor: theme.palette.ground,
  },
  whenRoute: { flex: 1, fontSize: 12.5, ...theme.font('sans', 800), color: theme.palette.text.primary },
  whenTime: { ...theme.typography.monoMeta, ...theme.font('mono', 600), color: theme.palette.text.secondary },

  // ---------------------------------------------------------------- route rail
  rail: { flexDirection: 'row', gap: 10 },
  railGutter: { width: 12, alignItems: 'center', paddingTop: 4 },
  railDotStart: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.text.tertiary,
  },
  /*
   * The artboard draws a DASHED connector (`repeating-linear-gradient`). React Native has
   * no such fill, and a borderStyle:'dashed' on a 2px view renders inconsistently across
   * platforms, so this is a solid brand hairline — the nearest honest equivalent.
   */
  railLine: { flex: 1, width: 2, minHeight: 16, marginVertical: 2, backgroundColor: theme.palette.brand },
  railDotEnd: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.brand,
  },
  railText: { flex: 1, minWidth: 0, gap: 3 },
  railPlace: { fontSize: 12.5, ...theme.font('sans', 700), color: theme.palette.text.primary, lineHeight: 17 },

  // ---------------------------------------------------------------- footer
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 9,
    borderTopWidth: theme.sizes.borderHairline,
    borderTopColor: theme.palette.borders.chrome,
  },
  priceBlock: { minWidth: 0, gap: 2 },
  priceLabel: { fontSize: 11, ...theme.font('sans', 600), color: theme.palette.text.tertiary },
  price: { ...theme.typography.monoPrice, color: theme.palette.actionPressed },
  priceMuted: { fontSize: 12.5, ...theme.font('sans', 700), color: theme.palette.text.secondary },

  actions: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  actionCall: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGhost: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGhostText: { fontSize: 12.5, ...theme.font('sans', 800), color: theme.palette.text.primary },
  actionDanger: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDangerText: { fontSize: 12.5, ...theme.font('sans', 800), color: theme.palette.dangerText },

  rejection: {
    gap: 3,
    padding: 10,
    borderRadius: 13,
    backgroundColor: theme.palette.dangerTint,
  },
  rejectionLabel: { fontSize: 11, ...theme.font('sans', 700), color: theme.palette.dangerText },
  rejectionText: { ...theme.typography.secondary, color: theme.palette.text.primary },

  // ---------------------------------------------------------------- empty
  empty: {
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.emphasis,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.card,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontSize: 14, ...theme.font('sans', 800), color: theme.palette.text.primary },
  emptyBody: {
    ...theme.typography.secondary,
    color: theme.palette.text.secondary,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 6,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCtaText: { fontSize: 13, ...theme.font('sans', 800), color: theme.palette.text.onAccent },

  // ---------------------------------------------------------------- rating modal
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 12 },
  star: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.borderRadius.field,
    borderWidth: theme.sizes.borderEmphasis,
    borderColor: theme.palette.borders.emphasis,
    backgroundColor: theme.palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starOn: { backgroundColor: theme.palette.successTint, borderColor: theme.palette.action },
  ratingInput: {
    minHeight: 84,
    textAlignVertical: 'top',
    borderWidth: theme.sizes.borderEmphasis,
    borderColor: theme.palette.borders.strong,
    borderRadius: theme.borderRadius.field,
    padding: 12,
    backgroundColor: theme.palette.surfaceInput,
    color: theme.palette.text.primary,
    ...theme.typography.body,
  },
  submit: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.palette.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: theme.states.disabledOpacity },
  submitText: { fontSize: 14.5, ...theme.font('sans', 800), color: theme.palette.text.onAccent },
});
