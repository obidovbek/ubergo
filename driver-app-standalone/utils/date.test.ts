/**
 * T-121 step 7 — `date.ts`, the DRIVER app.
 *
 * ⚠️ **Not a copy of the user app's test, because this is not the user app's module.** Measured
 * before writing anything (step 6 checked it before deleting there, and the finding stands):
 *   • **there is no manual Uzbek month mapping here at all** — the user app hand-writes two
 *     twelve-name arrays "for better reliability"; this file delegates every character to ICU;
 *   • **and so there is no duplicated dead block** — the thing step 6 deleted over there never
 *     existed here;
 *   • `formatDate` takes **no language** and hardcodes `en-US`, where the user app's takes one;
 *   • `getLocaleFromLanguage` is **exported** here and private there;
 *   • it has three functions the user app has not got — `formatDateTime`,
 *     `formatDateByLanguage`, `formatTimeByLanguage` — **all defaulting to `'uz'`**, where every
 *     user-app equivalent defaults to `'en'`.
 *
 * 🔴 **What this file is really worth, stated honestly: only three of the eight exports are
 * reachable from the running app.** Counted, not assumed:
 *   • **LIVE** — `formatDateTime` (7 importers), `formatDateByLanguage` (3), `formatTimeByLanguage`
 *     (2). These are the dates a driver actually sees.
 *   • **DEAD** — `formatDate` and `formatTime` are imported by exactly one component,
 *     `components/cards/RideCard.tsx`, which **nothing imports and no barrel exports**; and
 *     `getRelativeTime`, `isToday`, `calculateDuration` and the exported `getLocaleFromLanguage`
 *     have no callers anywhere.
 * They are all tested below — the tests are cheap and the functions may yet be wired up — but a
 * failure in the dead group means "this code was always wrong", not "a driver is seeing this".
 * 📌 That also defuses what would otherwise be a bug: `formatDate` and `formatTime` **ignore the
 * app's language and always render `en-US`**, so a Russian-speaking driver would read
 * `Mar 5, 2026` and a 12-hour `02:30 PM` — while `formatTimeByLanguage`, three functions below,
 * deliberately sets `hour12: false`. The same app would show both. It reaches nobody today only
 * because the one component that calls them is an orphan.
 *
 * **Assertions are spy-based throughout**, unlike the user app's test, and that follows from the
 * first finding: with no manual mapping in this module, **every output belongs to ICU, not to
 * us**. Pinning `5 мар. 2026 г.` would pin Node 22's ICU tables, which Hermes on a real phone
 * need not match and which no one here chose. What IS ours is the language → locale map, the
 * option bags, and the `hour12` rule — so that is what these tests hold. The exception is
 * `getLocaleFromLanguage` itself, which is pure JavaScript and asserted exactly.
 *
 * ⚠️ Fixtures use `new Date(y, m, d, …)`, never an ISO string with a `Z`: the relative-time and
 * `isToday` readers are local-time, so a `Z` fixture would pass here and fail on CI at UTC.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { Language } from '../config/languages';
import {
  calculateDuration,
  formatDate,
  formatDateByLanguage,
  formatDateTime,
  formatTime,
  formatTimeByLanguage,
  getLocaleFromLanguage,
  getRelativeTime,
  isToday,
} from './date';

/** 5 March 2026, 14:30 local — the month is index 2. */
const MARCH_5 = new Date(2026, 2, 5, 14, 30);

describe('getLocaleFromLanguage — exported here, private in the user app', () => {
  // Pure JavaScript, so asserted exactly. This is the one decision in the file that is ours.
  it.each([
    ['uz', 'uz-UZ'],
    ['ru', 'ru-RU'],
    ['en', 'en-US'],
  ] as [Language, string][])('maps %s to %s', (language, locale) => {
    expect(getLocaleFromLanguage(language)).toBe(locale);
  });

  it('falls back to en-US for a language code it has never heard of', () => {
    // The `|| 'en-US'` arm. Unreachable through the type system, reachable at runtime from a
    // persisted settings value written by an older build.
    expect(getLocaleFromLanguage('de' as never)).toBe('en-US');
    expect(getLocaleFromLanguage(undefined as never)).toBe('en-US');
  });
});

