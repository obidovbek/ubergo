/**
 * T-121 step 8 — `format.ts`. **Byte-identical in both apps** (re-verified with
 * `git show HEAD:<path>`), written once and copied, and re-proved red in the second app.
 *
 * 🔴 **One function here carries a real bug history and 16 of the file's 17 call sites:
 * `formatNumberWithSpaces`** — 6 importers in the user app, 10 in the driver. It renders every
 * price in both apps. Its comment records the defect: **pg returns `DECIMAL` as a STRING**, so the
 * API sends `"5000.00"`, and the original `num.toString()` fed that to the thousands regex and
 * produced **`5 000.00`**. It now rounds first and accepts the string the API really sends. That
 * is the case worth pinning hardest, and it is pinned from both directions — the string the
 * server sends, and the number a screen computes.
 * ⚠️ It is also **deliberately not null-tolerant** (a 2026-08-02 decision: let `tsc` police the
 * null call sites, which is how the `MyPassengerOffersScreen` crash was caught). So the tests
 * below pin what it does with `null` rather than asking it to be safe — changing that would
 * discard the compiler check the team chose on purpose.
 *
 * 📌 **The rest of the file is dead in both apps**, counted rather than assumed: only
 * `formatNumberWithSpaces` and `formatCurrency` (1 importer each app) are imported anywhere.
 * `formatNumber`, `formatPhoneNumber`, `truncate`, `capitalize`, `toTitleCase`, `formatDistance`,
 * `formatFileSize` and `formatPercentage` have **no callers in either app**. They are tested
 * because they are nearly free, but a failure there means "this was always wrong", not "a user is
 * seeing this". `formatPhoneNumber` in particular is **US-shaped** and would mangle an Uzbek
 * number — `contactPhone.ts` exists precisely because of that, and says so in its own comment.
 */
import { describe, expect, it } from '@jest/globals';

import {
  capitalize,
  formatCurrency,
  formatDistance,
  formatFileSize,
  formatNumber,
  formatNumberWithSpaces,
  formatPercentage,
  formatPhoneNumber,
  toTitleCase,
  truncate,
} from './format';

describe('formatNumberWithSpaces — LIVE, and every price in both apps goes through it', () => {
  it('groups thousands with spaces', () => {
    expect(formatNumberWithSpaces(5000)).toBe('5 000');
    expect(formatNumberWithSpaces(1234567)).toBe('1 234 567');
    expect(formatNumberWithSpaces(999)).toBe('999');
    expect(formatNumberWithSpaces(0)).toBe('0');
  });

  it('🔴 accepts the STRING the API really sends, and does not leave the decimals in', () => {
    // The bug itself: pg returns DECIMAL as a string, so the server sends "5000.00". The old
    // `num.toString()` handed that to the thousands regex and rendered `5 000.00`.
    expect(formatNumberWithSpaces('5000.00')).toBe('5 000');
    expect(formatNumberWithSpaces('1234567.89')).toBe('1 234 568');
    expect(formatNumberWithSpaces('999.00')).toBe('999');
  });

  it('rounds rather than truncates', () => {
    expect(formatNumberWithSpaces(1500.5)).toBe('1 501');
    expect(formatNumberWithSpaces(1500.4)).toBe('1 500');
    expect(formatNumberWithSpaces('0.5')).toBe('1');
  });

  it('renders a negative amount with its sign and its grouping', () => {
    expect(formatNumberWithSpaces(-5000)).toBe('-5 000');
  });

  it('returns an empty string for anything that is not a number at all', () => {
    // The `Number.isFinite` guard — an empty cell is better than the word "NaN" beside a price.
    expect(formatNumberWithSpaces('abc')).toBe('');
    expect(formatNumberWithSpaces(NaN)).toBe('');
    expect(formatNumberWithSpaces(Infinity)).toBe('');
  });

  it('📌 treats null and an empty string as ZERO, not as missing', () => {
    // Recorded, not fixed, and deliberately so: `Number(null)` is 0 and `Number('')` is 0, so a
    // missing price renders as `0` rather than blank. The team's 2026-08-02 decision was to let
    // `tsc` police the null call sites instead of making this null-tolerant — that is what caught
    // the MyPassengerOffersScreen crash. Changing this would throw that check away.
    expect(formatNumberWithSpaces(null as never)).toBe('0');
    expect(formatNumberWithSpaces('')).toBe('0');
  });
});

describe('formatCurrency — LIVE, one call site in each app', () => {
  it('defaults to US dollars in en-US', () => {
    // Asserted on structure, not on ICU's exact glyphs: the symbol and separator are ICU's to
    // choose and differ between Node and Hermes. What is ours is the default currency and locale.
    expect(formatCurrency(1234.5)).toContain('1,234.50');
    expect(formatCurrency(1234.5)).toContain('$');
  });

  it('takes the currency and locale it is given', () => {
    const formatted = formatCurrency(1234.5, 'UZS', 'ru-RU');

    expect(formatted).toMatch(/1[\s  ]234/);
    expect(formatted).not.toContain('$');
  });
});

describe('the unused half of the file — DEAD in both apps', () => {
  it('formatNumber groups with commas, always in en-US', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(999)).toBe('999');
  });

  it('📌 formatPhoneNumber is US-shaped and returns an Uzbek number UNCHANGED', () => {
    // This is exactly why `contactPhone.ts` exists and says so in its own header. Pinned so the
    // two are never confused: only 10-digit and 1-prefixed 11-digit inputs are formatted.
    expect(formatPhoneNumber('2125551234')).toBe('(212) 555-1234');
    expect(formatPhoneNumber('12125551234')).toBe('+1 (212) 555-1234');
    expect(formatPhoneNumber('998901234567')).toBe('998901234567');
    expect(formatPhoneNumber('+998 90 123 45 67')).toBe('+998 90 123 45 67');
  });

  it('truncate cuts to maxLength INCLUDING the ellipsis', () => {
    // The `maxLength - 3` is easy to misread as "cut then append", which would overrun by three.
    expect(truncate('abcdefghij', 8)).toBe('abcde...');
    expect(truncate('abcdefghij', 8)).toHaveLength(8);
    expect(truncate('short', 10)).toBe('short');
    expect(truncate('exactly10!', 10)).toBe('exactly10!');
  });

  it('capitalize raises the first letter and LOWERS the rest', () => {
    // Not merely "capitalise": it lowercases the tail, so an acronym is destroyed.
    expect(capitalize('salom')).toBe('Salom');
    expect(capitalize('SALOM')).toBe('Salom');
    expect(capitalize('')).toBe('');
  });

  it('toTitleCase capitalises every space-separated word', () => {
    expect(toTitleCase('toshkent shahri')).toBe('Toshkent Shahri');
    expect(toTitleCase('TOSHKENT SHAHRI')).toBe('Toshkent Shahri');
  });

  it('formatDistance switches from metres to one decimal of a kilometre at 1000', () => {
    expect(formatDistance(999)).toBe('999 m');
    expect(formatDistance(1000)).toBe('1.0 km');
    expect(formatDistance(1550)).toBe('1.6 km');
    expect(formatDistance(999.6)).toBe('1000 m'); // rounds the metres, then prints them as metres
  });

  it('formatFileSize picks the unit by powers of 1024', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(512)).toBe('512 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('formatPercentage multiplies by 100 and takes the decimals it is told', () => {
    expect(formatPercentage(0.5)).toBe('50%');
    expect(formatPercentage(0.1234, 2)).toBe('12.34%');
  });
});
