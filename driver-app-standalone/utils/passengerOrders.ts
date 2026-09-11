/**
 * Passenger orders — the pure rules behind `DriverQidiruv`, the driver's passenger-orders
 * screen. T-101 step 17a (`docs/PLAN-T101-step17.md`).
 *
 * 🔴 WHY THIS LANDS BEFORE ANY PIXEL. Step 17 merges three screens — the incoming search,
 * the sent proposals and the join form — into one screen with two modes and a sheet. The
 * rules those screens carried inline (how many seats a passenger needs, which price is "the"
 * price on a special order, when a phone may be shown, which sort wins) would be rewritten
 * three times in the merge and disagree in ways no checker could see. So they are executed
 * here first, and `scripts/check-passenger-orders.mjs` asserts on them — the 8f / 16a /
 * 16c-2 order of work: the rules before the ruler.
 *
 * ⚠️ EVERYTHING HERE MUST STAY PURE — no React, no react-native, no API client, no `t()`.
 * Labels are returned as translation KEYS, and deliberately the EXISTING ones
 * (`passengerOfferExtras.*`, `myJoinRequests.status_*`, `passengerOfferDetails.*`), so the
 * merge adds no locale entries for things that already had words.
 *
 * ⚠️ Money arrives as STRINGS as often as numbers — Sequelize returns DECIMAL columns as
 * strings and the old screens wrapped every read in `Number()`. `money()` below is the one
 * place that coercion happens; nothing else in this module touches a raw price.
 */

// ------------------------------------------------------------------------------ types

export type OrderKind = 'oddiy' | 'maxsus';
/** `'any'` = occupied, gender unknown (offers without `seat_counts`). */
export type SeatCell = 'm' | 'f' | 'any' | null;
export type SortKey = 'match' | 'price' | 'seats' | 'soon';
export type ClassFilter = 'hammasi' | OrderKind;
export type RequestStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';
export type PillTone = 'wait' | 'ok' | 'bad' | 'neutral';

export interface SortState {
  key: SortKey;
  /** `price` sorts ascending until tapped again — the artboard's toggle. */
  priceDesc: boolean;
  /** `seats` sorts most-passengers-first until tapped again. */
  seatsAsc: boolean;
}

type Money = number | string | null | undefined;

export interface SpecialOrderLike {
  price_front?: Money;
  price_back?: Money;
  price_back_salon?: Money;
  price_whole_salon?: Money;
}

export interface SeatCountsLike {
  front_male: number;
  front_female: number;
  back_male: number;
  back_female: number;
}

/**
 * The subset of `PassengerOffer` these rules read — structurally compatible with the API
 * type, so the screen passes the real object. Everything the API marks optional is
 * optional here too; the rules are what turn a sparse row into something drawable.
 */
export interface OrderLike {
  id: number;
  start_at: string;
  is_urgent?: boolean;
  max_price_per_seat: Money;
  seats_needed: number;
  seat_counts?: SeatCountsLike | null;
  salon_scope?: 'whole_salon' | 'back_salon_full' | null;
  front_seat?: boolean;
  special_order?: SpecialOrderLike | null;
  pets?: boolean;
  large_baggage?: boolean;
  woman_in_car?: boolean;
  roof_rack_needed?: boolean;
  trailer?: boolean;
  road_pickup?: boolean;
  seat_position_any?: boolean;
  /** @deprecated T-031 — read through `paymentKeys()`, which falls back to it. */
  payment_type?: string | null;
  payment_cash?: boolean;
  payment_card?: boolean;
  paid_by_friend?: boolean;
}

/** The subset of `OfferDriver` (a join request) these rules read. */
export interface RequestLike {
  offer_id: number;
  status: RequestStatus;
}

export interface SeatCells {
  front: SeatCell[];
  back: SeatCell[];
  /** Cells actually drawn as occupied — never more than the car has. */
  occupied: number;
}

export interface PriceLine {
  /** `passengerOfferExtras.seatsFront` · `seatsBack` · `backSalonFull` · `wholeSalon` */
  labelKey: string;
  qty: number;
  unit: number;
  sum: number;
}

