/**
 * Search Passenger Offers Screen (Driver Side)
 * Allows drivers to search for passenger ride requests
 * Redesigned with modern, clean UI - mirrors SearchOffersScreen for passengers
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
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as PassengerOffersAPI from '../api/passengerOffers';
import { passengerNameOf } from '../api/passengerOffers';
import * as GeoAPI from '../api/geo';
import type { GeoOption } from '../api/geo';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { PassengerOfferExtras } from '../components/offers/PassengerOfferExtras';
import { formatNumberWithSpaces } from '../utils/format';
import { formatDateTime } from '../utils/date';
import { showToast } from '../utils/toast';
import { getErrorMessage } from '../utils/errorHandler';
import { AppModal } from '../components/AppModal';
import { GeoPickerModal } from '../components/GeoPickerModal';
import type { MainStackParamList } from '../navigation/types';

const LAST_SEARCH_KEY = '@ubexgo_driver:last_passenger_search';

export default function SearchPassengerOffersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { token } = useAuth();
  const { t, currentLanguage } = useTranslation();
  
  const [offers, setOffers] = useState<PassengerOffersAPI.PassengerOffer[]>([]);
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
  const [geoLoading, setGeoLoading] = useState(false);
  
  // Filter states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minSeats, setMinSeats] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'date_asc' | 'price_desc' | 'price_asc' | 'seats_desc'>('date_asc');

  useEffect(() => {
    const initialize = async () => {
      await loadFromCountries();
      await loadToCountries();
      await loadLastSearch();
    };
    initialize();
  }, []);

  // Save last search
  const saveLastSearch = async (overrideData?: any) => {
    try {
      const fromCountry = overrideData?.fromCountry !== undefined ? overrideData.fromCountry : selectedFromCountry;
      const fromProvince = overrideData?.fromProvince !== undefined ? overrideData.fromProvince : selectedFromProvince;
      const fromCity = overrideData?.fromCity !== undefined ? overrideData.fromCity : selectedFromCity;
      const toCountry = overrideData?.toCountry !== undefined ? overrideData.toCountry : selectedToCountry;
      const toProvince = overrideData?.toProvince !== undefined ? overrideData.toProvince : selectedToProvince;
      const toCity = overrideData?.toCity !== undefined ? overrideData.toCity : selectedToCity;
      
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
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (searchData.fromCountry) {
          setSelectedFromCountry(searchData.fromCountry);
          if (searchData.fromProvince) {
            await loadFromProvinces(searchData.fromCountry.id);
            setSelectedFromProvince(searchData.fromProvince);
            if (searchData.fromCity) {
              await loadFromCities(searchData.fromProvince.id);
              setSelectedFromCity(searchData.fromCity);
            }
          }
        }
        
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
    const tempFromCountry = selectedFromCountry;
    const tempFromProvince = selectedFromProvince;
    const tempFromCity = selectedFromCity;
    const tempToCountry = selectedToCountry;
    const tempToProvince = selectedToProvince;
    const tempToCity = selectedToCity;
    
    setSelectedFromCountry(tempToCountry);
    setSelectedFromProvince(tempToProvince);
    setSelectedFromCity(tempToCity);
    
    setSelectedToCountry(tempFromCountry);
    setSelectedToProvince(tempFromProvince);
    setSelectedToCity(tempFromCity);
    
    if (tempToCountry) {
      setFromProvinces([]);
      setFromCities([]);
      await loadFromProvinces(tempToCountry.id);
      if (tempToProvince) {
        await loadFromCities(tempToProvince.id);
      }
    }
    
    if (tempFromCountry) {
      setToProvinces([]);
      setToCities([]);
      await loadToProvinces(tempFromCountry.id);
      if (tempFromProvince) {
        await loadToCities(tempFromProvince.id);
      }
    }
    
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
  }, [selectedFromProvince, selectedFromCity, selectedToProvince, selectedToCity, maxPrice, minSeats, sortBy]);

  const loadFromCountries = async () => {
    try {
      setGeoLoading(true);
      const data = await GeoAPI.fetchGeoCountries();
      setFromCountries(data);
      
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
      showToast.error('Error', 'Failed to load provinces');
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
      showToast.error('Error', 'Failed to load cities');
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
      showToast.error('Error', 'Failed to load provinces');
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
      showToast.error('Error', 'Failed to load cities');
    } finally {
      setGeoLoading(false);
    }
  };

  const loadOffers = async () => {
    if (!selectedFromProvince || !selectedToProvince) {
      setOffers([]);
      return;
    }

    try {
      setLoading(true);
      
      // Build search query using text from selected locations
      const fromText = selectedFromCity?.name || selectedFromProvince.name;
      const toText = selectedToCity?.name || selectedToProvince.name;
      
      const result = await PassengerOffersAPI.searchPassengerOffers({
        from_text: fromText,
        to_text: toText,
        max_price: maxPrice,
        min_seats: minSeats,
        sort_by: sortBy,
        limit: 20,
      });
      setOffers(result.items);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, t, 'errors.loadFailed');
      showToast.error(t('common.error'), errorMsg);
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
    
    if (type === 'from') {
      if (level === 'province' && !selectedFromCountry) {
        showToast.error('Select Country', 'Please select a country first');
        return;
      }
      if (level === 'city' && !selectedFromProvince) {
        showToast.error('Select Province', 'Please select a province first');
        return;
      }
      
      if (level === 'province' && selectedFromCountry) {
        await loadFromProvinces(selectedFromCountry.id);
      } else if (level === 'city' && selectedFromProvince) {
        await loadFromCities(selectedFromProvince.id);
      }
    } else {
      if (level === 'province' && !selectedToCountry) {
        showToast.error('Select Country', 'Please select a country first');
        return;
      }
      if (level === 'city' && !selectedToProvince) {
        showToast.error('Select Province', 'Please select a province first');
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

    // Search filtering now lives in `ModalList`, which owns the search box (T-036).
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

  const handleViewOffer = (offer: PassengerOffersAPI.PassengerOffer) => {
    if (!token) {
      showToast.error(t('common.error'), t('searchPassengerOffers.loginRequired'));
      return;
    }
    // T-037: the route exists now, so this no longer needs the `as any` that was
    // hiding a navigation to a screen that had never been registered.
    navigation.navigate('PassengerOfferDetails', { offerId: offer.id });
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString, currentLanguage);
  };

  const renderOffer = ({ item }: { item: PassengerOffersAPI.PassengerOffer }) => (
    <TouchableOpacity
      style={styles.offerCard}
      onPress={() => handleViewOffer(item)}
      activeOpacity={0.95}
    >
      {/* Route Section */}
      <View style={styles.routeSection}>
        <View style={styles.routeRow}>
          <View style={styles.routeDot} />
          <View style={styles.routeContent}>
            <Text style={styles.routeLabel}>{t('searchPassengerOffers.fromLabel')}</Text>
            <Text style={styles.routeText} numberOfLines={2}>
              {item.from_text}
            </Text>
            {!!item.from_landmark && (
              <Text style={styles.landmarkText} numberOfLines={1}>
                {item.from_landmark}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.routeConnector}>
          <View style={styles.routeLine} />
          <Ionicons name="arrow-down" size={16} color="#D1D5DB" />
        </View>
        
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: '#3B82F6' }]} />
          <View style={styles.routeContent}>
            <Text style={styles.routeLabel}>{t('searchPassengerOffers.toLabel')}</Text>
            <Text style={styles.routeText} numberOfLines={2}>
              {item.to_text}
            </Text>
            {!!item.to_landmark && (
              <Text style={styles.landmarkText} numberOfLines={1}>
                {item.to_landmark}
              </Text>
            )}
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
              {passengerNameOf(item)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoTag}>
            <Ionicons name="people" size={14} color="#6B7280" />
            <Text style={styles.infoTagText}>
              {item.seats_needed} {item.seats_needed === 1 ? 'seat' : 'seats'} needed
            </Text>
          </View>
        </View>
      </View>

      {/* Everything the new order screen added — windows, seats, class, flags */}
      <PassengerOfferExtras offer={item} />

      {/* Footer Section */}
      <View style={styles.offerFooter}>
        {/* Offers from the new form carry no price — only the special order has one */}
        {item.max_price_per_seat === null || item.max_price_per_seat === undefined ? (
          <View style={styles.budgetBadge}>
            <Text style={styles.budgetValue}>
              {t('passengerOfferExtras.priceNegotiable')}
            </Text>
          </View>
        ) : (
          <View style={styles.budgetBadge}>
            <Text style={styles.budgetLabel}>{t('searchPassengerOffers.maxBudget')}</Text>
            <Text style={styles.budgetValue}>
              {formatNumberWithSpaces(item.max_price_per_seat)} {item.currency}
            </Text>
            <Text style={styles.budgetPerSeat}>{t('searchPassengerOffers.perSeat')}</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewOffer(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewButtonText}>{t('searchPassengerOffers.viewDetails')}</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
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

  /**
   * The route picker, rendered as the results list's header.
   *
   * ⚠️ It used to be a `ScrollView` with `maxHeight: 270` sitting as a SIBLING of
   * the `FlatList`. That gave the screen TWO independent scroll surfaces: the
   * card could never scroll away, so it ate ~270px forever, and because the card
   * and the offer cards share the same white/radius-20/shadow styling the two
   * blurred into one surface at the boundary (the owner's "merges", 2026-08-10).
   * As `ListHeaderComponent` there is ONE scroll surface — it slides away and
   * the results get the whole screen.
   */
  const searchHeader = (
    <>
      <View style={styles.searchContainer}>
        {/* From and To in a compact row */}
        <View style={styles.locationRow}>
          {/* From Location Section */}
          <View style={styles.locationColumn}>
            <View style={styles.locationHeader}>
              <View style={styles.locationDot} />
              <Text style={styles.sectionLabel}>{t('searchPassengerOffers.fromLabel')}</Text>
            </View>
              
            {/* From Country Selection - Compact */}
            <TouchableOpacity
              style={styles.countryButtonCompact}
              onPress={() => openGeoModal('from', 'country')}
              activeOpacity={0.7}
            >
              <Ionicons name="globe" size={14} color="#6B7280" />
              <Text style={styles.countryButtonText} numberOfLines={1}>
                {selectedFromCountry ? selectedFromCountry.name : 'Select Country'}
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
                  {selectedFromProvince ? selectedFromProvince.name : 'Select Province'}
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
                  {selectedFromCity ? selectedFromCity.name : 'City (Optional)'}
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
                <Text style={styles.clearButtonTextCompact}>{t('searchPassengerOffers.clear')}</Text>
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
              <Text style={styles.sectionLabel}>{t('searchPassengerOffers.toLabel')}</Text>
            </View>
              
            {/* To Country Selection - Compact */}
            <TouchableOpacity
              style={styles.countryButtonCompact}
              onPress={() => openGeoModal('to', 'country')}
              activeOpacity={0.7}
            >
              <Ionicons name="globe" size={14} color="#6B7280" />
              <Text style={styles.countryButtonText} numberOfLines={1}>
                {selectedToCountry ? selectedToCountry.name : 'Select Country'}
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
                  {selectedToProvince ? selectedToProvince.name : 'Select Province'}
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
                  {selectedToCity ? selectedToCity.name : 'City (Optional)'}
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
                <Text style={styles.clearButtonTextCompact}>{t('searchPassengerOffers.clear')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* A labelled divider so the card and the offer cards cannot read as one
          continuous white surface. Only meaningful once a route is chosen. */}
      {selectedFromProvince && selectedToProvince && !loading && (
        <View style={styles.resultsDivider}>
          <Text style={styles.resultsCount}>
            {t('searchPassengerOffers.resultsCount').replace('{count}', String(offers.length))}
          </Text>
          <View style={styles.resultsRule} />
        </View>
      )}
    </>
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
        <Text style={styles.headerTitle}>{t('searchPassengerOffers.title')}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="options" size={24} color="#111827" />
          {(maxPrice || minSeats || sortBy !== 'date_asc') && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>{t('searchPassengerOffers.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          renderItem={renderOffer}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={searchHeader}
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
                  <Text style={styles.emptyText}>{t('searchPassengerOffers.emptySelectTitle')}</Text>
                  <Text style={styles.emptySubtext}>
                    {t('searchPassengerOffers.emptySelectSubtitle')}
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                  </View>
                  <Text style={styles.emptyText}>{t('searchPassengerOffers.emptyNoneTitle')}</Text>
                  <Text style={styles.emptySubtext}>
                    {t('searchPassengerOffers.emptyNoneSubtitle')}
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <AppModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        title={t('searchPassengerOffers.filter')}
        actions={[
          {
            label: t('searchPassengerOffers.applyFilters'),
            onPress: () => setFilterModalVisible(false),
          },
        ]}
      >
            <ScrollView style={styles.filterScrollView}>
              {/* Sort By */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t('searchPassengerOffers.sortBy')}</Text>
                <View style={styles.sortOptions}>
                  {[
                    { value: 'date_asc', label: t('searchPassengerOffers.sortDateAsc'), icon: 'calendar-outline' },
                    { value: 'price_desc', label: t('searchPassengerOffers.sortPriceDesc'), icon: 'arrow-up' },
                    { value: 'price_asc', label: t('searchPassengerOffers.sortPriceAsc'), icon: 'arrow-down' },
                    { value: 'seats_desc', label: t('searchPassengerOffers.sortSeatsDesc'), icon: 'people' },
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

              {/* Filters */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t('searchPassengerOffers.filtersTitle')}</Text>
                
                <View style={styles.filterInputGroup}>
                  <Text style={styles.filterInputLabel}>{t('searchPassengerOffers.maxBudgetLabel')}</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder={t('searchPassengerOffers.maxBudgetPlaceholder')}
                    keyboardType="numeric"
                    value={maxPrice?.toString() || ''}
                    onChangeText={(text) => setMaxPrice(text ? parseInt(text) : undefined)}
                  />
                </View>

                <View style={styles.filterInputGroup}>
                  <Text style={styles.filterInputLabel}>{t('searchPassengerOffers.minSeatsLabel')}</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder={t('searchPassengerOffers.minSeatsPlaceholder')}
                    keyboardType="numeric"
                    value={minSeats?.toString() || ''}
                    onChangeText={(text) => setMinSeats(text ? parseInt(text) : undefined)}
                  />
                </View>
              </View>

              {/* Clear Filters */}
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setMaxPrice(undefined);
                  setMinSeats(undefined);
                  setSortBy('date_asc');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={20} color="#EF4444" />
                <Text style={styles.clearFiltersText}>{t('searchPassengerOffers.clearAllFilters')}</Text>
              </TouchableOpacity>
        </ScrollView>
      </AppModal>

      {/* Geo Selection Modal */}
      <GeoPickerModal
        visible={geoModalVisible}
        title={[
          geoModalType === 'from'
            ? t('searchPassengerOffers.from')
            : t('searchPassengerOffers.to'),
          geoModalLevel === 'country'
            ? t('offerWizard.selectCountry')
            : geoModalLevel === 'province'
              ? t('offerWizard.selectProvince')
              : t('offerWizard.selectCity'),
        ].join(': ')}
        options={getGeoOptions()}
        // The screen tracks selection with a predicate, not an id — resolve it here
        // rather than reshaping six pieces of state.
        selectedId={getGeoOptions().find(isGeoSelected)?.id ?? null}
        loading={geoLoading}
        onSelect={handleGeoSelection}
        onClose={() => setGeoModalVisible(false)}
      />
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
  // ⚠️ `searchScrollView` (maxHeight: 270) is deliberately GONE. It made the
  // search card a second, independent scroll surface next to the FlatList — the
  // cause of the card and the results merging into each other (owner, 2026-08-10).
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    // No marginHorizontal: the list's own padding now supplies it, so the card
    // and the offer cards line up on exactly the same left/right edge.
    marginBottom: 4,
    marginTop: 8,
    padding: 16,
    // A slightly stronger shadow than the offer cards carry: this is the control
    // surface and should read as sitting ABOVE the results, not as one of them.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  // The seam between picker and results. Without a labelled break, two white
  // radius-20 surfaces read as one continuous sheet.
  resultsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 10,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  resultsRule: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
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
    // The list now owns everything below the app header, so an empty result set
    // must still be able to centre itself in that space.
    flexGrow: 1,
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
  // mo'ljal — the landmark the passenger typed (T-018)
  landmarkText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  budgetBadge: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  budgetPerSeat: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    // The empty state now renders BELOW the search-card header inside the same
    // list, so it centres in the leftover space rather than the whole screen —
    // `paddingTop: 80` on top of that pushed it off the bottom on small phones.
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
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
  filterInputGroup: {
    marginBottom: 16,
  },
  filterInputLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
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
