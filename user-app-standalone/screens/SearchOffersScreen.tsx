/**
 * SearchOffersScreen — T-101 step 14b-4. `UserQidiruv.dc.html`.
 *
 * ONE screen with two modes, as the artboard draws it (`state.mode`, line 722):
 *   • **Qidiruv** — driver offers matching a from/to pair. This screen's original job.
 *   • **Takliflar** — the drivers who have bid on the passenger's OWN requests.
 *
 * 🔴 WHY THIS EXISTS AT ALL. Step 7 was titled "`SearchOffersScreen` -> `UserQidiruv`" and
 * ticked, but its body says plainly that it swapped colour VALUES and touched no layout. The
 * screen therefore kept its pre-T-101 header and none of the shared chrome for six weeks,
 * until the owner said so on 2026-09-12. Two other places in `PLAN.md` had already written
 * down that this screen needed a step of its own; the tick outvoted them.
 *
 * 🔴 THE TAKLIFLAR MODE IS A LIST, NOT THE WHOLE OF `OfferDriversScreen`. Decision ① approved
 * merging that screen in, and the LIST half is merged here. **Accepting a driver is not.**
 * Server-side, `confirmDriver` also rejects every other pending driver and pushes each of
 * them, so one tap permanently declines several strangers. That flow keeps its own screen,
 * with its own count-naming confirm dialog, and a row here navigates to it. The artboard
 * agrees: its accept lives in the detail sheet, not on the list row.
 *
 * 🔴 AND A BID IS NOT A DRIVER OFFER. `OfferDriver` carries its own driver and vehicle and has
 * no `DriverOffer` behind it — the driver is answering a request, not publishing a ride. The
 * card takes a discriminated union for exactly this reason (14b-2).
 *
 * 🔴 CARRIED-OVER BEHAVIOUR — a rewrite is where these go missing, so they are listed and the
 * diff was grepped for each:
 *   T-028  `SearchOffersParams` is typed on the route; no `as any` navigation.
 *   T-077  the hand-off route from a just-posted request WINS over the remembered search, and
 *          `loadLastSearch` must NOT also run or it overwrites the hand-off.
 *   T-083  a price block is dead unless the seat is BOTH priced and free — now in
 *          `seatAvailability`, which also keeps "never offered" distinct from "taken".
 *   T-101  the geo cascade lives in `GeoSheet`; this screen keeps only the chosen path, and
 *          the saved-search JSON keeps its 2026-08 shape so old saves still restore.
 *   7d     whole `GeoOption` objects travel, not bare ids.
 *
 * ⚠️ `SafeAreaView` is safe-area-context's, with the top edge left to `TopBar` — the double
 * inset step 8 caught.
 *
 * What is NOT here, on purpose (`PLAN-T101-step14b.md` §2 → T-112): the presence dot and
 * "seen" line, years of experience, trip count, per-seat gender, the colour swatch, the
 * driver-side `Hoziroq` tag, and the reviews list (no passenger-facing endpoint for comments).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MainNavigationProp, SearchOffersParams } from '../navigation/types';
import * as OffersAPI from '../api/offers';
import * as PassengerOffersAPI from '../api/passengerOffers';
import type { OfferDriver } from '../api/passengerOffers';
import { getDriverRatingSummary, type DriverRatingSummary } from '../api/ratings';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { getErrorMessage } from '../utils/errorHandler';
import { subscribePushReceived } from '../utils/pushEvents';
import { GeoSheet, type GeoPath } from '../components/geo/GeoSheet';
import { TopBar } from '../components/chrome/TopBar';
import { NavDrawer } from '../components/chrome/NavDrawer';
import { SegmentedModes } from '../components/chrome/SegmentedModes';
import { OfferResultCard } from '../components/search/OfferResultCard';
import { DriverBlock, RatingBreakdownSheet } from '../components/search/DriverBlock';
import {
  ALL_CLASSES,
  classCounts,
  filterByClass,
  LIST_TITLE_KEY,
  MODE_LABEL_KEY,
  MODES,
  nextSortState,
  serverSortFor,
  sortOffers,
  type SearchMode,
  type SortKey,
  type SortState,
} from '../utils/offerSearch';
import { theme } from '../themes';

/** ⚠️ The 2026-08 key and JSON shape, unchanged — an old save must still restore. */
const LAST_SEARCH_KEY = '@ubexgo:last_search';

