/**
 * T-118 step 5 — the passenger's order form (CHECKLIST §3), as a user works it.
 *
 * What this pins, measured against the code on 2026-09-14 (the card text from 8b was stale —
 * 8c rebuilt the location card onto `GeoSheet`, so the two ✕ buttons are gone and the 255
 * cap now sits on the landmark field):
 *   ① it mounts under the real providers, fetches the countries once and settles on Uzbekistan;
 *   ② an empty submit is refused with the from-location error and NOTHING reaches the API;
 *   ③ both endpoints are picked through the sheet (province → district → QFY), the row then
 *      reads the QFY over its ancestors, and the landmark field appears only then, capped at 255;
 *   ④ the minimal valid order — route, "whole salon", cash — leaves for the API exactly once,
 *      with the ids, the texts, the flags and the default departure the form promised;
 *   ⑤ a scheduled departure that slipped inside the 31-minute floor while the passenger was
 *      filling the form is refused at submit (`MIN_ADVANCE_MS`, T-069's real premise).
 *
 * The clock is a frozen `Date.now` so the default departure (now + 60 min) is exactly
 * computable; ⑤ moves that clock forward instead of driving the time sheet.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import {
  fetchGeoCityDistricts,
  fetchGeoCountries,
  fetchGeoProvinces,
  fetchGeoSettlements,
  type GeoOption,
} from '../api/geo';
import { createPassengerOffer } from '../api/passengerOffers';
import { renderScreen } from '../test/render';
import uz from '../translations/uz';
import { ApiError } from '../utils/errorHandler';
import { MIN_ADVANCE_MS } from '../utils/rideTime';
import { showToast } from '../utils/toast';
import { CreatePassengerOfferScreen } from './CreatePassengerOfferScreen';

jest.mock('../api/geo');
jest.mock('../api/passengerOffers');
jest.mock('../utils/toast');

const UZ: GeoOption = { id: 1, name: 'Ozbekiston' };
const FARGONA: GeoOption = { id: 10, name: 'Fargona viloyati' };
const QOQON: GeoOption = { id: 101, name: 'Qoqon' };
const RISHTON: GeoOption = { id: 102, name: 'Rishton' };
const YAYPAN: GeoOption = { id: 1001, name: 'Yaypan' };
const CHIMYON: GeoOption = { id: 1002, name: 'Chimyon' };

const T = uz.passengerOffers;

/** 20 September 2026, 10:00 local — a frozen "now" the form's defaults derive from. */
const CLOCK = new Date(2026, 8, 20, 10, 0, 0, 0).getTime();
let clockOffsetMs = 0;
let nowSpy: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  clockOffsetMs = 0;
  nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => CLOCK + clockOffsetMs);
  jest.mocked(fetchGeoCountries).mockResolvedValue([UZ]);
  jest.mocked(fetchGeoProvinces).mockResolvedValue([FARGONA]);
  jest.mocked(fetchGeoCityDistricts).mockResolvedValue([QOQON, RISHTON]);
  jest
    .mocked(fetchGeoSettlements)
    .mockImplementation(async (districtId) => (districtId === QOQON.id ? [YAYPAN] : [CHIMYON]));
  jest.mocked(createPassengerOffer).mockResolvedValue({} as never);
});

afterEach(() => {
  nowSpy.mockRestore();
});

const mount = async () => {
  await renderScreen(<CreatePassengerOfferScreen />, { params: { scope: 'aro' } });
  // The country id arrives asynchronously and the sheet needs it above the province level.
  await waitFor(() => expect(fetchGeoCountries).toHaveBeenCalledTimes(1));
};

/** Open one endpoint's sheet and walk province → district → QFY. */
const pickEndpoint = async (label: string, district: GeoOption, settlement: GeoOption) => {
  fireEvent.press(screen.getByRole('button', { name: label }));
  fireEvent.press(await screen.findByText(FARGONA.name));
  fireEvent.press(await screen.findByText(district.name));
  fireEvent.press(await screen.findByText(settlement.name));
  // The sheet closed and the row shows the chosen QFY.
  await waitFor(() => expect(screen.getByText(settlement.name)).toBeOnTheScreen());
};

const fillMinimalOrder = async () => {
  await pickEndpoint(T.fromLabel, QOQON, YAYPAN);
  await pickEndpoint(T.toLabel, RISHTON, CHIMYON);
  fireEvent.press(screen.getByText(T.salonWhole));
  fireEvent.press(screen.getByText(T.paymentCash));
};

const submit = () => fireEvent.press(screen.getByText(T.submitOrder));

