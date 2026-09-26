/**
 * Validation Middleware with i18n support
 */

import type { Request, Response, NextFunction } from 'express';
import { getLanguageFromHeaders } from '../i18n/config.js';
import { getValidationError, formatValidationErrors, type ValidationErrorDetail } from '../i18n/translator.js';
import type { Language } from '../i18n/types.js';
import { isIsoDate, isValidEmail, isValidPhone } from '../utils/validation.js';
import { readField } from '../utils/readField.js';
import {
  IdentifierError,
  isIdentifierProvided,
  normalisePromoCode,
  normaliseUsername,
  PROMO_CODE_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../utils/identifiers.js';

export class ValidationError extends Error {
  public statusCode: number;
  public errors: ValidationErrorDetail[];

  constructor(errors: ValidationErrorDetail[]) {
    super('Validation Error');
    this.statusCode = 422;
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

/**
 * Validation rule types
 */
type ValidationRule = {
  field: string;
  type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'min' | 'max' | 'date' | 'in' | 'custom';
  params?: Record<string, any>;
  customValidator?: (value: any) => boolean;
  message?: string;
};

/**
 * Validate request data
 */
export const validateRequest = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const language = getLanguageFromHeaders(req.headers['accept-language']);
    const data = { ...req.body, ...req.params, ...req.query };
    const errors: Array<{ field: string; type: string; params?: Record<string, any> }> = [];

    for (const rule of rules) {
      /*
       * T-129: a rule may name a NESTED field (`license.license_number`) —
       * `DriverLicenseScreen` posts its fields one level down, and the old
       * top-level-only read made every licence save fail on a field the body
       * did contain. A plain key still reads the top level exactly as before.
       */
      const value = readField(data, rule.field);

      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            errors.push({ field: rule.field, type: 'required' });
          }
          break;

        /*
         * `String(value)` because `readField` returns `unknown` where the old
         * index read returned `any`. It is deliberately NOT a `typeof` guard:
         * that would let `{ email: 12345 }` through, which the previous code
         * refused. The matched set is unchanged.
         */
        case 'email':
          if (value && !isValidEmail(String(value))) {
            errors.push({ field: rule.field, type: 'email' });
          }
          break;

        case 'phone':
          if (value && !isValidPhone(String(value))) {
            errors.push({ field: rule.field, type: 'phone' });
          }
          break;

        case 'minLength':
          if (value && typeof value === 'string' && value.length < (rule.params?.min || 0)) {
            errors.push({ field: rule.field, type: 'tooShort', params: { min: rule.params?.min } });
          }
          break;

        case 'maxLength':
          if (value && typeof value === 'string' && value.length > (rule.params?.max || Infinity)) {
            errors.push({ field: rule.field, type: 'tooLong', params: { max: rule.params?.max } });
          }
          break;

        case 'min': {
          if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            Number(value) < (rule.params?.min ?? 0)
          ) {
            errors.push({ field: rule.field, type: 'minValue', params: { min: rule.params?.min } });
          }
          break;
        }

        case 'max': {
          if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            Number(value) > (rule.params?.max ?? Infinity)
          ) {
            errors.push({ field: rule.field, type: 'maxValue', params: { max: rule.params?.max } });
          }
          break;
        }

        case 'in':
          if (value && rule.params?.values && !rule.params.values.includes(value)) {
            errors.push({ field: rule.field, type: 'invalidChoice' });
          }
          break;

        /*
         * T-129: `YYYY-MM-DD` and nothing else. This used to be `Date.parse`,
         * which reads `01.03.2015` as January 3rd — exactly how the ORM read it
         * on the way into a DATEONLY column, so a swapped date passed both and
         * was stored. `isIsoDate` also rejects a date the calendar has not got.
         */
        case 'date':
          if (value !== undefined && value !== null && value !== '' && !isIsoDate(value)) {
            errors.push({ field: rule.field, type: 'invalidDate' });
          }
          break;

        case 'custom': {
          const shouldValidate = value !== undefined && value !== null && value !== '';
          if (rule.customValidator && shouldValidate && !rule.customValidator(value)) {
            errors.push({ field: rule.field, type: 'invalid' });
          }
          break;
        }
      }
    }

    if (errors.length > 0) {
      const formattedErrors = formatValidationErrors(errors, language);
      throw new ValidationError(formattedErrors);
    }

    next();
  };
};