/** The classes the artboard offers, as the server spells them (`DriverOfferVehicleClass`). */
const CLASSES = ['standard', 'comfort', 'business', 'econom', 'tourist'] as const;

const SORTS: readonly SortKey[] = ['match', 'price', 'seats', 'soon'];
const SORT_LABEL_KEY: Record<SortKey, string> = {
  match: 'searchOffers.sortMatch',
  price: 'searchOffers.sortPrice',
  seats: 'searchOffers.sortSeats',
  soon: 'searchOffers.sortSoon',
};

const pad2 = (n: number): string => String(n).padStart(2, '0');

export default function SearchOffersScreen() {
  const navigation = useNavigation<MainNavigationProp>();
  const route = useRoute();
  const handoff = (route.params ?? {}) as SearchOffersParams;
  const { token } = useAuth();
  const { t } = useTranslation();

  const [mode, setMode] = useState<SearchMode>('qidiruv');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [offers, setOffers] = useState<OffersAPI.DriverOffer[]>([]);
  const [bids, setBids] = useState<OfferDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [fromPath, setFromPath] = useState<GeoPath>({});
  const [toPath, setToPath] = useState<GeoPath>({});
  const [geoSheet, setGeoSheet] = useState<'from' | 'to' | null>(null);

  const [cls, setCls] = useState<string>(ALL_CLASSES);
  const [sort, setSort] = useState<SortState>({ key: 'match', priceDesc: false, seatsAsc: false });

  const [ratingFor, setRatingFor] = useState<OffersAPI.DriverOffer | null>(null);
  const [ratingSummary, setRatingSummary] = useState<DriverRatingSummary | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  /* ⚠️ DERIVED, not state — the rest of this file reads exactly what it read before. */
  const selectedFromCountry = fromPath.country ?? null;
  const selectedFromProvince = fromPath.province ?? null;
  const selectedFromCity = fromPath.district ?? null;
  const selectedToCountry = toPath.country ?? null;
  const selectedToProvince = toPath.province ?? null;
  const selectedToCity = toPath.district ?? null;

  // ---------------------------------------------------------------- saved search

  const saveLastSearch = useCallback(async () => {
    try {
      if (!selectedFromProvince || !selectedToProvince) return;
      // ⚠️ The 2026-08 shape, field for field. Renaming a key orphans every old save.
      await AsyncStorage.setItem(
        LAST_SEARCH_KEY,
        JSON.stringify({
          fromCountry: selectedFromCountry,
          fromProvince: selectedFromProvince,
          fromCity: selectedFromCity,
          toCountry: selectedToCountry,
          toProvince: selectedToProvince,
          toCity: selectedToCity,
        }),
      );
    } catch (error) {
      console.error('Failed to save last search:', error);
    }
  }, [
    selectedFromCountry,
    selectedFromProvince,
    selectedFromCity,
    selectedToCountry,
    selectedToProvince,
    selectedToCity,
  ]);

  const loadLastSearch = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(LAST_SEARCH_KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      setFromPath({
        ...(d.fromCountry ? { country: d.fromCountry } : {}),
        ...(d.fromProvince ? { province: d.fromProvince } : {}),
        ...(d.fromCity ? { district: d.fromCity } : {}),
      });
      setToPath({
        ...(d.toCountry ? { country: d.toCountry } : {}),
        ...(d.toProvince ? { province: d.toProvince } : {}),
        ...(d.toCity ? { district: d.toCity } : {}),
      });
    } catch (error) {
      console.error('Failed to load last search:', error);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      /*
       * T-077 — a route handed over from the request the passenger just posted WINS.
       * ⚠️ `loadLastSearch` must NOT also run, or it overwrites the hand-off and the
       * passenger lands on the wrong pair having done nothing wrong.
       */
      if (handoff.fromProvince && handoff.toProvince) {
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
     * Mount-only, deliberately. `handoff` is rebuilt from `route.params` on every render, so
     * listing it would re-run this for ever. This is the one expected exhaustive-deps warning.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedFromProvince || !selectedToProvince) return;
    const timer = setTimeout(() => {
      saveLastSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedFromProvince, selectedFromCity, selectedToProvince, selectedToCity, saveLastSearch]);

  // ---------------------------------------------------------------- loading

  const loadOffers = useCallback(
    async (silent = false) => {
      if (!selectedFromProvince || !selectedToProvince) {
        setOffers([]);
        return;
      }
      try {
        if (!silent) setLoading(true);
        const result = await OffersAPI.searchOffers({
          from_province_id: selectedFromProvince.id,
          from_city_id: selectedFromCity?.id,
          to_province_id: selectedToProvince.id,
          to_city_id: selectedToCity?.id,
          // ⚠️ `match` and `seats` have no server twin; `serverSortFor` returns undefined
          // rather than quietly substituting one, and the ordering happens client-side.
          sort_by: serverSortFor(sort),
          limit: 20,
        });
        setOffers(result.items);
      } catch (error) {
        if (silent) return;
        showToast.error(t('common.error'), getErrorMessage(error, t, 'errors.loadFailed'));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedFromProvince, selectedFromCity, selectedToProvince, selectedToCity, sort, t],
  );

  /**
   * Every bid across the passenger's own requests, from ONE call: `getUserOffers` embeds
   * `drivers` (`PassengerOfferService:848`), so no per-order fan-out is needed.
   */
  const loadBids = useCallback(
    async (silent = false) => {
      if (!token) return;
      try {
        if (!silent) setLoading(true);
        const mine = await PassengerOffersAPI.getMyPassengerOffers();
        setBids(mine.flatMap((o) => o.drivers ?? []));
      } catch (error) {
        if (silent) return;
        showToast.error(t('common.error'), getErrorMessage(error, t, 'errors.loadFailed'));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token, t],
  );

  useEffect(() => {
    if (mode === 'qidiruv') loadOffers();
    else loadBids();
  }, [mode, loadOffers, loadBids]);

  // A bid landing while the list is open should appear without a manual pull.
  useEffect(
    () => subscribePushReceived(() => loadBids(true), ['driver_join_request']),
    [loadBids],
  );

  useFocusEffect(
    useCallback(() => {
      if (mode === 'takliflar') loadBids(true);
    }, [mode, loadBids]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (mode === 'qidiruv') await loadOffers(true);
    else await loadBids(true);
    setRefreshing(false);
  }, [mode, loadOffers, loadBids]);

  // ---------------------------------------------------------------- actions

  const swapLocations = () => {
    setFromPath(toPath);
    setToPath(fromPath);
  };

  const handleOpenOffer = (offer: OffersAPI.DriverOffer) => {
    if (!token) {
      showToast.error(t('offerDetails.loginRequired'), t('offerDetails.loginRequiredMessage'));
      return;
    }
    navigation.navigate('OfferDetails', { offerId: offer.id });
  };

  /*
   * 🔴 A row goes to `OfferDrivers`, it does NOT accept inline. `confirmDriver` also rejects
   * every other pending driver and pushes them, so the confirm dialog that names the count
   * stays where it is.
   */
  const handleOpenBid = (bid: OfferDriver) => {
    navigation.navigate('OfferDrivers', { offerId: bid.offer_id });
  };

  const openRating = async (offer: OffersAPI.DriverOffer) => {
    const driverId = offer.driver?.id;
    setRatingFor(offer);
    setRatingSummary(null);
    if (!driverId) return;
    setRatingLoading(true);
    try {
      setRatingSummary(await getDriverRatingSummary(driverId, token));
    } catch {
      // A missing breakdown is not worth a toast over the sheet; it shows "not rated yet".
      setRatingSummary(null);
    } finally {
      setRatingLoading(false);
    }
  };

  // ---------------------------------------------------------------- derived list

  const seatFiltered = offers;
  const counts = useMemo(() => classCounts(seatFiltered, CLASSES), [seatFiltered]);
  const visibleOffers = useMemo(
    () => sortOffers(filterByClass(seatFiltered, cls), sort),
    [seatFiltered, cls, sort],
  );

  /*
   * T-077 — dates and times are formatted BY HAND with the weekday from a translation key.
   * Android/Hermes locale data is not something to rely on; `TimeWindowCard` does the same.
   */
  const cardTime = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };
  const cardDate = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const date = `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
    const weekday = t('searchOffers.weekdays').split(',')[d.getDay()] ?? '';
    return weekday ? `${date} ${weekday}` : date;
  };

  const needsRoute = mode === 'qidiruv' && (!selectedFromProvince || !selectedToProvince);

  // ---------------------------------------------------------------- render

  const header = (
    <View style={styles.head}>
      {mode === 'qidiruv' && (
        <>
          <View style={styles.routeRow}>
            <Pressable style={styles.routeCell} onPress={() => setGeoSheet('from')}>
              <Text style={styles.routeLabel}>{t('searchOffers.fromLabel')}</Text>
              <Text style={styles.routeValue} numberOfLines={1}>
                {selectedFromCity?.name || selectedFromProvince?.name || t('searchOffers.from')}
              </Text>
            </Pressable>
            <Pressable
              style={styles.swap}
              onPress={swapLocations}
              accessibilityRole="button"
              accessibilityLabel={t('searchOffers.swap')}
            >
              <Text style={styles.swapGlyph}>⇄</Text>
            </Pressable>
            <Pressable style={styles.routeCell} onPress={() => setGeoSheet('to')}>
              <Text style={styles.routeLabel}>{t('searchOffers.toLabel')}</Text>
              <Text style={styles.routeValue} numberOfLines={1}>
                {selectedToCity?.name || selectedToProvince?.name || t('searchOffers.to')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.chipRow}>
            {[ALL_CLASSES, ...CLASSES].map((c) => {
              const on = cls === c;
              const n = counts[c] ?? 0;
              return (
                <Pressable
                  key={c}
                  style={[styles.classChip, on && styles.classChipOn, !n && !on && styles.classChipEmpty]}
                  onPress={() => setCls(c)}
                >
                  <Text style={[styles.classChipLabel, on && styles.classChipLabelOn]}>
                    {c === ALL_CLASSES ? t('common.all') : c}
                  </Text>
                  <Text style={[styles.classChipCount, on && styles.classChipLabelOn]}>{String(n)}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sortRow}>
            {SORTS.map((k) => {
              const on = sort.key === k;
              const arrow =
                k === 'price' ? (on && sort.priceDesc ? '↓' : '↑')
                  : k === 'seats' ? (on && sort.seatsAsc ? '↑' : '↓')
                    : k === 'match' ? '★' : '⏱';
              return (
                <Pressable
                  key={k}
                  style={[styles.sortChip, on && styles.sortChipOn]}
                  onPress={() => setSort(nextSortState(sort, k))}
                >
                  <Text style={[styles.sortLabel, on && styles.sortLabelOn]} numberOfLines={1}>
                    {`${arrow} ${t(SORT_LABEL_KEY[k])}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <Text style={styles.listTitle}>{t(LIST_TITLE_KEY[mode])}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.palette.ground} />
      {/*
        🔴 NO `onBackPress`. `SearchOffers` is a TAB (`MainTabs`), and `TopBar` renders the back
        arrow INSTEAD OF the hamburger when both are passed — so a back arrow here would make
        the drawer unreachable. The first version of this screen passed both. Same rule as
        step 17h on the driver side, and `ProfileScreen` is the pattern.
      */}
      <TopBar
        background="flat"
        title={t('searchOffers.title')}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <SegmentedModes
        modes={MODES.map((m) => ({
          key: m,
          label: t(MODE_LABEL_KEY[m]),
          count: m === 'qidiruv' ? offers.length : bids.length,
        }))}
        value={mode}
        onChange={setMode}
      />

      {loading && !refreshing ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.palette.action} />
          <Text style={styles.loadingText}>{t('searchOffers.loadingOffers')}</Text>
        </View>
      ) : mode === 'qidiruv' ? (
        <FlatList
          data={visibleOffers}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.rowBlock}>
              <OfferResultCard
                mode="offer"
                offer={item}
                departText={cardTime(item.start_at)}
                dateText={cardDate(item.start_at)}
                onPress={() => handleOpenOffer(item)}
              />
              <DriverBlock offer={item} onOpenBreakdown={() => openRating(item)} />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {needsRoute ? t('searchOffers.selectLocations') : t('searchOffers.noRidesAvailable')}
              </Text>
              <Text style={styles.emptyBody}>
                {needsRoute
                  ? t('searchOffers.selectLocationsMessage')
                  : t('searchOffers.noRidesMessage')}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={bids}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <OfferResultCard
              mode="bid"
              bid={item}
              departText={cardTime(item.created_at)}
              dateText={cardDate(item.created_at)}
              onPress={() => handleOpenBid(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t('offerDrivers.emptyTitle')}</Text>
              <Text style={styles.emptyBody}>{t('offerDrivers.emptyMessage')}</Text>
            </View>
          }
        />
      )}

      <GeoSheet
        visible={geoSheet !== null}
        title={geoSheet === 'from' ? t('searchOffers.from') : t('searchOffers.to')}
        initialPath={geoSheet === 'from' ? fromPath : toPath}
        onDone={(path) => {
          if (geoSheet === 'from') setFromPath(path);
          else setToPath(path);
          setGeoSheet(null);
        }}
        onClose={() => setGeoSheet(null)}
      />

      <RatingBreakdownSheet
        visible={ratingFor !== null}
        driverName={ratingFor?.driver?.name || t('offerDrivers.unknownDriver')}
        summary={ratingSummary}
        loading={ratingLoading}
        onClose={() => setRatingFor(null)}
      />

      <NavDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.palette.ground },

  head: { gap: 10, paddingBottom: 8 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeCell: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.field,
    backgroundColor: theme.palette.surface,
    borderWidth: 1,
    borderColor: theme.palette.borders.control,
  },
  routeLabel: {
    fontSize: 10,
    ...theme.font('mono', 700),
    letterSpacing: 1,
    color: theme.palette.text.tertiary,
  },
  routeValue: { fontSize: 13.5, ...theme.font('sans', 700), color: theme.palette.text.primary },
  swap: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.surface,
    borderWidth: 1,
    borderColor: theme.palette.borders.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapGlyph: { fontSize: 16, ...theme.font('sans', 700), color: theme.palette.text.primary },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.surfaceSunken,
    borderWidth: 1,
    borderColor: theme.palette.borders.strong,
  },
  classChipOn: { backgroundColor: theme.palette.surface, borderColor: theme.palette.brand },
  classChipEmpty: { backgroundColor: theme.palette.surfaceTrack },
  classChipLabel: { fontSize: 11.5, ...theme.font('sans', 600), color: theme.palette.text.muted },
  classChipLabelOn: { color: theme.palette.text.primary, ...theme.font('sans', 800) },
  classChipCount: { fontSize: 10.5, ...theme.font('mono', 700), color: theme.palette.text.tertiary },

  sortRow: { flexDirection: 'row', gap: 6 },
  sortChip: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.palette.surfaceSunken,
  },
  sortChipOn: { backgroundColor: theme.palette.text.primary },
  sortLabel: { fontSize: 10.5, ...theme.font('sans', 700), color: theme.palette.text.muted },
  sortLabelOn: { color: theme.palette.text.onDark },

  listTitle: {
    fontSize: 10,
    ...theme.font('mono', 700),
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.palette.text.tertiary,
    paddingTop: 2,
  },

  list: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 16, gap: 10 },
  rowBlock: { gap: 6 },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, ...theme.font('sans', 600), color: theme.palette.text.muted },

  empty: {
    backgroundColor: theme.palette.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.palette.borders.emphasis,
    borderRadius: theme.borderRadius.card,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 14,
    ...theme.font('sans', 800),
    color: theme.palette.text.primary,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 12.5,
    ...theme.font('sans', 500),
    color: theme.palette.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
