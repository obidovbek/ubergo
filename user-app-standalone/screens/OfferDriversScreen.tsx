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
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#B45309' },
  confirmed: { bg: '#D1FAE5', text: '#047857' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
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

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.driverInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color="#4A90E2" />
            </View>
            <Text style={styles.driverName} numberOfLines={1}>
              {driverNameOf(item, t('offerDrivers.unknownDriver'))}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {t(`offerDrivers.status_${item.status}`)}
            </Text>
          </View>
        </View>

        {/* `vehicle` is optional on the payload, so every field is guarded. */}
        {v ? (
          <View style={styles.row}>
            <Ionicons name="car-outline" size={16} color="#6B7280" />
            <Text style={styles.rowText} numberOfLines={1}>
              {[v.make?.name, v.model?.name, v.color?.name].filter(Boolean).join(' ')}
              {v.license_plate ? ` · ${v.license_plate}` : ''}
            </Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.rowText}>
            {t('offerDrivers.seatsOffered').replace(
              '{count}',
              String(item.seats_offered)
            )}
          </Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="cash-outline" size={16} color="#6B7280" />
          <Text style={styles.rowText}>
            {formatNumberWithSpaces(item.offered_price_per_seat)} {item.currency}
            {'  ·  '}
            {t('offerDrivers.total')}: {formatNumberWithSpaces(item.total_offered_price)}{' '}
            {item.currency}
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
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => dialPhone(driverPhone, t)}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" />
                <Text style={styles.callText}>{formatContactPhone(driverPhone)}</Text>
              </TouchableOpacity>
            ) : (
              // A driver who signed up with Google SSO can have no number on
              // file. Say so rather than showing a button that dials nothing.
              <Text style={styles.contactMissing}>{t('offerDrivers.noPhone')}</Text>
            )}
          </View>
        )}

        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton, disabled && styles.buttonDisabled]}
              onPress={() => handleReject(item)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              {busyId === item.id ? (
                <ActivityIndicator size="small" color="#B91C1C" />
              ) : (
                <Text style={styles.rejectText}>{t('offerDrivers.reject')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton, disabled && styles.buttonDisabled]}
              onPress={() => handleAccept(item)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text style={styles.acceptText}>{t('offerDrivers.accept')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={loadFailed ? 'alert-circle-outline' : 'car-outline'}
        size={56}
        color="#D1D5DB"
      />
      <Text style={styles.emptyTitle}>
        {loadFailed ? t('offerDrivers.loadFailed') : t('offerDrivers.emptyTitle')}
      </Text>
      {!loadFailed && (
        <Text style={styles.emptyText}>{t('offerDrivers.emptyMessage')}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('offerDrivers.title')}
          </Text>
          {pendingCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {t('offerDrivers.pendingCount').replace('{count}', String(pendingCount))}
            </Text>
          )}
        </View>
      </View>

      <FlatList
        data={drivers}
        renderItem={renderDriver}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          drivers.length === 0 ? styles.emptyListContent : styles.listContent
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 4, marginRight: 8 },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 32 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  driverInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  driverName: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rowText: { fontSize: 14, color: '#374151', marginLeft: 8, flex: 1 },
  messageBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  messageText: { fontSize: 14, color: '#4B5563', fontStyle: 'italic' },
  contactBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
  },
  callText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  contactMissing: { fontSize: 14, color: '#6B7280' },
  actions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: { backgroundColor: '#FEE2E2' },
  acceptButton: { backgroundColor: '#10B981' },
  rejectText: { color: '#B91C1C', fontWeight: '700', fontSize: 15 },
  acceptText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  buttonDisabled: { opacity: 0.5 },
  emptyContainer: { alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