export interface ListedPrice {
  kind: OrderKind;
  /** Null = the passenger named no price ("Kelishiladi"). */
  perSeat: number | null;
  total: number | null;
  /** The special-order breakdown the detail sheet lists; empty for `oddiy`. */
  lines: PriceLine[];
}

export interface AcceptPayload {
  seats_offered: number;
  offered_price_per_seat: number;
}

// ------------------------------------------------------------------------------ the car

/**
 * The artboard draws ONE front cell and THREE back cells, and so does every order card in
 * both apps. A passenger row whose counts add up to more than four (bad data, or a minibus
 * order the form does not model) must not grow a fifth cell — the card would break its own
 * grid. Overflow is dropped from the drawing, never from the number beside it.
 */
export const CAR = { front: 1, back: 3 } as const;

// ------------------------------------------------------------------------------ money

/** The one coercion point. Positive finite amounts only; anything else is "no price". */
export const money = (v: Money): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\s/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * A special ("maxsus") order is one that CARRIES A PRICE in its special block. The block's
 * mere presence is not enough: the passenger form can send it with only the boolean flags
 * set, and treating that as maxsus would paint every order purple.
 */
export const isSpecialOrder = (o: OrderLike): boolean => {
  const s = o.special_order;
  if (!s) return false;
  return (
    money(s.price_front) !== null ||
    money(s.price_back) !== null ||
    money(s.price_back_salon) !== null ||
    money(s.price_whole_salon) !== null
  );
};

export const orderKind = (o: OrderLike): OrderKind => (isSpecialOrder(o) ? 'maxsus' : 'oddiy');

// ------------------------------------------------------------------------------ seats

const counted = (c: SeatCountsLike | null | undefined): SeatCountsLike | null => {
  if (!c) return null;
  const n = (v: unknown) => Math.max(0, Math.floor(Number(v)) || 0);
  const out = {
    front_male: n(c.front_male),
    front_female: n(c.front_female),
    back_male: n(c.back_male),
    back_female: n(c.back_female),
  };
  return out.front_male + out.front_female + out.back_male + out.back_female > 0 ? out : null;
};

const fill = (cells: SeatCell[], value: SeatCell, howMany: number): number => {
  let placed = 0;
  for (let i = 0; i < cells.length && placed < howMany; i++) {
    if (cells[i] === null) {
      cells[i] = value;
      placed++;
    }
  }
  return howMany - placed; // the overflow
};

/**
 * The seat grid for a card: which of the four cells are taken, and by whom.
 *
 * With `seat_counts` (the new form): front cells from the front counts, back from the back
 * counts, women first so a mixed row reads the way the passenger form draws it. A front
 * overflow spills to the back and a back overflow to the front before anything is dropped —
 * the passenger asked for N people; which seat was the form's guess.
 *
 * Without counts (pre-T-018 offers): whole salon = all four; back salon = the three back;
 * otherwise `seats_needed` people of unknown gender, the front seat first only if the
 * passenger asked for it.
 */
export const seatCells = (o: OrderLike): SeatCells => {
  const front: SeatCell[] = Array.from({ length: CAR.front }, () => null);
  const back: SeatCell[] = Array.from({ length: CAR.back }, () => null);
  const c = counted(o.seat_counts);

  if (c) {
    let spill = fill(front, 'f', c.front_female);
    spill += fill(front, 'm', c.front_male);
    // what the front could not hold goes to the back, unknown-gender order preserved
    let backSpill = fill(back, 'f', c.back_female);
    backSpill += fill(back, 'm', c.back_male);
    if (spill > 0) fill(back, c.front_female > 0 ? 'f' : 'm', spill);
    if (backSpill > 0) fill(front, c.back_female > 0 ? 'f' : 'm', backSpill);
  } else if (o.salon_scope === 'whole_salon') {
    fill(front, 'any', CAR.front);
    fill(back, 'any', CAR.back);
  } else if (o.salon_scope === 'back_salon_full') {
    fill(back, 'any', CAR.back);
  } else {
    let n = Math.max(0, Math.floor(Number(o.seats_needed)) || 0);
    if (o.front_seat) n = fill(front, 'any', Math.min(n, CAR.front)) + Math.max(0, n - CAR.front);
    n = fill(back, 'any', n);
    if (n > 0) fill(front, 'any', n);
  }

  const occupied = [...front, ...back].filter((x) => x !== null).length;
  return { front, back, occupied };
};

