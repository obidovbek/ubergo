/**
 * Contact phone helpers — T-054.
 *
 * A phone number reaches this app in exactly one situation: the passenger and a
 * driver have been paired by a **confirmed** request. The server gates that
 * (`OfferDriverService.gatePhones`); this file only renders and dials it.
 *
 * 🔴 **Do NOT copy the `BlockedScreen` dial pattern** (`BlockedScreen.tsx:161`),
 * even though it is the obvious neighbour to imitate. It gates on
 * `Linking.canOpenURL('tel:...')`, and on Android 11+ that call is subject to
 * package visibility: it returns **false unless the manifest declares a `tel`
 * intent in `<queries>`**. This app's manifest declares only `https` VIEW, and
 * Expo 54 targets SDK 35 — so `canOpenURL` reports "no dialer" on a phone that
 * obviously has one, and the user is told the feature is unavailable.
 * `openURL` itself is NOT restricted (visibility limits *querying*, not starting
 * an activity), so we simply attempt it and report only a real failure.
 */

import { Linking } from 'react-native';
import { showToast } from './toast';

/**
 * Render an E.164 Uzbek number as `+998 90 123 45 67`.
 *
 * ⚠️ Deliberately not `formatPhoneNumber` from `utils/format.ts` — that one
 * handles 10-digit and `1`-prefixed 11-digit US numbers and returns a 12-digit
 * `+998…` number completely unchanged.
 */
export const formatContactPhone = (phone?: string | null): string => {
  const raw = (phone || '').trim();
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(
      8,
      10
    )} ${digits.slice(10)}`;
  }

  return raw;
};

/**
 * Open the phone dialer with the number pre-filled.
 * Never throws — a failure surfaces as a toast, because this is called from a
 * row's onPress and an unhandled rejection there is a crash.
 */
export const dialPhone = async (
  phone: string | null | undefined,
  t: (key: string) => string
): Promise<void> => {
  const number = (phone || '').replace(/[^\d+]/g, '');

  if (!number) {
    showToast.error(t('common.error'), t('contact.noPhone'));
    return;
  }

  try {
    await Linking.openURL(`tel:${number}`);
  } catch (error) {
    console.error('Error opening dialer:', error);
    showToast.error(t('common.error'), t('contact.dialFailed'));
  }
};