/**
 * Driver registration validation rules
 */
export const driverDetailsValidation = validateRequest([
  { field: 'driver_type', type: 'required' },
  { field: 'driver_type', type: 'in', params: { values: ['driver', 'dispatcher', 'special_transport', 'logist'] } },
]);

/*
 * ── T-063: the driver-registration validators, reconciled and mounted ─────
 *
 * These four existed but were mounted NOWHERE, so the whole driver-registration
 * API had zero server-side validation (found by T-061). They were left off on
 * purpose: switching them on as written would have started rejecting payloads
 * the shipped app sends happily.
 *
 * 🔴 **The rule applied here: the server must never refuse what the app
 * accepted.** Its job at this layer is a backstop against a direct API call —
 * not to enforce stricter UX than the build drivers are already using. Every
 * rule below was checked against the real screen before being switched on, and
 * the ones that contradicted it were relaxed, not mounted and hoped for.
 *
 * ✅ Only `required` needed reconciling: `email`, `date`, `minLength` and
 * friends all guard on `if (value && …)`, so they skip an absent field and are
 * safe on optional ones.
 */
export const personalInfoValidation = validateRequest([
  { field: 'first_name', type: 'required' },
  { field: 'last_name', type: 'required' },
  /*
   * 🔴 `father_name` and `birth_date` are NOT required, deliberately.
   * `DriverPersonalInfoScreen` has no rule for either — the app lets a driver
   * submit without them, and requiring them here would have refused people the
   * app told were finished. Making them mandatory is a product decision that
   * has to change the app too; it is not a validation fix.
   */
  { field: 'gender', type: 'required' },
  { field: 'gender', type: 'in', params: { values: ['male', 'female'] } },
  // Format-only: skipped when absent, enforced when sent.
  { field: 'birth_date', type: 'date' },
  { field: 'email', type: 'email' },
]);

export const passportValidation = validateRequest([
  { field: 'id_card_number', type: 'required' },
  { field: 'id_card_number', type: 'minLength', params: { min: 5 } },
  { field: 'pinfl', type: 'required' },
  { field: 'pinfl', type: 'minLength', params: { min: 14 } },
  { field: 'pinfl', type: 'maxLength', params: { max: 14 } },
  // T-129: every DATEONLY column this route writes. Format-only — an absent
  // date is still absent, because the app requires none of the three.
  { field: 'birth_date', type: 'date' },
  { field: 'issue_date', type: 'date' },
  { field: 'expiry_date', type: 'date' },
]);

/*
 * 🔴 T-129: the fields on THIS route are one level down — the screen posts
 * `{ license: { … }, emergencyContacts: [ … ] }`. The rule used to say
 * `license_number`, which the validator looked for at the top level and never
 * found, so **every licence save was refused** with "Guvohnoma raqami majburiy
 * maydon" — while the number was right there under `license`. That is the
 * owner's "Ma'lumotlarni saqlashda xatolik" on the licence page.
 *
 * The apps already expect this shape back: `DriverLicenseScreen` strips the
 * `license.` prefix when it maps `errors[]` onto its form fields, and
 * `getFieldName` falls back to the leaf so the message still names the field.
 */
export const licenseValidation = validateRequest([
  { field: 'license.license_number', type: 'required' },
  /*
   * 🔴 The `minLength: 5` that used to be here is GONE. `DriverLicenseScreen`
   * requires the number but sets no minimum, so a 4-character entry passes the
   * app — and the server would then have refused it, which is the round trip
   * T-061 was raised to stop. If a minimum is wanted it belongs in both places.
   */
  // T-129: the 9 DATEONLY columns on `driver_licenses`. `birth_date` is in the
  // service's accepted shape though no screen sends it — a direct API call can.
  { field: 'license.birth_date', type: 'date' },
  { field: 'license.issue_date', type: 'date' },
  { field: 'license.category_a', type: 'date' },
  { field: 'license.category_b', type: 'date' },
  { field: 'license.category_c', type: 'date' },
  { field: 'license.category_d', type: 'date' },
  { field: 'license.category_be', type: 'date' },
  { field: 'license.category_ce', type: 'date' },
  { field: 'license.category_de', type: 'date' },
]);