describe('CreatePassengerOfferScreen', () => {
  it('mounts, fetches the countries once, and starts with both endpoints empty', async () => {
    await mount();
    expect(screen.getAllByText(T.selectProvince)).toHaveLength(2);
    expect(screen.getByText(T.submitOrder)).toBeOnTheScreen();
    expect(screen.queryByPlaceholderText(T.landmarkPlaceholder)).not.toBeOnTheScreen();
  });

  it('refuses an empty submit with the from-location error and calls no API', async () => {
    await mount();
    submit();
    expect(showToast.error).toHaveBeenCalledWith(uz.common.error, T.errorFromLocation);
    expect(screen.getByText(T.errorFromLocation)).toBeOnTheScreen();
    expect(screen.getByText(T.errorToLocation)).toBeOnTheScreen();
    expect(createPassengerOffer).not.toHaveBeenCalled();
  });

  it('picks an endpoint through the sheet, then offers the landmark field capped at 255', async () => {
    await mount();
    await pickEndpoint(T.fromLabel, QOQON, YAYPAN);

    expect(fetchGeoProvinces).toHaveBeenCalledWith(UZ.id);
    expect(fetchGeoCityDistricts).toHaveBeenCalledWith(FARGONA.id);
    expect(fetchGeoSettlements).toHaveBeenCalledWith(QOQON.id);
    // Line 1 is the QFY, line 2 its ancestors.
    expect(screen.getByText(`${FARGONA.name}, ${QOQON.name}`)).toBeOnTheScreen();
    // The other endpoint is still empty.
    expect(screen.getByText(T.selectProvince)).toBeOnTheScreen();

    const landmark = screen.getByPlaceholderText(T.landmarkPlaceholder);
    expect(landmark).toHaveProp('maxLength', 255);
  });

  it('sends the minimal valid order to the API exactly once, with what the form promised', async () => {
    await mount();
    await fillMinimalOrder();
    submit();

    await waitFor(() => expect(createPassengerOffer).toHaveBeenCalledTimes(1));
    const defaultDeparture = new Date(CLOCK + 60 * 60 * 1000);
    defaultDeparture.setSeconds(0, 0);
    expect(createPassengerOffer).toHaveBeenCalledWith(
      expect.objectContaining({
        from_text: `${FARGONA.name}, ${QOQON.name}, ${YAYPAN.name}`,
        from_country_id: UZ.id,
        from_province_id: FARGONA.id,
        from_city_id: QOQON.id,
        from_settlement_id: YAYPAN.id,
        to_text: `${FARGONA.name}, ${RISHTON.name}, ${CHIMYON.name}`,
        to_country_id: UZ.id,
        to_province_id: FARGONA.id,
        to_city_id: RISHTON.id,
        to_settlement_id: CHIMYON.id,
        start_at: defaultDeparture.toISOString(),
        is_urgent: false,
        match_scope: 'aro',
        payment_cash: true,
        payment_card: false,
        paid_by_friend: false,
        salon_scope: 'whole_salon',
        front_seat: true,
        currency: 'UZS',
      }),
    );
    const sent = jest.mocked(createPassengerOffer).mock.calls[0][0];
    expect(sent.seat_counts).toBeUndefined();
    expect(sent.depart_until).toBeUndefined();
    expect(sent.arrive_until).toBeUndefined();
    expect(sent.special_order).toBeUndefined();
    expect(sent.note).toBeUndefined();

    // Success is told through the confirm dialog, not a toast.
    expect(await screen.findByText(T.successMessage)).toBeOnTheScreen();
    expect(showToast.error).not.toHaveBeenCalled();
  });

  it('refuses a scheduled departure that slipped inside the 31-minute floor', async () => {
    await mount();
    await fillMinimalOrder();

    // The passenger took 45 minutes; the default departure (now + 60) is now 15 away.
    clockOffsetMs = 45 * 60 * 1000;
    expect(MIN_ADVANCE_MS).toBeGreaterThan(15 * 60 * 1000);
    submit();

    expect(showToast.error).toHaveBeenCalledWith(uz.common.error, T.errorTime);
    expect(createPassengerOffer).not.toHaveBeenCalled();
  });

  it('🔴 T-116: a create with no connection says so in Uzbek, not "Network request failed"', async () => {
    // The toast used to show the thrown message raw — the runtime's English for a dropped line.
    jest.mocked(createPassengerOffer).mockRejectedValue(new Error('Network request failed'));
    await mount();
    await fillMinimalOrder();
    submit();

    await waitFor(() =>
      expect(showToast.error).toHaveBeenCalledWith(T.errorCreate, uz.errors.network),
    );
  });

  it('T-116: a server refusal (4xx) is still shown as the server worded it', async () => {
    // What the old comment meant to keep: a 4xx arrives in the user's language (the API keys
    // it — `offers.startAtTooSoon` since T-116), so it is shown verbatim, not replaced.
    const refusal = "Jo'nash vaqti kamida 30 daqiqadan keyin bo'lishi kerak";
    jest.mocked(createPassengerOffer).mockRejectedValue(new ApiError(400, { message: refusal }));
    await mount();
    await fillMinimalOrder();
    submit();

    await waitFor(() => expect(showToast.error).toHaveBeenCalledWith(T.errorCreate, refusal));
  });
});
