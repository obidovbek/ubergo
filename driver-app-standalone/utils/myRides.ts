/**
 * My rides — the pure rules behind `DriverMyOrder`, the driver's rides screen.
 * T-101 step 18a (`docs/PLAN-T101-step18.md`).
 *
 * 🔴 WHY THIS LANDS BEFORE ANY PIXEL. Step 18 merges `OffersListScreen` (the driver's own
 * offers) and `OfferPassengersScreen` (the passengers of one offer) into one list of
 * expandable ride cards in three phases. The rules those screens carried inline — which
 * offer may be edited, cancelled, archived, deleted or re-published; what "band o'rindiq"
 * counts; which reject reason is valid — would be rewritten in the merge and disagree
 * across the three phases. So they are executed here first and asserted on by
 * `scripts/check-my-rides.mjs` (the 8f / 16a / 17a order of work).
 *
 * 🔴 THE PHASES ARE DERIVED, NOT STORED (owner decision ②, 2026-09-12). The server knows
 * `published · archived · cancelled` and a `seats_free` counter that drops when a passenger
 * is CONFIRMED (`OfferPassengerService.ts:388`). So:
 *   Jarayonda = published with seats free · Faol = published with 0 free ·
 *   Tarix = archived or cancelled.
 * Nothing here invents a "confirmed" or "done" state the server cannot see.
 *
 * ⚠️ EVERYTHING HERE MUST STAY PURE — no React, no react-native, no API client, no `t()`.
 * Labels are returned as translation KEYS; the existing ones (`offerPassengers.*`,
 * `driverOffers.status.*`) where words already exist, `myRides.*` for the new copy.
 *
 * ⚠️ Money arrives as STRINGS as often as numbers (Sequelize DECIMAL). `money()` is the one
 * coercion point; nothing else in this module touches a raw price.
 */

// ------------------------------------------------------------------------------ types

export type OfferStatus = 'published' | 'archived' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';
export type RidePhase = 'jarayon' | 'faol' | 'tarix';
export type PillTone = 'wait' | 'ok' | 'bad' | 'neutral';

type Money = number | string | null | undefined;

/** The subset of `DriverOffer` these rules read — structurally compatible with the API type. */
export interface RideLike {
  id: string | number;
  status: OfferStatus;
  start_at: string;
  seats_total: number;
  seats_free: number;
  price_per_seat?: Money;
  created_at?: string;
  updated_at?: string;
}

/** The subset of `OfferPassenger` these rules read. */
export interface BookingLike {
  id: string | number;
  status: BookingStatus;
  seats_requested: number;
  is_front_seat?: boolean;
  agreed_price_per_seat?: Money;
  total_agreed_price?: Money;
  passenger?: { phone_e164?: string | null } | null;
}

export interface RideStats {
  taken: number;
  total: number;
  /** pending + confirmed, or `null` until the passengers are loaded (decision ④). */
  orders: number | null;
  /** Σ confirmed `total_agreed_price`, or `null` until the passengers are loaded. */
  money: number | null;
}

export interface PriceFormula {
  perSeat: number;
  seats: number;
  total: number;
}

// ------------------------------------------------------------------------------ money

/** The ONE place a raw price becomes a number. `'150 000.00'` → 150000; garbage → 0. */
export const money = (v: Money): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

// ------------------------------------------------------------------------------ phases

export const PHASES: readonly RidePhase[] = ['jarayon', 'faol', 'tarix'];

export const PHASE_LABEL_KEY: Record<RidePhase, string> = {
  jarayon: 'myRides.phaseJarayon',
  faol: 'myRides.phaseFaol',
  tarix: 'myRides.phaseTarix',
};

export const EMPTY_KEY: Record<RidePhase, string> = {
  jarayon: 'myRides.emptyJarayon',
  faol: 'myRides.emptyFaol',
  tarix: 'myRides.emptyTarix',
};

/** Seats actually sold — confirmed passengers only; a pending request holds nothing. */
export const seatsTaken = (r: RideLike): number => {
  const total = Math.max(0, r.seats_total | 0);
  const free = Math.max(0, r.seats_free | 0);
  return Math.min(total, Math.max(0, total - free));
};