export const vehicleValidation = validateRequest([
  { field: 'license_plate', type: 'required' },
  // Matched to `DriverVehicleScreen`, which enforces exactly this minimum.
  // It used to be 5 here, which would have refused a plate the app accepted.
  { field: 'license_plate', type: 'minLength', params: { min: 3 } },
]);

export const taxiLicenseValidation = validateRequest([
  { field: 'license_number', type: 'required' },
  // T-129: the 3 DATEONLY columns on `driver_taxi_licenses`. This screen already
  // sent ISO before the card (its own `convertDateToISO`) — the rule is the
  // backstop for a direct API call, and the reason the app's helper is shared now.
  { field: 'license_issue_date', type: 'date' },
  { field: 'license_sheet_valid_from', type: 'date' },
  { field: 'license_sheet_valid_until', type: 'date' },
]);

/*
 * ── T-091: the user's OWN promo code and username ─────────────────────────
 *
 * 🔴 `own_promo_code` is the code this user HANDS OUT. It is not `promo_code`,
 * which holds the code they typed in to name whoever invited THEM. The two sit
 * side by side on the same model and mean opposite things; T-089 pays referral
 * credit against one of them, so confusing them credits the wrong person.
 *
 * The rules themselves live in `utils/identifiers.ts` because this file cannot
 * be reached from a service and the rules must be executable by `npm test`.
 * What lives HERE is the translation from an `IdentifierError` into the
 * field-named, localised shape the apps already know how to render — the same
 * shape every other validator in this file produces.
 */

/**
 * Which localised template answers each rule the identifiers can break.
 *
 * ⚠️ `wrong_length` is deliberately answered with a RANGE for a username and an
 * EXACT count for a promo code, rather than "too short" / "too long". The util
 * throws one code for both ends, and re-deriving which end was hit would put
 * the length rule in two places — the second copy free to drift from the first.
 */
const identifierMessage = (
  error: IdentifierError
): { type: string; params?: Record<string, unknown> } => {
  switch (error.code) {
    case 'required':
      return { type: 'required' };
    case 'invalid_characters':
      return { type: 'alphanumeric' };
    case 'reserved':
      return { type: 'reserved' };
    case 'wrong_length':
    default:
      return error.field === 'own_promo_code'
        ? { type: 'exactLength', params: { length: PROMO_CODE_LENGTH } }
        : {
            type: 'lengthRange',
            params: { min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH }
          };
  }
};

/**
 * Build the standard 422 out of identifier failures.
 *
 * Exported because the controller raises the same shape for the two rules it
 * alone can check — "somebody already has this" and "you cannot change this" —
 * both of which need a database and therefore cannot live in middleware.
 */
export const identifierValidationError = (
  errors: Array<{ field: string; type: string; params?: Record<string, unknown> }>,
  language: Language
): ValidationError => new ValidationError(formatValidationErrors(errors, language));

/**
 * Validate — and NORMALISE — the two identifiers on the profile PUT.
 *
 * 🔴 This middleware writes the trimmed value back into `req.body`, on purpose.
 * Length is measured after trimming (`'AB1  '` is a 3-character code, not 5), so
 * if the controller stored the raw value it would store something this validator
 * never approved. One place trims; everything downstream reads the result.
 *
 * ⚠️ Absent / null / '' are skipped — see `isIdentifierProvided`. A profile save
 * that does not mention these fields must not touch them.
 */
export const profileIdentifiersValidation = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const language = getLanguageFromHeaders(req.headers['accept-language']);
  const body = (req.body ?? {}) as Record<string, unknown>;
  const failures: IdentifierError[] = [];

  const check = (field: 'own_promo_code' | 'username', normalise: (raw: unknown) => string) => {
    if (!isIdentifierProvided(body[field])) return;
    try {
      body[field] = normalise(body[field]);
    } catch (error) {
      if (!(error instanceof IdentifierError)) throw error;
      failures.push(error);
    }
  };

  check('own_promo_code', normalisePromoCode);
  check('username', normaliseUsername);

  // Both are reported at once. Fixing one field, saving, and being told about
  // the other is the round trip T-061 was raised to stop.
  if (failures.length > 0) {
    throw identifierValidationError(
      failures.map((error) => ({ field: error.field, ...identifierMessage(error) })),
      language
    );
  }

  next();
};

