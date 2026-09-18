/**
 * T-121 step 6 — `date.ts`, the USER app.
 *
 * 🔴 **This test exists to prove a DELETION changed nothing.** `formatDate` carried a verbatim
 * duplicate of its Uzbek short-format block — same six lines, same comment — sitting immediately
 * after the original. It was unreachable, because the first copy returns, and `tsc` had been
 * reporting it for as long as anyone has measured: `utils/date.ts(97,7) TS2367, "this comparison
 * appears to be unintentional because the types '"en" | "ru"' and '"uz"' have no overlap"` — the
 * compiler had already narrowed `language` past `'uz'`. It was **the 6th of the user app's 6
 * `tsc` errors**, so removing it takes that baseline to **5**. The tests below pin every branch
 * of the function either side of the cut, so "unreachable" is demonstrated rather than asserted.
 *
 * ⚠️ **The driver app's `date.ts` does NOT have this duplication** — checked first, because
 * fixing one app and walking past its twin is this project's most repeated defect. It turns out
 * not to be a twin at all: no manual Uzbek mapping anywhere, a `formatDate` that takes no
 * language, and three `*ByLanguage` exports this app has not got. It gets its own test (step 7).
 *
 * **How these assertions are split, and why it matters:**
 *   • **Uzbek is asserted exactly.** It is our own pure JavaScript — two hand-written month
 *     arrays — so it produces the same string on every machine, every Node, and every phone.
 *   • **Russian and English are asserted through a SPY on the `toLocale*` methods**, checking the
 *     locale and the options we pass, never the text ICU returns. Pinning ICU's output would be
 *     pinning a library: Node 22 renders `ru-RU` as `5 мар. 2026 г.`, Hermes on a real phone need
 *     not agree, and neither is a decision this codebase made. What IS ours is the language →
 *     locale mapping and the `hour12` rule, and that is what these tests hold.
 *   • **Every fixture is built with `new Date(y, m, d, …)`, never an ISO string with a `Z`**, so
 *     the local-time readers (`getDate`, `getHours`) give the same answer on a laptop at UTC+5 and
 *     on CI at UTC. A `Z` fixture here would pass locally and fail in GitHub Actions.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { Language } from '../config/languages';
import {
  calculateDuration,
  formatDate,
  formatDateTime,
  formatTime,
  getRelativeTime,
  isToday,
} from './date';

/** 5 March 2026, 14:30 local — the month is index 2. */
const MARCH_5 = new Date(2026, 2, 5, 14, 30);

describe('Uzbek — the manual month mapping, asserted exactly', () => {
  // The source comment says the manual mapping is there "for better reliability". That is the
  // whole reason these can be exact: ICU's own uz-UZ output is `5-mar, 2026`, hyphen and all.
  it('names all twelve months in the short form', () => {
    const shortNames = Array.from({ length: 12 }, (_, month) =>
      formatDate(new Date(2026, month, 5), 'short', 'uz')
    );

    expect(shortNames).toStrictEqual([
      '5 yan, 2026',
      '5 fev, 2026',
      '5 mar, 2026',
      '5 apr, 2026',
      '5 may, 2026',
      '5 iyn, 2026',
      '5 iyl, 2026',
      '5 avg, 2026',
      '5 sen, 2026',
      '5 okt, 2026',
      '5 noy, 2026',
      '5 dek, 2026',
    ]);
  });

  it('names all twelve months in the long form', () => {
    const longNames = Array.from({ length: 12 }, (_, month) =>
      formatDate(new Date(2026, month, 5, 14, 30), 'long', 'uz')
    );

    expect(longNames).toStrictEqual([
      '5 yanvar, 2026 14:30',
      '5 fevral, 2026 14:30',
      '5 mart, 2026 14:30',
      '5 aprel, 2026 14:30',
      '5 may, 2026 14:30',
      '5 iyun, 2026 14:30',
      '5 iyul, 2026 14:30',
      '5 avgust, 2026 14:30',
      '5 sentabr, 2026 14:30',
      '5 oktabr, 2026 14:30',
      '5 noyabr, 2026 14:30',
      '5 dekabr, 2026 14:30',
    ]);
  });

  it('pads the clock to two digits, in both the long date and the date-time', () => {
    const earlyMorning = new Date(2026, 2, 5, 9, 5);

    expect(formatDate(earlyMorning, 'long', 'uz')).toBe('5 mart, 2026 09:05');
    expect(formatDateTime(earlyMorning, 'uz')).toBe('5 mar, 09:05');
  });

  it('defaults to the short form', () => {
    expect(formatDate(MARCH_5, undefined, 'uz')).toBe('5 mar, 2026');
  });

  it('accepts a date string as readily as a Date', () => {
    // No `Z`: parsed as LOCAL time, which is what the local-time readers below expect.
    expect(formatDate('2026-03-05T14:30:00', 'short', 'uz')).toBe('5 mar, 2026');
    expect(formatDateTime('2026-03-05T14:30:00', 'uz')).toBe('5 mar, 14:30');
  });

  it('🔴 still returns the manual mapping after the duplicate block was deleted', () => {
    // The point of the whole step. The removed copy sat AFTER this one and was identical, so
    // deleting it can only have changed behaviour if the first copy were somehow not reached.
    expect(formatDate(MARCH_5, 'short', 'uz')).toBe('5 mar, 2026');
    expect(formatDateTime(MARCH_5, 'uz')).toBe('5 mar, 14:30');
  });
});

