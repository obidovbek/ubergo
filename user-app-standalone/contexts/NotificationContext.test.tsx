/**
 * T-116 — the user app's notification actions speak the user's language when they fail.
 *
 * `NotificationContext` is the twin of the driver app's `NotificationsScreen`: its four error
 * toasts showed the raw `error.message` — "Network request failed", "Aborted", or a 5xx's
 * internals, in English. They now go through `getErrorMessage`, which names a dropped
 * connection and never shows a 5xx body. Driven through the context's own consumers, the way
 * `MenuScreen` uses it.
 *
 * ⚠️ The refresh path is what toasts. The first load does not, even when it fails: the
 * callback reads a stale `loading` — pre-existing, out of this card's scope, noted in T-116.
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import {
  deleteNotification,
  getNotifications,
  markNotificationAsRead,
} from '../api/notifications';
import { renderScreen } from '../test/render';
import uz from '../translations/uz';
import { ApiError } from '../utils/errorHandler';
import { showToast } from '../utils/toast';
import { NotificationProvider, useNotifications } from './NotificationContext';

jest.mock('../api/notifications');
jest.mock('../services/PushService');
jest.mock('../utils/toast');

const N = uz.notifications;

/** Three buttons, each calling one of the context's actions as a screen would. */
function Consumer() {
  const { loadNotifications, markAsRead, deleteNotification: remove } = useNotifications();
  return (
    <>
      <Pressable onPress={() => void loadNotifications()}>
        <Text>refresh</Text>
      </Pressable>
      <Pressable onPress={() => void markAsRead('n1').catch(() => undefined)}>
        <Text>mark read</Text>
      </Pressable>
      <Pressable onPress={() => void remove('n1').catch(() => undefined)}>
        <Text>delete</Text>
      </Pressable>
    </>
  );
}

const renderWithProvider = () =>
  renderScreen(
    <NotificationProvider>
      <Consumer />
    </NotificationProvider>,
  );

beforeEach(() => {
  jest.mocked(getNotifications).mockReset();
  jest.mocked(getNotifications).mockResolvedValue({ success: true, data: { data: [] } });
  jest.mocked(showToast.error).mockClear();
});

describe('NotificationContext — a failed action names the failure (T-116)', () => {
  it('a refresh with no connection says so in Uzbek, not "Network request failed"', async () => {
    await renderWithProvider();
    jest.mocked(getNotifications).mockRejectedValue(new Error('Network request failed'));

    fireEvent.press(screen.getByText('refresh'));

    await waitFor(() => expect(showToast.error).toHaveBeenCalledWith(N.loadError, uz.errors.network));
    expect(showToast.error).not.toHaveBeenCalledWith(expect.anything(), 'Network request failed');
  });

  it('a timed-out mark-as-read is called a timeout, not "Aborted"', async () => {
    await renderWithProvider();
    jest
      .mocked(markNotificationAsRead)
      .mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' }));

    fireEvent.press(screen.getByText('mark read'));

    await waitFor(() =>
      expect(showToast.error).toHaveBeenCalledWith(N.markReadError, uz.errors.timeout),
    );
  });

  it('a 5xx on delete shows try-again, never the server’s internals', async () => {
    await renderWithProvider();
    jest
      .mocked(deleteNotification)
      .mockRejectedValue(new ApiError(503, { message: 'upstream connect error' }));

    fireEvent.press(screen.getByText('delete'));

    await waitFor(() =>
      expect(showToast.error).toHaveBeenCalledWith(
        N.deleteError,
        `${uz.errors.serverError}. ${uz.errors.tryAgain}`,
      ),
    );
  });
});
