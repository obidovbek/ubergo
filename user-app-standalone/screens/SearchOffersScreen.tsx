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
  StatusBar,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { MainNavigationProp, SearchOffersParams } from '../navigation/types';
import { MenuButton } from '../components/MenuButton';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as OffersAPI from '../api/offers';
import * as GeoAPI from '../api/geo';
import type { GeoOption } from '../api/geo';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { formatNumberWithSpaces } from '../utils/format';
import { showToast } from '../utils/toast';
import { getErrorMessage } from '../utils/errorHandler';
import { GeoSheet, type GeoPath } from '../components/geo/GeoSheet';
import { AppModal } from '../components/AppModal';
import { theme } from '../themes';

const LAST_SEARCH_KEY = '@ubexgo:last_search';

/*
 * T-077/T-028 — the hand-off params (`SearchOffersParams`) live in
 * `navigation/types.ts`, beside the route that carries them, so the sender and
 * the receiver cannot drift apart. Whole `GeoOption` objects travel, not bare
 * ids: this screen keeps {id, name} per level and restores exactly that shape
 * from storage, so ids alone would force a re-fetch for names the caller had.
 */

export default function SearchOffersScreen() {
  const navigation = useNavigation<MainNavigationProp>();
  const route = useRoute();
  const handoff = (route.params ?? {}) as SearchOffersParams;
  const { token } = useAuth();
  // T-077: `currentLanguage` went with `formatDateTime` — the card now formats
  // its own date so the weekday can come from a translation key.
  const { t } = useTranslation();
  
  const [offers, setOffers] = useState<OffersAPI.DriverOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Geo selection states - From
  /*
   * T-101 — the geo cascade moved into `GeoSheet`.
   *
   * 🔴 This screen used to own 16 state hooks and ~112 lines re-implementing the
   * cascade: three option lists and three selections PER DIRECTION, plus the
   * "clear the child when the parent changes" rule written out twice. The same
   * logic existed in seven places across the two apps, which is why the pickers
   * had drifted apart on screen.
   *
   * `GeoSheet` owns the levels, the loading and the clearing. This screen keeps
   * only WHICH path is chosen for each direction.
   *
   * ⚠️ The `selected*` names below are DERIVED, not state, so the rest of this
   * file — the search request, the route card, the swap button — keeps reading
   * exactly what it read before. That is deliberate: replacing the picker should
   * not mean auditing 1 900 lines.
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
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating_desc' | 'date_asc'>('date_asc');

  useEffect(() => {
    const initialize = async () => {
      // T-101 — no pre-loading. `GeoSheet` fetches each level when it opens, so the
      // screen no longer holds option lists it might never show.

      /*
       * T-077 — a route handed over from the request the passenger just
       * posted WINS over the remembered last search.
       *
       * ⚠️ `loadLastSearch` must not also run: it would overwrite the handed-off
       * route with whatever was searched previously, and the passenger would
       * land on the wrong pair having done nothing wrong. The existing
       * auto-search effect then fires on its own once both provinces are set.
       */
      if (handoff.fromProvince && handoff.toProvince) {
        // T-101 — one assignment per direction now that a path is a single value.
        // `district` is this screen's "city": the level below viloyat (adm2).
        setFromPath({
          province: handoff.fromProvince,
          ...(handoff.fromCity ? { district: handoff.fromCity } : {}),
        });
        setToPath({
          province: handoff.toProvince,
          ...(handoff.toCity ? { district: handoff.toCity } : {}),
        });
        return;
      }

      await loadLastSearch();
    };
    initialize();
    /*
     * Mount-only, deliberately. `handoff` is rebuilt from `route.params` on
     * every render, so listing it here would re-run this effect for ever.
     * ESLint's exhaustive-deps warning on this line is expected and is the
     * reason the file sits one warning above its baseline.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (!savedData) return;
      const searchData = JSON.parse(savedData);

      /*
       * T-101 — this used to reload every option list before restoring a selection,
       * because the old picker could only show a list it had already fetched. It
       * even slept 300ms first, hoping the countries had arrived.
       *
       * `GeoSheet` fetches what it needs when it opens, so a restored path is just
       * a value. The sleep and the six loader calls are gone with it.
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
  /*
   * T-101 — swapping two paths is one exchange.
   *
   * 🔴 This used to be ~40 lines: six `setSelected*` calls, then clearing and
   * RE-FETCHING both provinces and cities for the new direction, because the old
   * picker could only display lists it had already loaded. None of that is needed
   * when the sheet loads on open.
   */
  const swapLocations = () => {
    setFromPath(toPath);
    setToPath(fromPath);
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

  const handleJoinOffer = (offer: OffersAPI.DriverOffer) => {
    if (!token) {
      showToast.error(t('offerDetails.loginRequired'), t('offerDetails.loginRequiredMessage'));
      return;
    }
    navigation.navigate('OfferDetails', { offerId: offer.id });
  };

  /*
   * ── T-077: the offer card, to the K_RegShablon mockup ──────────────────
   *
   * Dates and times are formatted BY HAND, weekday names coming from a
   * translation key. `TimeWindowCard` already does it this way for the same
   * reason: Android/Hermes locale data is not something to rely on.
   */
  const pad2 = (n: number): string => String(n).padStart(2, '0');

  /** "22:00" */
  const cardTime = (iso: string): string => {
    const d = new Date(iso);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  /** "25.08.2025 Dushanba" */
  const cardDate = (iso: string): string => {
    const d = new Date(iso);
    const date = `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
    const weekday = t('searchOffers.weekdays').split(',')[d.getDay()] ?? '';
    return weekday ? `${date} ${weekday}` : date;
  };

  const FUEL_KEYS: Record<string, string> = {
    benzine: 'fuelBenzine',
    metan: 'fuelMetan',
    propan: 'fuelPropan',
    electric: 'fuelElectric',
    diesel: 'fuelDiesel',
  };

  /**
   * "Propan", or "Benzin · Propan" when the car runs on two.
   *
   * ⚠️ Returns `null` — never '' — so the caller omits the line entirely rather
   * than drawing an empty row. A driver need not have recorded a fuel, and
   * offers cached before T-077 shipped carry no such key at all.
   * ⚠️ An unknown value falls through as itself rather than vanishing, so a new
   * fuel added server-side is visible instead of silently blank.
   */
  const fuelLabel = (fuels?: string[] | null): string | null => {
    if (!Array.isArray(fuels) || fuels.length === 0) return null;
    const labels = fuels
      .filter((f) => typeof f === 'string' && f.length > 0)
      .map((f) => (FUEL_KEYS[f] ? t(`searchOffers.${FUEL_KEYS[f]}`) : f));
    return labels.length > 0 ? labels.join(' · ') : null;
  };

  /**
   * A usable price, or `null`.
   *
   * 🔴 pg returns DECIMAL as a **string** (`'150000.00'`) — the 2026-08-02 root
   * cause — so this must not assume a number. `front_price_per_seat` is also
   * genuinely optional: an offer with no front price must render a dead block,
   * never "undefined so'm".
   */
  const priceOf = (raw: unknown): number | null => {
    if (raw === null || raw === undefined || raw === '') return null;
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  /**
   * T-083 — is this seat actually bookable?
   *
   * 🔴 T-077 greyed a price when NO PRICE WAS SET. The mockup greys it when
   * THE SEAT IS TAKEN — provable from its own cards: Nexia `[1 free]` shows
   * *Oldi* green and *Orqa* grey; Malibu `[2 free]` shows the reverse.
   *
   * ⚠️ Three states, not two, and they must not be collapsed:
   *   - no price      → the seat was never for sale        → hidden price, dead
   *   - price, taken  → someone holds it                   → dead
   *   - price, free   → bookable                           → live
   * Telling a passenger a seat is "taken" when it was never offered is a
   * different (and worse) lie than the bug being fixed.
   *
   * ⚠️ An API older than T-083 sends none of these fields. `undefined` then
   * means "unknown", and unknown must read as AVAILABLE — greying every seat on
   * a stale response would empty the whole screen.
   */
  const seatOpen = (available: boolean | undefined, freeCount?: number): boolean => {
    if (available !== undefined) return available;
    if (freeCount !== undefined) return freeCount > 0;
    return true;
  };

  /**
   * The offer card, to the `K_RegShablon` mockup (T-077).
   *
   * ⚠️ The route (from → to) is deliberately NOT drawn per card any more. The
   * search requires both provinces before it runs, so every result shares one
   * route — it belongs in the header once, as the mockup has it, not repeated
   * on every row.
   *
   * ⚠️ Deliberately NOT a pixel match: the mockup's class chips, ⚡ flash and
   * seat-position squares are all absent because no data backs them (owner
   * decisions, 2026-08-13).
   */
  const renderOffer = ({ item }: { item: OffersAPI.DriverOffer }) => {
    const front = priceOf(item.front_price_per_seat);
    const back = priceOf(item.price_per_seat);
    /*
      T-083 — a block is LIVE only when the seat has a price AND is still free.
      `front`/`back` alone answer "is it for sale", not "can I have it".
    */
    const frontLive = !!front && seatOpen(item.front_seat_available);
    const backLive = !!back && seatOpen(undefined, item.back_seats_free);
    const fuel = fuelLabel(item.vehicle?.fuel_types);
    const carName =
      [item.vehicle?.make, item.vehicle?.model].filter(Boolean).join(' ') ||
      t('searchOffers.vehicleUnknown');

    return (
      <TouchableOpacity
        style={styles.offerCard}
        onPress={() => handleJoinOffer(item)}
        activeOpacity={0.95}
      >
        {/* Car + fuel · departure · free seats */}
        <View style={styles.cardTop}>
          <View style={styles.cardCar}>
            <Text style={styles.cardCarName} numberOfLines={1}>
              {carName}
            </Text>
            {!!fuel && (
              <Text style={styles.cardFuel} numberOfLines={1}>
                {fuel}
              </Text>
            )}
          </View>

          <View style={styles.cardWhen}>
            <Text style={styles.cardTimeText} numberOfLines={1}>
              {cardTime(item.start_at)} {t('searchOffers.departAt')}
            </Text>
            <Text style={styles.cardDateText} numberOfLines={1}>
              {cardDate(item.start_at)}
            </Text>
          </View>

          <View style={styles.cardSeats}>
            <Text style={styles.cardSeatsText}>{item.seats_free}</Text>
          </View>
        </View>

        {/*
          Oldi / Orqa. A price that does not exist renders as a visibly DEAD
          grey block — never "undefined so'm", and never simply missing, which
          would leave the driver's two prices silently misaligned.
        */}
        <View style={styles.cardPrices}>
          <View style={[styles.priceBlock, !frontLive && styles.priceBlockDead]}>
            <Text
              style={[
                styles.priceBlockLabel,
                !frontLive && styles.priceBlockTextDead,
              ]}
            >
              {t('searchOffers.priceFront')}
            </Text>
            <Text
              style={[
                styles.priceBlockValue,
                !frontLive && styles.priceBlockTextDead,
              ]}
              numberOfLines={1}
            >
              {front
                ? `${formatNumberWithSpaces(front)} ${item.currency}`
                : t('searchOffers.priceNone')}
            </Text>
          </View>

          <View style={[styles.priceBlock, !backLive && styles.priceBlockDead]}>
            <Text
              style={[
                styles.priceBlockLabel,
                !backLive && styles.priceBlockTextDead,
              ]}
            >
              {t('searchOffers.priceBack')}
            </Text>
            <Text
              style={[
                styles.priceBlockValue,
                !backLive && styles.priceBlockTextDead,
              ]}
              numberOfLines={1}
            >
              {back
                ? `${formatNumberWithSpaces(back)} ${item.currency}`
                : t('searchOffers.priceNone')}
            </Text>
          </View>

          <Ionicons
            name="information-circle-outline"
            size={24}
            color={theme.palette.text.tertiary}
            style={styles.cardInfoIcon}
          />
        </View>

        {!!item.note && (
          <View style={styles.noteContainer}>
            <Ionicons name="chatbubble-outline" size={12} color={theme.palette.text.secondary} />
            <Text style={styles.noteText} numberOfLines={2}>
              {item.note}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * The route picker, rendered as the results list's header (T-066).
   *
   * 🔴 It used to be a `<ScrollView maxHeight: 270>` sitting as a SIBLING of the
   * `FlatList` — two independent scroll surfaces. The card could therefore never
   * scroll away and ate ~270px of every screen for ever, and because it shares
   * the offer cards' white / radius-20 / shadow styling the two read as one
   * continuous sheet exactly at the boundary. That is the "merging" the owner
   * reported on 2026-08-12.
   *
   * Making it `ListHeaderComponent` gives the screen ONE scroll surface, so the
   * picker slides up out of the way and the results get the whole screen.
   *
   * ⚠️ Identical to the fix T-042 ② made in the driver app's
   * `SearchPassengerOffersScreen` on 2026-08-10 — that sweep stopped at the app
   * where the bug was observed and never reached this one.
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
              <Text style={styles.sectionLabel}>{t('searchOffers.from')}</Text>
            </View>

            {/*
              T-101 — ONE button per direction, replacing three (country, province,
              city) plus a clear button. The sheet walks the levels itself, so the
              screen shows the CHOSEN PATH rather than one control per level.
            */}
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
                  .join(', ') || t('searchOffers.selectProvince')}
              </Text>
              <Ionicons name="chevron-down" size={18} color={theme.palette.text.tertiary} />
            </TouchableOpacity>

            {!!fromPath.province && (
              <TouchableOpacity
                style={styles.clearButtonCompact}
                onPress={() => setFromPath({})}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={16} color={theme.palette.danger} />
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
                color={selectedFromProvince && selectedToProvince ? theme.palette.action : theme.palette.text.disabled}
              />
            </TouchableOpacity>
          </View>

          {/* To Location Section */}
          <View style={styles.locationColumn}>
            <View style={styles.locationHeader}>
              <View style={[styles.locationDot, { backgroundColor: theme.palette.male }]} />
              <Text style={styles.sectionLabel}>{t('searchOffers.to')}</Text>
            </View>

            {/*
              T-101 — ONE button per direction, replacing three (country, province,
              city) plus a clear button. The sheet walks the levels itself, so the
              screen shows the CHOSEN PATH rather than one control per level.
            */}
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
                  .join(', ') || t('searchOffers.selectProvince')}
              </Text>
              <Ionicons name="chevron-down" size={18} color={theme.palette.text.tertiary} />
            </TouchableOpacity>

            {!!toPath.province && (
              <TouchableOpacity
                style={styles.clearButtonCompact}
                onPress={() => setToPath({})}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={16} color={theme.palette.danger} />
                <Text style={styles.clearButtonTextCompact}>{t('searchOffers.clear')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* A labelled seam, so the picker and the results can never read as one
          continuous sheet again. Only meaningful once there are results. */}
      {offers.length > 0 && (
        <View style={styles.resultsSeam}>
          <Text style={styles.resultsCount}>
            {t('searchOffers.resultsCount').replace('{count}', String(offers.length))}
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
        <MenuButton />
        <Text style={styles.headerTitle}>{t('searchOffers.title')}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="options" size={24} color={theme.palette.text.primary} />
          {(minRating > 0 || maxPrice || minPrice || sortBy !== 'date_asc') && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.palette.action} />
          <Text style={styles.loadingText}>{t('searchOffers.loadingOffers')}</Text>
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
                  <Text style={styles.emptyText}>{t('searchOffers.selectLocations')}</Text>
                  <Text style={styles.emptySubtext}>
                    {t('searchOffers.selectLocationsMessage')}
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="car-outline" size={48} color={theme.palette.text.disabled} />
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
      <AppModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        title={t('searchOffers.filter')}
        actions={[
          {
            label: t('searchOffers.applyFilters'),
            onPress: () => setFilterModalVisible(false),
          },
        ]}
      >
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
                        color={minRating === rating ? theme.palette.warnBorder : theme.palette.text.disabled} 
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
                <Ionicons name="refresh" size={20} color={theme.palette.danger} />
                <Text style={styles.clearFiltersText}>{t('searchOffers.clearAllFilters')}</Text>
              </TouchableOpacity>
        </ScrollView>
      </AppModal>

      {/* Geo Selection Modal */}
      {/*
        T-101 — ONE sheet that owns the whole cascade.

        It replaces `GeoSelectModal` plus the three helpers that fed it
        (`openGeoModal`, `getGeoOptions`, `isGeoSelected`), six loader functions and
        16 state hooks. The sheet fetches each level itself and hands back the full
        path, so this screen only records which path belongs to which direction.
      */}
      <GeoSheet
        visible={geoSheet !== null}
        title={geoSheet === 'from' ? t('searchOffers.from') : t('searchOffers.to')}
        initialPath={geoSheet === 'from' ? fromPath : toPath}
        // The search sends `*_province_id` and `*_city_id`, so district (adm2) is as
        // deep as this screen needs. The order screen goes to adm3.
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
    color: theme.palette.text.primary,
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.palette.surface,
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
    backgroundColor: theme.palette.danger,
  },
  searchContainer: {
    backgroundColor: theme.palette.surface,
    borderRadius: 20,
    marginBottom: 16,
    marginTop: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    // T-066 — a deliberately stronger shadow than the offer cards below it
    // (0.06 / radius 8). The picker now scrolls in the same surface as the
    // results, so it has to read as sitting ABOVE them rather than as the first
    // card in the list; matching their elevation is what made the two merge.
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  // T-066 — the labelled break between the picker and the results. Without it
  // the two white/rounded/shadowed surfaces read as one continuous sheet, which
  // is the "merging" the owner reported.
  resultsSeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
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
    color: theme.palette.danger,
    fontWeight: '700',
  },
  selectedLocationCard: {
    backgroundColor: theme.palette.successTint,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.palette.action,
  },
  selectedLocationLabel: {
    fontSize: 10,
    color: theme.palette.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  selectedLocationText: {
    fontSize: 13,
    color: theme.palette.text.primary,
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
    color: theme.palette.text.secondary,
    fontSize: 15,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    // T-066 — the list now owns everything below the app header, so an empty
    // result set must still be able to centre itself in that space.
    flexGrow: 1,
  },
  offerCard: {
    backgroundColor: theme.palette.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  /* ── T-077: the offer card, to the K_RegShablon mockup ────────────────── */
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardCar: {
    flex: 1,
    minWidth: 0,
  },
  cardCarName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.palette.text.primary,
  },
  cardFuel: {
    marginTop: 2,
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  cardWhen: {
    // `flex: 1` on both columns rather than a fixed width: the Russian
    // weekday names ("Понедельник") are far longer than the Uzbek ones and
    // would otherwise be clipped.
    flex: 1.2,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  cardTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.palette.text.primary,
  },
  cardDateText: {
    marginTop: 2,
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  cardSeats: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.palette.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSeatsText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.palette.text.primary,
  },
  cardPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  priceBlock: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: theme.palette.brand,
    alignItems: 'center',
  },
  /** No such price on this offer — present but plainly inactive. */
  priceBlockDead: {
    backgroundColor: theme.palette.borders.strong,
  },
  priceBlockLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.palette.surface,
  },
  priceBlockValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: theme.palette.surface,
  },
  priceBlockTextDead: {
    color: theme.palette.text.tertiary,
  },
  cardInfoIcon: {
    marginLeft: 2,
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
  ratingTag: {
    backgroundColor: theme.palette.warnTint,
    borderWidth: 1,
    borderColor: theme.palette.warnBorder,
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
    color: theme.palette.warnInk,
    fontWeight: '700',
    marginLeft: 4,
  },
  ratingCountText: {
    fontSize: 11,
    color: theme.palette.warnInk,
    fontWeight: '600',
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.palette.surfaceSunken,
  },
  seatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.palette.successTint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  seatsText: {
    fontSize: 13,
    color: theme.palette.actionPressed,
    fontWeight: '700',
  },
  priceBadge: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.palette.action,
  },
  priceLabel: {
    fontSize: 11,
    color: theme.palette.text.tertiary,
    fontWeight: '600',
    marginTop: 2,
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
    // T-066 — the empty state now renders BELOW the picker inside the SAME
    // list, so it centres in the leftover space rather than the whole screen.
    // `flex: 1` + `paddingTop: 80` were sized for when this filled a bare
    // sibling container; kept as-is they push the empty state off the bottom of
    // small phones — exactly what happened in the driver app during T-042 ②.
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: theme.palette.ground,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.palette.borders.strong,
    gap: 6,
  },
  ratingOptionActive: {
    backgroundColor: theme.palette.warnTint,
    borderColor: theme.palette.warnBorder,
  },
  ratingOptionText: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    fontWeight: '600',
  },
  ratingOptionTextActive: {
    color: theme.palette.warnInk,
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
    color: theme.palette.text.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceInput: {
    backgroundColor: theme.palette.ground,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.strong,
    padding: 12,
    fontSize: 15,
    color: theme.palette.text.primary,
    fontWeight: '600',
  },
  priceInputSeparator: {
    fontSize: 18,
    color: theme.palette.text.tertiary,
    fontWeight: '700',
    paddingTop: 20,
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
    color: theme.palette.danger,
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
    color: theme.palette.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});

