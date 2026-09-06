/**
 * Offer-wizard validation — the pure rules, lifted out of the screen.
 * T-101 step 16a (`docs/PLAN-T101-step16.md`).
 *
 * 🔴 WHY THIS EXISTS, AND WHY IT LANDS BEFORE ANY VISUAL WORK.
 *
 * `OfferWizardScreen` submits with `handleSave`, which called **`validateStep(currentStep)`** —
 * it validated **only the step the driver happened to be on**. In the 4-step wizard that is
 * safe by accident: you cannot reach step 4 without passing 1, 2 and 3 on the way, so by the
 * time the submit button exists every rule has already run.
 *
 * **Step 16d collapses the wizard into the artboard's single scrolling form, and that
 * accident disappears.** With no pagination there is no "on the way", so a submit that checks
 * one section would happily save an offer with no destination, a departure in the past, or a
 * price of zero. Nothing would error — the API takes what it is given.
 *
 * So `validateAll()` exists FIRST, while the wizard is still in place and still working. This
 * module changes no behaviour on its own: `validateStep` still validates one step for
 * Back/Next, and `handleSave` now calls `validateAll`, which is a superset of what it checked
 * before. *The safety net goes up before the floor comes out.*
 *
 * ⚠️ EVERYTHING HERE MUST STAY PURE — no React, no react-native, no API client, no `t()`.
 * The messages are returned as translation KEYS and the screen translates them. That is what
 * lets `scripts/check-offer-validation.mjs` bundle and execute these rules with esbuild and
 * assert on them, in an app that has no test runner (adding one would be a new dependency —
 * rule 4). *A rule that cannot be executed in isolation cannot be proven able to fail.*
 */

/** The geo shape this module needs — structurally compatible with `api/driver.ts`'s. */
export interface GeoLike {
  name: string;
}

/**
 * The subset of the wizard's form this module reads.
 *
 * ⚠️ Deliberately NOT `CreateOfferData`: these rules run against a form that is still being
 * filled in, so every field is optional here even where the API requires it. That is the
 * whole point — the rules are what turn a partial form into a valid payload.
 */
export interface OfferFormValues {
  from_text?: string;
  to_text?: string;
  start_at?: string;
  vehicle_id?: string;
  seats_total?: number;
  price_per_seat?: number;
}

/** The geo selections that can stand in for typed text. */
export interface OfferGeoSelection {
  country: GeoLike | null;
  province: GeoLike | null;
  city: GeoLike | null;
  /** The multi-select variant; either this or `city` may carry the answer. */
  cities: GeoLike[];
}

export interface OfferValidationInput {
  form: OfferFormValues;
  from: OfferGeoSelection;
  to: OfferGeoSelection;
  /** Injected so the rules stay pure and the clock is testable. Defaults to now. */
  now?: Date;
}

/** field -> translation KEY (not a message: this module never translates). */
export type OfferErrors = Record<string, string>;

export const ERROR_KEYS = {
  missing: 'offerWizard.errorMissingFields',
  minAdvance: 'offerWizard.errorMinAdvance',
  invalidSeats: 'offerWizard.errorInvalidSeats',
  invalidPrice: 'offerWizard.errorInvalidPrice',
} as const;

/** Business rules, named rather than inlined as magic numbers. */
export const RULES = {
  /** An offer must depart at least this far in the future. */
  minAdvanceMs: 30 * 60 * 1000,
  minSeats: 1,
  maxSeats: 8,
  minPricePerSeat: 5000,
} as const;

/**
 * `city, province, country` — the label the screen shows and sends as `from_text`/`to_text`.
 *
 * ⚠️ Moved verbatim from inside the component (it was defined at line ~946 but first CALLED at
 * line ~631; legal only because both live in a closure evaluated later). Order and separator
 * are unchanged — this string is persisted on the offer, so changing it would silently alter
 * saved data.
 */
export const buildLocationText = (
  country: GeoLike | null,
  province: GeoLike | null,
  city: GeoLike | null,
): string => {
  const parts: string[] = [];
  if (city) parts.push(city.name);
  if (province) parts.push(province.name);
  if (country) parts.push(country.name);
  return parts.join(', ') || '';
};

/**
 * The location a section resolves to, from any of its three sources.
 *
 * The precedence is the screen's own and is preserved exactly: a single picked `city` wins,
 * then a multi-select, then whatever was typed into the text field.
 */
