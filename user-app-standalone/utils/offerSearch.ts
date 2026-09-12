/**
 * Offer search — the pure rules behind `UserQidiruv`, the passenger's search screen.
 * T-101 step 14b-1 (`docs/PLAN-T101-step14b.md`).
 *
 * 🔴 WHY THIS LANDS BEFORE ANY PIXEL. Step 14b merges two screens — the offer search and the
 * "drivers who bid on my order" list — into one screen with two modes, and rebuilds a
 * 1 634-line file that carries real logic (geo cascade, saved searches, the join push). The
 * rules that file holds inline (how many seats the passenger needs, which price a card shows,
 * how the four sorts order, which class counts appear) would be rewritten across both modes
 * and disagree in ways no baseline sees. So they are executed here first and asserted on by
 * `scripts/check-offer-search.mjs` — step 16's order of work, which is how a bigger file than
 * this one was restructured safely.
 *
 * ⚠️ EVERYTHING HERE MUST STAY PURE — no React, no react-native, no API client, no `t()`.
 * Labels are returned as translation KEYS, reusing the existing `searchOffers.*` entries so
 * the merge adds no locale rows for words that already exist.
 *
 * 🔴 MONEY ARRIVES AS STRINGS. pg returns DECIMAL as `'150000.00'` — the 2026-08-02 root
 * cause named in `SearchOffersScreen`. `money()` is the ONE coercion point here.
 *
 * 🟢 THREE THINGS THE PLAN FIRST CALLED UNBACKED ARE REAL, and this module treats them as
 * first-class: the driver ★ rating (`driver.rating` / `rating_count`, averaged server-side),
 * the review comments, and `vehicle.fuel_types` (T-077, serialised for this very screen).
 * Each was a card claiming absence from a grep of the wrong path — see the plan's §2.
 */

// ------------------------------------------------------------------------------ types

export type SearchMode = 'qidiruv' | 'takliflar';
export type SortKey = 'match' | 'price' | 'seats' | 'soon';
/** What the server's `sort_by` accepts — `match` is client-side and has no server twin. */
export type ServerSort = 'price_asc' | 'price_desc' | 'rating_desc' | 'date_asc';
export type SeatPref = 'front' | 'back' | 'both' | 'backSalon' | 'whole' | null;

type Money = number | string | null | undefined;

export interface SortState {
  key: SortKey;
  /** `price` ascends until tapped again — the artboard's toggle. */
  priceDesc: boolean;
  /** `seats` shows most-free-first until tapped again. */
  seatsAsc: boolean;
}

/** The subset of `DriverOffer` these rules read — structurally compatible with the API type. */
export interface OfferLike {
  id: string | number;
  start_at: string;
  seats_free?: number | null;
  seats_total?: number | null;
  back_seats_free?: number | null;
  /** T-083 — the driver put a price on the front seat at all. */
  front_offered?: boolean | null;
  /** T-083 — offered AND not held by a confirmed booking. */
  front_seat_available?: boolean | null;
  price_per_seat?: Money;
  front_price_per_seat?: Money;
  price_back_salon?: Money;
  price_whole_salon?: Money;
  vehicle_class?: string | null;
  roof_rack_needed?: boolean | null;
  parcel_accepted?: boolean | null;
  depart_until?: string | null;
  arrive_from?: string | null;
  arrive_until?: string | null;
  driver?: { id?: number; name?: string; rating?: number; rating_count?: number } | null;
  vehicle?: { fuel_types?: string[] | null } | null;
}

/**
 * A driver's bid on the passenger's own order — the `Takliflar` mode's row.
 *
 * 🔴 A BID IS NOT A DECORATED DRIVER OFFER. This module first modelled it as one, and it is
 * not: `OfferDriver` carries its OWN driver and vehicle and has no `DriverOffer` behind it at
 * all — the driver is answering the passenger's request, not publishing a ride. The two modes
 * therefore render two different objects that merely look alike, which is exactly the trap
 * T-042 named ("two response shapes for the same logical object").
 *
 * ⚠️ Its `vehicle` is NESTED (`make: { name }`), unlike `DriverOffer.vehicle` whose fields are
 * flat strings. `bidCarName` below is the one place that difference is absorbed.
 */
export interface BidLike {
  id: string | number;
  offer_id?: number;
  status?: string | null;
  offered_price_per_seat?: Money;
  total_offered_price?: Money;
  seats_offered?: number | null;
  currency?: string | null;
  created_at?: string | null;
  driver?: { display_name?: string; first_name?: string; last_name?: string } | null;
  vehicle?: {
    make?: { name?: string } | null;
    model?: { name?: string } | null;
    color?: { name?: string } | null;
    license_plate?: string;
  } | null;
}

