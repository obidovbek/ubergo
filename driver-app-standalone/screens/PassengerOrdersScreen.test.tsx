/**
 * T-118 step 6 — the driver's side of CHECKLIST §7: seeing passenger orders and answering
 * them. The screen T-101 step 17 merged three old screens into: the incoming list, the sent
 * list, the detail-and-offer sheet (17e) and the result dialog (17f).
 *
 * What this pins, as a driver works it:
 *   ① incoming mode lists the search results MINUS the orders this driver already bid on;
 *   ② a card opens the sheet; ACCEPT at the listed price joins with the driver's vehicle, the
 *      seats the order needs and the listed per-seat price — after the confirm dialog;
 *   ③ a COUNTER-OFFER sends thousands × 1000 PER SEAT (not a total) and the seats needed, then
 *      the result dialog moves the list to sent mode;
 *   ④ sent mode: a pending request shows cancel and hides the phone (T-054); confirming the
 *      cancel calls the API with that request's id; a confirmed request shows the phone.
 *
 * The API layer is mocked with the pure helpers (`passengerNameOf` etc.) left REAL — an
 * automock would blank the passenger's name and the phone.
 */
import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { getDriverProfile } from '../api/driver';
import {
  cancelJoinRequest,
  getMyJoinRequests,
  joinPassengerOffer,
  searchPassengerOffers,
  type OfferDriver,
  type PassengerOffer,
} from '../api/passengerOffers';
import { renderScreen } from '../test/render';
import uz from '../translations/uz';
import PassengerOrdersScreen from './PassengerOrdersScreen';

jest.mock('../api/passengerOffers', () => ({
  ...(jest.requireActual('../api/passengerOffers') as object),
  searchPassengerOffers: jest.fn(),
  getMyJoinRequests: jest.fn(),
  getPassengerOfferById: jest.fn(),
  joinPassengerOffer: jest.fn(),
  cancelJoinRequest: jest.fn(),
}));
jest.mock('../api/driver');
jest.mock('../utils/toast');

const TOKEN = 'test-access-token';
const SOON = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

const order = (id: number, name: string, phone: string): PassengerOffer => ({
  id,
  from_text: 'Qoqon',
  to_text: 'Toshkent',
  start_at: SOON,
  max_price_per_seat: 50000,
  currency: 'UZS',
  payment_cash: true,
  seats_needed: 2,
  seat_counts: { front_male: 0, front_female: 0, back_male: 2, back_female: 0 },
  passenger: { id, name },
  user: { id, first_name: name.split(' ')[0], last_name: name.split(' ')[1], phone_e164: phone },
});

const ORDER_A = order(101, 'Ali Valiyev', '+998901110001');
const ORDER_B = order(102, 'Bobur Karimov', '+998901110002');
const ORDER_C = order(103, 'Dilnoza Rahimova', '+998901110003');

const request = (id: string, offer: PassengerOffer, status: OfferDriver['status']): OfferDriver => ({
  id,
  offer_id: offer.id,
  driver_id: 7,
  vehicle_id: 'veh-1',
  seats_offered: 2,
  offered_price_per_seat: 45000,
  total_offered_price: 90000,
  currency: 'UZS',
  status,
  created_at: '2026-09-13T10:00:00.000Z',
  updated_at: '2026-09-13T10:00:00.000Z',
  offer,
});

const REQ_PENDING = request('req-b', ORDER_B, 'pending');
const REQ_CONFIRMED = request('req-c', ORDER_C, 'confirmed');

const VEHICLE_PROFILE = {
  profile: {
    vehicle: {
      id: 'veh-1',
      make: { name_uz: 'Chevrolet' },
      model: { name_uz: 'Cobalt' },
      license_plate: '01 A 123 BC',
    },
  },
};

const T = uz.passengerOrders;

const cardOf = (o: PassengerOffer) => screen.getByRole('button', { name: new RegExp(`^${o.passenger?.name}`) });
const flush = () =>
  act(async () => {
    await Promise.resolve();
  });

beforeEach(() => {
  jest.mocked(searchPassengerOffers).mockResolvedValue({ items: [ORDER_A, ORDER_B], total: 2 });
  jest.mocked(getMyJoinRequests).mockResolvedValue([REQ_PENDING, REQ_CONFIRMED]);
  jest.mocked(getDriverProfile).mockResolvedValue(VEHICLE_PROFILE as never);
  jest.mocked(joinPassengerOffer).mockResolvedValue(REQ_PENDING);
  jest.mocked(cancelJoinRequest).mockResolvedValue({ ...REQ_PENDING, status: 'cancelled' });
});

const mount = async (mode: 'incoming' | 'sent' = 'incoming') => {
  await renderScreen(<PassengerOrdersScreen />, { params: { mode } });
  await waitFor(() => expect(searchPassengerOffers).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(getMyJoinRequests).toHaveBeenCalledWith(TOKEN));
};

