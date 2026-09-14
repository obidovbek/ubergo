/**
 * T-118 step 9 — the passenger's merged order list (CHECKLIST §4), T-101 step 9's screen that
 * replaced TWO screens: my ride REQUESTS (passenger offers) and my BOOKINGS (joins on drivers'
 * trips), in three lifecycle MODES decided by `utils/orderLifecycle.ts`.
 *
 * What this pins, as a passenger works it:
 *   ① ONE fetch per source per visit (T-051), every row lands in exactly one mode, and the
 *      count pills say how many — "Jarayonda 2 · Faol 2 · Tarix 3" for this fixture;
 *   ② switching modes filters in memory: no new request, the right rows, the confirmed
 *      booking's call button (T-054), the finished booking's rate button;
 *   ③ cancelling a request asks first, then calls the API with THAT id and reloads;
 *   ④ cancelling a booking calls the join-cancel API with the token and THAT booking's id.
 *
 * `driverPhoneOf` is left real; fixtures are typed by assertion because the API types carry
 * many fields the screen never reads.
 */
import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { cancelJoin, getMyBookings, type DriverOffer, type OfferPassenger } from '../api/offers';
import {
  cancelPassengerOffer,
  getMyPassengerOffers,
  type PassengerOffer,
} from '../api/passengerOffers';
import { renderScreen } from '../test/render';
import uz from '../translations/uz';
import { formatContactPhone } from '../utils/contactPhone';
import MyOrdersScreen from './MyOrdersScreen';

jest.mock('../api/passengerOffers', () => ({
  ...(jest.requireActual('../api/passengerOffers') as object),
  getMyPassengerOffers: jest.fn(),
  cancelPassengerOffer: jest.fn(),
}));
jest.mock('../api/offers', () => ({
  ...(jest.requireActual('../api/offers') as object),
  getMyBookings: jest.fn(),
  cancelJoin: jest.fn(),
  rateDriver: jest.fn(),
}));
jest.mock('../utils/toast');

const TOKEN = 'test-access-token';
const HOUR = 60 * 60 * 1000;
const at = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();
const PHONE = '+998901234567';

const request = (id: number, status: string, startOffsetMs: number): PassengerOffer =>
  ({
    id,
    user_id: 1,
    from_text: 'Qoqon',
    to_text: 'Toshkent',
    start_at: at(startOffsetMs),
    seats_needed: 2,
    max_price_per_seat: 50000,
    currency: 'UZS',
    status,
    drivers: [],
    created_at: at(-id * HOUR),
  }) as unknown as PassengerOffer;

const trip = (id: number, startOffsetMs: number): DriverOffer =>
  ({
    id,
    from_text: 'Fargona',
    to_text: 'Toshkent',
    start_at: at(startOffsetMs),
    price_per_seat: 60000,
    currency: 'UZS',
    seats_free: 2,
    seats_total: 4,
    user: { first_name: 'Akmal', last_name: 'Toshev', phone_e164: PHONE },
    vehicle: { make: 'Chevrolet', model: 'Cobalt' },
  }) as unknown as DriverOffer;

const booking = (id: string, status: OfferPassenger['status'], startOffsetMs: number): OfferPassenger =>
  ({
    id,
    offer_id: Number(id.replace(/[^0-9]/g, '')),
    passenger_id: 1,
    seats_requested: 1,
    is_front_seat: false,
    agreed_price_per_seat: 60000,
    total_agreed_price: 60000,
    currency: 'UZS',
    status,
    created_at: at(-2 * HOUR),
    updated_at: at(-2 * HOUR),
    offer: trip(Number(id.replace(/[^0-9]/g, '')), startOffsetMs),
  }) as OfferPassenger;

// jarayon: an open request, a pending booking
const REQ_OPEN = request(11, 'published', +24 * HOUR);
const BOOK_PENDING = booking('b-21', 'pending', +24 * HOUR);
// aktiv: a matched request, a confirmed booking still ahead
const REQ_MATCHED = request(12, 'driver_found', +24 * HOUR);
const BOOK_CONFIRMED = booking('b-22', 'confirmed', +24 * HOUR);
// tarix: an EXPIRED open request (past the 3-hour grace), a cancelled one, a finished booking
const REQ_EXPIRED = request(13, 'published', -5 * HOUR);
const REQ_CANCELLED = request(14, 'cancelled', +24 * HOUR);
const BOOK_DONE = booking('b-23', 'confirmed', -24 * HOUR);

const M = uz.myOrders;
const tab = (label: string, count: number) => screen.getByRole('tab', { name: `${label}, ${count}` });