describe('the option bags we hand to ICU', () => {
  let toLocaleDateString: jest.SpiedFunction<Date['toLocaleDateString']>;
  let toLocaleString: jest.SpiedFunction<Date['toLocaleString']>;
  let toLocaleTimeString: jest.SpiedFunction<Date['toLocaleTimeString']>;

  beforeEach(() => {
    toLocaleDateString = jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('DATE');
    toLocaleString = jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('DATETIME');
    toLocaleTimeString = jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('TIME');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('formatDateTime — the one a driver actually sees most', () => {
    // 7 importers: OfferCard, PassengerOrderCard, PassengerOrderSheet, BookingSheet, MyRideCard,
    // and three screens. Everything below is user-visible.
    it.each([
      ['uz', 'uz-UZ'],
      ['ru', 'ru-RU'],
      ['en', 'en-US'],
    ] as [Language, string][])('formats in %s with a 24-hour clock', (language, locale) => {
      expect(formatDateTime(MARCH_5, language)).toBe('DATETIME');
      expect(toLocaleString).toHaveBeenCalledWith(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    });

    it('defaults to UZBEK, not English — the opposite of the user app', () => {
      // 🔴 Worth its own test. Both apps have a `formatDateTime`; a caller that forgets the
      // language argument gets `uz-UZ` here and `en-US` there. Copying a call site between the
      // apps silently changes the language it renders in.
      formatDateTime(MARCH_5);

      expect(toLocaleString).toHaveBeenCalledWith('uz-UZ', expect.anything());
    });

    it('accepts a string as readily as a Date', () => {
      expect(formatDateTime('2026-03-05T14:30:00', 'ru')).toBe('DATETIME');
      expect(toLocaleString).toHaveBeenCalledWith('ru-RU', expect.anything());
    });

    it('📌 has NO locale fallback — an unsupported locale throws, where the user app recovers', () => {
      // Recorded, not fixed. The user app wraps the identical call in try/catch and retries in
      // `en-US`; this one does not, so on a device without full ICU this throws inside render
      // rather than showing an English date. Not reproduced on a real device, and the RN runtime
      // in use has not been shown to throw here — which is why it is a pinned note, not a card.
      toLocaleString.mockImplementation(() => {
        throw new RangeError('Incorrect locale information provided');
      });

      expect(() => formatDateTime(MARCH_5, 'ru')).toThrow(RangeError);
    });
  });

  describe('formatDateByLanguage and formatTimeByLanguage', () => {
    it.each([
      ['uz', 'uz-UZ'],
      ['ru', 'ru-RU'],
      ['en', 'en-US'],
    ] as [Language, string][])('renders a %s date as 2-digit day and month', (language, locale) => {
      expect(formatDateByLanguage(MARCH_5, language)).toBe('DATE');
      expect(toLocaleDateString).toHaveBeenCalledWith(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    });

    it.each([
      ['uz', 'uz-UZ'],
      ['ru', 'ru-RU'],
      ['en', 'en-US'],
    ] as [Language, string][])('renders a %s time on a 24-hour clock', (language, locale) => {
      // `hour12: false` for EVERY language, English included — a deliberate difference from the
      // user app, which gives English a 12-hour clock.
      expect(formatTimeByLanguage(MARCH_5, language)).toBe('TIME');
      expect(toLocaleTimeString).toHaveBeenCalledWith(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    });

    it('both default to Uzbek', () => {
      formatDateByLanguage(MARCH_5);
      formatTimeByLanguage(MARCH_5);

      expect(toLocaleDateString).toHaveBeenCalledWith('uz-UZ', expect.anything());
      expect(toLocaleTimeString).toHaveBeenCalledWith('uz-UZ', expect.anything());
    });
  });

  describe('formatDate and formatTime — DEAD: reached only from an orphaned component', () => {
    it('renders a short date in hardcoded en-US, whatever language the app is in', () => {
      // 📌 See the header. No language parameter exists, so a caller cannot ask for anything
      // else. Harmless only because `RideCard.tsx` — the sole importer — is an orphan.
      expect(formatDate(MARCH_5)).toBe('DATE');
      expect(toLocaleDateString).toHaveBeenCalledWith('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    });

    it('asks for the time inside the LONG date, via toLocaleDateString', () => {
      // Unusual enough to pin: the long form requests `hour` and `minute` from
      // `toLocaleDateString`, not `toLocaleString`. Intl honours it, so this is odd but correct.
      expect(formatDate(MARCH_5, 'long')).toBe('DATE');
      expect(toLocaleDateString).toHaveBeenCalledWith('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    it('defaults to the short form', () => {
      formatDate(MARCH_5);

      expect(toLocaleDateString).toHaveBeenCalledWith('en-US', expect.not.objectContaining({
        hour: '2-digit',
      }));
    });

    it('formatTime asks en-US for hours and minutes, giving a 12-hour clock', () => {
      // The inconsistency in one line: this renders `02:30 PM` while `formatTimeByLanguage`
      // three tests above forces `14:30`, in the same app.
      expect(formatTime(MARCH_5)).toBe('TIME');
      expect(toLocaleTimeString).toHaveBeenCalledWith('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    });
  });
});

describe('getRelativeTime — DEAD: no callers', () => {
  // Byte-identical to the user app's, English strings and all, so it is tested identically.
  // Braces in the hooks: `jest.useFakeTimers()` returns the Jest object, and a concise arrow
  // body hands it to a `void` hook — `tsc` errors a green Jest run hides completely.
  const NOW = new Date(2026, 2, 5, 12, 0, 0);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

  it('says "just now" for anything under a minute', () => {
    expect(getRelativeTime(new Date(NOW.getTime() - 59_000))).toBe('just now');
    expect(getRelativeTime(NOW)).toBe('just now');
  });

  it('counts minutes, then hours, then days', () => {
    expect(getRelativeTime(ago(5))).toBe('5 minutes ago');
    expect(getRelativeTime(ago(59))).toBe('59 minutes ago');
    expect(getRelativeTime(ago(60 * 3))).toBe('3 hours ago');
    expect(getRelativeTime(ago(60 * 23))).toBe('23 hours ago');
    expect(getRelativeTime(ago(60 * 24 * 6))).toBe('6 days ago');
  });

  it('gets the singular right at exactly one of each', () => {
    expect(getRelativeTime(ago(1))).toBe('1 minute ago');
    expect(getRelativeTime(ago(60))).toBe('1 hour ago');
    expect(getRelativeTime(ago(60 * 24))).toBe('1 day ago');
  });

  it('gives up on "ago" after a week and shows the date instead', () => {
    expect(getRelativeTime(ago(60 * 24 * 7))).not.toContain('ago');
    expect(getRelativeTime(new Date(2026, 1, 20, 12, 0))).toBe(
      formatDate(new Date(2026, 1, 20, 12, 0))
    );
  });

  it('accepts a string as well as a Date', () => {
    expect(getRelativeTime('2026-03-05T11:00:00')).toBe('1 hour ago');
  });
});

describe('isToday — DEAD: no callers', () => {
  const NOW = new Date(2026, 2, 5, 12, 0, 0);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is true anywhere inside the local day, not just at this moment', () => {
    expect(isToday(new Date(2026, 2, 5, 0, 0, 1))).toBe(true);
    expect(isToday(new Date(2026, 2, 5, 23, 59))).toBe(true);
    expect(isToday('2026-03-05T06:30:00')).toBe(true);
  });

  it('is false either side of it, and a year apart to the day', () => {
    expect(isToday(new Date(2026, 2, 4, 23, 59))).toBe(false);
    expect(isToday(new Date(2026, 2, 6, 0, 1))).toBe(false);
    // Same day and month, different year — all three parts are compared.
    expect(isToday(new Date(2025, 2, 5, 12, 0))).toBe(false);
  });
});

describe('calculateDuration — DEAD: no callers', () => {
  const at = (hour: number, minute = 0) => new Date(2026, 2, 5, hour, minute);

  it('drops the hours entirely when there are none', () => {
    expect(calculateDuration(at(9), at(9, 45))).toBe('45m');
    expect(calculateDuration(at(9), at(9))).toBe('0m');
  });

  it('shows hours and minutes once the trip is an hour or longer', () => {
    expect(calculateDuration(at(9), at(10, 30))).toBe('1h 30m');
    expect(calculateDuration(at(9), at(11))).toBe('2h 0m');
  });

  it('counts across midnight', () => {
    expect(calculateDuration(new Date(2026, 2, 5, 23, 30), new Date(2026, 2, 6, 1, 0))).toBe(
      '1h 30m'
    );
  });

  it('accepts strings', () => {
    expect(calculateDuration('2026-03-05T09:00:00', '2026-03-05T10:30:00')).toBe('1h 30m');
  });

  it('📌 loses the hours entirely when the end is BEFORE the start', () => {
    // The same quirk as the user app's copy, measured rather than reasoned about. The guard is
    // `hours > 0`, false for every negative interval, so the hours are dropped and only the
    // remainder prints: 90 minutes backwards reads `-30m`, and 180 backwards reads `0m`
    // (`-180 % 60` is `-0`, and `String(-0)` is `"0"`) — a three-hour mistake renders as
    // "no time at all". Unreachable here, since nothing calls this function at all.
    expect(calculateDuration(at(10, 30), at(9))).toBe('-30m');
    expect(calculateDuration(at(12), at(9))).toBe('0m');
  });
});
