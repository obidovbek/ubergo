/**
 * T-116 — the passenger's own orders: a failed load is named in Uzbek, and does not crash.
 *
 * 🔴 This screen called `getErrorMessage(error, t('…'))` — a translated STRING where the
 * translator goes. It was 2 of the user app's baseline `tsc` errors for months and did no harm,
 * until T-116 made `getErrorMessage` call its translator on every connection failure and 5xx:
 * from then on a dropped connection threw a TypeError inside this screen's catch block, and the
 * passenger saw nothing at all. Pinned here from both sides.
 */
import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { waitFor } from '@testing-library/react-native';

import { getMyPassengerOffers } from '../api/passengerOffers';
import { renderScreen } from '../test/render';
import uz from '../translations/uz';
import { ApiError } from '../utils/errorHandler';
import { showToast } from '../utils/toast';
import { MyPassengerOffersScreen } from './MyPassengerOffersScreen';

jest.mock('../api/passengerOffers');
jest.mock('../utils/toast');

const T = uz.passengerOffers;

beforeEach(() => {
  jest.mocked(getMyPassengerOffers).mockReset();
  jest.mocked(showToast.error).mockClear();
});

describe('MyPassengerOffersScreen — a failed load (T-116)', () => {
  it('names a dropped connection in Uzbek — and gets as far as showing it', async () => {
    jest.mocked(getMyPassengerOffers).mockRejectedValue(new Error('Network request failed'));

    await renderScreen(<MyPassengerOffersScreen />);

    await waitFor(() => expect(showToast.error).toHaveBeenCalledWith(T.errorLoad, uz.errors.network));
  });

  it('never shows a 5xx body — try-again instead', async () => {
    jest
      .mocked(getMyPassengerOffers)
      .mockRejectedValue(new ApiError(502, { message: '<html>502 Bad Gateway</html>' }));

    await renderScreen(<MyPassengerOffersScreen />);

    await waitFor(() =>
      expect(showToast.error).toHaveBeenCalledWith(
        T.errorLoad,
        `${uz.errors.serverError}. ${uz.errors.tryAgain}`,
      ),
    );
  });
});