beforeEach(() => {
  jest
    .mocked(getMyPassengerOffers)
    .mockResolvedValue([REQ_OPEN, REQ_MATCHED, REQ_EXPIRED, REQ_CANCELLED]);
  jest.mocked(getMyBookings).mockResolvedValue([BOOK_PENDING, BOOK_CONFIRMED, BOOK_DONE]);
  jest.mocked(cancelPassengerOffer).mockResolvedValue({ ...REQ_OPEN, status: 'cancelled' });
  jest.mocked(cancelJoin).mockResolvedValue({ ...BOOK_PENDING, status: 'cancelled' });
});

const mount = async () => {
  await renderScreen(<MyOrdersScreen />);
  await waitFor(() => expect(getMyPassengerOffers).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(getMyBookings).toHaveBeenCalledWith(TOKEN));
  await waitFor(() => expect(tab(M.modeJarayon, 2)).toBeOnTheScreen());
};

describe('MyOrdersScreen', () => {
  it('fetches once per source and buckets every row into one mode, counts on the pills', async () => {
    await mount();
    expect(tab(M.modeJarayon, 2)).toBeSelected();
    expect(tab(M.modeAktiv, 2)).toBeOnTheScreen();
    expect(tab(M.modeTarix, 3)).toBeOnTheScreen();
    // Jarayonda: the open request and the pending booking, nothing else.
    expect(screen.getAllByText(M.myRequest)).toHaveLength(1);
    expect(screen.getByText('Akmal')).toBeOnTheScreen();
    expect(screen.getByText(uz.passengerOffers.cancelRequest)).toBeOnTheScreen();
    expect(screen.getByText(uz.myBookings.cancelBooking)).toBeOnTheScreen();
    expect(screen.queryByText(uz.myBookings.rateDriver)).not.toBeOnTheScreen();
  });

  it('switching modes filters in memory: no new request, the right rows and actions', async () => {
    await mount();

    fireEvent.press(tab(M.modeAktiv, 2));
    expect(tab(M.modeAktiv, 2)).toBeSelected();
    expect(screen.getAllByText(M.myRequest)).toHaveLength(1);
    // The confirmed booking exposes the driver's number (T-054) — as a call button.
    expect(screen.getByLabelText(formatContactPhone(PHONE))).toBeOnTheScreen();
    expect(screen.queryByText(uz.myBookings.rateDriver)).not.toBeOnTheScreen();

    fireEvent.press(tab(M.modeTarix, 3));
    expect(screen.getAllByText(M.myRequest)).toHaveLength(2);
    expect(screen.getByText(uz.myBookings.rateDriver)).toBeOnTheScreen();
    // MEASURED, not assumed: the cancel buttons key off the RAW status, not the phase. The
    // expired request is still `published` on the server, so it keeps "cancel request"; the
    // cancelled one does not. The finished booking is still `confirmed`, so it keeps "cancel
    // booking". Whether history should offer either is an owner question (see PLAN notes).
    expect(screen.getAllByText(uz.passengerOffers.cancelRequest)).toHaveLength(1);
    expect(screen.getAllByText(uz.myBookings.cancelBooking)).toHaveLength(1);

    expect(getMyPassengerOffers).toHaveBeenCalledTimes(1);
    expect(getMyBookings).toHaveBeenCalledTimes(1);
  });

  it('cancelling a request asks, then cancels THAT request and reloads', async () => {
    await mount();
    fireEvent.press(screen.getByText(uz.passengerOffers.cancelRequest));
    expect(await screen.findByText(uz.passengerOffers.cancelConfirm)).toBeOnTheScreen();
    fireEvent.press(screen.getByText(uz.myBookings.yes));

    await waitFor(() => expect(cancelPassengerOffer).toHaveBeenCalledWith(REQ_OPEN.id));
    expect(cancelPassengerOffer).toHaveBeenCalledTimes(1);
    expect(cancelJoin).not.toHaveBeenCalled();
    await waitFor(() => expect(getMyPassengerOffers).toHaveBeenCalledTimes(2));
  });

  it('cancelling a booking asks, then cancels THAT join with the token', async () => {
    await mount();
    fireEvent.press(screen.getByText(uz.myBookings.cancelBooking));
    expect(await screen.findByText(uz.myBookings.cancelConfirm)).toBeOnTheScreen();
    fireEvent.press(screen.getByText(uz.myBookings.yes));

    await waitFor(() => expect(cancelJoin).toHaveBeenCalledWith(TOKEN, BOOK_PENDING.id));
    expect(cancelJoin).toHaveBeenCalledTimes(1);
    expect(cancelPassengerOffer).not.toHaveBeenCalled();
  });
});
