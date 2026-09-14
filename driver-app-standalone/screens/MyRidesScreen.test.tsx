/**
 * T-118 step 10 — the driver's own rides (CHECKLIST §8), T-101 step 18's merge of
 * `OffersListScreen` + `OfferPassengersScreen`: three DERIVED phases, each card expanding to
 * its passengers, confirm, and the artboard's nine-reason reject sheet.
 *
 * What this pins, as a driver works it:
 *   ① the phases are derived from the rows (`ridePhase`: collecting / full / done), the pills
 *      carry the counts, the first ride expands and its passengers load; a pending passenger
 *      offers confirm + reject, a confirmed one offers the call button (T-054);
 *   ② confirming asks (name + seats), calls the API with THAT join's id, then reloads — and
 *      because the phase is derived, a ride that filled up MOVES from Jarayonda to Faol;
 *   ③ rejecting with a listed reason sends that reason's TEXT;
 *   ④ "Boshqa" needs typed text before the sheet's button enables, and sends what was typed.
 */
import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { getDriverOffers, type DriverOffer } from '../api/driverOffers';
import {
  confirmPassenger,
  getOfferPassengers,
  rejectPassenger,
  type OfferPassenger,
} from '../api/offerPassengers';
import { renderScreen } from '../test/render';
import uz from '../translations/uz';
import { MyRidesScreen } from './MyRidesScreen';

jest.mock('../api/driverOffers');
jest.mock('../api/offerPassengers');
jest.mock('../utils/toast');

const TOKEN = 'test-access-token';
const HOUR = 60 * 60 * 1000;
const at = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

const ride = (
  id: string,
  status: DriverOffer['status'],
  seatsFree: number,
  startOffsetMs: number,
): DriverOffer =>
  ({
    id,
    user_id: 7,
    vehicle_id: 'veh-1',
    from_text: 'Qoqon',
    to_text: 'Toshkent',
    start_at: at(startOffsetMs),
    seats_total: 4,
    seats_free: seatsFree,
    price_per_seat: 60000,
    currency: 'UZS',
    status,
    created_at: at(-HOUR),
    updated_at: at(-HOUR),
  }) as unknown as DriverOffer;

// Ride ids are numeric strings on the wire: the screen calls the passengers API with Number(id).
const RIDE_OPEN = ride('101', 'published', 2, +24 * HOUR); // collecting → Jarayonda
const RIDE_FULL = ride('102', 'published', 0, +24 * HOUR); // full → Faol
const RIDE_DONE = ride('103', 'archived', 4, -24 * HOUR); // → Tarix
const RIDE_CANCELLED = ride('104', 'cancelled', 4, +24 * HOUR); // → Tarix

const passenger = (
  id: string,
  name: string,
  status: OfferPassenger['status'],
  seats: number,
  phone: string,
): OfferPassenger => ({
  id,
  offer_id: 101,
  passenger_id: Number(id.replace(/[^0-9]/g, '')),
  seats_requested: seats,
  is_front_seat: false,
  agreed_price_per_seat: 60000,
  total_agreed_price: 60000 * seats,
  currency: 'UZS',
  status,
  created_at: at(-2 * HOUR),
  updated_at: at(-2 * HOUR),
  passenger: {
    id: Number(id.replace(/[^0-9]/g, '')),
    first_name: name.split(' ')[0],
    last_name: name.split(' ')[1],
    display_name: name,
    phone_e164: phone,
  },
});

const PENDING = passenger('j-1', 'Ali Valiyev', 'pending', 2, '+998901110001');
const CONFIRMED = passenger('j-2', 'Vali Karimov', 'confirmed', 1, '+998901110002');

const R = uz.myRides;
const P = uz.offerPassengers;
const tab = (label: string, count: number) => screen.getByRole('tab', { name: `${label}, ${count}` });
const lastByText = (text: string) => {
  const all = screen.getAllByText(text);
  return all[all.length - 1];
};

let confirmedOnServer: boolean;

beforeEach(() => {
  confirmedOnServer = false;
  jest.mocked(getDriverOffers).mockImplementation(async () => ({
    success: true,
    offers: [
      confirmedOnServer ? { ...RIDE_OPEN, seats_free: 0 } : RIDE_OPEN,
      RIDE_FULL,
      RIDE_DONE,
      RIDE_CANCELLED,
    ],
  }));
  jest.mocked(getOfferPassengers).mockImplementation(async (_token, offerId) =>
    offerId === 101
      ? [confirmedOnServer ? { ...PENDING, status: 'confirmed' } : PENDING, CONFIRMED]
      : [],
  );
  jest.mocked(confirmPassenger).mockImplementation(async () => {
    confirmedOnServer = true;
    return { ...PENDING, status: 'confirmed' };
  });
  jest.mocked(rejectPassenger).mockResolvedValue({ ...PENDING, status: 'rejected' });
});

