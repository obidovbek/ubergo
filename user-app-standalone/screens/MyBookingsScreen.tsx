/**
 * My Bookings Screen
 * Shows passenger's bookings and their status
 * Redesigned with modern, clean UI
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
  StatusBar,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MenuButton } from '../components/MenuButton';
import { Ionicons } from '@expo/vector-icons';
import * as OffersAPI from '../api/offers';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { formatNumberWithSpaces } from '../utils/format';
import { formatDateTime } from '../utils/date';
import { showToast } from '../utils/toast';
import { showConfirmDialog } from '../utils/confirmDialog';
import { getErrorMessage } from '../utils/errorHandler';
import { AppModal } from '../components/AppModal';

export default function MyBookingsScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const [bookings, setBookings] = useState<OffersAPI.OfferPassenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  
  // Rating modal states
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<OffersAPI.OfferPassenger | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (token) {
      loadBookings();
    }
  }, [token, filter]);

  const loadBookings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await OffersAPI.getMyBookings(
        token,
        filter === 'all' ? undefined : filter
      );
      setBookings(data);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, t, 'errors.loadFailed');
      showToast.error(t('common.error'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
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
          loadBookings();
        } catch (error: any) {
          const errorMsg = getErrorMessage(error, t, 'myBookings.cancelError');
          showToast.error(t('common.error'), errorMsg);
        }
      },
      onCancel: () => {},
    });
  };

  const handleRateDriver = (booking: OffersAPI.OfferPassenger) => {
    setSelectedBooking(booking);
    setRating(0);
    setRatingComment('');
    setRatingModalVisible(true);
  };

  const submitRating = async () => {
    if (!selectedBooking || !token) return;
    
    if (rating === 0) {
      showToast.error(t('myBookings.ratingRequired'), t('myBookings.ratingRequiredMessage'));
      return;
    }

    try {
      setSubmittingRating(true);
      await OffersAPI.rateDriver(token, selectedBooking.id, rating, ratingComment || undefined);
      showToast.success(t('myBookings.ratingSuccess'), t('myBookings.ratingSuccessMessage'));
      setRatingModalVisible(false);
      loadBookings();
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, t, 'myBookings.ratingError');
      showToast.error(t('common.error'), errorMsg);
    } finally {
      setSubmittingRating(false);
    }
  };

  const canRateBooking = (booking: OffersAPI.OfferPassenger): boolean => {
    if (booking.status !== 'confirmed') return false;
    if (!booking.offer) return false;
    
    // Check if ride has started (can rate after ride start time)
    const rideStartTime = new Date(booking.offer.start_at);
    const now = new Date();
    return now >= rideStartTime;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FEF3C7';
      case 'confirmed':
        return '#D1FAE5';
      case 'rejected':
        return '#FEE2E2';
      case 'cancelled':
        return '#F3F4F6';
      default:
        return '#F9FAFB';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'cancelled':
        return 'ban';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString, currentLanguage);
  };

  const renderBooking = ({ item }: { item: OffersAPI.OfferPassenger }) => {
    const offer = item.offer;
    if (!offer) return null;

    const canCancel = ['pending', 'confirmed'].includes(item.status);

    return (
      <TouchableOpacity 
        style={styles.bookingCard}
        activeOpacity={0.95}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
          <Ionicons 
            name={getStatusIcon(item.status) as any} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status === 'pending' && t('myBookings.pending')}
            {item.status === 'confirmed' && t('myBookings.confirmed')}
            {item.status === 'rejected' && t('common.error')}
            {item.status === 'cancelled' && t('common.cancel')}
          </Text>
        </View>

        {/* Route Section */}
        <View style={styles.routeSection}>
          <View style={styles.routeRow}>
            <View style={styles.routeDot} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>{t('offerDetails.from')}</Text>
              <Text style={styles.routeText} numberOfLines={1}>
                {offer.from_text}
              </Text>
            </View>
          </View>
          
          <View style={styles.routeConnector}>
            <View style={styles.routeLine} />
            <Ionicons name="arrow-down" size={16} color="#D1D5DB" />
          </View>
          
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: '#3B82F6' }]} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>{t('offerDetails.to')}</Text>
              <Text style={styles.routeText} numberOfLines={1}>
                {offer.to_text}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="calendar-outline" size={18} color="#10B981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('myBookings.date')}</Text>
              <Text style={styles.infoValue}>{formatDate(offer.start_at)}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="people" size={18} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('myBookings.seats')}</Text>
              <Text style={styles.infoValue}>
                {item.seats_requested} {item.seats_requested > 1 ? t('searchOffers.seats') : t('searchOffers.seat')}
              </Text>
            </View>
          </View>
        </View>

        {/* Price Section - Show Agreed Price */}
        <View style={styles.priceSection}>
          <View style={styles.priceHeader}>
            <Text style={styles.priceLabel}>{t('myBookings.totalPrice')}</Text>
            {item.total_agreed_price && item.total_agreed_price !== (offer.price_per_seat * item.seats_requested) && (
              <View style={styles.agreedPriceBadge}>
                <Ionicons name="lock-closed" size={10} color="#10B981" />
                <Text style={styles.agreedPriceText}>Agreed</Text>
              </View>
            )}
          </View>
          <Text style={styles.priceValue}>
            {formatNumberWithSpaces(item.total_agreed_price || (offer.price_per_seat * item.seats_requested))} {item.currency || offer.currency}
          </Text>
          {item.agreed_price_per_seat && (
            <Text style={styles.pricePerSeatText}>
              {formatNumberWithSpaces(item.agreed_price_per_seat)} {item.currency || offer.currency} × {item.seats_requested} {item.seats_requested > 1 ? t('searchOffers.seats') : t('searchOffers.seat')}
            </Text>
          )}
        </View>

        {/* Rejection Reason */}
        {item.rejection_reason && (
          <View style={styles.rejectionContainer}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="information-circle" size={16} color="#EF4444" />
              <Text style={styles.rejectionLabel}>{t('myBookings.rejectionReason')}</Text>
            </View>
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.cancelButtonText}>{t('myBookings.cancelBooking')}</Text>
            </TouchableOpacity>
          )}
          
          {canRateBooking(item) && (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => handleRateDriver(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={styles.rateButtonText}>{t('myBookings.rateDriver')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <MenuButton />
        <Text style={styles.headerTitle}>{t('myBookings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="time" size={20} color="#F59E0B" />
          </View>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>{t('myBookings.pending')}</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </View>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{confirmedCount}</Text>
          <Text style={styles.statLabel}>{t('myBookings.confirmed')}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            {t('myBookings.all')}
          </Text>
          {filter === 'all' && <View style={styles.filterTabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]}>
            {t('myBookings.pending')}
          </Text>
          {filter === 'pending' && <View style={styles.filterTabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'confirmed' && styles.filterTabActive]}
          onPress={() => setFilter('confirmed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, filter === 'confirmed' && styles.filterTabTextActive]}>
            {t('myBookings.confirmed')}
          </Text>
          {filter === 'confirmed' && <View style={styles.filterTabIndicator} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>{t('myBookings.loadingBookings')}</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyText}>{t('myBookings.noBookings')}</Text>
              <Text style={styles.emptySubtext}>
                {t('myBookings.noBookingsMessage')}
              </Text>
            </View>
          }
        />
      )}

      {/* Rating Modal */}
      <AppModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        title={t('myBookings.rateYourDriver')}
      >
        <ScrollView
          style={styles.ratingContent}
          keyboardShouldPersistTaps="handled"
        >
              {selectedBooking?.offer && (
                <View style={styles.ratingBookingInfo}>
                  <Text style={styles.ratingRoute}>
                    {selectedBooking.offer.from_text} → {selectedBooking.offer.to_text}
                  </Text>
                </View>
              )}

              {/* Star Rating */}
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={48}
                      color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <Text style={styles.ratingLabel}>
                  {rating === 1 && t('myBookings.poor')}
                  {rating === 2 && t('myBookings.fair')}
                  {rating === 3 && t('myBookings.good')}
                  {rating === 4 && t('myBookings.veryGood')}
                  {rating === 5 && t('myBookings.excellent')}
                </Text>
              )}

              {/* Comment Input */}
              <TextInput
                style={styles.commentInput}
                placeholder={t('myBookings.shareExperience')}
                placeholderTextColor="#9CA3AF"
                value={ratingComment}
                onChangeText={setRatingComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitRatingButton, rating === 0 && styles.submitRatingButtonDisabled]}
                onPress={submitRating}
                disabled={rating === 0 || submittingRating}
                activeOpacity={0.8}
              >
                {submittingRating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                    <Text style={styles.submitRatingText}>{t('myBookings.submitRating')}</Text>
                  </>
                )}
              </TouchableOpacity>
        </ScrollView>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  filterTabActive: {
    // Active state handled by indicator
  },
  filterTabText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  filterTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  routeSection: {
    marginBottom: 20,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 12,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
    marginVertical: 8,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  priceSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  agreedPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  agreedPriceText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  pricePerSeatText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  rejectionContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  rateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  rateButtonText: {
    color: '#D97706',
    fontSize: 15,
    fontWeight: '700',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Rating Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 22,
    color: '#6B7280',
    fontWeight: '600',
  },
  ratingContent: {
    padding: 20,
  },
  ratingBookingInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  ratingRoute: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 24,
  },
  commentInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
    fontWeight: '500',
    marginBottom: 20,
  },
  submitRatingButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitRatingButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitRatingText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

