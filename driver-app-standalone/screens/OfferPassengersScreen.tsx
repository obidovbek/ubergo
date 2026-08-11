/**
 * Offer Passengers Screen
 * Allows drivers to view and manage passengers who joined their offer
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as OfferPassengersAPI from '../api/offerPassengers';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';
import { showConfirmDialog } from '../utils/confirmDialog';
import { getErrorMessage } from '../utils/errorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { AppModal } from '../components/AppModal';
import { dialPhone, formatContactPhone } from '../utils/contactPhone';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export default function OfferPassengersScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { offerId } = route.params as { offerId: number };

  const [passengers, setPassengers] = useState<OfferPassengersAPI.OfferPassenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<OfferPassengersAPI.OfferPassenger | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (token) {
      loadPassengers();
    }
  }, [token, offerId]);

  const loadPassengers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await OfferPassengersAPI.getOfferPassengers(token, offerId);
      setPassengers(data);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, t, 'errors.loadFailed');
      showToast.error(t('common.error'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPassengers();
    setRefreshing(false);
  };

  const handleConfirm = (passenger: OfferPassengersAPI.OfferPassenger) => {
    const passengerName = passenger.passenger?.display_name || t('offerPassengers.unknownPassenger') || 'Unknown';
    const seatsCount = passenger.seats_requested;
    const confirmMessage = seatsCount === 1
      ? (t('offerPassengers.confirmPassengerMessageOne') || 'Confirm {name} for 1 seat?').replace('{name}', passengerName)
      : (t('offerPassengers.confirmPassengerMessage') || 'Confirm {name} for {seats} seats?')
          .replace('{name}', passengerName)
          .replace('{seats}', String(seatsCount));
    
    showConfirmDialog({
      title: t('offerPassengers.confirmPassenger') || 'Confirm Passenger',
      message: confirmMessage,
      confirmText: t('offerPassengers.confirm') || 'Confirm',
      cancelText: t('common.cancel') || 'Cancel',
      onConfirm: async () => {
        try {
          await OfferPassengersAPI.confirmPassenger(token!, passenger.id);
          showToast.success(t('common.success') || 'Success', t('offerPassengers.confirmSuccess') || 'Passenger confirmed successfully');
          loadPassengers();
        } catch (error: any) {
          const errorMsg = getErrorMessage(error, t, 'errors.unknown');
          showToast.error(t('common.error'), errorMsg);
        }
      },
      onCancel: () => {},
    });
  };

  const handleReject = (passenger: OfferPassengersAPI.OfferPassenger) => {
    setSelectedPassenger(passenger);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!selectedPassenger || !token) return;

    try {
      await OfferPassengersAPI.rejectPassenger(
        token,
        selectedPassenger.id,
        rejectionReason || undefined
      );
      showToast.success(t('common.success') || 'Success', t('offerPassengers.rejectSuccess') || 'Passenger rejected');
      setRejectModalVisible(false);
      setSelectedPassenger(null);
      loadPassengers();
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, t, 'errors.unknown');
      showToast.error(t('common.error'), errorMsg);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'confirmed':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'cancelled':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-circle-outline';
      case 'rejected':
        return 'close-circle-outline';
      case 'cancelled':
        return 'ban-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderPassenger = ({ item }: { item: OfferPassengersAPI.OfferPassenger }) => {
    const isPending = item.status === 'pending';
    const isConfirmed = item.status === 'confirmed';
    // T-055 — the server sends the number ONLY on a confirmed row, so this is
    // undefined for every other status even without the check. The status check
    // stays anyway: the block belongs to an accepted booking, and leaning on the
    // field's absence alone would make a server change silent.
    const passengerPhone = item.passenger?.phone_e164;

    return (
      <View style={styles.passengerCard}>
        <View style={styles.passengerHeader}>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>
              {item.passenger?.display_name || t('offerPassengers.unknownPassenger') || 'Unknown'}
            </Text>
            <View style={styles.statusBadge}>
              <Ionicons
                name={getStatusIcon(item.status) as any}
                size={14}
                color={getStatusColor(item.status)}
              />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {t(`offerPassengers.${item.status}`)?.toUpperCase() || item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={18} color="#666" />
            <Text style={styles.detailText}>
              {item.seats_requested === 1
                ? (t('offerPassengers.seatsRequestedOne') || '1 seat requested')
                : (t('offerPassengers.seatsRequested') || '{count} seats requested').replace('{count}', String(item.seats_requested))
              }
            </Text>
          </View>
          {item.is_front_seat && (
            <View style={styles.detailRow}>
              <Ionicons name="car-sport-outline" size={18} color="#666" />
              <Text style={styles.detailText}>{t('offerPassengers.frontSeatRequested') || 'Front seat requested'}</Text>
            </View>
          )}
          {item.agreed_price_per_seat && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={18} color="#4CAF50" />
              <Text style={styles.detailText}>
                {item.is_front_seat && item.seats_requested === 1
                  ? (t('offerPassengers.agreedPriceFrontSeat') || 'Agreed: {price} {currency} (front seat)')
                      .replace('{price}', item.agreed_price_per_seat.toLocaleString())
                      .replace('{currency}', item.currency)
                  : item.is_front_seat && item.seats_requested > 1
                  ? (t('offerPassengers.agreedPriceMultiple') || 'Agreed: {total} {currency} ({seats} seats, 1 front seat)')
                      .replace('{total}', item.total_agreed_price.toLocaleString())
                      .replace('{currency}', item.currency)
                      .replace('{seats}', String(item.seats_requested))
                  : (t('offerPassengers.agreedPriceCalculation') || 'Agreed: {price} {currency} × {seats} = {total} {currency}')
                      .replace('{price}', item.agreed_price_per_seat.toLocaleString())
                      .replace('{currency}', item.currency)
                      .replace('{seats}', String(item.seats_requested))
                      .replace('{total}', item.total_agreed_price.toLocaleString())
                }
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color="#666" />
            <Text style={styles.detailText}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        </View>

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>{t('offerPassengers.message') || 'Message'}:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        {item.rejection_reason && (
          <View style={styles.rejectionContainer}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="information-circle" size={16} color="#EF4444" />
              <Text style={styles.rejectionLabel}>{t('offerPassengers.rejectionReason') || 'Rejection Reason'}:</Text>
            </View>
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>
        )}

        {/* T-055 — the seat is agreed; without this the driver had no way to
            reach the passenger they just accepted. */}
        {isConfirmed && (
          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>{t('offerPassengers.contactTitle')}</Text>
            {passengerPhone ? (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => dialPhone(passengerPhone, t)}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" />
                <Text style={styles.callText}>{formatContactPhone(passengerPhone)}</Text>
              </TouchableOpacity>
            ) : (
              // A passenger who signed up with Google SSO can have no number on
              // file. Say so rather than showing a button that dials nothing.
              <Text style={styles.contactMissing}>{t('offerPassengers.noPhone')}</Text>
            )}
          </View>
        )}

        {isPending && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleConfirm(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>{t('offerPassengers.confirm') || 'Confirm'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>{t('offerPassengers.reject') || 'Reject'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {isConfirmed && (
          <View style={styles.confirmedBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.confirmedText}>{t('offerPassengers.confirmed') || 'Confirmed'}</Text>
          </View>
        )}

        {(item.status === 'rejected' || item.status === 'cancelled') && (
          <View style={[styles.statusBanner, item.status === 'rejected' ? styles.rejectedBanner : styles.cancelledBanner]}>
            <Ionicons 
              name={item.status === 'rejected' ? 'close-circle' : 'ban'} 
              size={20} 
              color={item.status === 'rejected' ? '#EF4444' : '#6B7280'} 
            />
            <Text style={[styles.statusBannerText, item.status === 'rejected' ? styles.rejectedText : styles.cancelledText]}>
              {item.status === 'rejected' 
                ? (t('offerPassengers.rejected') || 'Rejected')
                : (t('offerPassengers.cancelled') || 'Cancelled')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const allCount = passengers.length;
  const pendingCount = passengers.filter((p) => p.status === 'pending').length;
  const confirmedCount = passengers.filter((p) => p.status === 'confirmed').length;
  const rejectedCount = passengers.filter((p) => p.status === 'rejected').length;
  const cancelledCount = passengers.filter((p) => p.status === 'cancelled').length;

  // Filter passengers based on selected status
  const filteredPassengers = statusFilter === 'all' 
    ? passengers 
    : passengers.filter((p) => p.status === statusFilter);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('offerPassengers.title') || 'Passenger Requests'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Summary Cards - Horizontal Scroll */}
      <View style={styles.summaryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryScrollContent}
        >
          <TouchableOpacity
            style={[styles.summaryCard, statusFilter === 'all' && styles.summaryCardActive]}
            onPress={() => setStatusFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={styles.summaryValue}>{allCount}</Text>
            <Text style={styles.summaryLabel}>{t('offerPassengers.all') || 'Barchasi'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, statusFilter === 'pending' && styles.summaryCardActive]}
            onPress={() => setStatusFilter('pending')}
            activeOpacity={0.7}
          >
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>{t('offerPassengers.pending') || 'Kutilmoqda'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, statusFilter === 'confirmed' && styles.summaryCardActive]}
            onPress={() => setStatusFilter('confirmed')}
            activeOpacity={0.7}
          >
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{confirmedCount}</Text>
            <Text style={styles.summaryLabel}>{t('offerPassengers.confirmed') || 'Tasdiqlangan'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, statusFilter === 'rejected' && styles.summaryCardActive]}
            onPress={() => setStatusFilter('rejected')}
            activeOpacity={0.7}
          >
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{rejectedCount}</Text>
            <Text style={styles.summaryLabel}>{t('offerPassengers.rejected') || 'Rad etilgan'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, statusFilter === 'cancelled' && styles.summaryCardActive]}
            onPress={() => setStatusFilter('cancelled')}
            activeOpacity={0.7}
          >
            <Text style={[styles.summaryValue, { color: '#6B7280' }]}>{cancelledCount}</Text>
            <Text style={styles.summaryLabel}>{t('offerPassengers.cancelled') || 'Bekor qilingan'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPassengers}
          renderItem={renderPassenger}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor="#10B981"
              colors={['#10B981']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyText}>
                {statusFilter === 'all' 
                  ? (t('offerPassengers.noPassengers') || 'No passengers yet')
                  : (t('offerPassengers.noPassengersFiltered') || `No ${statusFilter} passengers`)}
              </Text>
              <Text style={styles.emptySubtext}>
                {statusFilter === 'all'
                  ? (t('offerPassengers.noPassengersMessage') || 'Passengers will appear here when they join your offer')
                  : (t('offerPassengers.noPassengersFilteredMessage') || `There are no ${statusFilter} passenger requests`)}
              </Text>
            </View>
          }
        />
      )}

      <AppModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        title={t('offerPassengers.rejectPassenger')}
        dismissOnBackdropPress={false}
        actions={[
          {
            label: t('offerPassengers.reject'),
            onPress: confirmReject,
            variant: 'destructive',
          },
          {
            label: t('common.cancel'),
            onPress: () => setRejectModalVisible(false),
            variant: 'cancel',
          },
        ]}
      >
        <View style={styles.rejectBody}>
          <Text style={styles.modalSubtitle}>
            {t('offerPassengers.rejectReasonOptional')}
          </Text>
          <TextInput
            style={styles.modalInput}
            placeholder={t('offerPassengers.rejectReasonPlaceholder')}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            multiline
            numberOfLines={3}
          />
        </View>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rejectBody: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  summaryContainer: {
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  summaryCard: {
    width: 90,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  summaryCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#10B981',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  passengerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  passengerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  contactBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
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
    minHeight: 44,
  },
  callText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  contactMissing: { fontSize: 14, color: '#6B7280' },
  messageContainer: {
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  confirmedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  rejectedBanner: {
    backgroundColor: '#FEE2E2',
  },
  cancelledBanner: {
    backgroundColor: '#F3F4F6',
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  rejectedText: {
    color: '#EF4444',
  },
  cancelledText: {
    color: '#6B7280',
  },
  rejectionContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rejectionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  modalConfirmButton: {
    backgroundColor: '#F44336',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

