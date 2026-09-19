/**
 * T-116 — the driver's notifications screen: three defects, found while making its error toasts
 * speak the driver's language.
 *
 * What this pins:
 *   ① a failed load names the failure — "no internet", in Uzbek — instead of the runtime's
 *     English "Network request failed" (the old toast showed the raw `error.message`);
 *   ② …and the toast is actually SHOWN. `showToast` in this app is an object, and the screen
 *     called it as a function: every toast here threw a TypeError inside its own catch block.
 *     It was 6 of the driver app's 28 baseline `tsc` errors, accepted for months;
 *   ③ a 5xx never shows the server's internals — try-again instead;
 *   ④ a timestamp fills its number: this app's `t` takes a key only, so the `{ count }` the
 *     screen used to pass was ignored and every row read "{count} daqiqa oldin".
 */
import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react-native';

import { getNotifications, type Notification } from '../api/notifications';
import { renderScreen } from '../test/render';
import uz from '../translations/uz';
import { ApiError } from '../utils/errorHandler';
import { showToast } from '../utils/toast';
import { NotificationsScreen } from './NotificationsScreen';

jest.mock('../api/notifications');
jest.mock('../utils/toast');

const N = uz.notifications;
const MINUTE = 60 * 1000;

const notification = (id: string, ageMs: number): Notification => ({
  id,
  title: 'Yangi buyurtma',
  message: "Qo'qon — Toshkent",
  type: 'info',
  read: false,
  created_at: new Date(Date.now() - ageMs).toISOString(),
  updated_at: new Date(Date.now() - ageMs).toISOString(),
});

beforeEach(() => {
  jest.mocked(getNotifications).mockReset();
  jest.mocked(showToast.error).mockClear();
});

describe('NotificationsScreen — a failed load (T-116)', () => {
  it('① ② names a dropped connection in Uzbek — and the toast is really shown', async () => {
    jest.mocked(getNotifications).mockRejectedValue(new Error('Network request failed'));

    renderScreen(<NotificationsScreen />);

    await waitFor(() =>
      expect(showToast.error).toHaveBeenCalledWith(N.loadError, uz.errors.network),
    );
    expect(showToast.error).not.toHaveBeenCalledWith(expect.anything(), 'Network request failed');
  });

  it('③ never shows a 5xx body — try-again instead', async () => {
    jest.mocked(getNotifications).mockRejectedValue(
      new ApiError(500, { message: 'relation "notifications" does not exist' }),
    );

    renderScreen(<NotificationsScreen />);

    await waitFor(() =>
      expect(showToast.error).toHaveBeenCalledWith(
        N.loadError,
        `${uz.errors.serverError}. ${uz.errors.tryAgain}`,
      ),
    );
  });
});

describe('NotificationsScreen — timestamps (T-116)', () => {
  it('④ fills the number: "5 daqiqa oldin", never "{count}"', async () => {
    jest.mocked(getNotifications).mockResolvedValue({
      success: true,
      data: [notification('n1', 5 * MINUTE + 10_000)],
      unread: 1,
    });

    renderScreen(<NotificationsScreen />);

    expect(await screen.findByText(N.minutesAgo.replace('{count}', '5'))).toBeOnTheScreen();
    expect(screen.queryByText(/\{count\}/)).toBeNull();
  });
});
