/**
 * Document date limits (OR-011 item 1)
 *
 * The document screens do NOT use a native DateTimePicker — they build their own
 * day/month/year lists, which is why `maximumDate` / `minimumDate` appear nowhere
 * in this app. The limits therefore have to be applied to the generated lists.
 *
 * `DriverLicenseScreen` already hand-rolled this for its issue date; this module
 * is that logic extracted so the passport and taxi-licence screens get the same
 * behaviour instead of a third copy that drifts.
 *
 * The rule the owner asked for:
 *   - an ISSUED / VALID-FROM date may never be in the future  -> 'notFuture'
 *   - a VALID-UNTIL / EXPIRY date may never be in the past    -> 'notPast'
 *
 * ⚠️ Everything compares at day granularity. Comparing raw Date objects would
 * make "today" fail its own check, because a date picked at 00:00 is less than
 * `new Date()` at any later time of day.
 */

export type DateBound = 'notFuture' | 'notPast' | 'any';

/** How far back/forward the year wheel reaches when unconstrained on that side. */
const PAST_YEARS = 60;
const FUTURE_YEARS = 20;

const startOfDay = (value: Date): Date => {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/** Does this date satisfy the bound? Use for typed input and on confirm. */
export const isDateWithinBound = (date: Date, bound: DateBound): boolean => {
  if (bound === 'any') return true;
  if (Number.isNaN(date.getTime())) return false;

  const today = startOfDay(new Date());
  const value = startOfDay(date);

  return bound === 'notFuture' ? value <= today : value >= today;
};

/**
 * Days selectable for the month `tempDate` is currently showing.
 * Only the current month is clamped — every other month is whole.
 */
export const selectableDays = (tempDate: Date, bound: DateBound): number[] => {
  const daysInMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
  const now = new Date();

  let first = 1;
  let last = daysInMonth;

  if (isSameMonth(tempDate, now)) {
    if (bound === 'notFuture') last = now.getDate();
    if (bound === 'notPast') first = now.getDate();
  }

  const days: number[] = [];
  for (let day = first; day <= last; day++) {
    days.push(day);
  }
  return days;
};

/**
 * Month values (0-11) selectable for the year `tempDate` is showing. Returns
 * values, not labels, so the caller keeps its own translated month names.
 */
export const selectableMonthValues = (tempDate: Date, bound: DateBound): number[] => {
  const now = new Date();
  const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  if (bound === 'any' || tempDate.getFullYear() !== now.getFullYear()) {
    return all;
  }

  return bound === 'notFuture'
    ? all.filter((month) => month <= now.getMonth())
    : all.filter((month) => month >= now.getMonth());
};

/** Years selectable under the bound. */
export const selectableYears = (bound: DateBound): number[] => {
  const currentYear = new Date().getFullYear();
  const first = bound === 'notPast' ? currentYear : currentYear - PAST_YEARS;
  const last = bound === 'notFuture' ? currentYear : currentYear + FUTURE_YEARS;

  const years: number[] = [];
  for (let year = first; year <= last; year++) {
    years.push(year);
  }
  return years;
};

/**
 * Pull a date back inside the bound. Needed because the wheels are independent:
 * picking a year first can leave the day/month pair outside the allowed range
 * before the user touches them.
 */
export const clampToBound = (date: Date, bound: DateBound): Date => {
  if (bound === 'any' || isDateWithinBound(date, bound)) return date;
  return startOfDay(new Date());
};