// ------------------------------------------------------------------------------ price

const seatsNeeded = (o: OrderLike): number => Math.max(1, Math.floor(Number(o.seats_needed)) || 1);

/**
 * "The" price of an order, the way the artboard labels it: an ordinary order is priced per
 * seat by the passenger (`max_price_per_seat`, null on the new form = negotiable); a special
 * order is priced by its block — whole salon, back salon, or front/back seats × the seats the
 * passenger actually asked for. `perSeat` on a special order is derived from the total so
 * that the server's own arithmetic (per seat × seats needed) lands on the passenger's number.
 */
export const listedPrice = (o: OrderLike): ListedPrice => {
  const need = seatsNeeded(o);
  const perSeatAsked = money(o.max_price_per_seat);

  if (!isSpecialOrder(o)) {
    return {
      kind: 'oddiy',
      perSeat: perSeatAsked,
      total: perSeatAsked === null ? null : perSeatAsked * need,
      lines: [],
    };
  }

  const s = o.special_order as SpecialOrderLike;
  const lines: PriceLine[] = [];
  const line = (labelKey: string, qty: number, unit: number | null) => {
    if (unit !== null && qty > 0) lines.push({ labelKey, qty, unit, sum: qty * unit });
  };

  if (o.salon_scope === 'whole_salon' && money(s.price_whole_salon) !== null) {
    line('passengerOfferExtras.wholeSalon', 1, money(s.price_whole_salon));
  } else if (o.salon_scope === 'back_salon_full' && money(s.price_back_salon) !== null) {
    line('passengerOfferExtras.backSalonFull', 1, money(s.price_back_salon));
  } else {
    const cells = seatCells(o);
    const frontQty = cells.front.filter((x) => x !== null).length;
    const backQty = cells.back.filter((x) => x !== null).length;
    line('passengerOfferExtras.seatsFront', frontQty, money(s.price_front));
    line('passengerOfferExtras.seatsBack', backQty, money(s.price_back));
  }

  if (lines.length === 0) {
    // A special block whose prices do not cover what was asked — fall back to the plain
    // per-seat ask rather than inventing a number.
    return {
      kind: 'maxsus',
      perSeat: perSeatAsked,
      total: perSeatAsked === null ? null : perSeatAsked * need,
      lines,
    };
  }

  const total = lines.reduce((sum, l) => sum + l.sum, 0);
  // ceil, not round: a driver "accepting" the asked price must never come in under it.
  return { kind: 'maxsus', perSeat: Math.ceil(total / need), total, lines };
};

/**
 * `Qabul qilish` — a join request at the passenger's own price. The server bills
 * `offered_price_per_seat × seats_needed` (owner-confirmed 2026-08-02), so this is the
 * payload whose total equals `listedPrice().total`, or null when there is no price to
 * accept (the driver can only counter-offer then).
 */
export const acceptPayload = (o: OrderLike): AcceptPayload | null => {
  const p = listedPrice(o);
  if (p.perSeat === null) return null;
  return { seats_offered: seatsNeeded(o), offered_price_per_seat: p.perSeat };
};

// ------------------------------------------------------------------------------ counter-offer