export const resolveLocationText = (
  geo: OfferGeoSelection,
  typed: string | undefined,
): string => {
  if (geo.city) return buildLocationText(geo.country, geo.province, geo.city);
  if (geo.cities.length > 0) return geo.cities.map((c) => c.name).join(', ');
  return typed?.trim() || '';
};

/** Step 1 — where the ride goes. */
export const validateRoute = (input: OfferValidationInput): OfferErrors => {
  const errors: OfferErrors = {};
  if (!resolveLocationText(input.from, input.form.from_text)) {
    errors.from_text = ERROR_KEYS.missing;
  }
  if (!resolveLocationText(input.to, input.form.to_text)) {
    errors.to_text = ERROR_KEYS.missing;
  }
  return errors;
};

/** Step 2 — when it leaves. */
export const validateSchedule = (input: OfferValidationInput): OfferErrors => {
  const errors: OfferErrors = {};
  const { start_at } = input.form;

  if (!start_at) {
    errors.start_at = ERROR_KEYS.missing;
    return errors;
  }

  const startDate = new Date(start_at);
  // ⚠️ An unparseable date is NaN, and every comparison against NaN is false — so a bad
  // string would slip through a naive `<` check. The original code had this hole; it is
  // closed here rather than carried forward.
  if (Number.isNaN(startDate.getTime())) {
    errors.start_at = ERROR_KEYS.missing;
    return errors;
  }

  const now = input.now ?? new Date();
  if (startDate.getTime() < now.getTime() + RULES.minAdvanceMs) {
    errors.start_at = ERROR_KEYS.minAdvance;
  }
  return errors;
};

/** Step 3 — the car, the seats and the price. */
export const validateVehicleAndPrice = (input: OfferValidationInput): OfferErrors => {
  const errors: OfferErrors = {};
  const { vehicle_id, seats_total, price_per_seat } = input.form;

  if (!vehicle_id) {
    errors.vehicle_id = ERROR_KEYS.missing;
  }
  if (!seats_total || seats_total < RULES.minSeats || seats_total > RULES.maxSeats) {
    errors.seats_total = ERROR_KEYS.invalidSeats;
  }
  if (!price_per_seat || price_per_seat < RULES.minPricePerSeat) {
    errors.price_per_seat = ERROR_KEYS.invalidPrice;
  }
  return errors;
};

/**
 * The wizard's four steps, in order. Step 4 is the review page and has no rules of its own —
 * it is the page the submit button lives on.
 *
 * ⚠️ Kept exported so `validateStepNumber` and `validateAll` cannot drift apart: `validateAll`
 * is literally every validator in this list, which is what makes it a superset by construction
 * rather than by someone remembering to add a case.
 */
export const SECTION_VALIDATORS: ((input: OfferValidationInput) => OfferErrors)[] = [
  validateRoute,
  validateSchedule,
  validateVehicleAndPrice,
];

/** One step, for Back/Next while the wizard still paginates. `step` is 1-based. */
export const validateStepNumber = (
  step: number,
  input: OfferValidationInput,
): OfferErrors => {
  const validator = SECTION_VALIDATORS[step - 1];
  return validator ? validator(input) : {};
};

/**
 * 🛑 EVERY rule, for submit. This is what `handleSave` must call.
 *
 * Earlier sections win a field collision, so the driver is sent to the first thing that is
 * wrong rather than the last — though no two validators currently write the same key.
 */
export const validateAll = (input: OfferValidationInput): OfferErrors => {
  const errors: OfferErrors = {};
  for (const validate of SECTION_VALIDATORS) {
    for (const [field, key] of Object.entries(validate(input))) {
      if (!(field in errors)) errors[field] = key;
    }
  }
  return errors;
};

export const isValid = (errors: OfferErrors): boolean => Object.keys(errors).length === 0;

/**
 * Normalise a money/count field on blur — T-101 step 16b.
 *
 * 🔴 Lifted out of the screen's `numberField` helper for one reason: it encodes T-078's
 * hardest-won rule, and inside a JSX closure that rule could not be executed or proven.
 *
 *   `0` IS A REAL ANSWER for some fields and NOT A PRICE for others.
 *
 * "Joyidan olish — 0 so'm" (free door pickup) and "bepul kutish — 0 minut" are answers the
 * driver deliberately typed; storing them as `undefined` would blank them on the next save.
 * A **salon price** or a **waiting rate** of 0, by contrast, is not a free salon — it is a
 * driver who has not filled the field in, and saving it as 0 would advertise a free ride.
 *
 * That is one line of difference and two opposite meanings, which is exactly the kind of rule
 * that rots silently. `allowZero` names it; `check-offer-validation.mjs` asserts both halves.
 *
 * @returns the value to store, or `undefined` for "not set".
 */
