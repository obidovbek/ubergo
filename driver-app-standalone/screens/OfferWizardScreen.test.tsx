/**
 * T-118 step 8 — the offer wizard's EDIT round trip (CHECKLIST §8), the UI-level guard for
 * the silent-blanking failure `utils/offerRestore.ts` exists for.
 *
 * The failure it defends (T-078, found live again in T-101 step 16e): a saved offer loads back
 * INCOMPLETE, the driver presses save without touching anything, and the next save writes the
 * blanks over real data — with nothing erroring. `check-offer-restore.mjs` proves the pure
 * helpers; this proves the SCREEN: every field the API returned leaves again, field for field.
 *
 * The fixture is deliberately the awkward shape pg sends: DECIMALs as strings, a legitimate
 * **0** (`pickup_fee`, `free_waiting_min`) and a legitimate **false** (`payment_card`) — the
 * two values a careless `||` erases. Its places carry one QFY on the `from` side and none on
 * the `to` side, so both `buildOfferPlaces` branches are exercised.
 */
import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import {
  fetchGeoCityDistricts,
  fetchGeoCountries,
  fetchGeoProvinces,
  fetchGeoSettlements,
  getDriverProfile,
  type GeoOption,
} from '../api/driver';
import { getDriverOfferById, updateDriverOffer, type DriverOffer } from '../api/driverOffers';
import { renderScreen } from '../test/render';
import uz from '../translations/uz';
import { OfferWizardScreen } from './OfferWizardScreen';

jest.mock('../api/driver');
jest.mock('../api/driverOffers');
jest.mock('../utils/toast');

const TOKEN = 'test-access-token';
const OFFER_ID = 'offer-42';

const UZ: GeoOption = { id: 1, name: 'Ozbekiston' };
const FARGONA: GeoOption = { id: 10, name: 'Fargona viloyati' };
const QOQON: GeoOption = { id: 101, name: 'Qoqon', latitude: 40.53, longitude: 70.94 };
const RISHTON: GeoOption = { id: 102, name: 'Rishton', latitude: 40.36, longitude: 71.28 };
const YAYPAN: GeoOption = { id: 1001, name: 'Yaypan' };