describe('Russian and English — the locale and options we hand to ICU', () => {
  // Spying rather than asserting output: see the header. These pin OUR decisions.
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

  // ⚠️ Typed tables, NOT `as const`. `as const` makes each row its own tuple type, and the
  // callback's widened parameters are then not assignable to that union — three `tsc` errors
  // that a fully green Jest run hid, because Jest strips types without checking them.
  const localeCases: [Language, string][] = [
    ['ru', 'ru-RU'],
    ['en', 'en-US'],
  ];
  const clockCases: [Language, string, boolean][] = [
    ['en', 'en-US', true],
    ['ru', 'ru-RU', false],
  ];

  it.each(localeCases)('maps %s to %s for a short date', (language, locale) => {
    expect(formatDate(MARCH_5, 'short', language)).toBe('DATE');
    expect(toLocaleDateString).toHaveBeenCalledWith(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  });

  it('falls back to en-US for a language it does not know', () => {
    // `getLocaleFromLanguage`'s `default` arm. Reached via the type escape hatch on purpose —
    // a bad language code from persisted settings must still render a date, not crash.
    formatDate(MARCH_5, 'short', 'de' as never);

    expect(toLocaleDateString).toHaveBeenCalledWith('en-US', expect.anything());
  });

  it('defaults to English when no language is given at all', () => {
    formatDate(MARCH_5);

    expect(toLocaleDateString).toHaveBeenCalledWith('en-US', expect.anything());
  });

  it.each(clockCases)(
    'uses a %s clock — 12-hour for English only — on a long date',
    (language, locale, hour12) => {
      expect(formatDate(MARCH_5, 'long', language)).toBe('DATETIME');
      expect(toLocaleString).toHaveBeenCalledWith(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12,
      });
    }
  );

  it.each(clockCases)('carries the same clock rule into formatDateTime for %s', (language, locale, hour12) => {
    expect(formatDateTime(MARCH_5, language)).toBe('DATETIME');
    expect(toLocaleString).toHaveBeenCalledWith(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12,
    });
  });

  it('formatTime asks for hours and minutes in the right locale', () => {
    expect(formatTime(MARCH_5, 'ru')).toBe('TIME');
    expect(toLocaleTimeString).toHaveBeenCalledWith('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  describe('when the platform does not support the locale', () => {
    // Otherwise-unreachable code: RN on older Androids ships without full ICU and throws here.
    // A spy is the only way to reach it, and it is worth reaching — it is the difference between
    // a wrong-looking date and a white screen.
    it('retries a long date in en-US', () => {
      toLocaleString.mockImplementationOnce(() => {
        throw new RangeError('Incorrect locale information provided');
      });

      expect(formatDate(MARCH_5, 'long', 'ru')).toBe('DATETIME');
      expect(toLocaleString).toHaveBeenCalledTimes(2);
      expect(toLocaleString).toHaveBeenLastCalledWith('en-US', expect.objectContaining({
        month: 'long',
        hour12: false,
      }));
    });

    it('rebuilds a date-time by hand from two en-US halves', () => {
      toLocaleString.mockImplementationOnce(() => {
        throw new RangeError('Incorrect locale information provided');
      });

      // The fallback does NOT retry `toLocaleString`: it composes the date and the time
      // separately, which is why the result is the two spies joined by a comma.
      expect(formatDateTime(MARCH_5, 'ru')).toBe('DATE, TIME');
      expect(toLocaleDateString).toHaveBeenCalledWith('en-US', { month: 'short', day: 'numeric' });
      expect(toLocaleTimeString).toHaveBeenCalledWith('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    });
  });
});

describe('getRelativeTime', () => {
  // A function that reads `new Date()` needs the clock pinned, or it is a different test every
  // time it runs. Braces in the hooks: `jest.useFakeTimers()` RETURNS the Jest object, and a
  // concise arrow body hands it to a `void` hook — two `tsc` errors a green suite would hide.
  const NOW = new Date(2026, 2, 5, 12, 0, 0);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /** `minutes` ago, as a Date. */
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
    // The `!== 1` arm. An off-by-one here reads as "1 minutes ago" in the notification list.
    expect(getRelativeTime(ago(1))).toBe('1 minute ago');
    expect(getRelativeTime(ago(60))).toBe('1 hour ago');
    expect(getRelativeTime(ago(60 * 24))).toBe('1 day ago');
  });

  it('gives up on "ago" after a week and shows the date instead', () => {
    // Seven days is the cut-off: `diffDays < 7`. Beyond it the function delegates to
    // `formatDate` with no language, so the answer is an ordinary English short date.
    expect(getRelativeTime(new Date(2026, 1, 20, 12, 0))).toBe(
      formatDate(new Date(2026, 1, 20, 12, 0))
    );
    expect(getRelativeTime(ago(60 * 24 * 7))).not.toContain('ago');
  });

  it('accepts a string as well as a Date', () => {
    expect(getRelativeTime('2026-03-05T11:00:00')).toBe('1 hour ago');
  });
});

describe('isToday', () => {
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
    // Same day and month, different year — all three parts are compared, so this must be false.
    expect(isToday(new Date(2025, 2, 5, 12, 0))).toBe(false);
  });
});