/** The offer sheet's price field is typed in THOUSANDS of so'm, digits only. */
export const parseThousands = (input: string): number => {
  const n = parseInt(String(input ?? '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};

export const offerTotal = (perSeatThousands: number, seats: number): number =>
  Math.max(0, perSeatThousands) * 1000 * Math.max(0, seats);

/** What the sheet pre-fills: the listed per-seat price, in thousands, or empty. */
export const seedOfferThousands = (o: OrderLike): number | null => {
  const p = listedPrice(o).perSeat;
  return p === null ? null : Math.round(p / 1000);
};

/**
 * The join form's rules, in the order the old details screen checked them. Returns the
 * translation key of the first failure, or null when the offer may be sent.
 *  - the driver has no vehicle on file → `noVehicle`
 *  - price ≤ 0 → `errorPrice`
 *  - fewer seats than the passenger needs → `errorSeats` (the server refuses this; a T-018
 *    salon order needs 3 or 4, so the form must not default to 1)
 */
export const validateOffer = (input: {
  perSeat: number;
  seats: number;
  seatsNeeded: number;
  hasVehicle: boolean;
}): string | null => {
  if (!input.hasVehicle) return 'passengerOfferDetails.noVehicle';
  if (!(Number.isFinite(input.perSeat) && input.perSeat > 0)) return 'passengerOfferDetails.errorPrice';
  if (input.seats < input.seatsNeeded) return 'passengerOfferDetails.errorSeats';
  return null;
};

// ------------------------------------------------------------------------------ tags

/** The card's tag pills, as `passengerOfferExtras.*` keys, most decision-relevant first. */
export const orderTags = (o: OrderLike): string[] => {
  const keys: string[] = [];
  if (o.woman_in_car) keys.push('passengerOfferExtras.womanInCar');
  if (o.large_baggage) keys.push('passengerOfferExtras.baggage');
  if (o.roof_rack_needed) keys.push('passengerOfferExtras.roofRack');
  if (o.trailer) keys.push('passengerOfferExtras.trailer');
  if (o.pets) keys.push('passengerOfferExtras.pets');
  if (o.road_pickup) keys.push('passengerOfferExtras.roadPickup');
  return keys;
};

// ------------------------------------------------------------------------------ sorting

/** Departure as a number; an unparseable date sorts LAST, explicitly, never as NaN. */
export const startMs = (o: OrderLike): number => {
  const t = Date.parse(o.start_at);
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
};

const byId = (a: OrderLike, b: OrderLike) => b.id - a.id;

/**
 * "Best matching" — urgent orders first, then the soonest departure. The artboard ranks by
 * presence before either, and presence has no backend (§2 of the plan), so `match` and
 * `soon` coincide until it does. Both keys are kept because the chip row draws both.
 */
const compareMatch = (a: OrderLike, b: OrderLike): number => {
  const ua = a.is_urgent ? 0 : 1;
  const ub = b.is_urgent ? 0 : 1;
  if (ua !== ub) return ua - ub;
  const d = startMs(a) - startMs(b);
  if (d !== 0 && Number.isFinite(d)) return d;
  if (startMs(a) !== startMs(b)) return startMs(a) === Number.POSITIVE_INFINITY ? 1 : -1;
  return byId(a, b);
};

/** Price: unpriced orders always last, whichever direction is chosen. */
const comparePrice = (desc: boolean) => (a: OrderLike, b: OrderLike): number => {
  const pa = listedPrice(a).total;
  const pb = listedPrice(b).total;
  if (pa === null && pb === null) return compareMatch(a, b);
  if (pa === null) return 1;
  if (pb === null) return -1;
  if (pa !== pb) return desc ? pb - pa : pa - pb;
  return compareMatch(a, b);
};

const compareSeats = (asc: boolean) => (a: OrderLike, b: OrderLike): number => {
  const d = seatsNeeded(a) - seatsNeeded(b);
  if (d !== 0) return asc ? d : -d;
  return compareMatch(a, b);
};

export const sortOrders = <T extends OrderLike>(list: T[], state: SortState): T[] => {
  const cmp =
    state.key === 'price'
      ? comparePrice(state.priceDesc)
      : state.key === 'seats'
        ? compareSeats(state.seatsAsc)
        : compareMatch; // 'match' and 'soon'
  return [...list].sort(cmp);
};

/** The chip-tap rule from the artboard: a second tap on price/seats flips its direction. */
export const nextSortState = (state: SortState, key: SortKey): SortState => {
  if (key === 'price') return { ...state, key, priceDesc: state.key === 'price' ? !state.priceDesc : false };
  if (key === 'seats') return { ...state, key, seatsAsc: state.key === 'seats' ? !state.seatsAsc : false };
  return { ...state, key };
};

/**
 * What to ask the SERVER for, so the page it returns is already in roughly the right order.
 * The client re-sorts what it receives regardless — the server has no urgent-first and no
 * seats-ascending — so this is an optimisation, not the rule.
 */
export const serverSortFor = (
  state: SortState,
): 'price_asc' | 'price_desc' | 'date_asc' | 'seats_desc' => {
  if (state.key === 'price') return state.priceDesc ? 'price_desc' : 'price_asc';
  if (state.key === 'seats') return 'seats_desc';
  return 'date_asc';
};

// ------------------------------------------------------------------------------ class filter

export const filterByKind = <T extends OrderLike>(list: T[], filter: ClassFilter): T[] =>
  filter === 'hammasi' ? list : list.filter((o) => orderKind(o) === filter);

export const classCounts = (list: OrderLike[]): Record<ClassFilter, number> => {
  const counts: Record<ClassFilter, number> = { hammasi: list.length, oddiy: 0, maxsus: 0 };
  for (const o of list) counts[orderKind(o)]++;
  return counts;
};

// ------------------------------------------------------------------------------ modes

/**
 * The incoming list is the search result MINUS every order this driver already has a
 * request on — in ANY status. Rejected and cancelled are terminal server-side
 * (`cannotJoinAfterRejected` / `cannotJoinAfterCancelled`), so showing such an order as
 * "incoming" would offer a button that can only fail. Those rows belong in the sent mode
 * with their pill.
 */
export const excludeMine = <T extends OrderLike>(orders: T[], mine: RequestLike[]): T[] => {
  const taken = new Set(mine.map((r) => r.offer_id));
  return orders.filter((o) => !taken.has(o.id));
};

// ------------------------------------------------------------------------------ requests

export const requestLabelKey = (status: RequestStatus): string => `myJoinRequests.status_${status}`;

export const requestTone = (status: RequestStatus): PillTone =>
  status === 'confirmed' ? 'ok' : status === 'rejected' ? 'bad' : status === 'cancelled' ? 'neutral' : 'wait';

/** The server refuses to cancel anything but a pending request. */
export const canCancelRequest = (r: RequestLike): boolean => r.status === 'pending';

/**
 * T-054 — the passenger's number is shown only once THEY confirmed this driver. The server
 * strips it from every other status anyway; this rule stays so a server change cannot make
 * the reveal silent.
 */
export const phoneUnlocked = (r: RequestLike): boolean => r.status === 'confirmed';

// ------------------------------------------------------------------------------ detail rows (17e)

export type PaymentKey = 'cash' | 'click_payme' | 'friend_pays';

export const PAYMENT_LABEL_KEY: Record<PaymentKey, string> = {
  cash: 'passengerOfferExtras.paymentCash',
  click_payme: 'passengerOfferExtras.paymentClickPayme',
  friend_pays: 'passengerOfferExtras.paymentFriend',
};

/**
 * T-031 — cash and card are independent flags (both may be true) and "Do'stimga" is its own
 * point, not a payment method. Offers created before the split carry only the deprecated
 * `payment_type`; when all three flags are ABSENT that single value is used, because showing
 * the driver nothing is worse than showing the old one. (Lifted from `PassengerOfferExtras`.)
 */
export const paymentKeys = (o: OrderLike): PaymentKey[] => {
  const legacy =
    o.payment_cash === undefined && o.payment_card === undefined && o.paid_by_friend === undefined;
  if (legacy) {
    const t = o.payment_type;
    return t === 'cash' || t === 'click_payme' || t === 'friend_pays' ? [t] : [];
  }
  const keys: PaymentKey[] = [];
  if (o.payment_cash) keys.push('cash');
  if (o.payment_card) keys.push('click_payme');
  if (o.paid_by_friend) keys.push('friend_pays');
  return keys;
};

/** "Joy turi" — which kind of seating the passenger asked for, as an existing label key. */
export const seatKindKey = (o: OrderLike): string => {
  if (o.salon_scope === 'whole_salon') return 'passengerOfferExtras.wholeSalon';
  if (o.salon_scope === 'back_salon_full') return 'passengerOfferExtras.backSalonFull';
  if (o.front_seat) return 'passengerOfferExtras.seatsFront';
  if (o.seat_position_any) return 'passengerOfferExtras.positionAny';
  return 'passengerOfferExtras.seatsBack';
};
