/**
 * Offer Drivers Screen (passenger side) — T-024.
 *
 * Where a passenger answers the drivers who offered on their ride request.
 * Until this existed, `MyPassengerOffersScreen` told them "N drivers interested"
 * with nothing to tap: they were informed that drivers had arrived and had no
 * way to reply. It also forced T-044 to send the `driver_join_request` push to a
 * list screen instead of the thing the notification was actually about.
 *
 * 🔴 ACCEPTING IS IRREVERSIBLE AND IT AFFECTS OTHER PEOPLE. Server-side,
 * `confirmDriver` moves the offer to `driver_found` and then
 * `rejectRemainingDrivers` closes out **every other pending driver** with
 * `another_driver_chosen` and pushes each of them. So one tap here permanently
 * declines several strangers — which is why the confirm dialog names the count
 * instead of asking a vague "are you sure?".
 *
 * ⚠️ This screen deliberately shows rival drivers' names, plates and prices.
 * That is correct — they are all bidding *for this passenger*. It is the mirror
 * of the driver-side rule that a driver may NOT see rival bids. Do not reuse
 * this screen for the driver app.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as PassengerOffersAPI from '../api/passengerOffers';
import { driverNameOf } from '../api/passengerOffers';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { subscribePushReceived } from '../utils/pushEvents';
import { showConfirmDialog } from '../utils/confirmDialog';
import { getErrorMessage } from '../utils/errorHandler';
import { formatNumberWithSpaces } from '../utils/format';
import { dialPhone, formatContactPhone } from '../utils/contactPhone';
import { TopBar } from '../components/chrome/TopBar';
import { theme } from '../themes';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: theme.palette.warnTint, text: theme.palette.warnInk },
  confirmed: { bg: theme.palette.successTint, text: theme.palette.actionPressed },
  rejected: { bg: theme.palette.dangerTint, text: theme.palette.dangerText },
  cancelled: { bg: theme.palette.surfaceSunken, text: theme.palette.text.secondary },
};

export default function OfferDriversScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  const offerId = (route.params as { offerId?: number } | undefined)?.offerId;

  const [drivers, setDrivers] = useState<PassengerOffersAPI.OfferDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  // One id at a time: while a confirm/reject is in flight every action is
  // disabled, so a double tap cannot fire two confirms (the second would 400
  // "already processed" and surface as an error *after* a success).
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!offerId) {
        setLoading(false);
        setLoadFailed(true);
        return;
      }

      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const data = await PassengerOffersAPI.getOfferDrivers(offerId);
        setDrivers(data);
        setLoadFailed(false);
      } catch (error) {
        setLoadFailed(true);
        showToast.error(
          t('common.error'),
          getErrorMessage(error, t, t('offerDrivers.loadFailed'))
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [offerId, t]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // T-068 — a driver bidding on, or withdrawing from, THIS request while the
  // passenger is looking at the list of drivers. Scoped by `offer_id` so a push
  // about a different request cannot reload this one.
  // ⚠️ Push `data` values are strings; `offerId` may be a number. Compare coerced.
  // ⚠️ `load(true)` uses the refresh path — the full-screen loader would blank
  // the list the passenger is mid-decision on.
  useEffect(() => {
    return subscribePushReceived(
      (_type, data) => {
        if (String(data?.offer_id) === String(offerId)) load(true);
      },
      ['driver_join_request', 'driver_request_cancelled']
    );
  }, [offerId, load]);

  const pendingCount = drivers.filter((d) => d.status === 'pending').length;

  const handleAccept = (join: PassengerOffersAPI.OfferDriver) => {
    // The others who lose their bid the moment this succeeds.
    const othersDeclined = drivers.filter(
      (d) => d.status === 'pending' && d.id !== join.id
    ).length;

    showConfirmDialog({
      title: t('offerDrivers.acceptTitle'),
      // Naming the number is the point: the server rejects them all and pushes
      // each one, and none of it can be undone.
      message:
        othersDeclined > 0
          ? t('offerDrivers.acceptMessageOthers')
              .replace('{name}', driverNameOf(join, t('offerDrivers.unknownDriver')))
              .replace('{count}', String(othersDeclined))
          : t('offerDrivers.acceptMessage').replace(
              '{name}',
              driverNameOf(join, t('offerDrivers.unknownDriver'))
            ),
      confirmText: t('offerDrivers.accept'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        setBusyId(join.id);
        try {
          await PassengerOffersAPI.confirmDriver(join.id);
          showToast.success(t('common.success'), t('offerDrivers.acceptSuccess'));
          await load(true);
        } catch (error) {
          // A 400/404 here usually means the offer moved on while this screen
          // was open (the driver withdrew, or another tab confirmed). Reload so
          // the passenger sees the truth instead of a stale list.
          showToast.error(
            t('common.error'),
            getErrorMessage(error, t, t('offerDrivers.acceptFailed'))
          );
          await load(true);
        } finally {
          setBusyId(null);
        }
      },
      onCancel: () => {},
    });
  };

  const handleReject = (join: PassengerOffersAPI.OfferDriver) => {
    showConfirmDialog({
      title: t('offerDrivers.rejectTitle'),
      message: t('offerDrivers.rejectMessage').replace(
        '{name}',
        driverNameOf(join, t('offerDrivers.unknownDriver'))
      ),
      confirmText: t('offerDrivers.reject'),
      cancelText: t('common.cancel'),
      confirmButtonStyle: 'destructive',
      onConfirm: async () => {
        setBusyId(join.id);
        try {
          await PassengerOffersAPI.rejectDriver(join.id);
          showToast.success(t('common.success'), t('offerDrivers.rejectSuccess'));
          await load(true);
        } catch (error) {
          showToast.error(
            t('common.error'),
            getErrorMessage(error, t, t('offerDrivers.rejectFailed'))
          );
          await load(true);
        } finally {
          setBusyId(null);
        }
      },
      onCancel: () => {},
    });
  };

  const renderDriver = ({ item }: { item: PassengerOffersAPI.OfferDriver }) => {
    const colors = STATUS_COLORS[item.status] || STATUS_COLORS.cancelled;
    const isPending = item.status === 'pending';
    const disabled = busyId !== null;
    const v = item.vehicle;
    // T-054 — the server sends `phone_e164` ONLY on the confirmed row, so this
    // is `undefined` for every rival bid whether or not the status is checked.
    // The status check stays anyway: the block belongs to the chosen driver, and
    // relying on the field's absence alone would make a server change silent.
    const isConfirmed = item.status === 'confirmed';
    const driverPhone = item.driver?.phone_e164;
    const name = driverNameOf(item, t('offerDrivers.unknownDriver'));

    return (
      <View style={styles.card}>
        {/* The artboard's card head: round avatar, name, status pill on the right. */}
        <View style={styles.cardHead}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.cardHeadText}>
            <Text style={styles.driverName} numberOfLines={1}>
              {name}
            </Text>
            {/* `vehicle` is optional on the payload, so every field is guarded. */}
            {v ? (
              <Text style={styles.carLine} numberOfLines={1}>
                {[v.make?.name, v.model?.name, v.color?.name].filter(Boolean).join(' ')}
                {v.license_plate ? ` · ${v.license_plate}` : ''}
              </Text>
            ) : null}
          </View>
          <View style={[styles.statusPill, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {t(`offerDrivers.status_${item.status}`)}
            </Text>
          </View>
        </View>

        {/*
          The artboard's inset "well": the offer's terms on the sunken ground, seats on
          the left and the money in MONO on the right — every number in these boards is
          monospaced, and a price column only lines up in a monospaced face.
        */}
        <View style={styles.termsWell}>
          <Text style={styles.termsSeats}>
            {t('offerDrivers.seatsOffered').replace('{count}', String(item.seats_offered))}
          </Text>
          <Text style={styles.termsPrice}>
            {formatNumberWithSpaces(item.offered_price_per_seat)} {item.currency}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('offerDrivers.total')}</Text>
          <Text style={styles.totalValue}>
            {formatNumberWithSpaces(item.total_offered_price)} {item.currency}
          </Text>
        </View>

        {item.message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        ) : null}

        {/* T-054 — the ride was agreed; without this the two people had no way
            to reach each other and the confirmed booking could not happen. */}
        {isConfirmed && (
          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>{t('offerDrivers.contactTitle')}</Text>
            {driverPhone ? (
              <Pressable
                style={styles.callButton}
                onPress={() => dialPhone(driverPhone, t)}
                accessibilityRole="button"
              >
                <Ionicons name="call" size={17} color={theme.palette.text.onAccent} />
                <Text style={styles.callText}>{formatContactPhone(driverPhone)}</Text>
              </Pressable>
            ) : (
              // A driver who signed up with Google SSO can have no number on
              // file. Say so rather than showing a button that dials nothing.
              <Text style={styles.contactMissing}>{t('offerDrivers.noPhone')}</Text>
            )}
          </View>
        )}

        {isPending && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, styles.rejectButton, disabled && styles.buttonDisabled]}
              onPress={() => handleReject(item)}
              disabled={disabled}
              accessibilityRole="button"
            >
              {busyId === item.id ? (
                <ActivityIndicator size="small" color={theme.palette.dangerText} />
              ) : (
                <Text style={styles.rejectText}>{t('offerDrivers.reject')}</Text>
              )}
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.acceptButton, disabled && styles.buttonDisabled]}
              onPress={() => handleAccept(item)}
              disabled={disabled}
              accessibilityRole="button"
            >
              <Text style={styles.acceptText}>{t('offerDrivers.accept')}</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>
        {loadFailed ? t('offerDrivers.loadFailed') : t('offerDrivers.emptyTitle')}
      </Text>
      {!loadFailed && <Text style={styles.emptyBody}>{t('offerDrivers.emptyMessage')}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <TopBar
          title={t('offerDrivers.title')}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.palette.action} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    /*
     * ⚠️ `edges` WITHOUT 'top' — `TopBar` applies the top inset itself via
     * `useSafeAreaInsets`. Letting SafeAreaView pad as well shifts the header down by a
     * whole status bar; the double-inset defect found in step 8. The old header here
     * used `edges={['top']}` because it did its own padding.
     */
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/*
        ⚠️ `background="flat"`. The gradient is NOT universal — measured across the
        artboards, landing screens carry it and detail/form screens sit on the flat
        ground. This is a screen pushed over the tab bar, so it also needs `onBackPress`,
        which no artboard draws (each board is a standalone frame and models no push).
      */}
      <TopBar
        title={t('offerDrivers.title')}
        background="flat"
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={drivers}
        renderItem={renderDriver}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          drivers.length === 0 ? styles.emptyListContent : styles.listContent
        }
        ListHeaderComponent={
          pendingCount > 0 ? (
            <View style={styles.listHead}>
              <Text style={styles.listHeadTitle}>{t('offerDrivers.title')}</Text>
              <Text style={styles.listHeadCount}>
                {t('offerDrivers.pendingCount').replace('{count}', String(pendingCount))}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={theme.palette.action}
            colors={[theme.palette.action]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.ground },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent: { paddingHorizontal: 18, paddingBottom: 32, gap: 12 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 18 },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 2,
  },
  listHeadTitle: {
    ...theme.typography.caption,
    ...theme.font('sans', 700),
    color: theme.palette.text.secondary,
  },
  listHeadCount: {
    ...theme.typography.monoMeta,
    ...theme.font('mono', 600),
    color: theme.palette.text.tertiary,
  },

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
  avatarText: { fontSize: 14, ...theme.font('sans', 800), color: theme.palette.actionPressed },
  cardHeadText: { flex: 1, minWidth: 0, gap: 3 },
  driverName: { fontSize: 14.5, ...theme.font('sans', 800), color: theme.palette.text.primary },
  carLine: { fontSize: 12, ...theme.font('sans', 600), color: theme.palette.text.secondary },

  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusText: { fontSize: 10.5, ...theme.font('sans', 800) },

  termsWell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 13,
    backgroundColor: theme.palette.ground,
  },
  termsSeats: { flex: 1, fontSize: 12.5, ...theme.font('sans', 800), color: theme.palette.text.primary },
  termsPrice: { ...theme.typography.monoPrice, color: theme.palette.actionPressed },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  totalLabel: { fontSize: 11, ...theme.font('sans', 600), color: theme.palette.text.tertiary },
  totalValue: {
    ...theme.typography.monoMeta,
    ...theme.font('mono', 700),
    color: theme.palette.text.primary,
  },

  messageBox: {
    padding: 10,
    borderRadius: 13,
    backgroundColor: theme.palette.ground,
  },
  messageText: { ...theme.typography.secondary, color: theme.palette.text.secondary },

  contactBox: {
    gap: 8,
    padding: 12,
    borderRadius: theme.borderRadius.field,
    backgroundColor: theme.palette.successTint,
  },
  contactLabel: { fontSize: 11, ...theme.font('sans', 700), color: theme.palette.actionPressed },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: theme.borderRadius.field,
    backgroundColor: theme.palette.action,
  },
  callText: { fontSize: 14, ...theme.font('sans', 800), color: theme.palette.text.onAccent },
  contactMissing: { ...theme.typography.secondary, color: theme.palette.text.secondary },

  actions: {
    flexDirection: 'row',
    gap: 9,
    paddingTop: 9,
    borderTopWidth: theme.sizes.borderHairline,
    borderTopColor: theme.palette.borders.chrome,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: theme.borderRadius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /*
   * ⚠️ REJECT IS THE QUIET BUTTON, ACCEPT THE LOUD ONE — and that asymmetry is
   * deliberate: accepting is irreversible and auto-rejects every rival bid (see the file
   * header), so the destructive-looking control is the one that does LESS harm. Reject
   * is an outlined danger button rather than a danger FILL: `dangerTint` behind
   * `dangerText` measures 4.88:1, while a filled danger button would compete with accept
   * for the eye.
   */
  rejectButton: {
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderEmphasis,
    borderColor: theme.palette.dangerBorder,
  },
  acceptButton: { backgroundColor: theme.palette.action },
  rejectText: { fontSize: 14, ...theme.font('sans', 800), color: theme.palette.dangerText },
  acceptText: { fontSize: 14, ...theme.font('sans', 800), color: theme.palette.text.onAccent },
  buttonDisabled: { opacity: theme.states.disabledOpacity },

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
});