const mount = async () => {
  await renderScreen(<MyRidesScreen />);
  await waitFor(() => expect(getDriverOffers).toHaveBeenCalledWith(TOKEN, {}));
  await waitFor(() => expect(tab(R.phaseJarayon, 1)).toBeOnTheScreen());
  // The first ride of the phase expands by itself and its passengers load.
  await waitFor(() => expect(getOfferPassengers).toHaveBeenCalledWith(TOKEN, 101));
  await screen.findByText('Ali Valiyev');
};

describe('MyRidesScreen', () => {
  it('derives the three phases, expands the first ride, and offers the right actions per passenger', async () => {
    await mount();
    expect(tab(R.phaseJarayon, 1)).toBeSelected();
    expect(tab(R.phaseFaol, 1)).toBeOnTheScreen();
    expect(tab(R.phaseTarix, 2)).toBeOnTheScreen();
    expect(screen.getByText(R.ordersCount.replace('{count}', '2'))).toBeOnTheScreen();

    // Pending: confirm + reject. Confirmed: the call button and the number, no confirm.
    expect(screen.getByText('Ali Valiyev')).toBeOnTheScreen();
    expect(screen.getByText('Vali Karimov')).toBeOnTheScreen();
    expect(screen.getAllByText(P.confirm)).toHaveLength(1);
    expect(screen.getAllByLabelText(P.reject)).toHaveLength(1);
    expect(screen.getAllByLabelText(P.contactTitle)).toHaveLength(1);
    expect(screen.getByText(P.seatsRequested.replace('{count}', '2'))).toBeOnTheScreen();
    expect(screen.getByText(P.seatsRequestedOne)).toBeOnTheScreen();

    // Switching phase expands that phase's first ride and loads ITS passengers.
    fireEvent.press(tab(R.phaseTarix, 2));
    expect(tab(R.phaseTarix, 2)).toBeSelected();
    await waitFor(() => expect(getOfferPassengers).toHaveBeenCalledWith(TOKEN, 103));
  });

  it('confirming asks with name and seats, confirms THAT join, reloads, and the full ride moves phase', async () => {
    await mount();
    fireEvent.press(screen.getByText(P.confirm));

    expect(await screen.findByText(P.confirmPassenger)).toBeOnTheScreen();
    expect(
      screen.getByText(
        P.confirmPassengerMessage.replace('{name}', 'Ali Valiyev').replace('{seats}', '2'),
      ),
    ).toBeOnTheScreen();
    fireEvent.press(lastByText(P.confirm));

    await waitFor(() => expect(confirmPassenger).toHaveBeenCalledWith(TOKEN, 'j-1'));
    expect(confirmPassenger).toHaveBeenCalledTimes(1);
    expect(rejectPassenger).not.toHaveBeenCalled();
    // Re-fetched, re-bucketed: ride 101 is now full, so Jarayonda empties and Faol grows.
    await waitFor(() => expect(tab(R.phaseJarayon, 0)).toBeOnTheScreen());
    expect(tab(R.phaseFaol, 2)).toBeOnTheScreen();
    expect(screen.getByText(R.emptyJarayon)).toBeOnTheScreen();
  });

  it('rejecting with a listed reason sends that reason as text', async () => {
    await mount();
    fireEvent.press(screen.getByLabelText(P.reject));

    expect(await screen.findByText(P.rejectPassenger)).toBeOnTheScreen();
    fireEvent.press(screen.getByText(R.reasonNoAnswer));
    fireEvent.press(lastByText(P.reject));

    await waitFor(() => expect(rejectPassenger).toHaveBeenCalledWith(TOKEN, 'j-1', R.reasonNoAnswer));
    expect(rejectPassenger).toHaveBeenCalledTimes(1);
    expect(confirmPassenger).not.toHaveBeenCalled();
  });

  it('"Boshqa" needs typed text before the button enables, and sends what was typed', async () => {
    await mount();
    fireEvent.press(screen.getByLabelText(P.reject));
    await screen.findByText(P.rejectPassenger);

    fireEvent.press(screen.getByText(R.reasonOther));
    const buttons = screen.getAllByRole('button', { name: P.reject });
    const sheetButton = buttons[buttons.length - 1];
    expect(sheetButton).toBeDisabled();
    fireEvent.press(sheetButton);
    expect(rejectPassenger).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByPlaceholderText(P.rejectReasonPlaceholder), '  Bolam kasal  ');
    expect(sheetButton).toBeEnabled();
    fireEvent.press(sheetButton);

    await waitFor(() => expect(rejectPassenger).toHaveBeenCalledWith(TOKEN, 'j-1', 'Bolam kasal'));
  });
});