/**
 * Country validation rules
 */
const COUNTRY_PATTERNS = ['uz', 'ru', 'generic'];

export const validateCountryCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'code', type: 'required' },
  { field: 'local_length', type: 'required' },
  { field: 'local_length', type: 'min', params: { min: 1 } },
  { field: 'pattern', type: 'required' },
  { field: 'pattern', type: 'in', params: { values: COUNTRY_PATTERNS } },
]);

export const validateCountryUpdate = validateRequest([
  { field: 'local_length', type: 'min', params: { min: 1 } },
  { field: 'pattern', type: 'in', params: { values: COUNTRY_PATTERNS } },
]);

/**
 * Geo hierarchy validation helpers
 */
const isCoordinate = (value: unknown, min: number, max: number): boolean => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return false;
  }
  return num >= min && num <= max;
};

export const validateGeoCountryCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoCountryUpdate = validateRequest([
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoProvinceCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'country_id', type: 'required' },
  { field: 'country_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoProvinceUpdate = validateRequest([
  { field: 'country_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoCityDistrictCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'province_id', type: 'required' },
  { field: 'province_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoCityDistrictUpdate = validateRequest([
  { field: 'province_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoAdministrativeAreaCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'city_district_id', type: 'required' },
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoAdministrativeAreaUpdate = validateRequest([
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoSettlementCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'city_district_id', type: 'required' },
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoSettlementUpdate = validateRequest([
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoNeighborhoodCreate = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'city_district_id', type: 'required' },
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

export const validateGeoNeighborhoodUpdate = validateRequest([
  { field: 'city_district_id', type: 'custom', customValidator: (value) => !Number.isNaN(Number(value)) },
  { field: 'latitude', type: 'custom', customValidator: (value) => isCoordinate(value, -90, 90) },
  { field: 'latitude', type: 'min', params: { min: -90 } },
  { field: 'latitude', type: 'max', params: { max: 90 } },
  { field: 'longitude', type: 'custom', customValidator: (value) => isCoordinate(value, -180, 180) },
  { field: 'longitude', type: 'min', params: { min: -180 } },
  { field: 'longitude', type: 'max', params: { max: 180 } },
]);

/**
 * Auth validation (legacy validators for backward compatibility)
 */
export const validateRegister = validateRequest([
  { field: 'name', type: 'required' },
  { field: 'name', type: 'minLength', params: { min: 2 } },
  { field: 'email', type: 'required' },
  { field: 'email', type: 'email' },
  { field: 'phone', type: 'required' },
  { field: 'phone', type: 'phone' },
  { field: 'password', type: 'required' },
  { field: 'password', type: 'minLength', params: { min: 8 } },
]);

export const validateLogin = validateRequest([
  { field: 'email', type: 'required' },
  { field: 'email', type: 'email' },
  { field: 'password', type: 'required' },
]);

/**
 * Admin auth validation
 */
export const validateAdminLogin = validateRequest([
  { field: 'email', type: 'required' },
  { field: 'email', type: 'email' },
  { field: 'password', type: 'required' },
]);

export const validateAdminRegister = validateRequest([
  { field: 'email', type: 'required' },
  { field: 'email', type: 'email' },
  { field: 'password', type: 'required' },
  { field: 'password', type: 'minLength', params: { min: 8 } },
  { field: 'full_name', type: 'required' },
  { field: 'full_name', type: 'minLength', params: { min: 2 } },
  { field: 'role_slugs', type: 'required' },
]);

/**
 * Pagination validation
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;

  if (page < 1) {
    const language = getLanguageFromHeaders(req.headers['accept-language']);
    throw new ValidationError([{
      field: 'page',
      message: 'Page must be greater than 0',
      type: 'min',
    }]);
  }

  if (limit < 1 || limit > 100) {
    const language = getLanguageFromHeaders(req.headers['accept-language']);
    throw new ValidationError([{
      field: 'limit',
      message: 'Limit must be between 1 and 100',
      type: 'min',
    }]);
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();

  next();
};
