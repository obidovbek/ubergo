/**
 * T-118 step 7 — the passenger's side of CHECKLIST §7: the drivers who bid on my order, and
 * choosing one. T-101 step 10 rebuilt this screen; T-054 added the contact box.
 *
 * What this pins, as a passenger works it:
 *   ① every bid renders with the driver's name, car, terms and a status pill; no contact box
 *      while nothing is confirmed;
 *   ② ACCEPT names the driver AND the number of rivals that will be auto-rejected, then calls
 *      the API with that bid's id and reloads the list;
 *   ③ with no rival pending, the confirm message is the plain one — no count;
 *   ④ REJECT names the driver and calls the API with that bid's id, no reason;
 *   ⑤ a confirmed bid shows the contact box with the driver's phone, or the "no phone" line
 *      when the payload carries none (T-054).
 *
 * `driverNameOf` is left REAL so the names in the dialog are the names on the cards.
 */
import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import {
  confirmDriver,
  getOfferDrivers,
  rejectDriver,
  type OfferDriver,
} from '../api/passengerOffers';
import { renderScreen } from '../test/render';
import uz from '../translations/uz';
import OfferDriversScreen from './OfferDriversScreen';

jest.mock('../api/passengerOffers', () => ({
  ...(jest.requireActual('../api/passengerOffers') as object),
  getOfferDrivers: jest.fn(),
  confirmDriver: jest.fn(),
  rejectDriver: jest.fn(),
}));
jest.mock('../utils/toast');

const OFFER_ID = 501;
const T = uz.offerDrivers;

const bid = (
  id: string,
  name: string,
  status: OfferDriver['status'],
  phone: string | null = '+998901234567',
): OfferDriver => {
  const [first, last] = name.split(' ');
  return {
    id,
    offer_id: OFFER_ID,
    driver_id: Number(id.replace(/[^0-9]/g, '')),
    vehicle_id: `veh-${id}`,
    seats_offered: 2,
    offered_price_per_seat: 40000,
    total_offered_price: 80000,
    currency: 'UZS',
    status,
    created_at: '2026-09-13T10:00:00.000Z',
    updated_at: '2026-09-13T10:00:00.000Z',
    driver: { id: Number(id.replace(/[^0-9]/g, '')), first_name: first, last_name: last, display_name: name, phone_e164: phone },
    vehicle: {
      make: { name: 'Chevrolet' },
      model: { name: 'Cobalt' },
      color: { name: 'Oq' },
      type: { name: 'Sedan' },
      license_plate: '01 A 123 BC',
      year: 2022,
    },
  };
};

const AKMAL = bid('bid-1', 'Akmal Toshev', 'pending');
const BAHROM = bid('bid-2', 'Bahrom Umarov', 'pending');
const SARDOR = bid('bid-3', 'Sardor Yusupov', 'pending');

const mount = async (bids: OfferDriver[]) => {
  jest.mocked(getOfferDrivers).mockResolvedValue(bids);
  await renderScreen(<OfferDriversScreen />, { params: { offerId: OFFER_ID } });
  await waitFor(() => expect(getOfferDrivers).toHaveBeenCalledWith(OFFER_ID));
  await screen.findByText(bids[0].driver?.display_name ?? '');
};

/** The dialog renders after the list, so its button is the last with that label. */
const pressLast = (label: string) => {
  const all = screen.getAllByText(label);
  fireEvent.press(all[all.length - 1]);
};

beforeEach(() => {
  jest.mocked(confirmDriver).mockResolvedValue({ ...AKMAL, status: 'confirmed' });
  jest.mocked(rejectDriver).mockResolvedValue({ ...BAHROM, status: 'rejected' });
});

describe('OfferDriversScreen', () => {
  it('lists every bid with name, car, terms and status; no contact box yet', async () => {
    await mount([AKMAL, BAHROM, SARDOR]);
    for (const b of [AKMAL, BAHROM, SARDOR]) {
      expect(screen.getByText(b.driver?.display_name ?? '')).toBeOnTheScreen();
    }
    expect(screen.getAllByText('Chevrolet Cobalt Oq · 01 A 123 BC')).toHaveLength(3);
    expect(screen.getAllByText(T.seatsOffered.replace('{count}', '2'))).toHaveLength(3);
    expect(screen.getAllByText(T.status_pending)).toHaveLength(3);
    expect(screen.getAllByText(T.accept)).toHaveLength(3);
    expect(screen.queryByText(T.contactTitle)).not.toBeOnTheScreen();
  });

  it('accept names the driver and the rival count, then confirms that bid and reloads', async () => {
    await mount([AKMAL, BAHROM, SARDOR]);
    fireEvent.press(screen.getAllByText(T.accept)[0]);

    expect(await screen.findByText(T.acceptTitle)).toBeOnTheScreen();
    expect(
      screen.getByText(
        T.acceptMessageOthers.replace('{name}', 'Akmal Toshev').replace('{count}', '2'),
      ),
    ).toBeOnTheScreen();

    pressLast(T.accept);
    await waitFor(() => expect(confirmDriver).toHaveBeenCalledWith(AKMAL.id));
    expect(confirmDriver).toHaveBeenCalledTimes(1);
    expect(rejectDriver).not.toHaveBeenCalled();
    await waitFor(() => expect(getOfferDrivers).toHaveBeenCalledTimes(2));
  });

  it('with no rival pending, the confirm message carries no count', async () => {
    await mount([AKMAL, { ...BAHROM, status: 'rejected' }]);
    fireEvent.press(screen.getAllByText(T.accept)[0]);
    expect(await screen.findByText(T.acceptTitle)).toBeOnTheScreen();
    expect(screen.getByText(T.acceptMessage.replace('{name}', 'Akmal Toshev'))).toBeOnTheScreen();
  });

  it('reject names the driver and rejects that bid, with no reason', async () => {
    await mount([AKMAL, BAHROM]);
    fireEvent.press(screen.getAllByText(T.reject)[1]);

    expect(await screen.findByText(T.rejectTitle)).toBeOnTheScreen();
    expect(screen.getByText(T.rejectMessage.replace('{name}', 'Bahrom Umarov'))).toBeOnTheScreen();

    pressLast(T.reject);
    await waitFor(() => expect(rejectDriver).toHaveBeenCalledWith(BAHROM.id));
    expect(rejectDriver).toHaveBeenCalledTimes(1);
    expect(confirmDriver).not.toHaveBeenCalled();
  });

  it('a confirmed bid shows the contact box: the phone, or the no-phone line (T-054)', async () => {
    await mount([
      { ...AKMAL, status: 'confirmed' },
      bid('bid-4', 'Jasur Nazarov', 'confirmed', null),
      { ...BAHROM, status: 'rejected' },
    ]);
    expect(screen.getAllByText(T.contactTitle)).toHaveLength(2);
    expect(screen.getByText(/\+998 90 123 45 67|\+998901234567/)).toBeOnTheScreen();
    expect(screen.getByText(T.noPhone)).toBeOnTheScreen();
    // Nothing is pending any more: no accept, no reject.
    expect(screen.queryByText(T.accept)).not.toBeOnTheScreen();
    expect(screen.queryByText(T.reject)).not.toBeOnTheScreen();
  });
});
