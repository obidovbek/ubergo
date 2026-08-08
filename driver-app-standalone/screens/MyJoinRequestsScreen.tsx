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

import React, { useCallback, useState } from 'react';
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
import { passengerNameOf } from '../api/passengerOffers';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { showConfirmDialog } from '../utils/confirmDialog';
import { getErrorMessage } from '../utils/errorHandler';
import { formatNumberWithSpaces } from '../utils/format';
import { formatDateTime } from '../utils/date';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'rejected' | 'cancelled';

const FILTERS: StatusFilter[] = ['all', 'pending', 'confirmed', 'rejected', 'cancelled'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#B45309' },
  confirmed: { bg: '#D1FAE5', text: '#047857' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
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
              <Ionicons name="location-outline" size={16} color="#10B981" />
              <Text style={styles.routeText} numberOfLines={1}>
                {offer.from_text}
              </Text>
            </View>
            <View style={styles.routeRow}>
              <Ionicons name="flag-outline" size={16} color="#3B82F6" />
              <Text style={styles.routeText} numberOfLines={1}>
                {offer.to_text}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>
                {formatDateTime(offer.start_at, currentLanguage)}
              </Text>
            </View>
            {!!passengerName && (
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color="#6B7280" />
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
              <ActivityIndicator size="small" color="#B91C1C" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color="#B91C1C" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
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
          <ActivityIndicator size="large" color="#10B981" />
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
              <Ionicons name="paper-plane-outline" size={48} color="#D1D5DB" />
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#10B981',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
    color: '#6B7280',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#9CA3AF',
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
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceBox: {
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalLabel: {
    fontWeight: '700',
    color: '#047857',
  },
  totalValue: {
    fontWeight: '800',
    color: '#047857',
  },
  message: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#4B5563',
  },
  rejectionReason: {
    fontSize: 13,
    color: '#B91C1C',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B91C1C',
  },
});