export const isFull = (r: RideLike): boolean => r.seats_total > 0 && seatsTaken(r) >= r.seats_total;

export const ridePhase = (r: RideLike): RidePhase => {
  if (r.status === 'archived' || r.status === 'cancelled') return 'tarix';
  return isFull(r) ? 'faol' : 'jarayon';
};

/** The state pill on the card: Yig'ilmoqda · Tasdiqlangan · Yakunlangan · Bekor qilingan. */
export const ridePillKey = (r: RideLike): string => {
  if (r.status === 'cancelled') return 'driverOffers.status.cancelled';
  if (r.status === 'archived') return 'myRides.stateDone';
  return isFull(r) ? 'myRides.stateConfirmed' : 'myRides.stateCollecting';
};

export const ridePillTone = (r: RideLike): PillTone => {
  if (r.status === 'cancelled') return 'bad';
  if (r.status === 'archived') return 'neutral';
  return isFull(r) ? 'ok' : 'wait';
};

/** The artboard's "Buyurtma to'ldi / O'rindiqlar to'lmagan" — a READOUT here (decision ②). */
export const fillKey = (r: RideLike): string => (isFull(r) ? 'myRides.fillFull' : 'myRides.fillOpen');

const startMs = (r: RideLike): number => {
  const ms = new Date(r.start_at).getTime();
  return Number.isFinite(ms) ? ms : Number.NaN;
};

/** A published ride whose departure has passed — decision ③: hint + the Archive action. */
export const isPast = (r: RideLike, nowMs: number): boolean => {
  const ms = startMs(r);
  return Number.isFinite(ms) && ms < nowMs;
};

// ------------------------------------------------------------------------------ actions

/*
 * Lifted from `OffersListScreen` / `OfferDetailModal` and the server's own preconditions
 * (`DriverOfferService`: cancel = published only; publish = archived|cancelled only;
 * delete = archived|cancelled only; archive = any). Edit refuses archived/cancelled — the
 * old screen toasted an error for those; here the pencil is simply not drawn.
 */
export const canEdit = (r: RideLike): boolean => r.status === 'published';
export const canCancel = (r: RideLike): boolean => r.status === 'published';
export const canArchive = (r: RideLike): boolean => r.status === 'published';
export const canPublish = (r: RideLike): boolean => r.status === 'archived' || r.status === 'cancelled';
export const canDelete = (r: RideLike): boolean => r.status === 'archived' || r.status === 'cancelled';

// ------------------------------------------------------------------------------ stats

export const isLiveBooking = (b: BookingLike): boolean =>
  b.status === 'pending' || b.status === 'confirmed';

/** A booking's money: the stored total, or per-seat × seats when the total is missing. */
export const priceFormula = (b: BookingLike): PriceFormula => {
  const seats = Math.max(1, b.seats_requested | 0);
  const total = money(b.total_agreed_price);
  const perSeat = money(b.agreed_price_per_seat) || (total ? Math.ceil(total / seats) : 0);
  return { perSeat, seats, total: total || perSeat * seats };
};

export const rideStats = (r: RideLike, bookings: readonly BookingLike[] | null): RideStats => {
  const taken = seatsTaken(r);
  const total = Math.max(0, r.seats_total | 0);
  if (!bookings) return { taken, total, orders: null, money: null };
  const orders = bookings.filter(isLiveBooking).length;
  const sum = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((s, b) => s + priceFormula(b).total, 0);
  return { taken, total, orders, money: sum };
};

/** "kutilayotgan daromad" while the ride is live, "olingan daromad" once it is history. */
export const moneyLabelKey = (phase: RidePhase): string =>
  phase === 'tarix' ? 'myRides.incomeEarned' : 'myRides.incomeExpected';

// ------------------------------------------------------------------------------ bookings

export const bookingLabelKey = (s: BookingStatus): string => `offerPassengers.${s}`;