/** The saved order shape the artboard reads to decide how many seats are needed. */
export interface SavedOrderLike {
  seatPref?: SeatPref;
  seats?: { front?: number | null; back?: number | null } | null;
}

// ------------------------------------------------------------------------------ money

/** The ONE place a raw price becomes a number. `'150 000.00'` → 150000; unusable → null. */
export const money = (v: Money): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v == null) return null;
  const cleaned = String(v).replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

// ------------------------------------------------------------------------------ seats

/**
 * How many free seats an offer must have to be worth showing.
 *
 * The artboard's rule, verbatim (lines 858-862): a whole-salon order needs 4, a back-salon
 * order needs 3, otherwise front + back, and never less than 1.
 */
export const neededSeats = (order: SavedOrderLike | null | undefined): number => {
  if (!order) return 1;
  if (order.seatPref === 'whole') return 4;
  if (order.seatPref === 'backSalon') return 3;
  const front = Math.max(0, Math.floor(Number(order.seats?.front)) || 0);
  const back = Math.max(0, Math.floor(Number(order.seats?.back)) || 0);
  return Math.max(1, front + back);
};

/** The artboard's back row is three cells wide. */
export const BACK_SEAT_COUNT = 3;

export const freeSeats = (o: OfferLike): number => Math.max(0, Math.floor(Number(o.seats_free)) || 0);

export const hasEnoughSeats = (o: OfferLike, need: number): boolean => freeSeats(o) >= need;

/** The front seat has THREE states, not two — see `seatAvailability`. */
export type FrontSeatState = 'free' | 'taken' | 'notOffered' | 'unknown';

/**
 * Which seats still have room.
 *
 * 🔴 THE FRONT SEAT HAS THREE STATES AND THEY MUST NOT COLLAPSE. `api/offers.ts` spells the
 * rule out under T-083: `front_offered === false` means the seat was **never for sale**, which
 * is not the same as taken. Rendering them identically tells a passenger a seat is gone when
 * it never existed. This function was first written with a single boolean and that is exactly
 * the defect it produced.
 *
 * ⚠️ All three server fields are optional — an offer from an API older than T-083 carries
 * none. That case is `'unknown'`, NOT `'taken'`: under-claiming hides nothing, over-claiming
 * hides a bookable seat.
 */
export const seatAvailability = (o: OfferLike): { front: FrontSeatState; backFree: number } => {
  const back =
    o.back_seats_free == null ? Math.min(BACK_SEAT_COUNT, freeSeats(o)) : Math.max(0, Math.min(BACK_SEAT_COUNT, Math.floor(Number(o.back_seats_free)) || 0));

  let front: FrontSeatState;
  if (o.front_offered === false) front = 'notOffered';
  else if (o.front_seat_available == null) front = o.front_offered == null ? 'unknown' : 'taken';
  else front = o.front_seat_available ? 'free' : 'taken';

  return { front, backFree: back };
};

// ------------------------------------------------------------------------------ price

/**
 * The price a card leads with.
 *
 * The artboard uses `min(back, front)` (line 836) — the cheapest way in. A bid in the
 * `Takliflar` mode overrides it with the driver's own offered price, which is the whole point
 * of that mode.
 *
 * ⚠️ Returns `null` when the offer names no usable price. The caller must draw "kelishiladi",
 * never `0` and never "undefined so'm" (the rule `SearchOffersScreen` already followed).
 */
export const leadPrice = (o: OfferLike, bid?: BidLike | null): number | null => {
  /*
   * ⚠️ The `bid` arm stays for `sortOffers`, which sorts a mixed list by "the price this row
   * shows". It is NOT a claim that a bid decorates this offer — see `BidLike`.
   */
  if (bid) {
    const offered = money(bid.offered_price_per_seat);
    if (offered != null) return offered;
  }
  const back = money(o.price_per_seat);
  const front = money(o.front_price_per_seat);
  const candidates = [back, front].filter((n): n is number => n != null);
  return candidates.length ? Math.min(...candidates) : null;
};

/** Every price the card can show, each independently optional. */
/**
 * ⚠️ Two prefixes on purpose: `searchOffers.*` already owns the seat prices and
 * `passengerOffers.*` already owns the salon ones. Reused rather than duplicated, so the
 * merge adds no locale rows for words that exist (step 17's rule).
 */
export const priceRows = (o: OfferLike): { key: string; value: number }[] => {
  const rows: { key: string; value: number }[] = [];
  const add = (key: string, v: Money) => {
    const n = money(v);
    if (n != null) rows.push({ key, value: n });
  };
  add('searchOffers.priceFront', o.front_price_per_seat);
  add('searchOffers.priceBack', o.price_per_seat);
  add('passengerOffers.priceBackSalon', o.price_back_salon);
  add('passengerOffers.priceWholeSalon', o.price_whole_salon);
  return rows;
};

// ------------------------------------------------------------------------------ rating

