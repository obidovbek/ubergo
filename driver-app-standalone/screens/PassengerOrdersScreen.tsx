/**
 * PassengerOrdersScreen — T-101 step 17d. `DriverQidiruv.dc.html`.
 *
 * ONE screen with two modes, replacing three:
 *   • `SearchPassengerOffersScreen` — the INCOMING mode: passengers' orders this driver has
 *     not answered, minus every order they already have a request on (any status — rejected
 *     and cancelled are terminal server-side, so those belong in the other mode with a pill);
 *   • `MyJoinRequestsScreen` — the SENT mode: the driver's own proposals with their state;
 *   • the join half of `PassengerOfferDetailsScreen` — becomes this screen's sheet in 17e.
 *     Until then a tap still pushes that screen (T-021: the route exists and is typed).
 *
 * The artboard has NO route search — "kelgan" assumes a backend matches orders to the driver,
 * and none does (search is `ILIKE` on free text). Owner decision ① 2026-09-11: the compact
 * from/to row stays, and an EMPTY route means every published order.
 *
 * 🔴 CARRIED-OVER FIXES — a rewrite is exactly where these go missing, so they are listed:
 *   T-018  the gendered seats / windows / class / flags are rendered by `PassengerOrderCard`
 *          from `seat_counts` and the flag columns — nothing is re-derived here.
 *   T-021  `PassengerOfferDetails` is a registered, typed route; `navigate` is not `as any`.
 *   T-037  same for `SearchPassengerOffers` / `MyJoinRequests` (both names survive: pushes
 *          navigate by them — `utils/notificationRouting.ts`).
 *   T-054  no phone number is read on this screen at all; the sheet (17e) reads it only
 *          through `passengerPhoneOf()` on a CONFIRMED request.
 *   T-068  a push that lands while the screen is open refreshes the lists in place;
 *          navigation still happens only on a tap.
 *   7d     the request shape is `from_text` / `to_text` STRINGS built from district-or-province
 *          names — NOT the `*_province_id` ids the passenger app's twin sends — and the saved
 *          search keeps its 2026-08 JSON shape (`fromCountry … toCity`) so old saves restore.
 *
 * ⚠️ `SafeAreaView` is safe-area-context's, with the top edge left to `TopBar` — the double
 * inset step 8 caught. This screen is PUSHED over the tabs, hence the back arrow (step 8's rule).
 *
 * What is NOT here, on purpose: the old filter modal (max price / min seats) — the artboard has
 * class tabs and sort chips instead; the Jo'natma kind (out-of-scope role, dimmed and inert);
 * presence, rating, reject-with-reason (no backend — `PLAN-T101-step17.md` §2).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as PassengerOffersAPI from '../api/passengerOffers';
import type { OfferDriver, PassengerOffer } from '../api/passengerOffers';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { getErrorMessage } from '../utils/errorHandler';
import { subscribePushReceived } from '../utils/pushEvents';
import { TopBar } from '../components/chrome/TopBar';
import { Icon } from '../components/chrome/Icon';
import { SegmentedModes } from '../components/chrome/SegmentedModes';
import { PanelTabs } from '../components/chrome/PanelTabs';
import { SortChips } from '../components/chrome/SortChips';
import { PassengerOrderCard } from '../components/offers/PassengerOrderCard';
import { PassengerOrderSheet, type SheetOutcome } from '../components/offers/PassengerOrderSheet';
import { OrderResultSheet, type ResultKind } from '../components/offers/OrderResultSheet';
import { passengerNameOf } from '../api/passengerOffers';
import { GeoSheet, type GeoPath } from '../components/geo/GeoSheet';
import type { MainStackParamList } from '../navigation/types';
import {
  classCounts,
  excludeMine,
  filterByKind,
  nextSortState,
  seatKindKey,
  serverSortFor,
  sortOrders,
  type ClassFilter,
  type SortKey,
  type SortState,
} from '../utils/passengerOrders';
import { theme } from '../themes';

export type PassengerOrdersMode = 'incoming' | 'sent';

/** The same key and the same JSON shape the old search screen wrote — old saves must restore. */
const LAST_SEARCH_KEY = '@ubexgo_driver:last_passenger_search';