export const bookingTone = (s: BookingStatus): PillTone => {
  switch (s) {
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

export const canConfirm = (b: BookingLike): boolean => b.status === 'pending';
export const canReject = (b: BookingLike): boolean => b.status === 'pending';

/** T-055 — the server sends the number only on a confirmed row; the status check stays anyway. */
export const phoneUnlocked = (b: BookingLike): boolean =>
  b.status === 'confirmed' && !!b.passenger?.phone_e164;

/** Which existing `offerPassengers.*` key describes the seats, and the count it needs. */
export const seatLabel = (b: BookingLike): { key: string; count: number } => {
  const count = Math.max(1, b.seats_requested | 0);
  if (b.is_front_seat && count === 1) return { key: 'offerPassengers.frontSeatRequested', count };
  if (count === 1) return { key: 'offerPassengers.seatsRequestedOne', count };
  return { key: 'offerPassengers.seatsRequested', count };
};

// ------------------------------------------------------------------------------ reject sheet

/** The artboard's nine reasons, in its order; the last one opens a free-text field. */
export const REJECT_REASON_KEYS: readonly string[] = [
  'myRides.reasonCarBroken',
  'myRides.reasonCarNotRunning',
  'myRides.reasonNoFuel',
  'myRides.reasonPassengerLied',
  'myRides.reasonNoAnswer',
  'myRides.reasonNotLeftHome',
  'myRides.reasonNotAtAddress',
  'myRides.reasonWrongAddress',
  'myRides.reasonOther',
];
export const REJECT_REASON_OTHER = 'myRides.reasonOther';

export const isRejectValid = (reasonKey: string | null, otherText: string): boolean => {
  if (!reasonKey || !REJECT_REASON_KEYS.includes(reasonKey)) return false;
  return reasonKey !== REJECT_REASON_OTHER || otherText.trim().length > 0;
};

/** The text that goes to `rejection_reason` — the translated reason, or the typed one. */
export const rejectReasonText = (
  reasonKey: string,
  otherText: string,
  translate: (key: string) => string,
): string => (reasonKey === REJECT_REASON_OTHER ? otherText.trim() : translate(reasonKey));

// ------------------------------------------------------------------------------ list

const updatedMs = (r: RideLike): number => {
  const ms = new Date(r.updated_at || r.created_at || '').getTime();
  return Number.isFinite(ms) ? ms : 0;
};

/** Live phases: soonest departure first, unparseable dates LAST. History: newest change first. */
export const sortRides = <T extends RideLike>(rides: readonly T[], phase: RidePhase): T[] => {
  const copy = [...rides];
  if (phase === 'tarix') return copy.sort((a, b) => updatedMs(b) - updatedMs(a));
  return copy.sort((a, b) => {
    const am = startMs(a);
    const bm = startMs(b);
    if (Number.isNaN(am) && Number.isNaN(bm)) return 0;
    if (Number.isNaN(am)) return 1;
    if (Number.isNaN(bm)) return -1;
    return am - bm;
  });
};

export const groupByPhase = <T extends RideLike>(rides: readonly T[]): Record<RidePhase, T[]> => {
  const out: Record<RidePhase, T[]> = { jarayon: [], faol: [], tarix: [] };
  for (const r of rides) out[ridePhase(r)].push(r);
  for (const p of PHASES) out[p] = sortRides(out[p], p);
  return out;
};

/** Push payloads carry ids as strings; `DriverOffer.id` is a string typed over an integer (T-085). */
export const sameOfferId = (a: string | number | null | undefined, b: string | number | null | undefined): boolean =>
  a != null && b != null && String(a) === String(b);

/** One card open by default (the artboard): the requested one if it is in this phase, else the first. */
export const defaultExpandedId = <T extends RideLike>(
  rides: readonly T[],
  requested: string | number | null | undefined,
): string | null => {
  if (requested != null) {
    const hit = rides.find((r) => sameOfferId(r.id, requested));
    if (hit) return String(hit.id);
  }
  return rides.length ? String(rides[0].id) : null;
};