describe('calculateDuration', () => {
  const at = (hour: number, minute = 0) => new Date(2026, 2, 5, hour, minute);

  it('drops the hours entirely when there are none', () => {
    expect(calculateDuration(at(9), at(9, 45))).toBe('45m');
    expect(calculateDuration(at(9), at(9))).toBe('0m');
  });

  it('shows hours and minutes once the trip is an hour or longer', () => {
    expect(calculateDuration(at(9), at(10, 30))).toBe('1h 30m');
    // The minutes are a remainder, so a whole number of hours still prints `0m`.
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
    // Recorded, not fixed — and the real behaviour is stranger than it looks, so it is measured
    // rather than reasoned about. The guard is `hours > 0`, which is false for every negative
    // interval, so the hours are simply dropped and only the remainder is printed:
    //   • 90 minutes backwards → `-30m`  (the whole hour is gone)
    //   • 180 minutes backwards → `0m`   (`-180 % 60` is `-0`, and `String(-0)` is `"0"`)
    // A three-hour mistake therefore renders as "no time at all".
    // No caller can reach this today — both ends come from the same server row, and the API
    // rejects an arrival before a departure — which is why this is a pinned note and not a card.
    // If a caller ever CAN pass them backwards, this test is where to start.
    expect(calculateDuration(at(10, 30), at(9))).toBe('-30m');
    expect(calculateDuration(at(12), at(9))).toBe('0m');
  });
});
