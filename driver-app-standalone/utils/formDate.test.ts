/**
 * T-129 — `formDate.ts`, the conversion between what a driver types and what the API stores.
 *
 * 🔴 **The two assertions this file exists for** are in "the owner's bug" block below. The driver
 * app used to post `DD.MM.YYYY` straight into a `DATEONLY` column, where Sequelize handed it to
 * `moment()` with no format:
 *   • `15.03.2015` → "Invalid date" → the save failed behind *"Ma'lumotlarni saqlashda xatolik"*;
 *   • `01.03.2015` → `2015-01-03` → **stored with day and month exchanged, in silence.**
 * `toIsoDate('01.03.2015')` must be `2015-03-01`. If it is ever `2015-01-03`, the defect is back.
 *
 * ⚠️ Fixtures are `new Date(y, m, d)` and never an ISO string with a `Z`. The module builds local
 * midnight, exactly as the screens' date pickers do, so a UTC fixture would pass here and drift a
 * day on CI.
 *
 * ⚠️ This module deliberately has NO opinion about which dates are allowed — the year each screen
 * tolerated is the one thing its four copies disagreed on. `dateLimits.isDateWithinBound` owns
 * "not in the future" and "not in the past"; the last block here pins that absence, so a bound
 * added to the parser later fails a test instead of quietly changing four screens.
 */
import { describe, expect, it } from '@jest/globals';

import { formatDisplayDate, fromIsoDate, parseDisplayDate, toIsoDate } from './formDate';

describe("the owner's bug: a typed date reaches the column as the date that was typed", () => {
  it('sends 15.03.2015 as 2015-03-15 — this save used to fail outright', () => {
    expect(toIsoDate('15.03.2015')).toBe('2015-03-15');
  });

  it('🔴 sends 01.03.2015 as 2015-03-01, NOT 2015-01-03 — the silent swap', () => {
    expect(toIsoDate('01.03.2015')).toBe('2015-03-01');
  });

  it('is unambiguous for every day-month pair a swap could hide', () => {
    // Both parts ≤ 12 is exactly the range where a swap looks like a real date
    // and nothing complains. One case per month, day deliberately ≠ month.
    for (let month = 1; month <= 12; month++) {
      const day = month === 1 ? 2 : 1;
      const typed = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.2015`;
      const expected = `2015-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      expect(toIsoDate(typed)).toBe(expected);
    }
  });
});

describe('toIsoDate', () => {
  it('passes an already-ISO value through untouched', () => {
    expect(toIsoDate('2015-03-15')).toBe('2015-03-15');
  });

  it('is null for an empty, blank or absent value — the payload then drops the field', () => {
    expect(toIsoDate('')).toBeNull();
    expect(toIsoDate('   ')).toBeNull();
    expect(toIsoDate(null)).toBeNull();
    expect(toIsoDate(undefined)).toBeNull();
  });

  it('is null for a half-typed date, so an incomplete field is never sent', () => {
    // A bare year auto-formats to "20.15" in these screens — T-061's dead end.
    for (const partial of ['20.15', '1', '15.', '15.03', '15.03.20']) {
      expect(toIsoDate(partial)).toBeNull();
    }
  });

  it('is null for a date the calendar has not got', () => {
    for (const bad of ['31.02.2000', '29.02.2015', '32.01.2015', '15.13.2015', '00.01.2015', '15.00.2015']) {
      expect(toIsoDate(bad)).toBeNull();
    }
  });

  it('is null for another format or for prose, never a guess', () => {
    for (const bad of ['2015/03/15', '15-03-2015', '15.3.15', 'bugun', '20150315', '2015-3-5']) {
      expect(toIsoDate(bad)).toBeNull();
    }
  });

  it('pads a single-digit day or month, because the API requires padding', () => {
    expect(toIsoDate('5.3.2015')).toBe('2015-03-05');
  });

  it('accepts a real leap day', () => {
    expect(toIsoDate('29.02.2016')).toBe('2016-02-29');
  });
});

describe('fromIsoDate', () => {
  it('shows what the server sent in the format the field uses', () => {
    expect(fromIsoDate('2015-03-15')).toBe('15.03.2015');
  });

  it('reads an ISO value that carries a time part, which the API may include', () => {
    expect(fromIsoDate('2015-03-15T00:00:00.000Z')).toBe('15.03.2015');
    expect(fromIsoDate('2015-3-5')).toBe('05.03.2015');
  });

  it('leaves a value already in display format alone', () => {
    expect(fromIsoDate('15.03.2015')).toBe('15.03.2015');
  });

  it('is empty for an absent value', () => {
    expect(fromIsoDate(null)).toBe('');
    expect(fromIsoDate(undefined)).toBe('');
    expect(fromIsoDate('')).toBe('');
  });

  /*
   * ⚠️ Deliberate, and inherited from the four screen copies: an unreadable value
   * is shown, not blanked. Blanking it would hide the server's data from the
   * driver and then save the field as empty.
   */
  it('hands back a value it cannot read, rather than emptying the field', () => {
    expect(fromIsoDate('who knows')).toBe('who knows');
  });
});

describe('parseDisplayDate / formatDisplayDate', () => {
  it('parses to local midnight, which is what the pickers compare against', () => {
    const date = parseDisplayDate('15.03.2015');
    expect(date).toEqual(new Date(2015, 2, 15));
    expect(date?.getHours()).toBe(0);
  });

  it('round-trips a Date through the display format', () => {
    expect(formatDisplayDate(new Date(2015, 2, 5))).toBe('05.03.2015');
    expect(parseDisplayDate(formatDisplayDate(new Date(2015, 2, 5)))).toEqual(new Date(2015, 2, 5));
  });

  it('refuses a year before 1900 but has NO ceiling — the bound is the caller’s', () => {
    expect(parseDisplayDate('15.03.1899')).toBeNull();
    // A future date parses fine. Whether a field may hold one is decided by
    // `dateLimits.isDateWithinBound`, per field, not here.
    const future = new Date().getFullYear() + 25;
    expect(parseDisplayDate(`15.03.${future}`)).toEqual(new Date(future, 2, 15));
  });
});
