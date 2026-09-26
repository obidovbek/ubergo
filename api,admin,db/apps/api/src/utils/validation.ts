/**
 * Validation Utilities
 */

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  /*
   * T-032 — `+`, `(` and `)` need no escaping INSIDE a character class, and the
   * backslashes were flagged as useless. ⚠️ The matched set is unchanged:
   * digits, whitespace, `-`, `+`, `(`, `)`. `\-` is kept escaped so it cannot
   * be read as a range.
   */
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

/**
 * T-129 — a DATEONLY value on the wire is `YYYY-MM-DD` and nothing else.
 *
 * Sequelize's `DATEONLY` hands whatever string arrives to `moment(value)` with
 * no format, so `15.03.2015` became "Invalid date" (a 500 on the owner's phone)
 * and `01.03.2015` became 2015-01-03 — day and month swapped, saved without a
 * word. `Date.parse`, which the old `date` rule used, reads both the same way,
 * so it caught nothing the database would not. The server cannot know which of
 * the two dates `01.03.2015` meant; refusing beats guessing. The apps convert
 * at the POST boundary (driver app `utils/formDate.ts`).
 *
 * Calendar-checked: `2015-02-30` is not a date. A time part is not accepted —
 * a DATEONLY column has no time, and `…T00:00:00Z` shifts a day in some zones
 * on the way through.
 */
export const isIsoDate = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  // Day 0 of the following month is the last day of this one (months are 0-based here).
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
};

