/**
 * My Passenger Offers Screen
 * Screen for viewing and managing passenger offers
 * Redesigned with modern, clean UI
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  ScrollView,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  getMyPassengerOffers,
  cancelPassengerOffer,
  PassengerOffer,
} from '../api/passengerOffers';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { formatNumberWithSpaces } from '../utils/format';
import { formatDateTime } from '../utils/date';
import { isAuthError, getErrorMessage } from '../utils/errorHandler';
import { showToast } from '../utils/toast';
import { showConfirmDialog } from '../utils/confirmDialog';

type MainStackParamList = {
  Menu: undefined;
  CreatePassengerOffer: undefined;
  MyPassengerOffers: undefined;
  PassengerOfferDetails: { offerId: number };
};

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 50; // Minimum distance for swipe

export const MyPassengerOffersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t, currentLanguage } = useTranslation();
  const { logout } = useAuth();
  
  const [offers, setOffers] = useState<PassengerOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const tabsScrollViewRef = useRef<ScrollView>(null);
  
  const filters = ['all', 'published', 'completed', 'cancelled'];
  const currentFilterIndex = filters.indexOf(selectedFilter);

  const scrollToTab = useCallback((index: number) => {
    // Calculate approximate position for the tab
    // Each tab is roughly 80-100px wide, plus padding
    const tabWidth = SCREEN_WIDTH / filters.length;
    const scrollPosition = index * tabWidth - (SCREEN_WIDTH / 2) + (tabWidth / 2);
    
    tabsScrollViewRef.current?.scrollTo({
      x: Math.max(0, scrollPosition),
      animated: true,
    });
  }, []);

  const loadOffers = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const status = selectedFilter === 'all' ? undefined : selectedFilter;
      const data = await getMyPassengerOffers(status);
      setOffers(data);
    } catch (error: any) {
      console.error('Error loading passenger offers:', error);
      
      // Check if it's an authentication error (token expired/invalid)
      const errorMsg = (error.message || '').toLowerCase();
      const isTokenError = (errorMsg.includes('invalid') && errorMsg.includes('token')) ||
                          (errorMsg.includes('expired') && errorMsg.includes('token')) ||
                          (errorMsg.includes('unauthorized') && errorMsg.includes('token'));
      
      if (isAuthError(error) || isTokenError) {
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
      } else {
        // For other errors, show the error message
        const errorMessage = getErrorMessage(error, t('passengerOffers.errorLoadMessage'));
        showToast.error(t('passengerOffers.errorLoad'), errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleFilterChange = useCallback((filter: string) => {
    setSelectedFilter(filter);
    const index = filters.indexOf(filter);
    scrollToTab(index);
  }, [scrollToTab]);

  // PanResponder for swipe gestures
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // Only respond to horizontal swipes
          return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
        },
        onPanResponderRelease: (evt, gestureState) => {
          const { dx } = gestureState;
          const currentIndex = filters.indexOf(selectedFilter);
          
          // Swipe right (previous tab)
          if (dx > SWIPE_THRESHOLD && currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setSelectedFilter(filters[newIndex]);
            scrollToTab(newIndex);
          }
          // Swipe left (next tab)
          else if (dx < -SWIPE_THRESHOLD && currentIndex < filters.length - 1) {
            const newIndex = currentIndex + 1;
            setSelectedFilter(filters[newIndex]);
            scrollToTab(newIndex);
          }
        },
      }),
    [selectedFilter, scrollToTab]
  );

  useFocusEffect(
    useCallback(() => {
      loadOffers();
    }, [selectedFilter])
  );

  // Scroll to active tab when filter changes
  useEffect(() => {
    if (currentFilterIndex >= 0) {
      scrollToTab(currentFilterIndex);
    }
  }, [selectedFilter, currentFilterIndex, scrollToTab]);

  const handleRefresh = () => {
    loadOffers(true);
  };

  const handleCancelOffer = async (offerId: number) => {
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
          loadOffers();
        } catch (error: any) {
          console.error('Error cancelling offer:', error);
          
          // Check if it's an authentication error
          if (isAuthError(error) || 
              error.message?.toLowerCase().includes('invalid') && error.message?.toLowerCase().includes('token') ||
              error.message?.toLowerCase().includes('expired') && error.message?.toLowerCase().includes('token')) {
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
          } else {
            const errorMessage = getErrorMessage(error, t('passengerOffers.cancelErrorMessage'));
            showToast.error(t('passengerOffers.cancelError'), errorMessage);
          }
        }
      },
      onCancel: () => {},
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'published':
        return '#10B981';
      case 'completed':
        return '#3B82F6';
      case 'cancelled':
        return '#EF4444';
      case 'archived':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case 'published':
        return '#D1FAE5';
      case 'completed':
        return '#DBEAFE';
      case 'cancelled':
        return '#FEE2E2';
      case 'archived':
        return '#F3F4F6';
      default:
        return '#F9FAFB';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return 'checkmark-circle';
      case 'completed':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle';
      case 'archived':
        return 'archive';
      default:
        return 'help-circle-outline';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'published':
        return t('passengerOffers.active');
      case 'completed':
        return t('passengerOffers.completed');
      case 'cancelled':
        return t('passengerOffers.cancelled');
      case 'archived':
        return t('passengerOffers.archived');
      default:
        return status;
    }
  };

  const formatDate = (dateString: string): string => {
    return formatDateTime(dateString, currentLanguage);
  };

  const renderOfferItem = ({ item }: { item: PassengerOffer }) => {
    const driverCount = item.drivers?.length || 0;
    const pendingDrivers = item.drivers?.filter(d => d.status === 'pending').length || 0;

    return (
      <TouchableOpacity
        style={styles.offerCard}
        onPress={() => (navigation as any).navigate('PassengerOfferDetails', { offerId: item.id })}
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
            {getStatusLabel(item.status)}
          </Text>
        </View>

        {/* Route Section */}
        <View style={styles.routeSection}>
          <View style={styles.routeRow}>
            <View style={styles.routeDot} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>{t('passengerOffers.from')}</Text>
              <Text style={styles.routeText} numberOfLines={1}>
                {item.from_text}
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
              <Text style={styles.routeLabel}>{t('passengerOffers.to')}</Text>
              <Text style={styles.routeText} numberOfLines={1}>
                {item.to_text}
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
              <Text style={styles.infoValue}>{formatDate(item.start_at)}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="people" size={18} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('passengerOffers.seatsNeeded')}</Text>
              <Text style={styles.infoValue}>
                {item.seats_needed} {item.seats_needed > 1 ? t('searchOffers.seats') : t('searchOffers.seat')}
              </Text>
            </View>
          </View>
        </View>

        {/* Price Section — offers from the new form carry no price (T-018) */}
        <View style={styles.priceSection}>
          {item.max_price_per_seat === null || item.max_price_per_seat === undefined ? (
            <Text style={styles.priceValue}>{t('passengerOffers.priceNegotiable')}</Text>
          ) : (
            <>
              <View style={styles.priceHeader}>
                <Text style={styles.priceLabel}>{t('passengerOffers.maxPricePerSeat')}</Text>
              </View>
              <Text style={styles.priceValue}>
                {formatNumberWithSpaces(item.max_price_per_seat)} {item.currency}
              </Text>
            </>
          )}
        </View>

        {/* Driver Info */}
        {driverCount > 0 && (
          <View style={styles.driverInfo}>
            <View style={styles.driverInfoHeader}>
              <Ionicons name="car-outline" size={16} color="#3B82F6" />
              <Text style={styles.driverInfoText}>
                {driverCount} {driverCount > 1 ? t('passengerOffers.driversInterested') : t('passengerOffers.driverInterested')}
                {pendingDrivers > 0 && ` (${pendingDrivers} ${t('passengerOffers.pending')})`}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {item.status === 'published' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={(e) => {
                e.stopPropagation();
                handleCancelOffer(item.id);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.cancelButtonText}>{t('passengerOffers.cancelRequest')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyText}>{t('passengerOffers.noRequests')}</Text>
      <Text style={styles.emptySubtext}>
        {t('passengerOffers.noRequestsMessage')}
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => (navigation as any).navigate('CreatePassengerOffer')}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>{t('passengerOffers.createRideRequest')}</Text>
      </TouchableOpacity>
    </View>
  );

  const publishedCount = offers.filter((o) => o.status === 'published').length;
  const completedCount = offers.filter((o) => o.status === 'completed').length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>{t('passengerOffers.loadingRequests')}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>{t('passengerOffers.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (navigation as any).navigate('CreatePassengerOffer')}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </View>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{publishedCount}</Text>
          <Text style={styles.statLabel}>{t('passengerOffers.active')}</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-done-circle" size={20} color="#3B82F6" />
          </View>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>{t('passengerOffers.completed')}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        ref={tabsScrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScrollView}
      >
        {filters.map((filter) => {
          const getFilterLabel = (f: string) => {
            switch (f) {
              case 'all':
                return t('passengerOffers.all');
              case 'published':
                return t('passengerOffers.active');
              case 'completed':
                return t('passengerOffers.completed');
              case 'cancelled':
                return t('passengerOffers.cancelled');
              default:
                return f.charAt(0).toUpperCase() + f.slice(1);
            }
          };
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, selectedFilter === filter && styles.filterTabActive]}
              onPress={() => handleFilterChange(filter)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter && styles.filterTabTextActive,
                ]}
                numberOfLines={1}
              >
                {getFilterLabel(filter)}
              </Text>
              {selectedFilter === filter && <View style={styles.filterTabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View {...panResponder.panHandlers} style={{ flex: 1 }}>
        <FlatList
          data={offers}
          renderItem={renderOfferItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor="#10B981"
              colors={['#10B981']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
  filterScrollView: {
    maxHeight: 60,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 4,
    gap: 12,
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 80,
  },
  filterTabActive: {
    // Active state handled by indicator
  },
  filterTabText: {
    fontSize: 14,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  offerCard: {
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
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  driverInfo: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  driverInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverInfoText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
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
  emptyState: {
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
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
