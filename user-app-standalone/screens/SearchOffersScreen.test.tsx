/**
 * T-102i — the passenger's search, "for your order".
 *
 * Until T-102i a passenger ordering *Tuman ichi* picked a QFY and nothing compared it: the
 * hand-off to this screen carried the province and district only. Now the order's scope and
 * QFYs travel with it, the search sends them, and the server matches that side at the QFY.
 *
 * What this pins, as a passenger meets it:
 *   ① arriving from an order: the scope and BOTH QFYs are sent, and a chip names the order;
 *   ② clearing the chip returns to the plain search — no scope, no QFYs — exactly as before;
 *   ③ an offer that matched only because its driver named the district says so on the card;
 *   ④ a route with no order behind it is searched exactly as it always was.
 */
import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { searchOffers, type DriverOffer } from '../api/offers';
import { renderScreen } from '../test/render';
import uz from '../translations/uz';
import SearchOffersScreen from './SearchOffersScreen';

// Only the network call is replaced; the module's helpers stay real for the card to use.
jest.mock('../api/offers', () => ({
  ...(jest.requireActual('../api/offers') as object),
  searchOffers: jest.fn(),
}));
jest.mock('../api/passengerOffers');
jest.mock('../utils/toast');

const S = uz.searchOffers;

const FARGONA = { id: 10, name: "Farg'ona viloyati" };
const QOQON = { id: 101, name: "Qo'qon" };
const RISHTON = { id: 102, name: 'Rishton' };
const YAYPAN = { id: 1001, name: 'Yaypan' };
const CHIMYON = { id: 1002, name: 'Chimyon' };

/** What the order form hands over after a *Tuman ichi*-style order with a QFY on each end. */
const ORDER_HANDOFF = {
  fromProvince: FARGONA,
  fromCity: QOQON,
  fromSettlement: YAYPAN,
  toProvince: FARGONA,
  toCity: RISHTON,
  toSettlement: CHIMYON,
  scope: 'tuman',
};

const offerRow = (id: number, precision?: 'exact' | 'district'): DriverOffer =>
  ({
    id,
    from_text: "Qo'qon",
    to_text: 'Rishton',
    start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    price_per_seat: 60000,
    currency: 'UZS',
    seats_free: 3,
    seats_total: 4,
    vehicle_class: 'standard',
    ...(precision ? { match_precision: precision } : {}),
    driver: { id: 5, name: 'Akmal', rating: 4.8, rating_count: 3 },
    vehicle: { make: 'Chevrolet', model: 'Cobalt', color: 'Oq', license_plate: '01A123BC', year: 2020 },
  }) as unknown as DriverOffer;

const lastQuery = () => {
  const calls = jest.mocked(searchOffers).mock.calls;
  return calls[calls.length - 1]![0];
};

beforeEach(() => {
  jest.mocked(searchOffers).mockReset();
  jest.mocked(searchOffers).mockResolvedValue({ items: [], total: 0 });
});

describe('SearchOffersScreen — for your order (T-102i)', () => {
  it('① sends the order’s scope and BOTH QFYs, and names the order in a chip', async () => {
    await renderScreen(<SearchOffersScreen />, { params: ORDER_HANDOFF });

    await waitFor(() =>
      expect(searchOffers).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'tuman',
          from_city_id: QOQON.id,
          from_settlement_id: YAYPAN.id,
          to_city_id: RISHTON.id,
          to_settlement_id: CHIMYON.id,
        }),
      ),
    );
    expect(screen.getByText(`${S.forYourOrder} · ${uz.menu.scopeTuman}`)).toBeOnTheScreen();
  });

  it('② clearing the chip returns to the plain search — no scope, no QFYs', async () => {
    await renderScreen(<SearchOffersScreen />, { params: ORDER_HANDOFF });
    await waitFor(() => expect(searchOffers).toHaveBeenCalled());

    fireEvent.press(screen.getByLabelText(S.clearOrderMatch));

    await waitFor(() => expect('scope' in lastQuery()).toBe(false));
    expect(lastQuery()).not.toHaveProperty('from_settlement_id');
    expect(lastQuery()).not.toHaveProperty('to_settlement_id');
    // …and still the same route, at the district.
    expect(lastQuery()).toEqual(expect.objectContaining({ from_city_id: QOQON.id, to_city_id: RISHTON.id }));
    expect(screen.queryByText(`${S.forYourOrder} · ${uz.menu.scopeTuman}`)).toBeNull();
  });

  it('③ a district-level match says so on the card; an exact one does not', async () => {
    jest
      .mocked(searchOffers)
      .mockResolvedValue({ items: [offerRow(1, 'district'), offerRow(2, 'exact')], total: 2 });

    await renderScreen(<SearchOffersScreen />, { params: ORDER_HANDOFF });

    expect(await screen.findAllByText(S.matchedDistrictOnly)).toHaveLength(1);
  });
});

describe('SearchOffersScreen — the plain search is unchanged (T-102i)', () => {
  it('④ a route with no order behind it sends no scope and no QFYs, and shows no chip', async () => {
    // The same route, handed over the pre-T-102i way: no QFYs, no scope.
    const plainRoute = { fromProvince: FARGONA, fromCity: QOQON, toProvince: FARGONA, toCity: RISHTON };

    await renderScreen(<SearchOffersScreen />, { params: plainRoute });

    await waitFor(() => expect(searchOffers).toHaveBeenCalled());
    expect('scope' in lastQuery()).toBe(false);
    expect(lastQuery()).not.toHaveProperty('from_settlement_id');
    expect(screen.queryByLabelText(S.clearOrderMatch)).toBeNull();
  });
});