/** One list row: the order, and the driver's own request on it in the sent mode. */
interface Row {
  order: PassengerOffer;
  request: OfferDriver | null;
}

const pathLabel = (p: GeoPath): string =>
  [p.province?.name, p.district?.name].filter(Boolean).join(', ');

export default function PassengerOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { token, user } = useAuth();
  const { t } = useTranslation();

  // Three route names land here (17g): `SearchPassengerOffers` (incoming), `MyJoinRequests`
  // (`initialParams: { mode: 'sent' }`) and `PassengerOfferDetails { offerId }` — a push or a
  // deep link that wants ONE order's sheet open (`notificationRouting.ts`).
  const params = (route.params ?? {}) as { mode?: PassengerOrdersMode; offerId?: number };
  const initialMode = params.mode ?? 'incoming';
  const requestedOfferId = Number.isFinite(Number(params.offerId)) ? Number(params.offerId) : null;

  // ------------------------------------------------------------------ state
  const [mode, setMode] = useState<PassengerOrdersMode>(initialMode);
  const [filter, setFilter] = useState<ClassFilter>('hammasi');
  const [sort, setSort] = useState<SortState>({ key: 'match', priceDesc: false, seatsAsc: false });

  const [fromPath, setFromPath] = useState<GeoPath>({});
  const [toPath, setToPath] = useState<GeoPath>({});
  const [geoSheet, setGeoSheet] = useState<'from' | 'to' | null>(null);

  const [offers, setOffers] = useState<PassengerOffer[]>([]);
  const [requests, setRequests] = useState<OfferDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  /** The row open in the sheet (17e). */
  const [selected, setSelected] = useState<Row | null>(null);
  /** The result dialog (17f) after an accept or an offer; closing it may switch the mode. */
  const [result, setResult] = useState<{ kind: ResultKind; order: PassengerOffer; total: number } | null>(null);
  /** The `offerId` param already honoured, so a re-render does not reopen the sheet. */
  const [openedOfferId, setOpenedOfferId] = useState<number | null>(null);

  // The request sends names, not ids (7d). District when chosen, else the province.
  const fromText = fromPath.district?.name ?? fromPath.province?.name;
  const toText = toPath.district?.name ?? toPath.province?.name;
  const serverSort = serverSortFor(sort);

  // ------------------------------------------------------------------ saved search
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LAST_SEARCH_KEY);
        if (!saved) return;
        const s = JSON.parse(saved);
        setFromPath({
          ...(s.fromCountry ? { country: s.fromCountry } : {}),
          ...(s.fromProvince ? { province: s.fromProvince } : {}),
          ...(s.fromCity ? { district: s.fromCity } : {}),
        });
        setToPath({
          ...(s.toCountry ? { country: s.toCountry } : {}),
          ...(s.toProvince ? { province: s.toProvince } : {}),
          ...(s.toCity ? { district: s.toCity } : {}),
        });
      } catch (error) {
        console.error('Failed to load last search:', error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!fromPath.province || !toPath.province) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(
        LAST_SEARCH_KEY,
        JSON.stringify({
          fromCountry: fromPath.country ?? null,
          fromProvince: fromPath.province ?? null,
          fromCity: fromPath.district ?? null,
          toCountry: toPath.country ?? null,
          toProvince: toPath.province ?? null,
          toCity: toPath.district ?? null,
        }),
      ).catch((error) => console.error('Failed to save last search:', error));
    }, 300);
    return () => clearTimeout(timer);
  }, [fromPath, toPath]);

  // ------------------------------------------------------------------ loading
  const loadOffers = useCallback(async () => {
    try {
      const result = await PassengerOffersAPI.searchPassengerOffers({
        ...(fromText ? { from_text: fromText } : {}),
        ...(toText ? { to_text: toText } : {}),
        sort_by: serverSort,
        limit: 20,
      });
      setOffers(result.items);
    } catch (error: unknown) {
      showToast.error(t('common.error'), getErrorMessage(error, t, 'errors.loadFailed'));
    }
  }, [fromText, toText, serverSort, t]);

  const loadRequests = useCallback(async () => {
    if (!token) {
      setRequests([]);
      return;
    }
    try {
      setRequests(await PassengerOffersAPI.getMyJoinRequests(token));
    } catch (error: unknown) {
      showToast.error(t('common.error'), getErrorMessage(error, t, 'myJoinRequests.loadFailed'));
    }
  }, [token, t]);

  const loadAll = useCallback(async () => {
    await Promise.allSettled([loadOffers(), loadRequests()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadOffers, loadRequests]);

  // First mount, a route/sort change (which changes `loadOffers`), and coming back from
  // another screen — the same single hook the old sent-requests screen used.
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  // T-068 — refresh in place when a push lands while this screen is open.
  useEffect(
    () =>
      subscribePushReceived(() => loadAll(), [
        'driver_request_confirmed',
        'driver_request_rejected',
        'driver_not_chosen',
        'offer_cancelled_by_passenger',
        'passenger_offer_updated',
      ]),
    [loadAll],
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  // ------------------------------------------------------------------ derived lists
  const sentRows = useMemo<Row[]>(
    () => requests.filter((r) => !!r.offer).map((r) => ({ order: r.offer as PassengerOffer, request: r })),
    [requests],
  );
  const goneRequests = useMemo(() => requests.filter((r) => !r.offer), [requests]);
  const incomingRows = useMemo<Row[]>(
    () => excludeMine(offers, requests).map((order) => ({ order, request: null })),
    [offers, requests],
  );

  // `PassengerOfferDetails { offerId }` — open the sheet on that order once the lists are in.
  // A push about the driver's own bid finds it among the sent rows; anything else (an order the
  // search page did not return, or one whose request row lost its offer) is fetched by id. A
  // 404 means the order is gone: say so, as the old details screen did.
  useEffect(() => {
    if (requestedOfferId === null || loading || openedOfferId === requestedOfferId) return;
    setOpenedOfferId(requestedOfferId);
    const row = [...sentRows, ...incomingRows].find((r) => r.order.id === requestedOfferId);
    if (row) {
      if (row.request) setMode('sent');
      setSelected(row);
      return;
    }
    (async () => {
      try {
        const order = await PassengerOffersAPI.getPassengerOfferById(requestedOfferId);
        const request = requests.find((r) => Number(r.offer_id) === requestedOfferId) ?? null;
        if (request) setMode('sent');
        setSelected({ order, request });
      } catch (error: unknown) {
        showToast.error(t('common.error'), getErrorMessage(error, t, 'passengerOfferDetails.notFound'));
      }
    })();
  }, [requestedOfferId, loading, openedOfferId, sentRows, incomingRows, requests, t]);

  const source = mode === 'sent' ? sentRows : incomingRows;
  const counts = useMemo(() => classCounts(source.map((r) => r.order)), [source]);
  const visible = useMemo<Row[]>(() => {
    const byId = new Map(source.map((r) => [r.order.id, r]));
    const orders = filterByKind(
      source.map((r) => r.order),
      filter,
    );
    return sortOrders(orders, sort).map((o) => byId.get(o.id) as Row);
  }, [source, filter, sort]);

  const listTitle =
    mode === 'sent'
      ? t('passengerOrders.titleSent')
      : filter === 'oddiy'
        ? t('passengerOrders.titleOddiy')
        : filter === 'maxsus'
          ? t('passengerOrders.titleMaxsus')
          : t('passengerOrders.titleIncoming');
  const listCount = `${visible.length} ${t(mode === 'sent' ? 'passengerOrders.countOffers' : 'passengerOrders.countOrders')}`;

  const sortChips = useMemo(
    () => [
      { key: 'match' as SortKey, label: t('passengerOrders.sortMatch'), glyph: '★' },
      {
        key: 'price' as SortKey,
        label: t('passengerOrders.sortPrice'),
        glyph: sort.key === 'price' && sort.priceDesc ? '↓' : '↑',
      },
      {
        key: 'seats' as SortKey,
        label: t('passengerOrders.sortSeats'),
        glyph: sort.key === 'seats' && sort.seatsAsc ? '↑' : '↓',
      },
      { key: 'soon' as SortKey, label: t('passengerOrders.sortSoon'), glyph: '⚡' },
    ],
    [sort, t],
  );

  const displayName =
    user?.display_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || '';
  const initials = displayName.charAt(0).toUpperCase();

  const openOrder = (row: Row) => {
    if (!token) {
      showToast.error(t('common.error'), t('searchPassengerOffers.loginRequired'));
      return;
    }
    // 17e — the artboard's sheet over the list, not a push. `PassengerOfferDetails` stays
    // registered for pushes (17g routes it into this sheet by `offerId`).
    setSelected(row);
  };

  const handleSheetChanged = (outcome: SheetOutcome, total?: number) => {
    const order = selected?.order ?? null;
    setSelected(null);
    loadAll();
    // An accept or an offer gets the result dialog; the artboard switches to the sent mode
    // when THAT closes after an offer (`closeSent`). A cancel keeps the old toast and the mode.
    if (outcome !== 'cancel' && order) setResult({ kind: outcome, order, total: total ?? 0 });
  };

  const handleResultClose = () => {
    const kind = result?.kind;
    setResult(null);
    if (kind === 'offer') setMode('sent');
  };

  // ------------------------------------------------------------------ render
  const routeRow = (which: 'from' | 'to') => {
    const path = which === 'from' ? fromPath : toPath;
    const setPath = which === 'from' ? setFromPath : setToPath;
    const label = pathLabel(path);
    return (
      <View style={styles.routeRow}>
        <Pressable
          style={styles.routeMain}
          onPress={() => setGeoSheet(which)}
          accessibilityRole="button"
          accessibilityLabel={`${t(which === 'from' ? 'searchPassengerOffers.fromLabel' : 'searchPassengerOffers.toLabel')}: ${label || t('passengerOrders.anyRoute')}`}
        >
          <View style={[styles.routeDot, which === 'to' && styles.routeDotTo]} />
          <View style={styles.routeTexts}>
            <Text style={styles.routeEyebrow}>
              {t(which === 'from' ? 'searchPassengerOffers.fromLabel' : 'searchPassengerOffers.toLabel')}
            </Text>
            <Text style={[styles.routePlace, !label && styles.routePlaceholder]} numberOfLines={1}>
              {label || t('passengerOrders.anyRoute')}
            </Text>
          </View>
          <Icon name="chevronRight" size={18} color={theme.palette.text.chevron} />
        </Pressable>
        {!!path.province && (
          <Pressable
            onPress={() => setPath({})}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('searchPassengerOffers.clear')}
            style={styles.routeClear}
          >
            <Ionicons name="close-circle" size={18} color={theme.palette.text.tertiary} />
          </Pressable>
        )}
      </View>
    );
  };

  const canSwap = !!fromPath.province && !!toPath.province;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <TopBar
        background="flat"
        title={t('passengerOrders.title')}
        suffix="Driver"
        initials={initials}
        onBackPress={() => navigation.goBack()}
        onBellPress={() => navigation.navigate('Notifications')}
        onAvatarPress={() => navigation.navigate('Profile')}
      />

      {/* Kind: Taxi is the product; Jo'natma is an out-of-scope role, visible but inert (step 6). */}
      <View style={styles.kindRow}>
        <View style={[styles.kind, styles.kindOn]} accessibilityRole="tab" accessibilityState={{ selected: true }}>
          <Icon name="taxi" size={17} color={theme.palette.text.onAccent} strokeWidth={1.9} />
          <Text style={[styles.kindText, styles.kindTextOn]}>{t('passengerOrders.kindTaxi')}</Text>
        </View>
        <View
          style={[styles.kind, styles.kindOff, styles.kindDisabled]}
          accessibilityRole="tab"
          accessibilityState={{ selected: false, disabled: true }}
          accessibilityLabel={`${t('passengerOrders.kindParcel')}, ${t('drawer.soon')}`}
        >
          <Icon name="parcel" size={17} color={theme.palette.text.muted} strokeWidth={1.9} />
          <Text style={[styles.kindText, styles.kindTextOff]}>{t('passengerOrders.kindParcel')}</Text>
          <Text style={styles.kindSoon}>{t('drawer.soon')}</Text>
        </View>
      </View>

      {/* Route — the row the artboard lacks (decision ①). Empty = every order. */}
      <View style={styles.routeCard}>
        {routeRow('from')}
        <View style={styles.routeDivider} />
        {routeRow('to')}
        <Pressable
          style={[styles.swap, !canSwap && styles.swapDisabled]}
          onPress={() => {
            setFromPath(toPath);
            setToPath(fromPath);
          }}
          disabled={!canSwap}
          accessibilityRole="button"
          accessibilityLabel={`${t('searchPassengerOffers.from')} ⇄ ${t('searchPassengerOffers.to')}`}
        >
          <Ionicons
            name="swap-vertical"
            size={18}
            color={canSwap ? theme.palette.action : theme.palette.text.disabled}
          />
        </Pressable>
      </View>

      <View style={styles.strips}>
        <SegmentedModes
          shape="pill"
          modes={[
            { key: 'incoming', label: t('passengerOrders.modeIncoming') },
            { key: 'sent', label: t('passengerOrders.modeSent') },
          ]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setFilter('hammasi');
          }}
        />
      </View>
      <PanelTabs
        tabs={[
          { key: 'hammasi', label: t('passengerOrders.tabAll'), count: counts.hammasi },
          { key: 'oddiy', label: t('passengerOrders.tabOddiy'), count: counts.oddiy },
          { key: 'maxsus', label: t('passengerOrders.tabMaxsus'), count: counts.maxsus, tone: 'paid' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <SortChips chips={sortChips} value={sort.key} onChange={(k) => setSort((s) => nextSortState(s, k))} />

      <View style={styles.listTitleRow}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {listTitle}
        </Text>
        <Text style={styles.listCount}>{listCount}</Text>
      </View>

      {loading && visible.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.palette.action} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(row) => `${row.request?.id ?? 'o'}-${row.order.id}`}
          renderItem={({ item }) => (
            <PassengerOrderCard order={item.order} request={item.request} onPress={() => openOrder(item)} />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="parcel" size={28} color={theme.palette.text.disabled} strokeWidth={1.7} />
              <Text style={styles.emptyText}>
                {t(mode === 'sent' ? 'passengerOrders.emptySent' : 'passengerOrders.emptyIncoming')}
              </Text>
            </View>
          }
          ListFooterComponent={
            mode === 'sent' && goneRequests.length > 0 ? (
              <View style={styles.gone}>
                {goneRequests.map((r) => (
                  <Text key={r.id} style={styles.goneText}>
                    {t(`myJoinRequests.status_${r.status}`)} · {t('myJoinRequests.offerGone')}
                  </Text>
                ))}
              </View>
            ) : null
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <PassengerOrderSheet
        visible={selected !== null}
        order={selected?.order ?? null}
        request={selected?.request ?? null}
        onClose={() => setSelected(null)}
        onChanged={handleSheetChanged}
      />

      {result && (
        <OrderResultSheet
          visible
          kind={result.kind}
          passengerName={passengerNameOf(result.order) || t('passengerOfferDetails.passengerUnknown')}
          seatKindLabel={t(seatKindKey(result.order))}
          total={result.total}
          currency={result.order.currency}
          onClose={handleResultClose}
        />
      )}

      <GeoSheet
        visible={geoSheet !== null}
        title={geoSheet === 'from' ? t('searchPassengerOffers.from') : t('searchPassengerOffers.to')}
        initialPath={geoSheet === 'from' ? fromPath : toPath}
        // from_text/to_text are built from province + district, so district is as deep as it needs.
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
  container: { flex: 1, backgroundColor: theme.palette.ground },

  // Kind toggle — artboard lines 43-50: 38 high, radius 11, 1.5 border, icon 17 + 12.5/800·650.
  kindRow: { flexDirection: 'row', gap: 25, paddingHorizontal: 18, paddingTop: 7, paddingBottom: 10 },
  kind: {
    flex: 1,
    minWidth: 0,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
  },
  kindOn: { backgroundColor: theme.palette.brand, borderColor: theme.palette.brand, ...theme.shadows.card },
  kindOff: { backgroundColor: theme.palette.surface, borderColor: theme.palette.borders.strong },
  kindDisabled: { opacity: 0.55 },
  kindText: { fontSize: 12.5, lineHeight: 15 },
  kindTextOn: { ...theme.font('sans', 800), color: theme.palette.text.onAccent },
  kindTextOff: { ...theme.font('sans', 600), color: theme.palette.text.muted },
  kindSoon: { ...theme.typography.eyebrow, color: theme.palette.text.tertiary },

  // Route row — the passenger app's step-8b row language on a `surface` card.
  routeCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    backgroundColor: theme.palette.surface,
    borderRadius: theme.borderRadius.card,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.control,
    paddingRight: 52,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeMain: {
    flex: 1,
    minWidth: 0,
    minHeight: theme.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
  },
  routeDot: { width: 8, height: 8, borderRadius: theme.borderRadius.full, backgroundColor: theme.palette.text.tertiary },
  routeDotTo: { backgroundColor: theme.palette.brand },
  routeTexts: { flex: 1, minWidth: 0, gap: 1 },
  routeEyebrow: { ...theme.typography.eyebrow, color: theme.palette.text.tertiary },
  routePlace: { fontSize: 13.5, lineHeight: 17, ...theme.font('sans', 700), color: theme.palette.text.primary },
  routePlaceholder: { ...theme.font('sans', 600), color: theme.palette.text.secondary },
  routeClear: { paddingHorizontal: 6, paddingVertical: 8 },
  routeDivider: { height: theme.sizes.borderHairline, marginLeft: 32, backgroundColor: theme.palette.borders.chrome },
  swap: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -19,
    width: theme.sizes.controlSm,
    height: theme.sizes.controlSm,
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.strong,
    backgroundColor: theme.palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapDisabled: { opacity: 0.6 },

  strips: { paddingHorizontal: 18 },

  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  listTitle: { flex: 1, fontSize: 12.5, lineHeight: 16, ...theme.font('sans', 700), color: theme.palette.text.muted },
  listCount: { ...theme.typography.monoMeta, ...theme.font('mono', 600), color: theme.palette.text.tertiary },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 16, flexGrow: 1 },
  separator: { height: 10 },

  // Empty state — artboard lines 151-156: dashed card, 44/24 padding, glyph 28, 14/800.
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 44,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.card,
    borderWidth: theme.sizes.borderHairline,
    borderStyle: 'dashed',
    borderColor: theme.palette.borders.emphasis,
    backgroundColor: theme.palette.surface,
  },
  emptyText: { fontSize: 14, lineHeight: 18, ...theme.font('sans', 800), color: theme.palette.text.muted, textAlign: 'center' },

  gone: { paddingTop: 12, gap: 6 },
  goneText: { fontSize: 12, lineHeight: 15, ...theme.font('sans', 600), color: theme.palette.text.tertiary },
});