/** Tomorrow at a whole hour, local — inside the wizard's four-day schedule window. */
const tomorrowAt = (hour: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const START_AT = tomorrowAt(9);
const DEPART_UNTIL = tomorrowAt(11);
const ARRIVE_UNTIL = tomorrowAt(14);

const OFFER: DriverOffer = {
  id: OFFER_ID,
  user_id: 7,
  vehicle_id: 'veh-1',
  from_text: 'Qoqon, Fargona viloyati',
  from_lat: 40.53,
  from_lng: 70.94,
  to_text: 'Rishton, Fargona viloyati',
  to_lat: 40.36,
  to_lng: 71.28,
  start_at: START_AT,
  depart_until: DEPART_UNTIL,
  arrive_from: null,
  arrive_until: ARRIVE_UNTIL,
  seats_total: 4,
  seats_free: 4,
  price_per_seat: 60000,
  front_price_per_seat: 80000,
  price_back_salon: '150000.00',
  price_whole_salon: '240000.00',
  waiting_fee_per_min: '1000.00',
  free_waiting_min: 0,
  pickup_fee: '0.00',
  payment_cash: true,
  payment_card: false,
  vehicle_class: 'comfort',
  air_conditioner: true,
  wifi: false,
  roof_rack_needed: true,
  trailer: false,
  parcel_accepted: true,
  parcel_price: '20000.00',
  parcel_max_kg: 15,
  road_pickup: true,
  road_pickup_note: 'Yol chetidan ham olaman',
  departs_when_full: true,
  currency: 'UZS',
  note: 'Ehtiyot bolib haydayman',
  status: 'published',
  created_at: '2026-09-13T10:00:00.000Z',
  updated_at: '2026-09-13T10:00:00.000Z',
  vehicle: { id: 'veh-1', license_plate: '01 A 123 BC', make: { name: 'Chevrolet' }, model: { name: 'Cobalt' } },
  stops: [],
  places: [
    { id: 'pl-1', offer_id: OFFER_ID, direction: 'from', country_id: 1, province_id: 10, city_id: 101, settlement_id: 1001 },
    { id: 'pl-2', offer_id: OFFER_ID, direction: 'to', country_id: 1, province_id: 10, city_id: 102, settlement_id: null },
  ],
};

const PROFILE = {
  profile: {
    vehicle: {
      id: 'veh-1',
      make: { name_uz: 'Chevrolet' },
      model: { name_uz: 'Cobalt' },
      license_plate: '01 A 123 BC',
      year: 2022,
      seating_capacity: 4,
    },
  },
};

beforeEach(() => {
  jest.mocked(fetchGeoCountries).mockResolvedValue([UZ]);
  jest.mocked(fetchGeoProvinces).mockResolvedValue([FARGONA]);
  jest.mocked(fetchGeoCityDistricts).mockResolvedValue([QOQON, RISHTON]);
  jest.mocked(fetchGeoSettlements).mockResolvedValue([YAYPAN]);
  jest.mocked(getDriverProfile).mockResolvedValue(PROFILE as never);
  jest.mocked(getDriverOfferById).mockResolvedValue({ success: true, offer: OFFER });
  jest.mocked(updateDriverOffer).mockResolvedValue({ success: true, offer: OFFER });
});

const mountEdit = async () => {
  await renderScreen(<OfferWizardScreen />, { params: { offerId: OFFER_ID } });
  // The load walks countries → provinces → districts → QFYs → the vehicle; give it room.
  expect(await screen.findByText(uz.offerWizard.updateOffer, {}, { timeout: 8000 })).toBeOnTheScreen();
  expect(getDriverOfferById).toHaveBeenCalledWith(TOKEN, OFFER_ID);
};

describe('OfferWizardScreen — edit round trip', () => {
  it('restores the endpoints from the places rows, QFY included', async () => {
    await mountEdit();
    expect(fetchGeoSettlements).toHaveBeenCalledWith(QOQON.id);
    expect(fetchGeoSettlements).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(/Qoqon/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Rishton/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Yaypan/).length).toBeGreaterThan(0);
  });

  it('save without touching anything sends every field back, field for field', async () => {
    await mountEdit();
    fireEvent.press(screen.getByText(uz.offerWizard.updateOffer));
    await waitFor(() => expect(updateDriverOffer).toHaveBeenCalledTimes(1));

    expect(updateDriverOffer).toHaveBeenCalledWith(
      TOKEN,
      OFFER_ID,
      expect.objectContaining({
        vehicle_id: 'veh-1',
        from_text: OFFER.from_text,
        to_text: OFFER.to_text,
        from_lat: 40.53,
        from_lng: 70.94,
        to_lat: 40.36,
        to_lng: 71.28,
        start_at: START_AT,
        depart_until: DEPART_UNTIL,
        arrive_until: ARRIVE_UNTIL,
        seats_total: 4,
        price_per_seat: 60000,
        front_price_per_seat: 80000,
        // DECIMAL strings come back as numbers…
        price_back_salon: 150000,
        price_whole_salon: 240000,
        waiting_fee_per_min: 1000,
        parcel_price: 20000,
        // …and a real 0 stays 0, a real false stays false (the T-078 traps).
        free_waiting_min: 0,
        pickup_fee: 0,
        payment_cash: true,
        payment_card: false,
        vehicle_class: 'comfort',
        air_conditioner: true,
        wifi: false,
        roof_rack_needed: true,
        trailer: false,
        parcel_accepted: true,
        parcel_max_kg: 15,
        road_pickup: true,
        road_pickup_note: OFFER.road_pickup_note,
        departs_when_full: true,
        currency: 'UZS',
        note: OFFER.note,
        from_places: [{ country_id: 1, province_id: 10, city_id: 101, settlement_id: 1001 }],
        to_places: [{ country_id: 1, province_id: 10, city_id: 102, settlement_id: null }],
      }),
    );
    const sent = jest.mocked(updateDriverOffer).mock.calls[0][2];
    expect(sent.arrive_from).toBeUndefined();
    expect(sent.stops).toBeUndefined();
  });
});