/**
 * The ★ figure, or `null` for a driver nobody has rated yet.
 *
 * 🔴 A new driver must NOT render as `0,0` — that reads as a terrible driver rather than an
 * unrated one. `rating_count === 0` and a missing rating both mean "no score".
 */
export const ratingOf = (o: OfferLike): { value: number; count: number } | null => {
  const raw = Number(o.driver?.rating);
  const count = Math.max(0, Math.floor(Number(o.driver?.rating_count)) || 0);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  if (o.driver?.rating_count != null && count === 0) return null;
  return { value: raw, count };
};

/** Uzbek writes the decimal with a comma: `4.3` → `"4,3"`. One decimal place, always. */
export const formatRating = (value: number): string => value.toFixed(1).replace('.', ',');

// ------------------------------------------------------------------------------ fuel

/** T-077 — `['benzine','metan',…]` → label keys; unknown values pass through as themselves. */
export const FUEL_LABEL_KEY: Record<string, string> = {
  benzine: 'searchOffers.fuelBenzine',
  metan: 'searchOffers.fuelMetan',
  propan: 'searchOffers.fuelPropan',
  electric: 'searchOffers.fuelElectric',
  diesel: 'searchOffers.fuelDiesel',
};

/**
 * The fuel chips for one offer.
 *
 * ⚠️ Returns `[]`, so the caller omits the row entirely. A driver need not have recorded a
 * fuel, and offers cached before T-077 carry no such key. An unknown value survives as a raw
 * label rather than vanishing, so a new server-side fuel is visible instead of silently blank.
 * ⚠️ A car often has TWO here (benzine + propan is the normal local conversion).
 */
export const fuelChips = (o: OfferLike): { key: string | null; raw: string }[] => {
  const fuels = o.vehicle?.fuel_types;
  if (!Array.isArray(fuels)) return [];
  return fuels
    .filter((f): f is string => typeof f === 'string' && f.length > 0)
    .map((f) => ({ key: FUEL_LABEL_KEY[f] ?? null, raw: f }));
};

// ------------------------------------------------------------------------------ class filter

export const ALL_CLASSES = 'hammasi';

/** Counts per class tab, over the ALREADY seat-filtered source — the artboard's own order. */
export const classCounts = (
  offers: readonly OfferLike[],
  classes: readonly string[],
): Record<string, number> => {
  const out: Record<string, number> = { [ALL_CLASSES]: offers.length };
  for (const c of classes) out[c] = offers.filter((o) => o.vehicle_class === c).length;
  return out;
};

export const filterByClass = <T extends OfferLike>(offers: readonly T[], cls: string): T[] =>
  cls === ALL_CLASSES ? [...offers] : offers.filter((o) => o.vehicle_class === cls);

// ------------------------------------------------------------------------------ sorting

const startMs = (o: OfferLike): number => {
  const ms = new Date(o.start_at).getTime();
  return Number.isFinite(ms) ? ms : Number.NaN;
};

/**
 * The `match` rank. The artboard ranks by exactness, then a women-preference, then presence
 * and last-seen (lines 829-834).
 *
 * 🔴 THREE OF ITS FOUR KEYS DO NOT EXIST and are NOT faked: there is no per-offer women-only
 * flag, no online status and no `last_seen` anywhere in the API. What survives is what the
 * server can actually say: a rated driver outranks an unrated one, then more free seats, then
 * the soonest departure. Recorded rather than pretended otherwise (`PLAN-T101-step14b.md` §2).
 */
const matchRank = (o: OfferLike): number[] => {
  const r = ratingOf(o);
  /*
   * ⚠️ There is deliberately NO separate "is rated" key. `ratingOf` returns null unless the
   * value is above zero, so the rating key below is strictly negative for a rated driver and
   * exactly 0 for an unrated one — it already separates them. A leading `r ? 0 : 1` key was
   * written here first and the mutation checker proved it DEAD: flipping it changed no
   * ordering. A rule with a component that cannot affect the result is worse than one without.
   */
  return [r ? -r.value : 0, -freeSeats(o), startMs(o) || Number.POSITIVE_INFINITY];
};

