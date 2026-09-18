/**
 * T-121 step 8 — `contactPhone.ts`. **Byte-identical in both apps** (re-verified with
 * `git show HEAD:<path>`, not a working-tree diff, which `core.autocrlf` makes useless), so this
 * file is written once and copied — and **re-proved red in the second app**, because the twins are
 * maintained by hand and drift silently.
 *
 * 🔴 **The most important test here guards a "do NOT reintroduce" comment.** The source carries a
 * long warning from **T-056**: never gate dialling on `Linking.canOpenURL('tel:…')`. On Android
 * 11+ that call is subject to package visibility and returns **false unless the manifest declares
 * a matching intent in `<queries>`** — this app declares only `https` VIEW, and Expo 54 targets
 * SDK 35. So the gate reported "no dialer" on a phone that obviously has one, and the user was
 * told the feature was unavailable. `openURL` itself is *not* restricted, because visibility
 * limits *querying*, not starting an activity.
 * A comment cannot stop anyone re-adding it; **`expect(canOpenURL).not.toHaveBeenCalled()` can.**
 * That assertion is the whole reason this file is worth more than its size.
 *
 * Every export here is live in both apps: `formatContactPhone` (4 user / 6 driver importers),
 * `dialPhone` (4 / 6), `openEmail` (1 / 1).
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Linking } from 'react-native';

import { dialPhone, formatContactPhone, openEmail } from './contactPhone';
import { showToast } from './toast';

// Below the imports on purpose: `babel-plugin-jest-hoist` lifts it above them anyway, while
// writing it above costs an `import/first` lint warning — a defect in the test file, not a new
// baseline. The real module pulls in a JSX renderer nothing here needs.
jest.mock('./toast', () => ({
  showToast: { error: jest.fn(), success: jest.fn() },
}));

const toastError = showToast.error as jest.Mock<(title: string, message?: string) => void>;

/** Mirrors `useTranslation`: a miss returns the key, so assertions read as the key itself. */
const t = (key: string): string => key;

let openURL: jest.SpiedFunction<typeof Linking.openURL>;
let canOpenURL: jest.SpiedFunction<typeof Linking.canOpenURL>;

beforeEach(() => {
  toastError.mockClear();
  openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  canOpenURL = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
  // Both failure paths log; that is expected, not a test failure.
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('formatContactPhone', () => {
  it('renders a 12-digit Uzbek number in the grouping the design asks for', () => {
    expect(formatContactPhone('998901234567')).toBe('+998 90 123 45 67');
  });

  it('strips whatever punctuation the server or the user put in first', () => {
    expect(formatContactPhone('+998 90 123 45 67')).toBe('+998 90 123 45 67');
    expect(formatContactPhone('+998-90-123-45-67')).toBe('+998 90 123 45 67');
    expect(formatContactPhone(' (998) 90 1234567 ')).toBe('+998 90 123 45 67');
  });

  it('returns anything that is not a 12-digit 998 number untouched', () => {
    // Deliberate: this renders contact details, and showing a number the app does not recognise
    // exactly as the server sent it beats mangling it into a shape it is not.
    expect(formatContactPhone('901234567')).toBe('901234567');
    expect(formatContactPhone('+7 495 123 45 67')).toBe('+7 495 123 45 67');
    expect(formatContactPhone('99890123456')).toBe('99890123456');
    expect(formatContactPhone('9989012345678')).toBe('9989012345678');
  });

  it('trims, and survives the empty cases without throwing', () => {
    expect(formatContactPhone('  998901234567  ')).toBe('+998 90 123 45 67');
    expect(formatContactPhone('   ')).toBe('');
    expect(formatContactPhone('')).toBe('');
    expect(formatContactPhone(null)).toBe('');
    expect(formatContactPhone(undefined)).toBe('');
  });
});

describe('dialPhone', () => {
  it('opens the dialer with the number pre-filled', async () => {
    await dialPhone('+998 90 123 45 67', t);

    expect(openURL).toHaveBeenCalledWith('tel:+998901234567');
  });

  it('keeps the leading + but drops every other non-digit', async () => {
    await dialPhone('(998) 90-123-45-67', t);

    expect(openURL).toHaveBeenCalledWith('tel:998901234567');
  });

  it('🔴 NEVER calls canOpenURL — the T-056 regression guard', () => {
    // See the header. A `canOpenURL('tel:…')` gate answers false on Android 11+ because of
    // package visibility, and the user is told their phone has no dialer. If this test ever goes
    // red, someone has re-added the gate that T-056 removed: read the comment in the source
    // before "fixing" the test.
    return dialPhone('998901234567', t).then(() => {
      expect(canOpenURL).not.toHaveBeenCalled();
      expect(openURL).toHaveBeenCalledTimes(1);
    });
  });

  it('complains about a missing number instead of dialling nothing', async () => {
    await dialPhone('', t);
    await dialPhone(null, t);
    await dialPhone(undefined, t);
    await dialPhone('---', t);

    expect(openURL).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledTimes(4);
    expect(toastError).toHaveBeenCalledWith('common.error', 'contact.noPhone');
  });

  it('reports a real failure as a toast and does NOT throw', async () => {
    // It is called straight from a row's onPress, where an unhandled rejection is a crash.
    openURL.mockRejectedValue(new Error('No activity found to handle Intent'));

    await expect(dialPhone('998901234567', t)).resolves.toBeUndefined();
    expect(toastError).toHaveBeenCalledWith('common.error', 'contact.dialFailed');
  });
});

describe('openEmail', () => {
  it('opens the mail client with no query when there is nothing to prefill', async () => {
    await openEmail('driver@example.com', t);

    expect(openURL).toHaveBeenCalledWith('mailto:driver@example.com');
  });

  it('encodes the subject and body, so spaces and & cannot break the URL', async () => {
    await openEmail('driver@example.com', t, {
      subject: 'Ride & payment',
      body: 'Salom, ertaga?',
    });

    expect(openURL).toHaveBeenCalledWith(
      'mailto:driver@example.com?subject=Ride%20%26%20payment&body=Salom%2C%20ertaga%3F'
    );
  });

  it('includes only the parts it was given', async () => {
    await openEmail('a@b.com', t, { subject: 'Hi' });
    expect(openURL).toHaveBeenLastCalledWith('mailto:a@b.com?subject=Hi');

    await openEmail('a@b.com', t, { body: 'Hi' });
    expect(openURL).toHaveBeenLastCalledWith('mailto:a@b.com?body=Hi');

    // An empty string is falsy, so it is treated as "not supplied" rather than an empty subject.
    await openEmail('a@b.com', t, { subject: '', body: '' });
    expect(openURL).toHaveBeenLastCalledWith('mailto:a@b.com');
  });

  it('🔴 NEVER calls canOpenURL either — the same Android 11+ trap, same guard', async () => {
    await openEmail('driver@example.com', t);

    expect(canOpenURL).not.toHaveBeenCalled();
  });

  it('complains about a missing address instead of opening an empty mailto', async () => {
    await openEmail('', t);
    await openEmail(null, t);
    await openEmail('   ', t);

    expect(openURL).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledTimes(3);
    expect(toastError).toHaveBeenCalledWith('common.error', 'contact.noEmail');
  });

  it('reports a real failure as a toast and does NOT throw', async () => {
    openURL.mockRejectedValue(new Error('No activity found to handle Intent'));

    await expect(openEmail('a@b.com', t)).resolves.toBeUndefined();
    expect(toastError).toHaveBeenCalledWith('common.error', 'contact.emailFailed');
  });
});
