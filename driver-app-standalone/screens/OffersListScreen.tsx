/**
 * Offers List Screen
 * Display all driver offers with status badges and actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import * as DriverOffersAPI from '../api/driverOffers';
import type { DriverOffer, OfferStatus } from '../api/driverOffers';
import { OfferCard, OfferDetailModal, StatusFilterTabs } from '../components/offers';

export const OffersListScreen: React.FC = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [allOffers, setAllOffers] = useState<DriverOffer[]>([]); // Store all offers for counting
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OfferStatus | 'all'>('all');
  const [selectedOffer, setSelectedOffer] = useState<DriverOffer | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadOffers = useCallback(async () => {
    if (!token) return;

    try {
      // Always load all offers first to get accurate counts
      const allResponse = await DriverOffersAPI.getDriverOffers(token, {});
      if (allResponse.success && allResponse.offers) {
        setAllOffers(allResponse.offers);
        
        // Filter offers based on selected status
        if (statusFilter === 'all') {
          setOffers(allResponse.offers);
        } else {
          setOffers(allResponse.offers.filter(o => o.status === statusFilter));
        }
      }
    } catch (error: any) {
      console.error('Failed to load offers:', error);
      showToast.error('Xatolik', error.message || 'Failed to load offers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // Refresh offers when screen comes into focus (e.g., after creating/editing)
  useFocusEffect(
    useCallback(() => {
      loadOffers();
    }, [loadOffers])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadOffers();
  }, [loadOffers]);

  const handleCreateOffer = () => {
    (navigation as any).navigate('OfferWizard', { offerId: null });
  };

  const handleEditOffer = (offer: DriverOffer) => {
    (navigation as any).navigate('OfferWizard', { offerId: offer.id });
  };

  const handleOpenDetails = (offer: DriverOffer) => {
    setSelectedOffer(offer);
    setModalVisible(true);
  };

  const handleCloseDetails = () => {
    setModalVisible(false);
    setSelectedOffer(null);
  };

  const handleCancelOffer = async (offer: DriverOffer) => {
    if (!token) return;

    Alert.alert(
      t('driverOffers.confirmCancel') || 'Bekor qilish',
      t('driverOffers.confirmCancelMessage') || 'E\'lonni bekor qilmoqchimisiz?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await DriverOffersAPI.cancelDriverOffer(token, offer.id);
              showToast.success(t('common.success'), t('driverOffers.cancelSuccess') || 'E\'lon bekor qilindi');
              loadOffers();
            } catch (error: any) {
              showToast.error('Xatolik', error.message || 'Failed to cancel offer');
            }
          },
        },
      ]
    );
  };

  const handlePublishOffer = async (offer: DriverOffer) => {
    if (!token) return;

    Alert.alert(
      t('driverOffers.confirmPublish'),
      t('driverOffers.confirmPublish'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await DriverOffersAPI.publishDriverOffer(token, offer.id);
              showToast.success(t('common.success'), t('driverOffers.publishSuccess'));
              loadOffers();
            } catch (error: any) {
              showToast.error('Xatolik', error.message || 'Failed to publish offer');
            }
          },
        },
      ]
    );
  };

  const handleArchiveOffer = async (offer: DriverOffer) => {
    if (!token) return;

    Alert.alert(
      t('driverOffers.confirmArchive'),
      t('driverOffers.confirmArchive'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await DriverOffersAPI.archiveDriverOffer(token, offer.id);
              showToast.success(t('common.success'), t('driverOffers.archiveSuccess'));
              loadOffers();
            } catch (error: any) {
              showToast.error('Xatolik', error.message || 'Failed to archive offer');
            }
          },
        },
      ]
    );
  };

  const handleDeleteOffer = async (offer: DriverOffer) => {
    if (!token) return;

    Alert.alert(
      t('driverOffers.confirmDelete'),
      t('driverOffers.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await DriverOffersAPI.deleteDriverOffer(token, offer.id);
              showToast.success(t('common.success'), t('driverOffers.deleteSuccess'));
              loadOffers();
            } catch (error: any) {
              showToast.error('Xatolik', error.message || 'Failed to delete offer');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: currency || 'UZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderOfferItem = ({ item }: { item: DriverOffer }) => (
    <OfferCard offer={item} onPress={handleOpenDetails} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('driverOffers.title')}</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateOffer}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonIcon}>+</Text>
          <Text style={styles.createButtonText}>{t('driverOffers.createOffer')}</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter Tabs */}
      <StatusFilterTabs
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        allOffers={allOffers}
      />

      {offers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('driverOffers.noOffers')}</Text>
          <Text style={styles.emptySubtext}>{t('driverOffers.noOffersDescription')}</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleCreateOffer}
          >
            <Text style={styles.emptyButtonText}>{t('driverOffers.createOffer')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={offers}
          renderItem={renderOfferItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* Detail Modal */}
      <OfferDetailModal
        visible={modalVisible}
        offer={selectedOffer}
        onClose={handleCloseDetails}
        onEdit={handleEditOffer}
        onCancel={handleCancelOffer}
        onPublish={handlePublishOffer}
        onArchive={handleArchiveOffer}
        onDelete={handleDeleteOffer}
        formatDate={formatDate}
        formatPrice={formatPrice}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginRight: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
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
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
});
