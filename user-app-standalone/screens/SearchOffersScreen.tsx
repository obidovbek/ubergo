/**
 * Search Offers Screen
 * Allows passengers to search for driver offers
 * Redesigned with modern, clean UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as OffersAPI from '../api/offers';
import * as GeoAPI from '../api/geo';
import type { GeoOption } from '../api/geo';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { formatNumberWithSpaces } from '../utils/format';
import { formatDateTime } from '../utils/date';

const LAST_SEARCH_KEY = '@ubexgo:last_search';

export default function SearchOffersScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t, currentLanguage } = useTranslation();
  
  const [offers, setOffers] = useState<OffersAPI.DriverOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Geo selection states - From
  const [fromCountries, setFromCountries] = useState<GeoOption[]>([]);
  const [fromProvinces, setFromProvinces] = useState<GeoOption[]>([]);
  const [fromCities, setFromCities] = useState<GeoOption[]>([]);
  const [selectedFromCountry, setSelectedFromCountry] = useState<GeoOption | null>(null);
  const [selectedFromProvince, setSelectedFromProvince] = useState<GeoOption | null>(null);
  const [selectedFromCity, setSelectedFromCity] = useState<GeoOption | null>(null);

  // Geo selection states - To
  const [toCountries, setToCountries] = useState<GeoOption[]>([]);
  const [toProvinces, setToProvinces] = useState<GeoOption[]>([]);
  const [toCities, setToCities] = useState<GeoOption[]>([]);
  const [selectedToCountry, setSelectedToCountry] = useState<GeoOption | null>(null);
  const [selectedToProvince, setSelectedToProvince] = useState<GeoOption | null>(null);
  const [selectedToCity, setSelectedToCity] = useState<GeoOption | null>(null);
  
  // Modal states
  const [geoModalVisible, setGeoModalVisible] = useState(false);
  const [geoModalType, setGeoModalType] = useState<'from' | 'to'>('from');
  const [geoModalLevel, setGeoModalLevel] = useState<'country' | 'province' | 'city'>('country');
  const [geoSearch, setGeoSearch] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  
  // Filter states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating_desc' | 'date_asc'>('date_asc');

  useEffect(() => {
    const initialize = async () => {
      await loadFromCountries();
      await loadToCountries();
      await loadLastSearch();
    };
    initialize();
  }, []);

  // Save last search (only if both provinces are selected)
  const saveLastSearch = async (overrideData?: {
    fromCountry?: GeoOption | null;
    fromProvince?: GeoOption | null;
    fromCity?: GeoOption | null;
    toCountry?: GeoOption | null;
    toProvince?: GeoOption | null;
    toCity?: GeoOption | null;
  }) => {
    try {
      // Use override data if provided, otherwise use current state
      const fromCountry = overrideData?.fromCountry !== undefined ? overrideData.fromCountry : selectedFromCountry;
      const fromProvince = overrideData?.fromProvince !== undefined ? overrideData.fromProvince : selectedFromProvince;
      const fromCity = overrideData?.fromCity !== undefined ? overrideData.fromCity : selectedFromCity;
      const toCountry = overrideData?.toCountry !== undefined ? overrideData.toCountry : selectedToCountry;
      const toProvince = overrideData?.toProvince !== undefined ? overrideData.toProvince : selectedToProvince;
      const toCity = overrideData?.toCity !== undefined ? overrideData.toCity : selectedToCity;
      
      // Only save if both from and to provinces are selected
      if (fromProvince && toProvince) {
        const searchData = {
          fromCountry,
          fromProvince,
          fromCity,
          toCountry,
          toProvince,
          toCity,
        };
        await AsyncStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(searchData));
      }
    } catch (error) {
      console.error('Failed to save last search:', error);
    }
  };

  // Load last search
  const loadLastSearch = async () => {
    try {
      const savedData = await AsyncStorage.getItem(LAST_SEARCH_KEY);
      if (savedData) {
        const searchData = JSON.parse(savedData);
        
        // Wait a bit for countries to be loaded
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Restore From location
        if (searchData.fromCountry) {
          setSelectedFromCountry(searchData.fromCountry);
          if (searchData.fromProvince) {
            // Load provinces first, then restore selections
            await loadFromProvinces(searchData.fromCountry.id);
            setSelectedFromProvince(searchData.fromProvince);
            if (searchData.fromCity) {
              await loadFromCities(searchData.fromProvince.id);
              setSelectedFromCity(searchData.fromCity);
            }
          }
        }
        
        // Restore To location
        if (searchData.toCountry) {
          setSelectedToCountry(searchData.toCountry);
          if (searchData.toProvince) {
            await loadToProvinces(searchData.toCountry.id);
            setSelectedToProvince(searchData.toProvince);
            if (searchData.toCity) {
              await loadToCities(searchData.toProvince.id);
              setSelectedToCity(searchData.toCity);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load last search:', error);
    }
  };

  // Swap From and To
  const swapLocations = async () => {
    // Store current values before swapping
    const tempFromCountry = selectedFromCountry;
    const tempFromProvince = selectedFromProvince;
    const tempFromCity = selectedFromCity;
    const tempToCountry = selectedToCountry;
    const tempToProvince = selectedToProvince;
    const tempToCity = selectedToCity;
    
    // Swap the selections
    setSelectedFromCountry(tempToCountry);
    setSelectedFromProvince(tempToProvince);
    setSelectedFromCity(tempToCity);
    
    setSelectedToCountry(tempFromCountry);
    setSelectedToProvince(tempFromProvince);
    setSelectedToCity(tempFromCity);
    
    // Clear and reload provinces/cities for the new From location (was To)
    if (tempToCountry) {
      setFromProvinces([]);
      setFromCities([]);
      await loadFromProvinces(tempToCountry.id);
      if (tempToProvince) {
        await loadFromCities(tempToProvince.id);
      }
    }
    
    // Clear and reload provinces/cities for the new To location (was From)
    if (tempFromCountry) {
      setToProvinces([]);
      setToCities([]);
      await loadToProvinces(tempFromCountry.id);
      if (tempFromProvince) {
        await loadToCities(tempFromProvince.id);
      }
    }
    
    // Save swapped values immediately (don't wait for state updates)
    await saveLastSearch({
      fromCountry: tempToCountry,
      fromProvince: tempToProvince,
      fromCity: tempToCity,
      toCountry: tempFromCountry,
      toProvince: tempFromProvince,
      toCity: tempFromCity,
    });
  };

  // Auto-save search when both provinces are selected
  useEffect(() => {
    if (selectedFromProvince && selectedToProvince) {
      // Save with a slight delay to ensure state is fully updated
      const timer = setTimeout(() => {
        saveLastSearch();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [selectedFromProvince, selectedFromCity, selectedToProvince, selectedToCity]);

  // Auto-search when both from and to provinces are selected or filters change
  useEffect(() => {
    if (selectedFromProvince && selectedToProvince) {
      loadOffers();
    }
  }, [selectedFromProvince, selectedFromCity, selectedToProvince, selectedToCity, minRating, maxPrice, minPrice, sortBy]);

  const loadFromCountries = async () => {
    try {
      setGeoLoading(true);
      const data = await GeoAPI.fetchGeoCountries();
      setFromCountries(data);
      
      // Auto-select Uzbekistan as default country
      const uzbekistan = data.find(country => 
        country.name.toLowerCase().includes('zbekistan')
      );
      if (uzbekistan && !selectedFromCountry) {
        setSelectedFromCountry(uzbekistan);
        loadFromProvinces(uzbekistan.id);
      }
    } catch (error: any) {
      console.error('Failed to load countries:', error);
    } finally {
      setGeoLoading(false);
    }
  };

  const loadToCountries = async () => {
    try {
      const data = await GeoAPI.fetchGeoCountries();
      setToCountries(data);
      
      // Auto-select Uzbekistan as default country
      const uzbekistan = data.find(country => 
        country.name.toLowerCase().includes('zbekistan')
      );
      if (uzbekistan && !selectedToCountry) {
        setSelectedToCountry(uzbekistan);
        loadToProvinces(uzbekistan.id);
      }
    } catch (error: any) {
      console.error('Failed to load countries:', error);
    }
  };

  const loadFromProvinces = async (countryId: number) => {
    try {
      setGeoLoading(true);
      const data = await GeoAPI.fetchGeoProvinces(countryId);
      setFromProvinces(data);
    } catch (error: any) {
      console.error('Failed to load provinces:', error);
      Alert.alert('Error', 'Failed to load provinces');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadFromCities = async (provinceId: number) => {
    try {
      setGeoLoading(true);
      const data = await GeoAPI.fetchGeoCityDistricts(provinceId);
      setFromCities(data);
    } catch (error: any) {
      console.error('Failed to load cities:', error);
      Alert.alert('Error', 'Failed to load cities');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadToProvinces = async (countryId: number) => {
    try {
      setGeoLoading(true);
      const data = await GeoAPI.fetchGeoProvinces(countryId);
      setToProvinces(data);
    } catch (error: any) {
      console.error('Failed to load provinces:', error);
      Alert.alert('Error', 'Failed to load provinces');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadToCities = async (provinceId: number) => {
    try {
      setGeoLoading(true);
      const data = await GeoAPI.fetchGeoCityDistricts(provinceId);
      setToCities(data);
    } catch (error: any) {
      console.error('Failed to load cities:', error);
      Alert.alert('Error', 'Failed to load cities');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadOffers = async () => {
    if (!selectedFromProvince || !selectedToProvince) {
      // Don't search if both from and to provinces are not selected
      setOffers([]);
      return;
    }

    try {
      setLoading(true);
      const result = await OffersAPI.searchOffers({
        from_province_id: selectedFromProvince.id,
        from_city_id: selectedFromCity?.id,
        to_province_id: selectedToProvince.id,
        to_city_id: selectedToCity?.id,
        min_rating: minRating > 0 ? minRating : undefined,
        max_price: maxPrice,
        min_price: minPrice,
        sort_by: sortBy,
        limit: 20,
      });
      setOffers(result.items);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOffers();
    setRefreshing(false);
  };

  const openGeoModal = async (type: 'from' | 'to', level: 'country' | 'province' | 'city') => {
    setGeoModalType(type);
    setGeoModalLevel(level);
    setGeoSearch('');
    
    if (type === 'from') {
      if (level === 'province' && !selectedFromCountry) {
        Alert.alert(t('searchOffers.selectCountry'), t('searchOffers.selectCountry'));
        return;
      }
      if (level === 'city' && !selectedFromProvince) {
        Alert.alert(t('searchOffers.selectProvince'), t('searchOffers.selectProvince'));
        return;
      }
      
      if (level === 'province' && selectedFromCountry) {
        await loadFromProvinces(selectedFromCountry.id);
      } else if (level === 'city' && selectedFromProvince) {
        await loadFromCities(selectedFromProvince.id);
      }
    } else {
      if (level === 'province' && !selectedToCountry) {
        Alert.alert(t('searchOffers.selectCountry'), t('searchOffers.selectCountry'));
        return;
      }
      if (level === 'city' && !selectedToProvince) {
        Alert.alert(t('searchOffers.selectProvince'), t('searchOffers.selectProvince'));
        return;
      }
      
      if (level === 'province' && selectedToCountry) {
        await loadToProvinces(selectedToCountry.id);
      } else if (level === 'city' && selectedToProvince) {
        await loadToCities(selectedToProvince.id);
      }
    }
    
    setGeoModalVisible(true);
  };

  const handleGeoSelection = async (option: GeoOption) => {
    if (geoModalType === 'from') {
      if (geoModalLevel === 'country') {
        setSelectedFromCountry(option);
        setSelectedFromProvince(null);
        setSelectedFromCity(null);
        setFromProvinces([]);
        setFromCities([]);
        await loadFromProvinces(option.id);
      } else if (geoModalLevel === 'province') {
        setSelectedFromProvince(option);
        setSelectedFromCity(null);
        setFromCities([]);
        await loadFromCities(option.id);
      } else if (geoModalLevel === 'city') {
        setSelectedFromCity(option);
      }
    } else {
      if (geoModalLevel === 'country') {
        setSelectedToCountry(option);
        setSelectedToProvince(null);
        setSelectedToCity(null);
        setToProvinces([]);
        setToCities([]);
        await loadToProvinces(option.id);
      } else if (geoModalLevel === 'province') {
        setSelectedToProvince(option);
        setSelectedToCity(null);
        setToCities([]);
        await loadToCities(option.id);
      } else if (geoModalLevel === 'city') {
        setSelectedToCity(option);
      }
    }
    
    setGeoModalVisible(false);
    setGeoSearch('');
    
    // Save search after selection
    setTimeout(() => {
      saveLastSearch();
    }, 100);
  };

  const clearGeoSelection = (type?: 'from' | 'to') => {
    if (!type || type === 'from') {
      setSelectedFromCountry(null);
      setSelectedFromProvince(null);
      setSelectedFromCity(null);
      setFromProvinces([]);
      setFromCities([]);
    }
    if (!type || type === 'to') {
      setSelectedToCountry(null);
      setSelectedToProvince(null);
      setSelectedToCity(null);
      setToProvinces([]);
      setToCities([]);
    }
    if (!type) {
      setOffers([]);
    }
    
    // Save after clearing
    setTimeout(() => {
      saveLastSearch();
    }, 100);
  };

  const getGeoOptions = (): GeoOption[] => {
    let options: GeoOption[] = [];
    if (geoModalType === 'from') {
      switch (geoModalLevel) {
        case 'country':
          options = fromCountries;
          break;
        case 'province':
          options = fromProvinces;
          break;
        case 'city':
          options = fromCities;
          break;
      }
    } else {
      switch (geoModalLevel) {
        case 'country':
          options = toCountries;
          break;
        case 'province':
          options = toProvinces;
          break;
        case 'city':
          options = toCities;
          break;
      }
    }

    if (geoSearch.trim()) {
      const query = geoSearch.toLowerCase();
      return options.filter(opt => opt.name.toLowerCase().includes(query));
    }

    return options;
  };

  const isGeoSelected = (option: GeoOption): boolean => {
    if (geoModalType === 'from') {
      if (geoModalLevel === 'country') return selectedFromCountry?.id === option.id;
      if (geoModalLevel === 'province') return selectedFromProvince?.id === option.id;
      if (geoModalLevel === 'city') return selectedFromCity?.id === option.id;
    } else {
      if (geoModalLevel === 'country') return selectedToCountry?.id === option.id;
      if (geoModalLevel === 'province') return selectedToProvince?.id === option.id;
      if (geoModalLevel === 'city') return selectedToCity?.id === option.id;
    }
    return false;
  };

  const handleJoinOffer = (offer: OffersAPI.DriverOffer) => {
    if (!token) {
      Alert.alert(t('offerDetails.loginRequired'), t('offerDetails.loginRequiredMessage'));
      return;
    }
    (navigation as any).navigate('OfferDetails', { offerId: offer.id });
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString, currentLanguage);
  };

  const renderOffer = ({ item }: { item: OffersAPI.DriverOffer }) => (
    <TouchableOpacity
      style={styles.offerCard}
      onPress={() => handleJoinOffer(item)}
      activeOpacity={0.95}
    >
      {/* Route Section */}
      <View style={styles.routeSection}>
        <View style={styles.routeRow}>
          <View style={styles.routeDot} />
          <View style={styles.routeContent}>
            <Text style={styles.routeLabel}>{t('searchOffers.from')}</Text>
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
            <Text style={styles.routeLabel}>{t('searchOffers.to')}</Text>
            <Text style={styles.routeText} numberOfLines={1}>
              {item.to_text}
            </Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <View style={styles.infoTag}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.infoTagText}>{formatDate(item.start_at)}</Text>
          </View>
          
          <View style={styles.infoTag}>
            <Ionicons name="person-outline" size={14} color="#6B7280" />
            <Text style={styles.infoTagText} numberOfLines={1}>
              {item.driver.name}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoTag}>
            <Ionicons name="car-outline" size={14} color="#6B7280" />
            <Text style={styles.infoTagText} numberOfLines={1}>
              {item.vehicle.make} {item.vehicle.model}
            </Text>
          </View>
          
          {/* Driver Rating */}
          <View style={[styles.infoTag, styles.ratingTag]}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(item.driver?.rating || 0) ? 'star' : 'star-outline'}
                  size={12}
                  color="#F59E0B"
                  style={styles.ratingStar}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {item.driver?.rating ? item.driver.rating.toFixed(1) : '0.0'}
              {item.driver?.rating_count ? (
                <Text style={styles.ratingCountText}> ({item.driver.rating_count})</Text>
              ) : (
                <Text style={styles.ratingCountText}> ({t('searchOffers.new')})</Text>
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer Section */}
      <View style={styles.offerFooter}>
        <View style={styles.seatsBadge}>
          <Ionicons name="people" size={16} color="#10B981" />
            <Text style={styles.seatsText}>
              {item.seats_free} {item.seats_free === 1 ? t('searchOffers.seat') : t('searchOffers.seats')}
            </Text>
        </View>
        
        <View style={styles.priceBadge}>
          <Text style={styles.priceValue}>
            {formatNumberWithSpaces(item.price_per_seat)} {item.currency}
          </Text>
          <Text style={styles.priceLabel}>{t('searchOffers.perSeat')}</Text>
        </View>
      </View>

      {item.note && (
        <View style={styles.noteContainer}>
          <Ionicons name="chatbubble-outline" size={12} color="#6B7280" />
          <Text style={styles.noteText} numberOfLines={2}>
            {item.note}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>{t('searchOffers.title')}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="options" size={24} color="#111827" />
          {(minRating > 0 || maxPrice || minPrice || sortBy !== 'date_asc') && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {/* Geo Selection Container - Scrollable */}
      <ScrollView 
        style={styles.searchScrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <View style={styles.searchContainer}>
          {/* From and To in a compact row */}
          <View style={styles.locationRow}>
            {/* From Location Section */}
            <View style={styles.locationColumn}>
              <View style={styles.locationHeader}>
                <View style={styles.locationDot} />
                <Text style={styles.sectionLabel}>{t('searchOffers.from')}</Text>
              </View>
              
              {/* From Country Selection - Compact */}
              <TouchableOpacity
                style={styles.countryButtonCompact}
                onPress={() => openGeoModal('from', 'country')}
                activeOpacity={0.7}
              >
                <Ionicons name="globe" size={14} color="#6B7280" />
                <Text style={styles.countryButtonText} numberOfLines={1}>
                  {selectedFromCountry ? selectedFromCountry.name : t('searchOffers.selectCountry')}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
              </TouchableOpacity>
              
              {/* From Province Selection */}
              {selectedFromCountry && (
                <TouchableOpacity
                  style={styles.geoSelectButtonCompact}
                  onPress={() => openGeoModal('from', 'province')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.geoSelectTextCompact}>
                    {selectedFromProvince ? selectedFromProvince.name : t('searchOffers.selectProvince')}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}

              {/* From City Selection (Optional) */}
              {selectedFromProvince && (
                <TouchableOpacity
                  style={styles.geoSelectButtonCompact}
                  onPress={() => openGeoModal('from', 'city')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.geoSelectTextCompact, !selectedFromCity && styles.geoSelectTextPlaceholder]}>
                    {selectedFromCity ? selectedFromCity.name : t('searchOffers.cityOptional')}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}

              {/* Clear From Selection */}
              {(selectedFromProvince || selectedFromCity) && (
                <TouchableOpacity
                  style={styles.clearButtonCompact}
                  onPress={() => clearGeoSelection('from')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <Text style={styles.clearButtonTextCompact}>{t('searchOffers.clear')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Swap Button */}
            <View style={styles.swapContainer}>
              <TouchableOpacity
                style={styles.swapButton}
                onPress={swapLocations}
                activeOpacity={0.7}
                disabled={!selectedFromProvince || !selectedToProvince}
              >
                <Ionicons 
                  name="swap-vertical" 
                  size={20} 
                  color={selectedFromProvince && selectedToProvince ? '#10B981' : '#D1D5DB'} 
                />
              </TouchableOpacity>
            </View>

            {/* To Location Section */}
            <View style={styles.locationColumn}>
              <View style={styles.locationHeader}>
                <View style={[styles.locationDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.sectionLabel}>{t('searchOffers.to')}</Text>
              </View>
              
              {/* To Country Selection - Compact */}
              <TouchableOpacity
                style={styles.countryButtonCompact}
                onPress={() => openGeoModal('to', 'country')}
                activeOpacity={0.7}
              >
                <Ionicons name="globe" size={14} color="#6B7280" />
                <Text style={styles.countryButtonText} numberOfLines={1}>
                  {selectedToCountry ? selectedToCountry.name : t('searchOffers.selectCountry')}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
              </TouchableOpacity>
              
              {/* To Province Selection */}
              {selectedToCountry && (
                <TouchableOpacity
                  style={styles.geoSelectButtonCompact}
                  onPress={() => openGeoModal('to', 'province')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.geoSelectTextCompact}>
                    {selectedToProvince ? selectedToProvince.name : t('searchOffers.selectProvince')}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}

              {/* To City Selection (Optional) */}
              {selectedToProvince && (
                <TouchableOpacity
                  style={styles.geoSelectButtonCompact}
                  onPress={() => openGeoModal('to', 'city')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.geoSelectTextCompact, !selectedToCity && styles.geoSelectTextPlaceholder]}>
                    {selectedToCity ? selectedToCity.name : t('searchOffers.cityOptional')}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}

              {/* Clear To Selection */}
              {(selectedToProvince || selectedToCity) && (
                <TouchableOpacity
                  style={styles.clearButtonCompact}
                  onPress={() => clearGeoSelection('to')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <Text style={styles.clearButtonTextCompact}>{t('searchOffers.clear')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Selected Route Display */}
          {/* {selectedFromProvince && selectedToProvince && (
            <View style={styles.selectedLocationCard}>
              <Text style={styles.selectedLocationLabel}>Searching Route:</Text>
              <Text style={styles.selectedLocationText}>
                {selectedFromProvince.name}
                {selectedFromCity && ` (${selectedFromCity.name})`}
                {' → '}
                {selectedToProvince.name}
                {selectedToCity && ` (${selectedToCity.name})`}
              </Text>
            </View>
          )} */}
        </View>
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>{t('searchOffers.loadingOffers')}</Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          renderItem={renderOffer}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {!selectedFromProvince || !selectedToProvince ? (
                <>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="location-outline" size={48} color="#D1D5DB" />
                  </View>
                  <Text style={styles.emptyText}>{t('searchOffers.selectLocations')}</Text>
                  <Text style={styles.emptySubtext}>
                    {t('searchOffers.selectLocationsMessage')}
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="car-outline" size={48} color="#D1D5DB" />
                  </View>
                  <Text style={styles.emptyText}>{t('searchOffers.noRidesAvailable')}</Text>
                  <Text style={styles.emptySubtext}>
                    {t('searchOffers.noRidesMessage')}
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('searchOffers.filter')}</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScrollView}>
              {/* Sort By */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t('searchOffers.sortBy')}</Text>
                <View style={styles.sortOptions}>
                  {[
                    { value: 'date_asc', label: t('searchOffers.sortDateAsc'), icon: 'calendar-outline' },
                    { value: 'price_asc', label: t('searchOffers.sortPriceAsc'), icon: 'arrow-up' },
                    { value: 'price_desc', label: t('searchOffers.sortPriceDesc'), icon: 'arrow-down' },
                    { value: 'rating_desc', label: t('searchOffers.sortRatingDesc'), icon: 'star' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.sortOption,
                        sortBy === option.value && styles.sortOptionActive
                      ]}
                      onPress={() => setSortBy(option.value as any)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={option.icon as any} 
                        size={20} 
                        color={sortBy === option.value ? '#10B981' : '#6B7280'} 
                      />
                      <Text style={[
                        styles.sortOptionText,
                        sortBy === option.value && styles.sortOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                      {sortBy === option.value && (
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Minimum Rating */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t('searchOffers.minimumRating')}</Text>
                <View style={styles.ratingOptions}>
                  {[0, 3, 4, 4.5, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingOption,
                        minRating === rating && styles.ratingOptionActive
                      ]}
                      onPress={() => setMinRating(rating)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name="star" 
                        size={16} 
                        color={minRating === rating ? '#F59E0B' : '#D1D5DB'} 
                      />
                      <Text style={[
                        styles.ratingOptionText,
                        minRating === rating && styles.ratingOptionTextActive
                      ]}>
                        {rating === 0 ? t('searchOffers.any') : `${rating}+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t('searchOffers.priceRange')}</Text>
                <View style={styles.priceInputs}>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>{t('searchOffers.min')}</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="0"
                      keyboardType="numeric"
                      value={minPrice?.toString() || ''}
                      onChangeText={(text) => setMinPrice(text ? parseInt(text) : undefined)}
                    />
                  </View>
                  <Text style={styles.priceInputSeparator}>—</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>{t('searchOffers.max')}</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="∞"
                      keyboardType="numeric"
                      value={maxPrice?.toString() || ''}
                      onChangeText={(text) => setMaxPrice(text ? parseInt(text) : undefined)}
                    />
                  </View>
                </View>
              </View>

              {/* Clear Filters */}
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setMinRating(0);
                  setMaxPrice(undefined);
                  setMinPrice(undefined);
                  setSortBy('date_asc');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={20} color="#EF4444" />
                <Text style={styles.clearFiltersText}>{t('searchOffers.clearAllFilters')}</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.filterFooter}>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyFiltersText}>{t('searchOffers.applyFilters')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Geo Selection Modal */}
      <Modal
        visible={geoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGeoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {geoModalType === 'from' ? 'From: ' : 'To: '}
                {geoModalLevel === 'country' && t('searchOffers.selectCountry')}
                {geoModalLevel === 'province' && t('searchOffers.selectProvince')}
                {geoModalLevel === 'city' && t('searchOffers.cityOptional').replace(' (Optional)', '')}
              </Text>
              <TouchableOpacity
                onPress={() => setGeoModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <View style={styles.modalSearchContainer}>
                <Ionicons name="search" size={18} color="#6B7280" style={styles.modalSearchIcon} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                  value={geoSearch}
                  onChangeText={setGeoSearch}
                />
                {geoSearch.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setGeoSearch('')}
                    style={styles.modalSearchClear}
                  >
                    <Text style={styles.modalSearchClearText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {geoLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color="#10B981" />
              </View>
            ) : getGeoOptions().length === 0 ? (
              <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>
                  {geoSearch.trim() ? t('common.error') : t('common.loading')}
                </Text>
              </View>
            ) : (
              <FlatList
                data={getGeoOptions()}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const isSelected = isGeoSelected(item);

                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                      onPress={() => handleGeoSelection(item)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          isSelected && styles.modalItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  );
                }}
                style={styles.modalList}
              />
            )}
          </View>
        </View>
      </Modal>
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
  filterButton: {
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
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  searchScrollView: {
    maxHeight: 270,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationColumn: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  swapContainer: {
    paddingTop: 32,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    minHeight: 36,
    gap: 6,
  },
  countryButtonText: {
    flex: 1,
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  geoSelectButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 10,
    marginBottom: 8,
    minHeight: 42,
  },
  geoSelectTextCompact: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  geoSelectTextPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  clearButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 6,
    marginTop: 4,
    gap: 4,
  },
  clearButtonTextCompact: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  selectedLocationCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  selectedLocationLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  selectedLocationText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 18,
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
  routeSection: {
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    marginVertical: 6,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  infoSection: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: '45%',
  },
  infoTagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  ratingTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingStar: {
    marginRight: 0,
  },
  ratingText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
    marginLeft: 4,
  },
  ratingCountText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  seatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  seatsText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
  priceBadge: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  priceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    minHeight: '60%',
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
  modalSearchBox: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    minHeight: 48,
  },
  modalSearchIcon: {
    marginRight: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
    fontWeight: '500',
  },
  modalSearchClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalSearchClearText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalLoading: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmpty: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  modalList: {
    maxHeight: 500,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  modalItemSelected: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  modalItemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  modalItemTextSelected: {
    color: '#059669',
    fontWeight: '700',
  },
  // Filter Modal Styles
  filterScrollView: {
    maxHeight: 500,
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sortOptions: {
    gap: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  ratingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  ratingOptionActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  ratingOptionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  ratingOptionTextActive: {
    color: '#D97706',
    fontWeight: '700',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  priceInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  priceInputSeparator: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '700',
    paddingTop: 20,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    gap: 8,
  },
  clearFiltersText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '700',
  },
  filterFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyFiltersButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

