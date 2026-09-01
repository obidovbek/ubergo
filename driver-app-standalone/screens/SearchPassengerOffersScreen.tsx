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
import { GeoSheet, type GeoPath } from '../components/geo/GeoSheet';
import type { MainStackParamList } from '../navigation/types';
import { theme } from '../themes';

const LAST_SEARCH_KEY = '@ubexgo_driver:last_passenger_search';

export default function SearchPassengerOffersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { token } = useAuth();
  const { t, currentLanguage } = useTranslation();
  
  const [offers, setOffers] = useState<PassengerOffersAPI.PassengerOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Geo selection states - From
  /*
   * T-101 — the geo cascade moved into `GeoSheet`, exactly as in the user app's
   * `SearchOffersScreen`.
   *
   * 🔴 THIS SCREEN IS THAT ONE'S TWIN: the same 12 state hooks, the same seven
   * helpers (`openGeoModal`, `getGeoOptions`, `isGeoSelected`, `clearGeoSelection`,
   * `swapLocations`, `handleGeoSelection`, `loadLastSearch`), the same duplicated
   * "clear the child when the parent changes" rule written twice. Fixing one twin
   * and walking past the other is this project's most repeated defect.
   *
   * ⚠️ The two are NOT identical underneath: this search sends `from_text`/`to_text`
   * STRINGS while the passenger app sends `*_province_id`/`*_city_id`. The derived
   * names below keep that difference invisible to the rest of the file.
   */
  const [fromPath, setFromPath] = useState<GeoPath>({});
  const [toPath, setToPath] = useState<GeoPath>({});
  const [geoSheet, setGeoSheet] = useState<'from' | 'to' | null>(null);

  const selectedFromCountry = fromPath.country ?? null;
  const selectedFromProvince = fromPath.province ?? null;
  const selectedFromCity = fromPath.district ?? null;
  const selectedToCountry = toPath.country ?? null;
  const selectedToProvince = toPath.province ?? null;
  const selectedToCity = toPath.district ?? null;
  
  // Filter states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minSeats, setMinSeats] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'date_asc' | 'price_desc' | 'price_asc' | 'seats_desc'>('date_asc');

  useEffect(() => {
    const initialize = async () => {
      // T-101 — no pre-loading; `GeoSheet` fetches each level when it opens.
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
      if (!savedData) return;
      const searchData = JSON.parse(savedData);

      /*
       * T-101 — was six loader calls behind a 300 ms sleep, because the old picker
       * could only show a list it had already fetched. A restored path is a value now.
       */
      setFromPath({
        ...(searchData.fromCountry ? { country: searchData.fromCountry } : {}),
        ...(searchData.fromProvince ? { province: searchData.fromProvince } : {}),
        ...(searchData.fromCity ? { district: searchData.fromCity } : {}),
      });
      setToPath({
        ...(searchData.toCountry ? { country: searchData.toCountry } : {}),
        ...(searchData.toProvince ? { province: searchData.toProvince } : {}),
        ...(searchData.toCity ? { district: searchData.toCity } : {}),
      });
    } catch (error) {
      console.error('Failed to load last search:', error);
    }
  };

  // Swap From and To
  /** T-101 — swapping two paths is one exchange (see the user app's twin). */
  const swapLocations = () => {
    setFromPath(toPath);
    setToPath(fromPath);
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

  /** T-101 — clearing a direction is emptying its path. */
  const clearGeoSelection = (type: 'from' | 'to') => {
    if (type === 'from') setFromPath({});
    else setToPath({});
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
          <Ionicons name="arrow-down" size={16} color={theme.palette.text.disabled} />
        </View>
        
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: theme.palette.male }]} />
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
            <Ionicons name="calendar-outline" size={14} color={theme.palette.text.secondary} />
            <Text style={styles.infoTagText}>{formatDate(item.start_at)}</Text>
          </View>
          
          <View style={styles.infoTag}>
            <Ionicons name="person-outline" size={14} color={theme.palette.text.secondary} />
            <Text style={styles.infoTagText} numberOfLines={1}>
              {passengerNameOf(item)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoTag}>
            <Ionicons name="people" size={14} color={theme.palette.text.secondary} />
            <Text style={styles.infoTagText}>
              {t('searchPassengerOffers.seatsNeededCount').replace(
                '{count}',
                String(item.seats_needed)
              )}
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
          <Ionicons name="arrow-forward" size={16} color={theme.palette.text.onAccent} />
        </TouchableOpacity>
      </View>

      {item.note && (
        <View style={styles.noteContainer}>
          <Ionicons name="chatbubble-outline" size={12} color={theme.palette.text.secondary} />
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
              
            {/* T-101 — one button per direction; the sheet walks the levels. */}
            <TouchableOpacity
              style={styles.geoSelectButtonCompact}
              onPress={() => setGeoSheet('from')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.geoSelectTextCompact,
                  !fromPath.province && styles.geoSelectTextPlaceholder,
                ]}
                numberOfLines={2}
              >
                {[fromPath.province?.name, fromPath.district?.name]
                  .filter(Boolean)
                  .join(', ') || t('offerWizard.selectProvince')}
              </Text>
              <Ionicons name="chevron-down" size={18} color={theme.palette.text.tertiary} />
            </TouchableOpacity>

            {!!fromPath.province && (
              <TouchableOpacity
                style={styles.clearButtonCompact}
                onPress={() => setFromPath({})}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={16} color={theme.palette.dangerText} />
                <Text style={styles.clearButtonTextCompact}>
                  {t('searchPassengerOffers.clear')}
                </Text>
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
                color={selectedFromProvince && selectedToProvince ? theme.palette.action : theme.palette.text.disabled} 
              />
            </TouchableOpacity>
          </View>

          {/* To Location Section */}
          <View style={styles.locationColumn}>
            <View style={styles.locationHeader}>
              <View style={[styles.locationDot, { backgroundColor: theme.palette.male }]} />
              <Text style={styles.sectionLabel}>{t('searchPassengerOffers.toLabel')}</Text>
            </View>
              
            {/* T-101 — one button per direction; the sheet walks the levels. */}
            <TouchableOpacity
              style={styles.geoSelectButtonCompact}
              onPress={() => setGeoSheet('to')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.geoSelectTextCompact,
                  !toPath.province && styles.geoSelectTextPlaceholder,
                ]}
                numberOfLines={2}
              >
                {[toPath.province?.name, toPath.district?.name]
                  .filter(Boolean)
                  .join(', ') || t('offerWizard.selectProvince')}
              </Text>
              <Ionicons name="chevron-down" size={18} color={theme.palette.text.tertiary} />
            </TouchableOpacity>

            {!!toPath.province && (
              <TouchableOpacity
                style={styles.clearButtonCompact}
                onPress={() => setToPath({})}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={16} color={theme.palette.dangerText} />
                <Text style={styles.clearButtonTextCompact}>
                  {t('searchPassengerOffers.clear')}
                </Text>
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
      <StatusBar barStyle="dark-content" backgroundColor={theme.palette.ground} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.palette.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('searchPassengerOffers.title')}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="options" size={24} color={theme.palette.text.primary} />
          {(maxPrice || minSeats || sortBy !== 'date_asc') && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.palette.action} />
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
                    <Ionicons name="location-outline" size={48} color={theme.palette.text.disabled} />
                  </View>
                  <Text style={styles.emptyText}>{t('searchPassengerOffers.emptySelectTitle')}</Text>
                  <Text style={styles.emptySubtext}>
                    {t('searchPassengerOffers.emptySelectSubtitle')}
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="people-outline" size={48} color={theme.palette.text.disabled} />
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
                        color={sortBy === option.value ? theme.palette.action : theme.palette.text.secondary} 
                      />
                      <Text style={[
                        styles.sortOptionText,
                        sortBy === option.value && styles.sortOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                      {sortBy === option.value && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.palette.action} />
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
                <Ionicons name="refresh" size={20} color={theme.palette.dangerText} />
                <Text style={styles.clearFiltersText}>{t('searchPassengerOffers.clearAllFilters')}</Text>
              </TouchableOpacity>
        </ScrollView>
      </AppModal>

      {/* Geo Selection Modal */}
      {/* T-101 — the same shared sheet the passenger app's search uses. */}
      <GeoSheet
        visible={geoSheet !== null}
        title={
          geoSheet === 'from'
            ? t('searchPassengerOffers.from')
            : t('searchPassengerOffers.to')
        }
        initialPath={geoSheet === 'from' ? fromPath : toPath}
        // This search sends from_text/to_text built from province + district, so
        // district is as deep as it needs.
        endLevel="district"
        onDone={(path) => {
          if (geoSheet === 'from') setFromPath(path);
          else setToPath(path);
          setGeoSheet(null);
        }}
        onClose={() => setGeoSheet(null)}
      />
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 16,
    backgroundColor: theme.palette.ground,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: theme.palette.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: theme.palette.text.primary,
    letterSpacing: -0.5,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.palette.text.primary,
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
    backgroundColor: theme.palette.danger,
  },
  // ⚠️ `searchScrollView` (maxHeight: 270) is deliberately GONE. It made the
  // search card a second, independent scroll surface next to the FlatList — the
  // cause of the card and the results merging into each other (owner, 2026-08-10).
  searchContainer: {
    backgroundColor: theme.palette.surface,
    borderRadius: 20,
    // No marginHorizontal: the list's own padding now supplies it, so the card
    // and the offer cards line up on exactly the same left/right edge.
    marginBottom: 4,
    marginTop: 8,
    padding: 16,
    // A slightly stronger shadow than the offer cards carry: this is the control
    // surface and should read as sitting ABOVE the results, not as one of them.
    shadowColor: theme.palette.text.primary,
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
    color: theme.palette.text.secondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  resultsRule: {
    flex: 1,
    height: 1,
    backgroundColor: theme.palette.borders.strong,
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
    backgroundColor: theme.palette.action,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.palette.text.secondary,
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
    backgroundColor: theme.palette.successTint,
    borderWidth: 2,
    borderColor: theme.palette.action,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.palette.successTint,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.palette.successTint,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    minHeight: 36,
    gap: 6,
  },
  countryButtonText: {
    flex: 1,
    fontSize: 12,
    color: theme.palette.actionPressed,
    fontWeight: '600',
  },
  geoSelectButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.palette.ground,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.strong,
    padding: 10,
    marginBottom: 8,
    minHeight: 42,
  },
  geoSelectTextCompact: {
    flex: 1,
    fontSize: 14,
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  geoSelectTextPlaceholder: {
    color: theme.palette.text.tertiary,
    fontWeight: '500',
  },
  clearButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.dangerTint,
    borderRadius: 8,
    padding: 6,
    marginTop: 4,
    gap: 4,
  },
  clearButtonTextCompact: {
    fontSize: 12,
    color: theme.palette.dangerText,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: theme.palette.text.secondary,
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
    backgroundColor: theme.palette.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.palette.text.primary,
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
    backgroundColor: theme.palette.action,
    marginRight: 12,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    color: theme.palette.text.tertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.palette.text.primary,
  },
  // mo'ljal — the landmark the passenger typed (T-018)
  landmarkText: {
    fontSize: 12,
    color: theme.palette.text.secondary,
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
    backgroundColor: theme.palette.borders.strong,
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
    backgroundColor: theme.palette.ground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: '45%',
  },
  infoTagText: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    fontWeight: '600',
    flex: 1,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.palette.surfaceSunken,
  },
  budgetBadge: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 11,
    color: theme.palette.text.tertiary,
    fontWeight: '600',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.palette.action,
  },
  budgetPerSeat: {
    fontSize: 11,
    color: theme.palette.text.tertiary,
    fontWeight: '600',
    marginTop: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.action,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  viewButtonText: {
    color: theme.palette.text.onAccent,
    fontSize: 14,
    fontWeight: '700',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.palette.ground,
    borderRadius: 10,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: theme.palette.text.secondary,
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
    backgroundColor: theme.palette.surfaceSunken,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.palette.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: theme.palette.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.palette.scrim.modal,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.palette.surface,
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
    borderBottomColor: theme.palette.surfaceSunken,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.palette.text.primary,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.palette.surfaceSunken,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 22,
    color: theme.palette.text.secondary,
    fontWeight: '600',
  },
  modalSearchBox: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.surfaceSunken,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.ground,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.strong,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  modalSearchIcon: {
    marginRight: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.palette.text.primary,
    paddingVertical: 0,
    fontWeight: '500',
  },
  modalSearchClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.palette.borders.strong,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalSearchClearText: {
    fontSize: 18,
    color: theme.palette.text.secondary,
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
    color: theme.palette.text.tertiary,
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
    borderBottomColor: theme.palette.ground,
  },
  modalItemSelected: {
    backgroundColor: theme.palette.successTint,
    borderLeftWidth: 4,
    borderLeftColor: theme.palette.action,
  },
  modalItemText: {
    fontSize: 16,
    color: theme.palette.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  modalItemTextSelected: {
    color: theme.palette.actionPressed,
    fontWeight: '700',
  },
  // Filter Modal Styles
  filterScrollView: {
    maxHeight: 500,
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.surfaceSunken,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.palette.text.primary,
    marginBottom: 16,
  },
  sortOptions: {
    gap: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: theme.palette.ground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.palette.borders.strong,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: theme.palette.successTint,
    borderColor: theme.palette.action,
  },
  sortOptionText: {
    flex: 1,
    fontSize: 15,
    color: theme.palette.text.secondary,
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: theme.palette.actionPressed,
    fontWeight: '700',
  },
  filterInputGroup: {
    marginBottom: 16,
  },
  filterInputLabel: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: theme.palette.ground,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.strong,
    padding: 12,
    fontSize: 15,
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    backgroundColor: theme.palette.dangerTint,
    borderRadius: 12,
    gap: 8,
  },
  clearFiltersText: {
    fontSize: 15,
    color: theme.palette.dangerText,
    fontWeight: '700',
  },
  filterFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.palette.borders.strong,
  },
  applyFiltersButton: {
    backgroundColor: theme.palette.action,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: theme.palette.text.onAccent,
    fontSize: 16,
    fontWeight: '700',
  },
});
