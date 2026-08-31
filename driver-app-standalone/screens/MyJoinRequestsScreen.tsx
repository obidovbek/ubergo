/**
 * My Join Requests Screen (driver side) — T-037 step 5.
 *
 * Where a driver sees the offers he has sent on passenger orders. Without it a
 * driver sends an offer, gets a toast, and then has nowhere to look — which is
 * how this screen came to exist at all.
 *
 * ⚠️ Cancelling is FINAL. The server refuses a re-join after `cancelled` *or*
 * `rejected` (unique (offer_id, driver_id) index + explicit checks in
 * OfferDriverService). Deliberate — owner, 2026-08-02 — so the confirm dialog
 * says so out loud rather than pretending it is undoable.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as PassengerOffersAPI from '../api/passengerOffers';
import { passengerNameOf, passengerPhoneOf } from '../api/passengerOffers';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { subscribePushReceived } from '../utils/pushEvents';
import { showConfirmDialog } from '../utils/confirmDialog';
import { getErrorMessage } from '../utils/errorHandler';
import { formatNumberWithSpaces } from '../utils/format';
import { formatDateTime } from '../utils/date';
import { dialPhone, formatContactPhone } from '../utils/contactPhone';
import { theme } from '../themes';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'rejected' | 'cancelled';

const FILTERS: StatusFilter[] = ['all', 'pending', 'confirmed', 'rejected', 'cancelled'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: theme.palette.warnTint, text: theme.palette.warnInk },
  confirmed: { bg: theme.palette.successTint, text: theme.palette.actionPressed },
  rejected: { bg: theme.palette.dangerTint, text: theme.palette.dangerText },
  cancelled: { bg: theme.palette.surfaceSunken, text: theme.palette.text.secondary },
};

export default function MyJoinRequestsScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t, currentLanguage } = useTranslation();

  const [requests, setRequests] = useState<PassengerOffersAPI.OfferDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!token) return;

    try {
      const data = await PassengerOffersAPI.getMyJoinRequests(
        token,
        statusFilter === 'all' ? undefined : statusFilter
      );
      setRequests(data);
    } catch (error: any) {
      showToast.error(
        t('common.error'),
        getErrorMessage(error, t, 'myJoinRequests.loadFailed')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, statusFilter, t]);

  // Covers all three cases on its own: first mount, a change of filter (which
  // changes `loadRequests`), and coming back from another screen — a request
  // the passenger confirmed or rejected meanwhile should be visible on return.
  // A plain `useEffect` alongside this would just double-fetch on mount.
  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  // T-068 — a push that lands while this screen is open used to show a toast over
  // a list that kept displaying the old data. `useFocusEffect` above does not
  // help: the screen is already focused, so nothing re-runs. Refresh in place;
  // navigation still happens only on a tap.
  useEffect(() => {
    return subscribePushReceived(() => loadRequests(), [
      'driver_request_confirmed',
      'driver_request_rejected',
      'driver_not_chosen',
      'offer_cancelled_by_passenger',
      'passenger_offer_updated',
    ]);
  }, [loadRequests]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleCancel = (request: PassengerOffersAPI.OfferDriver) => {
    showConfirmDialog({
      title: t('myJoinRequests.cancelTitle'),
      message: t('myJoinRequests.cancelWarning'),
      confirmText: t('myJoinRequests.cancelConfirm'),
      cancelText: t('common.back'),
      confirmButtonStyle: 'destructive',
      onConfirm: async () => {
        if (!token) return;
        try {
          setCancellingId(request.id);
          await PassengerOffersAPI.cancelJoinRequest(token, request.id);
          showToast.success(t('common.success'), t('myJoinRequests.cancelled'));
          await loadRequests();
        } catch (error: any) {
          showToast.error(
            t('common.error'),
            getErrorMessage(error, t, 'myJoinRequests.cancelFailed')
          );
        } finally {
          setCancellingId(null);
        }
      },
      onCancel: () => {},
    });
  };

  const renderRequest = ({ item }: { item: PassengerOffersAPI.OfferDriver }) => {
    const offer = item.offer;
    const colors = STATUS_COLORS[item.status] || STATUS_COLORS.cancelled;
    const passengerName = passengerNameOf(offer);
    // T-054 — the server sends the passenger's number ONLY on a confirmed
    // request, so this is empty for every other status even without the check.
    // The status check stays anyway: the block belongs to an agreed ride, and
    // leaning on the field's absence alone would make a server change silent.
    const isConfirmed = item.status === 'confirmed';
    const passengerPhone = passengerPhoneOf(offer);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {t(`myJoinRequests.status_${item.status}`)}
            </Text>
          </View>
          <Text style={styles.createdAt}>
            {formatDateTime(item.created_at, currentLanguage)}
          </Text>
        </View>

        {offer ? (
          <>
            <View style={styles.routeRow}>
              <Ionicons name="location-outline" size={16} color={theme.palette.action} />
              <Text style={styles.routeText} numberOfLines={1}>
                {offer.from_text}
              </Text>
            </View>
            <View style={styles.routeRow}>
              <Ionicons name="flag-outline" size={16} color={theme.palette.male} />
              <Text style={styles.routeText} numberOfLines={1}>
                {offer.to_text}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={theme.palette.text.secondary} />
              <Text style={styles.metaText}>
                {formatDateTime(offer.start_at, currentLanguage)}
              </Text>
            </View>
            {!!passengerName && (
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color={theme.palette.text.secondary} />
                <Text style={styles.metaText}>{passengerName}</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.metaText}>{t('myJoinRequests.offerGone')}</Text>
        )}

        <View style={styles.priceBox}>
          <View style={styles.priceLine}>
            <Text style={styles.priceLabel}>{t('myJoinRequests.pricePerSeat')}</Text>
            <Text style={styles.priceValue}>
              {formatNumberWithSpaces(Math.round(Number(item.offered_price_per_seat)))}{' '}
              {item.currency}
            </Text>
          </View>
          <View style={styles.priceLine}>
            <Text style={styles.priceLabel}>{t('myJoinRequests.seatsOffered')}</Text>
            <Text style={styles.priceValue}>{item.seats_offered}</Text>
          </View>
          <View style={styles.priceLine}>
            <Text style={[styles.priceLabel, styles.totalLabel]}>
              {t('myJoinRequests.total')}
            </Text>
            <Text style={[styles.priceValue, styles.totalValue]}>
              {formatNumberWithSpaces(Math.round(Number(item.total_offered_price)))}{' '}
              {item.currency}
            </Text>
          </View>
        </View>

        {!!item.message && <Text style={styles.message}>{item.message}</Text>}

        {item.status === 'rejected' && !!item.rejection_reason && (
          <Text style={styles.rejectionReason}>{item.rejection_reason}</Text>
        )}

        {/* T-054 — the passenger chose this driver; without a number the agreed
            ride had no way of actually happening. */}
        {isConfirmed && (
          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>{t('myJoinRequests.contactTitle')}</Text>
            {passengerPhone ? (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => dialPhone(passengerPhone, t)}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={16} color={theme.palette.surface} />
                <Text style={styles.callText}>{formatContactPhone(passengerPhone)}</Text>
              </TouchableOpacity>
            ) : (
              // A passenger who signed up with Google SSO can have no number on
              // file. Say so rather than showing a button that dials nothing.
              <Text style={styles.contactMissing}>{t('myJoinRequests.noPhone')}</Text>
            )}
          </View>
        )}

        {/* The server refuses to cancel a confirmed request, so only pending
            ones offer the button. */}
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancel(item)}
            disabled={cancellingId === item.id}
            activeOpacity={0.8}
          >
            {cancellingId === item.id ? (
              <ActivityIndicator size="small" color={theme.palette.dangerText} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color={theme.palette.dangerText} />
                <Text style={styles.cancelButtonText}>{t('myJoinRequests.cancel')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.palette.ground} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.palette.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('myJoinRequests.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, statusFilter === filter && styles.filterChipActive]}
              onPress={() => setStatusFilter(filter)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter === 'all' ? t('common.all') : t(`myJoinRequests.status_${filter}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.palette.action} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="paper-plane-outline" size={48} color={theme.palette.text.disabled} />
              <Text style={styles.emptyText}>{t('myJoinRequests.empty')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.ground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    backgroundColor: theme.palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.borders.strong,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: theme.palette.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  filterBar: {
    backgroundColor: theme.palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.borders.strong,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: theme.palette.surfaceSunken,
  },
  filterChipActive: {
    backgroundColor: theme.palette.action,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.palette.text.secondary,
  },
  filterChipTextActive: {
    color: theme.palette.surface,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: theme.palette.text.secondary,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.palette.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.palette.borders.strong,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  createdAt: {
    fontSize: 12,
    color: theme.palette.text.tertiary,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.palette.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  priceBox: {
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.palette.ground,
    gap: 4,
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.palette.text.primary,
  },
  totalLabel: {
    fontWeight: '700',
    color: theme.palette.actionPressed,
  },
  totalValue: {
    fontWeight: '800',
    color: theme.palette.actionPressed,
  },
  message: {
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.palette.text.muted,
  },
  rejectionReason: {
    fontSize: 13,
    color: theme.palette.dangerText,
  },
  contactBox: {
    backgroundColor: theme.palette.successTint,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.palette.actionPressed,
    marginBottom: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.palette.action,
    borderRadius: 12,
    minHeight: 44,
  },
  callText: { color: theme.palette.surface, fontWeight: '700', fontSize: 15 },
  contactMissing: { fontSize: 14, color: theme.palette.text.secondary },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.palette.dangerBorder,
    backgroundColor: theme.palette.dangerTint,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.palette.dangerText,
  },
});