export const sortOffers = <T extends OfferLike>(
  offers: readonly T[],
  state: SortState,
  bidOf?: (o: T) => BidLike | null | undefined,
): T[] => {
  const copy = [...offers];
  const priceFor = (o: T) => leadPrice(o, bidOf?.(o));

  if (state.key === 'price') {
    return copy.sort((a, b) => {
      const pa = priceFor(a);
      const pb = priceFor(b);
      // An unpriced offer sorts LAST in both directions — it is not "cheapest".
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return state.priceDesc ? pb - pa : pa - pb;
    });
  }

  if (state.key === 'seats') {
    return copy.sort((a, b) =>
      state.seatsAsc ? freeSeats(a) - freeSeats(b) : freeSeats(b) - freeSeats(a),
    );
  }

  if (state.key === 'soon') {
    /*
     * 🔴 ABSOLUTE departure time, NOT time-of-day.
     *
     * The artboard sorts on the "21:00" text of its depart window, which works only because
     * every one of its fixtures is the same date. Real offers span days, and a time-of-day
     * key puts tomorrow 06:00 ahead of tonight 22:00 — the opposite of "eng tez".
     * `check-offer-search.mjs` caught this on its first run, before any pixel was drawn.
     */
    return copy.sort((a, b) => {
      const am = startMs(a);
      const bm = startMs(b);
      if (Number.isNaN(am) && Number.isNaN(bm)) return 0;
      if (Number.isNaN(am)) return 1;
      if (Number.isNaN(bm)) return -1;
      return am - bm;
    });
  }

  return copy.sort((a, b) => {
    const ra = matchRank(a);
    const rb = matchRank(b);
    for (let i = 0; i < ra.length; i++) {
      const x = ra[i];
      const y = rb[i];
      if (Number.isNaN(x) && Number.isNaN(y)) continue;
      if (Number.isNaN(x)) return 1;
      if (Number.isNaN(y)) return -1;
      if (x !== y) return x - y;
    }
    return 0;
  });
};

/** Tapping a chip: the same chip toggles its direction, a new chip resets to its default. */
export const nextSortState = (current: SortState, tapped: SortKey): SortState => {
  if (current.key !== tapped) return { key: tapped, priceDesc: false, seatsAsc: false };
  if (tapped === 'price') return { ...current, priceDesc: !current.priceDesc };
  if (tapped === 'seats') return { ...current, seatsAsc: !current.seatsAsc };
  return current;
};

/**
 * What to send as `sort_by`.
 *
 * ⚠️ `match` and `seats` have NO server twin, so they must not silently become something
 * else — they return `undefined` and the ordering happens client-side. Sending `date_asc` for
 * `match` would quietly reorder the list under a chip that says otherwise.
 */
export const serverSortFor = (state: SortState): ServerSort | undefined => {
  if (state.key === 'price') return state.priceDesc ? 'price_desc' : 'price_asc';
  if (state.key === 'soon') return 'date_asc';
  return undefined;
};

// ------------------------------------------------------------------------------ modes

export const MODES: readonly SearchMode[] = ['qidiruv', 'takliflar'];

export const MODE_LABEL_KEY: Record<SearchMode, string> = {
  qidiruv: 'searchOffers.modeSearch',
  takliflar: 'searchOffers.modeBids',
};

export const LIST_TITLE_KEY: Record<SearchMode, string> = {
  qidiruv: 'searchOffers.listMatching',
  takliflar: 'searchOffers.listBids',
};

/** A bid the passenger can still act on. Terminal states stay visible, but inert. */
export const isLiveBid = (b: BidLike): boolean => b.status === 'pending' || b.status === 'confirmed';

export const bidTone = (status?: string | null): 'wait' | 'ok' | 'bad' | 'neutral' => {
  switch (status) {
    case 'pending':
      return 'wait';
    case 'confirmed':
      return 'ok';
    case 'rejected':
      return 'bad';
    default:
      return 'neutral';
  }
};

/**
 * ⚠️ `offerDrivers.*`, NOT `myJoinRequests.*`. The latter is the DRIVER app's namespace and
 * does not exist in this app at all — a key that resolves to itself on every locale. Caught by
 * reading the locale file rather than by `tsc`, which cannot see a translation key.
 */
/**
 * "Nexia 3" from a bid's NESTED vehicle. Returns `null` when the bid names no car, so the
 * caller falls back to a translated placeholder rather than rendering a stray separator.
 */
export const bidCarName = (b: BidLike): string | null => {
  const parts = [b.vehicle?.make?.name, b.vehicle?.model?.name].filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0,
  );
  return parts.length ? parts.join(' ') : null;
};

export const bidColorName = (b: BidLike): string | null => {
  const c = b.vehicle?.color?.name;
  return typeof c === 'string' && c.trim().length > 0 ? c : null;
};

export const bidDriverName = (b: BidLike): string | null => {
  const d = b.driver;
  const display = d?.display_name?.trim();
  if (display) return display;
  const joined = [d?.first_name, d?.last_name].filter(Boolean).join(' ').trim();
  return joined || null;
};

/** Per-seat and total, both coerced. Either can be null; the caller must not print "undefined". */
export const bidPrices = (b: BidLike): { perSeat: number | null; total: number | null } => ({
  perSeat: money(b.offered_price_per_seat),
  total: money(b.total_offered_price),
});

export const bidLabelKey = (status?: string | null): string =>
  `offerDrivers.status_${status ?? 'cancelled'}`;
