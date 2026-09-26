/**
 * The two date formats this app deals in, and the conversion between them — T-129.
 *
 * 🔴 WHY THIS EXISTS. A driver types and reads `DD.MM.YYYY`. Postgres `DATEONLY`
 * columns store `YYYY-MM-DD`, and Sequelize converts whatever arrives with
 * `moment(value)` and **no format string**. So the display format on the wire was
 * read as a guess:
 *
 *     15.03.2015  ->  "Invalid date"  ->  the row is rejected, a 500, a generic toast
 *     01.03.2015  ->  2015-01-03      ->  SAVED with the day and month exchanged
 *
 * The second one is the dangerous half: nothing failed, and a licence issued on
 * 1 March was stored as 3 January. Conversion therefore happens HERE, once, at
 * the POST boundary (`utils/registrationPayload.ts`), and the server now refuses
 * anything that is not `YYYY-MM-DD` so this can never be silent again.
 *
 * ⚠️ NOT a place for rules about WHICH dates are allowed. "An issue date is not in
 * the future", "an expiry is not in the past" and the year wheels live in
 * `utils/dateLimits.ts`; whether a field is required lives in the screen. This
 * module only answers "is this a date, and what does it look like in the other
 * format" — four screens each had their own copy of that answer, and the copies
 * had drifted on the year they would accept.
 */

/** `DD.MM.YYYY`, the only shape a driver ever types or sees. */
const DISPLAY = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/** `YYYY-MM-DD`, the only shape the API accepts. Padding is required. */
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A looser ISO, for reading what the server sent (it may include a time part). */
const ISO_PREFIX = /^(\d{4})-(\d{1,2})-(\d{1,2})/;

/** The earliest year any document date could plausibly carry. */
const MIN_YEAR = 1900;

/**
 * Parse a typed `DD.MM.YYYY` into a real Date, or null.
 *
 * Calendar-checked: `31.02.2000` is not a date, and neither is `29.02.2015`.
 * There is deliberately NO upper bound on the year — a caller that needs one
 * applies its own (see `dateLimits.isDateWithinBound`). The four screen copies
 * this replaces disagreed about it: one refused anything after the current year,
 * three allowed ten more.
 */
export const parseDisplayDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;

  const match = DISPLAY.exec(value);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Date's months are 0-based
  const year = parseInt(match[3], 10);

  if (day < 1 || day > 31 || month < 0 || month > 11 || year < MIN_YEAR) {
    return null;
  }

  // Local midnight, like every other date in these screens.
  const date = new Date(year, month, day);

  // 31.02 rolls forward to 03.03 rather than failing, so read it back.
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }

  return date;
};

/** A Date as the driver reads it: `DD.MM.YYYY`. */
export const formatDisplayDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

/**
 * What goes on the wire: `YYYY-MM-DD`, or null when the value is not a date.
 *
 * Null means "do not send this" — never "send it and hope". A field the driver
 * left empty is null too, which is how the payload builders drop it.
 */
export const toIsoDate = (value: string | null | undefined): string | null => {
  if (!value || value.trim() === '') return null;

  // Already on the wire format: hand it back untouched rather than round-tripping.
  if (ISO.test(value)) return value;

  const date = parseDisplayDate(value);
  if (!date) return null;

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * What a form field shows, given what the server sent.
 *
 * ⚠️ An unrecognised string is returned AS IS, not blanked. That is what the four
 * screen copies did, and it matters: a value this function does not understand
 * still reaches the driver's eyes, where it is obvious, instead of vanishing
 * from the form and being saved as empty.
 */
export const fromIsoDate = (value: string | null | undefined): string => {
  if (!value) return '';

  // Already what the field shows.
  if (DISPLAY.test(value)) return value;

  const match = ISO_PREFIX.exec(value);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${day}.${month}.${year}`;
  }

  return value;
};