export const normalizeAmount = (
  value: number | undefined | null,
  opts?: { allowZero?: boolean },
): number | undefined => {
  if (value === undefined || value === null || Number.isNaN(value)) return undefined;

  // 🔴 ONE DELIBERATE DEPARTURE FROM THE CODE THIS REPLACES.
  // The original clamped a negative to `0` and returned it immediately — so a negative
  // `price_back_salon` was stored as 0, which is the very thing the next line exists to
  // prevent: an offer advertising a FREE back salon. It cannot be reached by typing (the
  // input strips everything but digits), only by a negative arriving from the API, at which
  // point it is corrupt data — and "not set" is the safe reading of corrupt data, never
  // "free". Where 0 is a legitimate answer the old clamp is kept, because there it says
  // the same thing the driver would have.
  if (value < 0) return opts?.allowZero ? 0 : undefined;

  if (value === 0 && !opts?.allowZero) return undefined;
  return value;
};

/**
 * Parse what the driver typed into a numeric field: digits only, grouped or not.
 *
 * ⚠️ Returns `undefined` for an empty field rather than `0`. Those are different states and
 * the wizard has always relied on the difference — see `normalizeAmount` above.
 */
export const parseAmount = (text: string): number | undefined => {
  const digits = text.replace(/[^\d]/g, '');
  if (digits === '') return undefined;
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? undefined : n;
};

/** Group a number for display: `120000` -> `120 000`. Empty for "not set". */
export const formatAmount = (value?: number | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return Math.floor(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/** What a geo endpoint (`from` / `to` / a stop) resolves to once its cities change. */
export interface GeoPoint {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface EndpointSelection {
  /** The single city, when the multi-select has collapsed to exactly one. */
  city: GeoPoint | null;
  text: string;
  lat: number | undefined;
  lng: number | undefined;
}

/**
 * What `from_*` / `to_*` become after the driver adds or removes a city — T-101 step 16b.
 *
 * 🔴 This was written TWICE in the screen, once per endpoint, byte-identical after swapping
 * `from` for `to` (measured with a normalising diff, not eyeballed). Two copies of a rule
 * about which fields survive a removal is how the "saves but never loads" bug at line 296
 * gets in — fix one copy, ship the other.
 *
 * The three cases are the screen's own and are preserved exactly:
 *   0 cities  -> everything cleared, INCLUDING lat/lng
 *   1 city    -> collapses back to the single-city form, with that city's coordinates
 *   2+ cities -> a comma list, carrying the FIRST city's coordinates
 *
 * ⚠️ The 2+ case is the app's existing convention, taken from `confirmMultipleFromCities`
 * ("use first city as primary from location") — NOT invented here. The remove path used to
 * leave lat/lng untouched instead, so removing a city could leave the offer pointing at a
 * city that was no longer in its own list. Deriving both paths from this one function is
 * what stops them disagreeing again.
 */
export const resolveEndpointSelection = (
  cities: GeoPoint[],
  country: GeoLike | null,
  province: GeoLike | null,
): EndpointSelection => {
  if (cities.length === 0) {
    return { city: null, text: '', lat: undefined, lng: undefined };
  }
  if (cities.length === 1) {
    const only = cities[0];
    return {
      city: only,
      text: buildLocationText(country, province, only),
      lat: only.latitude ?? undefined,
      lng: only.longitude ?? undefined,
    };
  }
  const [first] = cities;
  return {
    city: null,
    text: cities.map((c) => c.name).join(', '),
    lat: first.latitude ?? undefined,
    lng: first.longitude ?? undefined,
  };
};

/**
 * Snap the seat count back into range when the field loses focus — step 16b.
 *
 * ⚠️ Empty, zero and NaN all become `minSeats`, NOT `undefined`. A car with no seats is
 * not an offer, so the field refuses to stay blank; every other numeric field on this
 * form does the opposite, which is why this one is not a `normalizeAmount` call.
 *
 * The bounds are `RULES`, the same pair `validateVehicleAndPrice` rejects on — so the
 * control cannot leave a value that its own validator would then refuse.
 */
export const clampSeats = (seats: number | undefined | null): number => {
  if (seats === undefined || seats === null || Number.isNaN(seats) || seats < RULES.minSeats) {
    return RULES.minSeats;
  }
  return seats > RULES.maxSeats ? RULES.maxSeats : seats;
};