/** Open a card's sheet and wait for the driver's vehicle to be known to it. */
const openIncoming = async (o: PassengerOffer) => {
  fireEvent.press(await waitFor(() => cardOf(o)));
  expect(await screen.findByText(`${T.code} #${o.id}`)).toBeOnTheScreen();
  await waitFor(() => expect(getDriverProfile).toHaveBeenCalledWith(TOKEN));
  await flush();
};

describe('PassengerOrdersScreen', () => {
  it('incoming mode lists the search results minus the orders already bid on', async () => {
    await mount();
    expect(await waitFor(() => cardOf(ORDER_A))).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Bobur Karimov/ })).not.toBeOnTheScreen();
    expect(screen.getByText(`1 ${T.countOrders}`)).toBeOnTheScreen();
    expect(screen.getByText(T.titleIncoming)).toBeOnTheScreen();
  });

  it('accept at the listed price joins with the vehicle, the seats needed and that price', async () => {
    await mount();
    await openIncoming(ORDER_A);

    fireEvent.press(screen.getByText(T.accept));
    // The confirm dialog repeats the total and the accept label; its button is the last one.
    expect(await screen.findByText(T.acceptConfirmTitle)).toBeOnTheScreen();
    const accepts = screen.getAllByText(T.accept);
    fireEvent.press(accepts[accepts.length - 1]);

    await waitFor(() => expect(joinPassengerOffer).toHaveBeenCalledTimes(1));
    expect(joinPassengerOffer).toHaveBeenCalledWith(TOKEN, ORDER_A.id, {
      vehicle_id: 'veh-1',
      seats_offered: 2,
      offered_price_per_seat: 50000,
    });
    expect(await screen.findByText(T.resultAcceptTitle)).toBeOnTheScreen();
  });

  it('a counter-offer sends the per-seat price and the seats needed, then lands in sent mode', async () => {
    await mount();
    await openIncoming(ORDER_A);

    // "Taklif yuborish" is also the list's mode label; the sheet's button is the last one.
    const offerButtons = screen.getAllByText(T.offer);
    fireEvent.press(offerButtons[offerButtons.length - 1]);
    const perSeat = screen.getByLabelText(uz.passengerOfferDetails.pricePerSeat);
    // Seeded from the listed 50 000; the driver asks 45 (thousands) per seat instead.
    expect(perSeat).toHaveDisplayValue('50');
    fireEvent.changeText(perSeat, '45');
    fireEvent.press(screen.getByText(T.sendOffer));

    await waitFor(() => expect(joinPassengerOffer).toHaveBeenCalledTimes(1));
    expect(joinPassengerOffer).toHaveBeenCalledWith(TOKEN, ORDER_A.id, {
      vehicle_id: 'veh-1',
      seats_offered: 2,
      offered_price_per_seat: 45000,
      message: undefined,
    });

    expect(await screen.findByText(uz.passengerOfferDetails.sentTitle)).toBeOnTheScreen();
    fireEvent.press(screen.getByText(T.close));
    expect(await screen.findByText(T.titleSent)).toBeOnTheScreen();
  });

  it('sent mode: pending shows cancel and hides the phone; confirmed shows the phone', async () => {
    await mount('sent');
    expect(screen.getByText(T.titleSent)).toBeOnTheScreen();

    // Pending: the phone is gated (T-054) and the request can be cancelled.
    fireEvent.press(await waitFor(() => cardOf(ORDER_B)));
    expect(await screen.findByText(`${T.code} #${ORDER_B.id}`)).toBeOnTheScreen();
    expect(screen.getByText(T.phoneHidden)).toBeOnTheScreen();
    fireEvent.press(screen.getByText(uz.myJoinRequests.cancel));
    expect(await screen.findByText(uz.myJoinRequests.cancelTitle)).toBeOnTheScreen();
    fireEvent.press(screen.getByText(uz.myJoinRequests.cancelConfirm));
    await waitFor(() => expect(cancelJoinRequest).toHaveBeenCalledWith(TOKEN, REQ_PENDING.id));

    // Confirmed: the gate opens — no "hidden" line, no "no phone" line.
    fireEvent.press(await waitFor(() => cardOf(ORDER_C)));
    expect(await screen.findByText(`${T.code} #${ORDER_C.id}`)).toBeOnTheScreen();
    expect(screen.queryByText(T.phoneHidden)).not.toBeOnTheScreen();
    expect(screen.queryByText(uz.myJoinRequests.noPhone)).not.toBeOnTheScreen();
    expect(screen.queryByText(uz.myJoinRequests.cancel)).not.toBeOnTheScreen();
  });
});
